const RTL =
  /\p{Script=Hebrew}|\p{Script=Arabic}|\p{Script=Syriac}|\p{Script=Thaana}|\p{Script=Nko}|\p{Script=Samaritan}|\p{Script=Mandaic}|\p{Script=Adlam}/u
const LETTER = /\p{L}/u
const MARK = /\p{M}/u

function isRtl(ch: string): boolean {
  return RTL.test(ch) && LETTER.test(ch)
}

function isLtr(ch: string): boolean {
  return LETTER.test(ch) && !RTL.test(ch)
}

export function isBidiSafeComponent(text: string): boolean {
  let hasRtl = false
  let hasLtr = false
  let first: string | undefined
  let last: string | undefined
  for (const ch of text) {
    if (isRtl(ch)) hasRtl = true
    else if (isLtr(ch)) hasLtr = true
    if (MARK.test(ch)) continue
    first ??= ch
    last = ch
  }
  if (!hasRtl) return true
  if (hasLtr) return false
  return first !== undefined && last !== undefined && isRtl(first) && isRtl(last)
}
