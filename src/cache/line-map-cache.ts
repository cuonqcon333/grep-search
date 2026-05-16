import type { LineMap } from '../types/index.js';

export interface LineMapCacheEntry {
  lineMaps: LineMap[];
  totalChars: number;
  timestamp: number;
}

export interface LineMapCacheOptions {
  maxSize?: number;
  ttl?: number; // milliseconds
}

export class LineMapCache {
  private cache: Map<string, LineMapCacheEntry> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(options: LineMapCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 500;
    this.ttl = options.ttl ?? 10 * 60 * 1000; // 10 minutes
  }

  get(fileHash: string): LineMapCacheEntry | null {
    const entry = this.cache.get(fileHash);
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(fileHash);
      return null;
    }

    return entry;
  }

  set(fileHash: string, lineMaps: LineMap[], totalChars: number): void {
    const entry: LineMapCacheEntry = {
      lineMaps,
      totalChars,
      timestamp: Date.now(),
    };

    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(fileHash, entry);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  get stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}
