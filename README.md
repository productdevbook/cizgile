<p align="center">
  <br>
  <img src=".github/assets/cover.svg?v=7e268b8" alt="cizgile — Zero-dependency URL slug engine" width="100%">
  <br><br>
  <b style="font-size: 2em;">cizgile</b>
  <br><br>
  Zero-dependency URL slug engine.
  <br>
  Turn any title into a clean URL slug — in any language — and work with URLs the way RFC 3986 and RFC 3987 describe them. Pure TypeScript, works everywhere.
  <br><br>
  <a href="https://npmjs.com/package/cizgile"><img src="https://img.shields.io/npm/v/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="npm version"></a>
  <a href="https://github.com/productdevbook/cizgile/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/productdevbook/cizgile/ci.yml?style=flat&colorA=18181B&colorB=34d399" alt="ci"></a>
  <a href="https://npmjs.com/package/cizgile"><img src="https://img.shields.io/npm/dm/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/result?p=cizgile"><img src="https://img.shields.io/bundlephobia/minzip/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="bundle size"></a>
  <a href="https://github.com/productdevbook/cizgile/blob/main/LICENSE"><img src="https://img.shields.io/github/license/productdevbook/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="license"></a>
</p>

## Quick start

```sh
npm install cizgile
```

```ts
import { slugify } from "cizgile"

slugify("Hello, World!") // "hello-world"
slugify("İstanbul Şişli & Çığ", { locale: "tr" }) // "istanbul-sisli-ve-cig"
slugify("Straße Über Ärger", { locale: "de" }) // "strasse-ueber-aerger"
slugify("你好 World", { unicode: true }) // "你好-world"
```

ESM only, no dependencies. Tested on Node 20+ and Bun; it uses no host APIs, so it also runs in browsers and edge workers.

## Contents

- [Why cizgile](#why-cizgile)
- [Entry points](#entry-points)
- [Slugs](#slugs)
- [Languages and scripts](#languages-and-scripts)
- [URL toolkit](#url-toolkit)
- [Full IDNA](#full-idna)
- [For AI agents](#for-ai-agents)
- [Performance](#performance)
- [How it compares](#how-it-compares)
- [Development](#development)

## Why cizgile

- **Correct by construction.** Every ASCII slug is a valid URL path segment (RFC 3986 `segment-nz-nc`): no percent-encoding needed, never `.` or `..`, never mistaken for a scheme.
- **Speaks your language.** 50 locales and 24 scripts: `ß` → `ss`, `İ` → `i`, `Щ` → `shch`, `서울` → `seoul`, `กรุงเทพ` → `krungthep`.
- **Unicode slugs when you want them.** `你好-world` stays readable, and `iriToUri` gives you the exact percent-encoded form for the wire.
- **A real URL toolkit.** Resolve, normalise, compare, validate and relativise URLs by the RFC, cross-checked against the WHATWG `URL` parser.
- **Small and tree-shakeable.** `import { slugify }` ships only the Latin table. Other scripts are added to your bundle only when you import them.

## Entry points

| Import                  | What you get                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `cizgile`               | `slugify`, `isSlug`, `createSlugger`, `truncateSlug`, `measure`, `decamelize`, script and bidi guards |
| `cizgile/transliterate` | `transliterate`, per-script tables, locales, `defineLocale`, `registerLocale`                         |
| `cizgile/uri`           | Percent-encoding, `resolveUri`, `normalizeUri`, `relativize`, validators, IRI ↔ URI, punycode         |
| `cizgile/uri/idna`      | Full UTS #46 `idnaToAscii` / `idnaToUnicode` (optional, ~45 KB)                                       |

## Slugs

### Everyday use

```ts
import { slugify } from "cizgile"

slugify("Déjà Vu!") // "deja-vu"
slugify("don't stop") // "dont-stop"
slugify("Hello World", { separator: "_" }) // "hello_world"
slugify("Donald E. Knuth", { lowercase: false }) // "Donald-E-Knuth"
slugify("getHTTPResponse", { decamelize: true }) // "get-http-response"
slugify("v1.2.3", { preserveCharacters: ["."] }) // "v1.2.3"
slugify("the quick brown fox", { maxLength: 9 }) // "the-quick"
slugify("!!!", { fallback: "untitled" }) // "untitled"
slugify("C++ & Rust", { replacements: [["C++", "cpp"]] }) // "cpp-and-rust"
```

### Unique slugs

```ts
import { createSlugger } from "cizgile"

const slug = createSlugger()
slug("Hello") // "hello"
slug("Hello") // "hello-2"
slug("hello-2") // "hello-2-2" — never a duplicate
slug.reset()
```

### Validation

```ts
import { isSlug } from "cizgile"

isSlug("hello-world") // true
isSlug("Hello World") // false
isSlug("hello_world", { separator: "_" }) // true
isSlug("你好-world", { unicode: true }) // true
```

`isSlug` accepts exactly what `slugify` would produce with the same options, including `locale`.

### Unicode slugs

```ts
import { slugify } from "cizgile"
import { iriToUri, uriToIri } from "cizgile/uri"

const slug = slugify("Ünïcödé ﬁnal ①", { unicode: true }) // "ünïcödé-final-1"
const wire = iriToUri(slug) // "%C3%BCn%C3%AFc%C3%B6d%C3%A9-final-1"
uriToIri(wire) === slug // true
```

Unicode slugs keep letters, digits and combining marks. They are NFKC-normalised, never start with a mark, and never contain invisible or bidi-control characters.

For user-supplied titles there are two optional guards:

```ts
slugify("pаypal", { unicode: true, scripts: "single" }) // throws: that "а" is Cyrillic
slugify("مرحبا 123", { unicode: true, bidi: "encode" }) // "%D9%85%D8%B1%D8%AD%D8%A8%D8%A7-123"
```

- `scripts` applies a UTS #39 restriction level: `"single"`, `"highly-restrictive"`, `"moderately-restrictive"` or `"any"`.
- `bidi` enforces the RFC 3987 §4.2 direction rule: `"allow"`, `"encode"` or `"throw"`.

### Options

| Option                      | Default   | What it does                                                                                                                              |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `separator`                 | `"-"`     | Joins words. Any URL-safe punctuation (`- _ . ~ !$&'()*+,;= @`), several characters (`"--"`), or `""`.                                    |
| `lowercase`                 | `true`    | `false` keeps the original case.                                                                                                          |
| `unicode`                   | `false`   | Keep letters from every script instead of transliterating to ASCII.                                                                       |
| `locale`                    | —         | Language-specific rules: a locale id or a `Locale` object.                                                                                |
| `transliterate`             | `true`    | An array adds script tables. `false` skips the Latin and symbol tables. `"none"` keeps only accent folding and symbol words.              |
| `decamelize`                | `false`   | `fooBar` → `foo-bar`, `HTMLParser` → `html-parser`.                                                                                       |
| `replacements`              | `[]`      | `[from, to]` pairs applied first. Spaces in `to` become separators.                                                                       |
| `remove`                    | `/['’]/g` | A global regex of characters to delete instead of turning them into separators (`don't` → `dont`). `false` keeps them.                    |
| `preserveCharacters`        | `[]`      | Extra URL-safe characters to keep, such as `["."]` for version numbers.                                                                   |
| `preserveLeadingUnderscore` | `false`   | `_draft` → `_draft`.                                                                                                                      |
| `preserveTrailingSeparator` | `false`   | Keep a trailing separator while the user is still typing.                                                                                 |
| `maxLength`                 | —         | Cut at a word boundary, never inside a character (emoji sequences, combining marks).                                                      |
| `maxLengthUnit`             | `"units"` | What `maxLength` counts: UTF-16 `"units"` (like `.length`), `"code-points"`, `"graphemes"`, or UTF-8 `"bytes"` for a column or file name. |
| `fallback`                  | —         | Used when the result would be `""`: a string, or a function of the input. It is slugified with the same options.                          |
| `scripts`                   | `"any"`   | Unicode mode only: UTS #39 mixed-script restriction level.                                                                                |
| `bidi`                      | `"allow"` | Unicode mode only: RFC 3987 §4.2 direction rule.                                                                                          |

<details>
<summary><b>How the pipeline works</b></summary>

1. Strip control and format characters, then NFC.
2. Apply `replacements`, then NFKC.
3. `decamelize`.
4. Transliterate: locale table → your tables → Latin → symbols → strip accents.
5. Lowercase, apply `remove`, insert separators.
6. Cut to `maxLength`, then run the `scripts` and `bidi` guards.

The output is idempotent: `slugify(slugify(x)) === slugify(x)`.

</details>

## Languages and scripts

Latin-script locales work as plain string ids. Every other script lives in `cizgile/transliterate`, so it only enters your bundle when you import it.

```ts
import { slugify } from "cizgile"
import {
  cyrillic,
  defineLocale,
  de,
  hi,
  ko,
  registerLocale,
  ru,
  th,
  uk,
} from "cizgile/transliterate"

slugify("Çay & Simit", { locale: "tr" }) // "cay-ve-simit"
slugify("Zażółć & jaźń", { locale: "pl" }) // "zazolc-i-jazn"
slugify("Київ", { locale: uk }) // "kyiv"
slugify("서울", { locale: ko }) // "seoul"
slugify("नमस्ते दुनिया", { locale: hi }) // "namaste-duniya"
slugify("กรุงเทพ มหานคร", { locale: th }) // "krungthep-mahanakhon"
slugify("Привет мир", { transliterate: [cyrillic] }) // "privet-mir"

// Register once, then use the id as a string anywhere
registerLocale(ru)
slugify("Москва", { locale: "ru" }) // "moskva"

// Build your own variant
const swiss = defineLocale(de, { id: "de-CH", table: { ß: "ss" } })
slugify("Straße", { locale: swiss }) // "strasse"
```

Every Latin and Cyrillic locale spells out `&`, `%`, `$` and `£` in its own language: `slugify("50% off", { locale: "de" })` gives `"50-prozent-off"`, and without a locale you get `"50-off"`.

### Supported scripts

| Script                                        | Tables                                                         | Locales                                                                            |
| --------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Latin                                         | `latin` (always on)                                            | `az ca cs da de es et fi fr hr hu is it lt lv nb nl pl pt ro sk sl sv tr vi` (ids) |
| Cyrillic                                      | `cyrillic` `cyrillicUk` `cyrillicBg` `cyrillicMk` `cyrillicSr` | `be bg kk mk ru sr uk`                                                             |
| Greek, Hebrew                                 | `greek` `hebrew`                                               | `el` `he`                                                                          |
| Arabic                                        | `arabic` `persian` `urdu` `pashto`                             | —                                                                                  |
| Armenian, Georgian, Dhivehi                   | `armenian` `georgian` `dhivehi`                                | —                                                                                  |
| Devanagari, Bengali, Gurmukhi, Gujarati, Odia | `devanagari` `bengali` `gurmukhi` `gujarati` `oriya`           | `hi bn pa gu or`                                                                   |
| Tamil, Telugu, Kannada, Malayalam, Sinhala    | `tamil` `telugu` `kannada` `malayalam` `sinhala`               | `ta te kn ml si`                                                                   |
| Thai, Lao, Khmer, Myanmar                     | `thai` `lao` `khmer` `myanmar`                                 | `th lo km my`                                                                      |
| Hangul, kana                                  | `hangul` `kana`                                                | `ko ja`                                                                            |
| Punctuation and symbols                       | `symbols` (always on)                                          | —                                                                                  |

`allScripts` loads every table at once. Kanji and Han characters are kept as they are.

### Transliteration on its own

```ts
import { transliterate, cyrillic, hangul, kana, devanagari, locales } from "cizgile/transliterate"

transliterate("Straße Ærø") // "Strasse AEro"
transliterate("Привет", { tables: [cyrillic] }) // "Privet"
transliterate("Ängsö", { locale: locales.sv }) // "Aengsoe"
transliterate("서울 ひらがな नमस्ते", { tables: [hangul, kana, devanagari] }) // "seoul hiragana namaste"
transliterate("नमस्ते 你好") // "नमस्ते 你好" (scripts without a table are kept; use unknown: "drop" to remove them)
transliterate("ﬁnal x² Ⅷ", { nfkc: true }) // "final x2 VIII"
```

`defineLocale` and `mergeTables` return new objects. Nothing global is ever mutated.

<details>
<summary><b>How each script is romanised</b></summary>

- **Indic scripts** (Devanagari, Bengali, Tamil, Sinhala, …) are read syllable by syllable: inherent `a`, no vowel length, no schwa deletion. `भारत` → `bharata`, `කොළඹ` → `kolamba`.
- **Hangul** uses Revised Romanization jamo by jamo, without sound-change rules. `한국어` → `hangukeo`.
- **Kana** uses Hepburn. The long-vowel mark and the small `っ` are dropped.
- **Thai** follows the Royal Thai General System without tones or vowel length. Vowels written before the consonant (`เ แ โ ใ ไ`) move behind it, consonants take their initial or final value, and silent letters under `์` are dropped. `ไทย` → `thai`, `เมือง` → `mueang`, `โรงเรียน` → `rongrian`.
- **Lao** uses the same logic with a BGN/PCGN-style spelling. `ວຽງຈັນ` → `viangchan`.
- **Khmer** reads each vowel by the series of its consonant, UNGEGN-style. `ភ្នំពេញ` → `phnumpenh`.
- **Myanmar** keeps the inherent `a` unless an asat, a vowel sign or a stacked consonant follows. `ရန်ကုန်` → `yankun`.
- **Armenian, Ukrainian:** where a letter is spelled differently at the start of a word (Armenian `ե`, Ukrainian `є ї й ю я`), the capital letter carries the word-initial form.

**Limits.** There is no dictionary or word segmentation, so the output follows the spelling, not the pronunciation. Thai words are not split, `ๆ` is dropped, and irregular spellings are not handled (`พัทยา` → `phatya`, not `phatthaya`). The same goes for Khmer and Lao silent letters and for Myanmar rhyme and tone rules.

Thai, Lao, Khmer and Myanmar need context, so their tables also contain rules: a key that starts with U+0001 is a regular expression, and its value is the replacement.

</details>

## URL toolkit

Everything in `cizgile/uri` follows RFC 3986 / RFC 3987 to the letter. It is tested against the RFCs' own examples and the WHATWG `URL` parser.

```ts
import {
  resolveUri,
  relativize,
  normalizeUri,
  equivalentUris,
  getOrigin,
  sortQuery,
  joinPaths,
  encodePathSegment,
  percentEncode,
  isAbsoluteUri,
  isIPv6Address,
  extractUri,
  iriToUri,
} from "cizgile/uri"

resolveUri("http://a/b/c/d;p?q", "../../g") // "http://a/g"
relativize("http://a/b/c/d;p?q", "http://a/b/g") // "../g"
normalizeUri("HTTP://www.EXAMPLE.com:80/%7e%41/./b/../c") // "http://www.example.com/~A/c"
equivalentUris("http://example.com", "http://example.com:80/") // true
getOrigin("HTTP://Example.com:80/a?b") // "http://example.com"
sortQuery("http://a/p?b=2&a=1") // "http://a/p?a=1&b=2"
joinPaths("/api/", "/v1", "../v2/") // "/api/v2/"
encodePathSegment("a/b?c") // "a%2Fb%3Fc"
percentEncode("À ア") // "%C3%80%20%E3%82%A2"
isAbsoluteUri("http://a/b#c") // false: an absolute-URI has no fragment
isIPv6Address("::ffff:192.0.2.1") // true
extractUri("<http://a/b>.") // "http://a/b"
iriToUri("http://例え.jp/résumé", { host: "punycode" }) // "http://xn--r8jz45g.jp/r%C3%A9sum%C3%A9"
```

<details>
<summary><b>Full API reference</b></summary>

#### Characters and percent-encoding (RFC 3986 §2)

- `isUnreserved` `isReserved` `isGenDelim` `isSubDelim` `isPchar` `isSegmentNzNc` `isQueryChar` `isScheme`: checks per code point.
- `percentEncode(text, keep?)`: UTF-8, uppercase hex. `keep` names a set: RFC `"unreserved" "pchar" "segment-nz-nc" "path" "query" "fragment" "userinfo"`, WHATWG `"whatwg-c0-control" "whatwg-fragment" "whatwg-query" "whatwg-special-query" "whatwg-path" "whatwg-userinfo" "whatwg-component" "form"`, or a predicate.
- `percentDecode(text, { plusAsSpace })`, `normalizePercentEncoding(text)`.
- `encodePathSegment(seg, { noColon })`, `encodePath(path, { relative })`, `encodeQuery`, `encodeFragment`, `encodeForm`.

#### Hosts (§3.2.2)

- `isIPv4Address` `isIPv6Address` `isIPvFuture` `isIPLiteral` `isRegName` `isHost`.
- `parseHost` `parseAuthority` `serializeAuthority`.
- `normalizeIPv6Address`: RFC 5952 form.
- `0x7f.0.0.1` and `2130706433` are registered names, not addresses (§7.4).

#### Parsing and validation (§4, Appendix A/B)

- `parseUri(uri, { authority })`, `serializeUri`: an empty component stays distinct from an absent one. `authority: true` also returns `userinfo`, `host`, `port` and `portNumber`.
- `isUriReference` `isUri` `isAbsoluteUri` `isRelativeReference` `classifyReference` `pathForm`: a validating parser built from the ABNF.
- `isIriReference` `isIri` `isIunreserved` `isIpchar`: the same for IRIs (RFC 3987 §2.2).
- `extractUri(text)`: Appendix C. Strips `<>`, quotes, `URL:` prefixes, trailing punctuation and line-wrap whitespace. A markdown link or an `href`/`src` attribute gives its URL.
- `findUris(text)`: the URIs in ordinary prose (`scheme://`, `www.`, `mailto:` and similar) with their offsets.

#### Resolution (§5)

- `resolveUri(base, ref, { strict, allowRelativeBase })`: passes every §5.4 example. Strict by default (`http:g` stays `http:g`).
- `relativize(base, target)`: the shortest reference that resolves back to `target`.
- `removeDotSegments(path)`, `mergePaths(base, refPath)`.
- `isSameDocumentReference(base, ref, { normalize })`.

#### Normalisation and comparison (§6)

- `normalizeUri(uri, options)`: case, percent-encoding, dot segments, default ports, empty path → `/`, IPv6 hosts in RFC 5952 form. Opt-in options:
  - `userinfo: "strip-password" | "strip"` (for logs)
  - `trailingSlash: "add" | "remove"`
  - `emptyQuery` / `emptyFragment: "remove"`
  - `host: "idna" | "unicode"`
  - `strict`: throw on a bad host or port
- `equivalentUris(a, b, { level, base, ignoreFragment, defaultPorts })`: `level` is `"simple"`, `"syntax"` or `"scheme"` (default). Never maps IRIs to URIs (RFC 3987 §5.3.1).
- `getOrigin(uri)`, `isSameOrigin(a, b)`: RFC 6454 origins with default ports dropped. `stripFragment(uri)`.
- `parseQuery(query)`, `stringifyQuery(pairs)`, `sortQuery(uri)`: `application/x-www-form-urlencoded` pairs, in order.
- `joinPaths(...pieces)`: single slashes, no dot segments.
- `normalizePath(path, { trailingSlash })`.

#### IRIs (RFC 3987)

- `isUcschar` `isIprivate` `isBidiControl` `hasBidiControls`.
- `iriToUri(iri, { bidi, nfc, strict, host })`: percent-encodes without altering characters (§3.1). `bidi: "throw" | "strip"` handles direction controls, `host: "punycode"` converts the domain, and `strict` rejects characters no IRI may contain.
- `uriToIri(uri)`: decodes only what §3.2 allows, per component.
- `punycodeEncode` `punycodeDecode`: RFC 3492.
- `domainToAscii` `domainToUnicode`: a light UTS #46 mapping (format characters removed, NFKC, lowercase) plus DNS checks: no empty labels, labels up to 63 octets, names up to 253, no leading or trailing hyphens, LDH characters only, and `xn--` labels must round-trip. For the full standard, use [`cizgile/uri/idna`](#full-idna).

#### Not implemented, on purpose

- RFC 6874 IPv6 zone identifiers (reverted by RFC 9844).
- The network-based normalisation of §6.2.4.

</details>

## Full IDNA

`cizgile/uri/idna` implements UTS #46 completely: the Unicode 16.0 status table, CONTEXTJ/CONTEXTO and the RFC 5893 bidi rule. It passes every case of the official `IdnaTestV2.txt`, down to the error codes. The table makes it about 45 KB minified, which is why it is a separate import. `cizgile/uri` does not include it.

```ts
import { idnaToAscii, idnaToUnicode, idnaToAsciiResult } from "cizgile/uri/idna"

idnaToAscii("Bücher.DE") // "xn--bcher-kva.de"
idnaToAscii("faß.de", { transitionalProcessing: true }) // "fass.de"
idnaToUnicode("xn--r8jz45g.jp") // "例え.jp"
idnaToAscii("a_b.com", { beStrict: true }) // throws RangeError: "a_b.com" is not valid (U1)
idnaToAsciiResult("aא") // { result: "xn--a-0hc", errors: ["B5", "B6"] }
```

- `idnaToAscii` and `idnaToUnicode` throw a `RangeError` that lists the error codes.
- `idnaToAsciiResult` and `idnaToUnicodeResult` never throw. They return `{ result, errors }` with the UTS #46 error codes (`P4`, `V1`–`V7`, `U1`, `B1`–`B6`, `C1`, `C2`, `A3`, `A4_1`, `A4_2`, `X4_2`) and `O1` for CONTEXTO.
- `codePointStatus(cp)` exposes the table itself.

The defaults match the WHATWG URL Standard:

| Option                   | Default | Effect                                                                                      |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------- |
| `beStrict`               | `false` | Turns on `useSTD3ASCIIRules`, `checkHyphens` and `verifyDnsLength` unless set explicitly    |
| `useSTD3ASCIIRules`      | `false` | Allow only `a-z`, `0-9` and `-` among ASCII characters (`U1`)                               |
| `checkHyphens`           | `false` | No `--` in positions 3–4, no hyphen at either end (`V2`, `V3`)                              |
| `checkBidi`              | `true`  | RFC 5893 rules 1–6 for every label of a bidi domain name (`B1`–`B6`)                        |
| `checkJoiners`           | `true`  | RFC 5892 CONTEXTJ for U+200C and U+200D (`C1`, `C2`)                                        |
| `checkContextO`          | `false` | RFC 5892 A.3–A.9: middle dot, keraia, geresh, gershayim, katakana middle dot, digits (`O1`) |
| `transitionalProcessing` | `false` | IDNA2003 mapping of `ß`, `ς`, U+200C, U+200D (deprecated)                                   |
| `verifyDnsLength`        | `false` | Labels 1–63 and names 1–253 octets (`A4_1`, `A4_2`; `X4_2` in ToUnicode)                    |
| `ignoreInvalidPunycode`  | `false` | Keep an undecodable `xn--` label instead of reporting `P4`                                  |

CONTEXTO is not part of UTS #46, so `beStrict` does not turn on `checkContextO`. The table is generated by `scripts/gen-idna.mjs`, which also refreshes the test fixture.

## For AI agents

If you are an assistant writing code with this library, these are the facts that matter:

- **Imports:** `cizgile` (slugs), `cizgile/transliterate` (tables, locales), `cizgile/uri` (URLs), `cizgile/uri/idna` (full IDNA). ESM only, no default exports, no side effects, no runtime dependencies.
- **Errors:** `slugify(text, options?)` returns `""` when the input has nothing usable; it never throws on ordinary text. It throws `RangeError`/`TypeError` only for invalid options (`separator: "/"`, `preserveCharacters` containing the separator, a non-global `remove` regex, a negative `maxLength`), and in unicode mode when `scripts` or `bidi: "throw"` rejects the result.
- **Output:** an ASCII slug is always a valid path segment, so put it in a URL as-is. For `unicode: true` output, call `iriToUri(slug)` before putting it on the wire.
- **Non-Latin scripts are opt-in.** Pass `transliterate: [cyrillic]` or a locale object such as `uk`, `ja`, `ko` or `th` from `cizgile/transliterate`. Without one, Cyrillic text gives `""` in ASCII mode.
- **Unique slugs:** use `createSlugger()`; do not append counters yourself.
- **URLs:** use `resolveUri`, `normalizeUri` and `equivalentUris` instead of string concatenation or `new URL()` when you need RFC behaviour (strict scheme handling, no special-scheme rewriting, no IDNA unless you ask for it).
- **Types:** every export has an explicit TypeScript signature. The `.d.mts` files in `dist/` are the authoritative API.

## Performance

Measured with `bun run bench` (Vitest bench, Node 24, one core of a desktop CPU). Higher is better.

| Input                                 | cizgile        | `@sindresorhus/slugify` | `slugify` (simov) |
| ------------------------------------- | -------------- | ----------------------- | ----------------- |
| ASCII title (60 chars)                | **396k ops/s** | 136k                    | 147k              |
| Latin with diacritics                 | **235k ops/s** | 96k                     | 179k              |
| Turkish, `locale: "tr"`               | 212k ops/s     | 99k                     | **216k**          |
| Cyrillic, `transliterate: [cyrillic]` | 179k ops/s     | 86k                     | **188k**          |
| 2.5 KB of mixed text                  | **6.4k ops/s** | 4.3k                    | 3.4k              |
| `isSlug`                              | 3.7M ops/s     | —                       | —                 |

| URL function        | cizgile                    | Built-in                         |
| ------------------- | -------------------------- | -------------------------------- |
| `resolveUri`        | ~0.8M ops/s                | `new URL()`: ~0.9M               |
| `percentEncode`     | 0.9M (mixed), 3.6M (ASCII) | `encodeURIComponent`: 3.1M, 4.7M |
| `removeDotSegments` | 2M                         | —                                |
| `iriToUri`          | 0.66M                      | —                                |
| `normalizeUri`      | 0.37M                      | —                                |

Options objects are resolved once and cached, so inline literals like `{ locale: "tr" }` cost nothing after the first call.

## How it compares

| Input                       | cizgile              | Django `slugify` | Rails `parameterize` | `@sindresorhus/slugify` |
| --------------------------- | -------------------- | ---------------- | -------------------- | ----------------------- |
| `" Joel is a slug "`        | `joel-is-a-slug`     | same             | same                 | same                    |
| `"jack & jill"`             | `jack-and-jill`      | `jack-jill`      | `jack-jill`          | `jack-and-jill`         |
| `"don't"`                   | `dont`               | `dont`           | `don-t`              | `dont`                  |
| `"fooBar"`                  | `foobar`             | `foobar`         | `foobar`             | `foo-bar`               |
| `"snake_case"`              | `snake-case`         | `snake_case`     | `snake_case`         | `snake-case`            |
| `"Straße"` (`locale: "de"`) | `strasse`            | `strae`          | `strasse`            | `strasse`               |
| `"Привет"`                  | `""` (opt-in tables) | `""`             | `""`                 | `privet`                |

`decamelize` is off by default (like Django and Rails), and `&` is spelled out (like sindresorhus). Each is one option away.

## Specifications

RFC 3986 (with errata 2033, 4547, 4789, 5428), RFC 3987, RFC 3492 (all nineteen §7.1 sample strings), RFC 5892, RFC 5893, RFC 8820, RFC 9844, UTS #46 (with `IdnaTestV2.txt`), UTS #39 restriction levels, UAX #29 grapheme boundaries, the WHATWG URL Standard's percent-encode sets, and Google Search Central's URL guidance. The test suite runs every example these documents contain.

## Development

```sh
bun install
bun run test            # oxlint, oxfmt, tsc, then vitest under Node and under Bun
bun run build           # rolldown → dist/*.mjs + dist/*.d.mts
bun run coverage
bun run bench           # compare against @sindresorhus/slugify, simov/slugify and the built-ins
bun run release         # bumpp: bump, tag, push — the tag publishes to npm
```

Release notes are on the [GitHub Releases page](https://github.com/productdevbook/cizgile/releases). See [CONTRIBUTING.md](CONTRIBUTING.md) to work on the library and [SECURITY.md](SECURITY.md) to report a vulnerability.

## Credits

- [simov/slugify](https://github.com/simov/slugify): the charmap and per-locale override idea, and most Cyrillic, Greek, Arabic and symbol values.
- [sindresorhus/slugify](https://github.com/sindresorhus/slugify) and [sindresorhus/transliterate](https://github.com/sindresorhus/transliterate): `decamelize`, custom replacements, the counter slugger, and the Armenian, Georgian and Dhivehi tables.
- [Django](https://github.com/django/django) and [Rails](https://github.com/rails/rails): the reference behaviour the parity tests are written against.
- The [WHATWG URL Standard](https://url.spec.whatwg.org/): percent-encode sets, the parser every result is cross-checked with, and the RFC 3986-compatible subset of [`urltestdata.json`](https://github.com/web-platform-tests/wpt/blob/master/url/resources/urltestdata.json) (web-platform-tests, BSD 3-Clause), vendored as a fixture.
- [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) by Berners-Lee, Fielding and Masinter, and [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987) by Duerst and Suignard.
- The [Unicode Consortium](https://www.unicode.org/) for the IDNA mapping table and test data.
- [Rolldown](https://rolldown.rs), [Oxc](https://oxc.rs), [Vitest](https://vitest.dev), [Bun](https://bun.sh) and [TypeScript](https://www.typescriptlang.org).

## License

MIT. Transliteration values are derived from simov/slugify and sindresorhus/transliterate (both MIT).
