/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
//import { randomUUID } from "crypto";
import ProductService from "../../src/shared/product_service";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";
import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { response } from "../../src/shared/response_helper";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const productService = new ProductService(PRODUCTS_TABLE);

const logger = new Logger({ serviceName: "InventoryService" });
const tracer = new Tracer({ serviceName: "InventoryService" });
const metrics = new Metrics({ serviceName: "InventoryService", namespace: "InventoryApp" });

const baseHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {

    const { nombre_comercio, codigo_barras } = event.pathParameters || {};
    logger.info("Parámetros de ruta obtenidos", { 
      nombre_comercio, 
      codigo_barras 
    });
  
  try {
    if (!nombre_comercio || !codigo_barras) 
      return response(400, { message: "Faltan parámetros requeridos en la ruta" });

    const product = await productService.getProductByPkSk(nombre_comercio, codigo_barras);
    logger.info("Producto obtenido con éxito", {producto: product});

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

export const getProductFunction = middy(baseHandler)
  .use(injectLambdaContext(logger, { logEvent: false })) 
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
