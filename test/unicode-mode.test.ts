import { describe, expect, it } from "vitest"
import { isSlug, slugify } from "../src"
import { encodePathSegment, hasBidiControls, iriToUri, isSegmentNzNc, uriToIri } from "../src/uri"
import { CORPUS_SAFE } from "./fixtures/corpus"

const unicode = { unicode: true } as const

describe("unicode: true", () => {
  it.each([
    ["Привет мир", "привет-мир"],
    ["你好 World", "你好-world"],
    ["İstanbul", "istanbul"],
    ["Ünïcödé Ünïcödé", "ünïcödé-ünïcödé"],
    ["ﬁnal ①", "final-1"],
    ["a​b", "ab"],
    ["́abc", "abc"],
    ["a ́b", "a-b"],
    ["é", "é"],
    ["مرحبا بالعالم", "مرحبا-بالعالم"],
    ["a‏b", "ab"],
    ["I ♥ Dogs & Cats", "i-love-dogs-and-cats"],
    ["Καλημέρα κόσμε!", "καλημέρα-κόσμε"],
    ["🦄 party", "unicorn-party"],
    ["😀", ""],
  ])("%j → %j", (input, expected) => {
    expect(slugify(input, unicode)).toBe(expected)
  })

  it("output is NFKC and free of format characters", () => {
    for (const s of CORPUS_SAFE) {
      const slug = slugify(s, unicode)
      expect(slug.normalize("NFKC")).toBe(slug)
      expect(hasBidiControls(slug)).toBe(false)
      expect(slug).not.toMatch(/[\p{Cc}\p{Cf}]/u)
    }
  })

  it("converts to a URI with iriToUri and back losslessly", () => {
    for (const s of CORPUS_SAFE) {
      const slug = slugify(s, unicode)
      const uri = iriToUri(slug)
      expect(uri).toMatch(/^[A-Za-z0-9\-%]*$/)
      expect(uriToIri(uri)).toBe(slug)
      expect(encodePathSegment(slug)).toBe(uri)
      for (const ch of uri.replaceAll("%", ""))
        expect(isSegmentNzNc(ch.codePointAt(0) ?? 0)).toBe(true)
    }
  })

  it("isSlug agrees with slugify in unicode mode", () => {
    for (const s of CORPUS_SAFE) {
      const slug = slugify(s, unicode)
      expect(slug === "" || isSlug(slug, unicode)).toBe(true)
    }
    expect(isSlug("ﬁ", unicode)).toBe(false)
    expect(isSlug("a‏b", unicode)).toBe(false)
    expect(isSlug("́a", unicode)).toBe(false)
    expect(isSlug("Привет", unicode)).toBe(false)
    expect(isSlug("Привет", { unicode: true, lowercase: false })).toBe(true)
  })

  it("keeps locale casing but not locale transliteration", () => {
    expect(slugify("Straße Über", { unicode: true, locale: "de" })).toBe("straße-über")
    expect(slugify("Fisch & Chips", { unicode: true, locale: "de" })).toBe("fisch-und-chips")
  })
})
