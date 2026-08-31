import { type EncodeSet, isUnreserved, resolveEncodeSet } from "./charset"
import { hexByte, readHexByte, readUtf8, utf8Bytes } from "./utf8"

export function percentEncode(input: string, keep: EncodeSet = "unreserved"): string {
  const keepFn = resolveEncodeSet(keep)
  const plusForSpace = keep === "form"
  let out = ""
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80 && keepFn(cp)) {
      out += ch
    } else if (plusForSpace && cp === 0x20) {
      out += "+"
    } else {
      for (const byte of utf8Bytes(cp)) out += hexByte(byte)
    }
  }
  return out
}

export interface PercentDecodeOptions {
  readonly plusAsSpace?: boolean
}

function decodeBytes(bytes: readonly number[]): string {
  let out = ""
  let i = 0
  while (i < bytes.length) {
    const char = readUtf8(bytes, i)
    if (char === undefined) {
      out += "�"
      i += 1
    } else {
      out += String.fromCodePoint(char.codePoint)
      i += char.length
    }
  }
  return out
}

export function percentDecode(input: string, options: PercentDecodeOptions = {}): string {
  let out = ""
  let i = 0
  const bytes: number[] = []
  while (i < input.length) {
    const byte = readHexByte(input, i)
    if (byte !== -1) {
      bytes.push(byte)
      i += 3
      continue
    }
    if (bytes.length > 0) {
      out += decodeBytes(bytes)
      bytes.length = 0
    }
    const ch = input.charAt(i)
    out += options.plusAsSpace && ch === "+" ? " " : ch
    i += 1
  }
  if (bytes.length > 0) out += decodeBytes(bytes)
  return out
}

export function normalizePercentEncoding(input: string): string {
  let out = ""
  let i = 0
  while (i < input.length) {
    const byte = readHexByte(input, i)
    if (byte === -1) {
      out += input.charAt(i)
      i += 1
    } else {
      out += isUnreserved(byte) ? String.fromCodePoint(byte) : hexByte(byte)
      i += 3
    }
  }
  return out
}
