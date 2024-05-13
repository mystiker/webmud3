module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testEnvironment: "node",
  // Notwendig, damit die Dateiendung .js nicht an den Dateinamen angehängt wird
  moduleNameMapper: {
    "^(.+).js$": "$1",
  },
};
