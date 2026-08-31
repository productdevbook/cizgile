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

export function extractUri(text: string): string {
  let out = text.trim().replace(/^url:\s*/i, "")
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
