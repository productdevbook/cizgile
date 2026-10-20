import { BIDI, JOINING, MAPPING, MARK, SCRIPTS, VIRAMA } from "./data"

interface Runs {
  readonly starts: readonly number[]
  readonly vals: readonly string[]
}

interface Mapping {
  readonly starts: readonly number[]
  readonly kinds: readonly string[]
  readonly data: readonly (readonly number[])[]
}

/** The UTS #46 status of a code point and, for `mapped` and `deviation`, what it maps to. */
export type CodePointStatus =
  | { readonly status: "valid" | "ignored" | "disallowed" }
  | { readonly status: "mapped" | "deviation"; readonly to: readonly number[] }

const TOKEN = /([A-Z])([^A-Z]*)/g
const runCache = new Map<string, Runs>()
let mapping: Mapping | undefined

function runs(text: string): Runs {
  let cached = runCache.get(text)
  if (cached === undefined) {
    const starts: number[] = []
    const vals: string[] = []
    let at = 0
    for (const [, letter = "", length = ""] of text.matchAll(TOKEN)) {
      starts.push(at)
      vals.push(letter)
      at += Number.parseInt(length, 36)
    }
    starts.push(at)
    cached = { starts, vals }
    runCache.set(text, cached)
  }
  return cached
}

function search(starts: readonly number[], cp: number): number {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if ((starts[mid] ?? 0) <= cp) lo = mid
    else hi = mid - 1
  }
  return lo
}

function runAt(text: string, cp: number, fallback: string): string {
  const { starts, vals } = runs(text)
  if (cp >= (starts[starts.length - 1] ?? 0)) return fallback
  return vals[search(starts, cp)] ?? fallback
}

function numbers(text: string): number[] {
  return text === "" ? [] : text.split(".").map((n) => Number.parseInt(n, 36))
}

function mappingTable(): Mapping {
  if (mapping === undefined) {
    const starts: number[] = []
    const kinds: string[] = []
    const data: number[][] = []
    let at = 0
    for (const [, kind = "", body = ""] of MAPPING.matchAll(TOKEN)) {
      starts.push(at)
      kinds.push(kind)
      if (kind === "V" || kind === "I" || kind === "X") {
        data.push([])
        at += Number.parseInt(body, 36)
      } else if (kind === "M" || kind === "P") {
        const [length = 0, offset = 0] = numbers(body)
        data.push([offset])
        at += kind === "M" ? length : length * 2
      } else {
        data.push(numbers(body))
        at += 1
      }
    }
    starts.push(at)
    mapping = { starts, kinds, data }
  }
  return mapping
}

/** Looks up the UTS #46 status of one code point. */
export function codePointStatus(cp: number): CodePointStatus {
  const { starts, kinds, data } = mappingTable()
  const i = search(starts, cp)
  const kind = kinds[i]
  const values = data[i] ?? []
  if (kind === "V") return { status: "valid" }
  if (kind === "I") return { status: "ignored" }
  if (kind === "M") return { status: "mapped", to: [cp + (values[0] ?? 0)] }
  if (kind === "P") {
    return (cp - (starts[i] ?? 0)) % 2 === 0
      ? { status: "mapped", to: [cp + (values[0] ?? 0)] }
      : { status: "valid" }
  }
  if (kind === "T") return { status: "mapped", to: values }
  if (kind === "E") return { status: "deviation", to: values }
  return { status: "disallowed" }
}

export const bidiClass = (cp: number): string => runAt(BIDI, cp, "L")
export const joiningType = (cp: number): string => runAt(JOINING, cp, "U")
export const isVirama = (cp: number): boolean => runAt(VIRAMA, cp, "N") === "V"
export const isMark = (cp: number): boolean => runAt(MARK, cp, "N") === "M"
export const scriptOf = (cp: number): string => runAt(SCRIPTS, cp, "N")
