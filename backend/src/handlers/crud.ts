import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UrlService } from '../services/url-service';
import { isValidUrl, sanitizeUrl } from '../utils/validators';
import { CreateUrlRequest } from '../models/entities';

const urlService = new UrlService();

// Helper para extraer el userId del JWT de Cognito
function getUserId(event: APIGatewayProxyEvent): string {
  // Cognito pone los claims del JWT en requestContext.authorizer.claims
  return event.requestContext.authorizer?.claims?.sub || 'anonymous';
}

// Helper para respuestas HTTP consistentes
function response(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const shortId = event.pathParameters?.id;

  try {
    // POST /api/urls — Crear URL
    if (method === 'POST' && !shortId) {
      const body: CreateUrlRequest = JSON.parse(event.body || '{}');
      const longUrl = sanitizeUrl(body.longUrl || '');

      if (!isValidUrl(longUrl)) {
        return response(400, { error: 'Invalid URL. Must start with http:// or https://' });
      }

      const userId = getUserId(event);
      const result = await urlService.createUrl(longUrl, userId, body.expiresInDays);
      return response(201, result);
    }

    // GET /api/urls — Listar mis URLs
    if (method === 'GET' && !shortId) {
      const userId = getUserId(event);
      const urls = await urlService.listUserUrls(userId);
      return response(200, { urls });
    }

    // DELETE /api/urls/{id} — Borrar URL
    if (method === 'DELETE' && shortId) {
      const userId = getUserId(event);
      const deleted = await urlService.deleteUrl(shortId, userId);
      if (!deleted) {
        return response(404, { error: 'URL not found or not yours' });
      }
      return response(200, { message: 'Deleted' });
    }

    return response(400, { error: 'Invalid request' });
  } catch (error) {
    console.error('CRUD error:', error);
    return response(500, { error: 'Internal server error' });
  }
};