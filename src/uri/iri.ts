import { isReserved, isUnreserved } from "./charset"
import { hexByte, readHexByte, readUtf8, utf8Bytes } from "./utf8"

export function isUcschar(cp: number): boolean {
  return (
    (cp >= 0xa0 && cp <= 0xd7ff) ||
    (cp >= 0xf900 && cp <= 0xfdcf) ||
    (cp >= 0xfdf0 && cp <= 0xffef) ||
    (cp >= 0x10000 && cp <= 0xefffd && (cp & 0xffff) <= 0xfffd && !(cp >= 0xe0000 && cp <= 0xe0fff))
  )
}

export function isIprivate(cp: number): boolean {
  return (
    (cp >= 0xe000 && cp <= 0xf8ff) ||
    (cp >= 0xf0000 && cp <= 0xffffd) ||
    (cp >= 0x100000 && cp <= 0x10fffd)
  )
}

const BIDI_CONTROLS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/u
const BIDI_CONTROLS_GLOBAL = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu

export function isBidiControl(cp: number): boolean {
  return (
    cp === 0x200e ||
    cp === 0x200f ||
    (cp >= 0x202a && cp <= 0x202e) ||
    (cp >= 0x2066 && cp <= 0x2069)
  )
}

export function hasBidiControls(input: string): boolean {
  return BIDI_CONTROLS.test(input)
}

export interface IriToUriOptions {
  readonly bidi?: "throw" | "strip"
  readonly nfc?: boolean
}

export function iriToUri(iri: string, options: IriToUriOptions = {}): string {
  let input = iri
  if (hasBidiControls(input)) {
    if ((options.bidi ?? "throw") === "throw") {
      throw new RangeError("IRI contains bidi formatting characters (RFC 3987 section 4.1)")
    }
    input = input.replace(BIDI_CONTROLS_GLOBAL, "")
  }
  if (options.nfc === true) input = input.normalize("NFC")
  let out = ""
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80 && (isUnreserved(cp) || isReserved(cp) || cp === 0x25)) {
      out += ch
    } else {
      for (const byte of utf8Bytes(cp)) out += hexByte(byte)
    }
  }
  return out
}

export function uriToIri(uri: string): string {
  let out = ""
  let i = 0
  while (i < uri.length) {
    const first = readHexByte(uri, i)
    if (first === -1) {
      out += uri.charAt(i)
      i += 1
      continue
    }
    const bytes: number[] = []
    let j = i
    for (let byte = first; byte !== -1; byte = readHexByte(uri, j)) {
      bytes.push(byte)
      j += 3
    }
    let k = 0
    while (k < bytes.length) {
      const char = readUtf8(bytes, k)
      if (
        char !== undefined &&
        (isUnreserved(char.codePoint) ||
          (isUcschar(char.codePoint) && !isBidiControl(char.codePoint)))
      ) {
        out += String.fromCodePoint(char.codePoint)
        k += char.length
      } else {
        out += uri.slice(i + k * 3, i + k * 3 + 3)
        k += 1
      }
    }
    i = j
  }
  return out
}
