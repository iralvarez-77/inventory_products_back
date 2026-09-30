/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductService } from "../../src/shared/product_service";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const productService = new ProductService(PRODUCTS_TABLE);

export const listProductsCriticsFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);
  try {
    const products = await productService.listProductsCritics();
    return response(200, { message: "Productos críticos obtenidos con éxito", productos: products });
    
  } catch (error) {
    console.error("Error en listProductsCriticsFunction", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return response(500, {
      message: "Error en listProductsCriticsFunction",
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
