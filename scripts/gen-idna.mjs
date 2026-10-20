// Regenerates src/idna/data.ts and test/fixtures/IdnaTestV2.txt from the Unicode Consortium files.
// Usage: node scripts/gen-idna.mjs [version]   (default 16.0.0)
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

const VERSION = process.argv[2] ?? "16.0.0"
const ROOT = resolve(import.meta.dirname, "..")
const UCD = `https://www.unicode.org/Public/${VERSION}/ucd`
const IDNA = `https://www.unicode.org/Public/idna/${VERSION}`
const MAX = 0x110000

async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.text()
}

function* rows(text) {
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*/, "").trim()
    if (line === "") continue
    const [range, ...fields] = line.split(";").map((f) => f.trim())
    const [lo, hi = lo] = range.split("..").map((h) => Number.parseInt(h, 16))
    yield { lo, hi, fields }
  }
}

const b36 = (n) => (n < 0 ? "-" : "") + Math.abs(n).toString(36)
const cps = (field) =>
  field === "" || field === undefined ? [] : field.split(/\s+/).map((h) => Number.parseInt(h, 16))

const mappingText = await get(`${IDNA}/IdnaMappingTable.txt`)
const filled = (v) => Array.from({ length: MAX }, () => v)
const status = filled()
const target = filled()
for (const { lo, hi, fields } of rows(mappingText)) {
  for (let cp = lo; cp <= hi; cp++) {
    status[cp] = fields[0]
    target[cp] = cps(fields[1])
  }
}
for (let cp = 0; cp < MAX; cp++) if (status[cp] === undefined) throw new Error(`gap at ${cp}`)

// UTS #46 for Unicode 16 has no STD3 statuses: UseSTD3ASCIIRules is applied in the validity criteria
const KINDS = { valid: "V", ignored: "I", disallowed: "X" }
const tokens = []
let at = 0
while (at < MAX) {
  const s = status[at]
  if (s in KINDS) {
    let end = at
    while (end < MAX && status[end] === s) end++
    tokens.push(`${KINDS[s]}${b36(end - at)}`)
    at = end
  } else if (s === "deviation") {
    tokens.push(`E${target[at].map(b36).join(".")}`)
    at++
  } else if (s === "mapped") {
    const t = target[at]
    if (t.length === 1) {
      const off = t[0] - at
      let pairs = 0
      while (
        status[at + 2 * pairs] === "mapped" &&
        target[at + 2 * pairs].length === 1 &&
        target[at + 2 * pairs][0] - (at + 2 * pairs) === off &&
        status[at + 2 * pairs + 1] === "valid"
      )
        pairs++
      if (pairs > 1) {
        tokens.push(`P${b36(pairs)}.${b36(off)}`)
        at += 2 * pairs
        continue
      }
      let end = at + 1
      while (
        end < MAX &&
        status[end] === "mapped" &&
        target[end].length === 1 &&
        target[end][0] - end === off
      )
        end++
      tokens.push(`M${b36(end - at)}.${b36(off)}`)
      at = end
    } else {
      tokens.push(`T${t.map(b36).join(".")}`)
      at++
    }
  } else {
    throw new Error(`unexpected status ${s}`)
  }
}

function runs(valueOf, fallback) {
  const values = Array.from({ length: MAX }, (_, c) => valueOf(c))
  let out = ""
  let last = MAX - 1
  while (last > 0 && values[last] === fallback) last--
  for (let c = 0; c <= last;) {
    let end = c
    while (end <= last && values[end] === values[c]) end++
    out += `${values[c]}${b36(end - c)}`
    c = end
  }
  return out
}

const BIDI_LONG = {
  Left_To_Right: "L",
  Right_To_Left: "R",
  Arabic_Letter: "A",
  Arabic_Number: "N",
  European_Number: "E",
  European_Separator: "S",
  Common_Separator: "C",
  European_Terminator: "T",
  Other_Neutral: "O",
  Boundary_Neutral: "B",
  Nonspacing_Mark: "M",
}
const BIDI_SHORT = {
  L: "L",
  R: "R",
  AL: "A",
  AN: "N",
  EN: "E",
  ES: "S",
  CS: "C",
  ET: "T",
  ON: "O",
  BN: "B",
  NSM: "M",
}
const bidiText = await get(`${UCD}/extracted/DerivedBidiClass.txt`)
const bidi = filled("L")
for (const line of bidiText.split("\n")) {
  const m = /^# @missing: ([0-9A-F]+)\.\.([0-9A-F]+); (\w+)/.exec(line)
  if (!m) continue
  for (let c = Number.parseInt(m[1], 16); c <= Number.parseInt(m[2], 16); c++)
    bidi[c] = BIDI_LONG[m[3]] ?? "X"
}
for (const { lo, hi, fields } of rows(bidiText))
  for (let c = lo; c <= hi; c++) bidi[c] = BIDI_SHORT[fields[0]] ?? "X"

const joinText = await get(`${UCD}/extracted/DerivedJoiningType.txt`)
const joining = filled("U")
for (const { lo, hi, fields } of rows(joinText))
  for (let c = lo; c <= hi; c++) joining[c] = fields[0]

const cccText = await get(`${UCD}/extracted/DerivedCombiningClass.txt`)
const virama = filled("N")
for (const { lo, hi, fields } of rows(cccText))
  if (fields[0] === "9") for (let c = lo; c <= hi; c++) virama[c] = "V"

const gcText = await get(`${UCD}/extracted/DerivedGeneralCategory.txt`)
const mark = filled("N")
for (const { lo, hi, fields } of rows(gcText))
  if (/^M[nce]$/.test(fields[0])) for (let c = lo; c <= hi; c++) mark[c] = "M"

const scriptText = await get(`${UCD}/Scripts.txt`)
const SCRIPT = { Greek: "G", Hebrew: "H", Hiragana: "J", Katakana: "J", Han: "J" }
const script = filled("N")
for (const { lo, hi, fields } of rows(scriptText))
  if (SCRIPT[fields[0]]) for (let c = lo; c <= hi; c++) script[c] = SCRIPT[fields[0]]

const quote = (s) => JSON.stringify(s)
const out = `// Generated by scripts/gen-idna.mjs from Unicode ${VERSION} (IdnaMappingTable, DerivedBidiClass, DerivedJoiningType, DerivedCombiningClass, DerivedGeneralCategory, Scripts). Do not edit.

/** The Unicode version of the tables behind \`cizgile/uri/idna\`. */
export const IDNA_UNICODE_VERSION = ${quote(VERSION)}

// UTS #46 status table as run-length tokens in code point order: V valid, I ignored, X disallowed (length),
// P pairs.offset (that many mapped, valid pairs), M length.offset (mapped to a single code point), T target code points (mapped), E target code points (deviation); numbers are base 36
export const MAPPING =
  ${quote(tokens.join(""))}

// Property runs, one letter and a base-36 length per run from U+0000.
// Bidi_Class: L R A(L) N(AN) E(N) S(ES) C(S) T(ET) O(N) B(N) M(NSM) X other
export const BIDI =
  ${quote(runs((c) => bidi[c], "L"))}
// Joining_Type: L D R T C U
export const JOINING =
  ${quote(runs((c) => joining[c], "U"))}
// Canonical_Combining_Class 9 (virama): V
export const VIRAMA =
  ${quote(runs((c) => virama[c], "N"))}
// General_Category Mark: M
export const MARK =
  ${quote(runs((c) => mark[c], "N"))}
// Script: G Greek, H Hebrew, J Hiragana, Katakana or Han
export const SCRIPTS =
  ${quote(runs((c) => script[c], "N"))}
`
mkdirSync(resolve(ROOT, "src/idna"), { recursive: true })
writeFileSync(resolve(ROOT, "src/idna/data.ts"), out)

const fixture = resolve(ROOT, "test/fixtures/IdnaTestV2.txt")
mkdirSync(dirname(fixture), { recursive: true })
writeFileSync(fixture, await get(`${IDNA}/IdnaTestV2.txt`))
console.log(`tokens: ${tokens.length}, bytes: ${out.length}`)
