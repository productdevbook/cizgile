import { readFileSync, writeFileSync } from "node:fs"

const [, , resultsPath, baselinePath, mode = "check"] = process.argv
const TOLERANCE = 0.3

const UPSTREAM = /built-in|@sindresorhus|simov/

function referenceFor(bench, references) {
  if (references.length === 1) return references[0]
  const wantsDecode = /decode/i.test(bench.name)
  const wantsAscii = /ASCII/.test(bench.name)
  return references.find(
    (r) => /decode/i.test(r.name) === wantsDecode && /ASCII/.test(r.name) === wantsAscii,
  )
}

function ratios(results) {
  const out = {}
  for (const file of results.testResults) {
    for (const group of file.assertionResults) {
      const tasks = group.benchmarks.flatMap((b) => b.tasks)
      const references = tasks.filter(
        (b) => b.name.includes("built-in") || b.name.startsWith("@sindresorhus"),
      )
      if (references.length === 0) continue
      for (const bench of tasks) {
        if (UPSTREAM.test(bench.name)) continue
        const reference = referenceFor(bench, references)
        if (reference === undefined) continue
        out[`${group.fullName} > ${bench.name}`] = Number(
          (bench.throughput.mean / reference.throughput.mean).toFixed(3),
        )
      }
    }
  }
  return out
}

const current = ratios(JSON.parse(readFileSync(resultsPath, "utf8")))
if (mode === "write") {
  writeFileSync(baselinePath, JSON.stringify(current, null, 2) + "\n")
  console.log(`wrote ${Object.keys(current).length} ratios to ${baselinePath}`)
  process.exit(0)
}
const baselineFile = JSON.parse(readFileSync(baselinePath, "utf8"))
const baseline = Array.isArray(baselineFile.testResults) ? ratios(baselineFile) : baselineFile
const rows = []
let failed = false
for (const [name, ratio] of Object.entries(current)) {
  const before = baseline[name]
  const status =
    before === undefined ? "new" : ratio < before * (1 - TOLERANCE) ? "REGRESSION" : "ok"
  if (status === "REGRESSION") failed = true
  rows.push(`| ${name} | ${before ?? "-"} | ${ratio} | ${status} |`)
}
const table = [
  "| group | baseline ratio | current ratio | status |",
  "| --- | --- | --- | --- |",
  ...rows,
].join("\n")
console.log(table)
if (process.env.GITHUB_STEP_SUMMARY)
  writeFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Benchmark ratios (cizgile / reference)\n\n${table}\n`,
    { flag: "a" },
  )
if (failed) {
  console.error(`a cizgile/reference ratio fell more than ${TOLERANCE * 100}% below the baseline`)
  process.exit(1)
}
