/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  roots: ["<rootDir>/__tests__"],
  testRegex: ".*\\.test\\.(ts|tsx)$",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^next/headers$": "<rootDir>/__mocks__/next-headers.ts",
    "^next/navigation$": "<rootDir>/__mocks__/next-navigation.ts",
    "^next/image$": "<rootDir>/__mocks__/next-image.tsx",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
};

module.exports = config;
