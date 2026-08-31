const BASE = 36
const T_MIN = 1
const T_MAX = 26
const SKEW = 38
const DAMP = 700
const INITIAL_BIAS = 72
const INITIAL_N = 128
const DELIMITER = "-"
const PREFIX = "xn--"

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1
  d += Math.floor(d / numPoints)
  let k = 0
  while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
    d = Math.floor(d / (BASE - T_MIN))
    k += BASE
  }
  return k + Math.floor(((BASE - T_MIN + 1) * d) / (d + SKEW))
}

function digit(value: number): string {
  return String.fromCodePoint(value + (value < 26 ? 97 : 22))
}

function digitValue(cp: number): number {
  if (cp >= 48 && cp <= 57) return cp - 22
  if (cp >= 65 && cp <= 90) return cp - 65
  if (cp >= 97 && cp <= 122) return cp - 97
  return -1
}

export function punycodeEncode(input: string): string {
  const points = Array.from(input, (ch) => ch.codePointAt(0) ?? 0)
  let out = ""
  for (const cp of points) if (cp < 0x80) out += String.fromCodePoint(cp)
  const basicCount = out.length
  let handled = basicCount
  if (basicCount > 0) out += DELIMITER
  let n = INITIAL_N
  let delta = 0
  let bias = INITIAL_BIAS
  while (handled < points.length) {
    let m = 0x110000
    for (const cp of points) if (cp >= n && cp < m) m = cp
    delta += (m - n) * (handled + 1)
    n = m
    for (const cp of points) {
      if (cp < n) delta += 1
      if (cp === n) {
        let q = delta
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias
          if (q < t) break
          out += digit(t + ((q - t) % (BASE - t)))
          q = Math.floor((q - t) / (BASE - t))
        }
        out += digit(q)
        bias = adapt(delta, handled + 1, handled === basicCount)
        delta = 0
        handled += 1
      }
    }
    delta += 1
    n += 1
  }
  return out
}

export function punycodeDecode(input: string): string {
  const output: number[] = []
  const last = input.lastIndexOf(DELIMITER)
  const basicEnd = last > 0 ? last : 0
  for (let i = 0; i < basicEnd; i++) {
    const cp = input.codePointAt(i) ?? 0
    if (cp >= 0x80) throw new RangeError("punycodeDecode: invalid basic code point")
    output.push(cp)
  }
  let n = INITIAL_N
  let bias = INITIAL_BIAS
  let i = 0
  let index = basicEnd > 0 ? basicEnd + 1 : 0
  while (index < input.length) {
    const oldI = i
    let w = 1
    for (let k = BASE; ; k += BASE) {
      if (index >= input.length) throw new RangeError("punycodeDecode: truncated input")
      const d = digitValue(input.codePointAt(index) ?? 0)
      index += 1
      if (d < 0) throw new RangeError("punycodeDecode: invalid digit")
      i += d * w
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias
      if (d < t) break
      w *= BASE - t
    }
    const count = output.length + 1
    bias = adapt(i - oldI, count, oldI === 0)
    n += Math.floor(i / count)
    i %= count
    if (n > 0x10ffff) throw new RangeError("punycodeDecode: code point out of range")
    output.splice(i, 0, n)
    i += 1
  }
  return String.fromCodePoint(...output)
}

function isAsciiLabel(label: string): boolean {
  for (const ch of label) if ((ch.codePointAt(0) ?? 0) >= 0x80) return false
  return true
}

export function domainToAscii(host: string): string {
  if (host.startsWith("[")) return host
  return host
    .split(".")
    .map((label) => {
      if (isAsciiLabel(label)) return label
      const mapped = label.normalize("NFC").toLowerCase()
      return isAsciiLabel(mapped) ? mapped : PREFIX + punycodeEncode(mapped)
    })
    .join(".")
}

export function domainToUnicode(host: string): string {
  if (host.startsWith("[")) return host
  return host
    .split(".")
    .map((label) => {
      const lower = label.toLowerCase()
      return lower.startsWith(PREFIX) ? punycodeDecode(lower.slice(PREFIX.length)) : label
    })
    .join(".")
}
