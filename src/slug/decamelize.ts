export function decamelize(input: string): string {
  return input
    .replace(/(\p{Lu}{2,})(\p{N}+)/gu, "$1 $2")
    .replace(/([\p{Ll}\p{N}]+)(\p{Lu}{2,})/gu, "$1 $2")
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}[\p{Ll}\p{N}]+)/gu, (match, head: string, tail: string) =>
      tail.length === 2 && tail.endsWith("s") ? match : `${head} ${tail}`,
    )
}
