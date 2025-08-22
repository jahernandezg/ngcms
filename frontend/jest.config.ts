export default {
  displayName: 'frontend',
  preset: '../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../coverage/frontend',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/main.server.ts',
    '!<rootDir>/src/server.ts',
    '!<rootDir>/src/app/**/nx-welcome.ts',
    '!<rootDir>/**/index.ts',
    '!<rootDir>/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      // MVP mínimo (elevar progresivamente):
      statements: 60,
      branches: 40,
      functions: 55,
      lines: 60,
    },
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
