import { describe, it, expect } from 'vitest';
import { walkFiles } from '../src/fs/walker.js';
import { detectEncoding } from '../src/parser/encoding.js';
import { LineIndexer } from '../src/parser/line-indexer.js';
import { matchLiteral, matchRegex } from '../src/matcher/index.js';
import { FileHashCache } from '../src/cache/file-hash-cache.js';
import { LineMapCache } from '../src/cache/line-map-cache.js';
import { ConcurrencyController } from '../src/utils/concurrency.js';
import { generateStableHash } from '../src/utils/hash.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Performance Benchmarks', () => {
  it('should benchmark line indexing', () => {
    const indexer = new LineIndexer();
    const text = 'line1\nline2\nline3\n'.repeat(10000);
    
    const start = performance.now();
    indexer.feed(text, 0);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`Line indexing 30k lines: ${duration.toFixed(2)}ms`);
    
    // Should complete in reasonable time (< 100ms)
    expect(duration).toBeLessThan(100);
  });

  it('should benchmark literal matching', () => {
    const text = 'hello world '.repeat(10000);
    const pattern = 'hello';
    
    const start = performance.now();
    const matches = matchLiteral(text, pattern, true);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`Literal matching 10k occurrences: ${duration.toFixed(2)}ms, found ${matches.length} matches`);
    
    expect(matches.length).toBe(10000);
    expect(duration).toBeLessThan(50);
  });

  it('should benchmark regex matching', () => {
    const text = 'test123 '.repeat(10000);
    const pattern = 'test\\d+';
    
    const start = performance.now();
    const matches = matchRegex(text, pattern, true, false);
    const end = performance.now();
    
    const duration = end - start;
    console.log(`Regex matching 10k occurrences: ${duration.toFixed(2)}ms, found ${matches.length} matches`);
    
    expect(matches.length).toBe(10000);
    expect(duration).toBeLessThan(100);
  });

  it('should benchmark hash generation', () => {
    const iterations = 1000;
    
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      generateStableHash('file.ts', 100, 'match');
    }
    const end = performance.now();
    
    const duration = end - start;
    const opsPerSec = (iterations / duration) * 1000;
    console.log(`Hash generation: ${opsPerSec.toFixed(0)} ops/sec (${duration.toFixed(2)}ms for ${iterations} ops)`);
    
    expect(opsPerSec).toBeGreaterThan(1000);
  });

  it('should benchmark concurrency control', async () => {
    const controller = new ConcurrencyController(5);
    const tasks = Array.from({ length: 20 }, (_, i) => 
      () => new Promise(resolve => setTimeout(() => resolve(i), 10))
    );
    
    const start = performance.now();
    const results = await Promise.all(tasks.map(task => controller.run(task)));
    const end = performance.now();
    
    const duration = end - start;
    console.log(`Concurrency control (5 concurrent, 20 tasks): ${duration.toFixed(2)}ms`);
    
    // With 5 concurrent tasks and 10ms each, should complete in ~40ms
    expect(duration).toBeLessThan(100);
    expect(results).toHaveLength(20);
  });

  it('should benchmark file hash cache', async () => {
    const cache = new FileHashCache({ maxSize: 100, ttl: 60000 });
    
    // Simulate cache operations
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await cache.set(`file${i % 100}.ts`, `hash${i}`);
    }
    
    for (let i = 0; i < iterations; i++) {
      await cache.get(`file${i % 100}.ts`);
    }
    
    const end = performance.now();
    const duration = end - start;
    const opsPerSec = (iterations * 2 / duration) * 1000;
    
    console.log(`File hash cache: ${opsPerSec.toFixed(0)} ops/sec (${duration.toFixed(2)}ms for ${iterations * 2} ops)`);
    
    expect(cache.size).toBeLessThanOrEqual(100);
    expect(opsPerSec).toBeGreaterThan(5000); // More lenient for CI environments
  });

  it('should benchmark line map cache', () => {
    const cache = new LineMapCache({ maxSize: 100, ttl: 60000 });
    
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const lineMaps = [{ line: i, charOffset: i * 10, byteOffset: i * 10 }];
      cache.set(`hash${i % 100}`, lineMaps, i * 10);
    }
    
    for (let i = 0; i < iterations; i++) {
      cache.get(`hash${i % 100}`);
    }
    
    const end = performance.now();
    const duration = end - start;
    const opsPerSec = (iterations * 2 / duration) * 1000;
    
    console.log(`Line map cache: ${opsPerSec.toFixed(0)} ops/sec (${duration.toFixed(2)}ms for ${iterations * 2} ops)`);
    
    expect(cache.size).toBeLessThanOrEqual(100);
    expect(opsPerSec).toBeGreaterThan(10000);
  });
});
