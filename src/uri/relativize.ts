import { parseUri, serializeUri, type UriComponents } from "./parse"

function segments(path: string): string[] {
  return path.split("/").slice(1)
}

function relativePath(basePath: string, targetPath: string): string {
  const baseDirs = segments(basePath).slice(0, -1)
  const target = segments(targetPath)
  let common = 0
  while (
    common < baseDirs.length &&
    common < target.length - 1 &&
    baseDirs[common] === target[common]
  ) {
    common += 1
  }
  const ups = Array.from({ length: baseDirs.length - common }, () => "..")
  const parts = [...ups, ...target.slice(common)]
  let out = parts.join("/")
  if (out === "") out = "."
  const first = parts[0] ?? ""
  if (ups.length === 0 && first.includes(":")) out = "./" + out
  return out
}

function tail(target: UriComponents, query: boolean): string {
  const out: UriComponents = { path: "" }
  if (query && target.query !== undefined) out.query = target.query
  if (target.fragment !== undefined) out.fragment = target.fragment
  return serializeUri(out)
}

/** The shortest relative reference that resolves against `base` to `target`; the target itself when they share nothing. */
export function relativize(base: string, target: string): string {
  const b = parseUri(base)
  const t = parseUri(target)
  if (b.scheme === undefined || t.scheme === undefined) return target
  if (b.scheme.toLowerCase() !== t.scheme.toLowerCase()) return target
  if (b.authority !== t.authority) {
    const out: UriComponents = { path: t.path }
    if (t.authority !== undefined) out.authority = t.authority
    if (t.query !== undefined) out.query = t.query
    if (t.fragment !== undefined) out.fragment = t.fragment
    return serializeUri(out)
  }
  const basePath = b.path === "" && b.authority !== undefined ? "/" : b.path
  const targetPath = t.path === "" && t.authority !== undefined ? "/" : t.path
  if (!basePath.startsWith("/") || !targetPath.startsWith("/")) return target
  if (basePath === targetPath) {
    if (t.query === b.query) return tail(t, false)
    if (t.query !== undefined) return tail(t, true)
    const last = segments(targetPath).at(-1) ?? ""
    const ref = last === "" ? "." : last.includes(":") ? "./" + last : last
    return ref + tail(t, false)
  }
  return relativePath(basePath, targetPath) + tail(t, true)
}
