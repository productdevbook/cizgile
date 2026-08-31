import { describe, expect, it } from "vitest"
import { truncateSlug } from "../src"
import { graphemeBoundary } from "../src/slug/truncate"

describe("truncateSlug", () => {
  it.each([
    ["hello-world", 8, "hello"],
    ["helloworld", 5, "hello"],
    ["hello-world", 5, "hello"],
    ["hello-world", 6, "hello"],
    ["hello-world", 11, "hello-world"],
    ["hello-world", 12, "hello-world"],
    ["hello-world", 0, ""],
    ["hello-world", 1, "h"],
    ["a-b-c-d", 3, "a-b"],
    ["a-b-c-d", 4, "a-b"],
    ["", 3, ""],
  ])("%j, %d → %j", (slug, max, expected) => {
    expect(truncateSlug(slug, max)).toBe(expected)
  })

  it("honours a custom separator", () => {
    expect(truncateSlug("hello_world", 8, "_")).toBe("hello")
    expect(truncateSlug("hello_world", 8, "-")).toBe("hello_wo")
    expect(truncateSlug("hello--world", 7, "--")).toBe("hello")
    expect(truncateSlug("hello--world", 6, "--")).toBe("hello")
    expect(truncateSlug("helloworld", 4, "")).toBe("hell")
  })

  it("never splits a grapheme cluster (UAX #29)", () => {
    expect(truncateSlug("क्षत्रिय", 2)).toBe("")
    expect(truncateSlug("क्षत्रिय", 3)).toBe("क्ष")
    expect(truncateSlug("👨‍👩‍👧x", 3)).toBe("")
    expect(truncateSlug("👨‍👩‍👧x", 8)).toBe("👨‍👩‍👧")
    expect(truncateSlug("👍🏽x", 2)).toBe("")
    expect(truncateSlug("👍🏽x", 4)).toBe("👍🏽")
    expect(truncateSlug("\u1112\u1161\u11ab", 2)).toBe("")
    expect(truncateSlug("\u1112\u1161\u11ab", 3)).toBe("\u1112\u1161\u11ab")
    expect(truncateSlug("e\u0301\uFE0Fx", 2)).toBe("")
  })

  it("never splits a surrogate pair or a base from its marks", () => {
    expect(truncateSlug("a😀b", 2)).toBe("a")
    expect(truncateSlug("a😀b", 3)).toBe("a😀")
    expect(truncateSlug("éx", 1)).toBe("")
    expect(truncateSlug("éx", 2)).toBe("é")
    expect(truncateSlug("ab́̂c", 3)).toBe("a")
  })

  it("code-point fallback (runtimes without Intl.Segmenter) keeps emoji sequences, modifiers, marks and jamo whole", () => {
    const fb = { fallback: true }
    expect(graphemeBoundary("👨‍👩‍👧x", 3, fb)).toBe(0)
    expect(graphemeBoundary("👨‍👩‍👧x", 8, fb)).toBe(8)
    expect(graphemeBoundary("👍🏽x", 2, fb)).toBe(0)
    expect(graphemeBoundary("👍🏽x", 4, fb)).toBe(4)
    expect(graphemeBoundary("\u1112\u1161\u11ab", 2, fb)).toBe(0)
    expect(graphemeBoundary("e\u0301\uFE0Fx", 2, fb)).toBe(0)
    expect(graphemeBoundary("a😀b", 2, fb)).toBe(1)
    expect(graphemeBoundary("abc", 2, fb)).toBe(2)
    expect(graphemeBoundary("abc", 5, fb)).toBe(5)
    expect(graphemeBoundary("\u{E0067}x", 1, fb)).toBe(0)
    expect(graphemeBoundary("👨‍👩‍👧x", 3)).toBe(graphemeBoundary("👨‍👩‍👧x", 3, fb))
  })

  it("rejects invalid limits", () => {
    expect(() => truncateSlug("x", -1)).toThrow(RangeError)
    expect(() => truncateSlug("x", 1.5)).toThrow(RangeError)
  })
})
