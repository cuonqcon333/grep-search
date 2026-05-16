export function isBinary(buffer: Buffer): boolean {
  // NULL byte heuristic - if buffer contains NULL byte, it's likely binary
  return buffer.includes(0x00);
}
