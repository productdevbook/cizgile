export type TransliterationTable = Readonly<Record<string, string>>

export interface Locale {
  readonly id: string
  readonly table: TransliterationTable
  readonly tables?: readonly TransliterationTable[]
  readonly lowercase?: (input: string) => string
}

export type LatinLocaleId =
  | "az"
  | "da"
  | "de"
  | "es"
  | "fi"
  | "fr"
  | "hu"
  | "it"
  | "nb"
  | "nl"
  | "pt"
  | "sv"
  | "tr"
  | "vi"

export type CyrillicLocaleId = "bg" | "mk" | "ru" | "sr" | "uk"

export type LocaleId = LatinLocaleId | CyrillicLocaleId
