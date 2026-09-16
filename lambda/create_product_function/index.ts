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

export const createProductFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);

  const body = (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) as Product;
  
  try {
    if (!body)
      return response(400, { message: "El cuerpo de la petición (body) es requerido" });

    const { nombre, costo_usd, margen_ganancia, stock, stock_minimo, nombre_comercio, codigo_barras} = body;
    
    //const precio_venta_usd = costo_usd * (1 + margen_ganancia / 100);
    const precio_venta_usd = Math.round((costo_usd * (1 + margen_ganancia / 100)) * 100) / 100;


    const productItem: Product = {
      PK: `TENANT#${nombre_comercio.toLowerCase().replace(/\s+/g, '_')}`,
      SK: `PROD#${codigo_barras}`,
      nombre,
      nombre_comercio,
      costo_usd,
      margen_ganancia,
      precio_venta_usd,
      stock,
      stock_minimo,
      codigo_barras, 
      fecha_creacion: new Date().toISOString(), // ISO String
      ultima_actualizacion: new Date().toISOString(), // ISO String
    };

    await productService.createProduct(productItem);

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
