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
  /** The authority's userinfo; set by `parseUri(input, { authority: true })`, read by `serializeUri` when `authority` is absent. */
  userinfo?: string
  /** The authority's host; set by `parseUri(input, { authority: true })`, read by `serializeUri` when `authority` is absent. */
  host?: string
  /** The authority's port as written; set by `parseUri(input, { authority: true })`, read by `serializeUri` when `authority` is absent. */
  port?: string
  /** The port as a number when it is in range; set by `parseUri(input, { authority: true })`. */
  portNumber?: number
}

/** Options for `parseUri`. */
export interface ParseUriOptions {
  /** Also split the authority into `userinfo`, `host`, `port` and `portNumber`. */
  readonly authority?: boolean
}

const URI_REFERENCE =
  /^(?:([A-Za-z][A-Za-z0-9+.-]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/s

/** Splits a URI reference into its components with the RFC 3986 Appendix B regular expression; never throws. With `authority: true` the authority is split further. */
export function parseUri(input: string, options: ParseUriOptions = {}): UriComponents {
  const [, scheme, authority, path = "", query, fragment] = URI_REFERENCE.exec(input) ?? []
  const out: UriComponents = { path }
  if (scheme !== undefined) out.scheme = scheme
  if (authority !== undefined) {
    out.authority = authority
    if (options.authority === true) {
      const parts = parseAuthority(authority)
      Object.assign(out, parts)
      const port = parts.port
      if (port !== undefined && port !== "" && port.length <= 5 && Number(port) <= 65535) {
        out.portNumber = Number(port)
      }
    }
  }
  if (query !== undefined) out.query = query
  if (fragment !== undefined) out.fragment = fragment
  return out
}

function authorityOf(components: UriComponents): string | undefined {
  if (components.authority !== undefined) return components.authority
  if (components.host === undefined) return undefined
  const parts: AuthorityComponents = { host: components.host }
  if (components.userinfo !== undefined) parts.userinfo = components.userinfo
  if (components.port !== undefined) parts.port = components.port
  return serializeAuthority(parts)
}

/** Recomposes components per RFC 3986 section 5.3, inserting `/.` or `./` where the grammar requires it. `authority` wins over `host`, `port` and `userinfo`. */
export function serializeUri(components: UriComponents): string {
  let out = ""
  let path = components.path
  const authority = authorityOf(components)
  if (components.scheme !== undefined) out += components.scheme + ":"
  if (authority !== undefined) {
    out += "//" + authority
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

/** The parts of an RFC 3986 `authority`. */
export interface AuthorityComponents {
  /** Without the trailing `@`. */
  userinfo?: string
  /** As written, brackets included for IP literals. */
  host: string
  /** Digits only, without the colon; `""` when the colon was present but empty. */
  port?: string
}

/** Splits an authority into userinfo, host and port. */
export function parseAuthority(authority: string): AuthorityComponents {
  const at = authority.lastIndexOf("@")
  const out: AuthorityComponents = { host: "" }
  let hostPort = authority
  if (at !== -1) {
    out.userinfo = authority.slice(0, at)
    hostPort = authority.slice(at + 1)
  }
  const bracket = hostPort.startsWith("[") ? hostPort.indexOf("]") : -1
  const colon = hostPort.lastIndexOf(":")
  if (hostPort.startsWith("[") && bracket === -1) {
    out.host = hostPort
    return out
  }
  if (colon !== -1 && colon > bracket && /^:\d*$/.test(hostPort.slice(colon))) {
    out.host = hostPort.slice(0, colon)
    out.port = hostPort.slice(colon + 1)
  } else {
    out.host = hostPort
  }
  return out
}

/** Recomposes an authority from its parts. */
export function serializeAuthority(components: AuthorityComponents): string {
  let out = ""
  if (components.userinfo !== undefined) out += components.userinfo + "@"
  out += components.host
  if (components.port !== undefined) out += ":" + components.port
  return out
}
