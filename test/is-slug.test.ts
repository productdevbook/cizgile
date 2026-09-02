import { describe, expect, it } from "vitest"
import { isSlug, slugify } from "../src"

describe("isSlug defaults", () => {
  it.each(["a", "abc", "abc-123", "a-b-c", "0", "hello-world"])("accepts %j", (input) => {
    expect(isSlug(input)).toBe(true)
  })

  it.each(["", "-a", "a-", "a--b", "A", "a_b", "a.b", "a b", "é", "a/b", "-", "a​b"])(
    "rejects %j",
    (input) => {
      expect(isSlug(input)).toBe(false)
    },
  )

  it("rejects non-strings", () => {
    expect(isSlug(1 as unknown as string)).toBe(false)
  })
})

describe("isSlug options", () => {
  it("separator", () => {
    expect(isSlug("a_b", { separator: "_" })).toBe(true)
    expect(isSlug("a-b", { separator: "_" })).toBe(false)
    expect(isSlug("a.b", { separator: "." })).toBe(true)
    expect(isSlug("ab", { separator: "" })).toBe(true)
    expect(isSlug("a-b", { separator: "" })).toBe(false)
    expect(isSlug("a--b", { separator: "--" })).toBe(true)
    expect(isSlug("a----b", { separator: "--" })).toBe(false)
    expect(isSlug("a-b", { separator: "--" })).toBe(false)
  })

  it("lowercase", () => {
    expect(isSlug("Ab-C", { lowercase: false })).toBe(true)
    expect(isSlug("Ab-C")).toBe(false)
  })

  it("preserveCharacters", () => {
    expect(isSlug("v1.2", { preserveCharacters: ["."] })).toBe(true)
    expect(isSlug(".", { preserveCharacters: ["."] })).toBe(false)
    expect(isSlug("..", { preserveCharacters: ["."] })).toBe(false)
    expect(isSlug("..a", { preserveCharacters: ["."] })).toBe(true)
    expect(isSlug("a_b", { preserveCharacters: ["_"] })).toBe(true)
    expect(isSlug("a+b", { preserveCharacters: ["+"] })).toBe(true)
    expect(isSlug("a(b", { preserveCharacters: ["("] })).toBe(true)
    expect(() => isSlug("a^b", { preserveCharacters: ["^"] })).toThrow(TypeError)
  })

  it("preserveLeadingUnderscore / preserveTrailingSeparator", () => {
    expect(isSlug("_a", { preserveLeadingUnderscore: true })).toBe(true)
    expect(isSlug("_a")).toBe(false)
    expect(isSlug("__a", { preserveLeadingUnderscore: true })).toBe(false)
    expect(isSlug("a-", { preserveTrailingSeparator: true })).toBe(true)
    expect(isSlug("a--", { preserveTrailingSeparator: true })).toBe(false)
    expect(isSlug("a", { preserveTrailingSeparator: true, separator: "" })).toBe(true)
  })

  it("maxLength", () => {
    expect(isSlug("abc", { maxLength: 3 })).toBe(true)
    expect(isSlug("abcd", { maxLength: 3 })).toBe(false)
  })

  it("unicode", () => {
    expect(isSlug("привет-мир", { unicode: true })).toBe(true)
    expect(isSlug("你好-world", { unicode: true })).toBe(true)
    expect(isSlug("é", { unicode: true })).toBe(true)
    expect(isSlug("é", { unicode: true })).toBe(false)
    expect(isSlug("ﬁ", { unicode: true })).toBe(false)
    expect(isSlug("a-́b", { unicode: true })).toBe(false)
    expect(isSlug("Привет", { unicode: true })).toBe(false)
  })
})

describe("isSlug with a locale", () => {
  it("lowercases the way slugify does under the same locale", () => {
    expect(slugify("ILIK", { locale: "tr", unicode: true })).toBe("ılık")
    expect(isSlug("ılık", { locale: "tr", unicode: true })).toBe(true)
    expect(isSlug("ilik", { locale: "tr", unicode: true })).toBe(true)
    expect(isSlug("ILIK", { locale: "tr", unicode: true })).toBe(false)
    expect(isSlug("istanbul", { locale: "tr" })).toBe(true)
  })
})
