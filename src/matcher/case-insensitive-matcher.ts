import type { MatchResult } from '../types/index.js';

export function matchCaseInsensitive(text: string, query: string): MatchResult[] {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  const results: MatchResult[] = [];
  let index = 0;

  while (true) {
    index = lowerText.indexOf(lowerQuery, index);
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
