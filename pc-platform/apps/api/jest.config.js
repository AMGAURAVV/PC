const path = require('path');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: path.resolve(__dirname, 'tsconfig.json') }],
  },
  moduleNameMapper: {
    '^@pc-platform/database$': path.resolve(__dirname, '../../packages/database/dist/index.js'),
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
