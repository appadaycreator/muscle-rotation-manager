// app-refactored.js - メインアプリケーションファイル
// MPA (Multi-Page Application) アーキテクチャを使用

import mpaInitializer from './js/core/MPAInitializer.js';
import { authManager } from './js/modules/authManager.js';
import { showNotification } from './js/utils/helpers.js';
import { handleError } from './js/utils/errorHandler.js';

/**
 * アプリケーション初期化クラス
 * メインアプリケーションのエントリーポイント
 */
class App {
    constructor() {
        this.isInitialized = false;
        this.startTime = performance.now();
    }

    /**
     * アプリケーションを初期化
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ App already initialized, skipping...');
            return;
        }

        console.log('🚀 Initializing Muscle Rotation Manager App...');

        try {
            // 1. 基本的な設定
            this.setupBasicConfiguration();

            // 2. グローバルエラーハンドリング
            this.setupGlobalErrorHandling();

            // 3. パフォーマンス監視
            this.setupPerformanceMonitoring();

            // 4. MPA初期化
            await this.initializeMPA();

            // 5. アプリケーション固有の初期化
            await this.initializeAppSpecific();

            const initTime = performance.now() - this.startTime;
            console.log(`✅ App initialization complete (${initTime.toFixed(2)}ms)`);

            this.isInitialized = true;

            // 初期化完了イベントを発火
            window.dispatchEvent(new CustomEvent('appInitialized', {
                detail: {
                    initTime,
                    timestamp: new Date().toISOString()
                }
            }));

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 基本的な設定
     */
    setupBasicConfiguration() {
        console.log('🔧 Setting up basic configuration...');

        // 開発モードの設定
        window.DEV_MODE = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';

        // パフォーマンス監視の設定
        if (window.DEV_MODE) {
            console.log('🔧 Development mode enabled');
        }

        // グローバル設定
        window.APP_CONFIG = {
            version: '2.0.0',
            environment: window.DEV_MODE ? 'development' : 'production',
            debug: window.DEV_MODE
        };

        console.log('✅ Basic configuration complete');
    }

    /**
     * グローバルエラーハンドリングを設定
     */
    setupGlobalErrorHandling() {
        console.log('🛡️ Setting up global error handling...');

        // JavaScript エラー
        window.addEventListener('error', (event) => {
            console.error('❌ Global JavaScript error:', event.error);
            handleError(event.error, {
                context: 'Global Error Handler',
                showNotification: true,
                severity: 'error'
            });
        });

        // 未処理のPromise拒否
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled Promise Rejection:', event.reason);
            handleError(event.reason, {
                context: 'Unhandled Promise Rejection',
                showNotification: true,
                severity: 'error'
            });
        });

        // リソース読み込みエラー
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                console.error('❌ Resource loading error:', {
                    element: event.target,
                    src: event.target.src || event.target.href,
                    error: event.error
                });
            }
        }, true);

        console.log('✅ Global error handling setup complete');
    }

    /**
     * パフォーマンス監視を設定
     */
    setupPerformanceMonitoring() {
        console.log('📊 Setting up performance monitoring...');

        // ページ読み込み時間の測定
        window.addEventListener('load', () => {
            const loadTime = performance.now() - this.startTime;
            console.log(`📊 Page load time: ${loadTime.toFixed(2)}ms`);

            // パフォーマンスメトリクスを記録
            if (window.performance && window.performance.getEntriesByType) {
                const navigation = window.performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    console.log('📊 Performance metrics:', {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        totalTime: loadTime
                    });
                }
            }
        });

        // メモリ使用量の監視（開発モードのみ）
        if (window.DEV_MODE && window.performance && window.performance.memory) {
            setInterval(() => {
                const memory = window.performance.memory;
                console.log('📊 Memory usage:', {
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                });
            }, 30000); // 30秒ごと
        }

        console.log('✅ Performance monitoring setup complete');
    }

    /**
     * MPA初期化
     */
    async initializeMPA() {
        console.log('🔄 Initializing MPA...');

        try {
            // MPAInitializerは既にDOMContentLoadedで初期化されるが、
            // ここで明示的に初期化を確認
            if (window.mpaInitializer) {
                if (!window.mpaInitializer.isReady()) {
                    await window.mpaInitializer.initialize();
                }
                console.log('✅ MPA initialization complete');
            } else {
                console.warn('⚠️ MPAInitializer not found, MPA features may not work properly');
            }
        } catch (error) {
            console.error('❌ MPA initialization failed:', error);
            throw error;
        }
    }

    /**
     * アプリケーション固有の初期化
     */
    async initializeAppSpecific() {
        console.log('🔄 Initializing app-specific features...');

        try {
            // 1. 認証状態の確認
            await this.checkAuthenticationStatus();

            // 2. オフライン機能の初期化
            this.initializeOfflineFeatures();

            // 3. 通知システムの初期化
            this.initializeNotificationSystem();

            // 4. キーボードショートカットの設定
            this.setupKeyboardShortcuts();

            console.log('✅ App-specific initialization complete');

        } catch (error) {
            console.error('❌ App-specific initialization failed:', error);
            // アプリ固有の初期化失敗は致命的ではない
        }
    }

    /**
     * 認証状態をチェック
     */
    async checkAuthenticationStatus() {
        try {
            const isAuthenticated = await authManager.isAuthenticated();
            const currentUser = await authManager.getCurrentUser();

            console.log('🔐 Authentication status:', {
                isAuthenticated,
                user: currentUser?.email || 'anonymous'
            });

            // 認証状態に応じた処理
            if (isAuthenticated) {
                await this.setupAuthenticatedFeatures();
            } else {
                this.setupUnauthenticatedFeatures();
            }

        } catch (error) {
            console.error('❌ Authentication check failed:', error);
        }
    }

    /**
     * 認証済みユーザー向け機能を設定
     */
    async setupAuthenticatedFeatures() {
        console.log('🔐 Setting up authenticated features...');

        // ユーザー情報の表示
        const user = await authManager.getCurrentUser();
        if (user) {
            console.log('👤 User info:', {
                email: user.email,
                id: user.id
            });
        }

        // 認証済みユーザー向けのイベントリスナー
        // ログアウトボタンの処理はAuthManagerで統一管理
        console.log('🔐 Authenticated features setup complete');
    }

    /**
     * 未認証ユーザー向け機能を設定
     */
    setupUnauthenticatedFeatures() {
        console.log('🔓 Setting up unauthenticated features...');

        // ログインボタンの処理はAuthManagerで統一管理
        // 重複を避けるため、ここでは設定しない
        console.log('🔓 Unauthenticated features setup complete');
    }

    /**
     * オフライン機能を初期化
     */
    initializeOfflineFeatures() {
        console.log('📱 Initializing offline features...');

        // オンライン/オフライン状態の監視
        window.addEventListener('online', () => {
            console.log('🌐 Online status restored');
            showNotification('オンラインに復帰しました', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('📱 Offline status detected');
            showNotification('オフラインになりました。一部機能が制限されます。', 'warning');
        });
    }

    /**
     * 通知システムを初期化
     */
    initializeNotificationSystem() {
        console.log('🔔 Initializing notification system...');

        // 通知コンテナの確認
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            console.warn('⚠️ Notification container not found');
            return;
        }

        // 通知システムの設定
        window.notificationSystem = {
            show: (message, type = 'info', duration = 5000) => {
                showNotification(message, type, duration);
            }
        };

        console.log('✅ Notification system initialized');
    }

    /**
     * キーボードショートカットを設定
     */
    setupKeyboardShortcuts() {
        console.log('⌨️ Setting up keyboard shortcuts...');

        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 検索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }

            // Ctrl/Cmd + /: ヘルプ
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.openHelp();
            }

            // Escape: モーダルを閉じる
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        console.log('✅ Keyboard shortcuts setup complete');
    }

    /**
     * ログアウト処理
     */
    async handleLogout() {
        try {
            console.log('🚪 Logging out...');
            await authManager.logout();
            showNotification('ログアウトしました', 'info');
            window.location.href = '/';
        } catch (error) {
            console.error('❌ Logout failed:', error);
            showNotification('ログアウトに失敗しました', 'error');
        }
    }


    /**
     * 検索を開く
     */
    openSearch() {
        console.log('🔍 Opening search...');
        // 検索機能の実装
    }

    /**
     * ヘルプを開く
     */
    openHelp() {
        console.log('❓ Opening help...');
        window.location.href = '/help.html';
    }

    /**
     * モーダルを閉じる
     */
    closeModals() {
        console.log('❌ Closing modals...');
        // 開いているモーダルを閉じる
        const modals = document.querySelectorAll('.modal.open');
        modals.forEach(modal => modal.classList.remove('open'));
    }

    /**
     * 初期化エラーを処理
     */
    handleInitializationError(error) {
        console.error('❌ App initialization error:', error);

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-50">
                    <div class="max-w-md w-full space-y-8">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                            <h2 class="text-3xl font-extrabold text-gray-900">
                                アプリケーションエラー
                            </h2>
                            <p class="mt-2 text-sm text-gray-600">
                                アプリケーションの初期化に失敗しました
                            </p>
                        </div>
                        <div class="mt-8 space-y-6">
                            <button onclick="window.location.reload()"
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <i class="fas fa-redo mr-2"></i>
                                ページを再読み込み
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 初期化状態を取得
     */
    isReady() {
        return this.isInitialized;
    }
}

// アプリケーションインスタンスを作成
const app = new App();

// DOM読み込み完了時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 DOM loaded, initializing app...');
    await app.initialize();
});

// グローバルに公開
window.app = app;

// デフォルトエクスポート
export default app;
