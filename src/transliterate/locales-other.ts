import { greek } from "./greek"
import { hangul } from "./hangul"
import { hebrew } from "./hebrew"
import { kana } from "./kana"
import type { Locale, OtherLocaleId } from "./types"

export const el: Locale = {
  id: "el",
  table: { "&": " kai " },
  tables: [greek],
}

export const he: Locale = {
  id: "he",
  table: { "&": " ve " },
  tables: [hebrew],
}

export const ja: Locale = {
  id: "ja",
  table: { "&": " to " },
  tables: [kana],
}

export const ko: Locale = {
  id: "ko",
  table: { "&": " mit " },
  tables: [hangul],
}

export const otherLocales: Readonly<Record<OtherLocaleId, Locale>> = {
  el,
  he,
  ja,
  ko,
}
