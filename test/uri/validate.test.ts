import { describe, expect, it } from "vitest"
import {
  classifyReference,
  isAbsoluteUri,
  isIri,
  isIriReference,
  isRelativeReference,
  isUri,
  isUriReference,
  pathForm,
} from "../../src/uri"
import { ABNORMAL, BASE, NORMAL } from "../fixtures/rfc3986-5-4"

describe("URI-reference validation (RFC 3986 §4.1–4.3, Appendix A)", () => {
  it("every §5.4 reference is a valid URI-reference and the base is an absolute-URI", () => {
    for (const [ref, target] of [...NORMAL, ...ABNORMAL]) {
      expect(isUriReference(ref), ref).toBe(true)
      expect(isUriReference(target), target).toBe(true)
    }
    expect(isAbsoluteUri(BASE)).toBe(true)
    expect(isUri(BASE)).toBe(true)
  })

  it.each([
    "http://a/b?c#d",
    "ftp://ftp.is.co.za/rfc/rfc1808.txt",
    "ldap://[2001:db8::7]/c=GB?objectClass?one",
    "mailto:John.Doe@example.com",
    "news:comp.infosystems.www.servers.unix",
    "tel:+1-816-555-1212",
    "telnet://192.0.2.16:80/",
    "urn:oasis:names:specification:docbook:dtd:xml:4.1.2",
    "http://user:pw@[v1.fe80]:8080/p?q#f",
    "//host/path",
    "/",
    "",
    "?q",
    "#f",
    "./this:that",
    "a/this:that",
    "http://a/%C3%A9",
    "this:that",
    "http:a//b",
  ])("accepts %j", (input) => {
    expect(isUriReference(input)).toBe(true)
  })

  it.each([
    "http://a b/",
    "http://a/b c",
    "http://a/b?c d",
    "http://a/b#c d",
    "http://a/%zz",
    "http://[::1/",
    "http://a:8x/",
    "http://a/b^c",
    "1:2:3",
    "http://a/é",
    "http://é/",
    "http://a//b/../c d",
  ])("rejects %j", (input) => {
    expect(isUriReference(input)).toBe(false)
  })

  it("distinguishes URI, absolute-URI and relative-ref", () => {
    expect(isUri("/rel")).toBe(false)
    expect(isUri("http://a/b#d")).toBe(true)
    expect(isAbsoluteUri("http://a/b#d")).toBe(false)
    expect(isAbsoluteUri("http://a/b?q")).toBe(true)
    expect(isRelativeReference("/")).toBe(true)
    expect(isRelativeReference("//g")).toBe(true)
    expect(isRelativeReference("this:that")).toBe(false)
    expect(isRelativeReference("./this:that")).toBe(true)
    expect(isRelativeReference("http://a/")).toBe(false)
  })

  it("classifies the §3.3 path forms", () => {
    expect(pathForm("")).toBe("empty")
    expect(pathForm("/a/b")).toBe("absolute")
    expect(pathForm("/")).toBe("absolute")
    expect(pathForm("//a")).toBe("abempty")
    expect(pathForm("a/b")).toBe("noscheme")
    expect(pathForm("this:that/x")).toBe("rootless")
    expect(classifyReference("http://a/b")?.path).toBe("abempty")
    expect(classifyReference("http://a")?.path).toBe("empty")
    expect(classifyReference("mailto:x@y")?.path).toBe("rootless")
    expect(classifyReference("/x")?.path).toBe("absolute")
    expect(classifyReference("x")?.path).toBe("noscheme")
    expect(classifyReference("this:that")).toEqual({
      kind: "uri",
      absolute: true,
      path: "rootless",
      components: { scheme: "this", path: "that" },
    })
  })
})

describe("IRI-reference validation (RFC 3987 §2.2)", () => {
  it.each([
    "http://例え.jp/résumé",
    "http://résumé.example.org",
    "http://a/b?q=",
    "/ünïcödé",
    "http://a/b#Ω",
  ])("accepts %j", (input) => {
    expect(isIriReference(input)).toBe(true)
  })

  it.each([
    "http://a/￾",
    "http://a/﷐",
    "http://a/‏",
    "http://a/",
    "http:///",
    "http://a/ b",
    "http://a/",
    "http://a/\uD800",
  ])("rejects %j", (input) => {
    expect(isIriReference(input)).toBe(false)
  })

  it("isIri requires a scheme", () => {
    expect(isIri("http://例え.jp/")).toBe(true)
    expect(isIri("/résumé")).toBe(false)
    expect(isUriReference("http://例え.jp/")).toBe(false)
  })
})
