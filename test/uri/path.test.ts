import { describe, expect, it } from "vitest"
import { normalizePath, removeDotSegments } from "../../src/uri"

describe("removeDotSegments (RFC 3986 §5.2.4)", () => {
  it.each([
    ["/a/b/c/./../../g", "/a/g"],
    ["mid/content=5/../6", "mid/6"],
    ["/../g", "/g"],
    ["/./g", "/g"],
    [".", ""],
    ["..", ""],
    ["/.", "/"],
    ["/..", "/"],
    ["a/..", "/"],
    ["a/../b", "/b"],
    ["/a/b/../../..", "/"],
    ["/a/b/..", "/a/"],
    ["/a/b/.", "/a/b/"],
    ["/a/./b/", "/a/b/"],
    ["g.", "g."],
    [".g", ".g"],
    ["g..", "g.."],
    ["..g", "..g"],
    ["./g/.", "g/"],
    ["g/./h", "g/h"],
    ["g/../h", "/h"],
    ["g;x=1/./y", "g;x=1/y"],
    ["", ""],
    ["/", "/"],
    ["//", "//"],
    ["/a//b/../c", "/a//c"],
  ])("%j → %j", (input, expected) => {
    expect(removeDotSegments(input)).toBe(expected)
  })

  it("matches the WHATWG URL parser for absolute paths", () => {
    const paths = [
      "/a/b/c/./../../g",
      "/../g",
      "/./g",
      "/a/b/..",
      "/a/b/.",
      "/a//b/../c",
      "/a/b/../../..",
      "/x/y/z/../../w/./v",
    ]
    for (const p of paths) {
      expect(removeDotSegments(p)).toBe(new URL(p, "http://x").pathname)
    }
  })
})

describe("normalizePath", () => {
  it("normalizes percent-encoding and dot segments", () => {
    expect(normalizePath("/%7e/./a/%41/../b%2f")).toBe("/~/a/b%2F")
  })

  it("keeps dot segments in relative paths (§6.2.2.3 applies to absolute paths only)", () => {
    expect(normalizePath("../a/%7e")).toBe("../a/~")
    expect(normalizePath("./a")).toBe("./a")
    expect(normalizePath("a/../b")).toBe("a/../b")
    expect(normalizePath("/a/../b")).toBe("/b")
  })

  it("handles trailing slash modes", () => {
    expect(normalizePath("/a/b", { trailingSlash: "add" })).toBe("/a/b/")
    expect(normalizePath("/a/b/", { trailingSlash: "remove" })).toBe("/a/b")
    expect(normalizePath("/", { trailingSlash: "remove" })).toBe("/")
    expect(normalizePath("", { trailingSlash: "add" })).toBe("")
    expect(normalizePath("/a/b/", { trailingSlash: "keep" })).toBe("/a/b/")
  })
})
