// js/core/BasePage.js - ベースページクラス

import { authManager } from '../modules/authManager.js';
import { supabaseService } from '../services/supabaseService.js';
import { showNotification } from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';

/**
 * ベースページクラス
 * 全ページで共通の機能を提供
 * 
 * @class BasePage
 * @version 2.0.0
 * @since 1.0.0
 */
export class BasePage {
    /**
     * ベースページのコンストラクタ
     * @param {Object} options - 初期化オプション
     * @param {string} options.pageName - ページ名（オプション）
     * @param {boolean} options.requiresAuth - 認証が必要かどうか（デフォルト: true）
     */
    constructor(options = {}) {
        this.pageName = options.pageName || this.constructor.name.toLowerCase().replace('page', '');
        this.isInitialized = false;
        this.eventListeners = new Map();
        this.requiresAuth = options.requiresAuth !== false; // デフォルトはtrue
        this.initializationTime = null;
        this.errorCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1秒
    }

    /**
     * ページを初期化
     * @param {Object} options - 初期化オプション
     * @param {boolean} options.force - 強制初期化（デフォルト: false）
     * @param {boolean} options.skipAuth - 認証チェックをスキップ（デフォルト: false）
     * @returns {Promise<boolean>} 初期化成功かどうか
     */
    async initialize(options = {}) {
        if (this.isInitialized && !options.force) {
            console.warn(`⚠️ Page ${this.pageName} already initialized`);
            return true;
        }

        const startTime = performance.now();
        this.errorCount = 0;

        try {
            console.log(`🔄 Initializing ${this.pageName} page...`);

            // 認証状態をチェック（スキップオプションがない場合）
            if (!options.skipAuth) {
                await this.checkAuthentication();
            }

            // ページ固有の初期化処理
            await this.onInitialize();

            // データの読み込み
            await this.loadData();

            // イベントリスナーの設定
            this.setupEventListeners();

            this.isInitialized = true;
            this.initializationTime = performance.now() - startTime;
            
            console.log(`✅ ${this.pageName} page initialized successfully (${this.initializationTime.toFixed(2)}ms)`);

            // 初期化完了イベントを発火
            this.dispatchEvent('pageInitialized', {
                pageName: this.pageName,
                initTime: this.initializationTime
            });

            return true;

        } catch (error) {
            this.errorCount++;
            console.error(`❌ Failed to initialize ${this.pageName} page (attempt ${this.errorCount}):`, error);
            
            // リトライロジック
            if (this.errorCount < this.maxRetries) {
                console.log(`🔄 Retrying initialization in ${this.retryDelay}ms...`);
                await this.delay(this.retryDelay);
                return await this.initialize({ ...options, force: true });
            }
            
            this.handleError(error);
            return false;
        }
    }

    /**
     * 認証状態をチェック
     * @returns {Promise<boolean>} 認証状態
     */
    async checkAuthentication() {
        try {
            const isAuthenticated = await authManager.isAuthenticated();

            if (!isAuthenticated && this.requiresAuth) {
                console.log(`🔐 Authentication required for ${this.pageName} page`);
                showNotification('ログインが必要です', 'warning');
                
                // リダイレクト前にイベントを発火
                this.dispatchEvent('authRequired', {
                    pageName: this.pageName,
                    redirectUrl: '/index.html'
                });
                
                window.location.href = '/index.html';
                return false;
            }

            return isAuthenticated;
        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            handleError(error, {
                context: 'BasePage.checkAuthentication',
                showNotification: true
            });
            return false;
        }
    }

    /**
     * ページ固有の初期化処理
     * サブクラスでオーバーライド
     * @returns {Promise<void>}
     */
    async onInitialize() {
        // サブクラスで実装
        console.log(`📄 ${this.pageName} page-specific initialization`);
    }

    /**
     * イベントリスナーの設定
     * サブクラスでオーバーライド
     */
    setupEventListeners() {
        // サブクラスで実装
        console.log(`🎧 Setting up event listeners for ${this.pageName} page`);
    }

    /**
     * データの読み込み
     * サブクラスでオーバーライド
     * @returns {Promise<any>} 読み込まれたデータ
     */
    async loadData() {
        // サブクラスで実装
        console.log(`📊 Loading data for ${this.pageName} page`);
        return null;
    }

    /**
     * エラーハンドリング
     * @param {Error} error - エラーオブジェクト
     * @param {Object} options - エラーハンドリングオプション
     * @param {boolean} options.showNotification - 通知を表示するかどうか
     * @param {boolean} options.showErrorPage - エラーページを表示するかどうか
     */
    handleError(error, options = {}) {
        const {
            showNotification: shouldShowNotification = true,
            showErrorPage: shouldShowErrorPage = true
        } = options;

        console.error(`❌ Error in ${this.pageName} page:`, error);

        // エラーハンドラーに委譲
        handleError(error, {
            context: `BasePage.${this.pageName}`,
            showNotification: shouldShowNotification,
            severity: 'error'
        });

        // ユーザーにエラーを通知
        if (shouldShowNotification) {
            showNotification('ページの読み込み中にエラーが発生しました', 'error');
        }

        // エラーページを表示
        if (shouldShowErrorPage) {
            this.showErrorPage(error);
        }

        // エラーイベントを発火
        this.dispatchEvent('pageError', {
            pageName: this.pageName,
            error: error.message,
            stack: error.stack
        });
    }

    /**
   * エラーページを表示
   */
    showErrorPage(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <div class="text-red-500 text-6xl mb-4">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
            <p class="text-gray-600 mb-4">ページの読み込み中に問題が発生しました。</p>
            <div class="space-x-4">
              <button onclick="window.location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                再読み込み
              </button>
              <button onclick="window.location.href='/index.html'" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                ホームに戻る
              </button>
            </div>
            ${typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development' ? `
              <details class="mt-4 text-left">
                <summary class="cursor-pointer text-sm text-gray-500">エラー詳細</summary>
                <pre class="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">${error.stack}</pre>
              </details>
            ` : ''}
          </div>
        </div>
      `;
        }
    }

    /**
   * イベントリスナーを追加
   */
    addEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);

            // イベントリスナーを記録（後でクリーンアップ用）
            const key = `${element.id || 'unknown'}_${event}`;
            this.eventListeners.set(key, { element, event, handler });
        }
    }

    /**
   * イベントリスナーを削除
   */
    removeEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.removeEventListener(event, handler);

            const key = `${element.id || 'unknown'}_${event}`;
            this.eventListeners.delete(key);
        }
    }

    /**
   * 全イベントリスナーをクリーンアップ
   */
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    /**
   * ページを破棄
   */
    destroy() {
        this.cleanup();
        this.isInitialized = false;
        console.log(`🗑️ ${this.pageName} page destroyed`);
    }

    /**
   * データを保存
   */
    async saveData(data) {
        try {
            if (supabaseService.isAvailable()) {
                return await supabaseService.saveData(data);
            } else {
                // オフライン時はローカルストレージに保存
                return await this.saveToLocalStorage(data);
            }
        } catch (error) {
            console.error('Failed to save data:', error);
            throw error;
        }
    }

    /**
   * ローカルストレージに保存
   */
    async saveToLocalStorage(data) {
        const key = `${this.pageName}_data`;
        const existingData = JSON.parse(localStorage.getItem(key) || '[]');
        existingData.push({
            ...data,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        });
        localStorage.setItem(key, JSON.stringify(existingData));
        return existingData[existingData.length - 1];
    }

    /**
   * データを読み込み
   */
    async loadDataFromStorage() {
        try {
            if (supabaseService.isAvailable()) {
                return await supabaseService.loadData(this.pageName);
            } else {
                return await this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            return [];
        }
    }

    /**
   * ローカルストレージから読み込み
   */
    async loadFromLocalStorage() {
        const key = `${this.pageName}_data`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    /**
     * ページの状態を取得
     * @returns {Object} ページの状態
     */
    getState() {
        return {
            pageName: this.pageName,
            isInitialized: this.isInitialized,
            eventListenersCount: this.eventListeners.size,
            initializationTime: this.initializationTime,
            errorCount: this.errorCount,
            requiresAuth: this.requiresAuth
        };
    }

    /**
     * カスタムイベントを発火
     * @param {string} eventName - イベント名
     * @param {Object} detail - イベント詳細
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                pageName: this.pageName,
                timestamp: new Date().toISOString(),
                ...detail
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * 遅延実行
     * @param {number} ms - 遅延時間（ミリ秒）
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * ページのパフォーマンス情報を取得
     * @returns {Object} パフォーマンス情報
     */
    getPerformanceInfo() {
        return {
            pageName: this.pageName,
            initializationTime: this.initializationTime,
            errorCount: this.errorCount,
            eventListenersCount: this.eventListeners.size,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    }

    /**
     * ページの健全性チェック
     * @returns {Object} 健全性チェック結果
     */
    healthCheck() {
        const issues = [];
        
        if (this.errorCount > 5) {
            issues.push('High error count');
        }
        
        if (this.eventListeners.size > 50) {
            issues.push('Too many event listeners');
        }
        
        if (this.initializationTime && this.initializationTime > 5000) {
            issues.push('Slow initialization');
        }

        return {
            isHealthy: issues.length === 0,
            issues,
            score: Math.max(0, 100 - (issues.length * 20))
        };
    }

    /**
     * ページの最適化を実行
     * @returns {Promise<void>}
     */
    async optimize() {
        console.log(`🔧 Optimizing ${this.pageName} page...`);
        
        // 不要なイベントリスナーの削除
        this.cleanup();
        
        // メモリ使用量の最適化
        if (window.gc) {
            window.gc();
        }
        
        console.log(`✅ ${this.pageName} page optimization complete`);
    }
}
