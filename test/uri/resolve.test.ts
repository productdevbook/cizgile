import { describe, expect, it } from "vitest"
import { mergePaths, parseUri, resolveUri, serializeUri } from "../../src/uri"
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
  })

  it("keeps newlines inside components", () => {
    expect(parseUri("a\nb#c\nd")).toEqual({ path: "a\nb", fragment: "c\nd" })
  })
})
