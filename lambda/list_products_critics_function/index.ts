/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductService } from "../../src/shared/product_service";
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

export const baseHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const products = await productService.listProductsCritics();
    logger.info("Productos críticos obtenidos con éxito");
    return response(200, { message: "Productos críticos obtenidos con éxito", productos: products });
    
  } catch (error) {
    logger.error("Error en listProductsCriticsFunction", error as Error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return response(500, {
      message: "Error en listProductsCriticsFunction",
      error: errorMessage,
    });
  }
};

export const listProductsCriticsFunction = middy(baseHandler)
  .use(injectLambdaContext(logger, { logEvent: false })) 
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));

