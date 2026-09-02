export type TransliterationTable = Readonly<Record<string, string>>

export interface Locale {
  readonly id: string
  readonly table: TransliterationTable
  readonly tables?: readonly TransliterationTable[]
  readonly lowercase?: (input: string) => string
}

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

export type CyrillicLocaleId = "be" | "bg" | "kk" | "mk" | "ru" | "sr" | "uk"

export type OtherLocaleId = "el" | "he" | "ja" | "ko"

export type LocaleId = LatinLocaleId | CyrillicLocaleId | OtherLocaleId
