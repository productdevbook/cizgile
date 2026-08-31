import { describe, expect, it } from "vitest"
import { truncateSlug } from "../src"

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

  it("never splits a surrogate pair or a base from its marks", () => {
    expect(truncateSlug("a😀b", 2)).toBe("a")
    expect(truncateSlug("a😀b", 3)).toBe("a😀")
    expect(truncateSlug("éx", 1)).toBe("")
    expect(truncateSlug("éx", 2)).toBe("é")
    expect(truncateSlug("ab́̂c", 3)).toBe("a")
  })

  it("rejects invalid limits", () => {
    expect(() => truncateSlug("x", -1)).toThrow(RangeError)
    expect(() => truncateSlug("x", 1.5)).toThrow(RangeError)
  })
})
