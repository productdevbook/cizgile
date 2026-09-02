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
export { hangul } from "./transliterate/hangul"
export { hebrew } from "./transliterate/hebrew"
export { kana } from "./transliterate/kana"
export { latin } from "./transliterate/latin"
export { bg, cyrillicLocales, mk, ru, sr, uk } from "./transliterate/locales-cyrillic"
export { el, he, ja, ko, otherLocales } from "./transliterate/locales-other"
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
  OtherLocaleId,
  TransliterationTable,
} from "./transliterate/types"

import { arabic, pashto, persian, urdu } from "./transliterate/arabic"
import { armenian } from "./transliterate/armenian"
import { cyrillic } from "./transliterate/cyrillic"
import { dhivehi } from "./transliterate/dhivehi"
import { georgian } from "./transliterate/georgian"
import { greek } from "./transliterate/greek"
import { hangul } from "./transliterate/hangul"
import { hebrew } from "./transliterate/hebrew"
import { kana } from "./transliterate/kana"
import { latin } from "./transliterate/latin"
import { bg, mk, ru, sr, uk } from "./transliterate/locales-cyrillic"
import { el, he, ja, ko } from "./transliterate/locales-other"
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
  hebrew,
  hangul,
  kana,
]

export const locales: Readonly<Record<LocaleId, Locale>> = {
  az,
  bg,
  da,
  de,
  el,
  es,
  fi,
  fr,
  he,
  hu,
  it,
  ja,
  ko,
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
