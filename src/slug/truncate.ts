import { isMark } from "./charset"

function isLowSurrogate(code: number | undefined): boolean {
  return code !== undefined && code >= 0xdc00 && code <= 0xdfff
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
  while (cut.length > 0) {
    const next = slug.slice(cut.length, cut.length + 2)
    const nextChar = String.fromCodePoint(next.codePointAt(0) ?? 0x20)
    if (isLowSurrogate(next.codePointAt(0)) || isMark(nextChar)) {
      cut = cut.slice(0, -1)
    } else {
      break
    }
  }
  return stripTrailingSeparator(cut, separator)
}
