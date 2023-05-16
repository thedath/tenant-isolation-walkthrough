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

export const exampleLambdaDir = __dirname;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  // test

  return {
    statusCode: 403,
    body: JSON.stringify({ error: "Hello world!" }),
  };
};
