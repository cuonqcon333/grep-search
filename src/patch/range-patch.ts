import { readFile, writeFile } from 'fs/promises';

export interface RangePatch {
  filePath: string;
  byteStart: number;
  byteEnd: number;
  replacement: string;
}

export interface PatchResult {
  filePath: string;
  success: boolean;
  error?: string;
  originalSize: number;
  newSize: number;
  bytesChanged: number;
}

export function validatePatch(patch: RangePatch, fileSize: number): { valid: boolean; error?: string } {
  if (patch.byteStart < 0) {
    return { valid: false, error: 'byteStart must be >= 0' };
  }

  if (patch.byteEnd > fileSize) {
    return { valid: false, error: 'byteEnd exceeds file size' };
  }

  if (patch.byteStart > patch.byteEnd) {
    return { valid: false, error: 'byteStart must be <= byteEnd' };
  }

  return { valid: true };
}

export async function applyPatch(patch: RangePatch): Promise<PatchResult> {
  try {
    const buffer = await readFile(patch.filePath);
    const originalSize = buffer.length;

    // Validate patch
    const validation = validatePatch(patch, originalSize);
    if (!validation.valid) {
      return {
        filePath: patch.filePath,
        success: false,
        error: validation.error,
        originalSize,
        newSize: originalSize,
        bytesChanged: 0,
      };
    }

    // Extract content before and after the range
    const before = buffer.subarray(0, patch.byteStart);
    const after = buffer.subarray(patch.byteEnd);

    // Create replacement buffer
    const replacementBuffer = Buffer.from(patch.replacement, 'utf-8');

    // Combine buffers
    const newBuffer = Buffer.concat([before, replacementBuffer, after]);
    const newSize = newBuffer.length;

    // Write patched file
    await writeFile(patch.filePath, newBuffer);

    return {
      filePath: patch.filePath,
      success: true,
      originalSize,
      newSize,
      bytesChanged: newSize - originalSize,
    };
  } catch (error) {
    return {
      filePath: patch.filePath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      originalSize: 0,
      newSize: 0,
      bytesChanged: 0,
    };
  }
}

export async function applyPatches(patches: RangePatch[]): Promise<PatchResult[]> {
  const results: PatchResult[] = [];

  for (const patch of patches) {
    const result = await applyPatch(patch);
    results.push(result);
  }

  return results;
}

export function generateUnifiedDiff(
  original: string,
  modified: string,
  filePath: string
): string {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  let diff = `--- ${filePath}\n+++ ${filePath}\n`;

  let i = 0;
  let j = 0;

  while (i < originalLines.length || j < modifiedLines.length) {
    if (i < originalLines.length && j < modifiedLines.length && originalLines[i] === modifiedLines[j]) {
      i++;
      j++;
    } else {
      // Find the end of the change
      const originalStart = i;
      const modifiedStart = j;

      while (i < originalLines.length && (j >= modifiedLines.length || originalLines[i] !== modifiedLines[j])) {
        i++;
      }

      while (j < modifiedLines.length && (i >= originalLines.length || originalLines[i] !== modifiedLines[j])) {
        j++;
      }

      const originalEnd = i;
      const modifiedEnd = j;

      diff += `@@ -${originalStart + 1},${originalEnd - originalStart} +${modifiedStart + 1},${modifiedEnd - modifiedStart} @@\n`;

      for (let k = originalStart; k < originalEnd; k++) {
        diff += `-${originalLines[k]}\n`;
      }

      for (let k = modifiedStart; k < modifiedEnd; k++) {
        diff += `+${modifiedLines[k]}\n`;
      }
    }
  }

  return diff;
}
