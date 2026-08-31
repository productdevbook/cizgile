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
    if (text.codePointAt(cut - 1) === 0x200d || isClusterExtender(text.codePointAt(cut) ?? 0)) {
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
