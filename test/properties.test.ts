import { describe, expect, it } from "vitest"
import { isSlug, slugify, type SlugifyOptions } from "../src"
import { cyrillic, greek } from "../src/transliterate"
import { encodePathSegment, isSegmentNzNc, removeDotSegments } from "../src/uri"
import { CORPUS } from "./fixtures/corpus"

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ALPHABET = [
  ...Array.from("abcXYZ019 -_.~!$&'()*+,;=:@/?#%[]<>\"\\^`{}|"),
  "é",
  "ß",
  "İ",
  "ı",
  "ж",
  "щ",
  "α",
  "你",
  "😀",
  "́",
  "​",
  "‏",
  "﻿",
  "\uD800",
  "ﬁ",
  "①",
  "’",
  "\t",
  "\n",
]

function randomStrings(count: number, seed: number): string[] {
  const rand = mulberry32(seed)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const length = Math.floor(rand() * 24)
    let s = ""
    for (let j = 0; j < length; j++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)]
    out.push(s)
  }
  return out
}

const INPUTS = [...CORPUS, ...randomStrings(400, 42)]

const OPTION_SETS: ReadonlyArray<readonly [string, SlugifyOptions]> = [
  ["defaults", {}],
  ["underscore", { separator: "_" }],
  ["dot", { separator: "." }],
  ["tilde", { separator: "~" }],
  ["empty separator", { separator: "" }],
  ["double dash", { separator: "--" }],
  ["unicode", { unicode: true }],
  ["unicode tr", { unicode: true, locale: "tr" }],
  ["keep case", { lowercase: false }],
  ["maxLength 10", { maxLength: 10 }],
  ["maxLength 1", { maxLength: 1 }],
  ["preserve dot", { preserveCharacters: ["."] }],
  ["preserve dot, short", { preserveCharacters: ["."], maxLength: 2 }],
  ["tr", { locale: "tr" }],
  ["de", { locale: "de" }],
  ["decamelize", { decamelize: true }],
  ["cyrillic+greek", { transliterate: [cyrillic, greek] }],
  ["no transliterate", { transliterate: false }],
  ["no remove", { remove: false }],
  ["leading underscore", { preserveLeadingUnderscore: true }],
  ["trailing separator", { preserveTrailingSeparator: true }],
  [
    "replacements",
    {
      replacements: [
        ["&", " and "],
        ["😀", " smile "],
      ],
    },
  ],
]

describe.each(OPTION_SETS)("property: %s", (_name, options) => {
  it("is idempotent", () => {
    for (const input of INPUTS) {
      const once = slugify(input, options)
      expect(slugify(once, options)).toBe(once)
    }
  })

  it("produces slugs that isSlug accepts (or the empty string)", () => {
    for (const input of INPUTS) {
      const slug = slugify(input, options)
      if (slug === "") continue
      expect(isSlug(slug, options), JSON.stringify({ input, slug })).toBe(true)
    }
  })

  it("respects maxLength", () => {
    if (options.maxLength === undefined) return
    for (const input of INPUTS) {
      expect(slugify(input, options).length).toBeLessThanOrEqual(options.maxLength)
    }
  })

  it("ASCII output is a valid RFC 3986 segment-nz-nc that needs no encoding", () => {
    if (options.unicode) return
    for (const input of INPUTS) {
      const slug = slugify(input, options)
      const shape =
        options.preserveCharacters === undefined
          ? options.lowercase === false
            ? /^[A-Za-z0-9\-_.~]*$/
            : /^[a-z0-9\-_.~]*$/
          : /^/
      expect(slug).toMatch(shape)
      expect(encodePathSegment(slug)).toBe(slug)
      for (const ch of slug) expect(isSegmentNzNc(ch.codePointAt(0) ?? 0)).toBe(true)
    }
  })

  it("is never a dot-segment and survives removeDotSegments unchanged", () => {
    for (const input of INPUTS) {
      const slug = slugify(input, options)
      expect(slug).not.toBe(".")
      expect(slug).not.toBe("..")
      expect(removeDotSegments("/" + slug)).toBe("/" + slug)
    }
  })

  it("unicode slugs are whole grapheme clusters", () => {
    if (!options.unicode || options.maxLength === undefined) return
    const seg = new Intl.Segmenter("und", { granularity: "grapheme" })
    for (const input of INPUTS) {
      const slug = slugify(input, options)
      const clusters = [...seg.segment(input.normalize("NFKC"))].map((c) => c.segment)
      for (const cluster of [...seg.segment(slug)].map((c) => c.segment)) {
        expect(clusters.some((c) => c.includes(cluster)) || cluster.length === 1).toBe(true)
      }
    }
  })

  it("unicode output is NFKC", () => {
    if (!options.unicode) return
    for (const input of INPUTS) {
      const slug = slugify(input, options)
      expect(slug.normalize("NFKC")).toBe(slug)
    }
  })

  it("never starts or ends with the separator unless asked", () => {
    const separator = options.separator ?? "-"
    if (separator === "" || options.preserveTrailingSeparator) return
    for (const input of INPUTS) {
      const slug = slugify(input, options)
      expect(slug.startsWith(separator)).toBe(false)
      expect(slug.endsWith(separator)).toBe(false)
      expect(slug.includes(separator + separator)).toBe(false)
    }
  })
})
