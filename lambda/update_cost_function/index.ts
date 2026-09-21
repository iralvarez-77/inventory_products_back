/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
//import { randomUUID } from "crypto";
import ProductService, { Product } from "../../src/shared/product_service";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const productService = new ProductService(PRODUCTS_TABLE);

export const updateCostFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);

  const body = (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) as Product;
  
  try {
    if (!body)
      return response(400, { message: "El cuerpo de la petición (body) es requerido" });

    const { nombre_comercio, costo_usd: nuevo_costo_usd, codigo_barras} = body
    const product = await productService.getProductByPkSk(nombre_comercio, codigo_barras);
    if (!product) {
      return response(404, { message: "Producto no encontrado" });
    }
    const { margen_ganancia } = product;
    const nuevo_precio_venta_usd = Math.round((nuevo_costo_usd * (1 + margen_ganancia / 100)) * 100) / 100;
    const updatedProduct = await productService.updateProductcost(nombre_comercio, codigo_barras, nuevo_costo_usd, nuevo_precio_venta_usd);

    return response(200, { message: "Item actualizado éxitosamente", product: updatedProduct });
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
