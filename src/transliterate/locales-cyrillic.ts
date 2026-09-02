import { cyrillic, cyrillicBg, cyrillicMk, cyrillicSr, cyrillicUk } from "./cyrillic"
import type { CyrillicLocaleId, Locale } from "./types"

/** Russian: the Cyrillic table, `&` becomes `i`. */
export const ru: Locale = {
  id: "ru",
  table: { "&": " i " },
  tables: [cyrillic],
}

/** Ukrainian: the Ukrainian overlay on the Cyrillic table, `&` becomes `ta`. */
export const uk: Locale = {
  id: "uk",
  table: { "&": " ta " },
  tables: [cyrillicUk, cyrillic],
}

/** Bulgarian: the Bulgarian overlay on the Cyrillic table, `&` becomes `i`. */
export const bg: Locale = {
  id: "bg",
  table: { "&": " i " },
  tables: [cyrillicBg, cyrillic],
}

/** Macedonian: the Macedonian overlay on the Cyrillic table, `&` becomes `i`. */
export const mk: Locale = {
  id: "mk",
  table: { "&": " i " },
  tables: [cyrillicMk, cyrillic],
}

/** Serbian: the Serbian overlay on the Cyrillic table, Latin `đ` becomes `dj`, `&` becomes `i`. */
export const sr: Locale = {
  id: "sr",
  table: { Đ: "Dj", đ: "dj", "&": " i " },
  tables: [cyrillicSr, cyrillic],
}

/** Kazakh: the Cyrillic table, `&` becomes `zhane`. */
export const kk: Locale = {
  id: "kk",
  table: { "&": " zhane " },
  tables: [cyrillic],
}

/** Belarusian: the Cyrillic table, `&` becomes `i`. */
export const be: Locale = {
  id: "be",
  table: { "&": " i " },
  tables: [cyrillic],
}

/** The Cyrillic-script locales by id. */
export const cyrillicLocales: Readonly<Record<CyrillicLocaleId, Locale>> = {
  be,
  bg,
  kk,
  mk,
  ru,
  sr,
  uk,
}
