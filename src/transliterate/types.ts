/** Maps a character or character sequence to its ASCII spelling. */
export type TransliterationTable = Readonly<Record<string, string>>

/** Language rules: a table applied first, the script tables the language needs, and optionally its own lowercasing. */
export interface Locale {
  /** BCP 47 language tag such as `"de"` or `"de-CH"`. */
  readonly id: string
  /** Letter and symbol replacements specific to the language, applied before every other table. */
  readonly table: TransliterationTable
  /** Script tables the language is written in, such as `cyrillic` for Russian. */
  readonly tables?: readonly TransliterationTable[]
  /** Language-aware lowercasing for unicode slugs, such as the Turkish dotted and dotless i. */
  readonly lowercase?: (input: string) => string
}

/** Locale ids `slugify` accepts as strings; their tables ship with the main entry. */
export type LatinLocaleId =
  | "az"
  | "ca"
  | "cs"
  | "da"
  | "de"
  | "es"
  | "et"
  | "fi"
  | "fr"
  | "hr"
  | "hu"
  | "is"
  | "it"
  | "lt"
  | "lv"
  | "nb"
  | "nl"
  | "pl"
  | "pt"
  | "ro"
  | "sk"
  | "sl"
  | "sv"
  | "tr"
  | "vi"

/** Locales that carry the Cyrillic table; import the objects from `cizgile/transliterate`. */
export type CyrillicLocaleId = "be" | "bg" | "kk" | "mk" | "ru" | "sr" | "uk"

/** Locales that carry the Greek, Hebrew, kana or Hangul table; import the objects from `cizgile/transliterate`. */
export type OtherLocaleId = "el" | "he" | "hi" | "ja" | "ko"

/** Every id in the `locales` registry. */
export type LocaleId = LatinLocaleId | CyrillicLocaleId | OtherLocaleId
