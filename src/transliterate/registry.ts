import type { Locale } from "./types"

const registered = new Map<string, Locale>()
let version = 0

/** A counter that changes whenever the registry does, so cached option resolutions can tell they are stale. */
export function registryVersion(): number {
  return version
}

/** Makes `slugify` accept each locale's `id` as a string, for locales whose tables do not ship with the main entry (`registerLocale(ru, uk)`). Later registrations win. */
export function registerLocale(...locales: readonly Locale[]): void {
  for (const locale of locales) registered.set(locale.id, locale)
  version += 1
}

/** Removes a locale registered with `registerLocale`; the built-in Latin ids cannot be removed. */
export function unregisterLocale(id: string): boolean {
  const removed = registered.delete(id)
  if (removed) version += 1
  return removed
}

/** The locale registered under `id`, if any. */
export function registeredLocale(id: string): Locale | undefined {
  return registered.get(id)
}
