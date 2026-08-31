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

export interface CompiledTables {
  readonly map: ReadonlyMap<string, string>
  readonly sequences: Sequences
  readonly ascii: RegExp | undefined
}

const NON_ASCII = /[^\x00-\x7F]/

let tableIds: WeakMap<TransliterationTable, number> | undefined
let nextTableId = 0
let compiledByArray: WeakMap<readonly TransliterationTable[], CompiledTables> | undefined
let compiledByKey: Map<string, CompiledTables> | undefined

function codePointCount(text: string): number {
  let count = 0
  for (const _ of text) count += 1
  return count
}

function tableId(table: TransliterationTable): number {
  tableIds ??= new WeakMap()
  let id = tableIds.get(table)
  if (id === undefined) {
    id = nextTableId
    nextTableId += 1
    tableIds.set(table, id)
  }
  return id
}

function build(tables: readonly TransliterationTable[]): CompiledTables {
  const map = new Map<string, string>()
  const multi: Array<readonly [string, string]> = []
  for (const table of tables) {
    for (const key of Object.keys(table)) {
      if (map.has(key)) continue
      const value = table[key] ?? ""
      map.set(key, value)
      if (codePointCount(key) > 1) multi.push([key, value])
    }
  }
  multi.sort((a, b) => b[0].length - a[0].length)
  const asciiKeys = [...map.keys()].filter(
    (key) => key.length === 1 && (key.codePointAt(0) ?? 0) < 0x80,
  )
  const ascii =
    asciiKeys.length === 0
      ? undefined
      : new RegExp(`[${asciiKeys.map((k) => k.replace(/[\]\\^-]/g, "\\$&")).join("")}]`, "g")
  return { map, sequences: multi, ascii }
}

export function compileTables(tables: readonly TransliterationTable[]): CompiledTables {
  compiledByArray ??= new WeakMap()
  const byArray = compiledByArray.get(tables)
  if (byArray !== undefined) return byArray
  compiledByKey ??= new Map()
  const key = tables.map(tableId).join(",")
  let compiled = compiledByKey.get(key)
  if (compiled === undefined) {
    compiled = build(tables)
    if (compiledByKey.size > 256) compiledByKey.clear()
    compiledByKey.set(key, compiled)
  }
  compiledByArray.set(tables, compiled)
  return compiled
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

let markCache: Map<string, string> | undefined

function stripMarksCached(ch: string): string {
  markCache ??= new Map()
  let base = markCache.get(ch)
  if (base === undefined) {
    base = stripMarks(ch)
    if (markCache.size > 8192) markCache.clear()
    markCache.set(ch, base)
  }
  return base
}

export function fold(
  input: string,
  tables: readonly TransliterationTable[] | CompiledTables,
  dropUnknown: boolean,
  foldMarks = true,
): string {
  const compiled = "sequences" in tables ? tables : compileTables(tables)
  const map = compiled.map
  let text = input
  if (!NON_ASCII.test(text)) {
    return compiled.ascii === undefined
      ? text
      : text.replace(compiled.ascii, (m) => map.get(m) ?? m)
  }
  if (compiled.sequences.length > 0) {
    for (const [key, value] of compiled.sequences) {
      if (text.includes(key)) text = text.split(key).join(value)
    }
  }
  let out = ""
  for (const ch of text) {
    const direct = map.get(ch)
    if (direct !== undefined) {
      out += direct
      continue
    }
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80) {
      out += ch
      continue
    }
    const base = foldMarks ? stripMarksCached(ch) : ch
    if (base !== ch) {
      if (base === "") continue
      out += map.get(base) ?? (dropUnknown && (base.codePointAt(0) ?? 0) >= 0x80 ? "" : base)
      continue
    }
    out += dropUnknown ? "" : ch
  }
  return out
}

export function transliterate(input: string, options: TransliterateOptions = {}): string {
  return fold(input.normalize("NFC"), resolveTables(options), options.unknown === "drop")
}
