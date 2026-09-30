// lib/constructs/products-lambdas.construct.ts
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface ProductsLambdasProps {
  productsTable: dynamo.ITable;
  configurationTable: dynamo.ITable;
  estadoStockIndexName: string;
}

export class ProductsLambdasConstruct extends Construct {
  // Declaramos las funciones públicas para que el Stack principal y el API Gateway puedan acceder a ellas
  public readonly createProductFn: lambdaNodejs.NodejsFunction;
  public readonly getProductsFn: lambdaNodejs.NodejsFunction;
  public readonly getProductFn: lambdaNodejs.NodejsFunction;
  public readonly updateCostFn: lambdaNodejs.NodejsFunction;
  public readonly listProductsCriticsFn: lambdaNodejs.NodejsFunction;
  public readonly scraperFn: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: ProductsLambdasProps) {
    super(scope, id);

    // Configuración base compartida para evitar repetir código en cada Lambda
    const sharedLambdaConfig = {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
    };

    this.createProductFn = new lambdaNodejs.NodejsFunction(this, 'CreateProductFunction', {
      ...sharedLambdaConfig,
      entry: 'lambda/create_product_function/index.ts',
      handler: 'createProductFunction',
      environment: {
        PRODUCTS_TABLE: props.productsTable.tableName,
      },
    });

    this.getProductsFn = new lambdaNodejs.NodejsFunction(this, 'GetProductsFunction', {
      ...sharedLambdaConfig,
      entry: 'lambda/get_products_function/index.ts',
      handler: 'getProductsFunction',
      environment: {
        PRODUCTS_TABLE: props.productsTable.tableName,
        CONFIG_TABLE: props.configurationTable.tableName,
      },
    });

    this.getProductFn = new lambdaNodejs.NodejsFunction(this, 'GetProductFunction', {
      ...sharedLambdaConfig,
      entry: 'lambda/get_product_function/index.ts',
      handler: 'getProductFunction',
      environment: {
        PRODUCTS_TABLE: props.productsTable.tableName,
        CONFIG_TABLE: props.configurationTable.tableName,
      },
    });

    this.updateCostFn = new lambdaNodejs.NodejsFunction(this, 'UpdateCostFunction', {
      ...sharedLambdaConfig,
      entry: 'lambda/update_cost_function/index.ts',
      handler: 'updateCostFunction',
      environment: {
        PRODUCTS_TABLE: props.productsTable.tableName,
        CONFIG_TABLE: props.configurationTable.tableName,
      },
    });

    this.scraperFn = new lambdaNodejs.NodejsFunction(this, 'ScraperFunction', {
      ...sharedLambdaConfig,
      entry: 'lambda/scraper_function/index.ts',
      handler: 'scraperFunction',
      environment: {
        CONFIG_TABLE: props.configurationTable.tableName,
      },
    });

    this.listProductsCriticsFn = new lambdaNodejs.NodejsFunction(this, 'ListProductsCriticsFunction', {
      ...sharedLambdaConfig,
      entry: 'lambda/list_products_critics_function/index.ts',
      handler: 'listProductsCriticsFunction',
      environment: {
        PRODUCTS_TABLE: props.productsTable.tableName,
        PRODUCTS_INDEX_NAME: props.estadoStockIndexName,
      },
    });
  }
}
