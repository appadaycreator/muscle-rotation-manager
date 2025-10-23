// error-handling.test.js - エラーハンドリングのテスト

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// テスト対象のモジュールをモック
const mockShowNotification = vi.fn();

vi.mock('../js/utils/helpers.js', () => ({
    showNotification: mockShowNotification
}));

// エラーハンドラーのモック実装
class MockErrorHandler {
    constructor() {
        this.ERROR_TYPES = {
            NETWORK: 'NETWORK',
            AUTH: 'AUTH',
            DATABASE: 'DATABASE',
            VALIDATION: 'VALIDATION',
            STORAGE: 'STORAGE',
            PERMISSION: 'PERMISSION',
            QUOTA: 'QUOTA',
            TIMEOUT: 'TIMEOUT',
            UNKNOWN: 'UNKNOWN'
        };

        this.ERROR_MESSAGES = {
            [this.ERROR_TYPES.NETWORK]: {
                default: {
                    message: 'インターネット接続に問題があります',
                    description: 'ネットワークエラーが発生しました',
                    solutions: [
                        'Wi-Fiまたはモバイルデータ接続を確認してください',
                        'ルーターの電源を一度切って再起動してください',
                        'しばらく時間をおいて再試行してください'
                    ],
                    severity: 'warning'
                },
                offline: {
                    message: 'オフライン状態です',
                    description: 'インターネット接続が切断されています',
                    solutions: [
                        'Wi-Fi設定を確認してください',
                        'モバイルデータがオンになっているか確認してください',
                        '機内モードがオフになっているか確認してください'
                    ],
                    severity: 'error'
                }
            },
            [this.ERROR_TYPES.VALIDATION]: {
                default: {
                    message: '入力内容を確認してください',
                    description: '入力値に問題があります',
                    solutions: [
                        '必須項目がすべて入力されているか確認してください',
                        '入力形式が正しいか確認してください',
                        '文字数制限を確認してください'
                    ],
                    severity: 'warning'
                }
            }
        };
    }

    determineErrorType(error) {
        const errorMessage = typeof error === 'string' ? error : error?.message || '';
        
        if (!navigator.onLine) {
            return this.ERROR_TYPES.NETWORK;
        }
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            return this.ERROR_TYPES.NETWORK;
        }
        
        if (errorMessage.includes('validation') || errorMessage.includes('required')) {
            return this.ERROR_TYPES.VALIDATION;
        }
        
        return this.ERROR_TYPES.UNKNOWN;
    }

    determineSpecificErrorKey(error) {
        const errorMessage = typeof error === 'string' ? error : error?.message || '';
        
        if (!navigator.onLine) {
            return 'offline';
        }
        
        return 'default';
    }

    getErrorMessage(errorType, specificKey = 'default') {
        const typeMessages = this.ERROR_MESSAGES[errorType];
        if (!typeMessages) {
            return this.ERROR_MESSAGES[this.ERROR_TYPES.UNKNOWN]?.default || {
                message: '予期しないエラーが発生しました',
                description: '原因不明のエラーです',
                solutions: ['ページを再読み込みしてください'],
                severity: 'error'
            };
        }
        
        return typeMessages[specificKey] || typeMessages.default;
    }

    handleError(error, options = {}) {
        const {
            context = 'Unknown',
            showNotification: shouldShowNotification = true,
            logToConsole = true,
            onRetry = null,
            maxRetries = 0,
            showSolutions = true
        } = options;

        const errorType = this.determineErrorType(error);
        const specificKey = this.determineSpecificErrorKey(error);
        const errorData = this.getErrorMessage(errorType, specificKey);

        const errorInfo = {
            type: errorType,
            errorData,
            originalError: error,
            context,
            timestamp: new Date().toISOString(),
            canRetry: this.shouldAllowRetry(errorType),
            retryCount: 0,
            maxRetries,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        if (logToConsole) {
            const logLevel = errorData.severity === 'error' ? 'error' : 'warn';
            console[logLevel](`[${context}] ${errorType}:`, errorInfo);
        }

        if (shouldShowNotification) {
            if (showSolutions) {
                this.showUserFriendlyError(errorInfo);
            } else {
                mockShowNotification(errorData.message, this.getNotificationType(errorType));
            }
        }

        if (errorInfo.canRetry && onRetry && maxRetries > 0) {
            errorInfo.retry = async () => {
                if (errorInfo.retryCount < maxRetries) {
                    errorInfo.retryCount++;
                    try {
                        const result = await onRetry();
                        return result;
                    } catch (retryError) {
                        if (errorInfo.retryCount >= maxRetries) {
                            throw new Error(`最大リトライ回数(${maxRetries})に達しました`);
                        }
                        throw retryError;
                    }
                } else {
                    throw new Error('最大リトライ回数に達しました');
                }
            };
        }

        return errorInfo;
    }

    shouldAllowRetry(errorType) {
        const retryableTypes = [
            this.ERROR_TYPES.NETWORK,
            this.ERROR_TYPES.DATABASE,
            this.ERROR_TYPES.TIMEOUT
        ];
        return retryableTypes.includes(errorType);
    }

    getNotificationType(errorType) {
        switch (errorType) {
            case this.ERROR_TYPES.NETWORK:
                return 'warning';
            case this.ERROR_TYPES.AUTH:
            case this.ERROR_TYPES.DATABASE:
            case this.ERROR_TYPES.PERMISSION:
                return 'error';
            case this.ERROR_TYPES.VALIDATION:
            case this.ERROR_TYPES.STORAGE:
                return 'warning';
            default:
                return 'error';
        }
    }

    showUserFriendlyError(errorInfo) {
        const { errorData } = errorInfo;
        const { message, description, solutions, severity } = errorData;
        
        // ユーザーフレンドリーなエラー表示のシミュレート
        const errorDisplay = {
            message,
            description,
            solutions,
            severity,
            timestamp: errorInfo.timestamp
        };
        
        // モック関数を呼び出し
        mockShowNotification(message, severity);
        
        return errorDisplay;
    }

    executeWithRetry(asyncFn, options = {}) {
        const {
            maxRetries = 3,
            retryDelay = 1000,
            backoffMultiplier = 2,
            context = 'Async operation'
        } = options;

        return new Promise(async (resolve, reject) => {
            let lastError;
            let delay = retryDelay;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const result = await asyncFn();
                    resolve(result);
                    return;
                } catch (error) {
                    lastError = error;
                    const errorType = this.determineErrorType(error);

                    if (!this.shouldAllowRetry(errorType)) {
                        reject(this.handleError(error, { context }).originalError);
                        return;
                    }

                    if (attempt === maxRetries) {
                        break;
                    }

                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= backoffMultiplier;
                }
            }

            reject(this.handleError(lastError, {
                context: `${context} (${maxRetries + 1}回試行後)`
            }).originalError);
        });
    }
}

describe('エラーハンドリング', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new MockErrorHandler();
        vi.clearAllMocks();
        
        // navigator.onLineをモック
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('エラータイプの判定', () => {
        it('ネットワークエラーを正しく判定する', () => {
            const networkError = new Error('fetch failed');
            const errorType = errorHandler.determineErrorType(networkError);
            
            expect(errorType).toBe(errorHandler.ERROR_TYPES.NETWORK);
        });

        it('オフライン状態を正しく判定する', () => {
            navigator.onLine = false;
            
            const error = new Error('Some error');
            const errorType = errorHandler.determineErrorType(error);
            
            expect(errorType).toBe(errorHandler.ERROR_TYPES.NETWORK);
        });

        it('バリデーションエラーを正しく判定する', () => {
            const validationError = new Error('validation failed');
            const errorType = errorHandler.determineErrorType(validationError);
            
            expect(errorType).toBe(errorHandler.ERROR_TYPES.VALIDATION);
        });

        it('不明なエラーを正しく判定する', () => {
            const unknownError = new Error('unknown error');
            const errorType = errorHandler.determineErrorType(unknownError);
            
            expect(errorType).toBe(errorHandler.ERROR_TYPES.UNKNOWN);
        });
    });

    describe('エラーメッセージの取得', () => {
        it('デフォルトメッセージを取得する', () => {
            const message = errorHandler.getErrorMessage(errorHandler.ERROR_TYPES.NETWORK);
            
            expect(message).toHaveProperty('message');
            expect(message).toHaveProperty('description');
            expect(message).toHaveProperty('solutions');
            expect(message).toHaveProperty('severity');
            expect(message.message).toBe('インターネット接続に問題があります');
        });

        it('特定のメッセージを取得する', () => {
            const message = errorHandler.getErrorMessage(errorHandler.ERROR_TYPES.NETWORK, 'offline');
            
            expect(message.message).toBe('オフライン状態です');
            expect(message.severity).toBe('error');
        });

        it('存在しないエラータイプの場合はデフォルトを返す', () => {
            const message = errorHandler.getErrorMessage('INVALID_TYPE');
            
            expect(message).toHaveProperty('message');
            expect(message.message).toBe('予期しないエラーが発生しました');
        });
    });

    describe('エラーハンドリング', () => {
        it('基本的なエラーハンドリングが動作する', () => {
            const error = new Error('test error');
            const errorInfo = errorHandler.handleError(error, {
                context: 'テストコンテキスト'
            });
            
            expect(errorInfo).toHaveProperty('type');
            expect(errorInfo).toHaveProperty('errorData');
            expect(errorInfo).toHaveProperty('originalError', error);
            expect(errorInfo).toHaveProperty('context', 'テストコンテキスト');
            expect(errorInfo).toHaveProperty('timestamp');
        });

        it('通知が表示される', () => {
            const error = new Error('test error');
            errorHandler.handleError(error, {
                showNotification: true
            });
            
            expect(mockShowNotification).toHaveBeenCalled();
        });

        it('通知を無効にできる', () => {
            const error = new Error('test error');
            errorHandler.handleError(error, {
                showNotification: false
            });
            
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it('コンソールログが出力される', () => {
            const consoleSpy = vi.spyOn(console, 'warn');
            
            const error = new Error('test error');
            errorHandler.handleError(error, {
                logToConsole: true
            });
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('リトライ機能', () => {
        it('リトライ可能なエラーでリトライ関数が設定される', () => {
            const networkError = new Error('network error');
            const retryFn = vi.fn().mockResolvedValue('success');
            
            const errorInfo = errorHandler.handleError(networkError, {
                onRetry: retryFn,
                maxRetries: 3
            });
            
            expect(errorInfo.canRetry).toBe(true);
            expect(errorInfo.retry).toBeDefined();
        });

        it('リトライが正常に動作する', async () => {
            const networkError = new Error('network error');
            const retryFn = vi.fn().mockResolvedValue('success');
            
            const errorInfo = errorHandler.handleError(networkError, {
                onRetry: retryFn,
                maxRetries: 3
            });
            
            const result = await errorInfo.retry();
            
            expect(result).toBe('success');
            expect(retryFn).toHaveBeenCalledTimes(1);
            expect(errorInfo.retryCount).toBe(1);
        });

        it('最大リトライ回数に達すると失敗する', async () => {
            const networkError = new Error('network error');
            const retryFn = vi.fn().mockRejectedValue(new Error('retry failed'));
            
            const errorInfo = errorHandler.handleError(networkError, {
                onRetry: retryFn,
                maxRetries: 2
            });
            
            // 最大回数までリトライ
            try {
                await errorInfo.retry();
                await errorInfo.retry();
                await errorInfo.retry(); // これで失敗するはず
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('最大リトライ回数');
            }
            
            expect(retryFn).toHaveBeenCalledTimes(2);
        });

        it('リトライ不可能なエラーではリトライ関数が設定されない', () => {
            const validationError = new Error('validation error');
            const retryFn = vi.fn();
            
            const errorInfo = errorHandler.handleError(validationError, {
                onRetry: retryFn,
                maxRetries: 3
            });
            
            expect(errorInfo.canRetry).toBe(false);
            expect(errorInfo.retry).toBeUndefined();
        });
    });

    describe('executeWithRetry', () => {
        it('成功する関数は1回で完了する', async () => {
            const successFn = vi.fn().mockResolvedValue('success');
            
            const result = await errorHandler.executeWithRetry(successFn);
            
            expect(result).toBe('success');
            expect(successFn).toHaveBeenCalledTimes(1);
        });

        it('失敗する関数は指定回数リトライする', async () => {
            const failFn = vi.fn()
                .mockRejectedValueOnce(new Error('network error'))
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValue('success');
            
            const result = await errorHandler.executeWithRetry(failFn, {
                maxRetries: 3
            });
            
            expect(result).toBe('success');
            expect(failFn).toHaveBeenCalledTimes(3);
        });

        it('リトライ不可能なエラーは即座に失敗する', async () => {
            const failFn = vi.fn().mockRejectedValue(new Error('validation error'));
            
            try {
                await errorHandler.executeWithRetry(failFn, {
                    maxRetries: 3
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toBe('validation error');
                expect(failFn).toHaveBeenCalledTimes(1);
            }
        });

        it('最大リトライ回数に達すると失敗する', async () => {
            const failFn = vi.fn().mockRejectedValue(new Error('network error'));
            
            try {
                await errorHandler.executeWithRetry(failFn, {
                    maxRetries: 2
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(failFn).toHaveBeenCalledTimes(3); // 初回 + 2回リトライ
            }
        });
    });

    describe('ユーザーフレンドリーエラー表示', () => {
        it('解決方法付きエラーが表示される', () => {
            const error = new Error('network error');
            const errorInfo = errorHandler.handleError(error, {
                showSolutions: true
            });
            
            expect(errorInfo.errorData.solutions).toBeDefined();
            expect(errorInfo.errorData.solutions.length).toBeGreaterThan(0);
            expect(mockShowNotification).toHaveBeenCalled();
        });

        it('重要度に応じた色分けが設定される', () => {
            const networkError = new Error('network error');
            const validationError = new Error('validation error');
            
            const networkErrorInfo = errorHandler.handleError(networkError);
            const validationErrorInfo = errorHandler.handleError(validationError);
            
            expect(networkErrorInfo.errorData.severity).toBe('warning');
            expect(validationErrorInfo.errorData.severity).toBe('warning');
        });

        it('オフライン状態では適切なメッセージが表示される', () => {
            navigator.onLine = false;
            
            const error = new Error('some error');
            const errorInfo = errorHandler.handleError(error);
            
            expect(errorInfo.errorData.message).toBe('オフライン状態です');
            expect(errorInfo.errorData.severity).toBe('error');
        });
    });

    describe('エラーログ', () => {
        it('エラー情報が適切に記録される', () => {
            const error = new Error('test error');
            const errorInfo = errorHandler.handleError(error, {
                context: 'テストコンテキスト'
            });
            
            expect(errorInfo.userAgent).toBe(navigator.userAgent);
            expect(errorInfo.url).toBe(window.location.href);
            expect(errorInfo.timestamp).toBeDefined();
        });
    });

    describe('パフォーマンス', () => {
        it('大量のエラー処理でもパフォーマンスが維持される', () => {
            const startTime = performance.now();
            
            // 1000回のエラー処理
            for (let i = 0; i < 1000; i++) {
                const error = new Error(`error ${i}`);
                errorHandler.handleError(error, {
                    showNotification: false,
                    logToConsole: false
                });
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 100ms以内で完了することを期待
            expect(duration).toBeLessThan(100);
        });

        it('メモリリークが発生しない', () => {
            const initialMemory = performance.memory?.usedJSHeapSize || 0;
            
            // 大量のエラー処理
            for (let i = 0; i < 10000; i++) {
                const error = new Error(`error ${i}`);
                errorHandler.handleError(error, {
                    showNotification: false,
                    logToConsole: false
                });
            }
            
            // ガベージコレクションを促す
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = performance.memory?.usedJSHeapSize || 0;
            const memoryIncrease = finalMemory - initialMemory;
            
            // メモリ使用量の増加が2MB以下であることを期待
            expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
        });
    });
});

describe('エラーハンドリング統合テスト', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new MockErrorHandler();
        vi.clearAllMocks();
    });

    it('実際のワークフローでエラーハンドリングが動作する', async () => {
        // ネットワークエラーをシミュレート
        const networkOperation = vi.fn()
            .mockRejectedValueOnce(new Error('fetch failed'))
            .mockRejectedValueOnce(new Error('fetch failed'))
            .mockResolvedValue({ data: 'success' });

        const result = await errorHandler.executeWithRetry(networkOperation, {
            maxRetries: 3,
            retryDelay: 10, // テスト用に短縮
            context: 'データ取得'
        });

        expect(result).toEqual({ data: 'success' });
        expect(networkOperation).toHaveBeenCalledTimes(3);
    });

    it('複数のエラータイプが適切に処理される', () => {
        const errors = [
            new Error('fetch failed'),
            new Error('validation required'),
            new Error('unknown error')
        ];

        const errorInfos = errors.map(error => 
            errorHandler.handleError(error, { showNotification: false })
        );

        expect(errorInfos[0].type).toBe(errorHandler.ERROR_TYPES.NETWORK);
        expect(errorInfos[1].type).toBe(errorHandler.ERROR_TYPES.VALIDATION);
        expect(errorInfos[2].type).toBe(errorHandler.ERROR_TYPES.UNKNOWN);
    });

    it('オフライン・オンライン状態の変化が適切に処理される', () => {
        // オンライン状態
        navigator.onLine = true;
        const onlineError = new Error('network error');
        const onlineErrorInfo = errorHandler.handleError(onlineError, { showNotification: false });
        
        // オフライン状態
        navigator.onLine = false;
        const offlineError = new Error('network error');
        const offlineErrorInfo = errorHandler.handleError(offlineError, { showNotification: false });
        
        expect(onlineErrorInfo.errorData.message).toBe('インターネット接続に問題があります');
        expect(offlineErrorInfo.errorData.message).toBe('オフライン状態です');
    });
});

export { MockErrorHandler };
