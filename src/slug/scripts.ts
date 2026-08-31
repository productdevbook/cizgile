export type ScriptRestriction = "single" | "highly-restrictive" | "moderately-restrictive" | "any"

export interface ScriptCheck {
  readonly ok: boolean
  readonly scripts: readonly string[]
}

const SCRIPT_NAMES = [
  "Latin",
  "Cyrillic",
  "Greek",
  "Armenian",
  "Georgian",
  "Hebrew",
  "Arabic",
  "Syriac",
  "Thaana",
  "Devanagari",
  "Bengali",
  "Gurmukhi",
  "Gujarati",
  "Oriya",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Sinhala",
  "Thai",
  "Lao",
  "Tibetan",
  "Myanmar",
  "Khmer",
  "Mongolian",
  "Ethiopic",
  "Cherokee",
  "Han",
  "Hiragana",
  "Katakana",
  "Bopomofo",
  "Hangul",
] as const

const RECOMMENDED_COMBINATIONS: ReadonlyArray<ReadonlySet<string>> = [
  new Set(["Han", "Hiragana", "Katakana"]),
  new Set(["Han", "Bopomofo"]),
  new Set(["Han", "Hangul"]),
]

const EXCLUDED_WITH_LATIN = new Set(["Cyrillic", "Greek", "Cherokee"])

let matchers: ReadonlyArray<readonly [string, RegExp]> | undefined

function scriptMatchers(): ReadonlyArray<readonly [string, RegExp]> {
  matchers ??= SCRIPT_NAMES.map((name) => [name, new RegExp(`\\p{Script_Extensions=${name}}`, "u")])
  return matchers
}

function scriptsOf(ch: string): string[] {
  const out: string[] = []
  for (const [name, re] of scriptMatchers()) if (re.test(ch)) out.push(name)
  return out
}

export function detectScripts(text: string): string[] {
  const definite = new Set<string>()
  const ambiguous: string[][] = []
  for (const ch of text) {
    const scripts = scriptsOf(ch)
    if (scripts.length === 1) definite.add(scripts[0] ?? "")
    else if (scripts.length > 1) ambiguous.push(scripts)
  }
  for (const options of ambiguous) {
    if (!options.some((name) => definite.has(name))) definite.add(options[0] ?? "")
  }
  return [...definite].toSorted()
}

function allowed(scripts: readonly string[], level: ScriptRestriction): boolean {
  if (level === "any" || scripts.length <= 1) return true
  if (level === "single") return false
  const others = scripts.filter((name) => name !== "Latin")
  if (others.length === 0) return true
  const combo = new Set(others)
  const recommended = RECOMMENDED_COMBINATIONS.some((set) =>
    [...combo].every((name) => set.has(name)),
  )
  if (recommended) return true
  if (level === "highly-restrictive") return false
  return others.length === 1 && !EXCLUDED_WITH_LATIN.has(others[0] ?? "")
}

export function checkScripts(
  text: string,
  level: ScriptRestriction = "moderately-restrictive",
): ScriptCheck {
  const scripts = detectScripts(text)
  return { ok: allowed(scripts, level), scripts }
}
