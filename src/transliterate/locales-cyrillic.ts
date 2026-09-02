import { cyrillic, cyrillicBg, cyrillicMk, cyrillicSr, cyrillicUk } from "./cyrillic"
import type { CyrillicLocaleId, Locale } from "./types"

export const ru: Locale = {
  id: "ru",
  table: { "&": " i " },
  tables: [cyrillic],
}

export const uk: Locale = {
  id: "uk",
  table: { "&": " ta " },
  tables: [cyrillicUk, cyrillic],
}

export const bg: Locale = {
  id: "bg",
  table: { "&": " i " },
  tables: [cyrillicBg, cyrillic],
}

export const mk: Locale = {
  id: "mk",
  table: { "&": " i " },
  tables: [cyrillicMk, cyrillic],
}

export const sr: Locale = {
  id: "sr",
  table: { Đ: "Dj", đ: "dj", "&": " i " },
  tables: [cyrillicSr, cyrillic],
}

export const kk: Locale = {
  id: "kk",
  table: { "&": " zhane " },
  tables: [cyrillic],
}

export const be: Locale = {
  id: "be",
  table: { "&": " i " },
  tables: [cyrillic],
}

export const cyrillicLocales: Readonly<Record<CyrillicLocaleId, Locale>> = {
  be,
  bg,
  kk,
  mk,
  ru,
  sr,
  uk,
}
