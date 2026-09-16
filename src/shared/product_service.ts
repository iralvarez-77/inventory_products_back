/** @format */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  QueryCommand, QueryCommandInput
} from "@aws-sdk/lib-dynamodb";

export interface Product {
  PK: string;
  SK: string;                  // Partition Key
  nombre: string;
  nombre_comercio: string;
  costo_usd: number;
  margen_ganancia: number;
  precio_venta_usd: number;
  stock: number;
  stock_minimo: number;
  codigo_barras: string;      // Opcional
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
      throw error;
    }

  }
  async getProducts(nombreComercio: string): Promise<Product[]> {

    const tenantId = `TENANT#${nombreComercio}`;
    const input: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
      ":pk": tenantId,
      ":skPrefix": "PROD#", // Asegura que solo traiga productos y no otras entidades
    },
    };
    try {
      const response = await this.docClient.send(new QueryCommand(input));
      return (response.Items as Product[]) ?? [];
    } catch (error) {
      console.error("getProducts:", error);
      throw error;
    }

  }
}

export default ProductService;

