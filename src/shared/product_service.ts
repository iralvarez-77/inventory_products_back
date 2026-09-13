/** @format */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";

export type PutOptions = {
  conditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
};

export class ProductService {
  private static instance: ProductService | null = null;
  private docClient: DynamoDBDocumentClient;

  private constructor(private tableName: string) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
  }

  static getInstance(tableName: string): ProductService {
    if (!ProductService.instance) {
      if (!tableName) {
        throw new Error("tableName is required to initialize ProductService");
      }
      ProductService.instance = new ProductService(tableName);
    }
    return ProductService.instance;
  }

  async putItem<T extends Record<string, any>>(item: T, opts?: PutOptions): Promise<void> {
    
    const input: PutCommandInput = {
      TableName: this.tableName,
      Item: item,
    };

    if (opts?.conditionExpression) {
      input.ConditionExpression = opts.conditionExpression;
    }
    if (opts?.expressionAttributeNames) {
      input.ExpressionAttributeNames = opts.expressionAttributeNames;
    }

    await this.docClient.send(new PutCommand(input));
  }
}

export default ProductService;
