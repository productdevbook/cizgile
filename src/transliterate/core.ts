import { latin } from "./latin"
import { symbols } from "./symbols"
import type { Locale, TransliterationTable } from "./types"

/** Options for `transliterate`. */
export interface TransliterateOptions {
  /** Language rules consulted before the tables. */
  readonly locale?: Locale
  /** Extra script tables, consulted before the Latin and symbol defaults. */
  readonly tables?: readonly TransliterationTable[]
  /** What happens to characters no table covers; `"keep"` by default. */
  readonly unknown?: "keep" | "drop"
  /** Folds compatibility characters first (ligatures, superscripts, circled digits), as `slugify` does; `false` by default. */
  readonly nfkc?: boolean
}

/** The tables every call consults last: `latin`, then `symbols`. */
export const DEFAULT_TABLES: readonly TransliterationTable[] = [latin, symbols]

type Sequences = ReadonlyArray<readonly [string, string]>

export interface CompiledTables {
  readonly map: ReadonlyMap<string, string>
  readonly sequences: Sequences
  readonly ascii: RegExp | undefined
  readonly folded: Map<string, string | null>
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
  return { map, sequences: multi, ascii, folded: new Map() }
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

/** The table list a `transliterate` call would consult, in lookup order. */
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

/** The first table value for `key`, or `undefined`. */
export function lookup(tables: readonly TransliterationTable[], key: string): string | undefined {
  for (const table of tables) {
    const value = table[key]
    if (value !== undefined) return value
  }
  return undefined
}

/** Removes combining marks: `"é"` becomes `"e"`, `"ǿ"` becomes `"ø"`. */
export function stripMarks(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .normalize("NFC")
}

const MARK = /^\p{M}+$/u

function foldPieces(ch: string, map: ReadonlyMap<string, string>): string | null {
  const decomposed = ch.normalize("NFD")
  if (decomposed !== ch) {
    let out = ""
    let complete = true
    for (const piece of decomposed) {
      const value = map.get(piece)
      if (value === undefined) {
        complete = false
        break
      }
      out += value
    }
    if (complete) return out
  }
  const base = stripMarks(ch)
  if (base === ch) return null
  const mapped = map.get(base)
  if (mapped !== undefined) return mapped
  return (base.codePointAt(0) ?? 0x80) < 0x80 ? base : null
}

function foldChar(ch: string, compiled: CompiledTables): string | null {
  const cached = compiled.folded.get(ch)
  if (cached !== undefined) return cached
  const value = foldPieces(ch, compiled.map)
  if (compiled.folded.size > 8192) compiled.folded.clear()
  compiled.folded.set(ch, value)
  return value
}

/** The transliteration core: applies `tables` to NFC text, folding marks unless told not to. */
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
  let kept = false
  for (const ch of text) {
    const direct = map.get(ch)
    if (direct !== undefined) {
      out += direct
      kept = false
      continue
    }
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x80) {
      out += ch
      kept = false
      continue
    }
    if (foldMarks && MARK.test(ch)) {
      if (kept && !dropUnknown) out += ch
      continue
    }
    const folded = foldMarks ? foldChar(ch, compiled) : null
    if (folded !== null) {
      out += folded
      kept = false
      continue
    }
    if (!dropUnknown) out += ch
    kept = !dropUnknown
  }
  return out
}

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

/** Applies the table entries whose keys NFKC would split, so a ligature gets its table value before normalisation. */
export function applyCompat(text: string, tables: readonly TransliterationTable[]): string {
  let out = text
  for (const table of tables) {
    for (const [key, value] of compatEntries(table)) {
      if (out.includes(key)) out = out.split(key).join(value)
    }
  }
  return out
}

/** Replaces non-ASCII letters with ASCII from the tables and the mark-stripping fallback. Characters no table knows are kept whole, marks included, or dropped with `unknown: "drop"`. */
export function transliterate(input: string, options: TransliterateOptions = {}): string {
  const tables = resolveTables(options)
  let text = input.normalize("NFC")
  if (options.nfkc === true && NON_ASCII.test(text)) {
    text = applyCompat(text, tables).normalize("NFKC")
  }
  return fold(text, tables, options.unknown === "drop")
}
