import { describe, it, expect } from 'vitest';
import { generateStableHash } from '../../src/utils/hash.js';

describe('Deterministic Output', () => {
  it('should generate stable hashes', () => {
    const hash1 = generateStableHash('file.ts', 100, 'match');
    const hash2 = generateStableHash('file.ts', 100, 'match');
    
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different inputs', () => {
    const hash1 = generateStableHash('file.ts', 100, 'match');
    const hash2 = generateStableHash('file.ts', 101, 'match');
    
    expect(hash1).not.toBe(hash2);
  });

  it('should sort deterministically', () => {
    const items = [
      { file: 'b.ts', line: 1, column: 0, byteStart: 10 },
      { file: 'a.ts', line: 2, column: 0, byteStart: 20 },
      { file: 'a.ts', line: 1, column: 0, byteStart: 10 },
    ];

    items.sort((a, b) => {
      if (a.file !== b.file) return a.file.localeCompare(b.file);
      if (a.line !== b.line) return a.line - b.line;
      if (a.column !== b.column) return a.column - b.column;
      return a.byteStart - b.byteStart;
    });

    expect(items[0].file).toBe('a.ts');
    expect(items[0].line).toBe(1);
    expect(items[1].file).toBe('a.ts');
    expect(items[1].line).toBe(2);
    expect(items[2].file).toBe('b.ts');
  });
});
