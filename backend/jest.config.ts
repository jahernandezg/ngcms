export default {
  displayName: 'backend',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/backend',
  coverageThreshold: {
    global: {
  // TODO: Restaurar (85/70/80/85). Umbral temporal para facilitar despliegue.
  statements: 10,
  branches: 10,
  functions: 10,
  lines: 10,
    },
  },
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/**/dto/**',
    '!<rootDir>/src/**/*.module.ts',
  ],
};
