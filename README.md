![grep-search](https://socialify.git.ci/cuonqcon333/grep-search/image?custom_description=Grep+Search&custom_language=TypeScript&description=1&font=Jost&language=1&name=1&owner=1&pattern=Solid&theme=Auto)

<p align="center">
  <a href="https://www.npmjs.com/package/@caplab/grep-search">
    <img src="https://badge.fury.io/js/@caplab%2Fgrep-search.svg" alt="npm version" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="license" />
  </a>
</p>


A fast, deterministic text search engine for codebases. Think of it as a modern, streaming `grep` built for AI agents and developers.

## Overview

`@caplab/grep-search` is a pure JavaScript/TypeScript search engine designed for:
- AI agents requiring deterministic, reproducible results
- Code search with precise line/column offsets
- Streaming architecture for memory-safe large repository searches
- Encoding-safe processing (UTF-8, UTF-16 LE/BE, BOM handling)

## Why use this?

- **Streaming**: Search large files without loading everything into memory
- **Accurate**: Get precise line/column numbers for every match
- **Deterministic**: Same search always returns the same results
- **Cross-platform**: Works on Windows, Linux, and macOS
- **TypeScript**: Full type safety and modern async API
- **Encoding-safe**: Handles UTF-8, UTF-16 LE/BE with BOM detection

## Installation

```bash
npm install @caplab/grep-search
```

## Quick Start

```javascript
import { grepSearch } from '@caplab/grep-search';

// Search for "const" in TypeScript files
for await (const match of grepSearch({
  cwd: './my-project',
  query: 'const',
  extensions: ['ts', 'js'],
})) {
  console.log(`${match.file}:${match.line}:${match.column} - ${match.text}`);
}
```

**Output:**
```
src/utils.ts:10:0 - const
src/api.ts:64:2 - const
src/config.ts:87:4 - const
```

## Requirements

- Node.js >= 20.0.0
- ESM-only (no CommonJS support)

## Common Use Cases

### Find all function declarations

```javascript
import { grepSearch } from '@caplab/grep-search';

for await (const match of grepSearch({
  cwd: './my-project',
  query: 'function',
  extensions: ['ts', 'js'],
})) {
  console.log(`${match.file}:${match.line} - ${match.text.trim()}`);
}
```

### Search with regex

```javascript
import { grepSearch } from '@caplab/grep-search';

for await (const match of grepSearch({
  cwd: './my-project',
  query: 'const\\s+\\w+\\s*=',
  regex: true,
  extensions: ['ts'],
})) {
  console.log(`${match.file}:${match.line} - ${match.text}`);
}
```

### Case-insensitive search

```javascript
import { grepSearch } from '@caplab/grep-search';

for await (const match of grepSearch({
  cwd: './my-project',
  query: 'useeffect',
  caseSensitive: false,
  extensions: ['ts', 'tsx'],
})) {
  console.log(`${match.file}:${match.line} - ${match.text}`);
}
```

### Whole word matching

```javascript
import { grepSearch } from '@caplab/grep-search';

for await (const match of grepSearch({
  cwd: './my-project',
  query: 'const',
  wholeWord: true,
  extensions: ['ts', 'js'],
})) {
  console.log(`${match.file}:${match.line} - ${match.text}`);
}
```

### Get context around matches

```javascript
import { grepSearch } from '@caplab/grep-search';

for await (const match of grepSearch({
  cwd: './my-project',
  query: 'export',
  extensions: ['ts'],
  beforeContext: 2,
  afterContext: 2,
})) {
  console.log(`\n${match.file}:${match.line}`);
  if (match.before) console.log('Before:', match.before.join('\n'));
  console.log('Match:', match.text);
  if (match.after) console.log('After:', match.after.join('\n'));
}
```

## API Reference

### Search Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cwd` | string | required | Directory to search |
| `query` | string | required | Text or pattern to find |
| `regex` | boolean | false | Use regex pattern |
| `wholeWord` | boolean | false | Match whole words only |
| `caseSensitive` | boolean | false | Case-sensitive search |
| `multiline` | boolean | false | Enable multiline patterns |
| `extensions` | string[] | all | File extensions to include |
| `ignore` | string[] | none | Ignore patterns (gitignore-style) |
| `maxDepth` | number | none | Max directory depth |
| `beforeContext` | number | 0 | Lines before match |
| `afterContext` | number | 0 | Lines after match |
| `maxResults` | number | none | Max results to return |
| `maxConcurrency` | number | 10 | Max concurrent file operations |
| `useCache` | boolean | true | Enable caching |
| `cacheTTL` | number | 300000 | Cache TTL in ms |
| `cacheMaxSize` | number | 1000 | Max cache size |

### Match Result

```javascript
{
  file: 'src/api.ts',           // File path
  line: 63,                    // Line number (1-indexed)
  column: 0,                   // Column number (0-indexed)
  endLine: 63,
  endColumn: 8,
  byteStart: 1234,             // Byte offset in file
  byteEnd: 1242,
  charStart: 1234,             // Character offset
  charEnd: 1242,
  text: 'function',            // Matched text
  match: 'function',
  before: ['// comment'],      // Context before
  after: ['  const x = 1;'],   // Context after
  hash: 'abc123...'            // Stable hash
}
```

### `grepSearch(options: SearchQuery): AsyncGenerator<SearchMatch>`

Main search function. Returns an async generator that yields search matches.

## Features

### Core Capabilities

- **Streaming**: Memory-safe processing of large files
- **Deterministic**: Same input always produces same output
- **Encoding-safe**: UTF-8, UTF-16 LE/BE, BOM handling
- **Accurate**: Precise line/column and byte/char mapping
- **Cross-platform**: Works on Windows, Linux, macOS
- **Async**: Modern async generator API
- **Caching**: Built-in file and line map caching
- **Concurrent**: Configurable concurrent file operations

### Search Modes

- **Literal search**: Exact string matching
- **Regex search**: Full JavaScript regex support
- **Whole word**: Boundary-aware matching
- **Case insensitive**: Case folding support
- **Multiline**: Cross-line pattern matching

## Global Invariants

These invariants hold at all times:

1. **Match Uniqueness**: A match is defined only once (no duplicates allowed)
2. **Line/Column Space**: Line/column maps to decoded string space (NOT raw bytes)
3. **Byte Offset Space**: Byte offset maps to original file space (for stable references)
4. **Determinism**: Output is deterministic across runs (same input → same output)
5. **Boundary Safety**: No chunk boundary affects correctness (no missed/duplicate matches)

## Deterministic Ordering

Results are sorted in this order:
1. File path (ASC)
2. Line number (ASC)
3. Column number (ASC)
4. Byte offset (ASC) - **Critical tie-breaker**

## Performance

- Line indexing: 30k lines in ~10ms
- Literal matching: 10k occurrences in ~1.5ms
- Regex matching: 10k occurrences in ~4.5ms
- Hash generation: 85k ops/sec
- File hash cache: 20k ops/sec
- Line map cache: 1.7M ops/sec

## Testing

```bash
cd active/grep-search
npm run build
node test-script.mjs
```

This tests the package on a real project and works on both Windows and Linux.

## Development

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run dev
```

### Project Structure

```
.
├── src/              # Source code
│   ├── core/        # Core search engine
│   ├── fs/          # File system utilities
│   ├── matcher/     # Pattern matchers
│   ├── parser/      # Encoding and parsing
│   ├── cache/       # Caching utilities
│   ├── output/      # Output formatting
│   ├── patch/       # Patch application
│   ├── reference/   # Reference finding
│   ├── replace/     # Replace engine
│   ├── symbol/      # Symbol search
│   ├── ast/         # AST integration
│   ├── utils/       # Utilities
│   └── types/       # TypeScript types
├── tests/           # Test files
├── benchmarks/      # Performance benchmarks
├── docs/           # Documentation
├── dist/           # Compiled output
└── package.json
```

## Contributing

This is a core infrastructure package. Contributions should focus on:
- Correctness improvements
- Determinism guarantees
- Edge case handling
- Performance optimizations

Please ensure all tests pass and coverage remains ≥ 90%.

### Commit Guidelines

- Use conventional commit format (feat:, fix:, docs:, etc.)
- Add tests for new features
- Update documentation as needed
- Ensure TypeScript compilation succeeds
- Run tests before pushing

## License

MIT License - see LICENSE file for details

## Links

- [API Documentation](docs/API.md)
- [GitHub Repository](https://github.com/cuonqcon333/grep-search)

## Support

For issues, questions, or contributions, please visit our GitHub repository.
