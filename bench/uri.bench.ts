import { bench, describe } from "vitest"
import {
  encodePathSegment,
  equivalentUris,
  iriToUri,
  isUriReference,
  normalizeUri,
  percentDecode,
  percentEncode,
  relativize,
  removeDotSegments,
  resolveUri,
  uriToIri,
} from "../src/uri"
import { transliterate } from "../src/transliterate"

const BASE = "http://a/b/c/d;p?q"
const TEXT = "Crème Brûlée & Straße / Łódź ? 100%"
const ENCODED = percentEncode(TEXT)
const IRI = "http://例え.jp/résumé/ünïcödé?q=ア#frag"
const sink: string[] = []

describe("percent-encoding", () => {
  bench("percentEncode", () => {
    percentEncode(TEXT)
  })
  bench("encodeURIComponent (built-in)", () => {
    encodeURIComponent(TEXT)
  })
  bench("encodePathSegment", () => {
    encodePathSegment(TEXT)
  })
  bench("percentDecode", () => {
    percentDecode(ENCODED)
  })
  bench("decodeURIComponent (built-in)", () => {
    decodeURIComponent(ENCODED)
  })
})

describe("resolution", () => {
  bench("resolveUri", () => {
    resolveUri(BASE, "../../g?y#s")
  })
  bench("new URL() (built-in)", () => {
    sink.length = 0
    sink.push(new URL("../../g?y#s", BASE).href)
  })
  bench("removeDotSegments", () => {
    removeDotSegments("/a/b/c/./../../g")
  })
  bench("relativize", () => {
    relativize(BASE, "http://a/b/g?y#s")
  })
})

describe("normalization and validation", () => {
  bench("normalizeUri", () => {
    normalizeUri("HTTP://www.EXAMPLE.com:80/%7e%41/./b/../c?%41#%42")
  })
  bench("equivalentUris", () => {
    equivalentUris("http://example.com", "http://example.com:80/")
  })
  bench("isUriReference", () => {
    isUriReference("http://user@[2001:db8::7]:8080/c=GB?objectClass?one#frag")
  })
})

describe("IRI", () => {
  bench("iriToUri", () => {
    iriToUri(IRI)
  })
  bench("iriToUri { host: 'punycode' }", () => {
    iriToUri(IRI, { host: "punycode" })
  })
  bench("uriToIri", () => {
    uriToIri("http://%E4%BE%8B%E3%81%88.jp/r%C3%A9sum%C3%A9?q=%E3%82%A2")
  })
})

describe("transliterate", () => {
  bench("transliterate Latin", () => {
    transliterate("Déjà Vu: Crème Brûlée à la Straße, Łódź & Ærø")
  })
})
