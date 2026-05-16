import { opendir, stat } from 'fs/promises';
import { join, relative, extname } from 'path';
import ignore from 'ignore';

export interface WalkOptions {
  cwd: string;
  extensions?: string[];
  maxDepth?: number;
  includeHidden?: boolean;
  followSymlinks?: boolean;
  ignore?: string[];
}

export async function* walkFiles(options: WalkOptions): AsyncGenerator<string> {
  const {
    cwd,
    extensions,
    maxDepth = Infinity,
    includeHidden = false,
    followSymlinks = false,
    ignore: ignorePatterns = [],
  } = options;

  const ig = ignore().add(ignorePatterns);
  
  // Collect all files first for deterministic ordering
  const files: string[] = [];

  async function collectFiles(dirPath: string, currentDepth: number): Promise<void> {
    if (currentDepth > maxDepth) {
      return;
    }

    try {
      const dir = await opendir(dirPath);
      
      const entries: { name: string; isDirectory: boolean; isSymbolicLink: boolean }[] = [];
      
      for await (const entry of dir) {
        entries.push({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          isSymbolicLink: entry.isSymbolicLink(),
        });
      }

      // Sort entries for deterministic traversal
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        const relPath = relative(cwd, fullPath);

        // Check hidden files
        if (!includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        // Check ignore patterns
        if (ig.ignores(relPath)) {
          continue;
        }

        if (entry.isDirectory) {
          await collectFiles(fullPath, currentDepth + 1);
        } else if (entry.isSymbolicLink) {
          if (followSymlinks) {
            try {
              const stats = await stat(fullPath);
              if (stats.isDirectory()) {
                await collectFiles(fullPath, currentDepth + 1);
              } else {
                addFile(fullPath, relPath);
              }
            } catch {
              // Broken symlink, skip
            }
          }
        } else {
          addFile(fullPath, relPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  function addFile(fullPath: string, relPath: string): void {
    // Check extension filter
    if (extensions && extensions.length > 0) {
      const ext = extname(relPath).slice(1).toLowerCase();
      if (!ext || !extensions.includes(ext)) {
        return;
      }
    }
    files.push(fullPath);
  }

  await collectFiles(cwd, 0);

  // Sort files by path ASC for deterministic output
  files.sort((a, b) => a.localeCompare(b));

  // Yield files in deterministic order
  for (const file of files) {
    yield file;
  }
}
