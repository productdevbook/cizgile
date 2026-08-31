import { parseUri, serializeUri } from "./parse"
import { removeDotSegments } from "./path"
import { normalizePercentEncoding } from "./percent"

export interface NormalizeUriOptions {
  readonly defaultPorts?: Readonly<Record<string, number>>
}

export const DEFAULT_PORTS: Readonly<Record<string, number>> = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21,
}

export interface AuthorityComponents {
  userinfo?: string
  host: string
  port?: string
}

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
  if (colon !== -1 && colon > bracket && /^:\d*$/.test(hostPort.slice(colon))) {
    out.host = hostPort.slice(0, colon)
    out.port = hostPort.slice(colon + 1)
  } else {
    out.host = hostPort
  }
  return out
}

export function serializeAuthority(components: AuthorityComponents): string {
  let out = ""
  if (components.userinfo !== undefined) out += components.userinfo + "@"
  out += components.host
  if (components.port !== undefined) out += ":" + components.port
  return out
}

export function normalizeUri(input: string, options: NormalizeUriOptions = {}): string {
  const ports = options.defaultPorts ?? DEFAULT_PORTS
  const c = parseUri(input)
  const scheme = c.scheme?.toLowerCase()
  if (scheme !== undefined) c.scheme = scheme
  const defaultPort = scheme === undefined ? undefined : ports[scheme]

  if (c.authority !== undefined) {
    const a = parseAuthority(c.authority)
    if (a.userinfo !== undefined) a.userinfo = normalizePercentEncoding(a.userinfo)
    a.host = normalizePercentEncoding(a.host.toLowerCase())
    if (a.port !== undefined && (a.port === "" || Number(a.port) === defaultPort)) delete a.port
    c.authority = serializeAuthority(a)
  }

  c.path = normalizePercentEncoding(c.path)
  if (c.scheme !== undefined || c.authority !== undefined) c.path = removeDotSegments(c.path)
  if (c.authority !== undefined && c.path === "" && defaultPort !== undefined) c.path = "/"
  if (c.query !== undefined) c.query = normalizePercentEncoding(c.query)
  if (c.fragment !== undefined) c.fragment = normalizePercentEncoding(c.fragment)
  return serializeUri(c)
}
