export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function escapeClassChar(text: string): string {
  return text.replace(/[\]\\^-]/g, "\\$&")
}

export function stripControls(input: string): string {
  return input.replace(/[\t\n\v\f\r]/g, " ").replace(/[\p{Cc}\p{Cf}]/gu, "")
}

export function uniqueChars(text: string): string[] {
  const seen = new Set<string>()
  for (const ch of text) seen.add(ch)
  return [...seen]
}

export function isMark(ch: string): boolean {
  return /^\p{M}$/u.test(ch)
}
