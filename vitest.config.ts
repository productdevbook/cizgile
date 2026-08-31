import { defineConfig, type ViteUserConfig } from "vitest/config"

const config: ViteUserConfig = defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      thresholds: { statements: 95, branches: 90, functions: 100 },
    },
  },
})

export default config
