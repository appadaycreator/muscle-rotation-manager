/**
 * エラーハンドリング機能のユニットテスト
 */

// テストランナーはグローバルで利用可能

// エラーハンドラーのモック
const mockErrorHandler = {
    ERROR_TYPES: {
        NETWORK: 'NETWORK',
        CONNECTION: 'CONNECTION',
        AUTH: 'AUTH',
        DATABASE: 'DATABASE',
        VALIDATION: 'VALIDATION',
        STORAGE: 'STORAGE',
        PERMISSION: 'PERMISSION',
        QUOTA: 'QUOTA',
        TIMEOUT: 'TIMEOUT',
        SYNC: 'SYNC',
        UNKNOWN: 'UNKNOWN'
    },

    determineErrorType(error) {
        const errorMessage = typeof error === 'string' ? error : error?.message || '';
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            return this.ERROR_TYPES.NETWORK;
        }
        if (errorMessage.includes('Invalid login credentials')) {
            return this.ERROR_TYPES.AUTH;
        }
        if (errorMessage.includes('duplicate key') || errorMessage.includes('constraint')) {
            return this.ERROR_TYPES.DATABASE;
        }
        if (errorMessage.includes('validation') || errorMessage.includes('required')) {
            return this.ERROR_TYPES.VALIDATION;
        }
        
        return this.ERROR_TYPES.UNKNOWN;
    },

    getErrorMessage(errorType, specificKey = 'default') {
        const messages = {
            [this.ERROR_TYPES.NETWORK]: {
                default: {
                    message: 'インターネット接続に問題があります',
                    description: 'ネットワークエラーが発生しました',
                    solutions: ['Wi-Fi接続を確認してください', 'しばらく時間をおいて再試行してください'],
                    severity: 'warning'
                }
            },
            [this.ERROR_TYPES.AUTH]: {
                default: {
                    message: 'ログインが必要です',
                    description: '認証エラーが発生しました',
                    solutions: ['再度ログインしてください', 'パスワードを確認してください'],
                    severity: 'error'
                }
            },
            [this.ERROR_TYPES.DATABASE]: {
                default: {
                    message: 'データの処理に失敗しました',
                    description: 'データベースエラーが発生しました',
                    solutions: ['しばらく時間をおいて再試行してください', 'アプリを再起動してください'],
                    severity: 'error'
                }
            },
            [this.ERROR_TYPES.VALIDATION]: {
                default: {
                    message: '入力内容を確認してください',
                    description: '入力値に問題があります',
                    solutions: ['必須項目を入力してください', '入力形式を確認してください'],
                    severity: 'warning'
                }
            },
            [this.ERROR_TYPES.UNKNOWN]: {
                default: {
                    message: '予期しないエラーが発生しました',
                    description: '原因不明のエラーです',
                    solutions: ['ページを再読み込みしてください', 'サポートにお問い合わせください'],
                    severity: 'error'
                }
            }
        };

        return messages[errorType]?.[specificKey] || messages[this.ERROR_TYPES.UNKNOWN].default;
    },

    handleError(error, options = {}) {
        const errorType = this.determineErrorType(error);
        const errorData = this.getErrorMessage(errorType);
        
        const errorInfo = {
            type: errorType,
            errorData,
            originalError: error,
            context: options.context || 'Unknown',
            timestamp: new Date().toISOString(),
            canRetry: this.shouldAllowRetry(errorType)
        };

        // ログ出力のモック
        if (options.logToConsole !== false) {
            console.log(`Error handled: ${errorType} - ${errorData.message}`);
        }

        // 通知表示のモック
        if (options.showNotification !== false) {
            this.showUserFriendlyError(errorInfo, options);
        }

        return errorInfo;
    },

    shouldAllowRetry(errorType) {
        const retryableTypes = [
            this.ERROR_TYPES.NETWORK,
            this.ERROR_TYPES.CONNECTION,
            this.ERROR_TYPES.DATABASE,
            this.ERROR_TYPES.TIMEOUT,
            this.ERROR_TYPES.SYNC
        ];
        return retryableTypes.includes(errorType);
    },

    showUserFriendlyError(errorInfo, options = {}) {
        // 通知表示のモック
        return {
            id: `error-${Date.now()}`,
            message: errorInfo.errorData.message,
            description: errorInfo.errorData.description,
            solutions: errorInfo.errorData.solutions,
            severity: errorInfo.errorData.severity
        };
    },

    logErrorToStorage(errorInfo) {
        // ローカルストレージへの保存のモック
        const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        logs.push(errorInfo);
        localStorage.setItem('errorLogs', JSON.stringify(logs));
    },

    getErrorLogs() {
        return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    },

    clearErrorLogs() {
        localStorage.removeItem('errorLogs');
    }
};

// テストスイート
testRunner.describe('エラーハンドリング機能テスト', () => {
    testRunner.beforeEach(() => {
        // テスト前にエラーログをクリア
        mockErrorHandler.clearErrorLogs();
    });

    testRunner.test('determineErrorType correctly identifies network errors', () => {
        const networkError = new Error('fetch failed');
        const errorType = mockErrorHandler.determineErrorType(networkError);
        testRunner.expect(errorType).toBe(mockErrorHandler.ERROR_TYPES.NETWORK);
    });

    testRunner.test('determineErrorType correctly identifies auth errors', () => {
        const authError = new Error('Invalid login credentials');
        const errorType = mockErrorHandler.determineErrorType(authError);
        testRunner.expect(errorType).toBe(mockErrorHandler.ERROR_TYPES.AUTH);
    });

    testRunner.test('determineErrorType correctly identifies database errors', () => {
        const dbError = new Error('duplicate key constraint violation');
        const errorType = mockErrorHandler.determineErrorType(dbError);
        testRunner.expect(errorType).toBe(mockErrorHandler.ERROR_TYPES.DATABASE);
    });

    testRunner.test('determineErrorType correctly identifies validation errors', () => {
        const validationError = new Error('validation failed: required field missing');
        const errorType = mockErrorHandler.determineErrorType(validationError);
        testRunner.expect(errorType).toBe(mockErrorHandler.ERROR_TYPES.VALIDATION);
    });

    testRunner.test('determineErrorType returns UNKNOWN for unrecognized errors', () => {
        const unknownError = new Error('some random error');
        const errorType = mockErrorHandler.determineErrorType(unknownError);
        testRunner.expect(errorType).toBe(mockErrorHandler.ERROR_TYPES.UNKNOWN);
    });

    testRunner.test('getErrorMessage returns correct messages and solutions', () => {
        const errorMessage = mockErrorHandler.getErrorMessage(mockErrorHandler.ERROR_TYPES.NETWORK);
        
        testRunner.expect(errorMessage.message).toBe('インターネット接続に問題があります');
        testRunner.expect(errorMessage.description).toBe('ネットワークエラーが発生しました');
        testRunner.expect(errorMessage.solutions).toHaveLength(2);
        testRunner.expect(errorMessage.severity).toBe('warning');
    });

    testRunner.test('getErrorMessage returns default for unknown error types', () => {
        const errorMessage = mockErrorHandler.getErrorMessage('INVALID_TYPE');
        testRunner.expect(errorMessage.message).toBe('予期しないエラーが発生しました');
    });

    testRunner.test('handleError shows user-friendly notification', () => {
        const error = new Error('fetch failed');
        const errorInfo = mockErrorHandler.handleError(error, {
            context: 'Test context',
            showNotification: true
        });

        testRunner.expect(errorInfo.type).toBe(mockErrorHandler.ERROR_TYPES.NETWORK);
        testRunner.expect(errorInfo.context).toBe('Test context');
        testRunner.expect(errorInfo.canRetry).toBe(true);
    });

    testRunner.test('handleError logs to console', () => {
        let loggedMessage = '';
        const originalLog = console.log;
        console.log = (message) => { loggedMessage = message; };

        const error = new Error('test error');
        mockErrorHandler.handleError(error, { logToConsole: true });

        testRunner.expect(loggedMessage).toContain('Error handled');
        console.log = originalLog;
    });

    testRunner.test('handleError supports retry logic', () => {
        const networkError = new Error('network timeout');
        const errorInfo = mockErrorHandler.handleError(networkError);
        
        testRunner.expect(errorInfo.canRetry).toBe(true);

        const authError = new Error('Invalid login credentials');
        const authErrorInfo = mockErrorHandler.handleError(authError);
        
        testRunner.expect(authErrorInfo.canRetry).toBe(false);
    });

    testRunner.test('showUserFriendlyError creates proper notification structure', () => {
        const errorInfo = {
            errorData: {
                message: 'テストエラー',
                description: 'テスト用のエラーです',
                solutions: ['解決方法1', '解決方法2'],
                severity: 'warning'
            }
        };

        const notification = mockErrorHandler.showUserFriendlyError(errorInfo);
        
        testRunner.expect(notification.message).toBe('テストエラー');
        testRunner.expect(notification.solutions).toHaveLength(2);
        testRunner.expect(notification.severity).toBe('warning');
    });

    testRunner.test('logErrorToStorage saves error information', () => {
        const errorInfo = {
            type: 'NETWORK',
            message: 'Test error',
            timestamp: new Date().toISOString()
        };

        mockErrorHandler.logErrorToStorage(errorInfo);
        const logs = mockErrorHandler.getErrorLogs();
        
        testRunner.expect(logs).toHaveLength(1);
        testRunner.expect(logs[0].type).toBe('NETWORK');
    });

    testRunner.test('getErrorLogs retrieves stored errors', () => {
        const errorInfo1 = { type: 'NETWORK', message: 'Error 1' };
        const errorInfo2 = { type: 'AUTH', message: 'Error 2' };

        mockErrorHandler.logErrorToStorage(errorInfo1);
        mockErrorHandler.logErrorToStorage(errorInfo2);

        const logs = mockErrorHandler.getErrorLogs();
        testRunner.expect(logs).toHaveLength(2);
    });

    testRunner.test('clearErrorLogs removes all stored errors', () => {
        const errorInfo = { type: 'NETWORK', message: 'Test error' };
        mockErrorHandler.logErrorToStorage(errorInfo);
        
        testRunner.expect(mockErrorHandler.getErrorLogs()).toHaveLength(1);
        
        mockErrorHandler.clearErrorLogs();
        testRunner.expect(mockErrorHandler.getErrorLogs()).toHaveLength(0);
    });

    testRunner.test('Error severity levels are correctly assigned', () => {
        const networkMessage = mockErrorHandler.getErrorMessage(mockErrorHandler.ERROR_TYPES.NETWORK);
        const authMessage = mockErrorHandler.getErrorMessage(mockErrorHandler.ERROR_TYPES.AUTH);
        const validationMessage = mockErrorHandler.getErrorMessage(mockErrorHandler.ERROR_TYPES.VALIDATION);

        testRunner.expect(networkMessage.severity).toBe('warning');
        testRunner.expect(authMessage.severity).toBe('error');
        testRunner.expect(validationMessage.severity).toBe('warning');
    });

    testRunner.test('Solutions array contains helpful guidance', () => {
        const errorMessage = mockErrorHandler.getErrorMessage(mockErrorHandler.ERROR_TYPES.NETWORK);
        
        testRunner.expect(errorMessage.solutions).toHaveLength(2);
        testRunner.expect(errorMessage.solutions[0]).toContain('Wi-Fi');
        testRunner.expect(errorMessage.solutions[1]).toContain('再試行');
    });
});

console.log('🧪 エラーハンドリング機能のテストが読み込まれました');