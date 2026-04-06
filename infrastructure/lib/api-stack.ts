import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // API Gateway
    this.api = new apigateway.RestApi(this, 'UrlShortenerApi', {
      restApiName: 'URL Shortener API',
      description: 'API for URL shortener service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Variables de entorno compartidas por todas las Lambdas
    const lambdaEnv = {
      TABLE_NAME: props.table.tableName,
        BASE_URL: `https://${this.api.restApiId}.execute-api.${this.region}.amazonaws.com/prod`,
    };

    // Lambda de redirección — optimizada para velocidad
    const redirectFn = new lambda.Function(this, 'RedirectFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'redirect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/handlers')),
      environment: lambdaEnv,
      memorySize: 256,   // Más memoria = más CPU = más rápido
      timeout: cdk.Duration.seconds(5),
      description: 'Handles URL redirects - must be fast',
    });

    // Lambda CRUD — para el dashboard
    const crudFn = new lambda.Function(this, 'CrudFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'crud.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist/handlers')),
      environment: lambdaEnv,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      description: 'Handles CRUD operations for URL management',
    });

    // Permisos: las Lambdas pueden leer/escribir en DynamoDB
    props.table.grantReadData(redirectFn);
    props.table.grantReadWriteData(crudFn);

    // GET /{shortId} — Redirección pública
    const shortIdResource = this.api.root.addResource('{shortId}');
    shortIdResource.addMethod('GET', new apigateway.LambdaIntegration(redirectFn));

    // /api/urls — CRUD (en Fase 2 le agregas el Cognito Authorizer)
    const apiResource = this.api.root.addResource('api');
    const urlsResource = apiResource.addResource('urls');
    urlsResource.addMethod('POST', new apigateway.LambdaIntegration(crudFn));
    urlsResource.addMethod('GET', new apigateway.LambdaIntegration(crudFn));

    const urlIdResource = urlsResource.addResource('{id}');
    urlIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(crudFn));

    // Output: la URL del API Gateway
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'URL del API Gateway',
    });
  }
}