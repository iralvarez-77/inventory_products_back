import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ProductModelSchema, UpdateCostModelSchema } from '../../src/shared/infra/api/schemas';
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
      schema: ProductModelSchema,
    });
    
    const updateCostModel = api.addModel('UpdateCostModel', {
      contentType: 'application/json',
      modelName: 'UpdateCostModel',
      schema: UpdateCostModelSchema,
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
    costResource.addMethod('PUT', new apigw.LambdaIntegration(props.updateCostFn), {
      requestValidator: bodyValidator,
      requestModels: {
        'application/json': updateCostModel,
      },
    });
    criticsResource.addMethod('GET', new apigw.LambdaIntegration(props.listProductsCriticsFn));
    barcodeResource.addMethod('GET', new apigw.LambdaIntegration(props.getProductFn));
  }
}
