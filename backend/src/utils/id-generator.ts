import { nanoid } from 'nanoid';

// Genera un ID corto de 7 caracteres (62^7 = ~3.5 billones de combinaciones)
export function generateShortId(length: number = 7): string {
  return nanoid(length);
}