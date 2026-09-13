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
  precio_venta_ves: number;
  stock: number;
  stock_minimo: number;
  codigo_barras?: string;      // Opcional
  fecha_creacion: string;      // ISO String
  ultima_actualizacion: string; // ISO String
}


export const createProduct = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);

  const body = (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) as Product;
  
  try {
    if (!body)
      return response(400, { message: "El cuerpo de la petición (body) es requerido" });

    const { nombre, costo_usd, margen_ganancia, stock, stock_minimo} = body;
    
    const precio_venta_usd = costo_usd * (1 + margen_ganancia / 100);
    //Consultar tabla configuration en dynamo para obtener la tasa_bcv_dia 
    const precio_venta_ves_raw = precio_venta_usd * 832.49; // tasa_bcv_día 
    const precio_venta_ves = Math.round(precio_venta_ves_raw * 100) / 100;

    const productItem: Product = {
      id: randomUUID(),
      nombre,
      costo_usd,
      margen_ganancia,
      precio_venta_usd,
      precio_venta_ves,
      stock,
      stock_minimo,
      codigo_barras: "7591031000132",      // Opcional
      fecha_creacion: new Date().toISOString(), // ISO String
      ultima_actualizacion: new Date().toISOString(), // ISO String
    };
    await productService.createProduct<Product>(productItem);

    return response(201, { message: "Item guardado éxitosamente", productItem });
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
