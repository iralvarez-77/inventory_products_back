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

let tasa_cacheada: number | null = null;
let ultima_actualizacion = 0;
const CACHE_TTL = 60000; 

export const getProductsFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);
  const ahora = Date.now();
  try {
    const comercio = event.queryStringParameters?.nombre_comercio;
    if (!comercio) 
      return response(400, { 
        message: "El parámetro 'nombre_comercio' es obligatorio en los query parameters de la URL." 
      });
    const nombre_comercio = comercio.toLowerCase().replace(/\s+/g, '_')
    
    if (!tasa_cacheada || (ahora - ultima_actualizacion > CACHE_TTL)) {
      const config = await configService.getConfig();
        if (!config) 
          return response(500, { message: "No se pudo recuperar la tasa de cambio" });

      const { tasa_bcv } = config;
      tasa_cacheada = tasa_bcv;
      ultima_actualizacion = ahora;
    }

    const tasa_VES = tasa_cacheada;

    const products = await productService.getProducts(nombre_comercio);

    const products_prices_in_ves = products.map(product => ({
      ...product,
      price_VES: Math.round(product.precio_venta_usd * tasa_VES! * 100) / 100
    }));
    return response( 200, { message: "Productos obtenidos con éxito", productos: products_prices_in_ves, tasa: tasa_VES });

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
