import { describe, expect, it } from "vitest"
import { isScheme, mergePaths, parseUri, resolveUri, serializeUri } from "../../src/uri"
import { ABNORMAL, BASE, NORMAL } from "../fixtures/rfc3986-5-4"

describe("resolveUri (RFC 3986 §5.4)", () => {
  it.each(NORMAL)("normal %j → %j", (ref, expected) => {
    expect(resolveUri(BASE, ref)).toBe(expected)
  })

  it.each(ABNORMAL)("abnormal %j → %j", (ref, expected) => {
    expect(resolveUri(BASE, ref)).toBe(expected)
  })

  it("handles http:g strictly by default and compatibly on request", () => {
    expect(resolveUri(BASE, "http:g")).toBe("http:g")
    expect(resolveUri(BASE, "http:g", { strict: false })).toBe("http://a/b/c/g")
    expect(resolveUri(BASE, "HTTP:g", { strict: false })).toBe("http://a/b/c/g")
    expect(resolveUri(BASE, "ftp:g", { strict: false })).toBe("ftp:g")
  })

  it("agrees with the WHATWG URL parser on every vector it can express", () => {
    expect(new URL("//g", BASE).href).toBe("http://g/")
    for (const [ref, expected] of [...NORMAL, ...ABNORMAL]) {
      if (ref === "g:h" || ref === "//g") continue
      expect(new URL(ref, BASE).href).toBe(expected)
    }
  })

  it("only treats an ABNF-valid scheme prefix as a scheme (§3.1, §4.1)", () => {
    expect(parseUri("1:2")).toEqual({ path: "1:2" })
    expect(parseUri("a b:c")).toEqual({ path: "a b:c" })
    expect(parseUri("-a:c")).toEqual({ path: "-a:c" })
    expect(parseUri("a+b.c-d:x")).toEqual({ scheme: "a+b.c-d", path: "x" })
    expect(resolveUri("http://a/b/c/", "1:2")).toBe("http://a/b/c/1:2")
    expect(resolveUri("http://a/b/c/", "1:2")).toBe(new URL("1:2", "http://a/b/c/").href)
    expect(isScheme("http")).toBe(true)
    expect(isScheme("h2")).toBe(true)
    expect(isScheme("2h")).toBe(false)
    expect(isScheme("")).toBe(false)
    expect(isScheme("a_b")).toBe(false)
  })

  it("normalizes the base path before merging (erratum 4789, §5.2.1)", () => {
    for (const [base, ref] of [
      ["http://a/b/..", "c"],
      ["http://a/b/c/..", "d"],
      ["http://a/b/.", "d"],
      ["http://a/b/../c/./d", "e"],
      ["http://a/b/..", ""],
    ]) {
      expect(resolveUri(base ?? "", ref ?? "")).toBe(new URL(ref ?? "", base).href)
    }
    expect(resolveUri("http://a/b/..", "c")).toBe("http://a/c")
  })

  it("never produces a string that re-parses to different components (§3, §4.2, §5.3)", () => {
    expect(resolveUri("a:/b", "..//c")).toBe("a:/.//c")
    expect(resolveUri("/b/c", "..//d")).toBe("/.//d")
    expect(serializeUri({ path: "//a/b" })).toBe("/.//a/b")
    expect(serializeUri({ path: "this:that" })).toBe("./this:that")
    expect(serializeUri({ scheme: "s", path: "this:that" })).toBe("s:this:that")
    expect(serializeUri({ authority: "h", path: "x" })).toBe("//h/x")
    expect(serializeUri({ authority: "h", path: "" })).toBe("//h")
    for (const c of [
      { path: "//a/b" },
      { path: "this:that" },
      { path: "a/this:that" },
      { authority: "h", path: "x" },
      { scheme: "a", authority: "c", path: "" },
      { scheme: "a", path: "//c" },
    ]) {
      const text = serializeUri(c)
      expect(serializeUri(parseUri(text))).toBe(text)
      expect(parseUri(text).authority).toBe(c.authority)
      expect(parseUri(text).scheme).toBe(c.scheme)
    }
  })

  it("treats a bare slash as a valid relative reference (erratum 5428)", () => {
    expect(resolveUri(BASE, "/")).toBe("http://a/")
  })

  it("merges against an empty base path with authority (§5.2.3)", () => {
    expect(resolveUri("http://a", "g")).toBe("http://a/g")
    expect(mergePaths({ authority: "a", path: "" }, "g")).toBe("/g")
    expect(mergePaths({ path: "" }, "g")).toBe("g")
    expect(mergePaths({ path: "x/y" }, "g")).toBe("x/g")
  })

  it("resolves against a base without a scheme", () => {
    expect(resolveUri("/b/c/d", "../g")).toBe("/b/g")
    expect(resolveUri("b/c/d", "../g")).toBe("b/g")
  })
})

describe("parseUri / serializeUri", () => {
  it("round-trips the RFC appendix B example", () => {
    const uri = "http://www.ics.uci.edu/pub/ietf/uri/#Related"
    expect(parseUri(uri)).toEqual({
      scheme: "http",
      authority: "www.ics.uci.edu",
      path: "/pub/ietf/uri/",
      fragment: "Related",
    })
    expect(serializeUri(parseUri(uri))).toBe(uri)
  })

  it("keeps empty components distinct from absent ones", () => {
    expect(parseUri("http://a/b?#")).toEqual({
      scheme: "http",
      authority: "a",
      path: "/b",
      query: "",
      fragment: "",
    })
    expect(serializeUri({ path: "", query: "" })).toBe("?")
    expect(parseUri("")).toEqual({ path: "" })
    expect(parseUri("//")).toEqual({ authority: "", path: "" })
  })

  it("parses a relative path whose first segment has no colon", () => {
    expect(parseUri("./this:that")).toEqual({ path: "./this:that" })
    expect(parseUri("this:that")).toEqual({ scheme: "this", path: "that" })
    expect(serializeUri(parseUri("./this:that"))).toBe("./this:that")
  })

  it("keeps newlines inside components", () => {
    expect(parseUri("a\nb#c\nd")).toEqual({ path: "a\nb", fragment: "c\nd" })
  })
})
