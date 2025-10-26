// eslint.config.js - ESLint v9対応の設定ファイル

import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                FileReader: 'readonly',
                File: 'readonly',
                Blob: 'readonly',
                FormData: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                EventTarget: 'readonly',
                Element: 'readonly',
                HTMLElement: 'readonly',
                Node: 'readonly',
                NodeList: 'readonly',
                HTMLCollection: 'readonly',
                DOMParser: 'readonly',
                XMLHttpRequest: 'readonly',
                Promise: 'readonly',
                Map: 'readonly',
                Set: 'readonly',
                WeakMap: 'readonly',
                WeakSet: 'readonly',
                Symbol: 'readonly',
                Proxy: 'readonly',
                Reflect: 'readonly',
                Array: 'readonly',
                Object: 'readonly',
                String: 'readonly',
                Number: 'readonly',
                Boolean: 'readonly',
                Date: 'readonly',
                RegExp: 'readonly',
                Math: 'readonly',
                JSON: 'readonly',
                Error: 'readonly',
                TypeError: 'readonly',
                ReferenceError: 'readonly',
                SyntaxError: 'readonly',
                RangeError: 'readonly',
                EvalError: 'readonly',
                URIError: 'readonly',
                Chart: 'readonly',
                Notification: 'readonly',
                navigator: 'readonly',
                performance: 'readonly',
                MessageChannel: 'readonly',
                PerformanceObserver: 'readonly',
                IntersectionObserver: 'readonly',
                crypto: 'readonly',
                indexedDB: 'readonly',
                Image: 'readonly',
                MutationObserver: 'readonly',
                SpeechSynthesisUtterance: 'readonly',
                speechSynthesis: 'readonly',
                requestAnimationFrame: 'readonly',
                btoa: 'readonly',
                atob: 'readonly',
                process: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'no-undef': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: 'error',
            curly: 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            'no-alert': 'warn',
            'no-debugger': 'warn',
            'no-duplicate-imports': 'error',
            'no-useless-return': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-template': 'error',
            'template-curly-spacing': ['error', 'never'],
            'object-shorthand': 'error',
            'quote-props': ['error', 'as-needed'],
            'no-trailing-spaces': 'error',
            'comma-dangle': ['error', 'never'],
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            indent: ['error', 4, { SwitchCase: 1 }],
            'linebreak-style': ['error', 'unix'],
            'max-len': ['warn', { code: 100, ignoreUrls: true, ignoreStrings: true }]
        }
    },
    {
        files: ['**/*.html'],
        rules: {
            // HTMLファイル用のルール（必要に応じて追加）
        }
    },
    {
        files: ['js/utils/securityManager.js'],
        rules: {
            'no-eval': 'off',
            'no-new-func': 'off',
            'no-script-url': 'off'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'tests/**',
            '*.min.js',
            'app.js', // 古いファイルは除外
            'test-automation.js',
            'detailed-test.js',
            'direct-supabase-fix.js',
            'mcp-supabase-automation.js',
            'supabase-*.js',
            'update-config-template.js',
            'fix-*.js', // 修正用スクリプト
            'test-*.js', // テストスクリプト
            'sw.js', // Service Worker
            '**/*.html'
        ]
    }
];