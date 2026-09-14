/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ConfigurationService, DolarApiResponse } from "../../src/shared/configuration_service";

const URL = " https://ve.dolarapi.com/v1/dolares/oficial";
const CONFIG_TABLE = process.env.CONFIG_TABLE ?? "";
const configService = new ConfigurationService(CONFIG_TABLE);

export const scraperFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);
  
  try {
    const res = await fetch(URL);
    const data = (await res.json()) as DolarApiResponse;
    const tasa_vcb = data.promedio;
    console.log('👀 👉🏽 ~  data:', data)
    
    if (!data) return response(404, { message: "No se encontraron datos" });

    await configService.updateTasaBcv(tasa_vcb);

    return response(200, { message: `Configuración actualizada con éxito`,  tasa_actualizada: tasa_vcb });
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
