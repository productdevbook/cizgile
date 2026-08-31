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
