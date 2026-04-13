import path from "node:path";

export default {
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "tests/unit/frontend/**/*.test.ts",
      "tests/unit/frontend/**/*.test.tsx",
      "tests/integration/frontend/**/*.test.ts",
      "tests/integration/frontend/**/*.test.tsx",
    ],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "tests/reports/coverage/frontend-vitest",
      reporter: ["text", "html", "json"],
      include: ["nmmcqueue-frontend/src/**/*.{ts,tsx}"],
      exclude: ["nmmcqueue-frontend/src/**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../nmmcqueue-frontend/src"),
    },
  },
};
