import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { idnaToAsciiResult, idnaToUnicodeResult } from "../../src/idna"

const FILE = resolve(import.meta.dirname, "../fixtures/IdnaTestV2.txt")

function unescape(text: string): string {
  return text.replace(/\\u([0-9A-Fa-f]{4})|\\x\{([0-9A-Fa-f]+)\}/g, (_, a: string, b: string) =>
    String.fromCodePoint(Number.parseInt(a ?? b, 16)),
  )
}

function statuses(column: string): string[] {
  const inner = column.trim().replace(/^\[|\]$/g, "")
  return inner === "" ? [] : inner.split(/\s*,\s*/)
}

interface Row {
  readonly line: number
  readonly source: string
  readonly toUnicode: string
  readonly unicodeStatus: string[]
  readonly toAsciiN: string
  readonly asciiStatus: string[]
  readonly toAsciiT: string
  readonly transitionalStatus: string[]
}

function rows(): Row[] {
  const out: Row[] = []
  readFileSync(FILE, "utf8")
    .split("\n")
    .forEach((raw, index) => {
      const line = raw.replace(/#.*/, "")
      if (line.trim() === "") return
      const cols = line.split(";").map((c) => c.trim())
      const value = (c: string | undefined, fallback: string): string =>
        c === undefined || c === "" ? fallback : c === '""' ? "" : unescape(c)
      const source = value(cols[0], "")
      const toUnicode = value(cols[1], source)
      const unicodeStatus = statuses(cols[2] ?? "")
      const toAsciiN = value(cols[3], toUnicode)
      const asciiStatus =
        cols[4] === undefined || cols[4] === "" ? unicodeStatus : statuses(cols[4])
      const toAsciiT = value(cols[5], toAsciiN)
      const transitionalStatus =
        cols[6] === undefined || cols[6] === "" ? asciiStatus : statuses(cols[6])
      out.push({
        line: index + 1,
        source,
        toUnicode,
        unicodeStatus,
        toAsciiN,
        asciiStatus,
        toAsciiT,
        transitionalStatus,
      })
    })
  return out
}

const ALL = rows()
const STRICT = { beStrict: true, checkBidi: true, checkJoiners: true } as const
const bySet = (codes: readonly string[]): string => codes.toSorted().join(",")

describe("IdnaTestV2.txt (Unicode 16, nontransitional)", () => {
  it("has the whole file", () => {
    expect(ALL.length).toBeGreaterThan(6000)
  })

  it("ToUnicode reports the same errors and result", () => {
    const failures: string[] = []
    for (const row of ALL) {
      const { result, errors } = idnaToUnicodeResult(row.source, STRICT)
      if (bySet(errors) !== bySet(row.unicodeStatus) || result !== row.toUnicode) {
        failures.push(
          `${row.line}: ${JSON.stringify(row.source)} -> ${JSON.stringify(result)} [${errors.join()}] want ${JSON.stringify(row.toUnicode)} [${row.unicodeStatus.join()}]`,
        )
      }
    }
    expect(failures.slice(0, 20)).toEqual([])
  })

  it("ToASCII reports the same errors and result", () => {
    const failures: string[] = []
    for (const row of ALL) {
      const { result, errors } = idnaToAsciiResult(row.source, STRICT)
      const want = row.asciiStatus.filter((code) => code !== "X4_2")
      if (bySet(errors) !== bySet(want) || result !== row.toAsciiN) {
        failures.push(
          `${row.line}: ${JSON.stringify(row.source)} -> ${JSON.stringify(result)} [${errors.join()}] want ${JSON.stringify(row.toAsciiN)} [${want.join()}]`,
        )
      }
    }
    expect(failures.slice(0, 20)).toEqual([])
  })

  it("ToASCII with transitional processing reports the same errors and result", () => {
    const failures: string[] = []
    for (const row of ALL) {
      const { result, errors } = idnaToAsciiResult(row.source, {
        ...STRICT,
        transitionalProcessing: true,
      })
      const want = row.transitionalStatus.filter((code) => code !== "X4_2")
      if (bySet(errors) !== bySet(want) || result !== row.toAsciiT) {
        failures.push(
          `${row.line}: ${JSON.stringify(row.source)} -> ${JSON.stringify(result)} [${errors.join()}] want ${JSON.stringify(row.toAsciiT)} [${want.join()}]`,
        )
      }
    }
    expect(failures.slice(0, 20)).toEqual([])
  })
})
