import * as apigw from 'aws-cdk-lib/aws-apigateway';
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

    // Nodos Base
    const productsResource = api.root.addResource('products');
    const costResource = productsResource.addResource('cost');
    const criticsResource = productsResource.addResource('critics');

    // Nodos Dinámicos
    const commerceResource = productsResource.addResource('{nombre_comercio}');
    const barcodeResource = commerceResource.addResource('{codigo_barras}');

    productsResource.addMethod('POST', new apigw.LambdaIntegration(props.createProductFn));
    productsResource.addMethod('GET', new apigw.LambdaIntegration(props.getProductsFn));
    costResource.addMethod('PUT', new apigw.LambdaIntegration(props.updateCostFn));
    criticsResource.addMethod('GET', new apigw.LambdaIntegration(props.listProductsCriticsFn));
    barcodeResource.addMethod('GET', new apigw.LambdaIntegration(props.getProductFn));
  }
}
