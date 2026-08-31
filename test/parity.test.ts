import { describe, expect, it } from "vitest"
import { slugify } from "../src"

describe("Django django.utils.text.slugify parity", () => {
  it.each([
    [" Joel is a slug ", "joel-is-a-slug"],
    ["Hello World!", "hello-world"],
    [" -- Hello  World -- ", "hello-world"],
    ["Django Tests!!! Are Fun??", "django-tests-are-fun"],
    ["spam & eggs", "spam-and-eggs"],
    ["___leading and trailing___", "leading-and-trailing"],
    ["100% Pure", "100-pure"],
  ])("%j → %j", (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it("documented divergence: Django drops '&', cizgi spells it out", () => {
    expect(slugify("jack & jill")).toBe("jack-and-jill")
    expect(slugify("jack & jill", { transliterate: false })).toBe("jack-jill")
  })
})

describe("Rails ActiveSupport::Inflector#parameterize parity", () => {
  it.each([
    ["Donald E. Knuth", {}, "donald-e-knuth"],
    ["^très|Jolie-- ", {}, "tres-jolie"],
    ["Donald E. Knuth", { separator: "_" }, "donald_e_knuth"],
    ["Donald E. Knuth", { lowercase: false }, "Donald-E-Knuth"],
    ["^très|Jolie__ ", { preserveCharacters: ["_"] }, "tres-jolie__"],
    ["^très|Jolie-- ", { separator: "_", preserveCharacters: ["-"] }, "tres_jolie--"],
  ] as const)("%j %j → %j", (input, options, expected) => {
    expect(slugify(input, options)).toBe(expected)
  })
})

describe("@sindresorhus/slugify parity", () => {
  it.each([
    ["I ♥ Dogs", {}, "i-love-dogs"],
    ["  Déjà Vu!  ", {}, "deja-vu"],
    ["fooBar 123 $#%", { decamelize: true }, "foo-bar-123"],
    ["я люблю единорогов", {}, ""],
    ["Foo & Bar", {}, "foo-and-bar"],
    ["unicorn & rainbow", {}, "unicorn-and-rainbow"],
    ["🦄 & 🌈", {}, "unicorn-and"],
    ["BAR and baz", { separator: "_" }, "bar_and_baz"],
    ["Déjà Vu!", { separator: "" }, "dejavu"],
    ["Déjà Vu!", { lowercase: false }, "Deja-Vu"],
    ["fooBar", { decamelize: false }, "foobar"],
    ["_foo_bar", { preserveLeadingUnderscore: true }, "_foo-bar"],
    ["foo-bar-", { preserveTrailingSeparator: true }, "foo-bar-"],
    ["foo.bar", { preserveCharacters: ["."] }, "foo.bar"],
    ["foo.bar", {}, "foo-bar"],
    ["You're a Star", {}, "youre-a-star"],
    ["Don't Panic", {}, "dont-panic"],
  ] as const)("%j %j → %j", (input, options, expected) => {
    expect(slugify(input, options)).toBe(expected)
  })
})

describe("simov/slugify parity", () => {
  it.each([
    ["some string", {}, "some-string"],
    ["some string", { separator: "_" }, "some_string"],
    ["some *string!", { remove: /[*+~.()'"!:@]/g }, "some-string"],
    ["Some String", { lowercase: false }, "Some-String"],
    ["  leading and trailing  ", {}, "leading-and-trailing"],
    ["Über Straße", {}, "uber-strasse"],
    ["Über Straße", { locale: "de" }, "ueber-strasse"],
    ["Đà Nẵng", { locale: "vi" }, "da-nang"],
  ] as const)("%j %j → %j", (input, options, expected) => {
    expect(slugify(input, options)).toBe(expected)
  })
})
