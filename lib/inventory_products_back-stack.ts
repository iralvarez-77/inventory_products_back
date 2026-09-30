import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { InventoryApiConstruct } from './constructs/api_gateway.constructs';
import { ProductsLambdasConstruct } from './constructs/products_lambas.contructs';
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

    const lambdas = new ProductsLambdasConstruct(this, 'ProductsLambdas', {
      productsTable,
      configurationTable,
      estadoStockIndexName,
    });
    
    const cronRule = new events.Rule(this, 'CronEveryTwoHoursRule', {
      //schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      schedule: events.Schedule.expression('cron(0 11 ? * MON-FRI *)'),
    });
    
    cronRule.addTarget(new targets.LambdaFunction(lambdas.scraperFn));
    
    productsTable.grantWriteData(lambdas.createProductFn);
    productsTable.grantReadData(lambdas.getProductsFn);
    productsTable.grantReadData(lambdas.listProductsCriticsFn);
    productsTable.grantReadData(lambdas.getProductFn);
    productsTable.grantReadWriteData(lambdas.updateCostFn);
    configurationTable.grantReadData(lambdas.getProductsFn);
    configurationTable.grantReadData(lambdas.getProductFn);
    configurationTable.grantWriteData(lambdas.scraperFn);

    new InventoryApiConstruct(this, 'InventoryApiGateway', {
      createProductFn: lambdas.createProductFn,
      getProductsFn: lambdas.getProductsFn,
      getProductFn: lambdas.getProductFn,
      updateCostFn: lambdas.updateCostFn,
      listProductsCriticsFn: lambdas.listProductsCriticsFn,
    });
  }
}
