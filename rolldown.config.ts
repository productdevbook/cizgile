import { defineConfig, type RolldownOptions } from "rolldown"
import { dts } from "rolldown-plugin-dts"

const config: RolldownOptions = defineConfig({
  input: {
    index: "src/index.ts",
    uri: "src/uri.ts",
    transliterate: "src/transliterate.ts",
  },
  platform: "neutral",
  treeshake: true,
  plugins: [dts({ generator: "oxc", tsconfig: "./tsconfig.json" })],
  output: {
    dir: "dist",
    format: "es",
    cleanDir: true,
    entryFileNames: "[name].mjs",
    chunkFileNames: "shared/[name]-[hash].mjs",
    sourcemap: false,
    minify: false,
  },
})

export default config
