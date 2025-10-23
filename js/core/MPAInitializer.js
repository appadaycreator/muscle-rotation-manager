// js/core/MPAInitializer.js - MPA初期化スクリプト

import { authManager } from '../modules/authManager.js';
import { supabaseService } from '../services/supabaseService.js';
import { showNotification } from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';

/**
 * MPA初期化クラス
 * 各ページで共通の初期化処理を実行
 */
class MPAInitializer {
    constructor() {
        this.isInitialized = false;
        this.currentPage = this.getCurrentPageName();
    }

    /**
     * 現在のページ名を取得
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        const pageMap = {
            '/': 'dashboard',
            '/dashboard.html': 'dashboard',
            '/workout.html': 'workout',
            '/calendar.html': 'calendar',
            '/analysis.html': 'analysis',
            '/progress.html': 'progress',
            '/exercises.html': 'exercises',
            '/settings.html': 'settings',
            '/help.html': 'help',
            '/privacy.html': 'privacy'
        };
        return pageMap[path] || 'dashboard';
    }

    /**
     * MPA初期化を実行
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ MPA already initialized, skipping...');
            return;
        }

        console.log(`🚀 Initializing MPA for page: ${this.currentPage}`);
        const startTime = performance.now();

        try {
            // 1. 認証管理の初期化
            await authManager.initialize();

            // 2. 認証状態の確認
            await this.checkAuthentication();

            // 3. 共通コンポーネントの読み込み
            await this.loadCommonComponents();

            // 4. ページ固有の初期化
            await this.initializePageSpecific();

            // 5. イベントリスナーの設定
            this.setupEventListeners();

            // 6. エラーハンドリングの設定
            this.setupErrorHandling();

            const initTime = performance.now() - startTime;
            console.log(`✅ MPA initialization complete (${initTime.toFixed(2)}ms)`);

            this.isInitialized = true;

            // 初期化完了イベントを発火
            window.dispatchEvent(new CustomEvent('mpaInitialized', {
                detail: {
                    page: this.currentPage,
                    initTime
                }
            }));

        } catch (error) {
            console.error('❌ MPA initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 認証状態をチェック
     */
    async checkAuthentication() {
        try {
            const isAuthenticated = await authManager.isAuthenticated();
            const currentUser = await authManager.getCurrentUser();

            console.log('🔐 Authentication check:', {
                isAuthenticated,
                user: currentUser?.email || 'anonymous'
            });

            if (!isAuthenticated) {
                this.showLoginPrompt();
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            this.showLoginPrompt();
            return false;
        }
    }

    /**
     * ログインプロンプトを表示
     */
    showLoginPrompt() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-50">
                    <div class="max-w-md w-full space-y-8">
                        <div class="text-center">
                            <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                                ログインが必要です
                            </h2>
                            <p class="mt-2 text-sm text-gray-600">
                                このページにアクセスするにはログインしてください
                            </p>
                        </div>
                        <div class="mt-8 space-y-6">
                            <div class="space-y-4">
                                <button onclick="window.location.href='/'"
                                        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    <i class="fas fa-home mr-2"></i>
                                    ホームに戻る
                                </button>
                                <button onclick="showAuthModal()"
                                        class="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    <i class="fas fa-sign-in-alt mr-2"></i>
                                    ログイン
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 共通コンポーネントを読み込み
     */
    async loadCommonComponents() {
        try {
            console.log('🔄 Loading common components...');

            // ヘッダーとサイドバーを並行読み込み
            const [headerResult, sidebarResult] = await Promise.allSettled([
                this.loadHeader(),
                this.loadSidebar()
            ]);

            // 結果をログ出力
            console.log('Component loading results:', {
                header: headerResult.status,
                sidebar: sidebarResult.status
            });

            // エラーハンドリング
            if (headerResult.status === 'rejected') {
                console.warn('Header loading failed:', headerResult.reason);
            }
            if (sidebarResult.status === 'rejected') {
                console.warn('Sidebar loading failed:', sidebarResult.reason);
            }

        } catch (error) {
            console.error('❌ Failed to load common components:', error);
            throw error;
        }
    }

    /**
     * ヘッダーを読み込み
     */
    async loadHeader() {
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) {
            throw new Error('Header container not found');
        }

        try {
            const response = await fetch('partials/header.html');
            if (!response.ok) {
                throw new Error(`Failed to load header: ${response.status}`);
            }
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;
            console.log('✅ Header loaded successfully');
        } catch (error) {
            console.error('❌ Header loading failed:', error);
            throw error;
        }
    }

    /**
     * サイドバーを読み込み
     */
    async loadSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) {
            throw new Error('Sidebar container not found');
        }

        try {
            const response = await fetch('partials/sidebar.html');
            if (!response.ok) {
                throw new Error(`Failed to load sidebar: ${response.status}`);
            }
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;
            console.log('✅ Sidebar loaded successfully');
        } catch (error) {
            console.error('❌ Sidebar loading failed:', error);
            throw error;
        }
    }

    /**
     * ページ固有の初期化
     */
    async initializePageSpecific() {
        try {
            console.log(`🔄 Initializing page-specific functionality for: ${this.currentPage}`);

            // ページ固有のJavaScriptモジュールを動的インポート
            const pageModule = await this.loadPageModule(this.currentPage);

            if (pageModule && typeof pageModule.initialize === 'function') {
                await pageModule.initialize();
                console.log(`✅ Page-specific initialization complete for: ${this.currentPage}`);
            }

        } catch (error) {
            console.warn(`⚠️ Page-specific initialization failed for ${this.currentPage}:`, error);
            // ページ固有の初期化に失敗してもアプリケーションは動作する
        }
    }

    /**
     * ページモジュールを動的インポート
     */
    async loadPageModule(pageName) {
        try {
            const moduleMap = {
                dashboard: () => import('../pages/dashboardPage.js'),
                workout: () => import('../pages/workoutPageWizard.js'),
                calendar: () => import('../pages/calendarPage.js'),
                analysis: () => import('../pages/analysisPage.js'),
                progress: () => import('../pages/progressPage.js'),
                exercises: () => import('../pages/exercisePage.js'),
                settings: () => import('../pages/settingsPage.js')
            };

            const moduleLoader = moduleMap[pageName];
            if (!moduleLoader) {
                console.warn(`No module loader found for page: ${pageName}`);
                return null;
            }

            const module = await moduleLoader();
            return module.default || module;

        } catch (error) {
            console.error(`❌ Failed to load page module for ${pageName}:`, error);
            return null;
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        console.log('🔄 Setting up event listeners...');

        // ナビゲーションリンクのクリックイベント
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('a[href]');
            if (navLink && navLink.getAttribute('href').startsWith('/')) {
                e.preventDefault();
                const href = navLink.getAttribute('href');
                console.log('🔗 Navigation link clicked:', href);
                window.location.href = href;
            }
        });

        // モバイルメニューのイベント
        this.setupMobileMenu();

        // オンライン/オフライン状態の監視
        this.setupOnlineStatusMonitoring();

        console.log('✅ Event listeners setup complete');
    }

    /**
     * モバイルメニューを設定
     */
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileSidebarClose = document.getElementById('mobile-sidebar-close');

        if (mobileMenuBtn && mobileSidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileSidebar.classList.add('open');
            });
        }

        if (mobileSidebarClose && mobileSidebar) {
            mobileSidebarClose.addEventListener('click', () => {
                mobileSidebar.classList.remove('open');
            });
        }

        // モバイルサイドバー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (mobileSidebar &&
                !mobileSidebar.contains(e.target) &&
                !mobileMenuBtn?.contains(e.target)) {
                mobileSidebar.classList.remove('open');
            }
        });
    }

    /**
     * オンライン状態の監視を設定
     */
    setupOnlineStatusMonitoring() {
        window.addEventListener('online', () => {
            console.log('🌐 Online status restored');
            showNotification('オンラインに復帰しました', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('📱 Offline status detected');
            showNotification('オフラインになりました', 'warning');
        });
    }

    /**
     * エラーハンドリングを設定
     */
    setupErrorHandling() {
        // グローバルエラーハンドリング
        window.addEventListener('error', (event) => {
            console.error('❌ Global JavaScript error:', event.error);
            handleError(event.error, {
                context: 'Global Error Handler',
                showNotification: true
            });
        });

        // 未処理のPromise拒否をキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled Promise Rejection:', event.reason);
            handleError(event.reason, {
                context: 'Unhandled Promise Rejection',
                showNotification: true
            });
        });
    }

    /**
     * 初期化エラーを処理
     */
    handleInitializationError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-50">
                    <div class="max-w-md w-full space-y-8">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                            <h2 class="text-3xl font-extrabold text-gray-900">
                                初期化エラー
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

    /**
     * 現在のページ名を取得
     */
    getCurrentPage() {
        return this.currentPage;
    }
}

// グローバル初期化インスタンス
const mpaInitializer = new MPAInitializer();

// DOM読み込み完了時に初期化を実行
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 DOM loaded, initializing MPA...');
    await mpaInitializer.initialize();
});

// グローバルに公開
window.mpaInitializer = mpaInitializer;

export default mpaInitializer;
