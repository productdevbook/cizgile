import type { LatinLocaleId, Locale } from "./types"

function turkishLowercase(input: string): string {
  return input.toLocaleLowerCase("tr")
}

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

export const hu: Locale = {
  id: "hu",
  table: {
    "&": " es ",
  },
}

export const vi: Locale = {
  id: "vi",
  table: {
    Đ: "D",
    đ: "d",
    "&": " va ",
  },
}

export const es: Locale = {
  id: "es",
  table: {
    Ñ: "N",
    ñ: "n",
    "&": " y ",
  },
}

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

export const pt: Locale = {
  id: "pt",
  table: {
    "&": " e ",
  },
}

export const it: Locale = {
  id: "it",
  table: {
    "&": " e ",
  },
}

export const nl: Locale = {
  id: "nl",
  table: {
    Ĳ: "IJ",
    ĳ: "ij",
    "&": " en ",
  },
}

export const pl: Locale = {
  id: "pl",
  table: {
    "&": " i ",
  },
}

export const ro: Locale = {
  id: "ro",
  table: {
    "&": " si ",
  },
}

export const cs: Locale = {
  id: "cs",
  table: {
    "&": " a ",
  },
}

export const sk: Locale = {
  id: "sk",
  table: {
    "&": " a ",
  },
}

export const sl: Locale = {
  id: "sl",
  table: {
    "&": " in ",
  },
}

export const hr: Locale = {
  id: "hr",
  table: {
    "&": " i ",
  },
}

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

export const et: Locale = {
  id: "et",
  table: {
    "&": " ja ",
  },
}

export const lv: Locale = {
  id: "lv",
  table: {
    "&": " un ",
  },
}

export const lt: Locale = {
  id: "lt",
  table: {
    "&": " ir ",
  },
}

export const ca: Locale = {
  id: "ca",
  table: {
    "·": "",
    "&": " i ",
  },
}

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
