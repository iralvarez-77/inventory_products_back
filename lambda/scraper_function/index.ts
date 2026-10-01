/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ConfigurationService, DolarApiResponse } from "../../src/shared/configuration_service";
import { response } from "../../src/shared/response_helper";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";
import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";

const URL = " https://ve.dolarapi.com/v1/dolares/oficial";
const CONFIG_TABLE = process.env.CONFIG_TABLE ?? "";
const configService = new ConfigurationService(CONFIG_TABLE);

const logger = new Logger({ serviceName: "InventoryService" });
const tracer = new Tracer({ serviceName: "InventoryService" });
const metrics = new Metrics({ serviceName: "InventoryService", namespace: "InventoryApp" });

const baseHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  
  try {
    const res = await fetch(URL);
    const data = (await res.json()) as DolarApiResponse;
    const tasa_bcv_raw = data.promedio;
    console.log('👀 👉🏽 ~  data:', data)
    
    if (!data) return response(404, { message: "No se encontraron datos" });

    const tasa_bcv = Math.round(tasa_bcv_raw * 100) / 100; // Redondear a 2 decimales
    await configService.updateTasaBcv(tasa_bcv);

    return response(200, { message: `Configuración actualizada con éxito`,  tasa_actualizada: tasa_bcv });
  } catch (error) {
    console.error("Error en scraperFunction", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return response(500, {
      message: "Error en scraperFunction",
      error: errorMessage,
    });
  }
};

export const scraperFunction = middy(baseHandler)
  .use(injectLambdaContext(logger, { logEvent: true })) 
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));