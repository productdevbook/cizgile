import { describe, expect, it } from "vitest"
import {
  allScripts,
  arabic,
  armenian,
  cyrillic,
  cyrillicUk,
  de,
  defineLocale,
  georgian,
  greek,
  hangul,
  hebrew,
  kana,
  latin,
  locales,
  lookup,
  mergeTables,
  stripMarks,
  symbols,
  tr,
  transliterate,
  uk,
} from "../src/transliterate"

describe("transliterate()", () => {
  it("folds Latin diacritics and special letters by default", () => {
    expect(transliterate("café résumé naïve façade")).toBe("cafe resume naive facade")
    expect(transliterate("Straße Ærø Łódź Đà Nẵng ıİ")).toBe("Strasse AEro Lodz Da Nang iI")
    expect(transliterate("ǿ Ǿ ŉ")).toBe("o O ŉ".normalize("NFC"))
  })

  it("keeps unknown scripts by default and drops them on request", () => {
    expect(transliterate("你好 Привет")).toBe("你好 Привет")
    expect(transliterate("你好 Привет", { unknown: "drop" })).toBe(" ")
    expect(transliterate("x́ stacked", { unknown: "drop" })).toBe("x stacked")
  })

  it("transliterates Hebrew, Hangul and kana with their tables", () => {
    expect(transliterate("שלום עולם", { tables: [hebrew] })).toBe("shlvm vlm")
    expect(transliterate("שָׁלוֹם", { tables: [hebrew] })).toBe("shlvm")
    expect(transliterate("ישראל תל אביב", { tables: [hebrew] })).toBe("yshrl tl byb")
    expect(transliterate("한국어 서울 김치", { tables: [hangul] })).toBe("hangukeo seoul gimchi")
    expect(transliterate("삼성 부산 안녕하세요", { tables: [hangul] })).toBe(
      "samseong busan annyeonghaseyo",
    )
    expect(transliterate("ㄱㄴㄷ ㅏㅑ", { tables: [hangul] })).toBe("gnd aya")
    expect(transliterate("ひらがな カタカナ", { tables: [kana] })).toBe("hiragana katakana")
    expect(transliterate("きょうと しんじゅく", { tables: [kana] })).toBe("kyouto shinjuku")
    expect(transliterate("コーヒー ファッション ヴィラ", { tables: [kana] })).toBe(
      "kohi fashon vira",
    )
    expect(transliterate("東京タワー", { tables: [kana] })).toBe("東京tawa")
    expect(transliterate("東京タワー", { tables: [kana], unknown: "drop" })).toBe("tawa")
    for (const table of [hebrew, hangul, kana]) {
      for (const [key, value] of Object.entries(table)) {
        expect(value, key).toMatch(/^[a-z ]*$/)
        expect(key.normalize("NFC"), key).toBe(key)
      }
    }
  })

  it("folds compatibility characters only when asked", () => {
    expect(transliterate("ﬁnal x² Ⅷ ① ㎞")).toBe("ﬁnal x² Ⅷ ① ㎞")
    expect(transliterate("ﬁnal x² Ⅷ ① ㎞", { nfkc: true })).toBe("final x2 VIII 1 km")
    expect(transliterate("ǆungla ŉ", { nfkc: true })).toBe("dzungla n")
    expect(transliterate("plain ascii", { nfkc: true })).toBe("plain ascii")
  })

  it("spells out the added currency signs and drops the added quotes", () => {
    expect(transliterate("₿ ₱ ₸ ₾ ‰")).toBe(" bitcoin   peso   tenge   lari   permille ")
    expect(transliterate("¿Qué? ‹x› 5′10″")).toBe(" Que?  x  5 10 ")
  })

  it("keeps the marks of unknown scripts and strips only foldable ones", () => {
    expect(transliterate("नमस्ते दुनिया")).toBe("नमस्ते दुनिया")
    expect(transliterate("สวัสดี")).toBe("สวัสดี")
    expect(transliterate("ひらがな カタカナ")).toBe("ひらがな カタカナ")
    expect(transliterate("שָׁלוֹם")).toBe("שָׁלוֹם")
    expect(transliterate("ӂ")).toBe("ӂ")
    expect(transliterate("ӂ", { tables: [cyrillic] })).toBe("zh")
    expect(transliterate("x́ नमस्ते", { unknown: "drop" })).toBe("x ")
    expect(transliterate("Hawaiʻi ʿAmmān")).toBe("Hawaii Amman")
  })

  it("applies extra script tables before the defaults", () => {
    expect(transliterate("Привет мир", { tables: [cyrillic] })).toBe("Privet mir")
    expect(transliterate("Щастие", { tables: [cyrillic] })).toBe("Schastie")
    expect(transliterate("Καλημέρα κόσμε", { tables: [greek] })).toBe("Kalimera kosme")
    expect(transliterate("مرحبا", { tables: [arabic] })).toBe("mrhba")
    expect(transliterate("Հայաստան Երևան", { tables: [armenian] })).toBe("Hayastan Yerevan")
    expect(transliterate("ուր", { tables: [armenian] })).toBe("ur")
    expect(transliterate("Ոսկե ոսկե", { tables: [armenian] })).toBe("Voske oske")
    expect(transliterate("საქართველო", { tables: [georgian] })).toBe("sakartvelo")
    expect(transliterate("π ≈ 3", { tables: [greek] })).toBe("p ≈ 3")
    expect(transliterate("π ≈ 3")).toBe(" pi  ≈ 3")
  })

  it("applies locale overrides before script tables", () => {
    expect(transliterate("Straße Über Ärger", { locale: de })).toBe("Strasse Ueber Aerger")
    expect(transliterate("Fisch & Chips", { locale: de })).toBe("Fisch  und  Chips")
    expect(transliterate("İstanbul Şişli", { locale: tr })).toBe("Istanbul Sisli")
    expect(transliterate("Київ Ґудзик Щастя", { locale: uk })).toBe("Kyiv Gudzyk Shchastia")
    expect(transliterate("Щастие", { locale: locales.bg })).toBe("Shtastie")
    expect(transliterate("Ærø ål", { locale: locales.da })).toBe("Aeroe aal")
    expect(transliterate("Ängsö", { locale: locales.sv })).toBe("Aengsoe")
  })

  it("normalizes to NFC so decomposed input matches precomposed keys", () => {
    expect(transliterate("ä", { locale: de })).toBe("ae")
    expect(transliterate("ş", { locale: tr })).toBe("s")
  })
})

describe("tables", () => {
  const tables: ReadonlyArray<readonly [string, Readonly<Record<string, string>>]> = [
    ["latin", latin],
    ["symbols", symbols],
    ["cyrillic", cyrillic],
    ["cyrillicUk", cyrillicUk],
    ["greek", greek],
    ["arabic", arabic],
    ["armenian", armenian],
    ["georgian", georgian],
  ]

  it.each(tables)("%s: keys are NFC, values are ASCII", (_name, table) => {
    for (const [key, value] of Object.entries(table)) {
      expect(key.normalize("NFC")).toBe(key)
      expect(value).toMatch(/^[\x20-\x7e]*$/)
    }
  })

  it("allScripts contains every table once", () => {
    expect(new Set(allScripts).size).toBe(allScripts.length)
    expect(allScripts).toContain(latin)
    expect(allScripts).toContain(georgian)
  })

  it("lookup consults tables in order", () => {
    expect(lookup([de.table, latin], "ä")).toBe("ae")
    expect(lookup([latin, de.table], "ß")).toBe("ss")
    expect(lookup([latin], "x")).toBeUndefined()
  })

  it("stripMarks removes combining marks and recomposes", () => {
    expect(stripMarks("é")).toBe("e")
    expect(stripMarks("ộ")).toBe("o")
    expect(stripMarks("x́̂̃")).toBe("x")
    expect(stripMarks("ø")).toBe("ø")
  })
})

describe("defineLocale / mergeTables", () => {
  it("returns a new locale and leaves the base untouched", () => {
    const before = JSON.stringify(de)
    const custom = defineLocale(de, { id: "de-CH", table: { ß: "ss", "&": " und " } })
    expect(custom).not.toBe(de)
    expect(custom.id).toBe("de-CH")
    expect(custom.table["ä"]).toBe("ae")
    expect(JSON.stringify(de)).toBe(before)
    expect(transliterate("Fisch & Chips", { locale: custom })).toBe("Fisch  und  Chips")
  })

  it("inherits tables and lowercase, and allows overriding them", () => {
    const custom = defineLocale(uk, { table: { "&": " and " } })
    expect(custom.tables).toEqual(uk.tables)
    expect(custom.tables).not.toBe(uk.tables)
    expect(custom.id).toBe("uk")
    const noLower = defineLocale(tr)
    expect(noLower.lowercase).toBe(tr.lowercase)
    const replaced = defineLocale(tr, { lowercase: (s) => s.toUpperCase() })
    expect(replaced.lowercase?.("a")).toBe("A")
    const retabled = defineLocale(uk, { tables: [cyrillic] })
    expect(retabled.tables).toEqual([cyrillic])
  })

  it("mergeTables: later tables win", () => {
    expect(mergeTables({ a: "1", b: "2" }, { b: "3" })).toEqual({ a: "1", b: "3" })
    expect(mergeTables()).toEqual({})
  })
})
