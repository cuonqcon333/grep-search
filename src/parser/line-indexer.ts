import type { LineMap } from '../types/index.js';

export class LineIndexer {
  private lines: LineMap[] = [];
  private totalChars = 0;
  private totalBytes = 0;

  feed(chunk: string, byteOffset: number): void {
    let charOffset = 0;
    let chunkByteOffset = byteOffset;

    while (charOffset < chunk.length) {
      const newlineIndex = chunk.indexOf('\n', charOffset);
      
      if (newlineIndex === -1) {
        // No more newlines in this chunk
        this.lines.push({
          line: this.lines.length,
          charOffset: this.totalChars + charOffset,
          byteOffset: this.totalBytes + chunkByteOffset,
        });
        break;
      }

      // Found a newline
      this.lines.push({
        line: this.lines.length,
        charOffset: this.totalChars + charOffset,
        byteOffset: this.totalBytes + chunkByteOffset,
      });

      // Move past the newline
      const newlineLength = this.getNewlineLength(chunk, newlineIndex);
      charOffset = newlineIndex + newlineLength;
      
      // Estimate byte offset for the newline (this is approximate for UTF-8)
      // For accurate byte mapping, we'd need to track the actual byte positions
      // This is a simplified version - in production, you'd want to track exact byte positions
      chunkByteOffset += this.estimateByteLength(chunk.slice(newlineIndex, newlineIndex + newlineLength));
    }

    this.totalChars += chunk.length;
    // In production, track actual bytes read from stream
    this.totalBytes = byteOffset + this.estimateByteLength(chunk);
  }

  getLine(charOffset: number): number {
    // Binary search for the line containing this char offset
    let left = 0;
    let right = this.lines.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const lineMap = this.lines[mid];

      if (charOffset < lineMap.charOffset) {
        right = mid - 1;
      } else if (charOffset >= lineMap.charOffset && 
                 (mid === this.lines.length - 1 || charOffset < this.lines[mid + 1].charOffset)) {
        return lineMap.line;
      } else {
        left = mid + 1;
      }
    }

    return 0;
  }

  getColumn(charOffset: number): number {
    const line = this.getLine(charOffset);
    const lineMap = this.lines[line];
    if (!lineMap) return 0;
    return charOffset - lineMap.charOffset;
  }

  getLineOffset(line: number): { byte: number; char: number } {
    const lineMap = this.lines[line];
    if (!lineMap) return { byte: 0, char: 0 };
    return { byte: lineMap.byteOffset, char: lineMap.charOffset };
  }

  charToByte(charOffset: number): number {
    const line = this.getLine(charOffset);
    const lineMap = this.lines[line];
    if (!lineMap) return 0;
    
    const column = charOffset - lineMap.charOffset;
    // Estimate byte offset (simplified - in production, track exact bytes)
    return lineMap.byteOffset + column; // Assumes 1 char = 1 byte (UTF-8 ASCII case)
  }

  private getNewlineLength(chunk: string, index: number): number {
    // Check for CRLF
    if (index + 1 < chunk.length && chunk[index] === '\r' && chunk[index + 1] === '\n') {
      return 2;
    }
    return 1; // LF or CR
  }

  private estimateByteLength(str: string): number {
    // Simplified estimation - in production, use actual Buffer.byteLength
    return Buffer.byteLength(str, 'utf-8');
  }

  get totalLines(): number {
    return this.lines.length;
  }
}
