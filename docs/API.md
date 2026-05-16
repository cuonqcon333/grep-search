# API Documentation

## Core API

### `grepSearch(options: SearchQuery): AsyncGenerator<SearchMatch>`

Main search function that yields search matches.

**Parameters:**
- `options.cwd`: Working directory
- `options.query`: Search query string
- `options.regex`: Use regex pattern (default: false)
- `options.wholeWord`: Match whole words only (default: false)
- `options.caseSensitive`: Case-sensitive search (default: false)
- `options.multiline`: Enable multiline patterns (default: false)
- `options.extensions`: File extensions to include
- `options.ignore`: Ignore patterns (gitignore-style)
- `options.maxDepth`: Maximum directory depth
- `options.beforeContext`: Lines of context before match
- `options.afterContext`: Lines of context after match
- `options.maxResults`: Maximum number of results
- `options.maxConcurrency`: Max concurrent file operations (default: 10)
- `options.useCache`: Enable file/line map caching (default: true)
- `options.cacheTTL`: Cache time-to-live in ms (default: 300000)
- `options.cacheMaxSize`: Max cache size (default: 1000)

**Returns:** AsyncGenerator yielding `SearchMatch` objects

## Performance API (Phase 3)

### Concurrency Control

#### `class ConcurrencyController`

Controls concurrent file operations.

**Constructor:**
- `maxConcurrency`: Maximum concurrent operations

**Methods:**
- `run<T>(fn: () => Promise<T>): Promise<T>`: Run function with concurrency control
- `get available(): number`: Get available permits
- `get queued(): number`: Get queued operations count

### File Hash Cache

#### `class FileHashCache`

Caches file hashes to avoid re-reading unchanged files.

**Constructor Options:**
- `maxSize`: Maximum cache entries (default: 1000)
- `ttl`: Cache time-to-live in ms (default: 300000)

**Methods:**
- `async get(filePath: string): Promise<string | null>`: Get cached hash
- `async set(filePath: string, hash: string): Promise<void>`: Set cached hash
- `clear(): void`: Clear cache
- `get size(): number`: Get current cache size

#### `async computeFileHash(filePath: string): Promise<string>`

Compute SHA-256 hash of a file.

### Line Map Cache

#### `class LineMapCache`

Caches line index results for faster lookups.

**Constructor Options:**
- `maxSize`: Maximum cache entries (default: 500)
- `ttl`: Cache time-to-live in ms (default: 600000)

**Methods:**
- `get(fileHash: string): LineMapCacheEntry | null`: Get cached line maps
- `set(fileHash: string, lineMaps: LineMap[], totalChars: number): void`: Set cached line maps
- `clear(): void`: Clear cache
- `get size(): number`: Get current cache size

## Agent Features API (Phase 4)

### JSONL Output

#### `matchToJSONL(match: SearchMatch, options?: JSONLOptions): string`

Convert a SearchMatch to JSONL format.

**Options:**
- `includeContext`: Include before/after context (default: true)
- `includeGroups`: Include regex capture groups (default: true)
- `pretty`: Pretty-print JSON (default: false)

#### `async function* toJSONL(matches: AsyncGenerator<SearchMatch>, options?: JSONLOptions): AsyncGenerator<string>`

Stream SearchMatch objects as JSONL.

#### `matchesToJSONL(matches: SearchMatch[], options?: JSONLOptions): string`

Convert array of SearchMatch objects to JSONL string.

### Range Patch Support

#### `interface RangePatch`

- `filePath`: File path to patch
- `byteStart`: Starting byte offset
- `byteEnd`: Ending byte offset
- `replacement`: Replacement text

#### `interface PatchResult`

- `filePath`: File path
- `success`: Whether patch succeeded
- `error`: Error message if failed
- `originalSize`: Original file size in bytes
- `newSize`: New file size in bytes
- `bytesChanged`: Number of bytes changed

#### `function validatePatch(patch: RangePatch, fileSize: number): { valid: boolean; error?: string }`

Validate a patch before applying.

#### `async function applyPatch(patch: RangePatch): Promise<PatchResult>`

Apply a single patch to a file.

#### `async function applyPatches(patches: RangePatch[]): Promise<PatchResult[]>`

Apply multiple patches to files.

#### `function generateUnifiedDiff(original: string, modified: string, filePath: string): string`

Generate unified diff format string.

### Replace Engine

#### `interface ReplaceOptions`

- `dryRun`: Preview changes without applying (default: false)

#### `interface ReplaceResult`

- `filePath`: File path
- `success`: Whether replace succeeded
- `error`: Error message if failed
- `replacements`: Number of replacements made
- `bytesChanged`: Number of bytes changed

#### `async function replaceMatch(match: SearchMatch, replacement: string, options?: ReplaceOptions): Promise<ReplaceResult>`

Replace a single match with new content.

#### `async function replaceMatches(matches: SearchMatch[], replacement: string, options?: ReplaceOptions): Promise<ReplaceResult[]>`

Replace multiple matches with new content.

#### `function validateReplacement(original: string, replacement: string, language?: string): { valid: boolean; warnings: string[] }`

Validate a replacement for potential issues.

### Symbol Search

#### `interface SymbolPattern`

- `language`: Language identifier
- `pattern`: Regex pattern for symbols
- `type`: Symbol type (function, class, variable, constant, interface, type)

#### `interface SymbolMatch extends SearchMatch`

- `symbolType`: Type of symbol
- `symbolName`: Name of symbol

#### `const LANGUAGE_PATTERNS: Record<string, SymbolPattern[]>`

Predefined symbol patterns for various languages.

#### `function detectLanguage(filePath: string): string`

Detect programming language from file extension.

#### `function findSymbols(content: string, language: string, filePath: string, lineIndexer): SymbolMatch[]`

Find all symbols in content.

#### `function searchSymbols(content: string, symbolName: string, language: string, filePath: string, lineIndexer): SymbolMatch[]`

Find specific symbol by name.

### Find References

#### `interface ReferenceMatch`

- `definition`: Definition match
- `usages`: Array of usage matches
- `file`: File path
- `symbolName`: Symbol name

#### `interface FindReferencesOptions`

- `cwd`: Working directory
- `symbolName`: Symbol name to search for
- `extensions`: File extensions to include
- `ignore`: Ignore patterns
- `maxDepth`: Maximum directory depth

#### `async function findReferences(options: FindReferencesOptions): Promise<ReferenceMatch[]>`

Find all references to a symbol across files.

#### `async function findReferencesAcrossFiles(options: FindReferencesOptions): Promise<Map<string, ReferenceMatch[]>>`

Find references grouped by file.

#### `function countTotalUsages(references: ReferenceMatch[]): number`

Count total usages across all references.

#### `function getFilesWithMostUsages(references: ReferenceMatch[], limit?: number): Array<{ file: string; count: number }>`

Get files with most usages, sorted by count.

### Tree-sitter Integration (Scaffolding)

#### `interface ASTNode`

- `type`: Node type
- `startPosition`: Start position (row, column)
- `endPosition`: End position (row, column)
- `children`: Child nodes
- `text`: Node text

#### `interface TreeSitterOptions`

- `language`: Language identifier
- `includeNodeText`: Include node text in AST

#### `class TreeSitterParser`

Tree-sitter parser wrapper (requires `@tree-sitter/*` packages).

**Methods:**
- `isAvailable(): boolean`: Check if parser is initialized
- `async initialize(): Promise<void>`: Initialize parser (throws if packages not installed)
- `async parse(code: string): Promise<ASTNode | null>`: Parse code to AST
- `async query(ast: ASTNode, queryPattern: string): Promise<ASTNode[]>`: Query AST
- `async findFunctions(ast: ASTNode): Promise<ASTNode[]>`: Find function nodes
- `async findClasses(ast: ASTNode): Promise<ASTNode[]>`: Find class nodes
- `async findVariables(ast: ASTNode): Promise<ASTNode[]>`: Find variable nodes
- `async findReferences(ast: ASTNode, symbolName: string): Promise<ASTNode[]>`: Find references to symbol

#### `function createTreeSitterParser(options: TreeSitterOptions): TreeSitterParser`

Create a new TreeSitterParser instance.

#### `const SUPPORTED_LANGUAGES: string[]`

Array of supported language identifiers.
