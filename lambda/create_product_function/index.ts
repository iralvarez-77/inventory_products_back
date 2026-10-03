/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import ProductService, { Product } from "../../src/shared/product_service";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";
import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { response } from "../../src/shared/response_helper";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

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

  logger.info("Procesando creación del producto", { body: bodyEvent });
  
  try { 

    const { nombre, costo_usd: costString, margen_ganancia, stock, stock_minimo, nombre_comercio, codigo_barras} = bodyEvent;

    const costo_usd = parseFloat(costString);
    const precio_venta_usd = Math.round((costo_usd * (1 + margen_ganancia / 100)) * 100) / 100;
    const estado_stock = stock <= stock_minimo ? 'CRITICO' : 'OK';

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
      estado_stock,
      codigo_barras, 
      fecha_creacion: new Date().toISOString(), // ISO String
      ultima_actualizacion: new Date().toISOString(), // ISO String
    };

    //tracer.putMetadata("productBarcode", codigo_barras);
    await productService.createProduct(productItem);
    //metrics.addMetric("ProductCreatedSuccessfully", MetricUnit.Count, 1);
    logger.info("Producto guardado exitosamente en base de datos", { productId: productItem.SK });

    return response(201, { message: "Item guardado éxitosamente", productItem });
  } catch (error) {
    logger.error("Error en createProductFunction", error as Error);
    //metrics.addMetric("ProductCreationFailed", MetricUnit.Count, 1);
    if (error instanceof ConditionalCheckFailedException) 
      return response(409, {
        message: "Error al registrar el producto",
        error: "El producto con este código de barras ya está registrado en este comercio.",
      });
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Error desconocido";

    return response(500, {
      message: "Error en createProductFunction",
      error: errorMessage,
    });
  }
};

export const createProductFunction = middy(baseHandler)
  .use(injectLambdaContext(logger, { logEvent: false })) // Loguea el evento automáticamente de forma estructurada
  .use(captureLambdaHandler(tracer)) // Traza los segmentos para AWS X-Ray.
  .use(logMetrics(metrics)); //Registra las métricas


