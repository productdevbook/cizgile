import { type EncodeSet, isUnreserved, keepPredicate } from "./charset"
import { encodeUtf8, hexByte, readHexByte, readUtf8 } from "./utf8"

/** Percent-encodes `input` as UTF-8 with uppercase hex, leaving the characters `keep` names untouched; `"form"` also turns spaces into `+`. */
export function percentEncode(input: string, keep: EncodeSet = "unreserved"): string {
  const keepFn = keepPredicate(keep)
  const plusForSpace = keep === "form"
  const length = input.length
  let i = 0
  while (i < length) {
    const code = input.codePointAt(i) ?? 0
    if (code >= 0x80 || !keepFn(code)) break
    i += 1
  }
  if (i === length) return input
  let out = input.slice(0, i)
  for (const ch of input.slice(i)) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80 && keepFn(cp)) {
      out += ch
    } else if (plusForSpace && cp === 0x20) {
      out += "+"
    } else {
      out += encodeUtf8(cp)
    }
  }
  return out
}

/** Options for `percentDecode`. */
export interface PercentDecodeOptions {
  /** Decodes `+` as a space, as `application/x-www-form-urlencoded` does. */
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

/** Decodes every `%XX` sequence as UTF-8; malformed bytes become U+FFFD and lone `%` is kept. */
export function percentDecode(input: string, options: PercentDecodeOptions = {}): string {
  if (!input.includes("%") && !(options.plusAsSpace === true && input.includes("+"))) return input
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

/** RFC 3986 section 6.2.2.2: decodes percent-encoded `unreserved` characters and uppercases the hex of the rest. */
export function normalizePercentEncoding(input: string): string {
  if (!input.includes("%")) return input
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
