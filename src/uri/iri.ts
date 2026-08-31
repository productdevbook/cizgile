import { isReserved, isSubDelim, isUnreserved } from "./charset"
import { parseUri, serializeUri } from "./parse"
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

const BIDI_CONTROLS = /\p{Bidi_Control}/u
const BIDI_CONTROLS_GLOBAL = /\p{Bidi_Control}/gu
const IRI_ASCII_MAY_ENCODE = '<>"{}|\\^` '

export function isBidiControl(cp: number): boolean {
  return (
    cp === 0x061c ||
    cp === 0x200e ||
    cp === 0x200f ||
    (cp >= 0x202a && cp <= 0x202e) ||
    (cp >= 0x2066 && cp <= 0x2069)
  )
}

export function hasBidiControls(input: string): boolean {
  return BIDI_CONTROLS.test(input)
}

export function isIunreserved(cp: number): boolean {
  return isUnreserved(cp) || (isUcschar(cp) && !isBidiControl(cp))
}

export function isIpchar(cp: number): boolean {
  return isIunreserved(cp) || isSubDelim(cp) || cp === 0x3a || cp === 0x40
}

export interface IriToUriOptions {
  readonly bidi?: "throw" | "strip"
  readonly nfc?: boolean
  readonly strict?: boolean
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
  const strict = options.strict ?? false
  let out = ""
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80 && (isUnreserved(cp) || isReserved(cp) || cp === 0x25)) {
      out += ch
      continue
    }
    if (
      strict &&
      !(cp < 0x80 ? IRI_ASCII_MAY_ENCODE.includes(ch) : isUcschar(cp) || isIprivate(cp))
    ) {
      throw new RangeError(
        `iriToUri: U+${cp.toString(16).toUpperCase().padStart(4, "0")} is not allowed in an IRI`,
      )
    }
    for (const byte of utf8Bytes(cp)) out += hexByte(byte)
  }
  return out
}

function decodeComponent(text: string, allowPrivate: boolean): string {
  let out = ""
  let i = 0
  while (i < text.length) {
    const first = readHexByte(text, i)
    if (first === -1) {
      out += text.charAt(i)
      i += 1
      continue
    }
    const bytes: number[] = []
    let j = i
    for (let byte = first; byte !== -1; byte = readHexByte(text, j)) {
      bytes.push(byte)
      j += 3
    }
    let k = 0
    while (k < bytes.length) {
      const char = readUtf8(bytes, k)
      const cp = char?.codePoint ?? -1
      if (
        char !== undefined &&
        (isUnreserved(cp) ||
          (isUcschar(cp) && !isBidiControl(cp)) ||
          (allowPrivate && isIprivate(cp)))
      ) {
        out += String.fromCodePoint(cp)
        k += char.length
      } else {
        out += text.slice(i + k * 3, i + k * 3 + 3)
        k += 1
      }
    }
    i = j
  }
  return out
}

export function uriToIri(uri: string): string {
  const c = parseUri(uri)
  if (
    c.scheme === undefined &&
    c.authority === undefined &&
    c.query === undefined &&
    c.fragment === undefined
  ) {
    return decodeComponent(uri, false)
  }
  if (c.authority !== undefined) c.authority = decodeComponent(c.authority, false)
  c.path = decodeComponent(c.path, false)
  if (c.query !== undefined) c.query = decodeComponent(c.query, true)
  if (c.fragment !== undefined) c.fragment = decodeComponent(c.fragment, false)
  return serializeUri(c)
}
