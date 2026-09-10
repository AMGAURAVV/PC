const path = require('path');

const tsJestPath = path.resolve(__dirname, '../../apps/api/node_modules/ts-jest');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [tsJestPath, { tsconfig: path.resolve(__dirname, 'tsconfig.json') }],
  },
  moduleNameMapper: {
    '^@pc-platform/types$': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    '^@pc-platform/validation$': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/main.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
