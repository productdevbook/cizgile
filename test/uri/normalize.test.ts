import { describe, expect, it } from "vitest"
import {
  equivalentUris,
  normalizeIPv6Address,
  normalizeUri,
  parseAuthority,
  serializeAuthority,
} from "../../src/uri"

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
    ["example://a", "example://a/"],
    ["git://host", "git://host/"],
    ["//host", "//host"],
    ["http://ÉXAMPLE.com/", "http://Éxample.com/"],
    ["http://İSTANBUL.example/", "http://İstanbul.example/"],
    ["http://[::1", "http://[::1/"],
    ["http://%C3%89xample.com/", "http://%C3%89xample.com/"],
    ["http://a%2Fb.com/", "http://a%2Fb.com/"],
    ["http://EXAMPLE.com/%c3%a9", "http://example.com/%C3%A9"],
  ])("%j → %j", (input, expected) => {
    expect(normalizeUri(input)).toBe(expected)
  })

  it("can skip scheme-based normalization (§6.2.2 only)", () => {
    expect(normalizeUri("HTTP://Example.COM:80", { schemeBased: false })).toBe(
      "http://example.com:80",
    )
    expect(normalizeUri("http://a:/", { schemeBased: false })).toBe("http://a/")
    expect(normalizeUri("http://a/%7e/./b/../c", { schemeBased: false })).toBe("http://a/~/c")
  })

  it("can strip the password or the whole userinfo (§3.2.1, §7.5, §7.6)", () => {
    expect(normalizeUri("http://user:pw@a/")).toBe("http://user:pw@a/")
    expect(normalizeUri("http://user:pw@a/", { userinfo: "strip-password" })).toBe("http://user@a/")
    expect(normalizeUri("http://user:pw@a/", { userinfo: "strip" })).toBe("http://a/")
    expect(normalizeUri("http://user@[::1]:8/", { userinfo: "strip-password" })).toBe(
      "http://user@[::1]:8/",
    )
    expect(normalizeUri("http://user:p:w@[::1]/", { userinfo: "strip-password" })).toBe(
      "http://user@[::1]/",
    )
    expect(normalizeUri("http://@a/", { userinfo: "strip" })).toBe("http://a/")
    expect(
      normalizeUri("http://cnn.example.com&story=breaking_news@10.0.0.1/top_story.htm", {
        userinfo: "strip",
      }),
    ).toBe("http://10.0.0.1/top_story.htm")
  })

  it("accepts custom default ports", () => {
    expect(normalizeUri("git://x:9418/", { defaultPorts: { git: 9418 } })).toBe("git://x/")
    expect(normalizeUri("http://x:80/", { defaultPorts: {} })).toBe("http://x:80/")
  })

  it("never emits lowercase hex in a percent-encoding", () => {
    for (const input of ["http://%c3%89.com/%c3%a9?%c3#%c3", "HTTP://A%2fB/%2f"]) {
      for (const triplet of normalizeUri(input).match(/%[0-9A-Fa-f]{2}/g) ?? []) {
        expect(triplet).toBe(triplet.toUpperCase())
      }
    }
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

describe("IPv6 hosts (RFC 5952)", () => {
  it.each([
    ["0:0:0:0:0:0:0:1", "::1"],
    ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"],
    ["2001:db8:0:0:1:0:0:1", "2001:db8::1:0:0:1"],
    ["2001:db8::0:1", "2001:db8::1"],
    ["1:0:0:0:0:0:0:0", "1::"],
    ["0:0:0:0:0:0:0:0", "::"],
    ["::ffff:192.0.2.1", "::ffff:192.0.2.1"],
    ["0:0:0:0:0:FFFF:192.0.2.1", "::ffff:192.0.2.1"],
    ["1:2:3:4:5:6:1.2.3.4", "1:2:3:4:5:6:1.2.3.4"],
    ["::1.2.3.4", "::1.2.3.4"],
    ["fe80:0:0:0:1:0:0:0", "fe80::1:0:0:0"],
    ["2001:db8:0:1:1:1:1:1", "2001:db8:0:1:1:1:1:1"],
    ["not-an-address", "not-an-address"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeIPv6Address(input)).toBe(expected)
  })

  it.each([
    "0:0:0:0:0:0:0:1",
    "2001:0DB8:0000:0000:0000:0000:0000:0001",
    "2001:db8:0:0:1:0:0:1",
    "1:0:0:0:0:0:0:0",
    "fe80:0:0:0:1:0:0:0",
  ])("%s agrees with the WHATWG parser", (input) => {
    expect(`[${normalizeIPv6Address(input)}]`).toBe(new URL(`http://[${input}]/`).hostname)
  })

  it("normalizeUri and equivalentUris use the canonical form", () => {
    expect(normalizeUri("http://[0:0:0:0:0:0:0:1]:80/")).toBe("http://[::1]/")
    expect(normalizeUri("http://[2001:DB8::0:1]/")).toBe("http://[2001:db8::1]/")
    expect(normalizeUri("http://[v1.fe80::a+en1]/")).toBe("http://[v1.fe80::a+en1]/")
    expect(equivalentUris("http://[::1]/", "http://[0:0:0:0:0:0:0:1]/")).toBe(true)
  })
})
