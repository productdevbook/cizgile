import { DEFAULT_TABLES } from "../transliterate/core"
import { latinLocales } from "../transliterate/locales-latin"
import type { LatinLocaleId, Locale, TransliterationTable } from "../transliterate/types"
import { isSegmentNzNc } from "../uri/charset"
import { escapeClassChar, uniqueChars } from "./charset"

export interface SlugifyOptions {
  readonly separator?: string
  readonly lowercase?: boolean
  readonly unicode?: boolean
  readonly locale?: LatinLocaleId | Locale
  readonly transliterate?: boolean | readonly TransliterationTable[]
  readonly decamelize?: boolean
  readonly replacements?: ReadonlyArray<readonly [string, string]>
  readonly remove?: RegExp | false
  readonly preserveCharacters?: readonly string[]
  readonly preserveLeadingUnderscore?: boolean
  readonly preserveTrailingSeparator?: boolean
  readonly maxLength?: number
}

export type IsSlugOptions = Pick<
  SlugifyOptions,
  | "separator"
  | "lowercase"
  | "unicode"
  | "preserveCharacters"
  | "preserveLeadingUnderscore"
  | "preserveTrailingSeparator"
  | "maxLength"
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
  readonly allowedClass: string
  readonly wordClass: string
  readonly disallowed: RegExp
}

const DEFAULT_REMOVE = /['’]/g

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
  return {
    separator,
    lowercase,
    unicode,
    locale,
    tables: resolveTables(options.transliterate, unicode, locale),
    decamelize: options.decamelize ?? false,
    replacements: options.replacements ?? [],
    remove,
    preserveCharacters,
    preserveLeadingUnderscore: options.preserveLeadingUnderscore ?? false,
    preserveTrailingSeparator: options.preserveTrailingSeparator ?? false,
    maxLength,
    allowedClass,
    wordClass,
    disallowed: new RegExp(`[^${allowedClass}]+`, "gu"),
  }
}

export function resolveOptions(options: SlugifyOptions = {}): ResolvedOptions {
  cache ??= new WeakMap()
  const cached = cache.get(options)
  if (cached !== undefined) return cached
  const resolved = build(options)
  cache.set(options, resolved)
  return resolved
}
