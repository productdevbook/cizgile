import type { LatinLocaleId, Locale } from "./types"

function turkishLowercase(input: string): string {
  return input.toLocaleLowerCase("tr")
}

/** German: `ä ö ü` become `ae oe ue`, `ß` becomes `ss`, `&` becomes `und`. */
export const de: Locale = {
  id: "de",
  table: {
    Ä: "Ae",
    ä: "ae",
    Ö: "Oe",
    ö: "oe",
    Ü: "Ue",
    ü: "ue",
    ß: "ss",
    ẞ: "SS",
    "&": " und ",
  },
}

/** Turkish: dotted and dotless i, `ğ ş ç ö ü` stripped, `&` becomes `ve`; lowercases with the Turkish rules. */
export const tr: Locale = {
  id: "tr",
  table: {
    ı: "i",
    İ: "I",
    Ğ: "G",
    ğ: "g",
    Ş: "S",
    ş: "s",
    Ç: "C",
    ç: "c",
    Ö: "O",
    ö: "o",
    Ü: "U",
    ü: "u",
    "&": " ve ",
  },
  lowercase: turkishLowercase,
}

/** Azerbaijani: the Turkish letters plus `ə`, `&` becomes `ve`. */
export const az: Locale = {
  id: "az",
  table: {
    ı: "i",
    İ: "I",
    Ğ: "G",
    ğ: "g",
    Ş: "S",
    ş: "s",
    Ç: "C",
    ç: "c",
    Ö: "O",
    ö: "o",
    Ü: "U",
    ü: "u",
    Ə: "E",
    ə: "e",
    "&": " ve ",
  },
  lowercase: turkishLowercase,
}

/** Danish: `ø å æ` become `oe aa ae`, `&` becomes `og`. */
export const da: Locale = {
  id: "da",
  table: {
    Ø: "Oe",
    ø: "oe",
    Å: "Aa",
    å: "aa",
    Æ: "Ae",
    æ: "ae",
    "&": " og ",
  },
}

/** Norwegian Bokmål: `ø å æ` become `oe aa ae`, `&` becomes `og`. */
export const nb: Locale = {
  id: "nb",
  table: {
    Ø: "Oe",
    ø: "oe",
    Å: "Aa",
    å: "aa",
    Æ: "Ae",
    æ: "ae",
    "&": " og ",
  },
}

/** Swedish: `ä ö å` become `ae oe aa`, `&` becomes `och`. */
export const sv: Locale = {
  id: "sv",
  table: {
    Ä: "Ae",
    ä: "ae",
    Ö: "Oe",
    ö: "oe",
    Å: "Aa",
    å: "aa",
    "&": " och ",
  },
}

/** Finnish: `ä ö å` become `ae oe aa`, `&` becomes `ja`. */
export const fi: Locale = {
  id: "fi",
  table: {
    Ä: "Ae",
    ä: "ae",
    Ö: "Oe",
    ö: "oe",
    Å: "Aa",
    å: "aa",
    "&": " ja ",
  },
}

/** Hungarian: `&` becomes `es`. */
export const hu: Locale = {
  id: "hu",
  table: {
    "&": " es ",
  },
}

/** Vietnamese: `đ` becomes `d`, `&` becomes `va`. */
export const vi: Locale = {
  id: "vi",
  table: {
    Đ: "D",
    đ: "d",
    "&": " va ",
  },
}

/** Spanish: `ñ` becomes `n`, `&` becomes `y`. */
export const es: Locale = {
  id: "es",
  table: {
    Ñ: "N",
    ñ: "n",
    "&": " y ",
  },
}

/** French: `œ æ` become `oe ae`, `&` becomes `et`. */
export const fr: Locale = {
  id: "fr",
  table: {
    Œ: "Oe",
    œ: "oe",
    Æ: "Ae",
    æ: "ae",
    "&": " et ",
  },
}

/** Portuguese: `&` becomes `e`. */
export const pt: Locale = {
  id: "pt",
  table: {
    "&": " e ",
  },
}

/** Italian: `&` becomes `e`. */
export const it: Locale = {
  id: "it",
  table: {
    "&": " e ",
  },
}

/** Dutch: `ĳ` becomes `ij`, `&` becomes `en`. */
export const nl: Locale = {
  id: "nl",
  table: {
    Ĳ: "IJ",
    ĳ: "ij",
    "&": " en ",
  },
}

/** Polish: `&` becomes `i`. */
export const pl: Locale = {
  id: "pl",
  table: {
    "&": " i ",
  },
}

/** Romanian: `&` becomes `si`. */
export const ro: Locale = {
  id: "ro",
  table: {
    "&": " si ",
  },
}

/** Czech: `&` becomes `a`. */
export const cs: Locale = {
  id: "cs",
  table: {
    "&": " a ",
  },
}

/** Slovak: `&` becomes `a`. */
export const sk: Locale = {
  id: "sk",
  table: {
    "&": " a ",
  },
}

/** Slovenian: `&` becomes `in`. */
export const sl: Locale = {
  id: "sl",
  table: {
    "&": " in ",
  },
}

/** Croatian: `&` becomes `i`. */
export const hr: Locale = {
  id: "hr",
  table: {
    "&": " i ",
  },
}

/** Icelandic: `þ ð` become `th d`, `&` becomes `og`. */
export const is: Locale = {
  id: "is",
  table: {
    Þ: "Th",
    þ: "th",
    Ð: "D",
    ð: "d",
    "&": " og ",
  },
}

/** Estonian: `&` becomes `ja`. */
export const et: Locale = {
  id: "et",
  table: {
    "&": " ja ",
  },
}

/** Latvian: `&` becomes `un`. */
export const lv: Locale = {
  id: "lv",
  table: {
    "&": " un ",
  },
}

/** Lithuanian: `&` becomes `ir`. */
export const lt: Locale = {
  id: "lt",
  table: {
    "&": " ir ",
  },
}

/** Catalan: the punt volat in `l·l` is dropped, `&` becomes `i`. */
export const ca: Locale = {
  id: "ca",
  table: {
    "·": "",
    "&": " i ",
  },
}

/** The Latin-script locales by id; these ship with the main entry. */
export const latinLocales: Readonly<Record<LatinLocaleId, Locale>> = {
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
}
