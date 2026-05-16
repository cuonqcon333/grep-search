import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { TextDecoder } from 'util';
import type { Encoding } from '../parser/encoding.js';

export interface StreamReaderOptions {
  chunkSize?: number;
  overlapSize?: number;
  encoding: Encoding;
}

export interface ChunkResult {
  chunk: string;
  byteOffset: number;
  isLast: boolean;
}

export async function* readFileStream(
  filePath: string,
  options: StreamReaderOptions
): AsyncGenerator<ChunkResult> {
  const { chunkSize = 64 * 1024, overlapSize = 1024, encoding } = options;

  // For UTF-16, we need to read the entire file first to handle encoding properly
  if (encoding === 'utf-16le' || encoding === 'utf-16be') {
    yield* readUTF16Stream(filePath, encoding, chunkSize, overlapSize);
    return;
  }

  // For UTF-8, use streaming approach
  yield* readUTF8Stream(filePath, encoding, chunkSize, overlapSize);
}

async function* readUTF8Stream(
  filePath: string,
  _encoding: Encoding,
  chunkSize: number,
  overlapSize: number
): AsyncGenerator<ChunkResult> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let byteOffset = 0;
  let carryOver = '';

  const stream = createReadStream(filePath, {
    highWaterMark: chunkSize,
  });

  try {
    for await (const buffer of stream) {
      const decoded = decoder.decode(buffer, { stream: true });
      
      // Combine with carry over from previous chunk
      const combined = carryOver + decoded;
      
      // Determine where to split (keep overlap for next iteration)
      const splitPoint = combined.length - overlapSize;
      let chunk: string;
      
      if (splitPoint > 0) {
        chunk = combined.slice(0, splitPoint);
        carryOver = combined.slice(splitPoint);
      } else {
        chunk = combined;
        carryOver = '';
      }

      yield {
        chunk,
        byteOffset,
        isLast: false,
      };

      byteOffset += buffer.length;
    }

    // Flush remaining carry over
    if (carryOver) {
      yield {
        chunk: carryOver,
        byteOffset,
        isLast: true,
      };
    }
  } finally {
    stream.destroy();
  }
}

async function* readUTF16Stream(
  filePath: string,
  encoding: Encoding,
  chunkSize: number,
  overlapSize: number
): AsyncGenerator<ChunkResult> {
  // For UTF-16, read entire file and chunk the decoded string
  const buffer = await readFile(filePath);
  const decoder = new TextDecoder(encoding === 'utf-16le' ? 'utf-16le' : 'utf-16be');
  const text = decoder.decode(buffer);

  let byteOffset = 0;
  let charOffset = 0;
  
  while (charOffset < text.length) {
    const endCharOffset = Math.min(charOffset + chunkSize, text.length);
    const chunk = text.slice(charOffset, endCharOffset);
    
    yield {
      chunk,
      byteOffset,
      isLast: endCharOffset >= text.length,
    };

    // Calculate byte offset for next chunk
    const chunkText = text.slice(charOffset, endCharOffset);
    byteOffset += Buffer.byteLength(chunkText, encoding === 'utf-16le' ? 'utf-16le' : 'ucs2');
    charOffset = endCharOffset - overlapSize;
    
    if (charOffset < 0) charOffset = 0;
  }
}
