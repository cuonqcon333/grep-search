import { describe, it, expect } from 'vitest';
import { detectEncoding, getEncodingName, getBOMLength } from '../../src/parser/encoding.js';

describe('Encoding Detection', () => {
  it('should detect UTF-8', () => {
    const buffer = Buffer.from('hello world', 'utf-8');
    const encoding = detectEncoding(buffer);
    expect(encoding).toBe('utf-8');
  });

  it('should detect UTF-8 BOM', () => {
    const buffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from('hello', 'utf-8')]);
    const encoding = detectEncoding(buffer);
    expect(encoding).toBe('utf-8-bom');
  });

  it('should detect UTF-16 LE BOM', () => {
    const buffer = Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from('hello', 'utf-16le')]);
    const encoding = detectEncoding(buffer);
    expect(encoding).toBe('utf-16le');
  });

  it('should detect UTF-16 BE BOM', () => {
    const buffer = Buffer.concat([Buffer.from([0xFE, 0xFF]), Buffer.from('hello', 'ucs2')]);
    const encoding = detectEncoding(buffer);
    expect(encoding).toBe('utf-16be');
  });

  it('should get correct encoding name', () => {
    expect(getEncodingName('utf-8')).toBe('utf-8');
    expect(getEncodingName('utf-8-bom')).toBe('utf-8');
    expect(getEncodingName('utf-16le')).toBe('utf-16le');
    expect(getEncodingName('utf-16be')).toBe('utf-16be');
  });

  it('should get correct BOM length', () => {
    expect(getBOMLength('utf-8')).toBe(0);
    expect(getBOMLength('utf-8-bom')).toBe(3);
    expect(getBOMLength('utf-16le')).toBe(2);
    expect(getBOMLength('utf-16be')).toBe(2);
  });
});
