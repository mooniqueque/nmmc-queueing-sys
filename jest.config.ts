import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      displayName: "backend",
      rootDir: ".",
      testEnvironment: "node",
      preset: "ts-jest",
      testMatch: [
        "<rootDir>/tests/unit/backend/**/*.test.ts",
        "<rootDir>/tests/integration/backend/**/*.test.ts"
      ],
      moduleFileExtensions: ["ts", "js", "json"],
      transform: {
        "^.+\\.ts$": [
          "ts-jest",
          {
            tsconfig: "<rootDir>/nmmcqueue-backend/tsconfig.json"
          }
        ]
      },
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
      },
      collectCoverageFrom: [
        "nmmcqueue-backend/src/**/*.ts",
        "!nmmcqueue-backend/src/**/*.d.ts",
        "!nmmcqueue-backend/src/server.ts"
      ],
      coverageDirectory: "<rootDir>/tests/reports/coverage/backend"
    },
    {
      displayName: "frontend",
      rootDir: ".",
      testEnvironment: "jsdom",
      preset: "ts-jest",
      testMatch: [
        "<rootDir>/tests/unit/frontend/**/*.test.ts",
        "<rootDir>/tests/unit/frontend/**/*.test.tsx",
        "<rootDir>/tests/integration/frontend/**/*.test.ts",
        "<rootDir>/tests/integration/frontend/**/*.test.tsx"
      ],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: "<rootDir>/nmmcqueue-frontend/tsconfig.json"
          }
        ]
      },
      collectCoverageFrom: [
        "nmmcqueue-frontend/src/**/*.{ts,tsx}",
        "!nmmcqueue-frontend/src/**/*.d.ts"
      ],
      coverageDirectory: "<rootDir>/tests/reports/coverage/frontend"
    }
  ]
};

export default config;
