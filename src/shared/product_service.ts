/** @format */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";

export interface Product {
  id: string;                  // Partition Key
  nombre: string;
  costo_usd: number;
  margen_ganancia: number;
  precio_venta_usd: number;
  precio_venta_ves: number;
  stock: number;
  stock_minimo: number;
  codigo_barras?: string;      // Opcional
  fecha_creacion: string;      // ISO String
  ultima_actualizacion: string; // ISO String
}

export class ProductService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async createProduct(item: Product): Promise<void> {
    const input: PutCommandInput = {
      TableName: this.tableName,
      Item: item,
    };
    try {
      await this.docClient.send(new PutCommand(input));
    } catch (error) {
      console.error("createProduct:", error);
    }

  }
}

export default ProductService;

