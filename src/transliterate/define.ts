import type { Locale, TransliterationTable } from "./types"

/** What `defineLocale` may change; every field is optional. */
export interface LocaleOverrides {
  /** Replaces the base id, such as `"de-CH"`. */
  readonly id?: string
  /** Merged over the base table; later keys win. */
  readonly table?: TransliterationTable
  /** Replaces the base script tables. */
  readonly tables?: readonly TransliterationTable[]
  /** Replaces the base lowercasing function. */
  readonly lowercase?: (input: string) => string
}

/** One table from many; later tables win. Returns a new object. */
export function mergeTables(...tables: readonly TransliterationTable[]): TransliterationTable {
  const out: Record<string, string> = {}
  for (const table of tables) Object.assign(out, table)
  return out
}

/** A new locale from `base` with `overrides` merged in; neither object is mutated. */
export function defineLocale(base: Locale, overrides: LocaleOverrides = {}): Locale {
  const out: { -readonly [K in keyof Locale]: Locale[K] } = {
    id: overrides.id ?? base.id,
    table: mergeTables(base.table, overrides.table ?? {}),
  }
  const tables = overrides.tables ?? base.tables
  if (tables !== undefined) out.tables = [...tables]
  const lowercase = overrides.lowercase ?? base.lowercase
  if (lowercase !== undefined) out.lowercase = lowercase
  return out
}
