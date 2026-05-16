import { describe, it, expect } from 'vitest';
import { LineIndexer } from '../../src/parser/line-indexer.js';

describe('Line Indexer - Newline Handling', () => {
  it('should handle LF line endings', () => {
    const indexer = new LineIndexer();
    const text = 'line1\nline2\nline3';
    indexer.feed(text, 0);

    expect(indexer.getLine(0)).toBe(0);
    expect(indexer.getLine(6)).toBe(1);
    expect(indexer.getLine(12)).toBe(2);
  });

  it('should handle CRLF line endings', () => {
    const indexer = new LineIndexer();
    const text = 'line1\r\nline2\r\nline3';
    indexer.feed(text, 0);

    expect(indexer.getLine(0)).toBe(0);
    expect(indexer.getLine(7)).toBe(1);
    expect(indexer.getLine(14)).toBe(2);
  });

  it('should handle mixed newlines', () => {
    const indexer = new LineIndexer();
    const text = 'line1\nline2\r\nline3\nline4';
    indexer.feed(text, 0);

    expect(indexer.getLine(0)).toBe(0);
    expect(indexer.getLine(6)).toBe(1);
    expect(indexer.getLine(13)).toBe(2);
    expect(indexer.getLine(19)).toBe(3);
  });
});
