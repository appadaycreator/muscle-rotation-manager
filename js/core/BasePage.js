// js/core/BasePage.js - ベースページクラス

import { authManager } from '../modules/authManager.js';
import { supabaseService } from '../services/supabaseService.js';
import { showNotification } from '../utils/helpers.js';

/**
 * ベースページクラス
 * 全ページで共通の機能を提供
 */
export class BasePage {
    constructor() {
        this.pageName = this.constructor.name.toLowerCase().replace('page', '');
        this.isInitialized = false;
        this.eventListeners = new Map();
    }

    /**
   * ページを初期化
   */
    async initialize() {
        if (this.isInitialized) {
            console.warn(`Page ${this.pageName} already initialized`);
            return;
        }

        try {
            console.log(`🔄 Initializing ${this.pageName} page...`);

            // 認証状態をチェック
            await this.checkAuthentication();

            // ページ固有の初期化処理
            await this.onInitialize();

            // データの読み込み
            await this.loadData();

            this.isInitialized = true;
            console.log(`✅ ${this.pageName} page initialized successfully`);

        } catch (error) {
            console.error(`❌ Failed to initialize ${this.pageName} page:`, error);
            this.handleError(error);
        }
    }

    /**
   * 認証状態をチェック
   */
    async checkAuthentication() {
        const isAuthenticated = await authManager.isAuthenticated();

        if (!isAuthenticated) {
            // 認証が必要なページの場合
            if (this.requiresAuth()) {
                showNotification('ログインが必要です', 'warning');
                window.location.href = '/index.html';

            }
        }
    }

    /**
   * 認証が必要かどうかを判定
   * サブクラスでオーバーライド
   */
    requiresAuth() {
        return true;
    }

    /**
   * ページ固有の初期化処理
   * サブクラスでオーバーライド
   */
    async onInitialize() {
    // サブクラスで実装
    }

    /**
   * イベントリスナーの設定
   * サブクラスでオーバーライド
   */
    setupEventListeners() {
    // サブクラスで実装
    }

    /**
   * データの読み込み
   * サブクラスでオーバーライド
   */
    async loadData() {
    // サブクラスで実装
    }

    /**
   * エラーハンドリング
   */
    handleError(error) {
        console.error(`Error in ${this.pageName} page:`, error);

        // ユーザーにエラーを通知
        showNotification('ページの読み込み中にエラーが発生しました', 'error');

        // エラーページを表示
        this.showErrorPage(error);
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
   */
    getState() {
        return {
            pageName: this.pageName,
            isInitialized: this.isInitialized,
            eventListenersCount: this.eventListeners.size
        };
    }
}
