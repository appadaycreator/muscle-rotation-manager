// error-handler.test.js - エラーハンドリングシステムのテスト

import { 
    handleError, 
    determineErrorType, 
    getErrorMessage, 
    executeWithRetry,
    isOffline,
    watchOnlineStatus,
    ERROR_TYPES,
    logErrorToStorage,
    getErrorLogs,
    clearErrorLogs
} from '../../js/utils/errorHandler.js';

describe('エラーハンドリングシステム', () => {
    let originalNavigator;
    let originalLocalStorage;
    let mockShowNotification;

    beforeEach(() => {
        // Navigatorのモック
        originalNavigator = global.navigator;
        global.navigator = {
            onLine: true,
            userAgent: 'test-agent'
        };

        // LocalStorageのモック
        originalLocalStorage = global.localStorage;
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };

        // showNotificationのモック
        mockShowNotification = jest.fn();
        global.showNotification = mockShowNotification;

        // コンソールのモック
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        global.navigator = originalNavigator;
        global.localStorage = originalLocalStorage;
        jest.restoreAllMocks();
    });

    describe('determineErrorType', () => {
        test('ネットワークエラーを正しく判定する', () => {
            global.navigator.onLine = false;
            expect(determineErrorType(new Error('Network error'))).toBe(ERROR_TYPES.NETWORK);

            global.navigator.onLine = true;
            expect(determineErrorType(new Error('fetch failed'))).toBe(ERROR_TYPES.NETWORK);
            expect(determineErrorType(new Error('NetworkError occurred'))).toBe(ERROR_TYPES.NETWORK);
        });

        test('認証エラーを正しく判定する', () => {
            expect(determineErrorType(new Error('Invalid login credentials'))).toBe(ERROR_TYPES.AUTH);
            expect(determineErrorType(new Error('Email not confirmed'))).toBe(ERROR_TYPES.AUTH);
            expect(determineErrorType(new Error('User not found'))).toBe(ERROR_TYPES.AUTH);
            expect(determineErrorType(new Error('Signup is disabled'))).toBe(ERROR_TYPES.AUTH);
        });

        test('データベースエラーを正しく判定する', () => {
            expect(determineErrorType(new Error('duplicate key violation'))).toBe(ERROR_TYPES.DATABASE);
            expect(determineErrorType(new Error('foreign key constraint'))).toBe(ERROR_TYPES.DATABASE);
            expect(determineErrorType(new Error('PostgreSQL error'))).toBe(ERROR_TYPES.DATABASE);
        });

        test('ストレージエラーを正しく判定する', () => {
            expect(determineErrorType(new Error('QuotaExceededError'))).toBe(ERROR_TYPES.STORAGE);
            expect(determineErrorType(new Error('storage quota exceeded'))).toBe(ERROR_TYPES.STORAGE);
            expect(determineErrorType(new Error('file too large'))).toBe(ERROR_TYPES.STORAGE);
        });

        test('バリデーションエラーを正しく判定する', () => {
            expect(determineErrorType(new Error('validation failed'))).toBe(ERROR_TYPES.VALIDATION);
            expect(determineErrorType(new Error('required field missing'))).toBe(ERROR_TYPES.VALIDATION);
            expect(determineErrorType(new Error('invalid format'))).toBe(ERROR_TYPES.VALIDATION);
        });

        test('タイムアウトエラーを正しく判定する', () => {
            expect(determineErrorType(new Error('timeout occurred'))).toBe(ERROR_TYPES.TIMEOUT);
            expect(determineErrorType(new Error('TimeoutError'))).toBe(ERROR_TYPES.TIMEOUT);
        });

        test('不明なエラーを正しく判定する', () => {
            expect(determineErrorType(new Error('unknown error'))).toBe(ERROR_TYPES.UNKNOWN);
            expect(determineErrorType(new Error(''))).toBe(ERROR_TYPES.UNKNOWN);
        });
    });

    describe('getErrorMessage', () => {
        test('ネットワークエラーメッセージを取得する', () => {
            expect(getErrorMessage(ERROR_TYPES.NETWORK)).toBe('ネットワークエラーが発生しました。インターネット接続を確認してください。');
            expect(getErrorMessage(ERROR_TYPES.NETWORK, 'offline')).toBe('オフライン状態です。インターネット接続を確認してください。');
            expect(getErrorMessage(ERROR_TYPES.NETWORK, 'timeout')).toBe('リクエストがタイムアウトしました。しばらく時間をおいて再試行してください。');
        });

        test('認証エラーメッセージを取得する', () => {
            expect(getErrorMessage(ERROR_TYPES.AUTH)).toBe('認証エラーが発生しました。再度ログインしてください。');
            expect(getErrorMessage(ERROR_TYPES.AUTH, 'invalid_credentials')).toBe('メールアドレスまたはパスワードが正しくありません。');
            expect(getErrorMessage(ERROR_TYPES.AUTH, 'email_not_confirmed')).toBe('メールアドレスが確認されていません。確認メールをご確認ください。');
        });

        test('データベースエラーメッセージを取得する', () => {
            expect(getErrorMessage(ERROR_TYPES.DATABASE)).toBe('データベースエラーが発生しました。しばらく時間をおいて再試行してください。');
            expect(getErrorMessage(ERROR_TYPES.DATABASE, 'connection_failed')).toBe('データベースへの接続に失敗しました。');
        });

        test('存在しないエラータイプの場合はデフォルトメッセージを返す', () => {
            expect(getErrorMessage('INVALID_TYPE')).toBe('予期しないエラーが発生しました。問題が続く場合はサポートにお問い合わせください。');
        });
    });

    describe('handleError', () => {
        test('基本的なエラーハンドリングが動作する', () => {
            const error = new Error('Test error');
            const result = handleError(error, {
                context: 'テストコンテキスト',
                showNotification: true,
                logToConsole: true
            });

            expect(result.type).toBe(ERROR_TYPES.UNKNOWN);
            expect(result.message).toBe('予期しないエラーが発生しました。問題が続く場合はサポートにお問い合わせください。');
            expect(result.context).toBe('テストコンテキスト');
            expect(result.originalError).toBe(error);
            expect(mockShowNotification).toHaveBeenCalledWith(
                '予期しないエラーが発生しました。問題が続く場合はサポートにお問い合わせください。',
                'error'
            );
        });

        test('通知を無効にできる', () => {
            const error = new Error('Test error');
            handleError(error, {
                context: 'テストコンテキスト',
                showNotification: false
            });

            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        test('リトライ可能なエラーでリトライ関数が設定される', () => {
            const error = new Error('Network error');
            const mockRetryFn = jest.fn().mockResolvedValue('success');
            
            const result = handleError(error, {
                context: 'ネットワーク処理',
                onRetry: mockRetryFn,
                maxRetries: 3
            });

            expect(result.canRetry).toBe(true);
            expect(typeof result.retry).toBe('function');
            expect(result.maxRetries).toBe(3);
        });

        test('リトライ不可能なエラーではリトライ関数が設定されない', () => {
            const error = new Error('Invalid login credentials');
            const mockRetryFn = jest.fn();
            
            const result = handleError(error, {
                context: '認証処理',
                onRetry: mockRetryFn,
                maxRetries: 3
            });

            expect(result.canRetry).toBe(false);
            expect(result.retry).toBeUndefined();
        });
    });

    describe('executeWithRetry', () => {
        test('成功時は結果を返す', async () => {
            const mockFn = jest.fn().mockResolvedValue('success');
            
            const result = await executeWithRetry(mockFn, {
                maxRetries: 3,
                context: 'テスト処理'
            });

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('リトライ可能なエラーで指定回数リトライする', async () => {
            const mockFn = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue('success');

            const result = await executeWithRetry(mockFn, {
                maxRetries: 3,
                retryDelay: 10, // テスト用に短縮
                context: 'ネットワーク処理'
            });

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        test('リトライ不可能なエラーで即座に失敗する', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Invalid login credentials'));

            await expect(executeWithRetry(mockFn, {
                maxRetries: 3,
                context: '認証処理'
            })).rejects.toThrow('Invalid login credentials');

            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('最大リトライ回数を超えた場合は失敗する', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

            await expect(executeWithRetry(mockFn, {
                maxRetries: 2,
                retryDelay: 10,
                context: 'ネットワーク処理'
            })).rejects.toThrow();

            expect(mockFn).toHaveBeenCalledTimes(3); // 初回 + 2回リトライ
        });
    });

    describe('isOffline', () => {
        test('オンライン状態を正しく判定する', () => {
            global.navigator.onLine = true;
            expect(isOffline()).toBe(false);

            global.navigator.onLine = false;
            expect(isOffline()).toBe(true);
        });
    });

    describe('watchOnlineStatus', () => {
        test('オンライン状態の変更を監視する', () => {
            const mockOnOnline = jest.fn();
            const mockOnOffline = jest.fn();
            
            // イベントリスナーのモック
            const addEventListener = jest.fn();
            const removeEventListener = jest.fn();
            global.window = {
                addEventListener,
                removeEventListener
            };

            const cleanup = watchOnlineStatus(mockOnOnline, mockOnOffline);

            expect(addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

            // クリーンアップ関数のテスト
            cleanup();
            expect(removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
        });
    });

    describe('エラーログ機能', () => {
        beforeEach(() => {
            clearErrorLogs();
        });

        test('エラーログを保存できる', () => {
            const errorInfo = {
                type: ERROR_TYPES.NETWORK,
                message: 'ネットワークエラー',
                context: 'テスト'
            };

            global.localStorage.getItem.mockReturnValue('[]');
            global.localStorage.setItem.mockImplementation(() => {});

            logErrorToStorage(errorInfo);

            expect(global.localStorage.setItem).toHaveBeenCalledWith(
                'errorLogs',
                expect.stringContaining('ネットワークエラー')
            );
        });

        test('エラーログを取得できる', () => {
            const mockLogs = [
                { id: '1', type: ERROR_TYPES.NETWORK, message: 'エラー1' },
                { id: '2', type: ERROR_TYPES.AUTH, message: 'エラー2' }
            ];

            global.localStorage.getItem.mockReturnValue(JSON.stringify(mockLogs));

            const logs = getErrorLogs();
            expect(logs).toEqual(mockLogs);
        });

        test('エラーログをクリアできる', () => {
            clearErrorLogs();
            expect(global.localStorage.removeItem).toHaveBeenCalledWith('errorLogs');
        });

        test('LocalStorageエラー時も適切に処理する', () => {
            global.localStorage.getItem.mockImplementation(() => {
                throw new Error('LocalStorage error');
            });

            const logs = getErrorLogs();
            expect(logs).toEqual([]);
        });
    });

    describe('エラータイプ別の通知タイプ', () => {
        test('ネットワークエラーは警告として表示される', () => {
            const error = new Error('Network error');
            handleError(error, { showNotification: true });
            
            expect(mockShowNotification).toHaveBeenCalledWith(
                expect.any(String),
                'warning'
            );
        });

        test('認証エラーはエラーとして表示される', () => {
            const error = new Error('Invalid login credentials');
            handleError(error, { showNotification: true });
            
            expect(mockShowNotification).toHaveBeenCalledWith(
                expect.any(String),
                'error'
            );
        });

        test('バリデーションエラーは警告として表示される', () => {
            const error = new Error('validation failed');
            handleError(error, { showNotification: true });
            
            expect(mockShowNotification).toHaveBeenCalledWith(
                expect.any(String),
                'warning'
            );
        });
    });

    describe('エッジケース', () => {
        test('nullエラーを適切に処理する', () => {
            const result = handleError(null, { context: 'null エラー' });
            expect(result.type).toBe(ERROR_TYPES.UNKNOWN);
        });

        test('undefinedエラーを適切に処理する', () => {
            const result = handleError(undefined, { context: 'undefined エラー' });
            expect(result.type).toBe(ERROR_TYPES.UNKNOWN);
        });

        test('文字列エラーを適切に処理する', () => {
            const result = handleError('String error message', { context: '文字列エラー' });
            expect(result.originalError).toBe('String error message');
        });

        test('空のオプションでも動作する', () => {
            const error = new Error('Test error');
            const result = handleError(error);
            
            expect(result.context).toBe('Unknown');
            expect(result.type).toBe(ERROR_TYPES.UNKNOWN);
        });
    });

    describe('パフォーマンステスト', () => {
        test('大量のエラーログでもパフォーマンスが維持される', () => {
            const startTime = Date.now();
            
            // 100個のエラーログを処理
            for (let i = 0; i < 100; i++) {
                const error = new Error(`Error ${i}`);
                handleError(error, { 
                    context: `テスト${i}`,
                    showNotification: false,
                    logToConsole: false
                });
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // 100個のエラー処理が1秒以内に完了することを確認
            expect(duration).toBeLessThan(1000);
        });
    });
});

// 統合テスト
describe('エラーハンドリング統合テスト', () => {
    test('実際のSupabaseエラーを適切に処理する', () => {
        const supabaseError = {
            message: 'Invalid login credentials',
            code: 'invalid_credentials',
            details: 'Email or password is incorrect'
        };

        const result = handleError(supabaseError, {
            context: 'Supabaseログイン',
            showNotification: false
        });

        expect(result.type).toBe(ERROR_TYPES.AUTH);
        expect(result.message).toBe('メールアドレスまたはパスワードが正しくありません。');
    });

    test('ネットワーク切断時の処理フロー', async () => {
        global.navigator.onLine = false;
        
        const networkError = new Error('fetch failed');
        const mockRetryFn = jest.fn().mockRejectedValue(networkError);

        const result = handleError(networkError, {
            context: 'データ取得',
            onRetry: mockRetryFn,
            maxRetries: 3,
            showNotification: false
        });

        expect(result.type).toBe(ERROR_TYPES.NETWORK);
        expect(result.canRetry).toBe(true);
        expect(result.message).toBe('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    });
});
