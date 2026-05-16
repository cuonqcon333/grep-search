import type { SearchMatch } from '../types/index.js';

export interface JSONLOptions {
  includeContext?: boolean;
  includeGroups?: boolean;
  pretty?: boolean;
}

export function matchToJSONL(match: SearchMatch, options: JSONLOptions = {}): string {
  const { includeContext = true, includeGroups = true } = options;

  const output: any = {
    file: match.file,
    line: match.line,
    column: match.column,
    endLine: match.endLine,
    endColumn: match.endColumn,
    byteStart: match.byteStart,
    byteEnd: match.byteEnd,
    charStart: match.charStart,
    charEnd: match.charEnd,
    text: match.text,
    match: match.match,
    hash: match.hash,
  };

  if (includeContext) {
    if (match.before) {
      output.before = match.before;
    }
    if (match.after) {
      output.after = match.after;
    }
  }

  if (includeGroups && match.groups) {
    output.groups = match.groups;
  }

  if (match.language) {
    output.language = match.language;
  }

  return JSON.stringify(output);
}

export async function* toJSONL(
  matches: AsyncGenerator<SearchMatch>,
  options: JSONLOptions = {}
): AsyncGenerator<string> {
  for await (const match of matches) {
    yield matchToJSONL(match, options) + '\n';
  }
}

export function matchesToJSONL(matches: SearchMatch[], options: JSONLOptions = {}): string {
  return matches.map(match => matchToJSONL(match, options)).join('\n') + '\n';
}
