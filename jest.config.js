// jest.config.js - Jest設定ファイル

export default {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: [
        'js/core/**/*.js',
        'js/components/**/*.js',
        'js/pages/**/*.js',
        'js/services/**/*.js',
        'js/utils/**/*.js',
        '!js/**/*.test.js',
        '!js/**/*.spec.js',
        '!**/node_modules/**'
    ],
    coverageThreshold: {
        global: {
            branches: 98,
            functions: 98,
            lines: 98,
            statements: 98
        }
    },
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/js/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$))'
    ],
    moduleFileExtensions: ['js', 'json'],
    testTimeout: 10000,
    verbose: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};