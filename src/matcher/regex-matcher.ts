import type { MatchResult } from '../types/index.js';

export function matchRegex(text: string, pattern: string, caseSensitive: boolean = true, multiline: boolean = false): MatchResult[] {
  const flags = caseSensitive ? (multiline ? 'gm' : 'g') : (multiline ? 'gim' : 'gi');
  
  try {
    const regex = new RegExp(pattern, flags);
    const results: MatchResult[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      results.push({
        charStart: match.index,
        charEnd: match.index + match[0].length,
        text: match[0],
        groups: match.slice(1),
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
