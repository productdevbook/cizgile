import { describe, expect, it } from "vitest"
import {
  hasBidiControls,
  iriToUri,
  isBidiControl,
  isIpchar,
  isIprivate,
  isIunreserved,
  isUcschar,
  uriToIri,
} from "../../src/uri"
import { CORPUS_SAFE } from "../fixtures/corpus"

describe("ucschar / iprivate ranges (RFC 3987 §2.2)", () => {
  it.each([
    [0x9f, false],
    [0xa0, true],
    [0xd7ff, true],
    [0xd800, false],
    [0xf8ff, false],
    [0xf900, true],
    [0xfdcf, true],
    [0xfdd0, false],
    [0xfdef, false],
    [0xfdf0, true],
    [0xffef, true],
    [0xfff0, false],
    [0xfffd, false],
    [0xffff, false],
    [0x10000, true],
    [0x1fffd, true],
    [0x1fffe, false],
    [0x1ffff, false],
    [0x20000, true],
    [0x2fffd, true],
    [0xe0000, false],
    [0xe0001, false],
    [0xe0020, false],
    [0xe0100, false],
    [0xe0fff, false],
    [0xe1000, true],
    [0xefffd, true],
    [0xefffe, false],
    [0xf0000, false],
    [0x10fffd, false],
  ])("isUcschar(%d)", (cp, expected) => {
    expect(isUcschar(cp)).toBe(expected)
  })

  it.each([
    [0xdfff, false],
    [0xe000, true],
    [0xf8ff, true],
    [0xf900, false],
    [0xefffd, false],
    [0xf0000, true],
    [0xffffd, true],
    [0xffffe, false],
    [0x100000, true],
    [0x10fffd, true],
    [0x10fffe, false],
  ])("isIprivate(%d)", (cp, expected) => {
    expect(isIprivate(cp)).toBe(expected)
  })

  it("never overlaps ucschar with iprivate", () => {
    for (const cp of [0xe000, 0xf8ff, 0xf0000, 0x100000, 0xa0, 0xd7ff, 0x10000]) {
      expect(isUcschar(cp) && isIprivate(cp)).toBe(false)
    }
  })
})

describe("bidi controls (RFC 3987 §4.1)", () => {
  const controls = [
    0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
  ]

  it("detects each formatting character", () => {
    for (const cp of controls) {
      expect(isBidiControl(cp)).toBe(true)
      expect(hasBidiControls("a" + String.fromCodePoint(cp) + "b")).toBe(true)
    }
    expect(isBidiControl(0x200d)).toBe(false)
    expect(isBidiControl(0x2070)).toBe(false)
    expect(hasBidiControls("مرحبا بالعالم")).toBe(false)
    expect(hasBidiControls("")).toBe(false)
  })
})

describe("iriToUri (RFC 3987 §3.1)", () => {
  it.each([
    ["http://例え.jp/résumé", "http://%E4%BE%8B%E3%81%88.jp/r%C3%A9sum%C3%A9"],
    ["http://résumé.example.org", "http://r%C3%A9sum%C3%A9.example.org"],
    ["http://xn--rsum-bpad.example.org", "http://xn--rsum-bpad.example.org"],
    ["http://a/b?q=ア#ア", "http://a/b?q=%E3%82%A2#%E3%82%A2"],
    ["http://a/%E4%BE%8B", "http://a/%E4%BE%8B"],
    ['http://a/ b<>"{}|\\^`', "http://a/%20b%3C%3E%22%7B%7D%7C%5C%5E%60"],
    ["http://a/!$&'()*+,;=:@[]", "http://a/!$&'()*+,;=:@[]"],
    ["\u{F0000}", "%EE%80%80%F3%B0%80%80"],
    ["\u0000\u007F", "%00%7F"],
    ["", ""],
  ])("%j → %j", (iri, uri) => {
    expect(iriToUri(iri)).toBe(uri)
  })

  it("does not normalize Unicode input unless asked (RFC 3987 §3.1 step 1c)", () => {
    expect(iriToUri("e\u0301")).toBe("e%CC%81")
    expect(iriToUri("e\u0301")).toBe(encodeURI("e\u0301"))
    expect(iriToUri("Vie\u0323\u0302t")).toBe(
      new URL("http://a/Vie\u0323\u0302t").pathname.slice(1),
    )
    expect(iriToUri("e\u0301", { nfc: true })).toBe("%C3%A9")
    expect(iriToUri("r\u00e9sum\u00e9", { nfc: true })).toBe("r%C3%A9sum%C3%A9")
    expect(iriToUri("re\u0301sume\u0301", { nfc: true })).toBe("r%C3%A9sum%C3%A9")
  })

  it("rejects bidi formatting characters unless told to strip them", () => {
    expect(() => iriToUri("a\u200Fb")).toThrow(RangeError)
    expect(() => iriToUri("a\u200Fb", { bidi: "throw" })).toThrow(RangeError)
    expect(iriToUri("a\u200Fb", { bidi: "strip" })).toBe("ab")
  })

  it("strict mode rejects characters outside the IRI grammar (RFC 3987 §2.2, §3.1)", () => {
    expect(iriToUri("\uFFFE\uFDD0\u0000\u007F\uD800")).toBe("%EF%BF%BE%EF%B7%90%00%7F%EF%BF%BD")
    for (const bad of ["\uFFFE", "\uFDD0", "\u0000", "\u007F", "\uD800", "\u0080", "\uFFF0"]) {
      expect(() => iriToUri("a" + bad, { strict: true }), JSON.stringify(bad)).toThrow(RangeError)
    }
    expect(iriToUri('a b<>"{}|\\^`', { strict: true })).toBe("a%20b%3C%3E%22%7B%7D%7C%5C%5E%60")
    expect(iriToUri("é\uE000", { strict: true })).toBe("%C3%A9%EE%80%80")
    expect(iriToUri("a\u061Cb", { bidi: "strip" })).toBe("ab")
    expect(() => iriToUri("a\u061Cb")).toThrow(RangeError)
  })

  it("IRI predicates", () => {
    expect(isIunreserved(0xe9)).toBe(true)
    expect(isIunreserved(0x41)).toBe(true)
    expect(isIunreserved(0x200f)).toBe(false)
    expect(isIunreserved(0xfffe)).toBe(false)
    expect(isIpchar(0x3a)).toBe(true)
    expect(isIpchar(0x2f)).toBe(false)
    expect(isIpchar(0xe000)).toBe(false)
  })

  it("leaves a bare percent sign alone (existing pct-encoding is never re-encoded)", () => {
    expect(iriToUri("100%")).toBe("100%")
    expect(iriToUri("%E4%BE%8B")).toBe("%E4%BE%8B")
  })

  it("output is always a valid URI (ASCII, only unreserved/reserved/%HH)", () => {
    for (const s of CORPUS_SAFE) {
      if (hasBidiControls(s) || /%(?![0-9A-Fa-f]{2})/.test(s)) continue
      const uri = iriToUri(s)
      expect(uri).toMatch(/^(?:[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%])*$/)
      expect(uri).not.toMatch(/%(?![0-9A-F]{2})/)
    }
  })
})

describe("uriToIri (RFC 3987 §3.2)", () => {
  it.each([
    ["http://%E4%BE%8B%E3%81%88.jp/r%C3%A9sum%C3%A9", "http://例え.jp/résumé"],
    ["http://a/%20b", "http://a/%20b"],
    ["http://a/%2F", "http://a/%2F"],
    ["http://a/%41%7E%2D%2E%5F%30", "http://a/A~-._0"],
    ["http://a/%2F%3F%25%20%3C%5B%3A%40", "http://a/%2F%3F%25%20%3C%5B%3A%40"],
    ["%F3%A0%80%81", "%F3%A0%80%81"],
    ["%F3%A0%81%A7", "%F3%A0%81%A7"],
    ["%EE%80%80", "%EE%80%80"],
    ["%F3%B0%80%80", "%F3%B0%80%80"],
    ["%E2%80%8E", "%E2%80%8E"],
    ["a%D8%9Cb", "a%D8%9Cb"],
    ["http://a/x?%EE%80%80", "http://a/x?\uE000"],
    ["http://a/%EE%80%80?y", "http://a/%EE%80%80?y"],
    ["http://a/%EE%80%80#%EE%80%80", "http://a/%EE%80%80#%EE%80%80"],
    ["http://%C3%A9@%C3%A9.example/", "http://é@é.example/"],
    ["%EF%BF%BD", "%EF%BF%BD"],
    ["%C3%28", "%C3%28"],
    ["%C3", "%C3"],
    ["%ED%A0%80", "%ED%A0%80"],
    ["%c3%a9", "é"],
    ["%zz", "%zz"],
    ["", ""],
  ])("%j → %j", (uri, iri) => {
    expect(uriToIri(uri)).toBe(iri)
  })

  it("keeps the percent-encoded form of a character next to a valid one", () => {
    expect(uriToIri("%C3%A9%20%E3%82%A2")).toBe("é%20ア")
    expect(uriToIri("%C3%A9%C3")).toBe("é%C3")
  })

  it("round-trips text made of URI-safe ASCII and ucschar through iriToUri", () => {
    let checked = 0
    for (const s of CORPUS_SAFE) {
      if (hasBidiControls(s)) continue
      const nfc = s
      let safe = true
      for (const c of nfc) {
        const code = c.codePointAt(0) ?? 0
        if (code >= 0x80 ? !isUcschar(code) : !/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]/.test(c))
          safe = false
      }
      if (!safe) continue
      checked += 1
      expect(uriToIri(iriToUri(s))).toBe(nfc)
    }
    expect(checked).toBeGreaterThan(10)
  })
})
