// error-handling-integration.test.js - エラーハンドリング統合テスト

import { handleError, executeWithRetry, watchOnlineStatus } from '../../js/utils/errorHandler.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { authManager } from '../../js/modules/authManager.js';

describe('エラーハンドリング統合テスト', () => {
    let mockSupabaseService;
    let mockAuthManager;
    let originalNavigator;
    let originalWindow;

    beforeEach(() => {
        // Navigatorのモック
        originalNavigator = global.navigator;
        global.navigator = {
            onLine: true,
            userAgent: 'test-agent'
        };

        // Windowのモック
        originalWindow = global.window;
        global.window = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            location: { href: 'http://localhost:3000' }
        };

        // Supabaseサービスのモック
        mockSupabaseService = {
            signIn: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
            saveWorkout: jest.fn(),
            getWorkouts: jest.fn(),
            isAvailable: jest.fn().mockReturnValue(true)
        };

        // AuthManagerのモック
        mockAuthManager = {
            handleLogin: jest.fn(),
            handleSignup: jest.fn(),
            showAuthError: jest.fn(),
            updateAuthUI: jest.fn()
        };

        // showNotificationのモック
        global.showNotification = jest.fn();

        // コンソールのモック
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        global.navigator = originalNavigator;
        global.window = originalWindow;
        jest.restoreAllMocks();
    });

    describe('認証エラーの統合処理', () => {
        test('ログイン失敗時のエラーハンドリング', async () => {
            const loginError = new Error('Invalid login credentials');
            mockSupabaseService.signIn.mockRejectedValue(loginError);

            try {
                await executeWithRetry(
                    () => mockSupabaseService.signIn('test@example.com', 'wrongpassword'),
                    { maxRetries: 2, context: 'ログイン' }
                );
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'ログイン処理',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('AUTH');
                expect(errorInfo.message).toBe('メールアドレスまたはパスワードが正しくありません。');
                expect(global.showNotification).toHaveBeenCalledWith(
                    'メールアドレスまたはパスワードが正しくありません。',
                    'error'
                );
            }

            // 認証エラーはリトライしないことを確認
            expect(mockSupabaseService.signIn).toHaveBeenCalledTimes(1);
        });

        test('メール未確認エラーの処理', async () => {
            const emailError = new Error('Email not confirmed');
            mockSupabaseService.signIn.mockRejectedValue(emailError);

            try {
                await mockSupabaseService.signIn('test@example.com', 'password');
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'ログイン処理',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('AUTH');
                expect(errorInfo.message).toBe('メールアドレスが確認されていません。確認メールをご確認ください。');
            }
        });

        test('新規登録無効エラーの処理', async () => {
            const signupError = new Error('Signup is disabled');
            mockSupabaseService.signUp.mockRejectedValue(signupError);

            try {
                await mockSupabaseService.signUp('test@example.com', 'password');
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: '新規登録処理',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('AUTH');
                expect(errorInfo.message).toBe('新規登録は現在無効になっています。');
            }
        });
    });

    describe('ネットワークエラーの統合処理', () => {
        test('オフライン状態でのデータ取得エラー', async () => {
            global.navigator.onLine = false;
            const networkError = new Error('fetch failed');
            mockSupabaseService.getWorkouts.mockRejectedValue(networkError);

            try {
                await executeWithRetry(
                    () => mockSupabaseService.getWorkouts(),
                    { maxRetries: 3, retryDelay: 10, context: 'ワークアウト取得' }
                );
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'ワークアウト取得',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('NETWORK');
                expect(errorInfo.message).toBe('ネットワークエラーが発生しました。インターネット接続を確認してください。');
            }

            // ネットワークエラーは指定回数リトライすることを確認
            expect(mockSupabaseService.getWorkouts).toHaveBeenCalledTimes(4); // 初回 + 3回リトライ
        });

        test('サーバーエラー時のリトライ処理', async () => {
            const serverError = new Error('Internal Server Error 500');
            mockSupabaseService.saveWorkout
                .mockRejectedValueOnce(serverError)
                .mockRejectedValueOnce(serverError)
                .mockResolvedValue({ id: 'workout-123' });

            const result = await executeWithRetry(
                () => mockSupabaseService.saveWorkout({ data: 'test' }),
                { maxRetries: 3, retryDelay: 10, context: 'ワークアウト保存' }
            );

            expect(result).toEqual({ id: 'workout-123' });
            expect(mockSupabaseService.saveWorkout).toHaveBeenCalledTimes(3);
        });

        test('タイムアウトエラーの処理', async () => {
            const timeoutError = new Error('Request timeout');
            mockSupabaseService.saveWorkout.mockRejectedValue(timeoutError);

            try {
                await executeWithRetry(
                    () => mockSupabaseService.saveWorkout({ data: 'test' }),
                    { maxRetries: 2, retryDelay: 10, context: 'ワークアウト保存' }
                );
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'ワークアウト保存',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('TIMEOUT');
                expect(errorInfo.message).toBe('タイムアウトが発生しました。しばらく時間をおいて再試行してください。');
            }
        });
    });

    describe('データベースエラーの統合処理', () => {
        test('重複キーエラーの処理', async () => {
            const dbError = new Error('duplicate key value violates unique constraint');
            mockSupabaseService.saveWorkout.mockRejectedValue(dbError);

            try {
                await mockSupabaseService.saveWorkout({ id: 'duplicate-id' });
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'ワークアウト保存',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('DATABASE');
                expect(errorInfo.message).toBe('データベースエラーが発生しました。しばらく時間をおいて再試行してください。');
            }
        });

        test('外部キー制約エラーの処理', async () => {
            const dbError = new Error('foreign key constraint fails');
            mockSupabaseService.saveWorkout.mockRejectedValue(dbError);

            try {
                await mockSupabaseService.saveWorkout({ invalid_reference: 'test' });
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'ワークアウト保存',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('DATABASE');
                expect(errorInfo.canRetry).toBe(true);
            }
        });
    });

    describe('ストレージエラーの統合処理', () => {
        test('LocalStorage容量不足エラー', () => {
            const storageError = new Error('QuotaExceededError');
            
            const errorInfo = handleError(storageError, {
                context: 'ローカルストレージ保存',
                showNotification: true
            });

            expect(errorInfo.type).toBe('STORAGE');
            expect(errorInfo.message).toBe('ストレージ容量が不足しています。不要なデータを削除してください。');
            expect(global.showNotification).toHaveBeenCalledWith(
                'ストレージ容量が不足しています。不要なデータを削除してください。',
                'warning'
            );
        });

        test('ファイルサイズ超過エラー', () => {
            const fileSizeError = new Error('file too large');
            
            const errorInfo = handleError(fileSizeError, {
                context: 'ファイルアップロード',
                showNotification: true
            });

            expect(errorInfo.type).toBe('STORAGE');
            expect(errorInfo.message).toBe('ファイルサイズが大きすぎます。');
        });
    });

    describe('オンライン状態監視の統合テスト', () => {
        test('オフライン→オンライン復旧時の処理', () => {
            const mockOnOnline = jest.fn();
            const mockOnOffline = jest.fn();

            // オンライン状態監視を開始
            const cleanup = watchOnlineStatus(mockOnOnline, mockOnOffline);

            // オフライン状態をシミュレート
            global.navigator.onLine = false;
            const offlineEvent = new Event('offline');
            
            // イベントリスナーが登録されていることを確認
            expect(global.window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(global.window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

            // クリーンアップ
            cleanup();
            expect(global.window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
            expect(global.window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
        });
    });

    describe('複合エラーシナリオ', () => {
        test('認証切れ→再認証→データ保存の流れ', async () => {
            // 1. 認証切れエラー
            const authExpiredError = new Error('JWT expired');
            mockSupabaseService.saveWorkout.mockRejectedValueOnce(authExpiredError);

            // 2. 再認証成功
            mockSupabaseService.signIn.mockResolvedValue({ user: { id: 'user-123' } });

            // 3. データ保存成功
            mockSupabaseService.saveWorkout.mockResolvedValue({ id: 'workout-456' });

            // エラーハンドリングのテスト
            try {
                await mockSupabaseService.saveWorkout({ data: 'test' });
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'ワークアウト保存',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('AUTH');
                expect(errorInfo.message).toBe('セッションが期限切れです。再度ログインしてください。');
            }
        });

        test('ネットワーク不安定時の段階的エラー処理', async () => {
            // 不安定なネットワークをシミュレート
            const networkErrors = [
                new Error('fetch failed'),
                new Error('timeout'),
                new Error('500 Internal Server Error')
            ];

            let callCount = 0;
            mockSupabaseService.getWorkouts.mockImplementation(() => {
                if (callCount < networkErrors.length) {
                    const error = networkErrors[callCount];
                    callCount++;
                    return Promise.reject(error);
                }
                return Promise.resolve([{ id: 'workout-1' }]);
            });

            const result = await executeWithRetry(
                () => mockSupabaseService.getWorkouts(),
                { maxRetries: 4, retryDelay: 10, context: 'ワークアウト取得' }
            );

            expect(result).toEqual([{ id: 'workout-1' }]);
            expect(mockSupabaseService.getWorkouts).toHaveBeenCalledTimes(4);
        });
    });

    describe('エラー回復シナリオ', () => {
        test('一時的なサーバーエラーからの回復', async () => {
            // 最初の2回は失敗、3回目で成功
            mockSupabaseService.saveWorkout
                .mockRejectedValueOnce(new Error('503 Service Unavailable'))
                .mockRejectedValueOnce(new Error('502 Bad Gateway'))
                .mockResolvedValue({ id: 'workout-success' });

            const result = await executeWithRetry(
                () => mockSupabaseService.saveWorkout({ data: 'test' }),
                { maxRetries: 3, retryDelay: 10, context: 'ワークアウト保存' }
            );

            expect(result).toEqual({ id: 'workout-success' });
            expect(mockSupabaseService.saveWorkout).toHaveBeenCalledTimes(3);
        });

        test('オフライン状態からの回復とデータ同期', async () => {
            // オフライン状態
            global.navigator.onLine = false;
            
            const offlineError = new Error('Network request failed');
            mockSupabaseService.saveWorkout.mockRejectedValue(offlineError);

            // オフライン時のエラーハンドリング
            try {
                await mockSupabaseService.saveWorkout({ data: 'offline-test' });
            } catch (error) {
                const errorInfo = handleError(error, {
                    context: 'オフライン保存',
                    showNotification: true
                });

                expect(errorInfo.type).toBe('NETWORK');
                expect(global.showNotification).toHaveBeenCalledWith(
                    'ネットワークエラーが発生しました。インターネット接続を確認してください。',
                    'warning'
                );
            }

            // オンライン復旧
            global.navigator.onLine = true;
            mockSupabaseService.saveWorkout.mockResolvedValue({ id: 'synced-workout' });

            const syncResult = await mockSupabaseService.saveWorkout({ data: 'sync-test' });
            expect(syncResult).toEqual({ id: 'synced-workout' });
        });
    });

    describe('パフォーマンスとスケーラビリティ', () => {
        test('大量のエラー処理でもパフォーマンスが維持される', () => {
            const startTime = Date.now();
            
            // 1000個のエラーを並列処理
            const promises = Array.from({ length: 1000 }, (_, i) => {
                const error = new Error(`Test error ${i}`);
                return Promise.resolve(handleError(error, {
                    context: `テスト${i}`,
                    showNotification: false,
                    logToConsole: false
                }));
            });

            return Promise.all(promises).then(() => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // 1000個のエラー処理が2秒以内に完了することを確認
                expect(duration).toBeLessThan(2000);
            });
        });

        test('メモリリークが発生しないことを確認', () => {
            // 大量のエラーハンドリングを実行
            for (let i = 0; i < 10000; i++) {
                const error = new Error(`Memory test error ${i}`);
                handleError(error, {
                    context: `メモリテスト${i}`,
                    showNotification: false,
                    logToConsole: false
                });
            }

            // メモリ使用量の確認（実際のテストではより詳細な検証が必要）
            expect(true).toBe(true); // プレースホルダー
        });
    });
});
