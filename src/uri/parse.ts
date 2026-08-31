export interface UriComponents {
  scheme?: string
  authority?: string
  path: string
  query?: string
  fragment?: string
}

const URI_REFERENCE =
  /^(?:([A-Za-z][A-Za-z0-9+.-]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/s

export function parseUri(input: string): UriComponents {
  const [, scheme, authority, path = "", query, fragment] = URI_REFERENCE.exec(input) ?? []
  const out: UriComponents = { path }
  if (scheme !== undefined) out.scheme = scheme
  if (authority !== undefined) out.authority = authority
  if (query !== undefined) out.query = query
  if (fragment !== undefined) out.fragment = fragment
  return out
}

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
