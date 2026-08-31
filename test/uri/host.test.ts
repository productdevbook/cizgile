import { describe, expect, it } from "vitest"
import {
  isHost,
  isIPLiteral,
  isIPv4Address,
  isIPv6Address,
  isIPvFuture,
  isRegName,
  parseAuthority,
  parseHost,
} from "../../src/uri"

describe("IPv4address (RFC 3986 §3.2.2, §7.4)", () => {
  it.each(["127.0.0.1", "0.0.0.0", "255.255.255.255", "192.0.2.1", "1.2.3.4"])(
    "accepts %s",
    (h) => {
      expect(isIPv4Address(h)).toBe(true)
    },
  )

  it.each([
    "0x7f.0.0.1",
    "2130706433",
    "127.1",
    "127.0.0",
    "256.1.1.1",
    "01.1.1.1",
    "1.2.3.4.5",
    "1.2.3.",
    "a.b.c.d",
    "",
    "1.2.3.-4",
  ])("rejects %s", (h) => {
    expect(isIPv4Address(h)).toBe(false)
  })
})

describe("IPv6address — all nine alternatives", () => {
  it.each([
    "1:2:3:4:5:6:7:8",
    "1:2:3:4:5:6:192.0.2.1",
    "::5:6:7:8:9:10",
    "::2:3:4:5:192.0.2.1",
    "1::3:4:5:6:7:8",
    "::3:4:5:6:7:8",
    "1:2::4:5:6:7:8",
    "1::4:5:6:7:8",
    "::4:5:6:7:8",
    "1:2:3::5:6:7:8",
    "1:2:3:4::6:7:8",
    "1:2:3:4:5::7:8",
    "1:2:3:4:5::192.0.2.1",
    "1:2:3:4:5:6::8",
    "1:2:3:4:5:6:7::",
    "::",
    "1::",
    "::1",
    "::ffff:192.0.2.1",
    "fe80::1",
    "2001:db8::8a2e:370:7334",
    "ABCD:EF01:2345:6789:ABCD:EF01:2345:6789",
  ])("accepts %s", (h) => {
    expect(isIPv6Address(h)).toBe(true)
  })

  it.each([
    "1:2:3:4:5:6:7",
    "1:2:3:4:5:6:7:8:9",
    "1:2:3:4:5:6:7:8::",
    "1::2::3",
    ":::",
    "12345::",
    "1:2:3:4:5:6:7:192.0.2.1",
    "::192.0.2",
    "1:2:3:4:5:6:192.0.2.1:8",
    "g::",
    "1:",
    ":1",
    "",
    "fe80::1%25en1",
    "192.0.2.1",
  ])("rejects %s", (h) => {
    expect(isIPv6Address(h)).toBe(false)
  })
})

describe("IPvFuture, IP-literal, reg-name, host", () => {
  it("IPvFuture", () => {
    expect(isIPvFuture("v1.fe80")).toBe(true)
    expect(isIPvFuture("vF.a:b!c")).toBe(true)
    expect(isIPvFuture("v.a")).toBe(false)
    expect(isIPvFuture("v1.")).toBe(false)
    expect(isIPvFuture("1.a")).toBe(false)
    expect(isIPvFuture("v1.a/b")).toBe(false)
  })

  it("IP-literal", () => {
    expect(isIPLiteral("[::1]")).toBe(true)
    expect(isIPLiteral("[v1.fe80]")).toBe(true)
    expect(isIPLiteral("[::1")).toBe(false)
    expect(isIPLiteral("::1")).toBe(false)
    expect(isIPLiteral("[192.0.2.1]")).toBe(false)
    expect(isIPLiteral("[fe80::1%25en1]")).toBe(false)
  })

  it("reg-name (erratum 4942 still allows sub-delims and pct-encoded)", () => {
    expect(isRegName("example.com")).toBe(true)
    expect(isRegName("")).toBe(true)
    expect(isRegName("a%C3%A9b")).toBe(true)
    expect(isRegName("a!$&'()*+,;=b")).toBe(true)
    expect(isRegName("xn--rsum-bpad.example.org")).toBe(true)
    expect(isRegName("a b")).toBe(false)
    expect(isRegName("a%zzb")).toBe(false)
    expect(isRegName("a:b")).toBe(false)
    expect(isRegName("é")).toBe(false)
    expect(isRegName("[::1]")).toBe(false)
  })

  it("parseHost classifies in the §3.2.2 order (IPv4 before reg-name)", () => {
    expect(parseHost("[::1]")).toEqual({ kind: "ip-literal", value: "::1" })
    expect(parseHost("127.0.0.1")).toEqual({ kind: "ipv4", value: "127.0.0.1" })
    expect(parseHost("0x7f.0.0.1")).toEqual({ kind: "reg-name", value: "0x7f.0.0.1" })
    expect(parseHost("2130706433")).toEqual({ kind: "reg-name", value: "2130706433" })
    expect(parseHost("example.com")).toEqual({ kind: "reg-name", value: "example.com" })
    expect(parseHost("a b")).toBeUndefined()
    expect(isHost("[::1]")).toBe(true)
    expect(isHost("[::1")).toBe(false)
  })

  it("parseAuthority keeps an unterminated IP-literal whole", () => {
    expect(parseAuthority("[::1")).toEqual({ host: "[::1" })
    expect(parseAuthority("[::1]:80")).toEqual({ host: "[::1]", port: "80" })
  })
})
