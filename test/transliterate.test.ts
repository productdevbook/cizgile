import { describe, expect, it } from "vitest"
import {
  allScripts,
  arabic,
  armenian,
  cyrillic,
  cyrillicUk,
  de,
  defineLocale,
  bengali,
  devanagari,
  georgian,
  gujarati,
  gurmukhi,
  kannada,
  khmer,
  lao,
  malayalam,
  myanmar,
  sinhala,
  thai,
  oriya,
  tamil,
  telugu,
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

  it("spells the Latin letters that have no decomposition", () => {
    expect(transliterate("Ƿƿ Ȝȝ Ʌʌ Ƣƣ Ȣȣ Ʈʈ Ɲɲ Ɂɂ Ƨƨ")).toBe("Ww Ghgh Vv Ghgh Ouou Tt Nn  Ss")
  })

  it("transliterates Devanagari syllable by syllable", () => {
    expect(transliterate("नमस्ते दुनिया", { tables: [devanagari] })).toBe("namaste duniya")
    expect(transliterate("हिन्दी भारत", { tables: [devanagari] })).toBe("hindi bharata")
    expect(transliterate("क्षत्रिय ज्ञान", { tables: [devanagari] })).toBe("kshatriya jnyana")
    expect(transliterate("क़िला फ़िल्म", { tables: [devanagari] })).toBe("qila filma")
    expect(transliterate("१२३ ॐ। संस्कृतम्", { tables: [devanagari] })).toBe("123 om  sanskritam")
    expect(transliterate("मुंबई", { tables: [devanagari] })).toBe("munbai")
    for (const [key, value] of Object.entries(devanagari)) {
      expect(value, key).toMatch(/^[a-z0-9 ]*$/)
      expect(key.normalize("NFC"), key).toBe(key)
    }
  })

  it.each([
    ["bengali", bengali, "বাংলা ভারত ঢাকা", "bangla bharata dhaka"],
    ["gurmukhi", gurmukhi, "ਪੰਜਾਬੀ ਲੁਧਿਆਣਾ", "panjabi ludhiana"],
    ["gujarati", gujarati, "ગુજરાતી અમદાવાદ", "gujarati amadavada"],
    ["oriya", oriya, "ଓଡ଼ିଆ ଭୁବନେଶ୍ୱର", "oria bhubaneshwra"],
    ["tamil", tamil, "தமிழ் சென்னை", "tamil chennai"],
    ["telugu", telugu, "తెలుగు హైదరాబాద్", "telugu haidarabad"],
    ["kannada", kannada, "ಕನ್ನಡ ಬೆಂಗಳೂರು", "kannada bengaluru"],
    ["malayalam", malayalam, "മലയാളം കേരളം", "malayalam keralam"],
  ] as const)("%s shares the Devanagari layout", (_name, table, input, expected) => {
    expect(transliterate(input, { tables: [table] })).toBe(expected)
    expect(transliterate(input)).toBe(input)
    for (const [key, value] of Object.entries(table)) {
      expect(value, key).toMatch(/^[a-z0-9 ]*$/)
      expect(key.normalize("NFC"), key).toBe(key)
    }
  })

  it.each([
    ["Bangkok", thai, "กรุงเทพมหานคร", "krungthepmahanakhon"],
    ["Vientiane", lao, "ວຽງຈັນ", "viangchan"],
    ["Phnom Penh", khmer, "ភ្នំពេញ", "phnumpenh"],
    ["Yangon", myanmar, "ရန်ကုန်", "yankun"],
    ["Colombo", sinhala, "කොළඹ", "kolamba"],
  ] as const)("%s in its own script", (_name, table, input, expected) => {
    expect(transliterate(input, { tables: [table] })).toBe(expected)
    expect(transliterate(input)).toBe(input)
  })

  it.each([
    ["ไทย", "thai"],
    ["เมือง", "mueang"],
    ["โรงเรียน", "rongrian"],
    ["กรุงเทพ", "krungthep"],
    ["คน", "khon"],
    ["สวัสดี", "sawatdi"],
    ["ขอบคุณ", "khopkhun"],
    ["ประเทศไทย", "prathetthai"],
    ["เชียงใหม่", "chiangmai"],
    ["ภูเก็ต", "phuket"],
    ["สงกรานต์", "songkran"],
    ["น้ำ", "nam"],
    ["ใหม่", "mai"],
    ["แมว", "maeo"],
    ["ควร", "khuan"],
    ["จันทร์", "chan"],
    ["ศาสตร์", "sat"],
    ["บรรทัด", "banthat"],
    ["โทรศัพท์", "thorasap"],
    ["ขนม", "khanom"],
    ["ตลาด", "talat"],
  ])("thai reorders prefixed vowels and reads final consonants: %s", (input, expected) => {
    expect(transliterate(input, { tables: [thai] })).toBe(expected)
  })

  it("thai digits, repetition mark, abbreviation sign and mixed text", () => {
    expect(transliterate("ปี ๒๕๖๗", { tables: [thai] })).toBe("pi 2567")
    expect(transliterate("เด็กๆ", { tables: [thai] })).toBe("dek")
    expect(transliterate("กรุงเทพฯ", { tables: [thai] })).toBe("krungthep")
    expect(transliterate("Hello กรุงเทพ 2", { tables: [thai] })).toBe("Hello krungthep 2")
    expect(transliterate("ก", { tables: [thai] })).toBe("ko")
    expect(transliterate("น้ำ", { tables: [thai], nfkc: true })).toBe("nam")
  })

  it.each([
    ["ລາວ", "lao"],
    ["ຫຼວງພະບາງ", "luangphabang"],
    ["ສະບາຍດີ", "sabaidi"],
    ["ເຮືອນ", "huean"],
    ["ຄົນ", "khon"],
    ["ໂຮງຮຽນ", "honghian"],
    ["ສະຫວັນນະເຂດ", "savannakhet"],
    ["ເມືອງ ໑໒໓", "mueang 123"],
  ])("lao reorders prefixed vowels: %s", (input, expected) => {
    expect(transliterate(input, { tables: [lao] })).toBe(expected)
  })

  it.each([
    ["កម្ពុជា", "kampuchea"],
    ["សៀមរាប", "siemreab"],
    ["ខ្មែរ", "khmaer"],
    ["ខ្ញុំ", "khnhom"],
    ["កំពង់ចាម", "kampongcham"],
    ["ប្រជាជន", "bracheachon"],
    ["គាត់", "keat"],
    ["១២៣", "123"],
  ])("khmer reads vowels by the series of the base consonant: %s", (input, expected) => {
    expect(transliterate(input, { tables: [khmer] })).toBe(expected)
  })

  it.each([
    ["မန္တလေး", "mantale"],
    ["မြန်မာ", "myanma"],
    ["ကမ္ဘာ", "kambha"],
    ["မှ", "hma"],
    ["၁၂၃", "123"],
  ])("myanmar medials, asat and stacked consonants: %s", (input, expected) => {
    expect(transliterate(input, { tables: [myanmar] })).toBe(expected)
  })

  it.each([
    ["ශ්\u200Dරී ලංකා", "shri lanka"],
    ["සිංහල", "sinhala"],
    ["ආයුබෝවන්", "ayubovan"],
    ["෧෨", "12"],
  ])("sinhala syllables, virama and rakaransaya: %s", (input, expected) => {
    expect(transliterate(input, { tables: [sinhala] })).toBe(expected)
  })

  it("rule keys (a leading U+0001) run in table order before the character lookup", () => {
    const rules = { "\u0001(a)(b)": "$2$1", b: "B" }
    expect(transliterate("xéab", { tables: [rules] })).toBe("xeBa")
    const merged = mergeTables(rules, { é: "E" })
    expect(transliterate("éab", { tables: [merged] })).toBe("EBa")
  })

  it("southeast asian tables emit only ASCII and leave other scripts alone", () => {
    for (const table of [thai, lao, khmer, myanmar, sinhala]) {
      for (const [key, value] of Object.entries(table)) {
        if (key.startsWith("\u0001")) continue
        expect(value, key).toMatch(/^[a-z0-9 ,.]*$/)
        expect(key.normalize("NFC"), key).toBe(key)
      }
    }
    expect(transliterate("ไทย Привет", { tables: [thai] })).toBe("thai Привет")
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
