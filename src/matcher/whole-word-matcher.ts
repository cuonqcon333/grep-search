import type { MatchResult } from '../types/index.js';

export function matchWholeWord(text: string, query: string, caseSensitive: boolean = true): MatchResult[] {
  // Create word boundary pattern
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flags = caseSensitive ? 'g' : 'gi';
  const pattern = `\\b${escapedQuery}\\b`;
  
  try {
    const regex = new RegExp(pattern, flags);
    const results: MatchResult[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      results.push({
        charStart: match.index,
        charEnd: match.index + match[0].length,
        text: match[0],
      });

      // Prevent infinite loop for zero-width matches
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    return results;
  } catch (error) {
    // Invalid regex pattern
    return [];
  }
}
