module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000,
  setupFiles: ["./tests/jest.setup.js"],
  globalTeardown: "./tests/globalTeardown.js",
};
