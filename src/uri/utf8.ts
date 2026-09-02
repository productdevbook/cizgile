const HEX = "0123456789ABCDEF"
const HEX_BYTES: string[] = []
for (let byte = 0; byte < 256; byte++) HEX_BYTES.push("%" + HEX[byte >> 4] + HEX[byte & 15])

const NIBBLES = new Int8Array(128).fill(-1)
for (let i = 0; i < 16; i++) {
  NIBBLES[HEX.codePointAt(i) ?? 0] = i
  NIBBLES[HEX.toLowerCase().codePointAt(i) ?? 0] = i
}

export function hexByte(byte: number): string {
  return HEX_BYTES[byte] ?? ""
}

export function encodeUtf8(codePoint: number): string {
  const cp = codePoint >= 0xd800 && codePoint <= 0xdfff ? 0xfffd : codePoint
  if (cp < 0x80) return hexByte(cp)
  if (cp < 0x800) return hexByte(0xc0 | (cp >> 6)) + hexByte(0x80 | (cp & 63))
  if (cp < 0x10000) {
    return hexByte(0xe0 | (cp >> 12)) + hexByte(0x80 | ((cp >> 6) & 63)) + hexByte(0x80 | (cp & 63))
  }
  return (
    hexByte(0xf0 | (cp >> 18)) +
    hexByte(0x80 | ((cp >> 12) & 63)) +
    hexByte(0x80 | ((cp >> 6) & 63)) +
    hexByte(0x80 | (cp & 63))
  )
}

export function utf8Bytes(codePoint: number): number[] {
  const cp = codePoint >= 0xd800 && codePoint <= 0xdfff ? 0xfffd : codePoint
  if (cp < 0x80) return [cp]
  if (cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 63)]
  if (cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)]
  return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)]
}

export interface Utf8Char {
  readonly codePoint: number
  readonly length: number
}

function isContinuation(byte: number | undefined): byte is number {
  return byte !== undefined && (byte & 0xc0) === 0x80
}

export function readUtf8(bytes: readonly number[], index: number): Utf8Char | undefined {
  const b0 = bytes[index]
  if (b0 === undefined) return undefined
  if (b0 < 0x80) return { codePoint: b0, length: 1 }
  const b1 = bytes[index + 1]
  if (b0 >= 0xc2 && b0 <= 0xdf) {
    if (!isContinuation(b1)) return undefined
    return { codePoint: ((b0 & 0x1f) << 6) | (b1 & 63), length: 2 }
  }
  const b2 = bytes[index + 2]
  if (b0 >= 0xe0 && b0 <= 0xef) {
    if (!isContinuation(b1) || !isContinuation(b2)) return undefined
    if (b0 === 0xe0 && b1 < 0xa0) return undefined
    if (b0 === 0xed && b1 > 0x9f) return undefined
    return { codePoint: ((b0 & 0x0f) << 12) | ((b1 & 63) << 6) | (b2 & 63), length: 3 }
  }
  const b3 = bytes[index + 3]
  if (b0 >= 0xf0 && b0 <= 0xf4) {
    if (!isContinuation(b1) || !isContinuation(b2) || !isContinuation(b3)) return undefined
    if (b0 === 0xf0 && b1 < 0x90) return undefined
    if (b0 === 0xf4 && b1 > 0x8f) return undefined
    return {
      codePoint: ((b0 & 0x07) << 18) | ((b1 & 63) << 12) | ((b2 & 63) << 6) | (b3 & 63),
      length: 4,
    }
  }
  return undefined
}

function nibble(code: number | undefined): number {
  return code !== undefined && code < 128 ? (NIBBLES[code] ?? -1) : -1
}

export function readHexByte(input: string, index: number): number {
  if (input.codePointAt(index) !== 0x25) return -1
  const hi = nibble(input.codePointAt(index + 1))
  const lo = nibble(input.codePointAt(index + 2))
  return hi < 0 || lo < 0 ? -1 : hi * 16 + lo
}
