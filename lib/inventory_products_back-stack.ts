import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

    const createProductFunction = new lambdaNodejs.NodejsFunction(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/create_product_function/index.ts',
      handler: 'createProduct', // Solo el nombre de la función exportada
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
      },
    });

    productsTable.grantWriteData(createProductFunction);
  }
}
