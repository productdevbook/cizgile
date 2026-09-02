import { describe, expect, it } from "vitest"
import {
  findUris,
  getOrigin,
  isSameOrigin,
  joinPaths,
  normalizeUri,
  parseQuery,
  parseUri,
  serializeUri,
  sortQuery,
  stringifyQuery,
  stripFragment,
} from "../../src/uri"

describe("parseUri({ authority: true }) and serializeUri from parts", () => {
  it("splits the authority and reports the port as a number when it is one", () => {
    expect(parseUri("http://user:pw@host:8080/p?q#f", { authority: true })).toEqual({
      scheme: "http",
      authority: "user:pw@host:8080",
      userinfo: "user:pw",
      host: "host",
      port: "8080",
      portNumber: 8080,
      path: "/p",
      query: "q",
      fragment: "f",
    })
    expect(parseUri("http://a:99999/", { authority: true })).toMatchObject({ port: "99999" })
    expect(parseUri("http://a:99999/", { authority: true })).not.toHaveProperty("portNumber")
    expect(parseUri("http://a:/", { authority: true })).toMatchObject({ host: "a", port: "" })
    expect(parseUri("http://[::1]:80/", { authority: true })).toMatchObject({
      host: "[::1]",
      portNumber: 80,
    })
    expect(parseUri("http://a/", { authority: true })).toEqual({
      scheme: "http",
      authority: "a",
      host: "a",
      path: "/",
    })
    expect(parseUri("mailto:x@y", { authority: true })).toEqual({ scheme: "mailto", path: "x@y" })
    expect(parseUri("http://a:8080/p")).not.toHaveProperty("host")
  })

  it("serializes from host, port and userinfo when authority is absent", () => {
    expect(serializeUri({ scheme: "https", host: "example.com", port: "8443", path: "/x" })).toBe(
      "https://example.com:8443/x",
    )
    expect(serializeUri({ scheme: "https", userinfo: "u", host: "h", path: "" })).toBe(
      "https://u@h",
    )
    expect(serializeUri({ scheme: "https", host: "h", path: "p" })).toBe("https://h/p")
    expect(serializeUri({ authority: "a", host: "b", path: "/" })).toBe("//a/")
    const round = parseUri("http://u@h:1/p?q#f", { authority: true })
    delete round.authority
    expect(serializeUri(round)).toBe("http://u@h:1/p?q#f")
  })
})

describe("normalizeUri options", () => {
  it("trailing slash, empty query and fragment", () => {
    expect(normalizeUri("http://a/b/", { trailingSlash: "remove" })).toBe("http://a/b")
    expect(normalizeUri("http://a/b//", { trailingSlash: "remove" })).toBe("http://a/b")
    expect(normalizeUri("http://a/", { trailingSlash: "remove" })).toBe("http://a/")
    expect(normalizeUri("http://a", { trailingSlash: "remove" })).toBe("http://a/")
    expect(normalizeUri("http://a/b", { trailingSlash: "add" })).toBe("http://a/b/")
    expect(normalizeUri("http://a/b/", { trailingSlash: "add" })).toBe("http://a/b/")
    expect(normalizeUri("http://a/b?", { emptyQuery: "remove" })).toBe("http://a/b")
    expect(normalizeUri("http://a/b?", { emptyQuery: "keep" })).toBe("http://a/b?")
    expect(normalizeUri("http://a/b?x", { emptyQuery: "remove" })).toBe("http://a/b?x")
    expect(normalizeUri("http://a/b#", { emptyFragment: "remove" })).toBe("http://a/b")
    expect(normalizeUri("http://a/b#x", { emptyFragment: "remove" })).toBe("http://a/b#x")
    expect(normalizeUri("http://a/b?#", { emptyQuery: "remove", emptyFragment: "remove" })).toBe(
      "http://a/b",
    )
  })

  it("host conversion and strict mode", () => {
    expect(normalizeUri("http://Bücher.DE/x", { host: "idna" })).toBe("http://xn--bcher-kva.de/x")
    expect(normalizeUri("http://xn--bcher-kva.de/x", { host: "unicode" })).toBe(
      "http://bücher.de/x",
    )
    expect(normalizeUri("http://[::1]/x", { host: "idna" })).toBe("http://[::1]/x")
    expect(normalizeUri("http://a:8x/")).toBe("http://a:8x/")
    expect(() => normalizeUri("http://a:8x/", { strict: true })).toThrow(TypeError)
    expect(() => normalizeUri("http://ex ample/", { strict: true })).toThrow(TypeError)
    expect(normalizeUri("http://a:8080/", { strict: true })).toBe("http://a:8080/")
  })
})

describe("origin, fragment, query and path helpers", () => {
  it("getOrigin follows RFC 6454", () => {
    expect(getOrigin("HTTP://Example.COM:80/a?b#c")).toBe("http://example.com")
    expect(getOrigin("https://example.com:8443/")).toBe("https://example.com:8443")
    expect(getOrigin("https://u:p@example.com/")).toBe("https://example.com")
    expect(getOrigin("http://[::1]:8080/")).toBe("http://[::1]:8080")
    expect(getOrigin("mailto:x@y")).toBeUndefined()
    expect(getOrigin("/relative")).toBeUndefined()
    expect(getOrigin("file:///x")).toBe("file://")
  })

  it("isSameOrigin", () => {
    expect(isSameOrigin("http://a/x", "HTTP://A:80/y")).toBe(true)
    expect(isSameOrigin("http://a/x", "https://a/x")).toBe(false)
    expect(isSameOrigin("http://a/x", "http://a:8080/x")).toBe(false)
    expect(isSameOrigin("mailto:a", "mailto:a")).toBe(false)
  })

  it("stripFragment", () => {
    expect(stripFragment("http://a/b#c")).toBe("http://a/b")
    expect(stripFragment("http://a/b#")).toBe("http://a/b")
    expect(stripFragment("http://a/b")).toBe("http://a/b")
    expect(stripFragment("#only")).toBe("")
  })

  it("parseQuery and stringifyQuery round-trip form encoding", () => {
    expect(parseQuery("a=1&b=two+words&c=%C3%BC&d&=e&&")).toEqual([
      ["a", "1"],
      ["b", "two words"],
      ["c", "ü"],
      ["d", ""],
      ["", "e"],
    ])
    expect(parseQuery("?a=1")).toEqual([["a", "1"]])
    expect(parseQuery("")).toEqual([])
    expect(parseQuery("k=a=b")).toEqual([["k", "a=b"]])
    expect(
      stringifyQuery([
        ["b", "two words"],
        ["c", "ü&"],
        ["d", ""],
      ]),
    ).toBe("b=two+words&c=%C3%BC%26&d=")
    expect(stringifyQuery(new Map([["a", "1"]]))).toBe("a=1")
    expect(stringifyQuery([])).toBe("")
    const pairs = parseQuery("x=1&y=a%2Fb+c")
    expect(parseQuery(stringifyQuery(pairs))).toEqual(pairs)
    for (const [name, value] of pairs) {
      expect(new URLSearchParams("x=1&y=a%2Fb+c").get(name)).toBe(value)
    }
  })

  it("sortQuery orders by name then value and leaves everything else alone", () => {
    expect(sortQuery("http://a/p?b=2&a=2&a=1&c#f")).toBe("http://a/p?a=1&a=2&b=2&c#f")
    expect(sortQuery("http://a/p?z=%C3%BC&a=x&&")).toBe("http://a/p?a=x&z=%C3%BC")
    expect(sortQuery("http://a/p")).toBe("http://a/p")
    expect(sortQuery("http://a/p?")).toBe("http://a/p?")
    expect(sortQuery("?b&a")).toBe("?a&b")
  })

  it("joinPaths never doubles a slash or keeps a dot segment", () => {
    expect(joinPaths("/a/", "/b/", "c")).toBe("/a/b/c")
    expect(joinPaths("/a", "b/")).toBe("/a/b/")
    expect(joinPaths("a", "b")).toBe("a/b")
    expect(joinPaths("/a/b", "../c")).toBe("/a/c")
    expect(joinPaths("/a", "./b", ".", "c")).toBe("/a/b/c")
    expect(joinPaths("/", "a")).toBe("/a")
    expect(joinPaths("/", "/")).toBe("/")
    expect(joinPaths("", "")).toBe("")
    expect(joinPaths("a//b", "c")).toBe("a/b/c")
    expect(joinPaths("/a/", "")).toBe("/a/")
    expect(joinPaths("/a", "../../b")).toBe("/b")
  })
})

describe("findUris", () => {
  it("finds scheme-anchored and www URIs in prose and trims trailing punctuation", () => {
    expect(
      findUris("see http://a/b, then (https://x.example/y). Mail mailto:me@x.example!"),
    ).toEqual([
      { uri: "http://a/b", start: 4, end: 14 },
      { uri: "https://x.example/y", start: 22, end: 41 },
      { uri: "mailto:me@x.example", start: 49, end: 68 },
    ])
    expect(findUris("go to www.example.com/path. Not at 10:30 or note: this.")).toEqual([
      { uri: "www.example.com/path", start: 6, end: 26 },
    ])
    expect(findUris('a "http://q/(x)" b https://w/(y)) c').map((f) => f.uri)).toEqual([
      "http://q/(x)",
      "https://w/(y)",
    ])
    expect(findUris("nothing here")).toEqual([])
    expect(findUris("www. alone and www.x")).toEqual([])
  })
})
