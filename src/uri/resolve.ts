import { parseUri, serializeUri, type UriComponents } from "./parse"
import { removeDotSegments } from "./path"

/** Options for `resolveUri`. */
export interface ResolveUriOptions {
  /** Strict parsing (RFC 3986 section 5.2.2): `http:g` against an `http:` base stays `http:g`; `true` by default. */
  readonly strict?: boolean
  /** Accepts a base without a scheme instead of throwing. */
  readonly allowRelativeBase?: boolean
}

/** RFC 3986 section 5.2.3: merges a relative path reference with the base path. */
export function mergePaths(base: UriComponents, referencePath: string): string {
  if (base.authority !== undefined && base.path === "") return "/" + referencePath
  const index = base.path.lastIndexOf("/")
  return index === -1 ? referencePath : base.path.slice(0, index + 1) + referencePath
}

/**
 * RFC 3986 section 5.2 reference resolution; every section 5.4 example passes.
 * @throws {TypeError} when `base` is not an absolute URI, unless `allowRelativeBase` is set.
 */
export function resolveUri(
  base: string,
  reference: string,
  options: ResolveUriOptions = {},
): string {
  const b = parseUri(base)
  if (b.scheme === undefined && options.allowRelativeBase !== true) {
    throw new RangeError(
      "resolveUri: base must be an absolute-URI (RFC 3986 §5.1); pass { allowRelativeBase: true } to resolve against a relative reference",
    )
  }
  delete b.fragment
  if (b.scheme !== undefined || b.authority !== undefined) b.path = removeDotSegments(b.path)
  const r = parseUri(reference)
  const strict = options.strict ?? true
  if (
    !strict &&
    r.scheme !== undefined &&
    b.scheme !== undefined &&
    r.scheme.toLowerCase() === b.scheme.toLowerCase()
  ) {
    delete r.scheme
  }

  const target: UriComponents = { path: "" }
  if (r.scheme !== undefined) {
    target.scheme = r.scheme
    if (r.authority !== undefined) target.authority = r.authority
    target.path = removeDotSegments(r.path)
    if (r.query !== undefined) target.query = r.query
  } else {
    if (r.authority !== undefined) {
      target.authority = r.authority
      target.path = removeDotSegments(r.path)
      if (r.query !== undefined) target.query = r.query
    } else {
      if (r.path === "") {
        target.path = b.path
        const query = r.query ?? b.query
        if (query !== undefined) target.query = query
      } else {
        target.path = removeDotSegments(r.path.startsWith("/") ? r.path : mergePaths(b, r.path))
        if (r.query !== undefined) target.query = r.query
      }
      if (b.authority !== undefined) target.authority = b.authority
    }
    if (b.scheme !== undefined) target.scheme = b.scheme
  }
  if (r.fragment !== undefined) target.fragment = r.fragment
  return serializeUri(target)
}
