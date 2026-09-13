import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
export class InventoryProductsBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamo.Table(this, 'ProductsInventoryTable', {
        tableName: 'Products',
        partitionKey: { 
          name: 'id', 
          type: dynamo.AttributeType.STRING 
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY, 
        billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
    });

    const configurationTable = new dynamo.Table(this, 'ConfigurationTable', {
        tableName: 'Configuration',
        partitionKey: { 
          name: 'tasa_bcv_dia', 
          type: dynamo.AttributeType.STRING 
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY, 
        billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
    });

    const createProductFunction = new lambdaNodejs.NodejsFunction(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/create_product_function/index.ts',
      handler: 'createProduct',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
      },
    });

    const scraperFunction = new lambdaNodejs.NodejsFunction(this, 'ScraperFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/scraper_function/index.ts',
      handler: 'scraperFunction',
      environment: {
        CONFIGURATION_TABLE: configurationTable.tableName,
      },
    });

    productsTable.grantWriteData(createProductFunction);
    configurationTable.grantWriteData(scraperFunction);

    const inventoryAPI = new apigw.RestApi(this, 'InventoryApi');

    // 5. Integrar API Gateway con la Lambda
    const integration = new apigw.LambdaIntegration(createProductFunction);
    const inventory = inventoryAPI.root.addResource('products');
    inventory.addMethod('POST', integration);



  }
}
