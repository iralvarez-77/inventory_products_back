import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
export interface IProductInventory {
  id: string;                  // Partition Key
  nombre: string;
  costo_usd: number;
  margen_ganancia: number;
  precio_venta_usd: number;
  stock: number;
  stock_minimo: number;
  codigo_barras?: string;      // Opcional
  ultima_actualizacion: string; // ISO String
}
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
  }
}
