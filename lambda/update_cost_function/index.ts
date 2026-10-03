/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
//import { randomUUID } from "crypto";
import ProductService, { Product } from "../../src/shared/product_service";
import { response } from "../../src/shared/response_helper";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";
import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
const productService = new ProductService(PRODUCTS_TABLE);

const logger = new Logger({ serviceName: "InventoryService" });
const tracer = new Tracer({ serviceName: "InventoryService" });
const metrics = new Metrics({ serviceName: "InventoryService", namespace: "InventoryApp" });

const baseHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {

  const bodyEvent = (typeof event.body === 'string' 
    ? JSON.parse(event.body) 
    : event.body)

  logger.info("Body", { body: bodyEvent});
  
  try {

    const { nombre_comercio, costo_usd:newCostUsdString, codigo_barras} = bodyEvent
    const nuevo_costo_usd = parseFloat(newCostUsdString);

    const product = await productService.getProductByPkSk(nombre_comercio, codigo_barras);
    logger.info("Producto obtenido con éxito", {producto: product});

    if (!product) 
      return response(404, { message: "Producto no encontrado" });
    
    const { costo_usd:costo_anterior, margen_ganancia, nombre } = product;

    const nuevo_precio_venta_usd = Math.round((nuevo_costo_usd * (1 + margen_ganancia / 100)) * 100) / 100;

    const updatedProduct = await productService.updateProductcost(nombre_comercio, codigo_barras, nuevo_costo_usd, nuevo_precio_venta_usd);
    logger.info("Producto actualizado con éxito", {producto_actualizado: updatedProduct});

    const hubo_incremento = nuevo_costo_usd > costo_anterior;
    let alerta = null;

    if (hubo_incremento) {
      alerta = {
        tipo: 'COSTO_REPOSICION_INCREMENTADO',
        mensaje: `¡Alerta de Reposición! El costo de "${nombre}" subió de $${costo_anterior} a $${nuevo_costo_usd}. El precio de venta sugerido es de ${nuevo_precio_venta_usd} y se ajustó automáticamente para proteger tu margen del ${margen_ganancia}%.`
      };
    }

    return response(200, { message: "Item actualizado éxitosamente", product: updatedProduct, alert: alerta });
  } catch (error) {
    logger.error("Error en updateCostFunction", error as Error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : "Error desconocido";

    return response(500, {
      message: "Error en updateCostFunction",
      error: errorMessage,
    });
  }
};

export const updateCostFunction = middy(baseHandler)
  .use(injectLambdaContext(logger, { logEvent: false })) 
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
