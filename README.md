<p align="center">
  <br>
  <img src=".github/assets/cover.svg?v=f85c00e" alt="cizgile — Zero-dependency URL slug engine" width="100%">
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

## Install

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

No dependencies. ESM only. Node 20+, Bun, Deno, browsers, edge workers.

## Why cizgile

- **Slugs that are correct by construction.** Every ASCII slug is a valid URL path segment (RFC 3986 `segment-nz-nc`) — no percent-encoding needed, no `.` or `..`, no accidental scheme prefix.
- **Speaks your language.** 36 locales (`tr`, `de`, `pl`, `sv`, `uk`, `ja`, `ko`, …) and 10 scripts (Latin, Cyrillic, Greek, Arabic, Armenian, Georgian, Dhivehi, Hebrew, Hangul, kana). `ß` → `ss`, `İ` → `i`, `Щ` → `shch`, `서울` → `seoul`.
- **Unicode slugs when you want them.** `你好-world` stays readable, and `iriToUri` gives you the exact percent-encoded form for the wire.
- **A real URL toolkit underneath.** Resolve, normalise, compare, validate and relativise URLs by the RFC, cross-checked against the WHATWG `URL` parser.
- **Small and tree-shakeable.** `import { slugify }` ships the Latin table only; other scripts load only when you import them.

## Three entry points

| import                  | what you get                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `cizgile`               | `slugify`, `isSlug`, `createSlugger`, `truncateSlug`, `measure`, `decamelize`, script and bidi guards |
| `cizgile/transliterate` | `transliterate`, per-script tables, locales, `defineLocale`                                           |
| `cizgile/uri`           | percent-encoding, `resolveUri`, `normalizeUri`, `relativize`, validators, IRI ↔ URI, punycode         |

## Slugs

### Everyday use

```ts
import { slugify } from "cizgile"

slugify("Déjà Vu!") // "deja-vu"
slugify("don't stop") // "dont-stop"
slugify("v1.2.3", { preserveCharacters: ["."] }) // "v1.2.3"
slugify("Hello World", { separator: "_" }) // "hello_world"
slugify("Donald E. Knuth", { lowercase: false }) // "Donald-E-Knuth"
slugify("getHTTPResponse", { decamelize: true }) // "get-http-response"
slugify("the quick brown fox", { maxLength: 9 }) // "the-quick"
slugify("Ünïcödé Büro", { unicode: true, maxLength: 11, maxLengthUnit: "bytes" }) // "ünïcödé"
slugify("!!!", { fallback: "untitled" }) // "untitled"
slugify("C++ & Rust", { replacements: [["C++", "cpp"]] }) // "cpp-and-rust"
```

### Languages and scripts

Locale ids for Latin-script languages; Cyrillic locales and other scripts come from `cizgile/transliterate` so they only end up in your bundle when you use them.

```ts
import { slugify } from "cizgile"
import { cyrillic, greek, uk, ja, ko, defineLocale, de } from "cizgile/transliterate"

slugify("Çay & Simit", { locale: "tr" }) // "cay-ve-simit"
slugify("Fisch & Chips", { locale: "de" }) // "fisch-und-chips"
slugify("Ærø", { locale: "da" }) // "aeroe"
slugify("Zażółć & jaźń", { locale: "pl" }) // "zazolc-i-jazn"
slugify("Київ", { locale: uk }) // "kyiv"
slugify("Привет мир", { transliterate: [cyrillic] }) // "privet-mir"
slugify("Καλημέρα", { transliterate: [greek] }) // "kalimera"
slugify("서울 & 부산", { locale: ko }) // "seoul-mit-busan"
slugify("とうきょう", { locale: ja }) // "toukyou"

const swiss = defineLocale(de, { id: "de-CH", table: { ß: "ss" } })
slugify("Straße", { locale: swiss }) // "strasse"
```

Locale ids: `az ca cs da de es et fi fr hr hu is it lt lv nb nl pl pt ro sk sl sv tr vi`. Locale objects: those plus `be bg kk mk ru sr uk` (Cyrillic) and `el he ja ko` (Greek, Hebrew, kana, Hangul).

### Unicode slugs

```ts
import { slugify } from "cizgile"
import { iriToUri, uriToIri } from "cizgile/uri"

const slug = slugify("Ünïcödé ﬁnal ①", { unicode: true }) // "ünïcödé-final-1"
const wire = iriToUri(slug) // "%C3%BCn%C3%AFc%C3%B6d%C3%A9-final-1"
uriToIri(wire) === slug // true
```

Unicode slugs keep letters, digits and combining marks, are NFKC-normalised, never start with a mark and contain no invisible or bidi-control characters. Two optional guards for user-supplied titles:

```ts
slugify("pаypal", { unicode: true, scripts: "single" }) // throws — that "а" is Cyrillic
slugify("مرحبا 123", { unicode: true, bidi: "encode" }) // "%D9%85%D8%B1%D8%AD%D8%A8%D8%A7-123"
```

`scripts` applies the UTS #39 restriction levels (`"single"`, `"highly-restrictive"`, `"moderately-restrictive"`, `"any"`); `bidi` enforces RFC 3987 §4.2 (`"allow"`, `"encode"`, `"throw"`).

### Unique slugs

```ts
import { createSlugger } from "cizgile"

const slug = createSlugger()
slug("Hello") // "hello"
slug("Hello") // "hello-2"
slug("hello-2") // "hello-2-2"  — never a duplicate
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

`isSlug` accepts exactly what `slugify` would produce under the same options, `locale` included.

### All options

| option                      | default   | what it does                                                                                                                                                                       |
| --------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `separator`                 | `"-"`     | Joins words. Any URL-safe punctuation (`- _ . ~ !$&'()*+,;= @`), several of them (`"--"`), or `""`.                                                                                |
| `lowercase`                 | `true`    | `false` keeps the original case.                                                                                                                                                   |
| `unicode`                   | `false`   | Keep letters from every script instead of transliterating to ASCII.                                                                                                                |
| `locale`                    | —         | Language-specific rules: a locale id or a `Locale` object.                                                                                                                         |
| `transliterate`             | `true`    | `false` skips the Latin and symbol tables (the locale table and accent folding still apply); `"none"` keeps only accent folding and the symbol words; an array adds script tables. |
| `decamelize`                | `false`   | `fooBar` → `foo-bar`, `HTMLParser` → `html-parser`.                                                                                                                                |
| `replacements`              | `[]`      | `[from, to]` pairs applied first; spaces in `to` become separators.                                                                                                                |
| `remove`                    | `/['’]/g` | A global regex of characters to delete rather than turn into separators (`don't` → `dont`); `false` keeps them.                                                                    |
| `preserveCharacters`        | `[]`      | Extra URL-safe single characters to keep, e.g. `["."]` for version numbers. The separator or anything outside `segment-nz-nc` throws.                                              |
| `preserveLeadingUnderscore` | `false`   | `_draft` → `_draft`.                                                                                                                                                               |
| `preserveTrailingSeparator` | `false`   | Keep a trailing separator while the user is still typing.                                                                                                                          |
| `maxLength`                 | —         | Cut at a word boundary, never inside a character (emoji sequences, combining marks).                                                                                               |
| `maxLengthUnit`             | `"units"` | What `maxLength` counts: UTF-16 code units like `.length`, `"code-points"`, `"graphemes"`, or UTF-8 `"bytes"` for a column or filename budget.                                     |
| `fallback`                  | —         | Used when the result would be `""`: a string or a function of the input, slugified with the same options (`"untitled"`, then `untitled-2` in a slugger).                           |
| `scripts`                   | `"any"`   | Unicode mode: UTS #39 mixed-script restriction level.                                                                                                                              |
| `bidi`                      | `"allow"` | Unicode mode: RFC 3987 §4.2 direction rule — `"encode"` or `"throw"` on violation.                                                                                                 |

The pipeline runs in this order: strip control/format characters → NFC → `replacements` → NFKC → `decamelize` → transliterate (locale → your tables → Latin → symbols → strip accents) → lowercase → `remove` → separators → `maxLength` → guards. Output is idempotent: `slugify(slugify(x)) === slugify(x)`.

## Transliteration on its own

```ts
import { transliterate, cyrillic, hangul, kana, locales } from "cizgile/transliterate"

transliterate("Straße Ærø") // "Strasse AEro"
transliterate("Привет", { tables: [cyrillic] }) // "Privet"
transliterate("Ängsö", { locale: locales.sv }) // "Aengsoe"
transliterate("서울 ひらがな", { tables: [hangul, kana] }) // "seoul hiragana"
transliterate("नमस्ते 你好") // "नमस्ते 你好" — unknown scripts are kept intact (use unknown: "drop" to remove)
transliterate("ﬁnal x² Ⅷ", { nfkc: true }) // "final x2 VIII"
```

Tables: `latin symbols cyrillic cyrillicUk cyrillicBg cyrillicMk cyrillicSr greek arabic persian urdu pashto armenian georgian dhivehi hebrew hangul kana`, plus `allScripts`. Where a letter is spelled differently at the start of a word (Armenian `ե`, Ukrainian `є ї й ю я`), the capital carries the word-initial form. Hangul is romanised jamo by jamo (Revised Romanization without sound-change rules, so `한국어` is `hangukeo`), kana with Hepburn (the long-vowel mark and sokuon are dropped); kanji and Han are left as they are. `defineLocale` and `mergeTables` return new objects — nothing global is ever mutated.

## URL toolkit

Everything in `cizgile/uri` follows RFC 3986 / RFC 3987 to the letter and is tested against the RFC's own examples and the WHATWG `URL` parser.

```ts
import {
  resolveUri,
  relativize,
  normalizeUri,
  equivalentUris,
  encodePathSegment,
  percentEncode,
  percentDecode,
  isUri,
  isAbsoluteUri,
  isIPv6Address,
  extractUri,
  iriToUri,
  uriToIri,
  domainToAscii,
} from "cizgile/uri"

resolveUri("http://a/b/c/d;p?q", "../../g") // "http://a/g"
relativize("http://a/b/c/d;p?q", "http://a/b/g") // "../g"
normalizeUri("HTTP://www.EXAMPLE.com:80/%7e%41/./b/../c") // "http://www.example.com/~A/c"
equivalentUris("http://example.com", "http://example.com:80/") // true
encodePathSegment("a/b?c") // "a%2Fb%3Fc"
percentEncode("À ア") // "%C3%80%20%E3%82%A2"
isAbsoluteUri("http://a/b#c") // false — fragments are not allowed in an absolute-URI
isIPv6Address("::ffff:192.0.2.1") // true
extractUri("<http://a/b>.") // "http://a/b"
iriToUri("http://例え.jp/résumé", { host: "punycode" }) // "http://xn--r8jz45g.jp/r%C3%A9sum%C3%A9"
```

<details>
<summary><b>Full reference</b></summary>

**Characters and percent-encoding (RFC 3986 §2)**
`isUnreserved` `isReserved` `isGenDelim` `isSubDelim` `isPchar` `isSegmentNzNc` `isQueryChar` `isScheme` — per code point.
`percentEncode(text, keep?)` — UTF-8, uppercase hex. `keep` names a set: RFC `"unreserved" "pchar" "segment-nz-nc" "path" "query" "fragment" "userinfo"`, WHATWG `"whatwg-c0-control" "whatwg-fragment" "whatwg-query" "whatwg-special-query" "whatwg-path" "whatwg-userinfo" "whatwg-component" "form"`, or a predicate.
`percentDecode(text, { plusAsSpace })`, `normalizePercentEncoding(text)`.
`encodePathSegment(seg, { noColon })`, `encodePath(path, { relative })`, `encodeQuery`, `encodeFragment`, `encodeForm`.

**Hosts (§3.2.2)**
`isIPv4Address` `isIPv6Address` `isIPvFuture` `isIPLiteral` `isRegName` `isHost` `parseHost` `parseAuthority` `serializeAuthority` `normalizeIPv6Address` (RFC 5952). `0x7f.0.0.1` and `2130706433` are registered names, not addresses (§7.4).

**Parsing and validation (§4, Appendix A/B)**
`parseUri` `serializeUri` — components stay distinct from "absent"; the serializer inserts `/.` or `./` where the grammar requires it.
`isUriReference` `isUri` `isAbsoluteUri` `isRelativeReference` `classifyReference` `pathForm` — validating parser built from the ABNF.
`isIriReference` `isIri` `isIunreserved` `isIpchar` — the same for IRIs (RFC 3987 §2.2).
`extractUri(text)` — Appendix C: strips `<>`, quotes, `URL:` prefixes, trailing punctuation and line-wrap whitespace; a markdown link or an `href`/`src` attribute yields its URL.

**Resolution (§5)**
`resolveUri(base, ref, { strict, allowRelativeBase })` — every §5.4 example passes; strict by default (`http:g` stays `http:g`).
`relativize(base, target)` — shortest reference that resolves back to `target`.
`removeDotSegments(path)` — the literal two-buffer algorithm. `mergePaths(base, refPath)`.
`isSameDocumentReference(base, ref, { normalize })`.

**Normalisation and comparison (§6)**
`normalizeUri(uri, { defaultPorts, schemeBased, userinfo })` — case, percent-encoding, dot segments, default ports, empty path → `/`, IPv6 hosts in RFC 5952 form (`[0:0:0:0:0:0:0:1]` → `[::1]`); `userinfo: "strip-password" | "strip"` for logs.
`normalizePath(path, { trailingSlash })`.
`equivalentUris(a, b, { level, base, ignoreFragment, defaultPorts })` — `"simple"`, `"syntax"` or `"scheme"` (default). Never maps IRIs to URIs (RFC 3987 §5.3.1).

**IRIs (RFC 3987)**
`isUcschar` `isIprivate` `isBidiControl` `hasBidiControls`.
`iriToUri(iri, { bidi, nfc, strict, host })` — percent-encodes without altering characters (§3.1 step 1c); `bidi: "throw" | "strip"` handles direction controls; `host: "punycode"` converts the domain; `strict` rejects characters no IRI may contain.
`uriToIri(uri)` — decodes only what §3.2 allows, per component.
`punycodeEncode` `punycodeDecode` `domainToAscii` `domainToUnicode` — RFC 3492, no dependencies. `domainToAscii` maps and lowercases labels the way UTS #46 does, then rejects what no DNS name may carry: empty labels, labels over 63 octets, names over 253, leading or trailing hyphens, non-LDH characters and `xn--` labels that do not round-trip.

Deliberately not implemented: RFC 6874 IPv6 zone identifiers (reverted by RFC 9844), the network-based normalisation of §6.2.4, and the UTS #46 status table, CONTEXTJ/CONTEXTO and the RFC 5893 bidi rule for domains.

</details>

## For AI agents

If you are an assistant writing code with this library, these are the facts that matter:

- Import paths: `cizgile` (slugs), `cizgile/transliterate` (tables, locales), `cizgile/uri` (URLs). ESM only, no default exports, no side effects, no runtime dependencies.
- `slugify(text, options?)` returns `""` for input with nothing usable — it never throws on ordinary text. It throws `RangeError`/`TypeError` only for invalid options (`separator: "/"`, `preserveCharacters` containing the separator, a non-global `remove` regex, a negative `maxLength`) and, in unicode mode, when `scripts` or `bidi: "throw"` rejects the result.
- The ASCII output is always a valid path segment; put it in a URL as-is. For `unicode: true` output, call `iriToUri(slug)` before putting it on the wire.
- Cyrillic and other non-Latin scripts are opt-in: pass `transliterate: [cyrillic]` or a locale object such as `uk`, `ja` or `ko` from `cizgile/transliterate`. Without them, Cyrillic text produces `""` in ASCII mode. `transliterate()` keeps scripts it has no table for intact; `allScripts` loads every table.
- `createSlugger()` is the way to get unique slugs in a document or import job; do not append counters yourself.
- Use `resolveUri`, `normalizeUri` and `equivalentUris` instead of string concatenation or `new URL()` when you need RFC behaviour (strict scheme handling, no special-scheme rewriting, no host IDNA unless you ask for it).
- Every exported function has an explicit TypeScript signature; the `.d.mts` files in `dist/` are the authoritative API.

## Performance

Measured with `bun run bench` (vitest bench, Node 24, one core of a desktop CPU). Higher is better.

| input                                 | cizgile        | `@sindresorhus/slugify` | `slugify` (simov) |
| ------------------------------------- | -------------- | ----------------------- | ----------------- |
| ASCII title (60 chars)                | **396k ops/s** | 136k                    | 147k              |
| Latin with diacritics                 | **235k ops/s** | 96k                     | 179k              |
| Turkish, `locale: "tr"`               | 212k ops/s     | 99k                     | **216k**          |
| Cyrillic, `transliterate: [cyrillic]` | 179k ops/s     | 86k                     | **188k**          |
| 2.5 KB of mixed text                  | **6.4k ops/s** | 4.3k                    | 3.4k              |
| `isSlug`                              | 3.7M ops/s     | —                       | —                 |

`resolveUri` runs at ~0.8M ops/s (the built-in `URL` parser: ~0.9M), `removeDotSegments` at 2M,
`percentEncode` at 0.9M on mixed text and 3.6M on a pure-ASCII segment (`encodeURIComponent`: 3.1M and 4.7M — it is native),
`normalizeUri` at 0.37M, `iriToUri` at 0.66M.
Options objects are resolved once and cached structurally, so inline `{ locale: "tr" }` literals cost
nothing after the first call.

## How it compares

| input                       | cizgile              | Django `slugify` | Rails `parameterize` | `@sindresorhus/slugify` |
| --------------------------- | -------------------- | ---------------- | -------------------- | ----------------------- |
| `" Joel is a slug "`        | `joel-is-a-slug`     | same             | same                 | same                    |
| `"jack & jill"`             | `jack-and-jill`      | `jack-jill`      | `jack-jill`          | `jack-and-jill`         |
| `"don't"`                   | `dont`               | `dont`           | `don-t`              | `dont`                  |
| `"fooBar"`                  | `foobar`             | `foobar`         | `foobar`             | `foo-bar`               |
| `"snake_case"`              | `snake-case`         | `snake_case`     | `snake_case`         | `snake-case`            |
| `"Straße"` (`locale: "de"`) | `strasse`            | `strae`          | `strasse`            | `strasse`               |
| `"Привет"`                  | `""` (opt-in tables) | `""`             | `""`                 | `privet`                |

`decamelize` is off by default (Django/Rails behaviour) and `&` is spelled out (sindresorhus behaviour); both are one option away.

## Specifications

RFC 3986 (with errata 2033, 4547, 4789, 5428), RFC 3987, RFC 3492 (all nineteen §7.1 sample strings), RFC 8820, RFC 9844, the UTS #46 mapping step, the WHATWG URL Standard's percent-encode sets, Unicode UTS #39 restriction levels and UAX #29 grapheme boundaries, Google Search Central's URL guidance. The test suite runs every example those documents contain.

## Development

```sh
bun install
bun run test      # oxlint, oxfmt, tsc, vitest under node, then vitest under bun
bun run build     # rolldown → dist/*.mjs + dist/*.d.mts
bun run coverage
bun run release   # bumpp: bump, tag, push — the tag publishes to npm
```

## Credits

- [simov/slugify](https://github.com/simov/slugify) — the charmap + per-locale override idea and most Cyrillic, Greek, Arabic and symbol values.
- [sindresorhus/slugify](https://github.com/sindresorhus/slugify) and [sindresorhus/transliterate](https://github.com/sindresorhus/transliterate) — `decamelize`, custom replacements, the counter slugger, and the Armenian, Georgian and Dhivehi tables.
- [Django](https://github.com/django/django) and [Rails](https://github.com/rails/rails) — the reference behaviours the parity tests are written against.
- The [WHATWG URL Standard](https://url.spec.whatwg.org/) — percent-encode sets and the parser every result is cross-checked with.
- [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) by Berners-Lee, Fielding and Masinter, and [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987) by Duerst and Suignard.
- [Rolldown](https://rolldown.rs), [Oxc](https://oxc.rs), [Vitest](https://vitest.dev), [Bun](https://bun.sh) and [TypeScript](https://www.typescriptlang.org).

## License

MIT. Transliteration values are derived from simov/slugify and sindresorhus/transliterate (both MIT).
