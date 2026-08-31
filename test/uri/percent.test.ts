import { describe, expect, it } from "vitest"
import {
  encodeForm,
  encodeFragment,
  encodePath,
  encodePathSegment,
  encodeQuery,
  isGenDelim,
  isHexDigit,
  isPchar,
  isReserved,
  isSegmentNzNc,
  isSubDelim,
  isUnreserved,
  normalizePercentEncoding,
  percentDecode,
  percentEncode,
  resolveEncodeSet,
} from "../../src/uri"
import { CORPUS, CORPUS_SAFE } from "../fixtures/corpus"

const cp = (s: string): number => s.codePointAt(0) ?? 0

describe("character classes (RFC 3986 §2)", () => {
  it("classifies every ASCII code point as unreserved, reserved, or other", () => {
    for (let c = 0; c < 0x80; c++) {
      const ch = String.fromCodePoint(c)
      const unreserved = /[A-Za-z0-9\-._~]/.test(ch)
      const gen = ":/?#[]@".includes(ch)
      const sub = "!$&'()*+,;=".includes(ch)
      expect(isUnreserved(c)).toBe(unreserved)
      expect(isGenDelim(c)).toBe(gen)
      expect(isSubDelim(c)).toBe(sub)
      expect(isReserved(c)).toBe(gen || sub)
      expect(isPchar(c)).toBe(unreserved || sub || ch === ":" || ch === "@")
      expect(isSegmentNzNc(c)).toBe(unreserved || sub || ch === "@")
    }
    expect(isUnreserved(cp("é"))).toBe(false)
    expect(isPchar(cp("é"))).toBe(false)
    for (let c = 0; c < 0x80; c++) {
      expect(isHexDigit(c)).toBe(/[0-9A-Fa-f]/.test(String.fromCodePoint(c)))
    }
  })

  it("resolves named encode sets and accepts predicates", () => {
    expect(resolveEncodeSet("query")(cp("/"))).toBe(true)
    expect(resolveEncodeSet("fragment")(cp("?"))).toBe(true)
    expect(resolveEncodeSet("path")(cp("/"))).toBe(true)
    expect(resolveEncodeSet("pchar")(cp("/"))).toBe(false)
    expect(resolveEncodeSet("userinfo")(cp(":"))).toBe(true)
    expect(resolveEncodeSet("userinfo")(cp("@"))).toBe(false)
    expect(resolveEncodeSet("whatwg-path")(cp("'"))).toBe(true)
    expect(resolveEncodeSet("whatwg-path")(cp("?"))).toBe(false)
    expect(resolveEncodeSet("whatwg-path")(0x7f)).toBe(false)
    expect(resolveEncodeSet("whatwg-component")(cp("&"))).toBe(false)
    expect(resolveEncodeSet("form")(cp("*"))).toBe(true)
    expect(resolveEncodeSet("whatwg-c0-control")(0x20)).toBe(true)
    expect(resolveEncodeSet("whatwg-c0-control")(0x7f)).toBe(false)
    expect(resolveEncodeSet("whatwg-fragment")(cp("#"))).toBe(true)
    expect(resolveEncodeSet("whatwg-fragment")(cp("`"))).toBe(false)
    expect(resolveEncodeSet("whatwg-query")(cp("'"))).toBe(true)
    expect(resolveEncodeSet("whatwg-special-query")(cp("'"))).toBe(false)
    expect(resolveEncodeSet("whatwg-userinfo")(cp("|"))).toBe(false)
    expect(resolveEncodeSet("whatwg-userinfo")(cp("$"))).toBe(true)
    expect(resolveEncodeSet((c) => c === 0x41)(0x41)).toBe(true)
  })
})

describe("percentEncode", () => {
  it.each([
    ["À", "%C3%80"],
    ["ア", "%E3%82%A2"],
    ["😀", "%F0%9F%98%80"],
    ["\uD800", "%EF%BF%BD"],
    ["a b", "a%20b"],
    ["100%", "100%25"],
    ["-._~", "-._~"],
    ["", ""],
  ])("%j → %j", (input, expected) => {
    expect(percentEncode(input)).toBe(expected)
  })

  it("uses uppercase hex digits", () => {
    expect(percentEncode("ÿ")).toBe("%C3%BF")
  })

  it("form encoding maps space to plus and matches URLSearchParams", () => {
    expect(encodeForm("a b+c")).toBe("a+b%2Bc")
    for (const s of CORPUS) {
      expect(encodeForm(s)).toBe(new URLSearchParams({ a: s }).toString().slice(2))
    }
  })

  it("supports a custom keep predicate", () => {
    expect(percentEncode("ab", (c) => c === 0x61)).toBe("a%62")
  })
})

describe("WHATWG percent-encode sets match the URL parser", () => {
  const printable: string[] = []
  for (let c = 0x21; c <= 0x7e; c++) printable.push(String.fromCodePoint(c))

  it("special-query and query", () => {
    for (const ch of printable) {
      if (ch === "#" || ch === "%") continue
      expect(percentEncode(ch, "whatwg-special-query"), ch).toBe(
        new URL("http://h/?" + ch).search.slice(1),
      )
      expect(percentEncode(ch, "whatwg-query"), ch).toBe(new URL("foo://h/?" + ch).search.slice(1))
    }
    expect(percentEncode("a b", "whatwg-special-query")).toBe("a%20b")
  })

  it("fragment", () => {
    for (const ch of printable) {
      if (ch === "%") continue
      expect(percentEncode(ch, "whatwg-fragment"), ch).toBe(
        new URL("http://h/#" + ch).hash.slice(1),
      )
    }
  })

  it("path and userinfo", () => {
    expect(percentEncode("^", "whatwg-path")).toBe("%5E")
    for (const ch of printable) {
      if ("%/?#\\.^".includes(ch)) continue
      expect(percentEncode(ch, "whatwg-path"), ch).toBe(new URL("http://h/" + ch).pathname.slice(1))
    }
    for (const ch of printable) {
      if ("%@/?#\\:^".includes(ch)) continue
      expect(percentEncode(ch, "whatwg-userinfo"), ch).toBe(
        new URL("http://" + ch + "@h/").username,
      )
    }
  })
})

describe("encodePathSegment / encodePath / encodeQuery / encodeFragment", () => {
  it("keeps pchar and encodes everything else", () => {
    expect(encodePathSegment("a:b@c!$&'()*+,;=")).toBe("a:b@c!$&'()*+,;=")
    expect(encodePathSegment("a/b?c#d%e[f]")).toBe("a%2Fb%3Fc%23d%25e%5Bf%5D")
    expect(encodePathSegment("this:that", { noColon: true })).toBe("this%3Athat")
  })

  it("never produces a segment the WHATWG parser rewrites", () => {
    for (const s of CORPUS) {
      if (s === "" || s === "." || s === "..") continue
      const enc = encodePathSegment(s)
      expect(enc).not.toMatch(/[/?#]/)
      expect(enc).not.toMatch(/%(?![0-9A-F]{2})/)
      expect(new URL("http://h/" + enc).pathname).toBe("/" + enc)
    }
  })

  it("equals encodeURIComponent when no sub-delims, ':' or '@' are present", () => {
    for (const s of CORPUS_SAFE) {
      if (/[!$&'()*+,;=:@]/.test(s)) continue
      expect(encodePathSegment(s)).toBe(encodeURIComponent(s))
    }
  })

  it("encodePath keeps slashes and encodes per segment", () => {
    expect(encodePath("/a b/c?d/é")).toBe("/a%20b/c%3Fd/%C3%A9")
    expect(encodePath("")).toBe("")
  })

  it("query and fragment keep '/' and '?' but encode '#' and '%'", () => {
    expect(encodeQuery("a=1&b=/x?y#z%")).toBe("a=1&b=/x?y%23z%25")
    expect(encodeFragment("sec/1?x#y")).toBe("sec/1?x%23y")
  })
})

describe("percentDecode", () => {
  it.each([
    ["%C3%A9", "é"],
    ["%E3%82%A2", "ア"],
    ["%F0%9F%98%80", "😀"],
    ["%zz%", "%zz%"],
    ["%4", "%4"],
    ["%", "%"],
    ["a%20b", "a b"],
    ["a+b", "a+b"],
    ["%41%42", "AB"],
    ["", ""],
  ])("%j → %j", (input, expected) => {
    expect(percentDecode(input)).toBe(expected)
  })

  it("replaces invalid UTF-8 with U+FFFD", () => {
    expect(percentDecode("%C3%28")).toContain("�")
    expect(percentDecode("%C3%28")).toContain("(")
    expect(percentDecode("%ED%A0%80")).toContain("�")
    expect(percentDecode("%C0%AF")).toContain("�")
    expect(percentDecode("%F4%90%80%80")).toContain("�")
    expect(percentDecode("%E0%80%80")).toContain("�")
    expect(percentDecode("%F0%80%80%80")).toContain("�")
    expect(percentDecode("%C3")).toBe("�")
  })

  it("optionally decodes plus as space", () => {
    expect(percentDecode("a+b", { plusAsSpace: true })).toBe("a b")
  })

  it("round-trips encodeURIComponent and percentEncode over the corpus", () => {
    for (const s of CORPUS_SAFE) {
      expect(percentDecode(encodeURIComponent(s))).toBe(s)
      expect(percentDecode(percentEncode(s))).toBe(s)
      expect(percentDecode(encodeForm(s), { plusAsSpace: true })).toBe(s)
    }
  })
})

describe("normalizePercentEncoding (RFC 3986 §6.2.2.1–2)", () => {
  it.each([
    ["%7e%41%2f", "~A%2F"],
    ["%3a", "%3A"],
    ["%2D%2e%5F%7E", "-._~"],
    ["%zz", "%zz"],
    ["%C3%A9", "%C3%A9"],
    ["plain", "plain"],
  ])("%j → %j", (input, expected) => {
    expect(normalizePercentEncoding(input)).toBe(expected)
  })
})
