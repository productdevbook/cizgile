/** The five RFC 3986 components. An absent component is `undefined`; an empty one is `""`, and the two serialise differently. */
export interface UriComponents {
  /** Without the trailing colon. */
  scheme?: string
  /** Without the leading `//`; split it with `parseAuthority`. */
  authority?: string
  /** Always present, possibly empty. */
  path: string
  /** Without the leading `?`. */
  query?: string
  /** Without the leading `#`. */
  fragment?: string
}

const URI_REFERENCE =
  /^(?:([A-Za-z][A-Za-z0-9+.-]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/s

/** Splits a URI reference into its components with the RFC 3986 Appendix B regular expression; never throws. */
export function parseUri(input: string): UriComponents {
  const [, scheme, authority, path = "", query, fragment] = URI_REFERENCE.exec(input) ?? []
  const out: UriComponents = { path }
  if (scheme !== undefined) out.scheme = scheme
  if (authority !== undefined) out.authority = authority
  if (query !== undefined) out.query = query
  if (fragment !== undefined) out.fragment = fragment
  return out
}

/** Recomposes components per RFC 3986 section 5.3, inserting `/.` or `./` where the grammar requires it. */
export function serializeUri(components: UriComponents): string {
  let out = ""
  let path = components.path
  if (components.scheme !== undefined) out += components.scheme + ":"
  if (components.authority !== undefined) {
    out += "//" + components.authority
    if (path !== "" && !path.startsWith("/")) path = "/" + path
  } else if (path.startsWith("//")) {
    path = "/." + path
  } else if (components.scheme === undefined) {
    const first = path.split("/", 1)[0] ?? ""
    if (first.includes(":")) path = "./" + path
  }
  out += path
  if (components.query !== undefined) out += "?" + components.query
  if (components.fragment !== undefined) out += "#" + components.fragment
  return out
}
