import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

// El stack de storage debe crearse primero porque API depende de él
const storageStack = new StorageStack(app, 'UrlShortener-Storage', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

const apiStack = new ApiStack(app, 'UrlShortener-Api', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  table: storageStack.table,
});

// Avisa aCDK que Api depende de Storage
apiStack.addDependency(storageStack);