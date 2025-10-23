// js/components/Navigation.js - ナビゲーションコンポーネント

import { authManager } from '../modules/authManager.js';
import { showNotification } from '../utils/helpers.js';
import { tooltipManager } from '../utils/tooltip.js';

/**
 * ナビゲーションコンポーネント
 * 全ページで共通のナビゲーション機能を提供
 */
export class Navigation {
    constructor() {
        this.isInitialized = false;
        this.currentPage = '';
        this.navigationItems = [
            { id: 'dashboard', name: 'ダッシュボード', icon: 'fas fa-tachometer-alt', href: '/dashboard.html', requiresAuth: true },
            { id: 'workout', name: 'ワークアウト', icon: 'fas fa-dumbbell', href: '/workout.html', requiresAuth: true },
            { id: 'calendar', name: 'カレンダー', icon: 'fas fa-calendar-alt', href: '/calendar.html', requiresAuth: true },
            { id: 'analysis', name: '分析', icon: 'fas fa-chart-line', href: '/analysis.html', requiresAuth: true },
            { id: 'progress', name: 'プログレッシブ・オーバーロード', icon: 'fas fa-trophy', href: '/progress.html', requiresAuth: true },
            { id: 'exercises', name: 'エクササイズデータベース', icon: 'fas fa-database', href: '/exercises.html', requiresAuth: true },
            { id: 'settings', name: '設定', icon: 'fas fa-cog', href: '/settings.html', requiresAuth: true },
            { id: 'help', name: '使い方', icon: 'fas fa-question-circle', href: '/help.html', requiresAuth: false },
            { id: 'privacy', name: 'プライバシーポリシー', icon: 'fas fa-shield-alt', href: '/privacy.html', requiresAuth: false }
        ];
    }

    /**
   * ナビゲーションを初期化
   */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('🔄 Initializing navigation...');

            // 現在のページを特定
            this.currentPage = this.getCurrentPage();

            // ヘッダーを読み込み
            await this.loadHeader();

            // サイドバーを読み込み
            await this.loadSidebar();

            // イベントリスナーを設定
            this.setupEventListeners();

            // 認証状態に応じてナビゲーションを更新
            await this.updateNavigationForAuth();

            // ナビゲーションアイテムにツールチップを追加
            this.addNavigationTooltips();

            this.isInitialized = true;
            console.log('✅ Navigation initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize navigation:', error);
            throw error;
        }
    }

    /**
   * 現在のページを取得
   */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page || 'index';
    }

    /**
   * ヘッダーを読み込み
   */
    async loadHeader() {
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) {
            console.warn('Header container not found');
            return;
        }

        try {
            const response = await fetch('/partials/header.html');
            if (response.ok) {
                const html = await response.text();
                headerContainer.innerHTML = html;
            } else {
                // フォールバック: 基本的なヘッダーを生成
                headerContainer.innerHTML = this.generateBasicHeader();
            }
        } catch (error) {
            console.error('Failed to load header:', error);
            headerContainer.innerHTML = this.generateBasicHeader();
        }
    }

    /**
   * サイドバーを読み込み
   */
    async loadSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) {
            console.warn('Sidebar container not found');
            return;
        }

        try {
            const response = await fetch('/partials/sidebar.html');
            if (response.ok) {
                const html = await response.text();
                sidebarContainer.innerHTML = html;
            } else {
                // フォールバック: 基本的なサイドバーを生成
                sidebarContainer.innerHTML = this.generateBasicSidebar();
            }
        } catch (error) {
            console.error('Failed to load sidebar:', error);
            sidebarContainer.innerHTML = this.generateBasicSidebar();
        }
    }

    /**
   * 基本的なヘッダーを生成
   */
    generateBasicHeader() {
        return `
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <a href="/index.html" class="flex items-center">
                <i class="fas fa-dumbbell text-2xl text-blue-600 mr-2"></i>
                <span class="text-xl font-bold text-gray-800">MuscleRotationManager</span>
              </a>
            </div>
            <div class="flex items-center space-x-4">
              <button id="mobile-menu-btn" class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <i class="fas fa-bars"></i>
              </button>
              <div class="hidden md:flex items-center space-x-4">
                <span id="user-info" class="text-sm text-gray-600"></span>
                <button id="logout-btn" class="text-sm text-gray-600 hover:text-gray-900">ログアウト</button>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;
    }

    /**
   * 基本的なサイドバーを生成
   */
    generateBasicSidebar() {
        const navItems = this.navigationItems.map(item => {
            const isActive = this.currentPage === item.id;
            const activeClass = isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100';

            return `
        <a href="${item.href}" class="flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeClass}">
          <i class="${item.icon} mr-3"></i>
          ${item.name}
        </a>
      `;
        }).join('');

        return `
      <div class="hidden md:flex md:flex-shrink-0">
        <div class="flex flex-col w-64 bg-white border-r border-gray-200">
          <div class="flex flex-col h-0 flex-1">
            <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav class="mt-5 flex-1 px-2 space-y-1">
                ${navItems}
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mobile sidebar -->
      <div id="mobile-sidebar" class="md:hidden fixed inset-0 z-50 hidden">
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button id="mobile-sidebar-close" class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <i class="fas fa-times text-white"></i>
            </button>
          </div>
          <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div class="flex-shrink-0 flex items-center px-4">
              <i class="fas fa-dumbbell text-2xl text-blue-600 mr-2"></i>
              <span class="text-xl font-bold text-gray-800">MuscleRotationManager</span>
            </div>
            <nav class="mt-5 px-2 space-y-1">
              ${navItems}
            </nav>
          </div>
        </div>
      </div>
    `;
    }

    /**
   * イベントリスナーを設定
   */
    setupEventListeners() {
    // モバイルメニューボタン
        this.addEventListener(document.getElementById('mobile-menu-btn'), 'click', () => {
            this.toggleMobileSidebar();
        });

        // モバイルサイドバーを閉じるボタン
        this.addEventListener(document.getElementById('mobile-sidebar-close'), 'click', () => {
            this.closeMobileSidebar();
        });

        // モバイルサイドバー外クリックで閉じる
        this.addEventListener(document.getElementById('mobile-sidebar'), 'click', (e) => {
            if (e.target.id === 'mobile-sidebar') {
                this.closeMobileSidebar();
            }
        });

        // ログアウトボタン
        this.addEventListener(document.getElementById('logout-btn'), 'click', () => {
            this.handleLogout();
        });

        // ナビゲーションリンクのクリック
        this.addEventListener(document, 'click', (e) => {
            const navLink = e.target.closest('a[href]');
            if (navLink && navLink.getAttribute('href').startsWith('/')) {
                this.handleNavigationClick(navLink);
            }
        });
    }

    /**
   * モバイルサイドバーを切り替え
   */
    toggleMobileSidebar() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (mobileSidebar) {
            mobileSidebar.classList.toggle('hidden');
        }
    }

    /**
   * モバイルサイドバーを閉じる
   */
    closeMobileSidebar() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (mobileSidebar) {
            mobileSidebar.classList.add('hidden');
        }
    }

    /**
   * ナビゲーションクリックを処理
   */
    async handleNavigationClick(navLink, event) {
        const href = navLink.getAttribute('href');
        const pageId = href.split('/').pop().replace('.html', '');

        // 認証が必要なページかチェック
        const navItem = this.navigationItems.find(item => item.id === pageId);
        if (navItem && navItem.requiresAuth) {
            const isAuthenticated = await authManager.isAuthenticated();
            if (!isAuthenticated) {
                event.preventDefault();
                showNotification('ログインが必要です', 'warning');
                return;
            }
        }

        // モバイルサイドバーを閉じる
        this.closeMobileSidebar();
    }

    /**
   * ログアウトを処理
   */
    async handleLogout() {
        try {
            await authManager.logout();
            showNotification('ログアウトしました', 'success');
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Logout failed:', error);
            showNotification('ログアウトに失敗しました', 'error');
        }
    }

    /**
   * 認証状態に応じてナビゲーションを更新
   */
    async updateNavigationForAuth() {
        const isAuthenticated = await authManager.isAuthenticated();
        const userInfo = document.getElementById('user-info');
        const logoutBtn = document.getElementById('logout-btn');

        if (isAuthenticated) {
            const user = authManager.getCurrentUser();
            if (userInfo) {
                userInfo.textContent = `こんにちは、${user.email}さん`;
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
            }
        } else {
            if (userInfo) {
                userInfo.textContent = '';
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
        }
    }

    /**
   * イベントリスナーを追加
   */
    addEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
        }
    }

    /**
   * ナビゲーションを破棄
   */
    destroy() {
        this.isInitialized = false;
        console.log('🗑️ Navigation destroyed');
    }
}
