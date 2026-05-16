import type { SearchQuery, SearchMatch } from '../types/index.js';
import { walkFiles } from '../fs/walker.js';
import { readFileStream } from '../fs/stream-reader.js';
import { detectEncoding } from '../parser/encoding.js';
import { isBinary } from '../parser/binary-detector.js';
import { LineIndexer } from '../parser/line-indexer.js';
import { matchLiteral, matchRegex, matchWholeWord, matchMultiline } from '../matcher/index.js';
import { SlidingBuffer } from './sliding-buffer.js';
import { buildMatch } from '../output/result-builder.js';
import { generateStableHash } from '../utils/hash.js';
import { ConcurrencyController } from '../utils/concurrency.js';
import { FileHashCache, computeFileHash } from '../cache/file-hash-cache.js';
import { LineMapCache } from '../cache/line-map-cache.js';
import { readFile } from 'fs/promises';

export async function* grepSearch(query: SearchQuery): AsyncGenerator<SearchMatch> {
  const {
    cwd,
    query: searchQuery,
    regex = false,
    wholeWord = false,
    caseSensitive = false,
    multiline = false,
    extensions,
    ignore,
    maxDepth,
    maxResults,
    maxConcurrency = 10,
    useCache = true,
    cacheTTL = 5 * 60 * 1000,
    cacheMaxSize = 1000,
  } = query;

  // Initialize performance features
  const concurrencyController = new ConcurrencyController(maxConcurrency);
  const fileHashCache = new FileHashCache({ maxSize: cacheMaxSize, ttl: cacheTTL });
  const lineMapCache = new LineMapCache({ maxSize: cacheMaxSize / 2, ttl: cacheTTL * 2 });

  const allMatches: SearchMatch[] = [];

  // Walk files
  for await (const filePath of walkFiles({
    cwd,
    extensions,
    maxDepth,
    includeHidden: false,
    followSymlinks: false,
    ignore,
  })) {
    // Check if we've reached max results
    if (maxResults && allMatches.length >= maxResults) {
      break;
    }

    // Process file with concurrency control
    await concurrencyController.run(async () => {
      try {
        // Check file hash cache if enabled
        let fileHash: string | null = null;
        if (useCache) {
          fileHash = await fileHashCache.get(filePath);
        }

        // Detect encoding
        const buffer = await readFile(filePath);
        if (isBinary(buffer)) {
          return; // Skip binary files
        }

        // Compute hash if not in cache
        if (!fileHash && useCache) {
          fileHash = await computeFileHash(filePath);
          await fileHashCache.set(filePath, fileHash);
        }

        const encoding = detectEncoding(buffer);

        // Initialize components
        const lineIndexer = new LineIndexer();
        const slidingBuffer = new SlidingBuffer({
          windowSize: 1024 * 1024, // 1MB window
          overlapSize: 1024, // 1KB overlap
        });

        // Stream file and search
        let totalChars = 0;
        
        for await (const chunk of readFileStream(filePath, {
          chunkSize: 64 * 1024,
          overlapSize: 1024,
          encoding,
        })) {
          // Feed to line indexer
          lineIndexer.feed(chunk.chunk, chunk.byteOffset);

          // Feed to sliding buffer
          slidingBuffer.feed(chunk.chunk, chunk.byteOffset);

          // Get current buffer
          const buffer = slidingBuffer.getBuffer();
          const bufferByteOffset = slidingBuffer.getBufferByteOffset();

          // Match
          let matches;
          if (regex) {
            matches = matchRegex(buffer, searchQuery, caseSensitive, multiline);
          } else if (wholeWord) {
            matches = matchWholeWord(buffer, searchQuery, caseSensitive);
          } else if (multiline) {
            matches = matchMultiline(buffer, searchQuery, caseSensitive);
          } else {
            matches = matchLiteral(buffer, searchQuery, caseSensitive);
          }

          // Process matches through sliding buffer for deduplication
          const deduplicatedMatches = slidingBuffer.processMatches(matches, filePath);

          // Build search matches
          for (const match of deduplicatedMatches) {
            const hash = generateStableHash(filePath, bufferByteOffset + match.charStart, match.text);
            const searchMatch = buildMatch({
              file: filePath,
              match,
              lineIndexer,
              byteOffset: bufferByteOffset,
              hash,
            });

            allMatches.push(searchMatch);

            if (maxResults && allMatches.length >= maxResults) {
              return;
            }
          }

          // Advance sliding buffer
          const processedChars = chunk.chunk.length - 1024; // Keep overlap
          slidingBuffer.advance(Math.max(0, processedChars));

          totalChars += chunk.chunk.length;

          if (maxResults && allMatches.length >= maxResults) {
            return;
          }
        }

        // Cache line maps if enabled
        if (useCache && fileHash) {
          lineMapCache.set(fileHash, lineIndexer['lines'], totalChars);
        }
      } catch (error) {
        // Skip files that can't be read
        return;
      }
    });
  }

  // Sort deterministically: file ASC, line ASC, column ASC, byteStart ASC
  allMatches.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.byteStart - b.byteStart;
  });

  // Emit matches
  for (const match of allMatches) {
    yield match;
  }
}
