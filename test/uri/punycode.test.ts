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
    ["他們爲什麽不說中文", "ihqwctvzc91f659drss3x8bo0yb"],
    ["यहलोगहिन्दीक्योंनहींबोलसकतेहैं", "i1baa7eci9glrd9b2ae1bj0hfcgg6iyaf8o0a1dig0cd"],
    ["なぜみんな日本語を話してくれないのか", "n8jok5ay5dzabd5bym9f0cm5685rrjetr6pdxa"],
    [
      "세계의모든사람들이한국어를이해한다면얼마나좋을까",
      "989aomsvi5e83db1d2a355cv1e0vak1dwrv93d5xbh15a0dt30a5jpsd879ccm6fea98c",
    ],
    ["почемужеонинеговорятпорусски", "b1abfaaepdrnnbgefbadotcwatmq2g4l"],
    ["PorquénopuedensimplementehablarenEspañol", "PorqunopuedensimplementehablarenEspaol-fmd56a"],
    ["TạisaohọkhôngthểchỉnóitiếngViệt", "TisaohkhngthchnitingVit-kjcr8268qyxafd2f1b9g"],
    ["3年B組金八先生", "3B-ww4c5e180e575a65lsy2b"],
    ["安室奈美恵-with-SUPER-MONKEYS", "-with-SUPER-MONKEYS-pc58ag80a8qai00g7n9n"],
    ["Hello-Another-Way-それぞれの場所", "Hello-Another-Way--fc4qua05auwb3674vfr0b"],
    ["ひとつ屋根の下2", "2-u9tlzr9756bt3uc0v"],
    ["MajiでKoiする5秒前", "MajiKoi5-783gue6qz075azm5e"],
    ["パフィーdeルンバ", "de-jg4avhby1noc0d"],
    ["そのスピードで", "d9juau41awczczp"],
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
    expect(domainToAscii("EXAMPLE.com")).toBe("example.com")
    expect(domainToAscii("[::1]")).toBe("[::1]")
    expect(domainToAscii("Bücher.DE")).toBe("xn--bcher-kva.de")
    expect(domainToAscii("xn--Bcher-kva.de")).toBe("xn--bcher-kva.de")
    expect(domainToAscii("ﬁnal.example")).toBe("final.example")
    expect(domainToAscii("bü\u200Bcher.de")).toBe("xn--bcher-kva.de")
    expect(domainToAscii("例え。jp")).toBe("xn--r8jz45g.jp")
    expect(domainToAscii("ＡＢＣ.example")).toBe("abc.example")
    expect(() => domainToAscii("ü".repeat(60) + ".x")).toThrow(RangeError)
    for (const host of ["ﬁnal.example", "例え。jp", "ＡＢＣ.example"]) {
      expect(domainToAscii(host)).toBe(new URL(`http://${host}/`).hostname)
    }
    expect(domainToUnicode("XN--BCHER-KVA.de")).toBe("bücher.de")
    expect(domainToUnicode("EXAMPLE.COM")).toBe("example.com")
    expect(domainToAscii("")).toBe("")
    expect(domainToAscii("example.com.")).toBe("example.com.")
    expect(domainToAscii("127.0.0.1")).toBe("127.0.0.1")
  })

  it("case-maps per code point so Greek final sigma matches UTS #46", () => {
    expect(domainToAscii("ΣΌΛΟΣ.gr")).toBe(new URL("http://ΣΌΛΟΣ.gr/").hostname)
    expect(domainToAscii("İstanbul.tr")).toBe(new URL("http://İstanbul.tr/").hostname)
  })

  it("rejects labels that no DNS name may carry", () => {
    for (const host of [
      "ex ample.com",
      "a..b",
      ".example.com",
      "-abc.com",
      "abc-.com",
      "ab--cd.com",
      "a".repeat(64) + ".com",
      Array.from({ length: 5 }, () => "a".repeat(60)).join("."),
      "xn--abc.example",
      "xn--.example",
      "xn--pokxncvks",
      "xn--a-ecp.ru",
      "xn--bcher-kva-.de",
      "x\u3000y.example",
    ]) {
      expect(() => domainToAscii(host), host).toThrow(RangeError)
    }
    for (const host of ["xn--abc.example", "xn--.example", "a..b", "xn--pokxncvks"]) {
      expect(() => domainToUnicode(host), host).toThrow(RangeError)
    }
    expect(domainToAscii("ab-cd.com")).toBe("ab-cd.com")
    expect(domainToAscii("xn--bcher-kva.de")).toBe("xn--bcher-kva.de")
  })

  it("rejects malformed punycode", () => {
    expect(() => punycodeDecode("é")).toThrow(RangeError)
    expect(() => punycodeDecode("abc-!")).toThrow(RangeError)
    expect(() => punycodeDecode("a-")).not.toThrow()
    expect(() => punycodeDecode("99999999999999999999")).toThrow(RangeError)
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
