/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductService } from "../../src/shared/product_service";
import { ConfigurationService } from "../../src/shared/configuration_service";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";
import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { response } from "../../src/shared/response_helper";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const CONFIG_TABLE = process.env.CONFIG_TABLE ?? "";

const productService = new ProductService(PRODUCTS_TABLE);
const configService = new ConfigurationService(CONFIG_TABLE);

const logger = new Logger({ serviceName: "InventoryService" });
const tracer = new Tracer({ serviceName: "InventoryService" });
const metrics = new Metrics({ serviceName: "InventoryService", namespace: "InventoryApp" });

let tasa_cacheada: number | null = null;
let ultima_actualizacion = 0;
const CACHE_TTL = 60000; 

const baseHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const comercio = event.queryStringParameters?.nombre_comercio;
  logger.info("NombreComercio", { nombre_comercio: comercio});

  if (!comercio) 
    return response(400, { 
      message: "El parámetro es obligatorio" 
    });
  
  const nombre_comercio = comercio.toLowerCase().replace(/\s+/g, '_')
  const ahora = Date.now();
  try {
    
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
    logger.info("Productos obtenidos con éxito");


    const products_prices_in_ves = products.map(product => ({
      ...product,
      precio_venta_VES: Math.round(product.precio_venta_usd * tasa_VES * 100) / 100
    }));
    return response( 200, { message: "Productos obtenidos con éxito", productos: products_prices_in_ves, tasa: tasa_VES });

  } catch (error) {
    logger.error("Error en getProductsFunction", error as Error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return response(500, {
      message: "Error en getProductsFunction",
      error: errorMessage,
    });
  }
};

export const getProductsFunction = middy(baseHandler)
  .use(injectLambdaContext(logger, { logEvent: false })) 
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));


