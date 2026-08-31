import { latin } from "./latin"
import { symbols } from "./symbols"
import type { Locale, TransliterationTable } from "./types"

export interface TransliterateOptions {
  readonly locale?: Locale
  readonly tables?: readonly TransliterationTable[]
  readonly unknown?: "keep" | "drop"
}

export const DEFAULT_TABLES: readonly TransliterationTable[] = [latin, symbols]

type Sequences = ReadonlyArray<readonly [string, string]>

let sequenceCache: WeakMap<TransliterationTable, Sequences> | undefined

function codePointCount(text: string): number {
  let count = 0
  for (const _ of text) count += 1
  return count
}

function sequencesOf(table: TransliterationTable): Sequences {
  sequenceCache ??= new WeakMap()
  const cached = sequenceCache.get(table)
  if (cached !== undefined) return cached
  const multi: Array<readonly [string, string]> = []
  for (const key of Object.keys(table)) {
    if (codePointCount(key) > 1) multi.push([key, table[key] ?? ""])
  }
  multi.sort((a, b) => b[0].length - a[0].length)
  sequenceCache.set(table, multi)
  return multi
}

export function resolveTables(options: TransliterateOptions): readonly TransliterationTable[] {
  const out: TransliterationTable[] = []
  if (options.locale !== undefined) {
    out.push(options.locale.table)
    if (options.locale.tables !== undefined) out.push(...options.locale.tables)
  }
  if (options.tables !== undefined) out.push(...options.tables)
  out.push(...DEFAULT_TABLES)
  return out
}

export function lookup(tables: readonly TransliterationTable[], key: string): string | undefined {
  for (const table of tables) {
    const value = table[key]
    if (value !== undefined) return value
  }
  return undefined
}

export function stripMarks(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .normalize("NFC")
}

export function fold(
  input: string,
  tables: readonly TransliterationTable[],
  dropUnknown: boolean,
  foldMarks = true,
): string {
  let text = input
  for (const table of tables) {
    for (const [key, value] of sequencesOf(table)) {
      if (text.includes(key)) text = text.split(key).join(value)
    }
  }
  let out = ""
  for (const ch of text) {
    const direct = lookup(tables, ch)
    if (direct !== undefined) {
      out += direct
      continue
    }
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80) {
      out += ch
      continue
    }
    const base = foldMarks ? stripMarks(ch) : ch
    if (base !== ch) {
      if (base === "") continue
      out += lookup(tables, base) ?? (dropUnknown && (base.codePointAt(0) ?? 0) >= 0x80 ? "" : base)
      continue
    }
    out += dropUnknown ? "" : ch
  }
  return out
}

export function transliterate(input: string, options: TransliterateOptions = {}): string {
  return fold(input.normalize("NFC"), resolveTables(options), options.unknown === "drop")
}
