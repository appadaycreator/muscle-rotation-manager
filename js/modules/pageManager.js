// pageManager.js - ページ管理とナビゲーション

import { showNotification } from '../utils/helpers.js';
import onboardingManager from './onboardingManager.js';

class PageManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.pageCache = new Map();
    }

    /**
     * パーシャルコンテンツを読み込み
     * @param {string} partialName - パーシャル名
     * @returns {Promise<string>} HTMLコンテンツ
     */
    async loadPartial(partialName) {
        try {
            if (this.pageCache.has(partialName)) {
                return this.pageCache.get(partialName);
            }

            const response = await fetch(`partials/${partialName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${partialName}`);
            }

            const content = await response.text();
            this.pageCache.set(partialName, content);
            return content;
        } catch (error) {
            console.error(`Error loading partial ${partialName}:`, error);
            return `<div class="text-center text-gray-500 py-8">
                <i class="fas fa-exclamation-triangle text-2xl mb-4"></i>
                <p>ページの読み込みに失敗しました</p>
            </div>`;
        }
    }

    /**
     * ページにナビゲート
     * @param {string} pageName - ページ名
     */
    async navigateToPage(pageName) {
        try {
            // ナビゲーション状態を更新
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

            // ページコンテンツを読み込み
            const mainContent = document.querySelector('main');
            const partialName = this.getPartialName(pageName);
            const content = await this.loadPartial(partialName);

            // コンテンツを置換
            mainContent.innerHTML = content;

            // 現在のページを更新
            this.currentPage = pageName;

            // ページ固有の機能を初期化
            this.initializePage(pageName);

            console.log(`Navigated to ${pageName} page`);
        } catch (error) {
            console.error('Navigation error:', error);
            showNotification('ページの読み込みに失敗しました', 'error');
        }
    }

    /**
     * ページ名からパーシャル名を取得
     * @param {string} pageName - ページ名
     * @returns {string} パーシャル名
     */
    getPartialName(pageName) {
        const partialMap = {
            'exercises-management': 'exercises-management',
            exercises: 'exercises-management'
        };
        return partialMap[pageName] || pageName;
    }

    /**
     * ページ固有の機能を初期化
     * @param {string} pageName - ページ名
     */
    initializePage(pageName) {
        // 動的インポートを使用してページモジュールを読み込み
        this.loadPageModule(pageName);
    }

    /**
     * ページモジュールを動的に読み込み
     * @param {string} pageName - ページ名
     */
    async loadPageModule(pageName) {
        try {
            let module;

            // エクササイズ管理ページの特別処理
            if (pageName === 'exercises-management' || pageName === 'exercises') {
                module = await import('../pages/exercisePage.js');
            } else {
                module = await import(`../pages/${pageName}Page.js`);
            }

            if (module.default && typeof module.default.initialize === 'function') {
                module.default.initialize();
            }
        } catch (error) {
            console.warn(`Page module for ${pageName} not found or failed to load:`, error);
            // フォールバック処理
            this.initializePageFallback(pageName);
        }
    }

    /**
     * ページ初期化のフォールバック処理
     * @param {string} pageName - ページ名
     */
    initializePageFallback(pageName) {
        console.log(`Initializing ${pageName} page with fallback`);

        switch (pageName) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'workout':
                this.initializeWorkout();
                break;
            case 'calendar':
                this.initializeCalendar();
                break;
            case 'analytics':
                this.initializeAnalytics();
                break;
            case 'progress':
                this.initializeProgress();
                break;
            case 'exercises':
                this.initializeExercises();
                break;
            case 'settings':
                this.initializeSettings();
                break;
            case 'help':
                this.initializeHelp();
                break;
            case 'privacy':
                this.initializePrivacy();
                break;
            default:
                console.log(`No specific initialization for ${pageName}`);
        }
    }

    /**
     * ダッシュボードページの初期化
     */
    initializeDashboard() {
        console.log('Dashboard page initialized');

        // オンボーディングチェック（ダッシュボード初期化時）
        if (onboardingManager.isOnboardingNeeded()) {
            console.log('オンボーディングが必要です');
            setTimeout(() => {
                onboardingManager.startOnboarding();
            }, 1000); // 1秒後に開始（UIの初期化を待つ）
        }

        // 筋肉部位クリックハンドラー
        document.querySelectorAll('.muscle-part').forEach(part => {
            part.addEventListener('click', () => {
                const muscle = part.dataset.muscle;
                console.log(`Clicked muscle part: ${muscle}`);
            });
        });
    }

    /**
     * ワークアウトページの初期化
     */
    initializeWorkout() {
        console.log('Workout page initialized');
    }

    /**
     * カレンダーページの初期化
     */
    initializeCalendar() {
        console.log('Calendar page initialized');
    }

    /**
     * 分析ページの初期化
     */
    initializeAnalytics() {
        console.log('Analytics page initialized');
    }

    /**
     * プログレッシブ・オーバーロードページの初期化
     */
    initializeProgress() {
        console.log('Progress page initialized');
    }

    /**
     * エクササイズページの初期化
     */
    initializeExercises() {
        console.log('Exercises page initialized');
    }

    /**
     * 設定ページの初期化
     */
    initializeSettings() {
        console.log('Settings page initialized');
    }

    /**
     * ヘルプページの初期化
     */
    initializeHelp() {
        console.log('Help page initialized');
    }

    /**
     * プライバシーページの初期化
     */
    initializePrivacy() {
        console.log('Privacy policy page initialized');
    }

    /**
     * ナビゲーションを初期化
     */
    initializeNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page && page !== this.currentPage) {
                    await this.navigateToPage(page);
                }
            });
        });
    }

    /**
     * ヘッダーを読み込み
     */
    async loadHeader() {
        try {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                const headerContent = await this.loadPartial('header');
                headerContainer.innerHTML = headerContent;
            }
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }

    /**
     * サイドバーを読み込み
     */
    async loadSidebar() {
        try {
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                const sidebarContent = await this.loadPartial('sidebar');
                sidebarContainer.innerHTML = sidebarContent;
            }
        } catch (error) {
            console.error('Error loading sidebar:', error);
        }
    }

    /**
     * 現在のページを取得
     * @returns {string} 現在のページ名
     */
    getCurrentPage() {
        return this.currentPage;
    }
}

// シングルトンインスタンスをエクスポート
export const pageManager = new PageManager();
