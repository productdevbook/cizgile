import { DEFAULT_PORTS } from "./normalize"
import { parseUri, serializeUri } from "./parse"
import { normalizePath } from "./path"
import { percentDecode, percentEncode } from "./percent"

/** RFC 6454 origin of a URI: lowercase `scheme://host` plus the port unless it is the scheme's default. `undefined` when there is no scheme or no authority. */
export function getOrigin(uri: string): string | undefined {
  const c = parseUri(uri, { authority: true })
  if (c.scheme === undefined || c.host === undefined) return undefined
  const scheme = c.scheme.toLowerCase()
  const host = c.host.replace(/[A-Z]+/g, (m) => m.toLowerCase())
  const port =
    c.port === undefined || c.port === "" || Number(c.port) === DEFAULT_PORTS[scheme]
      ? ""
      : `:${c.port}`
  return `${scheme}://${host}${port}`
}

/** Whether two URIs share an RFC 6454 origin. Two URIs without an origin never match. */
export function isSameOrigin(a: string, b: string): boolean {
  const origin = getOrigin(a)
  return origin !== undefined && origin === getOrigin(b)
}

/** The URI without its fragment. */
export function stripFragment(uri: string): string {
  const c = parseUri(uri)
  if (c.fragment === undefined) return uri
  delete c.fragment
  return serializeUri(c)
}

/** A query parameter as a decoded `[name, value]` pair; a bare name has the value `""`. */
export type QueryPair = readonly [string, string]

/** Decodes an `application/x-www-form-urlencoded` query (`a=1&b=2`, `+` as space) into pairs in order; a leading `?` is ignored. */
export function parseQuery(query: string): QueryPair[] {
  const text = query.startsWith("?") ? query.slice(1) : query
  const out: QueryPair[] = []
  if (text === "") return out
  for (const part of text.split("&")) {
    if (part === "") continue
    const eq = part.indexOf("=")
    const name = eq === -1 ? part : part.slice(0, eq)
    const value = eq === -1 ? "" : part.slice(eq + 1)
    out.push([
      percentDecode(name, { plusAsSpace: true }),
      percentDecode(value, { plusAsSpace: true }),
    ])
  }
  return out
}

/** Encodes pairs as an `application/x-www-form-urlencoded` query without the leading `?`. */
export function stringifyQuery(pairs: Iterable<QueryPair>): string {
  const parts: string[] = []
  for (const [name, value] of pairs)
    parts.push(`${percentEncode(name, "form")}=${percentEncode(value, "form")}`)
  return parts.join("&")
}

/** The URI with its query parameters sorted by name, then value, byte-wise on the encoded text; parameters are otherwise left as written. */
export function sortQuery(uri: string): string {
  const c = parseUri(uri)
  if (c.query === undefined || c.query === "") return uri
  const parts = c.query.split("&").filter((part) => part !== "")
  parts.sort((x, y) => {
    const [xn, xv] = splitPair(x)
    const [yn, yv] = splitPair(y)
    return xn < yn ? -1 : xn > yn ? 1 : xv < yv ? -1 : xv > yv ? 1 : 0
  })
  c.query = parts.join("&")
  return serializeUri(c)
}

function splitPair(part: string): [string, string] {
  const eq = part.indexOf("=")
  return eq === -1 ? [part, ""] : [part.slice(0, eq), part.slice(eq + 1)]
}

/** Joins path pieces with single slashes, keeps the first piece's leading slash and the last piece's trailing slash, and resolves `.` and `..` so the result never contains `//` or a dot segment. */
export function joinPaths(...pieces: readonly string[]): string {
  const parts = pieces.filter((piece) => piece !== "")
  if (parts.length === 0) return ""
  const first = parts[0] ?? ""
  const last = parts[parts.length - 1] ?? ""
  const leading = first.startsWith("/") ? "/" : ""
  const trailing = last.endsWith("/") && last !== "/" ? "/" : ""
  const body = parts
    .map((piece) => piece.replace(/^\/+|\/+$/g, ""))
    .filter((piece) => piece !== "")
    .join("/")
  if (body === "") return leading === "" ? "" : "/"
  const joined = normalizePath(leading + body.replace(/\/{2,}/g, "/"))
  return joined === "/" || joined === "" ? joined : joined + trailing
}
