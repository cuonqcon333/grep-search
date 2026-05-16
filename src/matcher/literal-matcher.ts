import type { MatchResult } from '../types/index.js';

export function matchLiteral(text: string, query: string, caseSensitive: boolean = true): MatchResult[] {
  if (!caseSensitive) {
    text = text.toLowerCase();
    query = query.toLowerCase();
  }

  const results: MatchResult[] = [];
  let index = 0;

  while (true) {
    index = text.indexOf(query, index);
    if (index === -1) break;

    results.push({
      charStart: index,
      charEnd: index + query.length,
      text: text.slice(index, index + query.length),
    });

    index += query.length;
  }

  return results;
}
