import type { SlugifyOptions } from "./options"
import { slugify } from "./slugify"
import { truncateSlug } from "./truncate"

/** A `slugify` that remembers what it handed out; see `createSlugger`. */
export interface Slugger {
  /** Slugifies `input`, appending `-2`, `-3`, ... when the slug was already handed out. */
  (input: string, options?: SlugifyOptions): string
  /** Forgets every slug handed out or reserved so far. */
  reset(): void
  /** Whether `slug` has already been handed out or reserved. */
  has(slug: string): boolean
  /** Marks `slug` as taken so it is never handed out again. */
  reserve(slug: string): void
}

function withSuffix(
  base: string,
  separator: string,
  n: number,
  maxLength: number | undefined,
): string {
  const suffix = separator + String(n)
  if (maxLength === undefined || base.length + suffix.length <= maxLength) return base + suffix
  const room = maxLength - suffix.length
  const head = room > 0 ? truncateSlug(base, room, separator) : ""
  return head === "" ? String(n).slice(0, maxLength) : head + suffix
}

/** A slugger that never repeats a slug: the second `"Hello"` becomes `"hello-2"`. `defaults` apply to every call. */
export function createSlugger(defaults: SlugifyOptions = {}): Slugger {
  const issued = new Set<string>()
  const counters = new Map<string, number>()

  const generate = (input: string, options?: SlugifyOptions): string => {
    const merged = options === undefined ? defaults : { ...defaults, ...options }
    const base = slugify(input, merged)
    if (base === "") return ""
    if (!issued.has(base)) {
      issued.add(base)
      return base
    }
    const separator = merged.separator ?? "-"
    let n = counters.get(base) ?? 1
    let candidate: string
    do {
      n += 1
      candidate = withSuffix(base, separator, n, merged.maxLength)
    } while (issued.has(candidate))
    counters.set(base, n)
    issued.add(candidate)
    return candidate
  }

  return Object.assign(generate, {
    reset(): void {
      issued.clear()
      counters.clear()
    },
    has(slug: string): boolean {
      return issued.has(slug)
    },
    reserve(slug: string): void {
      issued.add(slug)
    },
  })
}

/** Alias of `createSlugger`, under the name `@sindresorhus/slugify` uses. */
export const slugifyWithCounter: (defaults?: SlugifyOptions) => Slugger = createSlugger
