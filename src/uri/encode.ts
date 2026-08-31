import { percentEncode } from "./percent"

export interface EncodePathSegmentOptions {
  readonly noColon?: boolean
}

export function encodePathSegment(segment: string, options: EncodePathSegmentOptions = {}): string {
  return percentEncode(segment, options.noColon ? "segment-nz-nc" : "pchar")
}

export function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodePathSegment(segment))
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
