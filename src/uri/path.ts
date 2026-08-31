import { normalizePercentEncoding } from "./percent"

function removeLastSegment(output: string): string {
  const index = output.lastIndexOf("/")
  return index === -1 ? "" : output.slice(0, index)
}

export function removeDotSegments(path: string): string {
  let input = path
  let output = ""
  while (input.length > 0) {
    if (input.startsWith("../")) {
      input = input.slice(3)
    } else if (input.startsWith("./")) {
      input = input.slice(2)
    } else if (input.startsWith("/./")) {
      input = input.slice(2)
    } else if (input === "/.") {
      input = "/"
    } else if (input.startsWith("/../")) {
      input = input.slice(3)
      output = removeLastSegment(output)
    } else if (input === "/..") {
      input = "/"
      output = removeLastSegment(output)
    } else if (input === "." || input === "..") {
      input = ""
    } else {
      const start = input.startsWith("/") ? 1 : 0
      const next = input.indexOf("/", start)
      const end = next === -1 ? input.length : next
      output += input.slice(0, end)
      input = input.slice(end)
    }
  }
  return output
}

export interface NormalizePathOptions {
  readonly trailingSlash?: "keep" | "add" | "remove"
}

export function normalizePath(path: string, options: NormalizePathOptions = {}): string {
  let out = removeDotSegments(normalizePercentEncoding(path))
  const mode = options.trailingSlash ?? "keep"
  if (mode === "add" && out.length > 0 && !out.endsWith("/")) out += "/"
  if (mode === "remove" && out.length > 1 && out.endsWith("/")) out = out.slice(0, -1)
  return out
}
