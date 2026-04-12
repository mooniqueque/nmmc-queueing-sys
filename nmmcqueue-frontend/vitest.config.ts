import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "../../tests/unit/frontend/**/*.test.ts",
      "../../tests/unit/frontend/**/*.test.tsx",
      "../../tests/integration/frontend/**/*.test.ts",
      "../../tests/integration/frontend/**/*.test.tsx"
    ],
    setupFiles: [],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "../../tests/reports/coverage/frontend-vitest",
      reporter: ["text", "html", "json"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
