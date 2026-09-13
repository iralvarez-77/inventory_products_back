/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { randomUUID } from "crypto";
import ProductService, { Product } from "../../src/shared/product_service";
import { ConfigurationService } from "../../src/shared/configuration_service";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const CONFIG_TABLE = process.env.CONFIG_TABLE ?? "";

const productService = new ProductService(PRODUCTS_TABLE);
const configService = new ConfigurationService(CONFIG_TABLE);



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

    const { nombre, costo_usd, margen_ganancia, stock, stock_minimo} = body;
    
    const precio_venta_usd = costo_usd * (1 + margen_ganancia / 100);

    const config = await configService.getConfig();
    if (!config) 
      return response(500, { message: "No se pudo recuperar la tasa de cambio" });
    console.log('👀 👉🏽 ~  config:', config)
    const { tasa_bcv } = config;
    
    const precio_venta_ves_raw = precio_venta_usd * tasa_bcv; // tasa_bcv_día 
    const precio_venta_ves = Math.round(precio_venta_ves_raw * 100) / 100; // Redondear a 2 decimales

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
