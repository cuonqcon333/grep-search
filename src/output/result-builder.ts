import type { SearchMatch, MatchResult } from '../types/index.js';
import { LineIndexer } from '../parser/line-indexer.js';

export interface BuildMatchOptions {
  file: string;
  match: MatchResult;
  lineIndexer: LineIndexer;
  byteOffset: number;
  hash: string;
}

export function buildMatch(options: BuildMatchOptions): SearchMatch {
  const { file, match, lineIndexer, byteOffset, hash } = options;

  const line = lineIndexer.getLine(match.charStart);
  const column = lineIndexer.getColumn(match.charStart);
  const endLine = lineIndexer.getLine(match.charEnd);
  const endColumn = lineIndexer.getColumn(match.charEnd);

  const byteStart = byteOffset + lineIndexer.charToByte(match.charStart);
  const byteEnd = byteOffset + lineIndexer.charToByte(match.charEnd);

  return {
    file,
    line,
    column,
    endLine,
    endColumn,
    byteStart,
    byteEnd,
    charStart: match.charStart,
    charEnd: match.charEnd,
    text: match.text,
    match: match.text,
    groups: match.groups,
    hash,
  };
}
