import { describe, expect, it } from "vitest"
import { equivalentUris, isSameDocumentReference } from "../../src/uri"

describe("equivalentUris (RFC 3986 §6.2 ladder)", () => {
  it("simple string comparison", () => {
    expect(equivalentUris("http://a/b", "http://a/b", { level: "simple" })).toBe(true)
    expect(equivalentUris("http://a/b", "HTTP://a/b", { level: "simple" })).toBe(false)
  })

  it("syntax-based normalization (§6.2.2) without scheme knowledge", () => {
    expect(
      equivalentUris("example://a/b/c/%7Bfoo%7D", "eXAMPLE://a/./b/../b/%63/%7bfoo%7d", {
        level: "syntax",
      }),
    ).toBe(true)
    expect(
      equivalentUris("http://example.com", "http://example.com:80/", { level: "syntax" }),
    ).toBe(false)
    expect(equivalentUris("http://example.com", "http://example.com/", { level: "syntax" })).toBe(
      false,
    )
  })

  it("scheme-based normalization (§6.2.3) is the default", () => {
    const forms = [
      "http://example.com",
      "http://example.com/",
      "http://example.com:/",
      "http://example.com:80/",
    ]
    for (const a of forms)
      for (const b of forms) expect(equivalentUris(a, b), `${a} ${b}`).toBe(true)
    expect(equivalentUris("http://example.com", "http://example.com:8080/")).toBe(false)
    expect(equivalentUris("git://x:9418/", "git://x/", { defaultPorts: { git: 9418 } })).toBe(true)
  })

  it("resolves relative references against a base first (§6.1)", () => {
    expect(equivalentUris("../g", "http://a/b/g", { base: "http://a/b/c/d;p?q" })).toBe(true)
    expect(equivalentUris("../g", "g", { base: "http://a/b/c/d;p?q" })).toBe(false)
  })

  it("can ignore fragments (§6.1)", () => {
    expect(equivalentUris("http://a/b#x", "http://a/b#y")).toBe(false)
    expect(equivalentUris("http://a/b#x", "http://a/b#y", { ignoreFragment: true })).toBe(true)
    expect(equivalentUris("http://a/b#x", "http://a/b", { ignoreFragment: true })).toBe(true)
  })

  it("never maps IRIs to URIs (RFC 3987 §5.3.1)", () => {
    expect(equivalentUris("http://a/é", "http://a/%C3%A9")).toBe(false)
    expect(equivalentUris("http://a/é", "http://a/é")).toBe(true)
  })
})

describe("isSameDocumentReference (§4.4)", () => {
  it.each([
    ["http://a/b?q", "#s", true],
    ["http://a/b?q", "", true],
    ["http://a/b?q", "?q", true],
    ["http://a/b?q", "?q#x", true],
    ["http://a/b?q", "b", false],
    ["http://a/b?q", "?r", false],
    ["http://a/b?q#f", "#s", true],
    ["http://a/b?q", "http://a/b?q", true],
  ] as const)("%j + %j → %j", (base, ref, expected) => {
    expect(isSameDocumentReference(base, ref)).toBe(expected)
  })

  it("compares literally by default and normalized on request", () => {
    expect(isSameDocumentReference("http://a/b?q", "http://A/b?q")).toBe(false)
    expect(isSameDocumentReference("http://a/b?q", "http://A/b?q", { normalize: true })).toBe(true)
    expect(isSameDocumentReference("http://a/b/c/..", "http://a/b/", { normalize: true })).toBe(
      true,
    )
  })
})
