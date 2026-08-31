import { describe, expect, it } from "vitest"
import {
  domainToAscii,
  domainToUnicode,
  iriToUri,
  punycodeDecode,
  punycodeEncode,
} from "../../src/uri"

describe("punycode (RFC 3492)", () => {
  it.each([
    ["bücher", "bcher-kva"],
    ["résumé", "rsum-bpad"],
    ["例え", "r8jz45g"],
    ["münchen", "mnchen-3ya"],
    ["ñandú", "and-6ma2c"],
    ["中国", "fiqs8s"],
    ["한국", "3e0b707e"],
    ["ليهمابتكلموشعربي؟", "egbpdaj6bu4bxfgehfvwxn"],
    ["他们为什么不说中文", "ihqwcrb4cv8a8dqg056pqjye"],
    ["Pročprostěnemluvíčesky", "Proprostnemluvesky-uyb24dma41a"],
    ["למההםפשוטלאמדבריםעברית", "4dbcagdahymbxekheh6e0a7fei0b"],
    ["-> $1.00 <-", "-> $1.00 <--"],
    ["abc", "abc-"],
    ["", ""],
  ])("%j ↔ %j", (unicode, encoded) => {
    expect(punycodeEncode(unicode)).toBe(encoded)
    expect(punycodeDecode(encoded)).toBe(unicode)
  })

  it("agrees with the runtime's IDNA for plain labels", () => {
    for (const host of [
      "例え.jp",
      "résumé.example.org",
      "münchen.de",
      "ñandú.cl",
      "中国.cn",
      "한국.kr",
      "bücher.example",
    ]) {
      expect(domainToAscii(host)).toBe(new URL(`http://${host}/`).hostname)
      expect(domainToUnicode(domainToAscii(host))).toBe(host)
    }
    expect(domainToAscii("EXAMPLE.com")).toBe("EXAMPLE.com")
    expect(domainToAscii("[::1]")).toBe("[::1]")
    expect(domainToAscii("Bücher.DE")).toBe("xn--bcher-kva.DE")
    expect(domainToAscii("ﬁnal.example")).toBe("final.example")
    expect(domainToAscii("bü\u200Bcher.de")).toBe("xn--bcher-kva.de")
    expect(domainToAscii("例え。jp")).toBe("xn--r8jz45g.jp")
    expect(domainToAscii("ＡＢＣ.example")).toBe("abc.example")
    expect(() => domainToAscii("ü".repeat(60) + ".x")).toThrow(RangeError)
    for (const host of ["ﬁnal.example", "例え。jp", "ＡＢＣ.example"]) {
      expect(domainToAscii(host)).toBe(new URL(`http://${host}/`).hostname)
    }
    expect(domainToUnicode("XN--BCHER-KVA.de")).toBe("bücher.de")
  })

  it("rejects malformed punycode", () => {
    expect(() => punycodeDecode("é")).toThrow(RangeError)
    expect(() => punycodeDecode("abc-!")).toThrow(RangeError)
    expect(() => punycodeDecode("a-")).not.toThrow()
  })
})

describe("iriToUri host option (RFC 3987 §3.1, RFC 3986 §3.2.2)", () => {
  it("percent-encodes the host by default and can punycode it instead", () => {
    expect(iriToUri("http://例え.jp/résumé")).toBe("http://%E4%BE%8B%E3%81%88.jp/r%C3%A9sum%C3%A9")
    expect(iriToUri("http://例え.jp/résumé", { host: "punycode" })).toBe(
      "http://xn--r8jz45g.jp/r%C3%A9sum%C3%A9",
    )
    expect(iriToUri("http://résumé.example.org", { host: "punycode" })).toBe(
      "http://xn--rsum-bpad.example.org",
    )
    expect(iriToUri("http://user:pw@bücher.de:8080/x?y#z", { host: "punycode" })).toBe(
      "http://user:pw@xn--bcher-kva.de:8080/x?y#z",
    )
    expect(iriToUri("http://[::1]/é", { host: "punycode" })).toBe("http://[::1]/%C3%A9")
    expect(iriToUri("mailto:é@é.example", { host: "punycode" })).toBe(
      "mailto:%C3%A9@%C3%A9.example",
    )
    expect(new URL(iriToUri("http://例え.jp/résumé", { host: "punycode" })).hostname).toBe(
      "xn--r8jz45g.jp",
    )
  })
})
