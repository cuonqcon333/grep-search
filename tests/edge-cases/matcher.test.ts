import { describe, it, expect } from 'vitest';
import { matchLiteral, matchRegex, matchWholeWord } from '../../src/matcher/index.js';

describe('Matcher Engine', () => {
  it('should match literal strings', () => {
    const text = 'hello world hello';
    const matches = matchLiteral(text, 'hello', true);
    expect(matches).toHaveLength(2);
    expect(matches[0].charStart).toBe(0);
    expect(matches[0].charEnd).toBe(5);
  });

  it('should match literal strings case-insensitively', () => {
    const text = 'Hello world HELLO';
    const matches = matchLiteral(text, 'hello', false);
    expect(matches).toHaveLength(2);
  });

  it('should match regex patterns', () => {
    const text = 'test123 test456';
    const matches = matchRegex(text, 'test\\d+', true, false);
    expect(matches).toHaveLength(2);
  });

  it('should match whole words', () => {
    const text = 'hello world hello-world';
    const matches = matchWholeWord(text, 'hello', true);
    expect(matches).toHaveLength(2); // 'hello' ở đầu và 'hello' trong 'hello-world' đều là whole words
  });

  it('should handle multiline patterns', () => {
    const text = 'line1\nline2\nline3';
    const matches = matchRegex(text, 'line.\\nline.', true, true);
    expect(matches).toHaveLength(1);
  });
});
