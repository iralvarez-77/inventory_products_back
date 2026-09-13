import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export interface Config {
  tasa_bcv_dia: string; // Partition Key
  tasa_bcv: number;
  ultima_actualizacion: string;
}

export class ConfigurationService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async getConfig(): Promise<Config | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { tasa_bcv_dia: "tasa" },
    });

    try {
      const response = await this.docClient.send(command);
      console.log('👀 👉🏽 ~  response:', response.Item)
      return response.Item ? (response.Item as Config) : null;
    } catch (error) {
      console.error("Error al consultar ConfigurationService:", error);
      throw new Error("No se pudo recuperar la tasa de cambio del sistema");
    }
  }

  async updateTasaBcv(nuevaTasa: number): Promise<void> {
    const ahora = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        tasa_bcv_dia: "tasa",
      },
      UpdateExpression: "SET tasa_bcv = :tasa, ultima_actualizacion = :fecha",
      ExpressionAttributeValues: {
        ":tasa": nuevaTasa,
        ":fecha": ahora,
      },
    });

    try {
      await this.docClient.send(command);
      console.log(`Tasa BCV actualizada con éxito a: ${nuevaTasa}`);
    } catch (error) {
      console.error(" Error al actualizar la tasa BCV en DynamoDB:", error);
    }
  }
}



