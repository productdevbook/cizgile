import { greek } from "./greek"
import { hangul } from "./hangul"
import { hebrew } from "./hebrew"
import { kana } from "./kana"
import type { Locale, OtherLocaleId } from "./types"

/** Greek: the Greek table, `&` becomes `kai`. */
export const el: Locale = {
  id: "el",
  table: { "&": " kai " },
  tables: [greek],
}

/** Hebrew: the Hebrew table, `&` becomes `ve`. */
export const he: Locale = {
  id: "he",
  table: { "&": " ve " },
  tables: [hebrew],
}

/** Japanese: the kana table, `&` becomes `to`; kanji is left alone. */
export const ja: Locale = {
  id: "ja",
  table: { "&": " to " },
  tables: [kana],
}

/** Korean: the Hangul table, `&` becomes `mit`. */
export const ko: Locale = {
  id: "ko",
  table: { "&": " mit " },
  tables: [hangul],
}

/** The Greek, Hebrew, Japanese and Korean locales by id. */
export const otherLocales: Readonly<Record<OtherLocaleId, Locale>> = {
  el,
  he,
  ja,
  ko,
}
