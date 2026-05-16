import type { SearchMatch, SearchQuery } from '../types/index.js';
import { grepSearch } from '../core/search.js';
import { findSymbols, detectLanguage } from '../symbol/symbol-search.js';
import { readFile } from 'fs/promises';
import { LineIndexer } from '../parser/line-indexer.js';

export interface ReferenceMatch {
  definition: SearchMatch;
  usages: SearchMatch[];
  file: string;
  symbolName: string;
}

export interface FindReferencesOptions {
  cwd: string;
  symbolName: string;
  extensions?: string[];
  ignore?: string[];
  maxDepth?: number;
}

export async function findReferences(options: FindReferencesOptions): Promise<ReferenceMatch[]> {
  const { cwd, symbolName, extensions, ignore, maxDepth } = options;

  // First, find all symbol definitions
  const definitions: SearchMatch[] = [];
  
  // Search for the symbol as a literal to find potential definitions
  const query: SearchQuery = {
    cwd,
    query: symbolName,
    extensions,
    ignore,
    maxDepth,
  };

  for await (const match of grepSearch(query)) {
    const language = detectLanguage(match.file);
    
    try {
      const content = await readFile(match.file, 'utf-8');
      const lineIndexer = new LineIndexer();
      lineIndexer.feed(content, 0);

      const symbols = findSymbols(content, language, match.file, lineIndexer);
      const symbolDefinitions = symbols.filter(s => s.symbolName === symbolName);

      if (symbolDefinitions.length > 0) {
        definitions.push(...symbolDefinitions);
      }
    } catch {
      // Skip files that can't be read
    }
  }

  // Group definitions by file
  const definitionsByFile = new Map<string, SearchMatch[]>();
  for (const def of definitions) {
    const fileDefs = definitionsByFile.get(def.file) || [];
    fileDefs.push(def);
    definitionsByFile.set(def.file, fileDefs);
  }

  // Find usages for each definition
  const results: ReferenceMatch[] = [];

  for (const [file, defs] of definitionsByFile) {
    // Search for all usages of the symbol in the file
    const fileQuery: SearchQuery = {
      cwd,
      query: symbolName,
      extensions,
      ignore,
      maxDepth,
    };

    const usages: SearchMatch[] = [];
    for await (const match of grepSearch(fileQuery)) {
      if (match.file === file) {
        // Filter out the definitions themselves
        const isDefinition = defs.some(def => 
          def.line === match.line && def.column === match.column
        );
        
        if (!isDefinition) {
          usages.push(match);
        }
      }
    }

    for (const def of defs) {
      results.push({
        definition: def,
        usages,
        file,
        symbolName,
      });
    }
  }

  return results;
}

export async function findReferencesAcrossFiles(
  options: FindReferencesOptions
): Promise<Map<string, ReferenceMatch[]>> {
  const references = await findReferences(options);
  
  // Group by file
  const byFile = new Map<string, ReferenceMatch[]>();
  for (const ref of references) {
    const fileRefs = byFile.get(ref.file) || [];
    fileRefs.push(ref);
    byFile.set(ref.file, fileRefs);
  }

  return byFile;
}

export function countTotalUsages(references: ReferenceMatch[]): number {
  return references.reduce((total, ref) => total + ref.usages.length, 0);
}

export function getFilesWithMostUsages(references: ReferenceMatch[], limit: number = 10): Array<{ file: string; count: number }> {
  const usageCount = new Map<string, number>();

  for (const ref of references) {
    const current = usageCount.get(ref.file) || 0;
    usageCount.set(ref.file, current + ref.usages.length);
  }

  return Array.from(usageCount.entries())
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
