import sindresorhus from "@sindresorhus/slugify"
import simov from "slugify"
import { test } from "vitest"
import { checkScripts, createSlugger, decamelize, isSlug, slugify, truncateSlug } from "../src"
import { cyrillic } from "../src/transliterate"

const ASCII = "The Quick Brown Fox Jumps Over the Lazy Dog, Again & Again!"
const LATIN = "Déjà Vu: Crème Brûlée à la Straße, Łódź & Ærø"
const TURKISH = "İstanbul Şişli Çığ Ğüneş Işığı & Simit"
const CYRILLIC = "Привет мир, Щука и Ёж — Київ Ґудзик Щастя"
const CJK = "你好 世界 こんにちは 안녕하세요 World"
const CJK_RESTRICTED = "你好 世界 こんにちは World"
const LONG = `${ASCII} ${LATIN} ${TURKISH} `.repeat(20)

test("slugify ASCII", async ({ bench }) => {
  await bench.compare(
    bench("cizgile", () => {
      slugify(ASCII)
    }),
    bench("@sindresorhus/slugify", () => {
      sindresorhus(ASCII)
    }),
    bench("slugify (simov)", () => {
      simov(ASCII, { lower: true, strict: true })
    }),
  )
})

test("slugify Latin with diacritics", async ({ bench }) => {
  await bench.compare(
    bench("cizgile", () => {
      slugify(LATIN)
    }),
    bench("@sindresorhus/slugify", () => {
      sindresorhus(LATIN)
    }),
    bench("slugify (simov)", () => {
      simov(LATIN, { lower: true, strict: true })
    }),
  )
})

test("slugify Turkish locale", async ({ bench }) => {
  await bench.compare(
    bench("cizgile { locale: 'tr' }", () => {
      slugify(TURKISH, { locale: "tr" })
    }),
    bench("@sindresorhus/slugify", () => {
      sindresorhus(TURKISH)
    }),
    bench("slugify (simov, locale: tr)", () => {
      simov(TURKISH, { lower: true, strict: true, locale: "tr" })
    }),
  )
})

test("slugify Cyrillic", async ({ bench }) => {
  await bench.compare(
    bench("cizgile { transliterate: [cyrillic] }", () => {
      slugify(CYRILLIC, { transliterate: [cyrillic] })
    }),
    bench("@sindresorhus/slugify", () => {
      sindresorhus(CYRILLIC)
    }),
    bench("slugify (simov)", () => {
      simov(CYRILLIC, { lower: true, strict: true })
    }),
  )
})

test("slugify unicode mode", async ({ bench }) => {
  await bench.compare(
    bench("cizgile { unicode: true }", () => {
      slugify(CJK, { unicode: true })
    }),
    bench("cizgile { unicode: true, scripts: 'highly-restrictive', bidi: 'throw' }", () => {
      slugify(CJK_RESTRICTED, { unicode: true, scripts: "highly-restrictive", bidi: "throw" })
    }),
  )
})

test("slugify long text (2.5 KB)", async ({ bench }) => {
  await bench.compare(
    bench("cizgile", () => {
      slugify(LONG)
    }),
    bench("cizgile { maxLength: 80 }", () => {
      slugify(LONG, { maxLength: 80 })
    }),
    bench("@sindresorhus/slugify", () => {
      sindresorhus(LONG)
    }),
    bench("slugify (simov)", () => {
      simov(LONG, { lower: true, strict: true })
    }),
  )
})

test("helpers", async ({ bench }) => {
  const slugger = createSlugger()
  await bench.compare(
    bench("isSlug", () => {
      isSlug("the-quick-brown-fox-jumps-over-the-lazy-dog")
    }),
    bench("createSlugger()", () => {
      slugger("Hello World")
    }),
  )
})

test("slug helpers", async ({ bench }) => {
  const SLUG = slugify(LONG)
  await bench.compare(
    bench("truncateSlug (2.5 KB slug, 80 units)", () => {
      truncateSlug(SLUG, 80)
    }),
    bench("truncateSlug (bytes)", () => {
      truncateSlug(SLUG, 80, "-", "bytes")
    }),
    bench("decamelize", () => {
      decamelize("getHTTPResponseCodeForXMLHttpRequest")
    }),
    bench("checkScripts (Latin)", () => {
      checkScripts("hello-world-again")
    }),
    bench("checkScripts (mixed)", () => {
      checkScripts("hello-мир-world")
    }),
  )
})
