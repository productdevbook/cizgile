import { parseUri, serializeUri } from "./parse"
import { isIPLiteral, normalizeIPv6Address } from "./host"
import { removeDotSegments } from "./path"
import { normalizePercentEncoding } from "./percent"

/** Options for `normalizeUri`. */
export interface NormalizeUriOptions {
  /** Scheme to default port, merged over `DEFAULT_PORTS`. */
  readonly defaultPorts?: Readonly<Record<string, number>>
  /** RFC 3986 section 6.2.3: drop default ports and turn an empty path into `/`; `true` by default. */
  readonly schemeBased?: boolean
  /** Redacts credentials, for logs; `"keep"` by default. */
  readonly userinfo?: "keep" | "strip-password" | "strip"
}

/** Default ports of the common schemes, used by `normalizeUri` and `equivalentUris`. */
export const DEFAULT_PORTS: Readonly<Record<string, number>> = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21,
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
    if (isIPLiteral(a.host)) a.host = `[${normalizeIPv6Address(a.host.slice(1, -1))}]`
    if (a.port !== undefined && (a.port === "" || Number(a.port) === defaultPort)) delete a.port
    c.authority = serializeAuthority(a)
  }

  c.path = normalizePercentEncoding(c.path)
  if (c.scheme !== undefined || c.authority !== undefined) c.path = removeDotSegments(c.path)
  if (schemeBased && c.scheme !== undefined && c.authority !== undefined && c.path === "")
    c.path = "/"
  if (c.query !== undefined) c.query = normalizePercentEncoding(c.query)
  if (c.fragment !== undefined) c.fragment = normalizePercentEncoding(c.fragment)
  return serializeUri(c)
}
