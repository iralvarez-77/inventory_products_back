/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
//import { randomUUID } from "crypto";
import ProductService from "../../src/shared/product_service";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const productService = new ProductService(PRODUCTS_TABLE);

export const getProductFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);

    const { nombre_comercio, codigo_barras } = event.pathParameters || {};
  
  try {
    if (!nombre_comercio || !codigo_barras) 
      return response(400, { message: "Faltan parámetros requeridos en la ruta" });

    const product = await productService.getProductByPkSk(nombre_comercio, codigo_barras);

    if (!product) {
      return response(404, { message: "Producto no encontrado" });
    }

    return response(200, { message: "Producto encontrado éxitosamente", producto: product });
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
