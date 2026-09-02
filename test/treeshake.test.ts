import { resolve } from "node:path"
import { rolldown } from "rolldown"
import { describe, expect, it } from "vitest"

const SRC = resolve(import.meta.dirname, "../src")

async function bundle(code: string, minify = false): Promise<string> {
  const build = await rolldown({
    input: "virtual-entry",
    platform: "neutral",
    treeshake: true,
    logLevel: "silent",
    plugins: [
      {
        name: "virtual-entry",
        resolveId(id) {
          return id === "virtual-entry" ? id : null
        },
        load(id) {
          return id === "virtual-entry" ? code : null
        },
      },
    ],
  })
  const { output } = await build.generate({ format: "es", minify })
  await build.close()
  return output.map((chunk) => ("code" in chunk ? chunk.code : "")).join("\n")
}

const NON_LATIN = ["ж", "α", "ا", "ა", "ա", "ހ", "ב", "ᄀ", "あ"]

const BUDGET_BYTES: ReadonlyArray<readonly [string, string, number]> = [
  ["slugify only", `import { slugify } from "${SRC}/index.ts"; console.log(slugify("x"))`, 18_000],
  ["the whole main entry", `import * as m from "${SRC}/index.ts"; console.log(m)`, 20_000],
  [
    "transliterate only",
    `import { transliterate } from "${SRC}/transliterate.ts"; console.log(transliterate("x"))`,
    4_500,
  ],
  ["every script table", `import * as m from "${SRC}/transliterate.ts"; console.log(m)`, 17_000],
  [
    "resolveUri and percentEncode",
    `import { resolveUri, percentEncode } from "${SRC}/uri.ts"; console.log(resolveUri("http://a/b", "c"), percentEncode("x"))`,
    6_000,
  ],
  ["the whole uri entry", `import * as m from "${SRC}/uri.ts"; console.log(m)`, 25_000],
]

describe("size budget (minified, not gzipped)", () => {
  it.each(BUDGET_BYTES)("%s stays under budget", async (_label, code, budget) => {
    const bytes = Buffer.byteLength(await bundle(code, true), "utf8")
    expect(bytes).toBeLessThanOrEqual(budget)
    expect(bytes).toBeGreaterThan(budget / 4)
  })
})

describe("tree-shaking", () => {
  it("importing slugify does not pull in non-Latin script tables", async () => {
    const code = await bundle(
      `import { slugify } from "${SRC}/index.ts"; console.log(slugify("x"))`,
    )
    expect(code).toContain("slugify")
    expect(code).toContain("ß")
    for (const ch of NON_LATIN) expect(code, ch).not.toContain(ch)
  })

  it("importing one script table does not pull in the others", async () => {
    const code = await bundle(
      `import { cyrillic } from "${SRC}/transliterate.ts"; console.log(cyrillic)`,
    )
    expect(code).toContain("ж")
    for (const ch of NON_LATIN.slice(1)) expect(code, ch).not.toContain(ch)
  })

  it("the uri entry carries no transliteration data", async () => {
    const code = await bundle(
      `import { removeDotSegments } from "${SRC}/uri.ts"; console.log(removeDotSegments("/a/../b"))`,
    )
    expect(code).toContain("removeDotSegments")
    expect(code).not.toContain("ß")
    expect(code).not.toContain("transliterat")
    for (const ch of NON_LATIN) expect(code, ch).not.toContain(ch)
  })
})
