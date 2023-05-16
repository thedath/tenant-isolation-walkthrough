import {
  aws_lambda as lambda,
  aws_apigateway as apiGateway,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  Stack,
  StackProps,
  CfnOutput,
} from "aws-cdk-lib";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { exampleLambdaDir } from "./lambda/exampleLambda";
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
    // ddb.grantFullAccess(exampleLambda);

    new CfnOutput(this, "ARN", { value: exampleLambda.functionArn });
    new CfnOutput(this, "ROLE_ARN", { value: exampleLambda.role?.roleArn! });

    const lambdaRole = new iam.Role(this, "ExampleLambdaRole", {
      assumedBy: new iam.ArnPrincipal(exampleLambda.role?.roleArn!),

      /**
       * 'assumedBy' param will add 'sts:AssumeRole' as the action in the IAM trust policy.
       * {
          "Version": "2012-10-17",
          "Statement": [
                  {
                      "Effect": "Allow",
                      "Principal": {
                          "AWS": "arn:aws:iam::318250836602:role/TenantIsolationWalkthroug-ExampleLambdaServiceRole-79GG8DK25V0U"
                      },
                      "Action": "sts:AssumeRole"
                  }
              ]
          }
       */
    });
    // ddb.grantFullAccess(lambdaRole);
    exampleLambda.addEnvironment("ASSUMED_ROLE_ARN", lambdaRole.roleArn);
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [ddb.tableArn],
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:PutItem"],
        // conditions: {
        //   "ForAllValues:StringLike": {
        //     "dynamodb:LeadingKeys": ["aws:RequestTag/bbb"],
        //   },
        // },
      })
    );

    const api = new apiGateway.RestApi(this, "ExampleAPI");

    api.root.addMethod("POST", new apiGateway.LambdaIntegration(exampleLambda));
  }
}
