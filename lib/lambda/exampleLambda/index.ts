import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";

import {
  DynamoDBDocumentClient,
  PutCommand,
  TranslateConfig,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";

export const exampleLambdaDir = __dirname;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    const tableName = process.env.DDB_TABLE_NAME;
    const assumedRoleARN = process.env.ASSUMED_ROLE_ARN;

    const sts = new STSClient({});
    const session = await sts.send(
      new AssumeRoleCommand({
        RoleArn: assumedRoleARN,
        RoleSessionName: "TempSessionName",
      })
    );

    const { item } = JSON.parse(event.body!);

    const translateConfig: TranslateConfig = {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: false,
        convertClassInstanceToMap: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    };

    const dynamoDb = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        credentials: {
          accessKeyId: session.Credentials?.AccessKeyId!,
          secretAccessKey: session.Credentials?.SecretAccessKey!,
          sessionToken: session.Credentials?.SessionToken,
        },
      }),
      translateConfig
    );

    const result = await dynamoDb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: `attribute_not_exists(partKey1)`,
      })
    );

    return { statusCode: 200, body: JSON.stringify({ ...result }) };
  } catch (error) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
