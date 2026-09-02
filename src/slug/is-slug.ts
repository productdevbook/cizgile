import { isBidiSafeComponent } from "./bidi"
import { escapeRegExp } from "./charset"
import { checkScripts } from "./scripts"
import { type IsSlugOptions, lowercaseOf, resolveOptions } from "./options"

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

const DEFAULT_OPTIONS: IsSlugOptions = {}

export function isSlug(input: string, options: IsSlugOptions = DEFAULT_OPTIONS): boolean {
  if (typeof input !== "string" || input === "" || input === "." || input === "..") return false
  const o = resolveOptions(options)
  if (o.maxLength !== undefined && input.length > o.maxLength) return false
  if (o.separator !== "" && input.includes(o.separator + o.separator)) return false
  if (o.unicode) {
    if (input !== input.normalize("NFKC")) return false
    if (o.lowercase && input !== lowercaseOf(input, o)) return false
    if (o.scripts !== "any" && !checkScripts(input, o.scripts).ok) return false
    if (o.bidi !== "allow" && !isBidiSafeComponent(input)) return false
  }
  return patternFor(options).test(input)
}
