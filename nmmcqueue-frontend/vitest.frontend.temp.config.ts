import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "../tests/unit/frontend/**/*.test.ts",
      "../tests/unit/frontend/**/*.test.tsx",
      "../tests/integration/frontend/**/*.test.ts",
      "../tests/integration/frontend/**/*.test.tsx",
    ],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "../tests/reports/coverage/frontend-vitest",
      reporter: ["text", "html", "json"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime.js"),
      "@testing-library/react": path.resolve(__dirname, "./node_modules/@testing-library/react"),
      "@testing-library/user-event": path.resolve(__dirname, "./node_modules/@testing-library/user-event"),
      "@testing-library/jest-dom/vitest": path.resolve(__dirname, "./node_modules/@testing-library/jest-dom/vitest.js"),
      "next/navigation": path.resolve(__dirname, "./tests/mocks/next-navigation.ts"),
    },
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, ".."),
      ],
    },
  },
});
