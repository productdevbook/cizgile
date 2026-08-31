import { isScheme, isSubDelim, isUnreserved } from "./charset"
import { isHost } from "./host"
import { isBidiControl, isIprivate, isUcschar } from "./iri"
import { parseAuthority } from "./normalize"
import { parseUri, type UriComponents } from "./parse"
import { readHexByte } from "./utf8"

export type PathForm = "empty" | "absolute" | "abempty" | "rootless" | "noscheme"

export interface ReferenceClassification {
  readonly kind: "uri" | "relative"
  readonly absolute: boolean
  readonly path: PathForm
  readonly components: UriComponents
}

export interface ValidateOptions {
  readonly iri?: boolean
}

type Component = "userinfo" | "host" | "path" | "query" | "fragment"

function extraAllowed(component: Component, cp: number): boolean {
  switch (component) {
    case "userinfo":
      return cp === 0x3a
    case "path":
      return cp === 0x3a || cp === 0x40 || cp === 0x2f
    case "query":
    case "fragment":
      return cp === 0x3a || cp === 0x40 || cp === 0x2f || cp === 0x3f
    default:
      return false
  }
}

function validText(text: string, component: Component, iri: boolean): boolean {
  let i = 0
  while (i < text.length) {
    const cp = text.codePointAt(i) ?? 0
    if (cp === 0x25) {
      if (readHexByte(text, i) === -1) return false
      i += 3
      continue
    }
    if (cp >= 0x80) {
      if (!iri) return false
      const ok = isUcschar(cp) && !isBidiControl(cp)
      const privateOk = component === "query" && isIprivate(cp)
      if (!ok && !privateOk) return false
      i += cp > 0xffff ? 2 : 1
      continue
    }
    if (!isUnreserved(cp) && !isSubDelim(cp) && !extraAllowed(component, cp)) return false
    i += 1
  }
  return true
}

function asciiHost(host: string, iri: boolean): string {
  if (!iri) return host
  let out = ""
  for (const ch of host) {
    const cp = ch.codePointAt(0) ?? 0
    out += cp >= 0x80 && isUcschar(cp) && !isBidiControl(cp) ? "a" : ch
  }
  return out
}

export function pathForm(path: string, components?: UriComponents): PathForm {
  if (path === "") return "empty"
  if (path.startsWith("/")) {
    if (components?.authority !== undefined) return "abempty"
    return path.startsWith("//") ? "abempty" : "absolute"
  }
  if (components?.scheme !== undefined) return "rootless"
  const first = path.split("/", 1)[0] ?? ""
  return first.includes(":") ? "rootless" : "noscheme"
}

export function classifyReference(
  input: string,
  options: ValidateOptions = {},
): ReferenceClassification | undefined {
  const iri = options.iri ?? false
  const c = parseUri(input)
  if (c.scheme !== undefined && !isScheme(c.scheme)) return undefined
  if (c.authority !== undefined) {
    const a = parseAuthority(c.authority)
    if (a.userinfo !== undefined && !validText(a.userinfo, "userinfo", iri)) return undefined
    if (!isHost(asciiHost(a.host, iri))) return undefined
    if (a.port !== undefined && !/^[0-9]*$/.test(a.port)) return undefined
    if (c.path !== "" && !c.path.startsWith("/")) return undefined
  } else if (c.path.startsWith("//")) {
    return undefined
  }
  if (!validText(c.path, "path", iri)) return undefined
  if (c.query !== undefined && !validText(c.query, "query", iri)) return undefined
  if (c.fragment !== undefined && !validText(c.fragment, "fragment", iri)) return undefined
  const form = pathForm(c.path, c)
  if (c.scheme === undefined && c.authority === undefined && form === "rootless") return undefined
  return {
    kind: c.scheme === undefined ? "relative" : "uri",
    absolute: c.scheme !== undefined && c.fragment === undefined,
    path: form,
    components: c,
  }
}

export function isUriReference(input: string): boolean {
  return classifyReference(input) !== undefined
}

export function isUri(input: string): boolean {
  return classifyReference(input)?.kind === "uri"
}

export function isAbsoluteUri(input: string): boolean {
  return classifyReference(input)?.absolute === true
}

export function isRelativeReference(input: string): boolean {
  return classifyReference(input)?.kind === "relative"
}

export function isIriReference(input: string): boolean {
  return classifyReference(input, { iri: true }) !== undefined
}

export function isIri(input: string): boolean {
  return classifyReference(input, { iri: true })?.kind === "uri"
}
