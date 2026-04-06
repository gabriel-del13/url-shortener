import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { generateShortId } from '../utils/id-generator';
import { UrlItem, UrlResponse } from '../models/entities';

// Reutilizar el cliente entre invocaciones (Lambda lo mantiene en memoria)
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const BASE_URL = process.env.BASE_URL || 'https://tuurl.co';

export class UrlService {

  // Crear una nueva URL corta
  async createUrl(longUrl: string, userId: string, expiresInDays?: number): Promise<UrlResponse> {
    const shortId = generateShortId();
    const now = new Date().toISOString();

    const item: UrlItem = {
      PK: `URL#${shortId}`,
      SK: 'META',
      GSI1PK: `USER#${userId}`,
      GSI1SK: now,
      shortId,
      longUrl,
      userId,
      createdAt: now,
      clickCount: 0,
    };

    // Si el usuario pide expiración, calcula el timestamp Unix
    if (expiresInDays) {
      const expiresAt = Math.floor(Date.now() / 1000) + (expiresInDays * 86400);
      item.expiresAt = expiresAt;
    }

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      // ConditionExpression evita colisiones de shortId (extremadamente raras)
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    return this.toResponse(item);
  }

  // Buscar una URL por su shortId (para redirección)
  async getUrl(shortId: string): Promise<UrlItem | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `URL#${shortId}`, SK: 'META' },
    }));
    return (result.Item as UrlItem) || null;
  }

  // Listar todas las URLs de un usuario
  async listUserUrls(userId: string): Promise<UrlResponse[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': `USER#${userId}` },
      ScanIndexForward: false, // Más recientes primero
    }));
    return (result.Items as UrlItem[]).map(item => this.toResponse(item));
  }

  // Borrar una URL (solo si pertenece al usuario)
  async deleteUrl(shortId: string, userId: string): Promise<boolean> {
    try {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `URL#${shortId}`, SK: 'META' },
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') return false;
      throw error;
    }
  }

  // Incrementar el contador de clics (atómico)
  async incrementClickCount(shortId: string): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `URL#${shortId}`, SK: 'META' },
      UpdateExpression: 'SET clickCount = clickCount + :inc',
      ExpressionAttributeValues: { ':inc': 1 },
    }));
  }

  // Convertir el item de DynamoDB al formato del API
  private toResponse(item: UrlItem): UrlResponse {
    return {
      shortId: item.shortId,
      shortUrl: `${BASE_URL}/${item.shortId}`,
      longUrl: item.longUrl,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt
        ? new Date(item.expiresAt * 1000).toISOString()
        : undefined,
      clickCount: item.clickCount,
    };
  }
}