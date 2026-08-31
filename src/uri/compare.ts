import { normalizeUri, type NormalizeUriOptions } from "./normalize"
import { parseUri, serializeUri } from "./parse"
import { resolveUri } from "./resolve"

export type EquivalenceLevel = "simple" | "syntax" | "scheme"

export interface EquivalentUrisOptions {
  readonly level?: EquivalenceLevel
  readonly base?: string
  readonly ignoreFragment?: boolean
  readonly defaultPorts?: NormalizeUriOptions["defaultPorts"]
}

function withoutFragment(uri: string): string {
  const c = parseUri(uri)
  delete c.fragment
  return serializeUri(c)
}

function prepare(uri: string, options: EquivalentUrisOptions): string {
  let out = options.base === undefined ? uri : resolveUri(options.base, uri)
  if (options.ignoreFragment === true) out = withoutFragment(out)
  switch (options.level ?? "scheme") {
    case "simple":
      return out
    case "syntax":
      return normalizeUri(out, { schemeBased: false })
    default:
      return options.defaultPorts === undefined
        ? normalizeUri(out)
        : normalizeUri(out, { defaultPorts: options.defaultPorts })
  }
}

export function equivalentUris(a: string, b: string, options: EquivalentUrisOptions = {}): boolean {
  return prepare(a, options) === prepare(b, options)
}

export interface SameDocumentOptions {
  readonly normalize?: boolean
}

export function isSameDocumentReference(
  base: string,
  reference: string,
  options: SameDocumentOptions = {},
): boolean {
  const target = withoutFragment(resolveUri(base, reference))
  const origin = withoutFragment(base)
  return options.normalize === true
    ? normalizeUri(target) === normalizeUri(origin)
    : target === origin
}
