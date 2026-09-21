/** @format */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand, QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput
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
  async getProductByPkSk(nombre_comercio: string, codigo_barras: string): Promise<Product | null> {
    const pk = `TENANT#${nombre_comercio.toLowerCase().replace(/\s+/g, '_')}`;
    const sk = `PROD#${codigo_barras}`;

    const input: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        PK: pk,
        SK: sk
      }
    };

    try {
      const response = await this.docClient.send(new GetCommand(input));
      return (response.Item as Product) ?? null;
    } catch (error) {
      console.error("getProductByPkSk:", error);
      throw error;
    }
  }
  async updateProductcost(nombre_comercio: string,
    codigo_barras: string,
    nuevo_costo_usd: number,
    nuevo_precio_venta_usd: number): Promise<Product | void> {
    const pk = `TENANT#${nombre_comercio.toLowerCase().replace(/\s+/g, '_')}`;
    const sk = `PROD#${codigo_barras}`;

    const input: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          PK: pk,
          SK: sk
        },
        UpdateExpression: "SET costo_usd = :nc, precio_venta_usd = :np, ultima_actualizacion = :ua",
        ExpressionAttributeValues: {
          ":nc": nuevo_costo_usd,
          ":np": nuevo_precio_venta_usd,
          ":ua": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW" 
      };

    try {
      await this.docClient.send(new UpdateCommand(input));
      
    } catch (error) {
      console.error("updateProductcost", error);
      throw error;
    }

  }
}

export default ProductService;

