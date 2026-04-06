import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  // Tabla expuesta públicamente para que ApiStack pueda usarla
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Single-table design: una sola tabla para URLs, clicks y relaciones
    this.table = new dynamodb.Table(this, 'UrlTable', {
      tableName: 'url-shortener-table',
      
      // PK y SK compuestos permiten almacenar múltiples entidades
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },

      // On-demand
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      // TTL: DynamoDB borra automáticamente items expirados.
      timeToLiveAttribute: 'expiresAt',

      // RemovalPolicy.DESTROY permite que `cdk destroy` borre la tabla. (Retain en prod)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI para buscar URLs por usuario, ordenadas por fecha de creación
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Output: muestra el nombre de la tabla después del deploy
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
    });
  }
}