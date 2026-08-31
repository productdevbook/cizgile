import type { Locale, TransliterationTable } from "./types"

export interface LocaleOverrides {
  readonly id?: string
  readonly table?: TransliterationTable
  readonly tables?: readonly TransliterationTable[]
  readonly lowercase?: (input: string) => string
}

export function mergeTables(...tables: readonly TransliterationTable[]): TransliterationTable {
  const out: Record<string, string> = {}
  for (const table of tables) Object.assign(out, table)
  return out
}

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
