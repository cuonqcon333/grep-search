import { LineIndexer } from '../parser/line-indexer.js';

export interface ContextOptions {
  lineIndexer: LineIndexer;
  matchLine: number;
  beforeContext?: number;
  afterContext?: number;
  totalLines: number;
}

export function extractContext(options: ContextOptions): { before?: string[]; after?: string[] } {
  const { matchLine, beforeContext = 0, afterContext = 0, totalLines } = options;

  const before: string[] = [];
  const after: string[] = [];

  // Extract before context
  for (let i = Math.max(0, matchLine - beforeContext); i < matchLine; i++) {
    // In production, you'd need to access the actual line content
    // This is a placeholder - the actual implementation would need access to the file content
    before.push('');
  }

  // Extract after context
  for (let i = matchLine + 1; i < Math.min(totalLines, matchLine + 1 + afterContext); i++) {
    // In production, you'd need to access the actual line content
    // This is a placeholder - the actual implementation would need access to the file content
    after.push('');
  }

  return {
    before: before.length > 0 ? before : undefined,
    after: after.length > 0 ? after : undefined,
  };
}
