import {
  aws_lambda as lambda,
  aws_apigateway as apiGateway,
  aws_dynamodb as dynamodb,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { exampleLambdaDir } from "./exampleLambda";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TenantIsolationWalkthroughStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ddb = new dynamodb.Table(this, "ExampleTable", {
      tableName: "example",
      partitionKey: {
        name: "partKey1",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey1",
        type: AttributeType.STRING,
      },
    });
    ddb.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: {
        name: "partKey2",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey2",
        type: AttributeType.STRING,
      },
    });

    const exampleLambda = new lambda.Function(this, "ExampleLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(exampleLambdaDir),
      handler: "index.handler",
      environment: {
        DDB_TABLE_NAME: ddb.tableName,
      },
    });
    ddb.grantFullAccess(exampleLambda);

    const api = new apiGateway.RestApi(this, "ExampleAPI");

    api.root.addMethod("POST", new apiGateway.LambdaIntegration(exampleLambda));
  }
}
