import { isSubDelim, isUnreserved } from "./charset"
import { readHexByte } from "./utf8"

const DEC_OCTET = /^(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/
const H16 = /^[0-9A-Fa-f]{1,4}$/
const IPV_FUTURE = /^v[0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+$/

export type HostKind = "ip-literal" | "ipv4" | "reg-name"

export interface ParsedHost {
  readonly kind: HostKind
  readonly value: string
}

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

export function isIPv6Address(text: string): boolean {
  const gap = text.indexOf("::")
  if (gap === -1) return h16Groups(text, true) === 8
  if (text.indexOf("::", gap + 1) !== -1) return false
  const left = h16Groups(text.slice(0, gap), false)
  const right = h16Groups(text.slice(gap + 2), true)
  return left >= 0 && right >= 0 && left + right <= 7
}

export function isIPvFuture(text: string): boolean {
  return IPV_FUTURE.test(text)
}

export function isIPLiteral(text: string): boolean {
  if (!text.startsWith("[") || !text.endsWith("]")) return false
  const inner = text.slice(1, -1)
  return isIPv6Address(inner) || isIPvFuture(inner)
}

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

export function parseHost(text: string): ParsedHost | undefined {
  if (isIPLiteral(text)) return { kind: "ip-literal", value: text.slice(1, -1) }
  if (isIPv4Address(text)) return { kind: "ipv4", value: text }
  if (isRegName(text)) return { kind: "reg-name", value: text }
  return undefined
}

export function isHost(text: string): boolean {
  return parseHost(text) !== undefined
}
