import { describe, expect, it } from "vitest"
import { extractUri, isUriReference } from "../../src/uri"

describe("extractUri (RFC 3986 Appendix C)", () => {
  it.each([
    ['"http://www.w3.org/Addressing/",', "http://www.w3.org/Addressing/"],
    ["<ftp://foo.example.\n com/rfc/>.", "ftp://foo.example.com/rfc/"],
    [
      "http://www.ics.uci.edu/pub/ietf/uri/\n   historical.html#WARNING",
      "http://www.ics.uci.edu/pub/ietf/uri/historical.html#WARNING",
    ],
    ["URL: <http://a/>", "http://a/"],
    ["url:http://a/", "http://a/"],
    ["(http://a/b).", "http://a/b"],
    ["(http://a/b/(x)).", "http://a/b/(x)"],
    ["[http://a/b]", "http://a/b"],
    ["http://a/b;", "http://a/b"],
    ["'http://a/b'", "http://a/b"],
    ["<http://a/b>", "http://a/b"],
    ["  http://a/b  ", "http://a/b"],
    ["http://a/b?x=1&y=2", "http://a/b?x=1&y=2"],
    ["http://a/b/(paren)", "http://a/b/(paren)"],
    ["http://a/b#frag.", "http://a/b#frag"],
    ["http://example.com/long-\n  name", "http://example.com/long-name"],
  ])("%j → %j", (input, expected) => {
    expect(extractUri(input)).toBe(expected)
    expect(isUriReference(extractUri(input))).toBe(true)
  })
})
