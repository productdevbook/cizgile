import { percentEncode } from "./percent"

export interface EncodePathSegmentOptions {
  readonly noColon?: boolean
}

export function encodePathSegment(segment: string, options: EncodePathSegmentOptions = {}): string {
  return percentEncode(segment, options.noColon ? "segment-nz-nc" : "pchar")
}

export interface EncodePathOptions {
  readonly relative?: boolean
}

export function encodePath(path: string, options: EncodePathOptions = {}): string {
  const noColonFirst = options.relative === true && !path.startsWith("/")
  return path
    .split("/")
    .map((segment, index) => encodePathSegment(segment, { noColon: noColonFirst && index === 0 }))
    .join("/")
}

export function encodeQuery(query: string): string {
  return percentEncode(query, "query")
}

export function encodeFragment(fragment: string): string {
  return percentEncode(fragment, "fragment")
}

export function encodeForm(value: string): string {
  return percentEncode(value, "form")
}
