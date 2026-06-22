/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    roots: ['<rootDir>/test', '<rootDir>/lib'],
    testRegex: '.*\\.spec\\.ts$',
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleNameMapper: {
        '^@hodfords/nestjs-transaction$': '<rootDir>/lib'
    },
    collectCoverageFrom: ['lib/**/*.ts', '!lib/**/index.ts', '!lib/types/**'],
    coverageDirectory: 'coverage',
    setupFiles: ['<rootDir>/test/setup.ts']
};
