<p align="center">
  <br>
  <img src=".github/assets/cover.svg?v=1a3fd12" alt="cizgile — Zero-dependency URL slug engine" width="100%">
  <br><br>
  <b style="font-size: 2em;">cizgile</b>
  <br><br>
  Zero-dependency URL slug engine.
  <br>
  RFC 3986/3987 slugs, transliteration for seven scripts, Unicode slugs, IRI ↔ URI, percent-encoding, dot-segment removal, reference resolution. Pure TypeScript, works everywhere.
  <br><br>
  <a href="https://npmjs.com/package/cizgile"><img src="https://img.shields.io/npm/v/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="npm version"></a>
  <a href="https://npmjs.com/package/cizgile"><img src="https://img.shields.io/npm/dm/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/result?p=cizgile"><img src="https://img.shields.io/bundlephobia/minzip/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="bundle size"></a>
  <a href="https://github.com/productdevbook/cizgile/blob/main/LICENSE"><img src="https://img.shields.io/github/license/productdevbook/cizgile?style=flat&colorA=18181B&colorB=34d399" alt="license"></a>
</p>

## Quick Start

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

Three entry points, each importable on its own:

| entry                   | what it holds                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `cizgile`               | `slugify`, `isSlug`, `truncateSlug`, `createSlugger`, `decamelize`                                            |
| `cizgile/uri`           | RFC 3986 character classes, percent-encoding, `removeDotSegments`, `resolveUri`, `normalizeUri`, RFC 3987 IRI |
| `cizgile/transliterate` | script tables, locales, `transliterate`, `defineLocale`                                                       |

`import { slugify } from "cizgile"` bundles the Latin table and symbols only; Cyrillic, Greek, Arabic,
Armenian, Georgian and Dhivehi are opt-in and tree-shake away when unused.

## `slugify(input, options?)`

Every option, with its default:

| option                      | default   | meaning                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `separator`                 | `"-"`     | Any string of RFC 3986 unreserved / sub-delims / `@` characters that are not letters or digits (`-` `_` `.` `~` `!` `$` `&` `'` `(` `)` `*` `+` `,` `;` `=` `@`); `""` joins words. Anything else — `/ ? # % : [ ]`, non-ASCII — throws, so every slug stays a single `segment-nz-nc`.                                              |
| `lowercase`                 | `true`    | `false` keeps case (`"Donald E. Knuth"` → `Donald-E-Knuth`).                                                                                                                                                                                                                                                                        |
| `unicode`                   | `false`   | `true` keeps every letter, digit and combining mark (Django `allow_unicode`), output in NFKC.                                                                                                                                                                                                                                       |
| `locale`                    | —         | `"az" "da" "de" "es" "fi" "fr" "hu" "it" "nb" "nl" "pt" "sv" "tr" "vi"`, or a `Locale` object (Cyrillic locales live in `cizgile/transliterate`).                                                                                                                                                                                   |
| `transliterate`             | `true`    | `false` skips the tables (diacritics still fold); an array of tables is consulted before the Latin defaults.                                                                                                                                                                                                                        |
| `decamelize`                | `false`   | `fooBar` → `foo-bar`, `HTMLParser` → `html-parser`, `APIs` stays.                                                                                                                                                                                                                                                                   |
| `replacements`              | `[]`      | Literal `[from, to]` pairs applied first; surrounding spaces become separators (`["&", " and "]`).                                                                                                                                                                                                                                  |
| `remove`                    | `/['’]/g` | Global regex stripped after transliteration (`don't` → `dont`); `false` to keep.                                                                                                                                                                                                                                                    |
| `preserveCharacters`        | `[]`      | Extra single characters allowed in the output (`["."]` keeps `v1.2.3`); same character rule as `separator`, and may not contain the separator. A result that would be the dot-segment `.` or `..` becomes `""`.                                                                                                                     |
| `preserveLeadingUnderscore` | `false`   | `_foo bar` → `_foo-bar`.                                                                                                                                                                                                                                                                                                            |
| `preserveTrailingSeparator` | `false`   | `foo bar-` → `foo-bar-` (useful while typing into an input).                                                                                                                                                                                                                                                                        |
| `maxLength`                 | —         | Limit in UTF-16 code units (what `String#length` counts — the percent-encoded wire form can be up to 3× longer per unit). Cuts at the last separator inside the limit, never mid-word unless there is no separator, and never inside a grapheme cluster (surrogate pairs, combining marks, ZWJ emoji, skin tones, conjoining jamo). |

The pipeline, in order — the order is what makes the edge cases come out right:

1. control and format characters are dropped (tabs/newlines become spaces; ZWSP, soft hyphen, BOM, bidi marks vanish)
2. NFC, then `replacements`
3. compatibility symbols the tables know (`µ`, `™`, `№`) are mapped, then NFKC (`ﬁ` → `fi`, `①` → `1`)
4. `decamelize`
5. transliteration: locale table → locale scripts → your tables → Latin → symbols → strip combining marks
6. lowercase (`İ` → `i`; Turkish/Azerbaijani locales use `toLocaleLowerCase("tr")` in unicode mode)
7. `remove`
8. in ASCII mode, letters no table could map are dropped (Django behaviour: `Straße` with `transliterate: false` → `strae`); runs of anything else become one separator; separators collapse and are trimmed
9. `maxLength`

Output in ASCII mode always matches `^[a-z0-9]+(-[a-z0-9]+)*$` (with the default separator) and is a
valid RFC 3986 `segment-nz-nc`, so it needs no percent-encoding. `slugify` is idempotent:
`slugify(slugify(x)) === slugify(x)`.

### Locales

Locale ids resolve to objects from `cizgile/transliterate`; you can pass those objects directly or
build your own without mutating anything global:

```ts
import { slugify } from "cizgile"
import { de, defineLocale, uk } from "cizgile/transliterate"

slugify("Київ Ґудзик", { locale: uk }) // "kyiv-gudzyk"
slugify("Fisch & Chips", { locale: de }) // "fisch-und-chips"

const swiss = defineLocale(de, { id: "de-CH", table: { ß: "ss" } })
slugify("Straße", { locale: swiss }) // "strasse"
slugify("x & y", { locale: { id: "mine", table: { "&": " plus " } } }) // "x-plus-y"
```

Non-Latin scripts without a locale:

```ts
import { cyrillic, greek } from "cizgile/transliterate"

slugify("Привет мир", { transliterate: [cyrillic] }) // "privet-mir"
slugify("Καλημέρα κόσμε", { transliterate: [greek] }) // "kalimera-kosme"
slugify("Привет мир") // "" — nothing to keep in ASCII mode
```

### Unicode slugs

```ts
import { slugify } from "cizgile"
import { iriToUri, uriToIri } from "cizgile/uri"

const slug = slugify("Ünïcödé ﬁnal ①", { unicode: true }) // "ünïcödé-final-1"
const uri = iriToUri(slug) // "%C3%BCn%C3%AFc%C3%B6d%C3%A9-final-1"
uriToIri(uri) === slug // true
```

`unicode: true` keeps `\p{L}\p{N}\p{M}`, normalises to NFKC, removes bidi controls and never starts a
word with a combining mark, so `iriToUri` gives you the wire form Google asks for (UTF-8
percent-encoded) and `uriToIri` gets the slug back byte-for-byte.

Two opt-in guards for user-supplied Unicode titles:

- `scripts: "single" | "highly-restrictive" | "moderately-restrictive" | "any"` (default `"any"`) — the
  UTS #39 §5.1 restriction levels. `"single"` requires one script; `"highly-restrictive"` also allows Latin
  with Japanese (Han + Hiragana + Katakana), Chinese (Han + Bopomofo) or Korean (Han + Hangul);
  `"moderately-restrictive"` additionally allows Latin with any one other script except Cyrillic, Greek
  and Cherokee. A violating slug throws `RangeError`; `checkScripts(text, level)` and `detectScripts(text)`
  are exported for inspection. `slugify("pаypal", { unicode: true, scripts: "single" })` (Cyrillic `а`)
  throws instead of producing a look-alike of `paypal` (RFC 3987 §6.1, §7.5, §8).
- `bidi: "allow" | "encode" | "throw"` (default `"allow"`) — RFC 3987 §4.2: a component should not mix
  left-to-right and right-to-left characters and, when right-to-left, should start and end with them.
  `"encode"` percent-encodes the whole slug (the RFC's own escape hatch), `"throw"` raises.
  `isBidiSafeComponent(text)` is exported.

### `isSlug(value, options?)`

`true` when `value` is exactly what `slugify` would have produced under the same `separator`,
`lowercase`, `unicode`, `preserveCharacters`, `preserveLeadingUnderscore`, `preserveTrailingSeparator`,
`maxLength`, `scripts` and `bidi`. Empty strings, the dot-segments `.` and `..`, leading/trailing/doubled separators, wrong
case and non-NFKC input are rejected.

### `createSlugger(defaults?)`

Unique slugs for a document: `foo`, `foo-2`, `foo-3`. Uniqueness is guaranteed even when a suffixed
form arrives on its own (`foo-2` after `foo-2` becomes `foo-2-2`), results stay within `maxLength`
(`foobar`, `foob-2`), the empty slug is never counted. `reset()`, `has(slug)`, `reserve(slug)`.
`slugifyWithCounter` is an alias.

### `truncateSlug(slug, maxLength, separator = "-")`

The truncation step on its own: `truncateSlug("hello-world", 8)` → `hello`. Grapheme boundaries come from
`Intl.Segmenter` when the runtime has it (Node ≥ 16, Bun, evergreen browsers) with a code-point heuristic as
fallback.

## `cizgile/uri`

Everything here follows RFC 3986 to the letter and is checked against its test vectors (§5.4 normal
and abnormal references, §6.2 normalisation) and, where both apply, against the WHATWG `URL` parser.

| function                                                                                                           | RFC                        | notes                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isUnreserved` `isReserved` `isGenDelim` `isSubDelim` `isPchar` `isSegmentNzNc` `isQueryChar`                      | 3986 §2, §3.3–3.5          | per code point                                                                                                                                                                                                                                                                                                                                                               |
| `percentEncode(text, keep?)`                                                                                       | §2.1, §2.5                 | UTF-8, uppercase hex. `keep` is a set name — RFC 3986: `"unreserved" "pchar" "segment-nz-nc" "path" "query" "fragment" "userinfo"`; WHATWG: `"whatwg-c0-control" "whatwg-fragment" "whatwg-query" "whatwg-special-query" "whatwg-path" "whatwg-userinfo" "whatwg-component" "form"` — or a predicate. `%` is always encoded — input is text.                                 |
| `percentDecode(text, { plusAsSpace })`                                                                             | §2.1                       | malformed `%` left alone, bad UTF-8 → U+FFFD                                                                                                                                                                                                                                                                                                                                 |
| `normalizePercentEncoding`                                                                                         | §6.2.2.1–2                 | uppercase hex, decode unreserved only                                                                                                                                                                                                                                                                                                                                        |
| `encodePathSegment(seg, { noColon })` `encodePath(path, { relative })` `encodeQuery` `encodeFragment` `encodeForm` | §3.3–3.5, §4.2             | `noColon` / `relative` give `segment-nz-nc` for the first segment of a relative-path reference                                                                                                                                                                                                                                                                               |
| `removeDotSegments(path)`                                                                                          | §5.2.4                     | the literal two-buffer algorithm; `..` above the root is discarded (erratum 4547, same as WHATWG)                                                                                                                                                                                                                                                                            |
| `normalizePath(path, { trailingSlash })`                                                                           | §6.2.2                     | dot segments are removed from absolute paths only; a relative path keeps its `..`                                                                                                                                                                                                                                                                                            |
| `parseUri` / `serializeUri`                                                                                        | Appendix B, §5.3           | a scheme must match the §3.1 ABNF (`1:2` is a relative reference); the serializer inserts `/.` or `./` where §3 / §4.2 require it so its output always re-parses to the same components                                                                                                                                                                                      |
| `resolveUri(base, ref, { strict, allowRelativeBase })`                                                             | §5.1, §5.2                 | strict by default (`http:g` → `http:g`; `strict: false` gives `http://a/b/c/g`); the base must be an absolute-URI — its fragment is ignored — unless `allowRelativeBase` is set; the base path is dot-normalised first (erratum 4789)                                                                                                                                        |
| `normalizeUri(uri, { defaultPorts, schemeBased, userinfo })`                                                       | §6.2.2, §6.2.3             | lowercase scheme and ASCII host letters (RFC 3987 §5.3.2.1 — non-ASCII host characters are left alone), uppercase hex, dot segments, default ports (`http 80` … `ftp 21`), empty path → `/` for any scheme with an authority; `schemeBased: false` stops at §6.2.2; `userinfo: "strip-password" \| "strip"` for logs and storage (§7.5)                                      |
| `isIPv4Address` `isIPv6Address` `isIPvFuture` `isIPLiteral` `isRegName` `isHost` `parseHost`                       | §3.2.2, §7.4, Appendix A   | the full `IPv6address` ABNF (all nine forms, `ls32` with an IPv4 tail); `0x7f.0.0.1` and `2130706433` are reg-names, not addresses                                                                                                                                                                                                                                           |
| `isUriReference` `isUri` `isAbsoluteUri` `isRelativeReference` `classifyReference` `pathForm`                      | §3.3, §4.1–4.3, Appendix A | validating parser built on the ABNF: `1:2` and `this:that` are not relative references, `http://a b/` is nothing                                                                                                                                                                                                                                                             |
| `isIriReference` `isIri`                                                                                           | 3987 §2.2                  | same, with `ucschar` allowed and `iprivate` allowed in the query                                                                                                                                                                                                                                                                                                             |
| `isSameDocumentReference(base, ref, { normalize })`                                                                | §4.4                       | `#s`, `""`, `?q` against `http://a/b?q`                                                                                                                                                                                                                                                                                                                                      |
| `equivalentUris(a, b, { level, base, ignoreFragment, defaultPorts })`                                              | §6.1, §6.2; 3987 §5.3.1    | the comparison ladder — `simple`, `syntax` (§6.2.2), `scheme` (§6.2.3, default); never maps IRIs to URIs                                                                                                                                                                                                                                                                     |
| `relativize(base, target)`                                                                                         | §5.2 (inverse)             | shortest reference that resolves back to `target`: `g`, `../g`, `?y`, `#s`, `//g/`, `./this:that`; a different scheme returns `target` unchanged                                                                                                                                                                                                                             |
| `punycodeEncode` `punycodeDecode` `domainToAscii` `domainToUnicode`                                                | RFC 3492, RFC 3986 §3.2.2  | zero-dependency Punycode; `domainToAscii` lowercases and NFC-normalises non-ASCII labels (no full UTS #46 mapping)                                                                                                                                                                                                                                                           |
| `extractUri(text)`                                                                                                 | Appendix C                 | strips `<>`, quotes, `URL:` prefixes, trailing punctuation and line-wrap whitespace                                                                                                                                                                                                                                                                                          |
| `isUcschar` `isIprivate` `isIunreserved` `isIpchar` `isBidiControl` `hasBidiControls`                              | 3987 §2.2, §4.1            | bidi controls are the Unicode `Bidi_Control` set (the RFC list plus U+061C and U+2066–2069)                                                                                                                                                                                                                                                                                  |
| `iriToUri(iri, { bidi, nfc, strict, host })`                                                                       | 3987 §3.1                  | UTF-8 percent-encoding without touching the characters (§3.1 step 1c); `nfc: true` for text from non-Unicode sources; `strict: true` throws on characters no IRI may contain; `host: "punycode"` converts an `ireg-name` to IDNA form (`例え.jp` → `xn--r8jz45g.jp`) so browsers and HTTP clients accept it; bidi formatting characters throw (`bidi: "strip"` removes them) |
| `uriToIri(uri)`                                                                                                    | 3987 §3.2                  | decodes well-formed UTF-8 `ucschar` and percent-encoded unreserved ASCII; `iprivate` only inside the query; reserved, bidi controls and everything else stay encoded                                                                                                                                                                                                         |

```ts
import { normalizeUri, percentEncode, removeDotSegments, resolveUri } from "cizgile/uri"

removeDotSegments("/a/b/c/./../../g") // "/a/g"
resolveUri("http://a/b/c/d;p?q", "../../g") // "http://a/g"
normalizeUri("HTTP://www.EXAMPLE.com:80/%7e%41/./b/../c") // "http://www.example.com/~A/c"
percentEncode("À ア", "pchar") // "%C3%80%20%E3%82%A2"
```

Not implemented on purpose: RFC 6874 IPv6 zone identifiers (`[fe80::a%25en1]`) — RFC 9844 reverted
that change to the URI syntax.

## `cizgile/transliterate`

```ts
import { transliterate, cyrillic, greek, latin, symbols, locales } from "cizgile/transliterate"

transliterate("Straße Ærø") // "Strasse AEro"
transliterate("Привет", { tables: [cyrillic] }) // "Privet"
transliterate("Привет") // "Привет"  — unknown scripts are kept
transliterate("Привет", { unknown: "drop" }) // ""
transliterate("Ängsö", { locale: locales.sv }) // "Aengsoe"
```

Tables: `latin` `symbols` `cyrillic` `cyrillicUk` `cyrillicBg` `cyrillicMk` `cyrillicSr` `greek`
`arabic` `persian` `urdu` `pashto` `armenian` `georgian` `dhivehi`, plus `allScripts`. Locales:
`az bg da de es fi fr hu it mk nb nl pt ru sr sv tr uk vi` and the `locales` map. Lookup order is
locale table → locale scripts → your tables → Latin → symbols → decompose and strip marks. Table keys
are single NFC code points; a few multi-character keys (Armenian `ու`) are matched longest-first.
Where a script spells a letter differently at the start of a word (Armenian `ե`/`ո`, Ukrainian
`є ї й ю я`), the capital carries the word-initial form and the lowercase the medial one.
`defineLocale(base, overrides)` and `mergeTables(...tables)` return new objects; nothing is mutated.

## How it compares

| input                       | cizgile              | Django `slugify` | Rails `parameterize` | `@sindresorhus/slugify` |
| --------------------------- | -------------------- | ---------------- | -------------------- | ----------------------- |
| `" Joel is a slug "`        | `joel-is-a-slug`     | same             | same                 | same                    |
| `"jack & jill"`             | `jack-and-jill`      | `jack-jill`      | `jack-jill`          | `jack-and-jill`         |
| `"don't"`                   | `dont`               | `dont`           | `don-t`              | `dont`                  |
| `"fooBar"`                  | `foobar`             | `foobar`         | `foobar`             | `foo-bar`               |
| `"^très\|Jolie-- "`         | `tres-jolie`         | `tres-jolie`     | `tres-jolie`         | `tres-jolie`            |
| `"Straße"` (`locale: "de"`) | `strasse`            | `strae`          | `strasse`            | `strasse`               |
| `"5µm"`                     | `5-u-m`              | `5m`             | `5-m`                | `5-m`                   |
| `"Привет"`                  | `""` (opt-in tables) | `""`             | `""`                 | `privet`                |
| `"snake_case"`              | `snake-case`         | `snake_case`     | `snake_case`         | `snake-case`            |

`decamelize` is off by default (Django/Rails behaviour) and `&` is spelled out (sindresorhus
behaviour); both are one option away.

## Spec coverage

RFC 3986 (with errata 2033, 4547, 5428), RFC 3987, RFC 8820 (informational; no fixed prefixes are
imposed), RFC 6874 → RFC 9844 (zone ids intentionally unsupported), WHATWG URL percent-encode sets,
Google Search Central URL structure guidance. Out of scope: CJK, Hebrew, Devanagari, Thai and Hangul
transliteration — those scripts are kept in `unicode: true` and dropped in ASCII mode.

## Development

```sh
bun install
bun run test      # oxlint --type-aware, oxfmt --check, tsc --noEmit, vitest under node, then vitest under bun
bun run test:bun  # the suite on the Bun runtime only
bun run build     # rolldown → dist/*.mjs + dist/*.d.mts
bun run coverage
bun run release   # test + build, then bumpp --commit --tag --push --all; the v* tag triggers the npm publish workflow
```

Node ≥ 20.19 or any runtime with `String.prototype.normalize` and Unicode property escapes.

## Credits

cizgile stands on the shoulders of people who solved pieces of this problem first:

- [simov/slugify](https://github.com/simov/slugify) — the charmap + per-locale override idea, and most of the Cyrillic, Greek, Arabic and symbol values.
- [sindresorhus/slugify](https://github.com/sindresorhus/slugify) and [sindresorhus/transliterate](https://github.com/sindresorhus/transliterate) — `decamelize`, `customReplacements`, the counter slugger, and the Armenian, Georgian, Vietnamese and Dhivehi tables.
- [Django](https://github.com/django/django) `django.utils.text.slugify` and [Rails](https://github.com/rails/rails) `ActiveSupport::Inflector#parameterize` — the reference behaviours the parity tests are written against.
- [WHATWG URL Standard](https://url.spec.whatwg.org/) — the percent-encode sets and the parser every `cizgile/uri` result is cross-checked with.
- [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) by Berners-Lee, Fielding and Masinter, and [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987) by Duerst and Suignard — the specifications this library exists to implement faithfully.
- [Rolldown](https://rolldown.rs), [Oxc](https://oxc.rs), [Vitest](https://vitest.dev), [Bun](https://bun.sh) and [TypeScript](https://www.typescriptlang.org) — the toolchain.

## License

MIT. Transliteration values are derived from simov/slugify and sindresorhus/transliterate (both MIT).
