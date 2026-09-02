import { describe, expect, it } from "vitest"
import { createSlugger, slugifyWithCounter } from "../src"

describe("createSlugger", () => {
  it("appends an incrementing suffix for repeated slugs", () => {
    const slug = createSlugger()
    expect(slug("foo")).toBe("foo")
    expect(slug("foo")).toBe("foo-2")
    expect(slug("Foo!")).toBe("foo-3")
    expect(slug("bar")).toBe("bar")
    expect(slug("bar")).toBe("bar-2")
  })

  it("never issues a slug twice, even when a suffixed form arrives explicitly", () => {
    const slug = createSlugger()
    expect(slug("foo")).toBe("foo")
    expect(slug("foo-2")).toBe("foo-2")
    expect(slug("foo-2")).toBe("foo-2-2")
    expect(slug("foo")).toBe("foo-3")
    expect(slug("foo 3")).toBe("foo-3-2")
  })

  it("reset, has and reserve", () => {
    const slug = createSlugger()
    slug.reserve("foo")
    expect(slug.has("foo")).toBe(true)
    expect(slug("foo")).toBe("foo-2")
    slug.reset()
    expect(slug.has("foo")).toBe(false)
    expect(slug("foo")).toBe("foo")
  })

  it("never counts the empty slug", () => {
    const slug = createSlugger()
    expect(slug("")).toBe("")
    expect(slug("!!!")).toBe("")
    expect(slug("")).toBe("")
    expect(slug.has("")).toBe(false)
  })

  it("respects defaults and per-call options", () => {
    const slug = createSlugger({ separator: "_" })
    expect(slug("foo bar")).toBe("foo_bar")
    expect(slug("foo bar")).toBe("foo_bar_2")
    expect(slug("foo bar", { separator: "." })).toBe("foo.bar")
    expect(slug("foo bar", { separator: "." })).toBe("foo.bar.2")
  })

  it("keeps results within maxLength", () => {
    const slug = createSlugger({ maxLength: 6 })
    expect(slug("foobar")).toBe("foobar")
    expect(slug("foobar")).toBe("foob-2")
    expect(slug("foobar")).toBe("foob-3")
    const tiny = createSlugger({ maxLength: 2 })
    expect(tiny("ab")).toBe("ab")
    expect(tiny("ab")).toBe("2")
    expect(tiny("ab")).toBe("3")
    const words = createSlugger({ maxLength: 9 })
    expect(words("the quick brown")).toBe("the-quick")
    expect(words("the quick brown")).toBe("the-2")
  })

  it("slugifyWithCounter is an alias", () => {
    expect(slugifyWithCounter).toBe(createSlugger)
    const slug = slugifyWithCounter()
    expect(slug("x")).toBe("x")
    expect(slug("x")).toBe("x-2")
  })
})

describe("fallback and units in a slugger", () => {
  it("counts from the fallback and honours the byte budget", () => {
    const slug = createSlugger({ fallback: "untitled" })
    expect(slug("!!!")).toBe("untitled")
    expect(slug("???")).toBe("untitled-2")
    expect(slug("Untitled")).toBe("untitled-3")
    const bytes = createSlugger({ unicode: true, maxLength: 13, maxLengthUnit: "bytes" })
    expect(bytes("ünïcödé")).toBe("ünïcödé")
    expect(bytes("ünïcödé")).toBe("ünïcödé-2")
    expect(bytes("ünïcödé")).toBe("ünïcödé-3")
    expect(bytes("ünïcödé x")).toBe("ünïcödé-x")
    expect(bytes("ünïcödé x")).toBe("ünïcödé-4")
    const tight = createSlugger({ unicode: true, maxLength: 12, maxLengthUnit: "bytes" })
    expect(tight("ünïcödé")).toBe("ünïcödé")
    expect(tight("ünïcödé")).toBe("ünïcöd-2")
  })
})
