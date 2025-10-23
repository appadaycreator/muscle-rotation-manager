/**
 * 筋トレ部位ローテーション管理システム - ユニットテストランナー
 * テスト駆動開発用の軽量テストフレームワーク
 */

// Node.js環境でDOM環境をセットアップ
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    try {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });
        
        global.window = dom.window;
        global.document = dom.window.document;
        global.HTMLElement = dom.window.HTMLElement;
        global.Event = dom.window.Event;
        global.CustomEvent = dom.window.CustomEvent;
        global.localStorage = dom.window.localStorage;
        
        // navigatorは読み取り専用なので、別の方法で設定
        Object.defineProperty(global, 'navigator', {
            value: dom.window.navigator,
            writable: true
        });
        
        console.log('✅ DOM environment initialized for testing');
    } catch (error) {
        console.warn('⚠️ JSDOM not available, DOM tests may fail:', error.message);
        
        // フォールバック: 最小限のDOM環境を手動で作成
        global.document = {
            createElement: () => ({
                id: '',
                className: '',
                textContent: '',
                innerHTML: '',
                addEventListener: () => {},
                removeEventListener: () => {},
                appendChild: () => {},
                removeChild: () => {},
                querySelector: () => null,
                querySelectorAll: () => []
            }),
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => [],
            body: {
                appendChild: () => {},
                removeChild: () => {}
            }
        };
        
        // localStorage のモック実装
        const localStorageMock = {
            store: {},
            getItem: function(key) {
                return this.store[key] || null;
            },
            setItem: function(key, value) {
                this.store[key] = value.toString();
            },
            removeItem: function(key) {
                delete this.store[key];
            },
            clear: function() {
                this.store = {};
            }
        };
        
        global.localStorage = localStorageMock;
        global.window = { 
            document: global.document,
            localStorage: localStorageMock
        };
    }
}

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
        this.beforeEachCallbacks = [];
        this.afterEachCallbacks = [];
        this.beforeAllCallbacks = [];
        this.afterAllCallbacks = [];
    }

    /**
     * テストケースを追加
     * @param {string} description - テストの説明
     * @param {Function} testFunction - テスト関数
     */
    test(description, testFunction) {
        this.tests.push({ description, testFunction });
    }

    /**
     * テストスイートを定義
     * @param {string} suiteName - スイート名
     * @param {Function} suiteFunction - スイート関数
     */
    describe(suiteName, suiteFunction) {
        console.log(`\n📋 テストスイート: ${suiteName}`);
        console.log('='.repeat(50));
        suiteFunction();
    }

    /**
     * 各テスト前に実行
     * @param {Function} callback - コールバック関数
     */
    beforeEach(callback) {
        this.beforeEachCallbacks.push(callback);
    }

    /**
     * 各テスト後に実行
     * @param {Function} callback - コールバック関数
     */
    afterEach(callback) {
        this.afterEachCallbacks.push(callback);
    }

    /**
     * 全テスト前に実行
     * @param {Function} callback - コールバック関数
     */
    beforeAll(callback) {
        this.beforeAllCallbacks.push(callback);
    }

    /**
     * 全テスト後に実行
     * @param {Function} callback - コールバック関数
     */
    afterAll(callback) {
        this.afterAllCallbacks.push(callback);
    }

    /**
     * アサーション関数群
     */
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`期待値: ${expected}, 実際の値: ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`期待値: ${JSON.stringify(expected)}, 実際の値: ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`期待値: truthy, 実際の値: ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`期待値: falsy, 実際の値: ${actual}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`期待値: "${expected}"を含む, 実際の値: ${actual}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`期待値: 長さ${expected}, 実際の値: 長さ${actual.length}`);
                }
            },
            toThrow: () => {
                try {
                    actual();
                    throw new Error('例外が発生することを期待しましたが、発生しませんでした');
                } catch (error) {
                    // 期待通り例外が発生
                }
            },
            toBeInstanceOf: (expected) => {
                if (!(actual instanceof expected)) {
                    throw new Error(`期待値: ${expected.name}のインスタンス, 実際の値: ${actual.constructor.name}`);
                }
            },
            toHaveBeenCalled: () => {
                if (!actual.calls || actual.callCount === 0) {
                    throw new Error('期待値: 関数が呼び出される, 実際の値: 呼び出されていない');
                }
            },
            toHaveBeenCalledWith: (...expectedArgs) => {
                if (!actual.calls) {
                    throw new Error('期待値: モック関数, 実際の値: 通常の関数');
                }
                const found = actual.calls.some(call => 
                    JSON.stringify(call) === JSON.stringify(expectedArgs)
                );
                if (!found) {
                    throw new Error(`期待値: ${JSON.stringify(expectedArgs)}で呼び出される, 実際の値: ${JSON.stringify(actual.calls)}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`期待値: ${expected}より大きい, 実際の値: ${actual}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`期待値: ${expected}より小さい, 実際の値: ${actual}`);
                }
            },
            toBeGreaterThanOrEqual: (expected) => {
                if (actual < expected) {
                    throw new Error(`期待値: ${expected}以上, 実際の値: ${actual}`);
                }
            },
            toBeLessThanOrEqual: (expected) => {
                if (actual > expected) {
                    throw new Error(`期待値: ${expected}以下, 実際の値: ${actual}`);
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error(`期待値: 定義されている, 実際の値: undefined`);
                }
            },
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`期待値: undefined, 実際の値: ${actual}`);
                }
            }
        };
    }

    /**
     * モック関数を作成
     * @param {Function} implementation - モック実装
     * @returns {Function} モック関数
     */
    mock(implementation = () => {}) {
        const mockFn = (...args) => {
            mockFn.calls.push(args);
            mockFn.callCount++;
            return implementation(...args);
        };
        
        mockFn.calls = [];
        mockFn.callCount = 0;
        mockFn.mockReturnValue = (value) => {
            implementation = () => value;
            return mockFn;
        };
        mockFn.mockImplementation = (impl) => {
            implementation = impl;
            return mockFn;
        };
        
        return mockFn;
    }

    /**
     * 全テストを実行
     */
    async run() {
        console.log('🚀 テスト実行開始');
        console.log(`📊 総テスト数: ${this.tests.length}`);
        console.log('='.repeat(60));

        // beforeAll実行
        for (const callback of this.beforeAllCallbacks) {
            await callback();
        }

        this.results.total = this.tests.length;
        const startTime = Date.now();

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            
            try {
                // beforeEach実行
                for (const callback of this.beforeEachCallbacks) {
                    await callback();
                }

                // テスト実行
                await test.testFunction();
                
                // afterEach実行
                for (const callback of this.afterEachCallbacks) {
                    await callback();
                }

                this.results.passed++;
                console.log(`✅ ${i + 1}. ${test.description}`);
                
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({
                    test: test.description,
                    error: error.message,
                    stack: error.stack
                });
                console.log(`❌ ${i + 1}. ${test.description}`);
                console.log(`   エラー: ${error.message}`);
            }
        }

        // afterAll実行
        for (const callback of this.afterAllCallbacks) {
            await callback();
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        this.printResults(duration);
        return this.results;
    }

    /**
     * テスト結果を出力
     * @param {number} duration - 実行時間
     */
    printResults(duration) {
        console.log('\n' + '='.repeat(60));
        console.log('📈 テスト結果サマリー');
        console.log('='.repeat(60));
        console.log(`✅ 成功: ${this.results.passed}`);
        console.log(`❌ 失敗: ${this.results.failed}`);
        console.log(`📊 総計: ${this.results.total}`);
        console.log(`⏱️  実行時間: ${duration}ms`);
        console.log(`📈 成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.errors.length > 0) {
            console.log('\n🚨 エラー詳細:');
            console.log('-'.repeat(40));
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test}`);
                console.log(`   エラー: ${error.error}`);
                if (error.stack) {
                    console.log(`   スタック: ${error.stack.split('\n')[1]?.trim() || 'N/A'}`);
                }
                console.log('');
            });
        }

        // 結果をJSONファイルに保存
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const resultData = {
                ...this.results,
                duration,
                timestamp: new Date().toISOString(),
                successRate: ((this.results.passed / this.results.total) * 100).toFixed(1)
            };
            fs.writeFileSync('tests/results/unit-test-results.json', JSON.stringify(resultData, null, 2));
        }
    }

    /**
     * テストをリセット
     */
    reset() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
        this.beforeEachCallbacks = [];
        this.afterEachCallbacks = [];
        this.beforeAllCallbacks = [];
        this.afterAllCallbacks = [];
    }
}

// グローバルインスタンス
const testRunner = new TestRunner();

// ESモジュールのexport
export { TestRunner };
export const test = testRunner.test.bind(testRunner);
export const describe = testRunner.describe.bind(testRunner);
export const expect = testRunner.expect.bind(testRunner);
export const beforeEach = testRunner.beforeEach.bind(testRunner);
export const afterEach = testRunner.afterEach.bind(testRunner);
export const beforeAll = testRunner.beforeAll.bind(testRunner);
export const afterAll = testRunner.afterAll.bind(testRunner);
export const mock = testRunner.mock.bind(testRunner);
export const runTests = testRunner.run.bind(testRunner);
export { testRunner };

// 即座にグローバル関数を設定（Node.js環境）
if (typeof global !== 'undefined') {
    global.test = testRunner.test.bind(testRunner);
    global.describe = testRunner.describe.bind(testRunner);
    global.expect = testRunner.expect.bind(testRunner);
    global.beforeEach = testRunner.beforeEach.bind(testRunner);
    global.afterEach = testRunner.afterEach.bind(testRunner);
    global.beforeAll = testRunner.beforeAll.bind(testRunner);
    global.afterAll = testRunner.afterAll.bind(testRunner);
    global.mock = testRunner.mock.bind(testRunner);
    global.runTests = testRunner.run.bind(testRunner);
    global.testRunner = testRunner;
}

// グローバル関数として公開
if (typeof window !== 'undefined') {
    // ブラウザ環境
    window.test = testRunner.test.bind(testRunner);
    window.describe = testRunner.describe.bind(testRunner);
    window.expect = testRunner.expect.bind(testRunner);
    window.beforeEach = testRunner.beforeEach.bind(testRunner);
    window.afterEach = testRunner.afterEach.bind(testRunner);
    window.beforeAll = testRunner.beforeAll.bind(testRunner);
    window.afterAll = testRunner.afterAll.bind(testRunner);
    window.mock = testRunner.mock.bind(testRunner);
    window.runTests = testRunner.run.bind(testRunner);
    window.testRunner = testRunner;
} else if (typeof module !== 'undefined') {
    // Node.js環境
    // 即座にグローバルスコープに関数を設定
    global.test = testRunner.test.bind(testRunner);
    global.describe = testRunner.describe.bind(testRunner);
    global.expect = testRunner.expect.bind(testRunner);
    global.beforeEach = testRunner.beforeEach.bind(testRunner);
    global.afterEach = testRunner.afterEach.bind(testRunner);
    global.beforeAll = testRunner.beforeAll.bind(testRunner);
    global.afterAll = testRunner.afterAll.bind(testRunner);
    global.mock = testRunner.mock.bind(testRunner);
    global.runTests = testRunner.run.bind(testRunner);
    global.testRunner = testRunner;
    
    console.log('✅ Test functions exported to global scope');
    
    module.exports = {
        TestRunner,
        test: testRunner.test.bind(testRunner),
        describe: testRunner.describe.bind(testRunner),
        expect: testRunner.expect.bind(testRunner),
        beforeEach: testRunner.beforeEach.bind(testRunner),
        afterEach: testRunner.afterEach.bind(testRunner),
        beforeAll: testRunner.beforeAll.bind(testRunner),
        afterAll: testRunner.afterAll.bind(testRunner),
        mock: testRunner.mock.bind(testRunner),
        runTests: testRunner.run.bind(testRunner),
        testRunner
    };
}


// Node.js環境で直接実行された場合のテスト実行
if (typeof module !== 'undefined' && require.main === module) {
    // ユニットテストを読み込んで実行
    try {
        require('./muscle-groups.test.js');
        require('./validation.test.js');
        require('./page-modules.test.js');
        require('./workout-save.test.js');
        require('./error-handler.test.js');
        testRunner.run().then(() => {
            process.exit(testRunner.results.failed > 0 ? 1 : 0);
        });
    } catch (error) {
        console.error('テストファイルの読み込みに失敗しました:', error.message);
        process.exit(1);
    }
}
