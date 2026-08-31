import { describe, expect, it } from "vitest"
import { normalizeUri, parseAuthority, serializeAuthority } from "../../src/uri"

describe("normalizeUri (RFC 3986 §6.2.2, §6.2.3)", () => {
  it.each([
    ["HTTP://www.EXAMPLE.com/%7e%41/./b/../c", "http://www.example.com/~A/c"],
    ["http://example.com", "http://example.com/"],
    ["http://example.com/", "http://example.com/"],
    ["http://example.com:/", "http://example.com/"],
    ["http://example.com:80/", "http://example.com/"],
    ["https://example.com:443/", "https://example.com/"],
    ["http://example.com:8080/", "http://example.com:8080/"],
    ["http://example.com/%2f", "http://example.com/%2F"],
    ["eXAMPLE://a/./b/../b/%63/%7bfoo%7d", "example://a/b/c/%7Bfoo%7D"],
    ["http://User@Example.COM/", "http://User@example.com/"],
    ["http://[::1]:80/", "http://[::1]/"],
    ["http://[::1]:8080/x", "http://[::1]:8080/x"],
    ["http://a/b?%7e#%7e", "http://a/b?~#~"],
    ["mailto:Joe@Example.COM", "mailto:Joe@Example.COM"],
    ["ftp://x:21/", "ftp://x/"],
    ["http://a//b/../c", "http://a//c"],
    ["example://a", "example://a"],
  ])("%j → %j", (input, expected) => {
    expect(normalizeUri(input)).toBe(expected)
  })

  it("accepts custom default ports", () => {
    expect(normalizeUri("git://x:9418/", { defaultPorts: { git: 9418 } })).toBe("git://x/")
    expect(normalizeUri("http://x:80/", { defaultPorts: {} })).toBe("http://x:80/")
  })

  it("is idempotent", () => {
    const once = normalizeUri("HTTP://EXAMPLE.com:80/%7ea/./b/../c?%41#%42")
    expect(normalizeUri(once)).toBe(once)
  })

  it("does not remove dot segments from a bare relative path", () => {
    expect(normalizeUri("../a/%7e")).toBe("../a/~")
  })
})

describe("parseAuthority / serializeAuthority", () => {
  it.each([
    ["user:pw@host:80", { userinfo: "user:pw", host: "host", port: "80" }],
    ["host", { host: "host" }],
    ["host:", { host: "host", port: "" }],
    ["[::1]:8", { host: "[::1]", port: "8" }],
    ["[::1]", { host: "[::1]" }],
    ["a@b@c", { userinfo: "a@b", host: "c" }],
    ["", { host: "" }],
  ])("%j", (input, expected) => {
    expect(parseAuthority(input)).toEqual(expected)
    expect(serializeAuthority(parseAuthority(input))).toBe(input)
  })
})
