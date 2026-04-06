import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UrlService } from '../services/url-service';

const urlService = new UrlService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const shortId = event.pathParameters?.shortId;

  if (!shortId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing shortId' }) };
  }

  try {
    const url = await urlService.getUrl(shortId);

    if (!url) {
      return { statusCode: 404, body: JSON.stringify({ error: 'URL not found' }) };
    }

    // Verificar si la URL ha expirado manualmente
    if (url.expiresAt && url.expiresAt < Math.floor(Date.now() / 1000)) {
      return { statusCode: 410, body: JSON.stringify({ error: 'URL expired' }) };
    }

    // Incrementar clicks de forma asíncrona (no bloqueamos la redirección)
    urlService.incrementClickCount(shortId).catch(console.error);

    // 301 = redirect permanente (el browser lo cachea)
    // 302 = redirect temporal (el browser siempre pregunta al server)
    // Usamos 302 porque queremos poder trackear cada clic
    return {
      statusCode: 302,
      headers: {
        Location: url.longUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: '',
    };
  } catch (error) {
    console.error('Redirect error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};