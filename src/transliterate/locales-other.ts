import { bengali } from "./bengali"
import { devanagari } from "./devanagari"
import { gujarati } from "./gujarati"
import { gurmukhi } from "./gurmukhi"
import { kannada } from "./kannada"
import { malayalam } from "./malayalam"
import { oriya } from "./oriya"
import { tamil } from "./tamil"
import { telugu } from "./telugu"
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

/** Hindi: the Devanagari table, `&` becomes `aur`. */
export const hi: Locale = {
  id: "hi",
  table: { "%": " pratishat ", $: " dollar ", "£": " pound ", "&": " aur " },
  tables: [devanagari],
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

/** Bengali: the bengali table, `&` becomes `ebong`. */
export const bn: Locale = {
  id: "bn",
  table: { "&": " ebong " },
  tables: [bengali],
}

/** Punjabi: the gurmukhi table, `&` becomes `ate`. */
export const pa: Locale = {
  id: "pa",
  table: { "&": " ate " },
  tables: [gurmukhi],
}

/** Gujarati: the gujarati table, `&` becomes `ane`. */
export const gu: Locale = {
  id: "gu",
  table: { "&": " ane " },
  tables: [gujarati],
}

/** Odia: the oriya table, `&` becomes `o`. */
export const or: Locale = {
  id: "or",
  table: { "&": " o " },
  tables: [oriya],
}

/** Tamil: the tamil table, `&` becomes `matrum`. */
export const ta: Locale = {
  id: "ta",
  table: { "&": " matrum " },
  tables: [tamil],
}

/** Telugu: the telugu table, `&` becomes `mariyu`. */
export const te: Locale = {
  id: "te",
  table: { "&": " mariyu " },
  tables: [telugu],
}

/** Kannada: the kannada table, `&` becomes `mattu`. */
export const kn: Locale = {
  id: "kn",
  table: { "&": " mattu " },
  tables: [kannada],
}

/** Malayalam: the malayalam table, `&` becomes `um`. */
export const ml: Locale = {
  id: "ml",
  table: { "&": " um " },
  tables: [malayalam],
}

/** The locales that carry a non-Latin, non-Cyrillic script table, by id. */
export const otherLocales: Readonly<Record<OtherLocaleId, Locale>> = {
  bn,
  el,
  gu,
  he,
  hi,
  ja,
  kn,
  ko,
  ml,
  or,
  pa,
  ta,
  te,
}
