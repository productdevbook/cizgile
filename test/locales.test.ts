import { describe, expect, it } from "vitest"
import { slugify } from "../src"
import {
  bg,
  cyrillic,
  defineLocale,
  el,
  he,
  ja,
  ko,
  locales,
  mk,
  ru,
  sr,
  tr,
  uk,
} from "../src/transliterate"

describe("Turkish", () => {
  it.each([
    ["İstanbul Ğüneş ışığı", "istanbul-gunes-isigi"],
    ["Çay & Simit", "cay-ve-simit"],
    ["ILIK", "ilik"],
    ["Şişli Çığ", "sisli-cig"],
    ["DİYARBAKIR", "diyarbakir"],
  ])("%j → %j", (input, expected) => {
    expect(slugify(input, { locale: "tr" })).toBe(expected)
    expect(slugify(input, { locale: tr })).toBe(expected)
  })

  it("uses Turkish casing in unicode mode", () => {
    expect(slugify("ILIK", { locale: "tr", unicode: true })).toBe("ılık")
    expect(slugify("İstanbul", { locale: "tr", unicode: true })).toBe("istanbul")
    expect(slugify("ILIK", { unicode: true })).toBe("ilik")
  })

  it("without a locale falls back to dotless-i folding", () => {
    expect(slugify("İstanbul ışık")).toBe("istanbul-isik")
  })
})

describe("German", () => {
  it.each([
    ["Straße Über Ärger", "strasse-ueber-aerger"],
    ["Fisch & Chips", "fisch-und-chips"],
    ["Müller Öl", "mueller-oel"],
    ["GROSSE ÄPFEL", "grosse-aepfel"],
  ])("%j → %j", (input, expected) => {
    expect(slugify(input, { locale: "de" })).toBe(expected)
  })

  it("differs from the locale-less default", () => {
    expect(slugify("Straße Über Ärger")).toBe("strasse-uber-arger")
    expect(slugify("Fisch & Chips")).toBe("fisch-and-chips")
  })
})

describe("Nordic", () => {
  it.each([
    ["da", "Ærø ål", "aeroe-aal"],
    ["nb", "Ærø ål", "aeroe-aal"],
    ["sv", "Ängsö Ålesund", "aengsoe-aalesund"],
    ["fi", "Hyvää yötä & päivää", "hyvaeae-yoetae-ja-paeivaeae"],
    ["da", "fisk & chips", "fisk-og-chips"],
  ] as const)("%s %j → %j", (locale, input, expected) => {
    expect(slugify(input, { locale })).toBe(expected)
  })
})

describe("other Latin locales", () => {
  it.each([
    ["es", "café & churros", "cafe-y-churros"],
    ["fr", "cœur & âme", "coeur-et-ame"],
    ["pt", "pão & água", "pao-e-agua"],
    ["it", "pane & vino", "pane-e-vino"],
    ["nl", "ĳs & fiets", "ijs-en-fiets"],
    ["hu", "hűtő & ördög", "huto-es-ordog"],
    ["vi", "Đà Nẵng & Hà Nội", "da-nang-va-ha-noi"],
    ["az", "Əli & İlham", "eli-ve-ilham"],
  ] as const)("%s %j → %j", (locale, input, expected) => {
    expect(slugify(input, { locale })).toBe(expected)
  })

  it("rejects unknown locale ids", () => {
    expect(() => slugify("x", { locale: "xx" as "de" })).toThrow(TypeError)
  })
})

describe("Cyrillic locales (Locale objects from cizgile/transliterate)", () => {
  it("Ukrainian", () => {
    expect(slugify("Київ Ґудзик", { locale: uk })).toBe("kyiv-gudzyk")
    expect(slugify("Щастя & Здоров'я", { locale: uk })).toBe("shchastia-ta-zdorovia")
    expect(slugify("Єва Їжак Юрій", { locale: uk })).toBe("yeva-yizhak-yurii")
    expect(slugify("Київ", { transliterate: [cyrillic] })).toBe("kiyiv")
  })

  it("Bulgarian", () => {
    expect(slugify("Щастие", { locale: bg })).toBe("shtastie")
    expect(slugify("Щастие", { transliterate: [cyrillic] })).toBe("schastie")
    expect(slugify("Ъгъл", { locale: bg })).toBe("agal")
  })

  it("Russian, Macedonian, Serbian", () => {
    expect(slugify("Привет мир", { locale: ru })).toBe("privet-mir")
    expect(slugify("Щука & Ёж", { locale: ru })).toBe("schuka-i-yozh")
    expect(slugify("Ќе Џ", { locale: mk })).toBe("kje-dz")
    expect(slugify("Ђорђе Ћирић", { locale: sr })).toBe("djordje-ciric")
    expect(slugify("Đorđe", { locale: sr })).toBe("djordje")
  })

  it("locales registry exposes every id", () => {
    expect(Object.keys(locales).toSorted()).toEqual(
      [
        "az",
        "bg",
        "da",
        "de",
        "el",
        "es",
        "fi",
        "fr",
        "he",
        "hu",
        "it",
        "ja",
        "ko",
        "mk",
        "nb",
        "nl",
        "pt",
        "ru",
        "sr",
        "sv",
        "tr",
        "uk",
        "vi",
      ].toSorted(),
    )
  })
})

describe("Greek, Hebrew, Japanese and Korean locales", () => {
  it("carry their script table and conjunction", () => {
    expect(slugify("Καλημέρα & Αθήνα", { locale: el })).toBe("kalimera-kai-athina")
    expect(slugify("שלום & ישראל", { locale: he })).toBe("shlvm-ve-yshrl")
    expect(slugify("とうきょう & おおさか", { locale: ja })).toBe("toukyou-to-oosaka")
    expect(slugify("서울 & 부산", { locale: ko })).toBe("seoul-mit-busan")
    expect(slugify("東京タワー", { locale: ja })).toBe("tawa")
    expect(slugify("東京タワー", { locale: ja, unicode: true })).toBe("東京タワー")
  })
})

describe("custom locales", () => {
  it("defineLocale adds overrides without touching the base", () => {
    const swissGerman = defineLocale(locales.de, { id: "de-CH", table: { ß: "ss" } })
    expect(slugify("Straße & Öl", { locale: swissGerman })).toBe("strasse-und-oel")
    expect(slugify("Straße & Öl", { locale: "de" })).toBe("strasse-und-oel")
  })

  it("a bare Locale object works", () => {
    expect(slugify("x & y", { locale: { id: "custom", table: { "&": " plus " } } })).toBe(
      "x-plus-y",
    )
  })
})
