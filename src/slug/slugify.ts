import { fold } from "../transliterate/core"
import type { TransliterationTable } from "../transliterate/types"
import { stripControls } from "./charset"
import { decamelize } from "./decamelize"
import { type ResolvedOptions, resolveOptions, type SlugifyOptions } from "./options"
import { truncateSlug } from "./truncate"
import { iriToUri } from "../uri/iri"
import { isBidiSafeComponent } from "./bidi"
import { checkScripts } from "./scripts"

let compatCache: WeakMap<TransliterationTable, ReadonlyArray<readonly [string, string]>> | undefined

function compatEntries(table: TransliterationTable): ReadonlyArray<readonly [string, string]> {
  compatCache ??= new WeakMap()
  const cached = compatCache.get(table)
  if (cached !== undefined) return cached
  const out: Array<readonly [string, string]> = []
  for (const [key, value] of Object.entries(table)) {
    if (key.normalize("NFKC") !== key) out.push([key, value])
  }
  compatCache.set(table, out)
  return out
}

function applyCompat(text: string, tables: readonly TransliterationTable[]): string {
  let out = text
  for (const table of tables) {
    for (const [key, value] of compatEntries(table)) {
      if (out.includes(key)) out = out.split(key).join(value)
    }
  }
  return out
}

function lowercaseOf(text: string, o: ResolvedOptions): string {
  if (o.unicode && o.locale?.lowercase !== undefined) return o.locale.lowercase(text)
  return text.replaceAll("İ", "i").toLowerCase()
}

const NON_ASCII = /[^\x00-\x7F]/

function collapse(text: string, o: ResolvedOptions): string {
  if (o.separatorRuns === undefined) return text
  const separator = o.separator
  let out = text.replace(o.separatorRuns, separator)
  while (out.startsWith(separator)) out = out.slice(separator.length)
  while (out.endsWith(separator)) out = out.slice(0, -separator.length)
  return out
}

export function slugify(input: string, options?: SlugifyOptions): string {
  if (typeof input !== "string") throw new TypeError("slugify: input must be a string")
  const o = resolveOptions(options)
  let s = stripControls(input)
  let ascii = !NON_ASCII.test(s)
  if (!ascii) s = s.normalize("NFC")
  for (const [from, to] of o.replacements) {
    if (from !== "") s = s.split(from).join(to)
  }
  if (o.replacements.length > 0) ascii = !NON_ASCII.test(s)
  if (!ascii) s = applyCompat(s, o.tables ?? o.symbolTables).normalize("NFKC")
  if (o.decamelize) s = decamelize(s)
  if (o.compiled !== undefined) {
    s = fold(s, o.compiled, false)
    if (!ascii && NON_ASCII.test(s)) s = s.replace(/(?![\x00-\x7F])[\p{L}\p{M}\p{N}]/gu, "")
  } else {
    s = fold(s, o.compiledSymbols, false, false)
  }
  if (o.lowercase) s = lowercaseOf(s, o)
  if (o.unicode && !ascii) s = s.normalize("NFKC")
  if (o.remove !== undefined) s = s.replace(o.remove, "")
  const hadLeadingUnderscore = s.startsWith("_")
  s = s.replace(o.disallowed, o.separator)
  if (o.leadingMarks !== undefined && !ascii) s = s.replace(o.leadingMarks, "$1")
  const hadTrailingSeparator = o.separator !== "" && s.endsWith(o.separator)
  s = collapse(s, o)
  if (o.maxLength !== undefined) s = truncateSlug(s, o.maxLength, o.separator)
  if (s === "." || s === "..") s = ""
  if (o.preserveLeadingUnderscore && hadLeadingUnderscore && s !== "" && !s.startsWith("_")) {
    s = "_" + s
  }
  if (o.preserveTrailingSeparator && hadTrailingSeparator && s !== "") s += o.separator
  if (o.unicode && s !== "") {
    if (o.scripts !== "any") {
      const check = checkScripts(s, o.scripts)
      if (!check.ok) {
        throw new RangeError(
          `slugify: ${JSON.stringify(s)} mixes scripts (${check.scripts.join(", ")}) beyond the "${o.scripts}" restriction level`,
        )
      }
    }
    if (o.bidi !== "allow" && !isBidiSafeComponent(s)) {
      if (o.bidi === "throw") {
        throw new RangeError(
          `slugify: ${JSON.stringify(s)} mixes text directions (RFC 3987 section 4.2)`,
        )
      }
      s = iriToUri(s)
    }
  }
  return s
}
