import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
interface InventoryApiProps {
  createProductFn: lambda.IFunction;
  getProductsFn: lambda.IFunction;
  getProductFn: lambda.IFunction;
  updateCostFn: lambda.IFunction;
  listProductsCriticsFn: lambda.IFunction;
}
export class InventoryApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: InventoryApiProps) {
    super(scope, id);

    const api = new apigw.RestApi(this, 'InventoryApi', {
      restApiName: 'Inventory-Management-API'
    });

    const bodyValidator = api.addRequestValidator('ProductBodyValidator', {
      requestValidatorName: 'ValidateBody',
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    const productModel = api.addModel('ProductModel', {
      contentType: 'application/json',
      modelName: 'ProductModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        // 1. Definimos cuáles campos son estrictamente obligatorios al crear el producto
        required: [
          'nombre', 
          'costo_usd', 
          'margen_ganancia', 
          'stock', 
          'stock_minimo', 
          'codigo_barras', 
          'nombre_comercio'
        ],
        // 2. Bloqueamos cualquier propiedad extra que no esté en esta lista
        additionalProperties: false, 
        properties: {
          nombre: { 
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1 ,// Evita que envíen un texto vacío ""
            maxLength: 40 
          },
          costo_usd: { 
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[0-9]+(\\.[0-9]{1,2})?$', 
          },
          margen_ganancia: { 
            type: apigateway.JsonSchemaType.INTEGER,
            minimum: 0 // El margen de ganancia debe ser 0 o superior (ej: 100%)
          },
          stock: { 
            type: apigateway.JsonSchemaType.INTEGER, // Forzamos a que sea un número entero
            minimum: 0 // No se permite stock inicial negativo
          },
          stock_minimo: { 
            type: apigateway.JsonSchemaType.INTEGER, // Número entero
            minimum: 0 
          },
          codigo_barras: { 
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[0-9]+$'
          },
          nombre_comercio: { 
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            maxLength: 30
          },
        },
      },
    });

    // Nodos Base
    const productsResource = api.root.addResource('products');
    const costResource = productsResource.addResource('cost');
    const criticsResource = productsResource.addResource('critics');

    // Nodos Dinámicos
    const commerceResource = productsResource.addResource('{nombre_comercio}');
    const barcodeResource = commerceResource.addResource('{codigo_barras}');

    productsResource.addMethod('POST', new apigw.LambdaIntegration(props.createProductFn),{
      requestValidator: bodyValidator,
      requestModels: {
        'application/json': productModel,
      },
    });
    productsResource.addMethod('GET', new apigw.LambdaIntegration(props.getProductsFn));
    costResource.addMethod('PUT', new apigw.LambdaIntegration(props.updateCostFn));
    criticsResource.addMethod('GET', new apigw.LambdaIntegration(props.listProductsCriticsFn));
    barcodeResource.addMethod('GET', new apigw.LambdaIntegration(props.getProductFn));
  }
}
