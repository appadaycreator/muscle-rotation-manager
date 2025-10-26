// js/core/MPAInitializer.js - MPA初期化スクリプト

import { authManager } from '../modules/authManager.js';
import { supabaseService } from '../services/supabaseService.js';
import { showNotification } from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';
import { tooltipManager } from '../utils/TooltipManager.js';

/**
 * MPA初期化クラス
 * 各ページで共通の初期化処理を実行
 *
 * @class MPAInitializer
 * @version 2.0.0
 * @since 1.0.0
 */
class MPAInitializer {
  /**
   * MPA初期化クラスのコンストラクタ
   * @param {Object} options - 初期化オプション
   * @param {boolean} options.autoInitialize - 自動初期化（デフォルト: true）
   * @param {boolean} options.enablePerformanceMonitoring - パフォーマンス監視（デフォルト: true）
   */
  constructor(options = {}) {
    this.isInitialized = false;
    this.currentPage = this.getCurrentPageName();
    this.autoInitialize = options.autoInitialize !== false;
    this.enablePerformanceMonitoring =
      options.enablePerformanceMonitoring !== false;
    this.initializationTime = null;
    this.componentLoadTimes = new Map();
    this.errorCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * 現在のページ名を取得
   */
  getCurrentPageName() {
    const path = window.location.pathname;
    const pageMap = {
      '/': 'dashboard',
      '/index.html': 'dashboard',
      '/workout.html': 'workout',
      '/calendar.html': 'calendar',
      '/analysis.html': 'analysis',
      '/progress.html': 'progress',
      '/muscle-rotation-manager/progress.html': 'progress',
      '/exercises.html': 'exercises',
      '/settings.html': 'settings',
      '/help.html': 'help',
      '/privacy.html': 'privacy',
      // GitHub Pages用のパス
      '/muscle-rotation-manager/': 'dashboard',
      '/muscle-rotation-manager/index.html': 'dashboard',
      '/muscle-rotation-manager/workout.html': 'workout',
      '/muscle-rotation-manager/calendar.html': 'calendar',
      '/muscle-rotation-manager/analysis.html': 'analysis',
      '/muscle-rotation-manager/progress.html': 'progress',
      '/muscle-rotation-manager/exercises.html': 'exercises',
      '/muscle-rotation-manager/settings.html': 'settings',
      '/muscle-rotation-manager/help.html': 'help',
      '/muscle-rotation-manager/privacy.html': 'privacy',
    };
    return pageMap[path] || 'dashboard';
  }

  /**
   * MPA初期化を実行
   * @param {Object} options - 初期化オプション
   * @param {boolean} options.force - 強制初期化（デフォルト: false）
   * @param {boolean} options.skipAuth - 認証チェックをスキップ（デフォルト: false）
   * @returns {Promise<boolean>} 初期化成功かどうか
   */
  async initialize(options = {}) {
    if (this.isInitialized && !options.force) {
      console.log('⚠️ MPA already initialized, skipping...');
      return true;
    }

    console.log(`🚀 Initializing MPA for page: ${this.currentPage}`);
    const startTime = performance.now();
    this.errorCount = 0;

    try {
      // 1. 認証管理の初期化
      await this.initializeAuthManager();

      // 2. ツールチップマネージャーの初期化
      await this.initializeTooltipManager();

      // 3. Supabaseの初期化を待つ
      await this.waitForSupabaseInitialization();

      // 3. 認証状態の確認（スキップオプションがない場合）
      if (!options.skipAuth) {
        await this.checkAuthentication();
      }

      // 3. 共通コンポーネントの読み込み
      await this.loadCommonComponents();

      // 4. ページ固有の初期化
      await this.initializePageSpecific();

      // 5. イベントリスナーの設定
      this.setupEventListeners();

      // 6. エラーハンドリングの設定
      this.setupErrorHandling();

      // 7. パフォーマンス監視の設定
      if (this.enablePerformanceMonitoring) {
        this.setupPerformanceMonitoring();
      }

      this.initializationTime = performance.now() - startTime;
      this.isInitialized = true;

      console.log(
        `✅ MPA initialization complete (${this.initializationTime.toFixed(2)}ms)`
      );

      // 初期化完了イベントを発火
      this.dispatchEvent('mpaInitialized', {
        page: this.currentPage,
        initTime: this.initializationTime,
        componentLoadTimes: Object.fromEntries(this.componentLoadTimes),
      });

      return true;
    } catch (error) {
      this.errorCount++;
      console.error(
        `❌ MPA initialization failed (attempt ${this.errorCount}):`,
        error
      );

      // リトライロジック
      if (this.errorCount < this.maxRetries) {
        console.log(
          `🔄 Retrying MPA initialization in ${this.retryDelay}ms...`
        );
        await this.delay(this.retryDelay);
        return await this.initialize({ ...options, force: true });
      }

      this.handleInitializationError(error);
      return false;
    }
  }

  /**
   * 認証状態をチェック
   */
  async checkAuthentication() {
    try {
      // Supabaseが利用可能かチェック
      if (!supabaseService.isAvailable()) {
        console.log('🔐 Supabase not available, skipping authentication check');
        return true; // Supabaseが利用できない場合は認証チェックをスキップ
      }

      const isAuthenticated = await authManager.isAuthenticated();
      const currentUser = await authManager.getCurrentUser();

      console.log('🔐 Authentication check:', {
        isAuthenticated,
        user: currentUser?.email || 'anonymous',
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
                                <button onclick="window.location.href='index.html'"
                                        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    <i class="fas fa-home mr-2"></i>
                                    ホームに戻る
                                </button>
                                <button data-action="login"
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

      // ヘッダー、サイドバー、フッターを並行読み込み
      const [headerResult, sidebarResult, footerResult] =
        await Promise.allSettled([
          this.loadHeader(),
          this.loadSidebar(),
          this.loadFooter(),
        ]);

      // 結果をログ出力
      console.log('Component loading results:', {
        header: headerResult.status,
        sidebar: sidebarResult.status,
        footer: footerResult.status,
      });

      // エラーハンドリング
      if (headerResult.status === 'rejected') {
        console.warn('Header loading failed:', headerResult.reason);
      }
      if (sidebarResult.status === 'rejected') {
        console.warn('Sidebar loading failed:', sidebarResult.reason);
      }
      if (footerResult.status === 'rejected') {
        console.warn('Footer loading failed:', footerResult.reason);
      }

      // ヘッダーが読み込まれた後に認証イベントリスナーを再設定
      if (headerResult.status === 'fulfilled') {
        console.log('🔄 Re-setting up auth event listeners after header load');
        await authManager.setupEventListeners();

        // 認証UIを更新
        console.log('🔄 Updating auth UI after header load');
        await authManager.updateAuthUI();
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
   * フッターを読み込み
   */
  async loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) {
      throw new Error('Footer container not found');
    }

    try {
      const response = await fetch('partials/footer.html');
      if (!response.ok) {
        throw new Error(`Failed to load footer: ${response.status}`);
      }
      const footerHTML = await response.text();
      footerContainer.innerHTML = footerHTML;
      console.log('✅ Footer loaded successfully');
    } catch (error) {
      console.error('❌ Footer loading failed:', error);
      throw error;
    }
  }

  /**
   * ページ固有の初期化
   */
  async initializePageSpecific() {
    try {
      console.log(
        `🔄 Initializing page-specific functionality for: ${this.currentPage}`
      );

      // ページ固有のJavaScriptモジュールを動的インポート
      const pageModule = await this.loadPageModule(this.currentPage);

      if (pageModule && typeof pageModule.initialize === 'function') {
        console.log(
          `🔄 Calling initialize for ${this.currentPage} page module`
        );
        await pageModule.initialize();
        console.log(
          `✅ Page-specific initialization complete for: ${this.currentPage}`
        );
      } else {
        console.warn(
          `⚠️ No initialize method found for ${this.currentPage} page module`
        );
      }
    } catch (error) {
      console.warn(
        `⚠️ Page-specific initialization failed for ${this.currentPage}:`,
        error
      );
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
        workout: () => import('../pages/workoutPage.js'),
        calendar: () => import('../pages/calendarPage.js'),
        analysis: () => import('../pages/analysisPage.js'),
        progress: () => import('../pages/progressPage.js'),
        exercises: () => import('../pages/exercisePage.js'),
        settings: () => import('../pages/settingsPage.js'),
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

    // ナビゲーションリンクのクリックイベント（MPA用）
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('a[href]');
      if (navLink && navLink.getAttribute('href').startsWith('/')) {
        // MPAではデフォルトのナビゲーションを使用
        const href = navLink.getAttribute('href');
        console.log('🔗 Navigation link clicked:', href);
        // デフォルトのナビゲーションを許可（e.preventDefault()を削除）
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
      if (
        mobileSidebar &&
        !mobileSidebar.contains(e.target) &&
        !mobileMenuBtn?.contains(e.target)
      ) {
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
        showNotification: true,
      });
    });

    // 未処理のPromise拒否をキャッチ
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Unhandled Promise Rejection:', event.reason);
      handleError(event.reason, {
        context: 'Unhandled Promise Rejection',
        showNotification: true,
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

  /**
   * 認証管理の初期化
   * @returns {Promise<void>}
   */
  async initializeAuthManager() {
    try {
      console.log('🔐 Initializing auth manager...');
      await authManager.initialize();
      console.log('✅ Auth manager initialized');
    } catch (error) {
      console.error('❌ Auth manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * ツールチップマネージャーを初期化
   */
  async initializeTooltipManager() {
    try {
      console.log('💡 Initializing tooltip manager...');
      tooltipManager.initialize();
      console.log('✅ Tooltip manager initialized');
    } catch (error) {
      console.error('❌ Tooltip manager initialization failed:', error);
      // ツールチップの初期化に失敗してもアプリケーションは動作する
    }
  }

  /**
   * Supabaseの初期化完了を待つ
   */
  async waitForSupabaseInitialization() {
    const maxWaitTime = 10000; // 10秒
    const checkInterval = 100; // 100ms
    let elapsedTime = 0;

    console.log('⏳ Waiting for Supabase initialization...');

    while (elapsedTime < maxWaitTime) {
      if (supabaseService.isAvailable()) {
        console.log('✅ Supabase initialization confirmed');
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      elapsedTime += checkInterval;
    }

    console.warn(
      '⚠️ Supabase initialization timeout - proceeding without Supabase'
    );
    return false;
  }

  /**
   * パフォーマンス監視の設定
   */
  setupPerformanceMonitoring() {
    console.log('📊 Setting up performance monitoring...');

    // ページ読み込み時間の監視
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log(`📊 Page load time: ${loadTime.toFixed(2)}ms`);

      this.dispatchEvent('performanceMetric', {
        metric: 'pageLoadTime',
        value: loadTime,
        timestamp: new Date().toISOString(),
      });
    });

    // メモリ使用量の監視（開発モードのみ）
    if (window.DEV_MODE && performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        const memoryInfo = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        };

        console.log('📊 Memory usage:', memoryInfo);

        this.dispatchEvent('performanceMetric', {
          metric: 'memoryUsage',
          value: memoryInfo,
          timestamp: new Date().toISOString(),
        });
      }, 30000); // 30秒ごと
    }

    console.log('✅ Performance monitoring setup complete');
  }

  /**
   * カスタムイベントを発火
   * @param {string} eventName - イベント名
   * @param {Object} detail - イベント詳細
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        page: this.currentPage,
        timestamp: new Date().toISOString(),
        ...detail,
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * 遅延実行
   * @param {number} ms - 遅延時間（ミリ秒）
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * MPAの健全性チェック
   * @returns {Object} 健全性チェック結果
   */
  healthCheck() {
    const issues = [];

    if (this.errorCount > 3) {
      issues.push('High error count');
    }

    if (this.initializationTime && this.initializationTime > 10000) {
      issues.push('Slow initialization');
    }

    if (this.componentLoadTimes.size === 0) {
      issues.push('No components loaded');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 25),
      metrics: {
        errorCount: this.errorCount,
        initializationTime: this.initializationTime,
        componentCount: this.componentLoadTimes.size,
      },
    };
  }

  /**
   * MPAの最適化を実行
   * @returns {Promise<void>}
   */
  async optimize() {
    console.log('🔧 Optimizing MPA...');

    // メモリ使用量の最適化
    if (window.gc) {
      window.gc();
    }

    // 不要なイベントリスナーの削除
    this.cleanup();

    console.log('✅ MPA optimization complete');
  }

  /**
   * クリーンアップ処理
   */
  cleanup() {
    console.log('🧹 Cleaning up MPA...');

    // イベントリスナーの削除
    this.removeAllEventListeners();

    // コンポーネント読み込み時間のクリア
    this.componentLoadTimes.clear();

    console.log('✅ MPA cleanup complete');
  }

  /**
   * 全イベントリスナーを削除
   */
  removeAllEventListeners() {
    // カスタムイベントリスナーの削除
    const events = ['online', 'offline', 'error', 'unhandledrejection'];
    events.forEach((event) => {
      window.removeEventListener(
        event,
        this[`handle${event.charAt(0).toUpperCase() + event.slice(1)}`]
      );
    });
  }

  /**
   * MPAの状態を取得
   * @returns {Object} MPAの状態
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      currentPage: this.currentPage,
      initializationTime: this.initializationTime,
      errorCount: this.errorCount,
      componentLoadTimes: Object.fromEntries(this.componentLoadTimes),
      autoInitialize: this.autoInitialize,
      enablePerformanceMonitoring: this.enablePerformanceMonitoring,
    };
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
