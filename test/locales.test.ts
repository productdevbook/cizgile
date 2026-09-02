import { describe, expect, it } from "vitest"
import { slugify } from "../src"
import { transliterate } from "../src/transliterate"
import {
  be,
  bg,
  bn,
  cyrillic,
  registeredLocale,
  registerLocale,
  unregisterLocale,
  defineLocale,
  el,
  he,
  hi,
  ja,
  kk,
  ko,
  locales,
  mk,
  ru,
  sr,
  ta,
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
        "be",
        "bg",
        "bn",
        "ca",
        "cs",
        "da",
        "de",
        "el",
        "es",
        "et",
        "fi",
        "fr",
        "gu",
        "he",
        "hi",
        "hr",
        "hu",
        "is",
        "it",
        "ja",
        "kk",
        "kn",
        "ko",
        "lt",
        "lv",
        "mk",
        "ml",
        "nb",
        "nl",
        "or",
        "pa",
        "pl",
        "pt",
        "ro",
        "ru",
        "sk",
        "sl",
        "sr",
        "sv",
        "ta",
        "te",
        "tr",
        "uk",
        "vi",
      ].toSorted(),
    )
  })
})

describe("Central and Northern European locale ids", () => {
  it.each([
    ["pl", "Zażółć & jaźń", "zazolc-i-jazn"],
    ["ro", "Ștefan & Țară", "stefan-si-tara"],
    ["cs", "Příliš & žluťoučký", "prilis-a-zlutoucky"],
    ["sk", "Ľubomír & Ďurčo", "lubomir-a-durco"],
    ["sl", "Črnomelj & Žužemberk", "crnomelj-in-zuzemberk"],
    ["hr", "Đakovo & Šibenik", "dakovo-i-sibenik"],
    ["is", "Þór & Ægir", "thor-og-aegir"],
    ["et", "Jõgeva & Võru", "jogeva-ja-voru"],
    ["lv", "Rīga & Ķekava", "riga-un-kekava"],
    ["lt", "Šiauliai & Ąžuolas", "siauliai-ir-azuolas"],
    ["ca", "Col·legi & Girona", "collegi-i-girona"],
  ] as const)("%s: %j → %j", (locale, input, expected) => {
    expect(slugify(input, { locale })).toBe(expected)
  })

  it("Icelandic keeps thorn readable in transliterate()", () => {
    expect(transliterate("Þór", { locale: locales.is })).toBe("Thor")
  })
})

describe("Kazakh and Belarusian locales", () => {
  it("cover the extra Cyrillic letters", () => {
    expect(slugify("Қазақстан & Әлем", { locale: kk })).toBe("qazaqstan-zhane-alem")
    expect(slugify("Ўладзімір & Іван", { locale: be })).toBe("uladzimir-i-ivan")
  })
})

describe("Greek, Hebrew, Japanese and Korean locales", () => {
  it("carry their script table and conjunction", () => {
    expect(slugify("Καλημέρα & Αθήνα", { locale: el })).toBe("kalimera-kai-athina")
    expect(slugify("שלום & ישראל", { locale: he })).toBe("shlvm-ve-yshrl")
    expect(slugify("नमस्ते & दुनिया", { locale: hi })).toBe("namaste-aur-duniya")
    expect(slugify("தமிழ் & சென்னை", { locale: ta })).toBe("tamil-matrum-chennai")
    expect(slugify("বাংলা & ঢাকা", { locale: bn })).toBe("bangla-ebong-dhaka")
    expect(slugify("नमस्ते दुनिया", { locale: hi, unicode: true })).toBe("नमस्ते-दुनिया")
    expect(slugify("とうきょう & おおさか", { locale: ja })).toBe("toukyou-to-oosaka")
    expect(slugify("서울 & 부산", { locale: ko })).toBe("seoul-mit-busan")
    expect(slugify("東京タワー", { locale: ja })).toBe("tawa")
    expect(slugify("東京タワー", { locale: ja, unicode: true })).toBe("東京タワー")
  })
})

describe("locale symbol words (%, $, £)", () => {
  it("spells the symbols in the locale's language and drops them without one", () => {
    expect(slugify("50% off $5 for £2")).toBe("50-off-5-for-pound-2")
    expect(slugify("50% off $5 for £2", { locale: "de" })).toBe(
      "50-prozent-off-dollar-5-for-pfund-2",
    )
    expect(slugify("50% off", { locale: "fr" })).toBe("50-pour-cent-off")
    expect(slugify("%50 indirim", { locale: "tr" })).toBe("yuzde-50-indirim")
    expect(slugify("50% скидка", { locale: ru })).toBe("50-protsent-skidka")
    expect(slugify("50% off", { locale: "de", unicode: true })).toBe("50-prozent-off")
    expect(slugify("50% off", { locale: "de", transliterate: "none" })).toBe("50-prozent-off")
    for (const locale of Object.values(locales)) {
      if (locale.tables?.some((t) => t !== cyrillic)) continue
      for (const key of ["%", "$", "£", "&"]) {
        expect(locale.table[key], `${locale.id} ${key}`).toMatch(/^ [a-z ]+ $/)
      }
    }
  })
})

describe("registerLocale", () => {
  it("lets slugify take a registered id as a string, and forgets it on unregister", () => {
    expect(() => slugify("Привет", { locale: "ru" })).toThrow(TypeError)
    registerLocale(ru, uk)
    expect(slugify("Привет мир", { locale: "ru" })).toBe("privet-mir")
    expect(slugify("Київ", { locale: "uk" })).toBe("kyiv")
    expect(registeredLocale("ru")).toBe(ru)
    expect(unregisterLocale("ru")).toBe(true)
    expect(unregisterLocale("ru")).toBe(false)
    expect(() => slugify("Привет", { locale: "ru" })).toThrow(TypeError)
    expect(slugify("Straße", { locale: "de" })).toBe("strasse")
    unregisterLocale("uk")
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
