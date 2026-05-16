import type { SearchMatch } from '../types/index.js';
import { extname } from 'path';

export interface SymbolPattern {
  language: string;
  pattern: RegExp;
  type: 'function' | 'class' | 'variable' | 'constant' | 'interface' | 'type';
}

export interface SymbolMatch extends SearchMatch {
  symbolType: 'function' | 'class' | 'variable' | 'constant' | 'interface' | 'type';
  symbolName: string;
}

export const LANGUAGE_PATTERNS: Record<string, SymbolPattern[]> = {
  javascript: [
    { language: 'javascript', pattern: /function\s+(\w+)/g, type: 'function' },
    { language: 'javascript', pattern: /const\s+(\w+)\s*=/g, type: 'variable' },
    { language: 'javascript', pattern: /class\s+(\w+)/g, type: 'class' },
    { language: 'javascript', pattern: /const\s+(\w+)\s*=\s*\(/g, type: 'function' },
  ],
  typescript: [
    { language: 'typescript', pattern: /function\s+(\w+)/g, type: 'function' },
    { language: 'typescript', pattern: /const\s+(\w+)\s*:/g, type: 'variable' },
    { language: 'typescript', pattern: /class\s+(\w+)/g, type: 'class' },
    { language: 'typescript', pattern: /interface\s+(\w+)/g, type: 'interface' },
    { language: 'typescript', pattern: /type\s+(\w+)/g, type: 'type' },
    { language: 'typescript', pattern: /const\s+(\w+)\s*:\s*\(/g, type: 'function' },
  ],
  python: [
    { language: 'python', pattern: /def\s+(\w+)/g, type: 'function' },
    { language: 'python', pattern: /class\s+(\w+)/g, type: 'class' },
    { language: 'python', pattern: /(\w+)\s*=/g, type: 'variable' },
  ],
  go: [
    { language: 'go', pattern: /func\s+(\w+)/g, type: 'function' },
    { language: 'go', pattern: /type\s+(\w+)\s+struct/g, type: 'class' },
    { language: 'go', pattern: /var\s+(\w+)/g, type: 'variable' },
    { language: 'go', pattern: /const\s+(\w+)/g, type: 'constant' },
  ],
  rust: [
    { language: 'rust', pattern: /fn\s+(\w+)/g, type: 'function' },
    { language: 'rust', pattern: /struct\s+(\w+)/g, type: 'class' },
    { language: 'rust', pattern: /let\s+(\w+)/g, type: 'variable' },
    { language: 'rust', pattern: /const\s+(\w+)/g, type: 'constant' },
  ],
};

export function detectLanguage(filePath: string): string {
  const ext = extname(filePath).slice(1).toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
  };

  return languageMap[ext || ''] || 'plaintext';
}

export function findSymbols(
  content: string,
  language: string,
  filePath: string,
  lineIndexer: { getLine: (offset: number) => number; getColumn: (offset: number) => number; charToByte: (offset: number) => number }
): SymbolMatch[] {
  const patterns = LANGUAGE_PATTERNS[language] || LANGUAGE_PATTERNS.javascript;
  const matches: SymbolMatch[] = [];

  for (const { pattern, type } of patterns) {
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      const symbolName = match[1];
      const charStart = match.index;
      const charEnd = match.index + match[0].length;

      matches.push({
        file: filePath,
        line: lineIndexer.getLine(charStart),
        column: lineIndexer.getColumn(charStart),
        endLine: lineIndexer.getLine(charEnd),
        endColumn: lineIndexer.getColumn(charEnd),
        byteStart: lineIndexer.charToByte(charStart),
        byteEnd: lineIndexer.charToByte(charEnd),
        charStart,
        charEnd,
        text: match[0],
        match: match[0],
        symbolType: type,
        symbolName,
        hash: '', // Will be set by caller
        language,
      });
    }
  }

  return matches;
}

export function searchSymbols(
  content: string,
  symbolName: string,
  language: string,
  filePath: string,
  lineIndexer: { getLine: (offset: number) => number; getColumn: (offset: number) => number; charToByte: (offset: number) => number }
): SymbolMatch[] {
  const allSymbols = findSymbols(content, language, filePath, lineIndexer);
  return allSymbols.filter(symbol => symbol.symbolName === symbolName);
}
