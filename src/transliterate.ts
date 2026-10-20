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
export { devanagari } from "./transliterate/devanagari"
export { bengali } from "./transliterate/bengali"
export { gujarati } from "./transliterate/gujarati"
export { gurmukhi } from "./transliterate/gurmukhi"
export { kannada } from "./transliterate/kannada"
export { khmer } from "./transliterate/khmer"
export { lao } from "./transliterate/lao"
export { malayalam } from "./transliterate/malayalam"
export { myanmar } from "./transliterate/myanmar"
export { oriya } from "./transliterate/oriya"
export { sinhala } from "./transliterate/sinhala"
export { tamil } from "./transliterate/tamil"
export { telugu } from "./transliterate/telugu"
export { thai } from "./transliterate/thai"
export { dhivehi } from "./transliterate/dhivehi"
export { georgian } from "./transliterate/georgian"
export { greek } from "./transliterate/greek"
export { hangul } from "./transliterate/hangul"
export { hebrew } from "./transliterate/hebrew"
export { kana } from "./transliterate/kana"
export { latin } from "./transliterate/latin"
export { be, bg, cyrillicLocales, kk, mk, ru, sr, uk } from "./transliterate/locales-cyrillic"
export {
  bn,
  el,
  gu,
  he,
  hi,
  ja,
  km,
  kn,
  ko,
  lo,
  ml,
  my,
  or,
  otherLocales,
  pa,
  si,
  ta,
  te,
  th,
} from "./transliterate/locales-other"
export {
  az,
  ca,
  cs,
  da,
  de,
  es,
  et,
  fi,
  fr,
  hr,
  hu,
  is,
  it,
  latinLocales,
  lt,
  lv,
  nb,
  nl,
  pl,
  pt,
  ro,
  sk,
  sl,
  sv,
  tr,
  vi,
} from "./transliterate/locales-latin"
export { registeredLocale, registerLocale, unregisterLocale } from "./transliterate/registry"
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
import { devanagari } from "./transliterate/devanagari"
import { bengali } from "./transliterate/bengali"
import { gujarati } from "./transliterate/gujarati"
import { gurmukhi } from "./transliterate/gurmukhi"
import { kannada } from "./transliterate/kannada"
import { khmer } from "./transliterate/khmer"
import { lao } from "./transliterate/lao"
import { malayalam } from "./transliterate/malayalam"
import { myanmar } from "./transliterate/myanmar"
import { oriya } from "./transliterate/oriya"
import { sinhala } from "./transliterate/sinhala"
import { tamil } from "./transliterate/tamil"
import { telugu } from "./transliterate/telugu"
import { thai } from "./transliterate/thai"
import { dhivehi } from "./transliterate/dhivehi"
import { georgian } from "./transliterate/georgian"
import { greek } from "./transliterate/greek"
import { hangul } from "./transliterate/hangul"
import { hebrew } from "./transliterate/hebrew"
import { kana } from "./transliterate/kana"
import { latin } from "./transliterate/latin"
import { be, bg, kk, mk, ru, sr, uk } from "./transliterate/locales-cyrillic"
import {
  bn,
  el,
  gu,
  he,
  hi,
  ja,
  km,
  kn,
  ko,
  lo,
  ml,
  my,
  or,
  pa,
  si,
  ta,
  te,
  th,
} from "./transliterate/locales-other"
import {
  az,
  ca,
  cs,
  da,
  de,
  es,
  et,
  fi,
  fr,
  hr,
  hu,
  is,
  it,
  lt,
  lv,
  nb,
  nl,
  pl,
  pt,
  ro,
  sk,
  sl,
  sv,
  tr,
  vi,
} from "./transliterate/locales-latin"
import { symbols } from "./transliterate/symbols"
import type { Locale, LocaleId, TransliterationTable } from "./transliterate/types"

/** Every script table; pass as `tables` when the input language is unknown. */
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
  devanagari,
  bengali,
  gurmukhi,
  gujarati,
  oriya,
  tamil,
  telugu,
  kannada,
  malayalam,
  thai,
  lao,
  khmer,
  myanmar,
  sinhala,
]

/** Every locale object by id. */
export const locales: Readonly<Record<LocaleId, Locale>> = {
  az,
  be,
  bg,
  bn,
  ca,
  cs,
  da,
  de,
  el,
  es,
  et,
  fi,
  fr,
  gu,
  he,
  hi,
  hr,
  hu,
  is,
  it,
  ja,
  kk,
  km,
  kn,
  ko,
  lo,
  lt,
  lv,
  mk,
  ml,
  my,
  nb,
  nl,
  or,
  pa,
  pl,
  pt,
  ro,
  ru,
  si,
  sk,
  sl,
  sr,
  sv,
  ta,
  te,
  th,
  tr,
  uk,
  vi,
}
