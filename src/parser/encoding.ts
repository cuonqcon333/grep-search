export type Encoding = 'utf-8' | 'utf-8-bom' | 'utf-16le' | 'utf-16be';

export function detectEncoding(buffer: Buffer): Encoding {
  // Check for UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf-8-bom';
  }

  // Check for UTF-16 LE BOM
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf-16le';
  }

  // Check for UTF-16 BE BOM
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf-16be';
  }

  // Default to UTF-8
  return 'utf-8';
}

export function getEncodingName(encoding: Encoding): string {
  switch (encoding) {
    case 'utf-8':
      return 'utf-8';
    case 'utf-8-bom':
      return 'utf-8';
    case 'utf-16le':
      return 'utf-16le';
    case 'utf-16be':
      return 'utf-16be';
  }
}

export function hasBOM(encoding: Encoding): boolean {
  return encoding === 'utf-8-bom' || encoding === 'utf-16le' || encoding === 'utf-16be';
}

export function getBOMLength(encoding: Encoding): number {
  switch (encoding) {
    case 'utf-8-bom':
      return 3;
    case 'utf-16le':
    case 'utf-16be':
      return 2;
    default:
      return 0;
  }
}
