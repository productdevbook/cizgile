import { isSubDelim, isUnreserved } from "./charset"
import { readHexByte } from "./utf8"

const DEC_OCTET = /^(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/
const H16 = /^[0-9A-Fa-f]{1,4}$/
const IPV_FUTURE = /^v[0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+$/

/** The three RFC 3986 section 3.2.2 host forms. */
export type HostKind = "ip-literal" | "ipv4" | "reg-name"

/** The result of `parseHost`. */
export interface ParsedHost {
  /** Which host production matched. */
  readonly kind: HostKind
  /** The address without brackets, or the registered name as written. */
  readonly value: string
}

/** RFC 3986 `IPv4address`: four decimal octets, no leading zeros; `0x7f.0.0.1` is a registered name, not an address. */
export function isIPv4Address(text: string): boolean {
  const parts = text.split(".")
  return parts.length === 4 && parts.every((part) => DEC_OCTET.test(part))
}

function h16Groups(part: string, allowIPv4Tail: boolean): number {
  if (part === "") return 0
  const items = part.split(":")
  let count = 0
  for (const [index, item] of items.entries()) {
    if (allowIPv4Tail && index === items.length - 1 && item.includes(".")) {
      if (!isIPv4Address(item)) return -1
      count += 2
    } else if (H16.test(item)) {
      count += 1
    } else {
      return -1
    }
  }
  return count
}

/** RFC 3986 `IPv6address`, all nine ABNF alternatives including the embedded IPv4 form. */
export function isIPv6Address(text: string): boolean {
  const gap = text.indexOf("::")
  if (gap === -1) return h16Groups(text, true) === 8
  if (text.indexOf("::", gap + 1) !== -1) return false
  const left = h16Groups(text.slice(0, gap), false)
  const right = h16Groups(text.slice(gap + 2), true)
  return left >= 0 && right >= 0 && left + right <= 7
}

function splitGroups(part: string): string[] {
  return part === "" ? [] : part.split(":")
}

function zeroRun(groups: readonly string[]): readonly [number, number] {
  let bestStart = -1
  let bestLength = 0
  let i = 0
  while (i < groups.length) {
    if (groups[i] !== "0") {
      i += 1
      continue
    }
    let j = i
    while (j < groups.length && groups[j] === "0") j += 1
    if (j - i > bestLength) {
      bestStart = i
      bestLength = j - i
    }
    i = j
  }
  return [bestStart, bestLength]
}

/** RFC 5952 canonical text of an IPv6 address: lowercase, no leading zeros, the longest zero run as `::`, an embedded IPv4 tail kept. Anything that is not an IPv6 address is returned as is. */
export function normalizeIPv6Address(text: string): string {
  if (!isIPv6Address(text)) return text
  const lower = text.toLowerCase()
  const lastColon = lower.lastIndexOf(":")
  const tail = lower.includes(".", lastColon) ? lower.slice(lastColon + 1) : undefined
  const body = tail === undefined ? lower : lower.slice(0, lastColon + 1)
  const total = tail === undefined ? 8 : 6
  const gap = body.indexOf("::")
  let groups: string[]
  if (gap === -1) {
    groups = splitGroups(body.replace(/:$/, ""))
  } else {
    const left = splitGroups(body.slice(0, gap))
    const right = splitGroups(body.slice(gap + 2).replace(/:$/, ""))
    groups = [
      ...left,
      ...Array.from({ length: total - left.length - right.length }, () => "0"),
      ...right,
    ]
  }
  groups = groups.map((group) => group.replace(/^0+(?=.)/, ""))
  const [start, length] = zeroRun(groups)
  const out =
    length >= 2
      ? `${groups.slice(0, start).join(":")}::${groups.slice(start + length).join(":")}`
      : groups.join(":")
  if (tail === undefined) return out
  return out.endsWith(":") ? out + tail : `${out}:${tail}`
}

/** RFC 3986 `IPvFuture`: `v` + hex + `.` + unreserved or sub-delims. */
export function isIPvFuture(text: string): boolean {
  return IPV_FUTURE.test(text)
}

/** RFC 3986 `IP-literal`: an IPv6 address or IPvFuture in square brackets. */
export function isIPLiteral(text: string): boolean {
  if (!text.startsWith("[") || !text.endsWith("]")) return false
  const inner = text.slice(1, -1)
  return isIPv6Address(inner) || isIPvFuture(inner)
}

/** RFC 3986 `reg-name`: unreserved, percent-encoded and sub-delims characters, possibly empty. */
export function isRegName(text: string): boolean {
  let i = 0
  while (i < text.length) {
    const cp = text.codePointAt(i) ?? 0
    if (cp === 0x25) {
      if (readHexByte(text, i) === -1) return false
      i += 3
      continue
    }
    if (!isUnreserved(cp) && !isSubDelim(cp)) return false
    i += 1
  }
  return true
}

/** Classifies `text` as an IP literal, IPv4 address or registered name, or returns `undefined`. */
export function parseHost(text: string): ParsedHost | undefined {
  if (isIPLiteral(text)) return { kind: "ip-literal", value: text.slice(1, -1) }
  if (isIPv4Address(text)) return { kind: "ipv4", value: text }
  if (isRegName(text)) return { kind: "reg-name", value: text }
  return undefined
}

/** Whether `text` is a valid RFC 3986 `host`. */
export function isHost(text: string): boolean {
  return parseHost(text) !== undefined
}
