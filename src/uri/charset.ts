export type EncodeSetName =
  | "unreserved"
  | "pchar"
  | "segment-nz-nc"
  | "path"
  | "query"
  | "fragment"
  | "userinfo"
  | "whatwg-path"
  | "whatwg-component"
  | "form"

export type EncodeSet = EncodeSetName | ((codePoint: number) => boolean)

function inChars(chars: string, cp: number): boolean {
  return cp < 0x80 && chars.indexOf(String.fromCodePoint(cp)) !== -1
}

export function isAlpha(cp: number): boolean {
  return (cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)
}

export function isDigit(cp: number): boolean {
  return cp >= 0x30 && cp <= 0x39
}

export function isHexDigit(cp: number): boolean {
  return isDigit(cp) || (cp >= 0x41 && cp <= 0x46) || (cp >= 0x61 && cp <= 0x66)
}

export function isScheme(text: string): boolean {
  return /^[A-Za-z][A-Za-z0-9+.-]*$/.test(text)
}

export function isUnreserved(cp: number): boolean {
  return isAlpha(cp) || isDigit(cp) || inChars("-._~", cp)
}

export function isGenDelim(cp: number): boolean {
  return inChars(":/?#[]@", cp)
}

export function isSubDelim(cp: number): boolean {
  return inChars("!$&'()*+,;=", cp)
}

export function isReserved(cp: number): boolean {
  return isGenDelim(cp) || isSubDelim(cp)
}

export function isPchar(cp: number): boolean {
  return isUnreserved(cp) || isSubDelim(cp) || cp === 0x3a || cp === 0x40
}

export function isSegmentNzNc(cp: number): boolean {
  return isUnreserved(cp) || isSubDelim(cp) || cp === 0x40
}

export function isQueryChar(cp: number): boolean {
  return isPchar(cp) || cp === 0x2f || cp === 0x3f
}

function isWhatwgPathSafe(cp: number): boolean {
  return cp >= 0x21 && cp <= 0x7e && !inChars('"#<>?^`{}', cp)
}

function isWhatwgComponentSafe(cp: number): boolean {
  return isWhatwgPathSafe(cp) && !inChars("/:;=@[\\]|$&+,", cp)
}

function isFormSafe(cp: number): boolean {
  return isAlpha(cp) || isDigit(cp) || inChars("*-._", cp)
}

const SETS: Readonly<Record<EncodeSetName, (codePoint: number) => boolean>> = {
  unreserved: isUnreserved,
  pchar: isPchar,
  "segment-nz-nc": isSegmentNzNc,
  path: (cp) => isPchar(cp) || cp === 0x2f,
  query: isQueryChar,
  fragment: isQueryChar,
  userinfo: (cp) => isUnreserved(cp) || isSubDelim(cp) || cp === 0x3a,
  "whatwg-path": isWhatwgPathSafe,
  "whatwg-component": isWhatwgComponentSafe,
  form: isFormSafe,
}

export function resolveEncodeSet(set: EncodeSet): (codePoint: number) => boolean {
  return typeof set === "function" ? set : SETS[set]
}
