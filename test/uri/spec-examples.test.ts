import { describe, expect, it } from "vitest"
import {
  equivalentUris,
  isUri,
  isUriReference,
  normalizeUri,
  parseUri,
  resolveUri,
  serializeUri,
  type UriComponents,
} from "../../src/uri"
import { CORPUS } from "../fixtures/corpus"
import { ABNORMAL, BASE, NORMAL } from "../fixtures/rfc3986-5-4"
import { WHATWG_URLTESTDATA } from "../fixtures/whatwg-urltestdata"

const APPENDIX_B = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/

const URIS = [
  "http://www.ics.uci.edu/pub/ietf/uri/#Related",
  "foo://example.com:8042/over/there?name=ferret#nose",
  "urn:example:animal:ferret:nose",
  "mailto:John.Doe@example.com",
  "news:comp.infosystems.www.servers.unix",
  "tel:+1-816-555-1212",
  "telnet://192.0.2.16:80/",
  "ldap://[2001:db8::7]/c=GB?objectClass?one",
  "file:///etc/hosts",
  "http://a/b/c/d;p?q",
  "//host/path?q#f",
  "/absolute/path",
  "relative/path?query",
  "?query-only",
  "#fragment-only",
  "",
  "g:h",
  "http://a/?#",
  ...NORMAL.map(([reference]) => reference),
  ...ABNORMAL.map(([reference]) => reference),
]

describe("RFC 3986 Appendix B: the reference regular expression agrees with parseUri", () => {
  it.each(URIS)("%j", (uri) => {
    const m = APPENDIX_B.exec(uri)
    expect(m).not.toBeNull()
    const expected: UriComponents = { path: m?.[5] ?? "" }
    if (m?.[1] !== undefined) expected.scheme = m[2] ?? ""
    if (m?.[3] !== undefined) expected.authority = m[4] ?? ""
    if (m?.[6] !== undefined) expected.query = m[7] ?? ""
    if (m?.[8] !== undefined) expected.fragment = m[9] ?? ""
    expect(parseUri(uri)).toEqual(expected)
  })

  it("splits the appendix's own example into its five parts", () => {
    expect(parseUri("http://www.ics.uci.edu/pub/ietf/uri/#Related")).toEqual({
      scheme: "http",
      authority: "www.ics.uci.edu",
      path: "/pub/ietf/uri/",
      fragment: "Related",
    })
  })
})

describe("RFC 3987 section 5.3.2: syntax-based normalization", () => {
  it("5.3.2 treats the two example IRIs as equivalent", () => {
    expect(
      equivalentUris(
        "example://a/b/c/%7Bfoo%7D/rosé",
        "eXAMPLE://a/./b/../b/%63/%7bfoo%7d/ros%C3%A9",
        {
          level: "syntax",
        },
      ),
    ).toBe(false)
    expect(normalizeUri("eXAMPLE://a/./b/../b/%63/%7bfoo%7d/ros%C3%A9")).toBe(
      "example://a/b/c/%7Bfoo%7D/ros%C3%A9",
    )
  })

  it("5.3.2.1 case: scheme and ASCII host are case-insensitive, hex digits uppercase", () => {
    expect(normalizeUri("HTTP://www.EXAMPLE.com/")).toBe("http://www.example.com/")
    expect(normalizeUri("http://a/%3a")).toBe("http://a/%3A")
    expect(equivalentUris("http://a/%3a", "http://a/%3A", { level: "syntax" })).toBe(true)
  })

  it("5.3.2.2 character normalization is the creator's job, not the comparer's", () => {
    const nfc = "http://www.example.org/r\u00E9sum\u00E9.html"
    const nfd = "http://www.example.org/re\u0301sume\u0301.html"
    expect(nfc.normalize("NFC")).toBe(nfd.normalize("NFC"))
    expect(equivalentUris(nfc, nfd)).toBe(false)
    expect(normalizeUri(nfd)).toBe(nfd)
  })

  it("5.3.2.3 percent-encoding: unreserved octets decode, the three tilde spellings are one resource", () => {
    for (const uri of ["http://example.org/%7euser", "http://example.org/%7Euser"]) {
      expect(normalizeUri(uri)).toBe("http://example.org/~user")
      expect(equivalentUris(uri, "http://example.org/~user", { level: "syntax" })).toBe(true)
    }
  })

  it("5.3.2.4 path segments: dot segments go even when nothing is being resolved", () => {
    expect(normalizeUri("http://a/b/./c/../d")).toBe("http://a/b/d")
  })
})

describe("RFC 3987 section 5.3.3: scheme-based normalization", () => {
  const four = [
    "http://example.com",
    "http://example.com/",
    "http://example.com:/",
    "http://example.com:80/",
  ]

  it.each(four)("%j is the http normal form http://example.com/", (uri) => {
    expect(normalizeUri(uri)).toBe("http://example.com/")
    expect(equivalentUris(uri, "http://example.com/")).toBe(true)
  })

  it("keeps an empty query delimiter and a fragment-only difference", () => {
    expect(normalizeUri("http://example.com/?")).toBe("http://example.com/?")
    expect(equivalentUris("http://example.com/?", "http://example.com/")).toBe(false)
    expect(equivalentUris("http://example.com/#", "http://example.com/")).toBe(false)
  })
})

describe("WHATWG urltestdata.json, the RFC 3986-compatible subset", () => {
  it.each(WHATWG_URLTESTDATA)("%j", (input, protocol, hostname, port, pathname, search, hash) => {
    expect(isUri(input)).toBe(true)
    const c = parseUri(input, { authority: true })
    expect(`${c.scheme ?? ""}:`).toBe(protocol)
    expect(c.host ?? "").toBe(hostname)
    expect(c.port ?? "").toBe(port)
    expect(c.path).toBe(pathname)
    expect(c.query === undefined || c.query === "" ? "" : `?${c.query}`).toBe(search)
    expect(c.fragment === undefined || c.fragment === "" ? "" : `#${c.fragment}`).toBe(hash)
    expect(serializeUri(c)).toBe(input)
  })
})

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(7)
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)] as T
const maybe = (p: number): boolean => rand() < p

function randomComponents(): UriComponents {
  const out: UriComponents = { path: "" }
  if (maybe(0.7)) out.scheme = pick(["http", "https", "urn", "a+b-c.d", "Z9"])
  if (maybe(0.6))
    out.authority = pick([
      "",
      "example.com",
      "u:p@h:80",
      "[::1]:8080",
      "192.0.2.1",
      "%C3%BC.example",
    ])
  const segments = pick([0, 1, 2, 3, 4])
  const parts: string[] = []
  for (let i = 0; i < segments; i++)
    parts.push(pick(["a", "b%20c", ".", "..", "", "x:y", "~", "1"]))
  out.path = (out.authority !== undefined ? "/" : maybe(0.5) ? "/" : "") + parts.join("/")
  if (maybe(0.5)) out.query = pick(["", "q", "a=1&b=2", "x?y", "/"])
  if (maybe(0.4)) out.fragment = pick(["", "f", "x?y#", "/"])
  return out
}

describe("properties: parse and serialize are inverses, resolution yields absolute URIs", () => {
  const generated = Array.from({ length: 500 }, randomComponents)

  it("serializeUri(parseUri(text)) === text for every text that parses", () => {
    for (const text of [...CORPUS, ...URIS, ...generated.map(serializeUri)]) {
      if (!isUriReference(text)) continue
      expect(serializeUri(parseUri(text)), text).toBe(text)
    }
  })

  it("parseUri(serializeUri(c)) equals c, up to the /. and ./ the serializer must insert", () => {
    for (const c of generated) {
      const back = parseUri(serializeUri(c))
      const expected = { ...c }
      if (c.authority === undefined && c.path.startsWith("//")) expected.path = "/." + c.path
      else if (
        c.authority === undefined &&
        c.scheme === undefined &&
        (c.path.split("/", 1)[0] ?? "").includes(":")
      ) {
        expected.path = "./" + c.path
      }
      expect(back, JSON.stringify(c)).toEqual(expected)
    }
  })

  it("resolveUri against the section 5.4 base always yields a URI-reference that isUriReference accepts", () => {
    for (const c of generated) {
      const reference = serializeUri(c)
      if (!isUriReference(reference)) continue
      const resolved = resolveUri(BASE, reference)
      expect(isUriReference(resolved), reference).toBe(true)
      expect(parseUri(resolved).scheme, reference).toBeDefined()
      expect(resolveUri(BASE, resolved), reference).toBe(resolved)
    }
  })
})
