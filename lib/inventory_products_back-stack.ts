import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
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
    
    const cronRule = new events.Rule(this, 'CronEveryTwoHoursRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(24)),
      //schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
    });
    
    cronRule.addTarget(new targets.LambdaFunction(scraperFunction));
    
    productsTable.grantWriteData(createProductFunction);
    configurationTable.grantReadData(createProductFunction);
    configurationTable.grantWriteData(scraperFunction);

    const inventoryAPI = new apigw.RestApi(this, 'InventoryApi');
    const integration = new apigw.LambdaIntegration(createProductFunction);
    const inventory = inventoryAPI.root.addResource('products');
    inventory.addMethod('POST', integration);



  }
}
