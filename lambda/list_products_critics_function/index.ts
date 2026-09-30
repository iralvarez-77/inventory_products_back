/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductService } from "../../src/shared/product_service";
import { ConfigurationService } from "../../src/shared/configuration_service";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const CONFIG_TABLE = process.env.CONFIG_TABLE ?? "";

const productService = new ProductService(PRODUCTS_TABLE);
const configService = new ConfigurationService(CONFIG_TABLE);

export const getProductsFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);
  try {


    return "hello world" as unknown as APIGatewayProxyResult;
  } catch (error) {
    console.error("Error al guardar en DynamoDB:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return response(500, {
      message: "Error al guardar en DynamoDB",
      error: errorMessage,
    });
  }
};

const response = (statusCode: number, body: object): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};
