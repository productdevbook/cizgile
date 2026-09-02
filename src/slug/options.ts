import { type CompiledTables, compileTables, DEFAULT_TABLES } from "../transliterate/core"
import { symbols } from "../transliterate/symbols"
import { latinLocales } from "../transliterate/locales-latin"
import type { LatinLocaleId, Locale, TransliterationTable } from "../transliterate/types"
import { isSegmentNzNc } from "../uri/charset"
import { escapeClassChar, uniqueChars } from "./charset"
import type { ScriptRestriction } from "./scripts"

/** Options for `slugify` and `createSlugger`. Every option has a default; an empty object is the everyday call. */
export interface SlugifyOptions {
  /** Joins words; `"-"` by default. Any URL-safe punctuation (`- _ . ~ ! $ & ' ( ) * + , ; = @`) or `""`. */
  readonly separator?: string
  /** Lowercases the result; `true` by default. */
  readonly lowercase?: boolean
  /** Keeps letters from every script instead of transliterating to ASCII; `false` by default. */
  readonly unicode?: boolean
  /** Language rules: a Latin locale id such as `"tr"`, or a `Locale` object from `cizgile/transliterate`. */
  readonly locale?: LatinLocaleId | Locale
  /** `false` skips the Latin and symbol tables (the locale table and accent folding still apply); an array adds script tables such as `cyrillic`. */
  readonly transliterate?: boolean | readonly TransliterationTable[]
  /** Splits camelCase before slugging: `"fooBar"` becomes `"foo-bar"`; `false` by default. */
  readonly decamelize?: boolean
  /** `[from, to]` pairs applied before anything else; spaces in `to` become separators. */
  readonly replacements?: ReadonlyArray<readonly [string, string]>
  /** A global regex of characters to delete rather than turn into separators; apostrophes by default, `false` for none. */
  readonly remove?: RegExp | false
  /** Extra URL-safe single characters to keep, such as `["."]` for version numbers. */
  readonly preserveCharacters?: readonly string[]
  /** Keeps a leading `_`: `"_draft"` stays `"_draft"`. */
  readonly preserveLeadingUnderscore?: boolean
  /** Keeps a trailing separator, for input still being typed. */
  readonly preserveTrailingSeparator?: boolean
  /** Cuts at a word boundary, never inside a grapheme cluster. Counts UTF-16 code units like `.length`. */
  readonly maxLength?: number
  /** Unicode mode only: the UTS #39 restriction level the result must satisfy; `"any"` by default. */
  readonly scripts?: ScriptRestriction
  /** Unicode mode only: what to do when the result mixes text directions (RFC 3987 section 4.2); `"allow"` by default. */
  readonly bidi?: "allow" | "encode" | "throw"
}

/** The `slugify` options that shape what a valid slug looks like. */
export type IsSlugOptions = Pick<
  SlugifyOptions,
  | "separator"
  | "lowercase"
  | "unicode"
  | "locale"
  | "preserveCharacters"
  | "preserveLeadingUnderscore"
  | "preserveTrailingSeparator"
  | "maxLength"
  | "scripts"
  | "bidi"
>

export interface ResolvedOptions {
  readonly separator: string
  readonly lowercase: boolean
  readonly unicode: boolean
  readonly locale: Locale | undefined
  readonly tables: readonly TransliterationTable[] | undefined
  readonly decamelize: boolean
  readonly replacements: ReadonlyArray<readonly [string, string]>
  readonly remove: RegExp | undefined
  readonly preserveCharacters: readonly string[]
  readonly preserveLeadingUnderscore: boolean
  readonly preserveTrailingSeparator: boolean
  readonly maxLength: number | undefined
  readonly scripts: ScriptRestriction
  readonly bidi: "allow" | "encode" | "throw"
  readonly allowedClass: string
  readonly wordClass: string
  readonly disallowed: RegExp
  readonly compiled: CompiledTables | undefined
  readonly symbolTables: readonly TransliterationTable[]
  readonly compiledSymbols: CompiledTables
  readonly separatorRuns: RegExp | undefined
  readonly leadingMarks: RegExp | undefined
}

let symbolOnlyCache: WeakMap<TransliterationTable, TransliterationTable> | undefined

export function symbolEntries(table: TransliterationTable): TransliterationTable {
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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const DEFAULT_REMOVE = /['’]/g

export function lowercaseOf(text: string, o: ResolvedOptions): string {
  if (o.unicode && o.locale?.lowercase !== undefined) return o.locale.lowercase(text)
  return text.replaceAll("İ", "i").toLowerCase()
}

let cache: WeakMap<SlugifyOptions, ResolvedOptions> | undefined

function resolveLocale(locale: LatinLocaleId | Locale | undefined): Locale | undefined {
  if (locale === undefined) return undefined
  if (typeof locale === "string") {
    const found = latinLocales[locale] as Locale | undefined
    if (found === undefined) {
      throw new TypeError(
        `slugify: unknown locale "${locale}"; pass a Locale object exported by cizgile/transliterate`,
      )
    }
    return found
  }
  return locale
}

function resolveTables(
  option: boolean | readonly TransliterationTable[] | undefined,
  unicode: boolean,
  locale: Locale | undefined,
): readonly TransliterationTable[] | undefined {
  if (unicode) return undefined
  const out: TransliterationTable[] = []
  if (locale !== undefined) {
    out.push(locale.table)
    if (locale.tables !== undefined) out.push(...locale.tables)
  }
  if (option === false) return out
  if (Array.isArray(option)) out.push(...(option as readonly TransliterationTable[]))
  out.push(...DEFAULT_TABLES)
  return out
}

function build(options: SlugifyOptions): ResolvedOptions {
  const separator = options.separator ?? "-"
  for (const ch of separator) {
    if (/[\p{L}\p{N}\p{M}]/u.test(ch) || !isSegmentNzNc(ch.codePointAt(0) ?? 0)) {
      throw new RangeError(
        `slugify: separator ${JSON.stringify(separator)} may only contain RFC 3986 unreserved, sub-delims or "@" characters that are not letters or digits`,
      )
    }
  }
  const lowercase = options.lowercase ?? true
  const unicode = options.unicode ?? false
  const locale = resolveLocale(options.locale)
  const preserveCharacters = options.preserveCharacters ?? []
  const separatorChars = uniqueChars(separator)
  for (const ch of preserveCharacters) {
    if (uniqueChars(ch).length !== 1) {
      throw new TypeError(
        `slugify: preserveCharacters entries must be single characters, got ${JSON.stringify(ch)}`,
      )
    }
    if (separatorChars.includes(ch)) {
      throw new TypeError(
        `slugify: preserveCharacters may not contain the separator ${JSON.stringify(ch)}`,
      )
    }
    if (!isSegmentNzNc(ch.codePointAt(0) ?? 0)) {
      throw new TypeError(
        `slugify: preserveCharacters entry ${JSON.stringify(ch)} is not allowed in an RFC 3986 path segment (segment-nz-nc)`,
      )
    }
  }
  let remove: RegExp | undefined
  if (options.remove === undefined) {
    remove = DEFAULT_REMOVE
  } else if (options.remove !== false) {
    if (!options.remove.global) throw new TypeError("slugify: remove must be a global RegExp")
    remove = options.remove
  }
  const maxLength = options.maxLength
  if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 0)) {
    throw new RangeError("slugify: maxLength must be a non-negative integer")
  }
  const wordExtra = preserveCharacters.map(escapeClassChar).join("")
  const wordClass = unicode
    ? `\\p{L}\\p{N}\\p{M}${wordExtra}`
    : `a-z0-9${lowercase ? "" : "A-Z"}${wordExtra}`
  const allowedClass = wordClass + separatorChars.map(escapeClassChar).join("")
  const tables = resolveTables(options.transliterate, unicode, locale)
  const symbolTables = (locale === undefined ? [symbols] : [locale.table, symbols]).map(
    symbolEntries,
  )
  const separatorRuns =
    separator === ""
      ? undefined
      : new RegExp(`[${separatorChars.map(escapeClassChar).join("")}]+`, "gu")
  const leadingMarks = unicode
    ? new RegExp(`(${separator === "" ? "^" : `(?:^|${escapeRegExp(separator)})`})\\p{M}+`, "gu")
    : undefined
  return {
    separator,
    lowercase,
    unicode,
    locale,
    tables,
    decamelize: options.decamelize ?? false,
    replacements: options.replacements ?? [],
    remove,
    preserveCharacters,
    preserveLeadingUnderscore: options.preserveLeadingUnderscore ?? false,
    preserveTrailingSeparator: options.preserveTrailingSeparator ?? false,
    maxLength,
    scripts: options.scripts ?? "any",
    bidi: options.bidi ?? "allow",
    allowedClass,
    wordClass,
    disallowed: new RegExp(`[^${allowedClass}]+`, "gu"),
    compiled: tables === undefined ? undefined : compileTables(tables),
    symbolTables,
    compiledSymbols: compileTables(symbolTables),
    separatorRuns,
    leadingMarks,
  }
}

const DEFAULT_OPTIONS: SlugifyOptions = {}

let objectIds: WeakMap<object, number> | undefined
let nextObjectId = 0
let byKey: Map<string, ResolvedOptions> | undefined

function objectId(value: object): number {
  objectIds ??= new WeakMap()
  let id = objectIds.get(value)
  if (id === undefined) {
    id = nextObjectId
    nextObjectId += 1
    objectIds.set(value, id)
  }
  return id
}

function optionsKey(options: SlugifyOptions): string {
  const locale = options.locale
  const transliterate = options.transliterate
  const remove = options.remove
  return JSON.stringify([
    options.separator,
    options.lowercase,
    options.unicode,
    typeof locale === "object" ? `#${objectId(locale)}` : locale,
    Array.isArray(transliterate) ? transliterate.map((t) => objectId(t)) : transliterate,
    options.decamelize,
    options.replacements,
    remove instanceof RegExp ? `${remove.source}/${remove.flags}` : remove,
    options.preserveCharacters,
    options.preserveLeadingUnderscore,
    options.preserveTrailingSeparator,
    options.maxLength,
    options.scripts,
    options.bidi,
  ])
}

export function resolveOptions(options: SlugifyOptions = DEFAULT_OPTIONS): ResolvedOptions {
  cache ??= new WeakMap()
  const cached = cache.get(options)
  if (cached !== undefined) return cached
  byKey ??= new Map()
  const key = optionsKey(options)
  let resolved = byKey.get(key)
  if (resolved === undefined) {
    resolved = build(options)
    if (byKey.size > 512) byKey.clear()
    byKey.set(key, resolved)
  }
  cache.set(options, resolved)
  return resolved
}
