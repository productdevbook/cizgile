import { escapeRegExp } from "./charset"
import { type IsSlugOptions, resolveOptions } from "./options"

let cache: WeakMap<IsSlugOptions, RegExp> | undefined

function patternFor(options: IsSlugOptions): RegExp {
  cache ??= new WeakMap()
  const cached = cache.get(options)
  if (cached !== undefined) return cached
  const o = resolveOptions(options)
  const char = `[${o.wordClass}]`
  const separator = escapeRegExp(o.separator)
  const lead = o.preserveLeadingUnderscore ? "_?" : ""
  const word = o.unicode ? `(?!\\p{M})${char}+` : `${char}+`
  const body = o.separator === "" ? word : `${word}(?:${separator}${word})*`
  const tail = o.preserveTrailingSeparator && o.separator !== "" ? `(?:${separator})?` : ""
  const pattern = new RegExp(`^${lead}${body}${tail}$`, "u")
  cache.set(options, pattern)
  return pattern
}

export function isSlug(input: string, options: IsSlugOptions = {}): boolean {
  if (typeof input !== "string" || input === "" || input === "." || input === "..") return false
  const o = resolveOptions(options)
  if (o.maxLength !== undefined && input.length > o.maxLength) return false
  if (o.separator !== "" && input.includes(o.separator + o.separator)) return false
  if (o.unicode) {
    if (input !== input.normalize("NFKC")) return false
    if (o.lowercase && input !== input.toLowerCase()) return false
  }
  return patternFor(options).test(input)
}
