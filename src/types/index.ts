export type SearchQuery = {
  cwd: string;
  query: string;
  regex?: boolean;
  wholeWord?: boolean;
  caseSensitive?: boolean;
  multiline?: boolean;
  extensions?: string[];
  ignore?: string[];
  maxDepth?: number;
  beforeContext?: number;
  afterContext?: number;
  maxResults?: number;
  // Performance options
  maxConcurrency?: number;
  useCache?: boolean;
  cacheTTL?: number;
  cacheMaxSize?: number;
};

export type SearchMatch = {
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  byteStart: number;
  byteEnd: number;
  charStart: number;
  charEnd: number;
  text: string;
  match: string;
  before?: string[];
  after?: string[];
  groups?: string[];
  language?: string;
  hash: string;
};

export type MatchResult = {
  charStart: number;
  charEnd: number;
  text: string;
  groups?: string[];
};

export type LineMap = {
  line: number;
  charOffset: number;
  byteOffset: number;
};
