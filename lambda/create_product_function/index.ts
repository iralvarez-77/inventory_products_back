/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { randomUUID } from "crypto";
import ProductService from "../../src/shared/product_service";

const TABLE_NAME = process.env.PRODUCTS_TABLE ?? "";
const productService = ProductService.getInstance(TABLE_NAME);

export interface Product {
  id: string;                  // Partition Key
  nombre: string;
  costo_usd: number;
  margen_ganancia: number;
  precio_venta_usd: number;
  stock: number;
  stock_minimo: number;
  codigo_barras?: string;      // Opcional
  ultima_actualizacion: string; // ISO String
}

export const createProduct = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);
  const name = event.queryStringParameters?.name;

  try {
    // if (!name)
    //   return response(400, { message: "La propiedad NAME es requerido" });

    // const productItem: Product = {
    //   id: randomUUID(),
    //   nombre: "Harina Pan 1kg",
    //   costo_usd: 1.10,
    //   margen_ganancia: 30.0,
    //   precio_venta_usd: 1.43,
    //   stock: 45,
    //   stock_minimo: 10,
    //   codigo_barras: "7591031000132",      // Opcional
    //   ultima_actualizacion: new Date().toISOString(), // ISO String
    // };

    //await productService.putItem<Product>(productItem);

    //return response(201, { message: "Item guardado éxitosamente", productItem });
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
