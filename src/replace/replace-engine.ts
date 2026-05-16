import type { SearchMatch } from '../types/index.js';
import { applyPatch, type RangePatch } from '../patch/range-patch.js';

export interface ReplaceOptions {
  dryRun?: boolean;
}

export interface ReplaceResult {
  filePath: string;
  success: boolean;
  error?: string;
  replacements: number;
  bytesChanged: number;
}

export async function replaceMatch(
  match: SearchMatch,
  replacement: string,
  options: ReplaceOptions = {}
): Promise<ReplaceResult> {
  const { dryRun = false } = options;

  try {
    if (dryRun) {
      return {
        filePath: match.file,
        success: true,
        replacements: 1,
        bytesChanged: replacement.length - match.text.length,
      };
    }

    const patch: RangePatch = {
      filePath: match.file,
      byteStart: match.byteStart,
      byteEnd: match.byteEnd,
      replacement,
    };

    const result = await applyPatch(patch);

    if (!result.success) {
      return {
        filePath: match.file,
        success: false,
        error: result.error,
        replacements: 0,
        bytesChanged: 0,
      };
    }

    return {
      filePath: match.file,
      success: true,
      replacements: 1,
      bytesChanged: result.bytesChanged,
    };
  } catch (error) {
    return {
      filePath: match.file,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      replacements: 0,
      bytesChanged: 0,
    };
  }
}

export async function replaceMatches(
  matches: SearchMatch[],
  replacement: string,
  options: ReplaceOptions = {}
): Promise<ReplaceResult[]> {
  // Group matches by file
  const matchesByFile = new Map<string, SearchMatch[]>();
  for (const match of matches) {
    const fileMatches = matchesByFile.get(match.file) || [];
    fileMatches.push(match);
    matchesByFile.set(match.file, fileMatches);
  }

  const results: ReplaceResult[] = [];

  // Process each file
  for (const [filePath, fileMatches] of matchesByFile) {
    try {
      if (options.dryRun) {
        results.push({
          filePath,
          success: true,
          replacements: fileMatches.length,
          bytesChanged: fileMatches.length * (replacement.length - fileMatches[0].text.length),
        });
        continue;
      }

      // Sort matches by byteStart in descending order to avoid offset issues
      fileMatches.sort((a, b) => b.byteStart - a.byteStart);

      let totalReplacements = 0;
      let totalBytesChanged = 0;

      for (const match of fileMatches) {
        const result = await replaceMatch(match, replacement, options);
        if (result.success) {
          totalReplacements += result.replacements;
          totalBytesChanged += result.bytesChanged;
        } else {
          results.push(result);
          break;
        }
      }

      results.push({
        filePath,
        success: true,
        replacements: totalReplacements,
        bytesChanged: totalBytesChanged,
      });
    } catch (error) {
      results.push({
        filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        replacements: 0,
        bytesChanged: 0,
      });
    }
  }

  return results;
}

export function validateReplacement(
  original: string,
  replacement: string,
  language?: string
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Basic validation: check if replacement is empty
  if (!replacement) {
    warnings.push('Replacement is empty - this will delete content');
  }

  // Check for potential syntax issues in code files
  if (language === 'javascript' || language === 'typescript') {
    if (replacement.includes('()') && !original.includes('()')) {
      warnings.push('Replacement adds function call syntax - verify this is intended');
    }
  }

  // Check for bracket balance
  const countBrackets = (str: string, open: string, close: string) => {
    const openCount = (str.match(new RegExp('\\' + open, 'g')) || []).length;
    const closeCount = (str.match(new RegExp('\\' + close, 'g')) || []).length;
    return openCount - closeCount;
  };

  const originalParenDiff = countBrackets(original, '(', ')');
  const replacementParenDiff = countBrackets(replacement, '(', ')');

  if (originalParenDiff !== replacementParenDiff) {
    warnings.push('Bracket balance changed - verify this is intended');
  }

  const originalBraceDiff = countBrackets(original, '{', '}');
  const replacementBraceDiff = countBrackets(replacement, '{', '}');

  if (originalBraceDiff !== replacementBraceDiff) {
    warnings.push('Brace balance changed - verify this is intended');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
