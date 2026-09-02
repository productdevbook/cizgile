import { normalizeUri, type NormalizeUriOptions } from "./normalize"
import { parseUri, serializeUri } from "./parse"
import { resolveUri } from "./resolve"

/** The RFC 3986 section 6.2 comparison ladder: string, syntax-based or scheme-based normalisation. */
export type EquivalenceLevel = "simple" | "syntax" | "scheme"

/** Options for `equivalentUris`. */
export interface EquivalentUrisOptions {
  /** How much normalisation to apply before comparing; `"scheme"` by default. */
  readonly level?: EquivalenceLevel
  /** Resolves both references against this base first. */
  readonly base?: string
  /** Compares without the fragments. */
  readonly ignoreFragment?: boolean
  /** Scheme to default port, merged over `DEFAULT_PORTS`. */
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

/** Whether two URIs identify the same resource under the chosen normalisation level. IRIs are never mapped to URIs (RFC 3987 section 5.3.1). */
export function equivalentUris(a: string, b: string, options: EquivalentUrisOptions = {}): boolean {
  return prepare(a, options) === prepare(b, options)
}

/** Options for `isSameDocumentReference`. */
export interface SameDocumentOptions {
  /** Normalises both sides before comparing. */
  readonly normalize?: boolean
}

/** RFC 3986 section 4.4: whether `reference` resolved against `base` differs from it only in the fragment. */
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
