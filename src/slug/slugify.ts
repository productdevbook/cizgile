import { fold } from "../transliterate/core"
import { symbols } from "../transliterate/symbols"
import type { TransliterationTable } from "../transliterate/types"
import { escapeClassChar, escapeRegExp, stripControls, uniqueChars } from "./charset"
import { decamelize } from "./decamelize"
import { type ResolvedOptions, resolveOptions, type SlugifyOptions } from "./options"
import { truncateSlug } from "./truncate"

let symbolOnlyCache: WeakMap<TransliterationTable, TransliterationTable> | undefined

function symbolEntries(table: TransliterationTable): TransliterationTable {
  symbolOnlyCache ??= new WeakMap()
  const cached = symbolOnlyCache.get(table)
  if (cached !== undefined) return cached
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(table)) {
    if (!/[\p{L}\p{M}\p{N}]/u.test(key)) out[key] = value
  }
  symbolOnlyCache.set(table, out)
  return out
}

function lowercaseOf(text: string, o: ResolvedOptions): string {
  if (o.unicode && o.locale?.lowercase !== undefined) return o.locale.lowercase(text)
  return text.replaceAll("İ", "i").toLowerCase()
}

function collapse(text: string, separator: string): string {
  if (separator === "") return text
  const runs = new RegExp(`[${uniqueChars(separator).map(escapeClassChar).join("")}]+`, "gu")
  let out = text.replace(runs, separator)
  while (out.startsWith(separator)) out = out.slice(separator.length)
  while (out.endsWith(separator)) out = out.slice(0, -separator.length)
  return out
}

export function slugify(input: string, options: SlugifyOptions = {}): string {
  if (typeof input !== "string") throw new TypeError("slugify: input must be a string")
  const o = resolveOptions(options)
  let s = stripControls(input).normalize("NFC")
  for (const [from, to] of o.replacements) {
    if (from !== "") s = s.split(from).join(to)
  }
  s = s.normalize("NFKC")
  if (o.decamelize) s = decamelize(s)
  if (o.tables !== undefined) {
    s = fold(s, o.tables, false)
  } else {
    const tables = o.locale === undefined ? [symbols] : [o.locale.table, symbols]
    s = fold(s, tables.map(symbolEntries), false, false)
  }
  if (o.lowercase) s = lowercaseOf(s, o)
  if (o.unicode) s = s.normalize("NFKC")
  if (o.remove !== undefined) s = s.replace(o.remove, "")
  const hadLeadingUnderscore = s.startsWith("_")
  s = s.replace(o.disallowed, o.separator)
  if (o.unicode) {
    const boundary = o.separator === "" ? "^" : `(?:^|${escapeRegExp(o.separator)})`
    s = s.replace(new RegExp(`(${boundary})\\p{M}+`, "gu"), "$1")
  }
  const hadTrailingSeparator = o.separator !== "" && s.endsWith(o.separator)
  s = collapse(s, o.separator)
  if (o.maxLength !== undefined) s = truncateSlug(s, o.maxLength, o.separator)
  if (o.preserveLeadingUnderscore && hadLeadingUnderscore && s !== "" && !s.startsWith("_")) {
    s = "_" + s
  }
  if (o.preserveTrailingSeparator && hadTrailingSeparator && s !== "") s += o.separator
  return s
}
