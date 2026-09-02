import { percentEncode } from "./percent"

/** Options for `encodePathSegment`. */
export interface EncodePathSegmentOptions {
  /** Also encodes `:`, for the first segment of a relative reference (`segment-nz-nc`). */
  readonly noColon?: boolean
}

/** Encodes one path segment so that `/`, `?` and `#` inside it cannot be mistaken for delimiters. */
export function encodePathSegment(segment: string, options: EncodePathSegmentOptions = {}): string {
  return percentEncode(segment, options.noColon ? "segment-nz-nc" : "pchar")
}

/** Options for `encodePath`. */
export interface EncodePathOptions {
  /** Encodes the colon in the first segment so the path cannot be read as a scheme. */
  readonly relative?: boolean
}

/** Encodes each segment of `path`, keeping the `/` separators. */
export function encodePath(path: string, options: EncodePathOptions = {}): string {
  const noColonFirst = options.relative === true && !path.startsWith("/")
  return path
    .split("/")
    .map((segment, index) => encodePathSegment(segment, { noColon: noColonFirst && index === 0 }))
    .join("/")
}

/** Encodes `query` with the RFC 3986 `query` set, keeping `/`, `?`, `=` and `&`. */
export function encodeQuery(query: string): string {
  return percentEncode(query, "query")
}

/** Encodes `fragment` with the RFC 3986 `fragment` set. */
export function encodeFragment(fragment: string): string {
  return percentEncode(fragment, "fragment")
}

/** `application/x-www-form-urlencoded` encoding of one value: spaces become `+`, `*-._` and alphanumerics stay. */
export function encodeForm(value: string): string {
  return percentEncode(value, "form")
}
