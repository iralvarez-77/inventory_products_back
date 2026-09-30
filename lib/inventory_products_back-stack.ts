import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { InventoryApiConstruct } from './constructs/api_gateway.constructs';
export class InventoryProductsBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const estadoStockIndexName = 'EstadoStockIndex';
    const productsTable = new dynamo.Table(this, 'ProductsInventoryTable', {
        tableName: 'ProductsTable',
        partitionKey: { 
          name: 'PK', 
          type: dynamo.AttributeType.STRING 
        },
        sortKey: { 
          name: 'SK', 
          type: dynamo.AttributeType.STRING 
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY, 
        billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
    });

    productsTable.addGlobalSecondaryIndex({
      indexName: estadoStockIndexName,
      partitionKey: { name: 'estado_stock', type: dynamo.AttributeType.STRING },
      projectionType: dynamo.ProjectionType.ALL,
    });

    const configurationTable = new dynamo.Table(this, 'ConfigurationTable', {
        tableName: 'ConfigTable',
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
      handler: 'createProductFunction',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
      },
    });

    const getProductsFunction = new lambdaNodejs.NodejsFunction(this, 'GetProductsFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/get_products_function/index.ts',
      handler: 'getProductsFunction',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        CONFIG_TABLE: configurationTable.tableName,
      },
    });

    const getProductFunction = new lambdaNodejs.NodejsFunction(this, 'GetProductFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/get_product_function/index.ts',
      handler: 'getProductFunction',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        CONFIG_TABLE: configurationTable.tableName,
      },
    });

    const updateCostFunction = new lambdaNodejs.NodejsFunction(this, 'UpdateCostFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/update_cost_function/index.ts',
      handler: 'updateCostFunction',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        CONFIG_TABLE: configurationTable.tableName,
      },
    });

    const scraperFunction = new lambdaNodejs.NodejsFunction(this, 'ScraperFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/scraper_function/index.ts',
      handler: 'scraperFunction',
      environment: {
        CONFIG_TABLE: configurationTable.tableName,
      },
    });

    const listProductsCriticsFunction = new lambdaNodejs.NodejsFunction(this, 'ListProductsCriticsFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/list_products_critics_function/index.ts',
      handler: 'listProductsCriticsFunction',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        PRODUCTS_INDEX_NAME: estadoStockIndexName,
      },
    });
    
    const cronRule = new events.Rule(this, 'CronEveryTwoHoursRule', {
      //schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      schedule: events.Schedule.expression('cron(0 11 ? * MON-FRI *)'),
    });
    
    cronRule.addTarget(new targets.LambdaFunction(scraperFunction));
    
    productsTable.grantWriteData(createProductFunction);
    productsTable.grantReadData(getProductsFunction);
    productsTable.grantReadData(listProductsCriticsFunction);
    productsTable.grantReadData(getProductFunction);
    productsTable.grantReadWriteData(updateCostFunction);
    configurationTable.grantReadData(getProductsFunction);
    configurationTable.grantReadData(getProductFunction);
    configurationTable.grantWriteData(scraperFunction);

    new InventoryApiConstruct(this, 'InventoryApiGateway', {
      createProductFn: createProductFunction,
      getProductsFn: getProductsFunction,
      getProductFn: getProductFunction,
      updateCostFn: updateCostFunction,
      listProductsCriticsFn: listProductsCriticsFunction,
    });
  }
}
