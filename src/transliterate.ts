export { arabic, pashto, persian, urdu } from "./transliterate/arabic"
export { armenian } from "./transliterate/armenian"
export {
  DEFAULT_TABLES,
  fold,
  lookup,
  resolveTables,
  stripMarks,
  transliterate,
  type TransliterateOptions,
} from "./transliterate/core"
export { cyrillic, cyrillicBg, cyrillicMk, cyrillicSr, cyrillicUk } from "./transliterate/cyrillic"
export { defineLocale, type LocaleOverrides, mergeTables } from "./transliterate/define"
export { dhivehi } from "./transliterate/dhivehi"
export { georgian } from "./transliterate/georgian"
export { greek } from "./transliterate/greek"
export { latin } from "./transliterate/latin"
export { bg, cyrillicLocales, mk, ru, sr, uk } from "./transliterate/locales-cyrillic"
export {
  az,
  da,
  de,
  es,
  fi,
  fr,
  hu,
  it,
  latinLocales,
  nb,
  nl,
  pt,
  sv,
  tr,
  vi,
} from "./transliterate/locales-latin"
export { symbols } from "./transliterate/symbols"
export type {
  CyrillicLocaleId,
  LatinLocaleId,
  Locale,
  LocaleId,
  TransliterationTable,
} from "./transliterate/types"

import { arabic, pashto, persian, urdu } from "./transliterate/arabic"
import { armenian } from "./transliterate/armenian"
import { cyrillic } from "./transliterate/cyrillic"
import { dhivehi } from "./transliterate/dhivehi"
import { georgian } from "./transliterate/georgian"
import { greek } from "./transliterate/greek"
import { latin } from "./transliterate/latin"
import { bg, mk, ru, sr, uk } from "./transliterate/locales-cyrillic"
import {
  az,
  da,
  de,
  es,
  fi,
  fr,
  hu,
  it,
  nb,
  nl,
  pt,
  sv,
  tr,
  vi,
} from "./transliterate/locales-latin"
import { symbols } from "./transliterate/symbols"
import type { Locale, LocaleId, TransliterationTable } from "./transliterate/types"

export const allScripts: readonly TransliterationTable[] = [
  latin,
  symbols,
  cyrillic,
  greek,
  arabic,
  persian,
  urdu,
  pashto,
  armenian,
  georgian,
  dhivehi,
]

export const locales: Readonly<Record<LocaleId, Locale>> = {
  az,
  bg,
  da,
  de,
  es,
  fi,
  fr,
  hu,
  it,
  mk,
  nb,
  nl,
  pt,
  ru,
  sr,
  sv,
  tr,
  uk,
  vi,
}
