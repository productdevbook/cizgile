import sindresorhus from "@sindresorhus/slugify"
import simov from "slugify"
import { bench, describe } from "vitest"
import { createSlugger, isSlug, slugify } from "../src"
import { cyrillic } from "../src/transliterate"

const ASCII = "The Quick Brown Fox Jumps Over the Lazy Dog, Again & Again!"
const LATIN = "Déjà Vu: Crème Brûlée à la Straße, Łódź & Ærø"
const TURKISH = "İstanbul Şişli Çığ Ğüneş Işığı & Simit"
const CYRILLIC = "Привет мир, Щука и Ёж — Київ Ґудзик Щастя"
const CJK = "你好 世界 こんにちは 안녕하세요 World"
const LONG = `${ASCII} ${LATIN} ${TURKISH} `.repeat(20)

describe("slugify ASCII", () => {
  bench("cizgile", () => {
    slugify(ASCII)
  })
  bench("@sindresorhus/slugify", () => {
    sindresorhus(ASCII)
  })
  bench("slugify (simov)", () => {
    simov(ASCII, { lower: true, strict: true })
  })
})

describe("slugify Latin with diacritics", () => {
  bench("cizgile", () => {
    slugify(LATIN)
  })
  bench("@sindresorhus/slugify", () => {
    sindresorhus(LATIN)
  })
  bench("slugify (simov)", () => {
    simov(LATIN, { lower: true, strict: true })
  })
})

describe("slugify Turkish locale", () => {
  bench("cizgile { locale: 'tr' }", () => {
    slugify(TURKISH, { locale: "tr" })
  })
  bench("@sindresorhus/slugify", () => {
    sindresorhus(TURKISH)
  })
  bench("slugify (simov, locale: tr)", () => {
    simov(TURKISH, { lower: true, strict: true, locale: "tr" })
  })
})

describe("slugify Cyrillic", () => {
  bench("cizgile { transliterate: [cyrillic] }", () => {
    slugify(CYRILLIC, { transliterate: [cyrillic] })
  })
  bench("@sindresorhus/slugify", () => {
    sindresorhus(CYRILLIC)
  })
  bench("slugify (simov)", () => {
    simov(CYRILLIC, { lower: true, strict: true })
  })
})

describe("slugify unicode mode", () => {
  bench("cizgile { unicode: true }", () => {
    slugify(CJK, { unicode: true })
  })
  bench("cizgile { unicode: true, scripts: 'highly-restrictive', bidi: 'throw' }", () => {
    slugify(CJK, { unicode: true, scripts: "highly-restrictive", bidi: "throw" })
  })
})

describe("slugify long text (2.5 KB)", () => {
  bench("cizgile", () => {
    slugify(LONG)
  })
  bench("cizgile { maxLength: 80 }", () => {
    slugify(LONG, { maxLength: 80 })
  })
  bench("@sindresorhus/slugify", () => {
    sindresorhus(LONG)
  })
  bench("slugify (simov)", () => {
    simov(LONG, { lower: true, strict: true })
  })
})

describe("helpers", () => {
  const slugger = createSlugger()
  bench("isSlug", () => {
    isSlug("the-quick-brown-fox-jumps-over-the-lazy-dog")
  })
  bench("createSlugger()", () => {
    slugger("Hello World")
  })
})
