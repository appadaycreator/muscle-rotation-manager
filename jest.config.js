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
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
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
    restoreMocks: true,
    // テスト結果ファイルの出力設定
    reporters: ['default'],
    // カバレッジレポートの出力設定
    coverageReporters: ['text', 'lcov', 'json', 'html'],
    coverageDirectory: 'coverage'
};