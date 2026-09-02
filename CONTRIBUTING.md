# Contributing

Thanks for helping. This is a small library with a large test suite; most of the work of a change is keeping the guarantees below true.

## Setup

```sh
bun install
bun run test      # oxlint, oxfmt, tsc, vitest under node, then vitest under bun
bun run coverage  # the thresholds in vitest.config.ts are enforced in CI
bun run build     # rolldown → dist/*.mjs + dist/*.d.mts
bun run bench     # vitest bench against @sindresorhus/slugify and simov/slugify
```

Node 20 or newer and Bun 1.4 are what CI runs.

## What a pull request must keep green

- `test/ratchet.test.ts` reads the source tree and enforces the rules that keep the package what it is: no runtime dependencies, no host runtime APIs, script tables that are plain object literals, the main entry never reaching a non-Latin table, every public export documented with a JSDoc line at its declaration.
- `test/treeshake.test.ts` bundles each entry with rolldown and checks both what ends up in the bundle and how many bytes it is. If a change needs more room, raise the budget in the same pull request and say why.
- `test/properties.test.ts` runs the slugify invariants (idempotence, `isSlug` accepts the output, every ASCII slug is an RFC 3986 `segment-nz-nc`) over a corpus and seeded random input.
- `test/parity.test.ts` compares against Django, Rails, `@sindresorhus/slugify` and `simov/slugify`; a deliberate divergence is listed there, not hidden.

## Conventions

- A behaviour claim cites its source: an RFC section (`RFC 3986 §5.2.4`), a WHATWG URL Standard section, a UTS number. Tests carry the same citation in their `describe` text so the suite can be read as a checklist of the specifications.
- Transliteration tables are data: one file per script, `export const name: TransliterationTable = { ... }`, keys in NFC, ASCII values, no imports other than the type.
- Comments explain what the code cannot: a constraint that reads as wrong until explained, an outside system's odd behaviour, why a choice was made. Everything else goes in the commit message.
- Commit messages say what changed and why; measurements belong there, not in the code.

## Reporting a specification gap

Open an issue with the RFC or standard section, the input, the current output, and the output the text requires. The issue templates have fields for each.

## Release

Maintainers run `bun run release`, which runs the suite, builds, bumps the version, tags and pushes. The tag triggers `.github/workflows/release.yml`, which publishes to npm with provenance and writes the GitHub release notes.
