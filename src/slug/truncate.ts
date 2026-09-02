let segmenter: Intl.Segmenter | null | undefined

function graphemeSegmenter(): Intl.Segmenter | undefined {
  if (segmenter === undefined) {
    segmenter =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter("und", { granularity: "grapheme" })
        : null
  }
  return segmenter ?? undefined
}

const VIRAMA =
  /[\u094D\u09CD\u0A4D\u0ACD\u0B4D\u0BCD\u0C4D\u0CCD\u0D3B\u0D3C\u0D4D\u0DCA\u0E3A\u0EBA\u0F84\u1039\u103A\u1714\u1734\u17D2\u1A60\u1B44\u1BAA\u1BAB\u1BF2\u1BF3\u2D7F\uA806\uA82C\uA8C4\uA953\uA9C0\uAAF6\uABED]/u

function isJoinerBefore(text: string, index: number): boolean {
  const previous = text.slice(0, index).at(-1)
  return previous !== undefined && (previous === "\u200D" || VIRAMA.test(previous))
}

function isClusterExtender(cp: number): boolean {
  return (
    (cp >= 0xdc00 && cp <= 0xdfff) ||
    cp === 0x200d ||
    (cp >= 0xfe00 && cp <= 0xfe0f) ||
    (cp >= 0x1f3fb && cp <= 0x1f3ff) ||
    (cp >= 0x1160 && cp <= 0x11ff) ||
    (cp >= 0xe0020 && cp <= 0xe007f) ||
    /\p{M}/u.test(String.fromCodePoint(cp))
  )
}

export interface GraphemeBoundaryOptions {
  readonly fallback?: boolean
}

export function graphemeBoundary(
  text: string,
  limit: number,
  options: GraphemeBoundaryOptions = {},
): number {
  const seg = options.fallback === true ? undefined : graphemeSegmenter()
  if (seg !== undefined) {
    let boundary = 0
    for (const { index, segment } of seg.segment(text)) {
      if (index + segment.length > limit) break
      boundary = index + segment.length
    }
    return boundary
  }
  let cut = limit
  while (cut > 0 && cut < text.length) {
    if (isJoinerBefore(text, cut) || isClusterExtender(text.codePointAt(cut) ?? 0)) {
      cut -= 1
    } else {
      break
    }
  }
  return cut
}

function stripTrailingSeparator(text: string, separator: string): string {
  let out = text
  if (separator === "") return out
  while (out.endsWith(separator)) out = out.slice(0, -separator.length)
  for (let k = separator.length - 1; k > 0; k--) {
    if (out.endsWith(separator.slice(0, k))) return out.slice(0, -k)
  }
  return out
}

/** Cuts `slug` to at most `maxLength` UTF-16 code units at a `separator` boundary, never inside a grapheme cluster. */
export function truncateSlug(slug: string, maxLength: number, separator = "-"): string {
  if (!Number.isInteger(maxLength) || maxLength < 0) {
    throw new RangeError("truncateSlug: maxLength must be a non-negative integer")
  }
  if (slug.length <= maxLength) return slug
  if (maxLength === 0) return ""
  let cut = slug.slice(0, maxLength)
  if (separator !== "" && !slug.startsWith(separator, maxLength)) {
    const last = cut.lastIndexOf(separator)
    if (last > 0) cut = cut.slice(0, last)
  }
  cut = slug.slice(0, graphemeBoundary(slug, cut.length))
  return stripTrailingSeparator(cut, separator)
}
