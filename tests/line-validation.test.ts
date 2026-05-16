import { describe, it, expect } from 'vitest';
import { LineIndexer } from '../../src/parser/line-indexer.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Line Number Validation', () => {
  it('should correctly map character offsets to line numbers', () => {
    const indexer = new LineIndexer();
    const text = 'line1\nline2\nline3';
    indexer.feed(text, 0);

    // Character offsets
    expect(indexer.getLine(0)).toBe(0);  // 'l' in 'line1'
    expect(indexer.getLine(6)).toBe(1);  // 'l' in 'line2' (after 'line1\n')
    expect(indexer.getLine(12)).toBe(2); // 'l' in 'line3' (after 'line1\nline2\n')
  });

  it('should correctly calculate column numbers', () => {
    const indexer = new LineIndexer();
    const text = 'line1\nline2\nline3';
    indexer.feed(text, 0);

    expect(indexer.getColumn(0)).toBe(0);  // 'l' at column 0
    expect(indexer.getColumn(1)).toBe(1);  // 'i' at column 1
    expect(indexer.getColumn(6)).toBe(0);  // 'l' at column 0 of line 2
  });

  it('should correctly map line to byte/char offsets', () => {
    const indexer = new LineIndexer();
    const text = 'line1\nline2\nline3';
    indexer.feed(text, 0);

    const line0 = indexer.getLineOffset(0);
    expect(line0.char).toBe(0);

    const line1 = indexer.getLineOffset(1);
    expect(line1.char).toBe(6); // After 'line1\n'

    const line2 = indexer.getLineOffset(2);
    expect(line2.char).toBe(12); // After 'line1\nline2\n'
  });
});
