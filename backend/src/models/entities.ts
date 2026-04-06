// Estas interfaces definen la forma de los datos en DynamoDB
export interface UrlItem {
  PK: string;          // URL#shortId
  SK: string;          // META
  GSI1PK: string;      // USER#userId
  GSI1SK: string;      // createdAt (ISO string)
  shortId: string;
  longUrl: string;
  userId: string;
  createdAt: string;
  expiresAt?: number;  // Unix timestamp para TTL de DynamoDB
  clickCount: number;
}

export interface ClickItem {
  PK: string;          // URL#shortId
  SK: string;          // CLICK#timestamp
  timestamp: string;
  ipHash: string;
  userAgent: string;
  referrer: string;
  country: string;
}

// Lo que el frontend envía al crear una URL
export interface CreateUrlRequest {
  longUrl: string;
  expiresInDays?: number;
}

// Lo que el API devuelve al frontend
export interface UrlResponse {
  shortId: string;
  shortUrl: string;
  longUrl: string;
  createdAt: string;
  expiresAt?: string;
  clickCount: number;
}