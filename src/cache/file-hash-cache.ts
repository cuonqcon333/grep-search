import { createHash } from 'crypto';
import { stat } from 'fs/promises';

export interface CacheEntry {
  hash: string;
  mtime: number;
  size: number;
  timestamp: number;
}

export interface FileHashCacheOptions {
  maxSize?: number;
  ttl?: number; // milliseconds
}

export class FileHashCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(options: FileHashCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes
  }

  async get(filePath: string): Promise<string | null> {
    const entry = this.cache.get(filePath);
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(filePath);
      return null;
    }

    // Verify file hasn't changed
    try {
      const stats = await stat(filePath);
      if (stats.mtimeMs !== entry.mtime || stats.size !== entry.size) {
        this.cache.delete(filePath);
        return null;
      }

      return entry.hash;
    } catch {
      // File doesn't exist or can't be accessed
      this.cache.delete(filePath);
      return null;
    }
  }

  async set(filePath: string, hash: string): Promise<void> {
    try {
      const stats = await stat(filePath);
      
      const entry: CacheEntry = {
        hash,
        mtime: stats.mtimeMs,
        size: stats.size,
        timestamp: Date.now(),
      };

      // Evict if cache is full
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      this.cache.set(filePath, entry);
    } catch {
      // File doesn't exist or can't be accessed, don't cache
    }
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

export async function computeFileHash(filePath: string): Promise<string> {
  const { readFile } = await import('fs/promises');
  const buffer = await readFile(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}
