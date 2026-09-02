import { parseAuthority, parseUri, serializeAuthority, serializeUri } from "./parse"
import { isHost, isIPLiteral, normalizeIPv6Address } from "./host"
import { removeDotSegments } from "./path"
import { normalizePercentEncoding } from "./percent"
import { domainToAscii, domainToUnicode } from "./punycode"

/** Options for `normalizeUri`. */
export interface NormalizeUriOptions {
  /** Scheme to default port, merged over `DEFAULT_PORTS`. */
  readonly defaultPorts?: Readonly<Record<string, number>>
  /** RFC 3986 section 6.2.3: drop default ports and turn an empty path into `/`; `true` by default. */
  readonly schemeBased?: boolean
  /** Redacts credentials, for logs; `"keep"` by default. */
  readonly userinfo?: "keep" | "strip-password" | "strip"
  /** What to do with a trailing slash on a path longer than `/`; `"keep"` by default. */
  readonly trailingSlash?: "keep" | "add" | "remove"
  /** Drop a `?` with nothing after it; `"keep"` by default. */
  readonly emptyQuery?: "keep" | "remove"
  /** Drop a `#` with nothing after it; `"keep"` by default. */
  readonly emptyFragment?: "keep" | "remove"
  /** Convert a registered-name host to its `xn--` form or back to Unicode; `"keep"` by default. */
  readonly host?: "keep" | "idna" | "unicode"
  /** Throw a `TypeError` on a host or port the RFC 3986 grammar rejects instead of passing it through. */
  readonly strict?: boolean
}

/** Default ports of the common schemes, used by `normalizeUri` and `equivalentUris`. */
export const DEFAULT_PORTS: Readonly<Record<string, number>> = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21,
}

/** RFC 3986 section 6.2 syntax-based and scheme-based normalisation: case, percent-encoding, dot segments, default ports, empty path. */
export function normalizeUri(input: string, options: NormalizeUriOptions = {}): string {
  const ports = options.defaultPorts ?? DEFAULT_PORTS
  const schemeBased = options.schemeBased ?? true
  const c = parseUri(input)
  const scheme = c.scheme?.toLowerCase()
  if (scheme !== undefined) c.scheme = scheme
  const defaultPort = scheme === undefined || !schemeBased ? undefined : ports[scheme]

  if (c.authority !== undefined) {
    const a = parseAuthority(c.authority)
    const userinfo = options.userinfo ?? "keep"
    if (userinfo === "strip") {
      delete a.userinfo
    } else if (a.userinfo !== undefined) {
      if (userinfo === "strip-password") a.userinfo = a.userinfo.split(":", 1)[0] ?? ""
      a.userinfo = normalizePercentEncoding(a.userinfo)
    }
    a.host = normalizePercentEncoding(a.host.replace(/[A-Z]+/g, (m) => m.toLowerCase()))
    if (options.strict === true) {
      if (!isHost(a.host))
        throw new TypeError(`normalizeUri: invalid host ${JSON.stringify(a.host)}`)
      if (a.port !== undefined && !/^\d*$/.test(a.port)) {
        throw new TypeError(`normalizeUri: invalid port ${JSON.stringify(a.port)}`)
      }
    }
    if (isIPLiteral(a.host)) a.host = `[${normalizeIPv6Address(a.host.slice(1, -1))}]`
    else if (options.host === "idna") a.host = domainToAscii(a.host)
    else if (options.host === "unicode") a.host = domainToUnicode(a.host)
    if (a.port !== undefined && (a.port === "" || Number(a.port) === defaultPort)) delete a.port
    c.authority = serializeAuthority(a)
  }

  c.path = normalizePercentEncoding(c.path)
  if (c.scheme !== undefined || c.authority !== undefined) c.path = removeDotSegments(c.path)
  if (schemeBased && c.scheme !== undefined && c.authority !== undefined && c.path === "")
    c.path = "/"
  const trailing = options.trailingSlash ?? "keep"
  if (trailing === "remove" && c.path.length > 1 && c.path.endsWith("/")) {
    c.path = c.path.replace(/\/+$/, "")
  } else if (trailing === "add" && c.path !== "" && !c.path.endsWith("/")) {
    c.path += "/"
  }
  if (c.query !== undefined) c.query = normalizePercentEncoding(c.query)
  if (c.fragment !== undefined) c.fragment = normalizePercentEncoding(c.fragment)
  if (options.emptyQuery === "remove" && c.query === "") delete c.query
  if (options.emptyFragment === "remove" && c.fragment === "") delete c.fragment
  return serializeUri(c)
}
