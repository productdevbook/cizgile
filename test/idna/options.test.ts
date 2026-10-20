import { describe, expect, it } from "vitest"
import {
  codePointStatus,
  IDNA_UNICODE_VERSION,
  idnaToAscii,
  idnaToAsciiResult,
  idnaToUnicode,
  idnaToUnicodeResult,
} from "../../src/idna"

const errorsOf = (domain: string, options = {}): readonly string[] =>
  idnaToAsciiResult(domain, options).errors

describe("idnaToAscii / idnaToUnicode", () => {
  it("maps, normalizes and punycodes", () => {
    expect(idnaToAscii("Bücher.DE")).toBe("xn--bcher-kva.de")
    expect(idnaToAscii("faß.de")).toBe("xn--fa-hia.de")
    expect(idnaToAscii("例え。ＪＰ")).toBe("xn--r8jz45g.jp")
    expect(idnaToAscii("a­b.com")).toBe("ab.com")
    expect(idnaToAscii("é.com")).toBe("xn--9ca.com")
  })

  it("decodes to Unicode", () => {
    expect(idnaToUnicode("xn--bcher-kva.de")).toBe("bücher.de")
    expect(idnaToUnicode("XN--R8JZ45G.jp")).toBe("例え.jp")
  })

  it("throws a RangeError listing the codes, and the Result variants report them instead", () => {
    expect(() => idnaToAscii("a♥b\u{E0000}")).toThrow(RangeError)
    expect(() => idnaToAscii("\u{E0000}")).toThrow(/V7/)
    expect(() => idnaToUnicode("xn--!")).toThrow(/P4/)
    expect(idnaToUnicodeResult("xn--!").errors).toEqual(["P4"])
    expect(idnaToAsciiResult("a\u{E0000}").result).toMatch(/^xn--a-/)
  })

  it("exposes the table", () => {
    expect(IDNA_UNICODE_VERSION).toBe("16.0.0")
    expect(codePointStatus(0x41)).toEqual({ status: "mapped", to: [0x61] })
    expect(codePointStatus(0x61)).toEqual({ status: "valid" })
    expect(codePointStatus(0xad)).toEqual({ status: "ignored" })
    expect(codePointStatus(0xdf)).toEqual({ status: "deviation", to: [0x73, 0x73] })
    expect(codePointStatus(0xd800)).toEqual({ status: "disallowed" })
    expect(codePointStatus(0x100)).toEqual({ status: "mapped", to: [0x101] })
    expect(codePointStatus(0x101)).toEqual({ status: "valid" })
    expect(codePointStatus(0x132)).toEqual({ status: "mapped", to: [0x69, 0x6a] })
  })
})

describe("options", () => {
  it("beStrict turns on STD3 rules, hyphen checks and DNS length; explicit options win", () => {
    expect(errorsOf("a_b.com")).toEqual([])
    expect(errorsOf("a_b.com", { useSTD3ASCIIRules: true })).toEqual(["U1"])
    expect(errorsOf("a_b.com", { beStrict: true })).toEqual(["U1"])
    expect(errorsOf("a_b.com", { beStrict: true, useSTD3ASCIIRules: false })).toEqual([])
    expect(errorsOf("-a.com", { beStrict: true })).toEqual(["V3"])
    expect(errorsOf("a..com", { beStrict: true })).toEqual(["A4_2"])
    expect(errorsOf("a_b.com", { beStrict: false })).toEqual([])
  })

  it("useSTD3ASCIIRules", () => {
    expect(idnaToAscii("a_b.com")).toBe("a_b.com")
    expect(idnaToAscii("ＡＢ＿.com")).toBe("ab_.com")
    expect(errorsOf("a b.com", { useSTD3ASCIIRules: true })).toEqual(["U1"])
    expect(errorsOf("a_b", { useSTD3ASCIIRules: true })).toEqual(["U1"])
  })

  it("checkHyphens", () => {
    expect(errorsOf("ab--c.com")).toEqual([])
    expect(errorsOf("ab--c.com", { checkHyphens: true })).toEqual(["V2"])
    expect(errorsOf("-ab.com", { checkHyphens: true })).toEqual(["V3"])
    expect(errorsOf("ab-.com", { checkHyphens: true })).toEqual(["V3"])
    expect(errorsOf("-ab-.com")).toEqual([])
    expect(errorsOf("xn--xn--a--gua.pt")).toContain("V4")
  })

  it("checkBidi", () => {
    expect(errorsOf("aא")).toEqual(["B5", "B6"])
    expect(errorsOf("aא", { checkBidi: false })).toEqual([])
    expect(errorsOf("0a.א")).toEqual(["B1"])
    expect(errorsOf("אa")).toEqual(["B2", "B3"])
    expect(errorsOf("א١1")).toEqual(["B4"])
    expect(errorsOf("אב")).toEqual([])
    expect(errorsOf("abc.def")).toEqual([])
    expect(errorsOf("a.אב")).toEqual([])
    expect(errorsOf("א̀")).toEqual(["V6"].filter(() => false))
  })

  it("checkJoiners", () => {
    expect(errorsOf("a‍b")).toEqual(["C2"])
    expect(errorsOf("a‌b")).toEqual(["C1"])
    expect(errorsOf("a‍b", { checkJoiners: false })).toEqual([])
    expect(errorsOf("क्‍ष")).toEqual([])
    expect(errorsOf("क्‌ष")).toEqual([])
    expect(errorsOf("ب‌ب")).toEqual([])
    expect(errorsOf("بَ‌َب")).toEqual([])
    expect(errorsOf("ب‌a")).toEqual(["B2", "B3", "C1"])
    expect(errorsOf("‌ب")).toEqual(["B1", "C1"])
  })

  it("checkContextO", () => {
    expect(errorsOf("a·b")).toEqual(["V7"].filter(() => false))
    expect(errorsOf("a·b", { checkContextO: true })).toEqual(["O1"])
    expect(errorsOf("l·l", { checkContextO: true })).toEqual([])
    expect(errorsOf("α͵β", { checkContextO: true })).toEqual([])
    expect(errorsOf("͵a", { checkContextO: true })).toEqual(["O1"])
    expect(errorsOf("א׳", { checkContextO: true })).toEqual([])
    expect(errorsOf("a׳", { checkContextO: true, checkBidi: false })).toEqual(["O1"])
    expect(errorsOf("א״א", { checkContextO: true })).toEqual([])
    expect(errorsOf("・", { checkContextO: true })).toEqual(["O1"])
    expect(errorsOf("・あ", { checkContextO: true })).toEqual([])
    expect(errorsOf("・a", { checkContextO: true })).toEqual(["O1"])
    expect(errorsOf("・一", { checkContextO: true })).toEqual([])
    expect(errorsOf("٠۰", { checkContextO: true, checkBidi: false })).toEqual(["O1"])
    expect(errorsOf("١٢", { checkContextO: true, checkBidi: false })).toEqual([])
    expect(errorsOf("۱۲", { checkContextO: true, checkBidi: false })).toEqual([])
  })

  it("transitionalProcessing", () => {
    expect(idnaToAscii("faß.de")).toBe("xn--fa-hia.de")
    expect(idnaToAscii("faß.de", { transitionalProcessing: true })).toBe("fass.de")
    expect(idnaToAscii("ẞ.de", { transitionalProcessing: true })).toBe("ss.de")
    expect(idnaToUnicode("βόλος.com", { transitionalProcessing: true })).toBe("βόλοσ.com")
    expect(idnaToUnicode("a‌b", { transitionalProcessing: true })).toBe("ab")
    expect(idnaToUnicode("xn--fa-hia.de", { transitionalProcessing: true })).toBe("faß.de")
  })

  it("verifyDnsLength", () => {
    const label = "a".repeat(63)
    expect(errorsOf(`${label}b.com`)).toEqual([])
    expect(errorsOf(`${label}b.com`, { verifyDnsLength: true })).toEqual(["A4_2"])
    expect(errorsOf("", { verifyDnsLength: true })).toEqual(["A4_1", "A4_2"])
    expect(errorsOf("a.b.", { verifyDnsLength: true })).toEqual(["A4_2"])
    expect(errorsOf("a.b.")).toEqual([])
    const long = Array.from({ length: 5 }, () => "a".repeat(60)).join(".")
    expect(errorsOf(long, { verifyDnsLength: true })).toEqual(["A4_1"])
    expect(idnaToUnicodeResult("a..b", { verifyDnsLength: true }).errors).toEqual(["X4_2"])
    expect(idnaToUnicodeResult("a..b").errors).toEqual([])
    expect(idnaToUnicodeResult("a.b.", { verifyDnsLength: true }).errors).toEqual([])
  })

  it("ignoreInvalidPunycode", () => {
    expect(errorsOf("xn--!")).toEqual(["P4"])
    expect(errorsOf("xn--!", { ignoreInvalidPunycode: true })).toEqual([])
    expect(idnaToUnicode("xn--!", { ignoreInvalidPunycode: true })).toBe("xn--!")
    expect(errorsOf("xn--", { ignoreInvalidPunycode: true })).toEqual(["P4"])
    expect(errorsOf("xn--é")).toEqual(["P4"])
  })

  it("reports an unpaired surrogate", () => {
    expect(errorsOf("a\uD900z")).toEqual(["A3", "V7"])
  })
})
