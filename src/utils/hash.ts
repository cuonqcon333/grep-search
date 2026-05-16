import { createHash } from 'crypto';

export function generateStableHash(file: string, byteStart: number, match: string): string {
  const data = `${file}:${byteStart}:${match}`;
  return createHash('sha1').update(data).digest('hex');
}
