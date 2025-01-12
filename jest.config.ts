import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Maps import paths to the corresponding module locations
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
    '@testing-library/react/dont-cleanup-after-each', // Optional, to avoid cleanup conflicts
  ],
  coverageDirectory: 'coverage',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
};

export default config;
