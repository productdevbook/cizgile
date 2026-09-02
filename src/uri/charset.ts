/** The named keep-sets `percentEncode` understands: the RFC 3986 productions and the WHATWG percent-encode sets. */
export type EncodeSetName =
  | "unreserved"
  | "pchar"
  | "segment-nz-nc"
  | "path"
  | "query"
  | "fragment"
  | "userinfo"
  | "whatwg-c0-control"
  | "whatwg-fragment"
  | "whatwg-query"
  | "whatwg-special-query"
  | "whatwg-path"
  | "whatwg-userinfo"
  | "whatwg-component"
  | "form"

/** A named keep-set or a predicate over code points that returns true for characters to leave unencoded. */
export type EncodeSet = EncodeSetName | ((codePoint: number) => boolean)

function inChars(chars: string, cp: number): boolean {
  return cp < 0x80 && chars.indexOf(String.fromCodePoint(cp)) !== -1
}

function table(predicate: (cp: number) => boolean): Uint8Array {
  const out = new Uint8Array(128)
  for (let cp = 0; cp < 128; cp++) if (predicate(cp)) out[cp] = 1
  return out
}

/** RFC 3986 `ALPHA`. */
export function isAlpha(cp: number): boolean {
  return (cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)
}

/** RFC 3986 `DIGIT`. */
export function isDigit(cp: number): boolean {
  return cp >= 0x30 && cp <= 0x39
}

/** RFC 3986 `HEXDIG`, either case. */
export function isHexDigit(cp: number): boolean {
  return isDigit(cp) || (cp >= 0x41 && cp <= 0x46) || (cp >= 0x61 && cp <= 0x66)
}

/** Whether `text` is a valid RFC 3986 `scheme`: a letter followed by letters, digits, `+`, `-` or `.`. */
export function isScheme(text: string): boolean {
  return /^[A-Za-z][A-Za-z0-9+.-]*$/.test(text)
}

const UNRESERVED = /* @__PURE__ */ table((cp) => isAlpha(cp) || isDigit(cp) || inChars("-._~", cp))
const GEN_DELIMS = /* @__PURE__ */ table((cp) => inChars(":/?#[]@", cp))
const SUB_DELIMS = /* @__PURE__ */ table((cp) => inChars("!$&'()*+,;=", cp))
const PCHAR = /* @__PURE__ */ table(
  (cp) => UNRESERVED[cp] === 1 || SUB_DELIMS[cp] === 1 || cp === 0x3a || cp === 0x40,
)
const SEGMENT_NZ_NC = /* @__PURE__ */ table(
  (cp) => UNRESERVED[cp] === 1 || SUB_DELIMS[cp] === 1 || cp === 0x40,
)
const QUERY = /* @__PURE__ */ table((cp) => PCHAR[cp] === 1 || cp === 0x2f || cp === 0x3f)

/** RFC 3986 section 2.3 `unreserved`: letters, digits, `- . _ ~`. */
export function isUnreserved(cp: number): boolean {
  return cp < 0x80 && UNRESERVED[cp] === 1
}

/** RFC 3986 section 2.2 `gen-delims`: `: / ? # [ ] @`. */
export function isGenDelim(cp: number): boolean {
  return cp < 0x80 && GEN_DELIMS[cp] === 1
}

/** RFC 3986 section 2.2 `sub-delims`: `! $ & ' ( ) * + , ; =`. */
export function isSubDelim(cp: number): boolean {
  return cp < 0x80 && SUB_DELIMS[cp] === 1
}

/** RFC 3986 section 2.2 `reserved`: `gen-delims` or `sub-delims`. */
export function isReserved(cp: number): boolean {
  return isGenDelim(cp) || isSubDelim(cp)
}

/** RFC 3986 section 3.3 `pchar` less `pct-encoded`: `unreserved`, `sub-delims`, `:` or `@`. */
export function isPchar(cp: number): boolean {
  return cp < 0x80 && PCHAR[cp] === 1
}

/** RFC 3986 section 3.3 `segment-nz-nc` character: `pchar` without the colon. */
export function isSegmentNzNc(cp: number): boolean {
  return cp < 0x80 && SEGMENT_NZ_NC[cp] === 1
}

/** A character allowed unencoded in a `query` or `fragment`: `pchar`, `/` or `?`. */
export function isQueryChar(cp: number): boolean {
  return cp < 0x80 && QUERY[cp] === 1
}

function isWhatwgC0Safe(cp: number): boolean {
  return cp >= 0x20 && cp <= 0x7e
}

function isWhatwgFragmentSafe(cp: number): boolean {
  return cp >= 0x21 && cp <= 0x7e && !inChars('"<>`', cp)
}

function isWhatwgQuerySafe(cp: number): boolean {
  return cp >= 0x21 && cp <= 0x7e && !inChars('"#<>', cp)
}

function isWhatwgSpecialQuerySafe(cp: number): boolean {
  return isWhatwgQuerySafe(cp) && cp !== 0x27
}

function isWhatwgPathSafe(cp: number): boolean {
  return isWhatwgQuerySafe(cp) && !inChars("?^`{}", cp)
}

function isWhatwgUserinfoSafe(cp: number): boolean {
  return isWhatwgPathSafe(cp) && !inChars("/:;=@[\\]|", cp)
}

function isWhatwgComponentSafe(cp: number): boolean {
  return isWhatwgUserinfoSafe(cp) && !inChars("$&+,", cp)
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
  "whatwg-c0-control": isWhatwgC0Safe,
  "whatwg-fragment": isWhatwgFragmentSafe,
  "whatwg-query": isWhatwgQuerySafe,
  "whatwg-special-query": isWhatwgSpecialQuerySafe,
  "whatwg-path": isWhatwgPathSafe,
  "whatwg-userinfo": isWhatwgUserinfoSafe,
  "whatwg-component": isWhatwgComponentSafe,
  form: isFormSafe,
}

/** The predicate behind a named keep-set, or the predicate itself. */
export function resolveEncodeSet(set: EncodeSet): (codePoint: number) => boolean {
  return typeof set === "function" ? set : SETS[set]
}

let tablePredicates: Map<EncodeSetName, (codePoint: number) => boolean> | undefined

export function keepPredicate(set: EncodeSet): (codePoint: number) => boolean {
  if (typeof set === "function") return set
  tablePredicates ??= new Map()
  let out = tablePredicates.get(set)
  if (out === undefined) {
    const safe = table(SETS[set])
    out = (cp) => cp < 0x80 && safe[cp] === 1
    tablePredicates.set(set, out)
  }
  return out
}
