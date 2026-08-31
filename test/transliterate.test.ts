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
  latin,
  locales,
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

  it("applies extra script tables before the defaults", () => {
    expect(transliterate("Привет мир", { tables: [cyrillic] })).toBe("Privet mir")
    expect(transliterate("Щастие", { tables: [cyrillic] })).toBe("Schastie")
    expect(transliterate("Καλημέρα κόσμε", { tables: [greek] })).toBe("Kalimera kosme")
    expect(transliterate("مرحبا", { tables: [arabic] })).toBe("mrhba")
    expect(transliterate("Հայաստան Երևան", { tables: [armenian] })).toBe("Hayastan Yerevan")
    expect(transliterate("ուր", { tables: [armenian] })).toBe("ur")
    expect(transliterate("საქართველო", { tables: [georgian] })).toBe("sakartvelo")
    expect(transliterate("π ≈ 3", { tables: [greek] })).toBe("p ≈ 3")
    expect(transliterate("π ≈ 3")).toBe(" pi  ≈ 3")
  })

  it("applies locale overrides before script tables", () => {
    expect(transliterate("Straße Über Ärger", { locale: de })).toBe("Strasse Ueber Aerger")
    expect(transliterate("Fisch & Chips", { locale: de })).toBe("Fisch  und  Chips")
    expect(transliterate("İstanbul Şişli", { locale: tr })).toBe("Istanbul Sisli")
    expect(transliterate("Київ Ґудзик Щастя", { locale: uk })).toBe("Kyiv Gudzyk Shchastya")
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
