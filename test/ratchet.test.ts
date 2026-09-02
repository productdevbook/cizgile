import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = resolve(import.meta.dirname, "..")
const SRC = join(ROOT, "src")

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.endsWith(".ts")) out.push(full)
  }
  return out.toSorted()
}

const SOURCES = walk(SRC)
const read = (file: string): string => readFileSync(file, "utf8")

function specifiers(file: string): string[] {
  return [...read(file).matchAll(/(?:from|import)\s+"([^"]+)"/g)].map((m) => m[1] ?? "")
}

function resolveSpecifier(from: string, specifier: string): string {
  const base = resolve(dirname(from), specifier)
  return base.endsWith(".ts") ? base : `${base}.ts`
}

function reachable(entry: string): Set<string> {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() ?? ""
    if (seen.has(file)) continue
    seen.add(file)
    for (const spec of specifiers(file)) queue.push(resolveSpecifier(file, spec))
  }
  return seen
}

const NON_LATIN_TABLES =
  /transliterate\/(cyrillic|greek|arabic|armenian|georgian|dhivehi|hebrew|hangul|kana|locales-cyrillic|locales-other)\.ts$/
const TABLE_FILES = SOURCES.filter((f) =>
  /transliterate\/(latin|symbols|cyrillic|greek|arabic|armenian|georgian|dhivehi|hebrew|hangul|kana)\.ts$/.test(
    f,
  ),
)

describe("ratchets: invariants read from the source tree", () => {
  it("has at least the expected number of source files", () => {
    expect(SOURCES.length).toBeGreaterThan(25)
  })

  it("only ever imports relative modules (zero runtime dependencies, no node: builtins)", () => {
    for (const file of SOURCES) {
      for (const spec of specifiers(file)) {
        expect(spec, `${relative(ROOT, file)} imports ${spec}`).toMatch(/^\.\.?\//)
        expect(existsSync(resolveSpecifier(file, spec)), `${relative(ROOT, file)} → ${spec}`).toBe(
          true,
        )
      }
    }
  })

  it("the main entry never reaches a non-Latin script table", () => {
    const files = [...reachable(join(SRC, "index.ts"))].map((f) => relative(SRC, f))
    expect(files.length).toBeGreaterThan(5)
    for (const f of files) expect(f, f).not.toMatch(NON_LATIN_TABLES)
  })

  it("the uri entry never reaches transliteration or slug code", () => {
    const files = [...reachable(join(SRC, "uri.ts"))].map((f) => relative(SRC, f))
    for (const f of files) expect(f, f).toMatch(/^uri(\.ts|\/)/)
  })

  it("script table files are plain object literals with no side effects", () => {
    expect(TABLE_FILES.length).toBe(11)
    for (const file of TABLE_FILES) {
      const text = read(file)
      expect(text, file).not.toMatch(/\bnew\b/)
      expect(text, file).not.toMatch(/Object\.freeze/)
      expect(text, file).not.toMatch(/^[A-Za-z_$][\w$]*\(/m)
      expect(text, file).not.toMatch(/^import(?! type)/m)
      const exports = text.split("\n").filter((line) => line.startsWith("export "))
      expect(exports.length).toBeGreaterThan(0)
      for (const line of exports) {
        expect(line, `${file}: ${line}`).toMatch(/^export const \w+: TransliterationTable = \{$/)
      }
    }
  })

  it("every exported function declares its return type (isolatedDeclarations stays on)", () => {
    const tsconfig = JSON.parse(read(join(ROOT, "tsconfig.json"))) as {
      compilerOptions: Record<string, unknown>
    }
    expect(tsconfig.compilerOptions["isolatedDeclarations"]).toBe(true)
    expect(tsconfig.compilerOptions["strict"]).toBe(true)
    for (const file of SOURCES) {
      for (const match of read(file).matchAll(/^export function [\s\S]*?\{$/gm)) {
        expect(match[0], `${relative(ROOT, file)}: ${match[0]}`).toMatch(/\)\s*:\s*[^{]+\{$/)
      }
    }
  })

  it("every name the entry points export is documented where it is declared", () => {
    const entries = ["index.ts", "transliterate.ts", "uri.ts"].map((f) => join(SRC, f))
    let checked = 0
    for (const entry of entries) {
      const text = read(entry)
      for (const block of text.matchAll(/export(?: type)? \{([^}]*)\} from "([^"]+)"/g)) {
        const target = resolveSpecifier(entry, block[2] ?? "")
        const lines = read(target).split("\n")
        for (const raw of (block[1] ?? "").split(",")) {
          const name = raw.replace(/\btype\b/, "").trim()
          if (name === "") continue
          const at = lines.findIndex((line) =>
            new RegExp(`^export (?:function|const|interface|type|async function) ${name}\\b`).test(
              line,
            ),
          )
          expect(at, `${relative(ROOT, target)} declares ${name}`).toBeGreaterThan(0)
          expect(
            lines[at - 1]?.trimEnd().endsWith("*/"),
            `${relative(ROOT, target)}: ${name} has no JSDoc`,
          ).toBe(true)
          checked += 1
        }
      }
      for (const local of text.matchAll(/^export const (\w+)/gm)) {
        const lines = text.split("\n")
        const at = lines.findIndex((line) => line.startsWith(`export const ${local[1]}`))
        expect(
          lines[at - 1]?.trimEnd().endsWith("*/"),
          `${relative(ROOT, entry)}: ${local[1]} has no JSDoc`,
        ).toBe(true)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(120)
  })

  it("never touches a host runtime API", () => {
    for (const file of SOURCES) {
      const text = read(file)
      expect(text, file).not.toMatch(/\b(Bun|process|Deno|window|globalThis)\./)
      expect(text, file).not.toMatch(/\brequire\(/)
      expect(text, file).not.toMatch(/\bTextEncoder\b|\bTextDecoder\b/)
    }
  })

  it("declares no runtime dependencies and exports what dist will contain", () => {
    const pkg = JSON.parse(read(join(ROOT, "package.json"))) as {
      dependencies?: unknown
      peerDependencies?: unknown
      sideEffects: boolean
      exports: Record<string, { default?: string } | string>
    }
    expect(pkg.dependencies).toBeUndefined()
    expect(pkg.peerDependencies).toBeUndefined()
    expect(pkg.sideEffects).toBe(false)
    const entries = Object.values(pkg.exports)
      .map((e) => (typeof e === "string" ? e : (e.default ?? "")))
      .filter((p) => p.endsWith(".mjs"))
    expect(entries.toSorted()).toEqual([
      "./dist/index.mjs",
      "./dist/transliterate.mjs",
      "./dist/uri.mjs",
    ])
    const dist = join(ROOT, "dist")
    if (!existsSync(dist)) return
    for (const file of readdirSync(dist)) {
      if (!file.endsWith(".mjs")) continue
      expect(entries, file).toContain(`./dist/${file}`)
    }
  })
})
