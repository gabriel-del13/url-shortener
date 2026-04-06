export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Solo permitimos http y https (no ftp, file, etc.)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  // Trim whitespace y asegura que tenga protocolo
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}