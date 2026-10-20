import { punycodeDecode, punycodeEncode } from "../uri/punycode"
import { bidiClass, codePointStatus, isMark, isVirama, joiningType, scriptOf } from "./tables"

/** Options of the UTS #46 processing. The defaults are those of the WHATWG URL Standard's domain to ASCII. */
export interface IdnaOptions {
  /** Turn on `useSTD3ASCIIRules`, `checkHyphens` and `verifyDnsLength` unless they are set explicitly. Default `false`. */
  beStrict?: boolean
  /** Only `a-z`, `0-9` and `-` among ASCII characters (error `U1`). Default `false`, or `true` with `beStrict`. */
  useSTD3ASCIIRules?: boolean
  /** No hyphen in positions 3 and 4 and none at either end (`V2`, `V3`); when off, a label may not start with `xn--` (`V4`). Default `false`, or `true` with `beStrict`. */
  checkHyphens?: boolean
  /** The RFC 5893 bidi rule for labels of a bidi domain name (`B1` to `B6`). Default `true`. */
  checkBidi?: boolean
  /** RFC 5892 CONTEXTJ: where U+200C and U+200D may appear (`C1`, `C2`). Default `true`. */
  checkJoiners?: boolean
  /** RFC 5892 CONTEXTO, appendix A.3 to A.9: middle dot, keraia, geresh, gershayim, katakana middle dot, Arabic-Indic digits (`O1`). Not part of UTS #46. Default `false`. */
  checkContextO?: boolean
  /** Map `ß`, `ς`, U+200C and U+200D the IDNA2003 way (deprecated). Default `false`. */
  transitionalProcessing?: boolean
  /** Label length 1 to 63, name length 1 to 253 without the root dot (`A4_1`, `A4_2`), and empty labels in `idnaToUnicode` (`X4_2`). Default `false`, or `true` with `beStrict`. */
  verifyDnsLength?: boolean
  /** Keep an `xn--` label whose Punycode does not decode as it is instead of reporting `P4`. Default `false`. */
  ignoreInvalidPunycode?: boolean
}

/** The outcome of UTS #46 processing: the converted domain, always produced, and the error codes it recorded. */
export interface IdnaResult {
  /** The converted domain, as far as processing got. */
  readonly result: string
  /** Error codes such as `V7`, `B1`, `C1` or `A4_2`, sorted; empty when the domain is valid. */
  readonly errors: readonly string[]
}

interface Flags {
  readonly std3: boolean
  readonly hyphens: boolean
  readonly bidi: boolean
  readonly joiners: boolean
  readonly contextO: boolean
  readonly transitional: boolean
  readonly dns: boolean
  readonly ignorePunycode: boolean
}

interface Label {
  text: string
  decoded: boolean
  skip: boolean
}

const PREFIX = "xn--"
const LTR_OK = /^[LESCTOBM]*$/
const RTL_OK = /^[RANESCTOBM]*$/

function flagsOf(o: IdnaOptions): Flags {
  const strict = o.beStrict === true
  return {
    std3: o.useSTD3ASCIIRules ?? strict,
    hyphens: o.checkHyphens ?? strict,
    bidi: o.checkBidi ?? true,
    joiners: o.checkJoiners ?? true,
    contextO: o.checkContextO ?? false,
    transitional: o.transitionalProcessing ?? false,
    dns: o.verifyDnsLength ?? strict,
    ignorePunycode: o.ignoreInvalidPunycode ?? false,
  }
}

function isAscii(text: string): boolean {
  for (let i = 0; i < text.length; i++) if ((text.codePointAt(i) ?? 0) > 0x7f) return false
  return true
}

function mapDomain(domain: string, transitional: boolean): string {
  let out = ""
  for (const ch of domain) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80) {
      out += cp >= 0x41 && cp <= 0x5a ? String.fromCodePoint(cp + 32) : ch
      continue
    }
    if (transitional && cp === 0x1e9e) {
      out += "ss"
      continue
    }
    const entry = codePointStatus(cp)
    if (entry.status === "mapped" || (entry.status === "deviation" && transitional)) {
      out += String.fromCodePoint(...entry.to)
    } else if (entry.status !== "ignored") {
      out += ch
    }
  }
  return out
}

function checkJoiners(cps: readonly number[], errors: Set<string>): void {
  for (const [i, cp] of cps.entries()) {
    if (cp !== 0x200c && cp !== 0x200d) continue
    const code = cp === 0x200c ? "C1" : "C2"
    if (i > 0 && isVirama(cps[i - 1] ?? 0)) continue
    if (cp === 0x200d) {
      errors.add(code)
      continue
    }
    let before = i - 1
    while (before >= 0 && joiningType(cps[before] ?? 0) === "T") before -= 1
    let after = i + 1
    while (after < cps.length && joiningType(cps[after] ?? 0) === "T") after += 1
    const left = before >= 0 ? joiningType(cps[before] ?? 0) : ""
    const right = after < cps.length ? joiningType(cps[after] ?? 0) : ""
    if (!(left === "L" || left === "D") || !(right === "R" || right === "D")) errors.add(code)
  }
}

function checkBidiLabel(classes: string, errors: Set<string>): void {
  const first = classes[0]
  const end = classes.replace(/M+$/, "").slice(-1)
  if (first === "R" || first === "A") {
    if (!RTL_OK.test(classes)) errors.add("B2")
    if (!"RAEN".includes(end)) errors.add("B3")
    if (classes.includes("E") && classes.includes("N")) errors.add("B4")
  } else if (first === "L") {
    if (!LTR_OK.test(classes)) errors.add("B5")
    if (end !== "L" && end !== "E") errors.add("B6")
  } else {
    errors.add("B1")
  }
}

function checkContextO(cps: readonly number[], errors: Set<string>): void {
  const hasKana = cps.some((cp) => scriptOf(cp) === "J")
  const arabicIndic = cps.some((cp) => cp >= 0x660 && cp <= 0x669)
  const extended = cps.some((cp) => cp >= 0x6f0 && cp <= 0x6f9)
  if (arabicIndic && extended) errors.add("O1")
  for (const [i, cp] of cps.entries()) {
    const prev = cps[i - 1] ?? 0
    const next = cps[i + 1] ?? 0
    if (cp === 0xb7 && !(prev === 0x6c && next === 0x6c)) errors.add("O1")
    else if (cp === 0x375 && scriptOf(next) !== "G") errors.add("O1")
    else if ((cp === 0x5f3 || cp === 0x5f4) && scriptOf(prev) !== "H") errors.add("O1")
    else if (cp === 0x30fb && !hasKana) errors.add("O1")
  }
}

function validate(
  label: string,
  flags: Flags,
  nontransitional: boolean,
  bidiDomain: boolean,
  errors: Set<string>,
): void {
  if (label === "") return
  if (label.normalize("NFC") !== label) errors.add("V1")
  const cps = Array.from(label, (ch) => ch.codePointAt(0) ?? 0)
  if (flags.hyphens) {
    if (cps[2] === 0x2d && cps[3] === 0x2d) errors.add("V2")
    if (label.startsWith("-") || label.endsWith("-")) errors.add("V3")
  }
  if (label.startsWith(PREFIX)) errors.add("V4")
  if (label.includes(".")) errors.add("V5")
  if (isMark(cps[0] ?? 0)) errors.add("V6")
  for (const cp of cps) {
    if (cp < 0x80) {
      if (cp >= 0x41 && cp <= 0x5a) errors.add("V7")
      if (
        flags.std3 &&
        !(cp === 0x2d || (cp >= 0x30 && cp <= 0x39) || (cp >= 0x61 && cp <= 0x7a))
      ) {
        errors.add("U1")
      }
      continue
    }
    const { status } = codePointStatus(cp)
    if (status !== "valid" && !(status === "deviation" && nontransitional)) errors.add("V7")
  }
  if (flags.joiners) checkJoiners(cps, errors)
  if (flags.bidi && bidiDomain) checkBidiLabel(cps.map(bidiClass).join(""), errors)
  if (flags.contextO) checkContextO(cps, errors)
}

function decodeLabel(label: Label, flags: Flags, errors: Set<string>): void {
  if (!label.text.startsWith(PREFIX)) return
  if (!isAscii(label.text)) {
    errors.add("P4")
    label.skip = true
    return
  }
  let decoded: string
  try {
    decoded = punycodeDecode(label.text.slice(PREFIX.length))
  } catch {
    if (!flags.ignorePunycode) errors.add("P4")
    label.skip = true
    return
  }
  label.text = decoded
  label.decoded = true
  if (decoded === "" || isAscii(decoded)) errors.add("P4")
}

function isRtl(text: string): boolean {
  for (const ch of text) {
    const cls = bidiClass(ch.codePointAt(0) ?? 0)
    if (cls === "R" || cls === "A" || cls === "N") return true
  }
  return false
}

function run(domain: string, options: IdnaOptions, ascii: boolean): IdnaResult {
  const flags = flagsOf(options)
  const errors = new Set<string>()
  const mapped = mapDomain(domain, flags.transitional).normalize("NFC")
  const labels: Label[] = mapped.split(".").map((text) => ({ text, decoded: false, skip: false }))
  for (const label of labels) decodeLabel(label, flags, errors)
  const bidiDomain = flags.bidi && labels.some((label) => !label.skip && isRtl(label.text))
  for (const label of labels) {
    if (!label.skip) {
      validate(label.text, flags, label.decoded || !flags.transitional, bidiDomain, errors)
    }
  }
  let texts = labels.map((label) => label.text)
  if (ascii) {
    texts = texts.map((text) => {
      if (isAscii(text)) return text
      if (!text.isWellFormed()) {
        errors.add("A3")
        return text
      }
      return PREFIX + punycodeEncode(text)
    })
  }
  if (flags.dns) {
    if (ascii) {
      const root = texts.length > 1 && texts[texts.length - 1] === ""
      const length = texts.slice(0, root ? -1 : undefined).join(".").length
      if (length < 1 || length > 253) errors.add("A4_1")
      if (texts.some((text) => text.length < 1 || text.length > 63)) errors.add("A4_2")
    } else if (texts.some((text, i) => text === "" && (i < texts.length - 1 || i === 0))) {
      errors.add("X4_2")
    }
  }
  return { result: texts.join("."), errors: [...errors].toSorted() }
}

/** UTS #46 ToASCII: maps, normalizes, validates and Punycode-encodes `domain`, and reports every error code instead of throwing. `result` is produced even when `errors` is not empty. */
export function idnaToAsciiResult(domain: string, options: IdnaOptions = {}): IdnaResult {
  return run(domain, options, true)
}

/** UTS #46 ToUnicode: maps, normalizes, validates and decodes the `xn--` labels of `domain`, and reports every error code instead of throwing. */
export function idnaToUnicodeResult(domain: string, options: IdnaOptions = {}): IdnaResult {
  return run(domain, options, false)
}

function unwrap(fn: string, domain: string, { result, errors }: IdnaResult): string {
  if (errors.length > 0) {
    throw new RangeError(`${fn}: ${JSON.stringify(domain)} is not valid (${errors.join(", ")})`)
  }
  return result
}

/**
 * UTS #46 ToASCII with the full Unicode 16 status table. Unlike `domainToAscii` in `cizgile/uri` it knows every valid, ignored, mapped, deviation and disallowed code point, and checks CONTEXTJ and the bidi rule.
 * @throws {RangeError} when processing records an error; the message lists the codes.
 */
export function idnaToAscii(domain: string, options: IdnaOptions = {}): string {
  return unwrap("idnaToAscii", domain, idnaToAsciiResult(domain, options))
}

/**
 * UTS #46 ToUnicode with the full Unicode 16 status table.
 * @throws {RangeError} when processing records an error; the message lists the codes.
 */
export function idnaToUnicode(domain: string, options: IdnaOptions = {}): string {
  return unwrap("idnaToUnicode", domain, idnaToUnicodeResult(domain, options))
}
