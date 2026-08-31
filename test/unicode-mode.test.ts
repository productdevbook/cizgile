import { describe, expect, it } from "vitest"
import { checkScripts, detectScripts, isBidiSafeComponent, isSlug, slugify } from "../src"
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

  it("script restriction levels (UTS #39 §5.1)", () => {
    const cyrillicA = "p\u0430ypal"
    expect(slugify(cyrillicA, unicode)).toBe(cyrillicA)
    expect(() => slugify(cyrillicA, { unicode: true, scripts: "single" })).toThrow(RangeError)
    expect(() => slugify(cyrillicA, { unicode: true, scripts: "moderately-restrictive" })).toThrow(
      RangeError,
    )
    expect(slugify("paypal", { unicode: true, scripts: "single" })).toBe("paypal")
    expect(slugify("東京タワー", { unicode: true, scripts: "highly-restrictive" })).toBe(
      "東京タワー",
    )
    expect(() => slugify("東京タワー", { unicode: true, scripts: "single" })).toThrow(RangeError)
    expect(slugify("hello नमस्ते", { unicode: true, scripts: "moderately-restrictive" })).toBe(
      "hello-नमस्ते",
    )
    expect(() => slugify("hello नमस्ते", { unicode: true, scripts: "highly-restrictive" })).toThrow(
      RangeError,
    )
    expect(() =>
      slugify("Привет world", { unicode: true, scripts: "moderately-restrictive" }),
    ).toThrow(RangeError)
    expect(slugify("한국어 abc", { unicode: true, scripts: "highly-restrictive" })).toBe(
      "한국어-abc",
    )
    expect(slugify("ASCII only 123", { scripts: "single" })).toBe("ascii-only-123")
    expect(checkScripts(cyrillicA, "single")).toEqual({ ok: false, scripts: ["Cyrillic", "Latin"] })
    expect(detectScripts("東京タワー")).toEqual(["Han", "Katakana"])
    expect(detectScripts("123 -")).toEqual([])
    expect(isSlug(cyrillicA, { unicode: true, scripts: "single" })).toBe(false)
    expect(isSlug(cyrillicA, unicode)).toBe(true)
  })

  it("bidi component rules (RFC 3987 §4.2)", () => {
    expect(isBidiSafeComponent("hello")).toBe(true)
    expect(isBidiSafeComponent("مرحبا")).toBe(true)
    expect(isBidiSafeComponent("مرحبا-بالعالم")).toBe(true)
    expect(isBidiSafeComponent("שלום")).toBe(true)
    expect(isBidiSafeComponent("مرحبا-123")).toBe(false)
    expect(isBidiSafeComponent("123-مرحبا")).toBe(false)
    expect(isBidiSafeComponent("hello-مرحبا")).toBe(false)
    expect(isBidiSafeComponent("مرحباworld")).toBe(false)
    expect(isBidiSafeComponent("")).toBe(true)
    expect(slugify("مرحبا 123", unicode)).toBe("مرحبا-123")
    expect(() => slugify("مرحبا 123", { unicode: true, bidi: "throw" })).toThrow(RangeError)
    expect(slugify("مرحبا 123", { unicode: true, bidi: "encode" })).toBe(
      "%D9%85%D8%B1%D8%AD%D8%A8%D8%A7-123",
    )
    expect(slugify("hello مرحبا", { unicode: true, bidi: "encode" })).toMatch(/^[a-z0-9A-F%-]+$/)
    expect(slugify("مرحبا بالعالم", { unicode: true, bidi: "throw" })).toBe("مرحبا-بالعالم")
    expect(isSlug("مرحبا-123", { unicode: true, bidi: "throw" })).toBe(false)
    expect(isSlug("مرحبا-بالعالم", { unicode: true, bidi: "throw" })).toBe(true)
  })

  it("keeps locale casing but not locale transliteration", () => {
    expect(slugify("Straße Über", { unicode: true, locale: "de" })).toBe("straße-über")
    expect(slugify("Fisch & Chips", { unicode: true, locale: "de" })).toBe("fisch-und-chips")
  })
})
