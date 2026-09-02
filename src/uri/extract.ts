const WRAPPERS: ReadonlyArray<readonly [string, string]> = [
  ["<", ">"],
  ['"', '"'],
  ["'", "'"],
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
]

const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/
const LEADING_PUNCTUATION = /^[(<["'{]+/
const MARKDOWN_LINK = /^\[[^\]]*\]\(\s*(?:<([^>]*)>|([^)\s]+))(?:\s+["'][^"']*["'])?\s*\)$/
const HTML_ATTRIBUTE = /\b(?:href|src|action|content)\s*=\s*(["'])(.*?)\1/i

/** A URI found in prose by `findUris`, with its offsets in the text. */
export interface FoundUri {
  readonly uri: string
  readonly start: number
  readonly end: number
}

const IN_PROSE =
  /\b(?:[A-Za-z][A-Za-z0-9+.-]*:\/\/|(?:mailto|tel|urn|data|sms|geo|magnet|xmpp|sip|sips):|www\.)[^\s<>"']+/g

/** Finds the URIs in ordinary text: anything with `scheme://`, a `www.` host, or a `mailto:`, `tel:`, `urn:`, `data:` style scheme, ending at whitespace or a quote and trimmed of trailing punctuation the way `extractUri` does. */
export function findUris(text: string): FoundUri[] {
  const out: FoundUri[] = []
  for (const match of text.matchAll(IN_PROSE)) {
    const uri = trimTrailing(match[0])
    if (uri === "" || (uri.startsWith("www.") && !uri.includes(".", 4))) continue
    out.push({ uri, start: match.index, end: match.index + uri.length })
  }
  return out
}

/** RFC 3986 Appendix C: recovers a URI from text that wraps it in `<>`, quotes or brackets, prefixes it with `URL:`, breaks it across lines or ends it with punctuation. Markdown links and `href`/`src` attributes yield their URL. */
export function extractUri(text: string): string {
  let out = text.trim().replace(/^url:\s*/i, "")
  const markdown = MARKDOWN_LINK.exec(out)
  if (markdown !== null) return extractUri(markdown[1] ?? markdown[2] ?? "")
  const attribute = HTML_ATTRIBUTE.exec(out)
  if (attribute !== null) return extractUri(attribute[2] ?? "")
  let wrapped = true
  while (wrapped) {
    wrapped = false
    for (const [open, close] of WRAPPERS) {
      if (out.length >= 2 && out.startsWith(open) && out.endsWith(close)) {
        out = out.slice(open.length, -close.length).trim()
        wrapped = true
      }
    }
    for (const [open, close] of WRAPPERS) {
      const closeAt = out.lastIndexOf(close)
      if (out.startsWith(open) && closeAt !== -1 && open !== close) {
        out = out.slice(open.length, closeAt).trim()
        wrapped = true
        break
      }
    }
  }
  out = out.replace(LEADING_PUNCTUATION, "")
  out = out.replace(/\s+/g, "")
  return trimTrailing(out)
}

function trimTrailing(text: string): string {
  let out = text
  let trimmed = true
  while (trimmed) {
    trimmed = false
    const before = out
    out = out.replace(TRAILING_PUNCTUATION, "")
    for (const [open, close] of WRAPPERS) {
      if (open !== close && out.endsWith(close) && count(out, open) < count(out, close)) {
        out = out.slice(0, -close.length)
      }
    }
    if (out !== before) trimmed = true
  }
  return out
}

function count(text: string, char: string): number {
  return text.split(char).length - 1
}
