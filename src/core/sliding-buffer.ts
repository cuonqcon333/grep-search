import type { MatchResult } from '../types/index.js';

export interface SlidingBufferOptions {
  windowSize: number;
  overlapSize: number;
}

export class SlidingBuffer {
  private buffer: string = '';
  private byteOffset: number = 0;
  private processedByteOffset: number = 0;
  private seenMatches: Set<string> = new Set();

  constructor(_options: SlidingBufferOptions) {
    // Options stored for future use
  }

  feed(chunk: string, chunkByteOffset: number): void {
    this.buffer += chunk;
    this.byteOffset = chunkByteOffset;
  }

  getBuffer(): string {
    return this.buffer;
  }

  getBufferByteOffset(): number {
    return this.byteOffset;
  }

  getProcessedByteOffset(): number {
    return this.processedByteOffset;
  }

  processMatches(matches: MatchResult[], filePath: string): MatchResult[] {
    const deduplicated: MatchResult[] = [];

    for (const match of matches) {
      const absoluteByteStart = this.byteOffset + match.charStart;
      const matchKey = `${filePath}:${absoluteByteStart}`;

      // Deduplicate using (file + byteStart) hash
      if (!this.seenMatches.has(matchKey)) {
        this.seenMatches.add(matchKey);
        deduplicated.push(match);
      }
    }

    return deduplicated;
  }

  advance(processedChars: number): void {
    this.buffer = this.buffer.slice(processedChars);
    this.processedByteOffset = this.byteOffset + processedChars;
  }

  reset(): void {
    this.buffer = '';
    this.byteOffset = 0;
    this.processedByteOffset = 0;
    this.seenMatches.clear();
  }
}
