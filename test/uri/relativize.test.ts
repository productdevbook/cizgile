import { describe, expect, it } from "vitest"
import { normalizeUri, relativize, resolveUri } from "../../src/uri"
import { ABNORMAL, BASE, NORMAL } from "../fixtures/rfc3986-5-4"

describe("relativize (inverse of resolveUri)", () => {
  it.each([
    ["http://a/b/c/g", "g"],
    ["http://a/b/g", "../g"],
    ["http://a/g", "../../g"],
    ["http://a/", "../../"],
    ["http://a/b/c/", "."],
    ["http://a/b/", "../"],
    ["http://a/b/c/d;p?q#s", "#s"],
    ["http://a/b/c/d;p?y", "?y"],
    ["http://a/b/c/d;p?q", ""],
    ["http://a/b/c/d;p", "d;p"],
    ["http://a/b/c/d;p#s", "d;p#s"],
    ["http://a/b/c/g?y#s", "g?y#s"],
    ["http://g/", "//g/"],
    ["http://g", "//g"],
    ["http://a:8080/x", "//a:8080/x"],
    ["ftp://a/x", "ftp://a/x"],
    ["http://a/b/c/g/", "g/"],
    ["http://a/b/c/g/h", "g/h"],
    ["http://a/x/y/z", "../../x/y/z"],
    ["HTTP://a/b/c/g", "g"],
  ])("%j → %j", (target, expected) => {
    expect(relativize(BASE, target)).toBe(expected)
    expect(resolveUri(BASE, relativize(BASE, target))).toBe(target.replace(/^HTTP:/, "http:"))
  })

  it("prefixes ./ when the first segment would look like a scheme", () => {
    expect(relativize("http://a/b/", "http://a/b/this:that")).toBe("./this:that")
    expect(resolveUri("http://a/b/", "./this:that")).toBe("http://a/b/this:that")
    expect(relativize("http://a/b/x", "http://a/b/x:y")).toBe("./x:y")
    expect(relativize("http://a/b/x", "http://a/b/x:y?q")).toBe("./x:y?q")
    expect(relativize("http://a/b/x", "http://a/x:y")).toBe("../x:y")
  })

  it("handles empty and rootless base paths", () => {
    expect(relativize("http://a", "http://a/x")).toBe("x")
    expect(relativize("http://a", "http://a")).toBe("")
    expect(relativize("http://a/", "http://a")).toBe("")
    expect(relativize("mailto:x@y", "mailto:z@y")).toBe("mailto:z@y")
    expect(relativize("/rel", "http://a/x")).toBe("http://a/x")
  })

  it("round-trips every §5.4 target", () => {
    for (const [, target] of [...NORMAL, ...ABNORMAL]) {
      if (!target.startsWith("http:")) continue
      const t = normalizeUri(target)
      expect(resolveUri(BASE, relativize(BASE, t)), t).toBe(t)
    }
  })
})
