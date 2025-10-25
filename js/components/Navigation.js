// js/components/Navigation.js - ナビゲーションコンポーネント

import { authManager } from '../modules/authManager.js';
import { showNotification } from '../utils/helpers.js';
import { tooltipManager } from '../utils/TooltipManager.js';

/**
 * ナビゲーションコンポーネント
 * 全ページで共通のナビゲーション機能を提供
 */
export class Navigation {
    constructor() {
        this.isInitialized = false;
        this.currentPage = '';
        this.sidebarVisible = false;
        this.focusTimeout = null;
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

            // ツールチップを設定（サイドバー読み込み後）
            this.setupTooltips();

            // 認証状態に応じてナビゲーションを更新
            await this.updateNavigationForAuth();

            // ナビゲーションアイテムにツールチップを追加（setupTooltipsで既に設定済みのためスキップ）
            // this.addNavigationTooltips();

            // フォーカス管理機能を設定
            this.setupFocusManagement();

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
                this.handleNavigationClick(navLink, e);
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

        console.log('Navigation click:', { href, pageId });

        // 認証が必要なページかチェック
        const navItem = this.navigationItems.find(item => item.id === pageId);
        if (navItem && navItem.requiresAuth) {
            console.log('Page requires auth, checking authentication...');
            const isAuthenticated = await authManager.isAuthenticated();
            console.log('Authentication result:', isAuthenticated);
            
            if (!isAuthenticated) {
                event.preventDefault();
                event.stopPropagation();
                showNotification('ログインが必要です', 'warning');
                return;
            }
        }

        // モバイルサイドバーを閉じる
        this.closeMobileSidebar();
        
        console.log('Navigation allowed, proceeding to:', href);
    }

    /**
   * ログアウトを処理
   */
    async handleLogout() {
        try {
            await authManager.logout();
            showNotification('ログアウトしました', 'success');
            
            // テスト環境ではナビゲーションをモック
            if (typeof window !== 'undefined' && window.location) {
                // CI環境でのJSDOMナビゲーション制限を回避
                const isTestEnvironment = typeof process !== 'undefined' && 
                    (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID);
                
                if (isTestEnvironment) {
                    // テスト環境ではナビゲーションをスキップ
                    console.log('Navigation skipped in test environment');
                    return;
                }
                
                try {
                    window.location.href = '/index.html';
                } catch (error) {
                    // JSDOM環境ではlocation.hrefの直接設定が失敗する可能性がある
                    // その場合はassignメソッドを使用
                    if (window.location.assign) {
                        window.location.assign('/index.html');
                    } else {
                        console.warn('Navigation not available in test environment');
                    }
                }
            }
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
     * ナビゲーションアイテムにツールチップを追加
     */
    addNavigationTooltips() {
        console.log('💡 Adding tooltips to navigation items...');

        try {
            // サイドバーが存在するか確認
            const sidebar = document.getElementById('desktop-sidebar');
            if (!sidebar) {
                console.warn('⚠️ Desktop sidebar not found for navigation tooltips, retrying in 100ms...');
                setTimeout(() => {
                    this.addNavigationTooltips();
                }, 100);
                return;
            }

            // ナビゲーションアイテムのツールチップ設定
            const navTooltips = [
                { id: 'dashboard', text: 'ダッシュボード\nトレーニングの概要と進捗を確認' },
                { id: 'workout', text: 'ワークアウト\n新しいトレーニングを開始' },
                { id: 'calendar', text: 'カレンダー\nトレーニングスケジュールを管理' },
                { id: 'analysis', text: '分析\nトレーニングデータを分析' },
                { id: 'progress', text: 'プログレッシブ・オーバーロード\n筋力向上の進捗を追跡' },
                { id: 'exercises', text: 'エクササイズデータベース\nエクササイズの詳細情報を確認' },
                { id: 'settings', text: '設定\nアプリケーションの設定を変更' },
                { id: 'help', text: '使い方\nアプリケーションの使い方を確認' },
                { id: 'privacy', text: 'プライバシーポリシー\nプライバシーに関する情報' }
            ];

            // 各ナビゲーションアイテムにツールチップを追加
            navTooltips.forEach(item => {
                // より具体的なセレクターを使用
                const elements = document.querySelectorAll(`a[href="/${item.id}.html"]`);
                console.log(`🔍 Looking for elements with href="/${item.id}.html":`, elements.length);
                
                elements.forEach(element => {
                    console.log(`📌 Adding tooltip to element:`, element);
                    tooltipManager.addTooltip(element, item.text, {
                        position: 'right',
                        maxWidth: 200,
                        theme: 'light',
                        delay: 500
                    });
                });
            });

            console.log('✅ Navigation tooltips added successfully');

        } catch (error) {
            console.error('❌ Failed to add navigation tooltips:', error);
        }
    }

    /**
     * フォーカス管理機能を設定
     */
    setupFocusManagement() {
        console.log('🎯 Setting up focus management...');

        try {
            // デスクトップサイドバーのフォーカス管理
            this.setupDesktopSidebarFocus();

            // モバイルサイドバーのフォーカス管理
            this.setupMobileSidebarFocus();

            // キーボードナビゲーション
            this.setupKeyboardNavigation();

            console.log('✅ Focus management setup complete');

        } catch (error) {
            console.error('❌ Failed to setup focus management:', error);
        }
    }

    /**
     * デスクトップサイドバーのフォーカス管理
     */
    setupDesktopSidebarFocus() {
        const desktopSidebar = document.getElementById('desktop-sidebar');
        if (!desktopSidebar) {return;}

        // サイドバーにフォーカスが当たった時の処理
        desktopSidebar.addEventListener('focusin', (e) => {
            console.log('🎯 Desktop sidebar focused');
            this.showDesktopSidebar();
        });

        // サイドバーからフォーカスが外れた時の処理
        desktopSidebar.addEventListener('focusout', (e) => {
            // フォーカスがサイドバー内の他の要素に移動した場合は表示を維持
            if (!desktopSidebar.contains(e.relatedTarget)) {
                console.log('🎯 Desktop sidebar focus lost');
                this.hideDesktopSidebar();
            }
        });

        // ナビゲーションアイテムのフォーカス管理
        const navItems = desktopSidebar.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            item.addEventListener('focus', () => {
                this.showDesktopSidebar();
            });

            // キーボードナビゲーション
            item.addEventListener('keydown', (e) => {
                this.handleNavigationKeydown(e, navItems, index);
            });
        });
    }

    /**
     * モバイルサイドバーのフォーカス管理
     */
    setupMobileSidebarFocus() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (!mobileSidebar) {return;}

        // モバイルサイドバーのフォーカス管理
        mobileSidebar.addEventListener('focusin', (e) => {
            console.log('🎯 Mobile sidebar focused');
            this.showMobileSidebar();
        });

        mobileSidebar.addEventListener('focusout', (e) => {
            if (!mobileSidebar.contains(e.relatedTarget)) {
                console.log('🎯 Mobile sidebar focus lost');
                this.hideMobileSidebar();
            }
        });
    }

    /**
     * キーボードナビゲーションを設定
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Alt + M: サイドバーを開く/閉じる
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                this.toggleSidebar();
            }

            // Escape: サイドバーを閉じる
            if (e.key === 'Escape') {
                this.hideAllSidebars();
            }
        });
    }

    /**
     * デスクトップサイドバーを表示
     */
    showDesktopSidebar() {
        const desktopSidebar = document.getElementById('desktop-sidebar');
        if (!desktopSidebar) {return;}

        // モバイル表示の場合は何もしない
        if (window.innerWidth < 768) {return;}

        desktopSidebar.classList.remove('hidden');
        desktopSidebar.classList.add('flex');
        this.sidebarVisible = true;

        // フォーカス可能な最初の要素にフォーカス
        const firstFocusable = desktopSidebar.querySelector('.nav-item');
        if (firstFocusable) {
            firstFocusable.focus();
        }

        console.log('🎯 Desktop sidebar shown');
    }

    /**
     * デスクトップサイドバーを非表示
     */
    hideDesktopSidebar() {
        const desktopSidebar = document.getElementById('desktop-sidebar');
        if (!desktopSidebar) {return;}

        // モバイル表示の場合は何もしない
        if (window.innerWidth < 768) {return;}

        desktopSidebar.classList.add('hidden');
        desktopSidebar.classList.remove('flex');
        this.sidebarVisible = false;

        console.log('🎯 Desktop sidebar hidden');
    }

    /**
     * モバイルサイドバーを表示
     */
    showMobileSidebar() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (!mobileSidebar) {return;}

        // デスクトップ表示の場合は何もしない
        if (window.innerWidth >= 768) {return;}

        mobileSidebar.classList.remove('hidden');
        mobileSidebar.classList.add('block');
        this.sidebarVisible = true;

        console.log('🎯 Mobile sidebar shown');
    }

    /**
     * モバイルサイドバーを非表示
     */
    hideMobileSidebar() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (!mobileSidebar) {return;}

        // デスクトップ表示の場合は何もしない
        if (window.innerWidth >= 768) {return;}

        mobileSidebar.classList.add('hidden');
        mobileSidebar.classList.remove('block');
        this.sidebarVisible = false;

        console.log('🎯 Mobile sidebar hidden');
    }

    /**
     * サイドバーを切り替え
     */
    toggleSidebar() {
        if (window.innerWidth < 768) {
            // モバイル表示
            const mobileSidebar = document.getElementById('mobile-sidebar');
            if (mobileSidebar) {
                if (mobileSidebar.classList.contains('hidden')) {
                    this.showMobileSidebar();
                } else {
                    this.hideMobileSidebar();
                }
            }
        } else {
            // デスクトップ表示
            const desktopSidebar = document.getElementById('desktop-sidebar');
            if (desktopSidebar) {
                if (desktopSidebar.classList.contains('hidden')) {
                    this.showDesktopSidebar();
                } else {
                    this.hideDesktopSidebar();
                }
            }
        }
    }

    /**
     * すべてのサイドバーを非表示
     */
    hideAllSidebars() {
        this.hideDesktopSidebar();
        this.hideMobileSidebar();
    }

    /**
     * ナビゲーションキーダウンを処理
     */
    handleNavigationKeydown(e, navItems, currentIndex) {
        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % navItems.length;
                navItems[nextIndex].focus();
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                const prevIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
                navItems[prevIndex].focus();
                break;
            }
            case 'Home':
                e.preventDefault();
                navItems[0].focus();
                break;
            case 'End':
                e.preventDefault();
                navItems[navItems.length - 1].focus();
                break;
        }
    }

    /**
     * ツールチップを設定
     */
    setupTooltips() {
        try {
            console.log('Setting up tooltips for navigation');

            // デバッグ: サイドバー要素の存在確認
            const sidebar = document.getElementById('desktop-sidebar');
            console.log('🔍 Desktop sidebar found:', !!sidebar);
            
            if (sidebar) {
                const navLinks = sidebar.querySelectorAll('a[href]');
                console.log('🔗 Navigation links found:', navLinks.length);
                navLinks.forEach((link, index) => {
                    console.log(`Link ${index + 1}:`, link.href, link.textContent.trim());
                });
            } else {
                console.warn('⚠️ Desktop sidebar not found, retrying in 100ms...');
                // サイドバーが読み込まれていない場合、少し待ってから再試行
                setTimeout(() => {
                    this.setupTooltips();
                }, 100);
                return;
            }

            // デスクトップサイドバーのツールチップ
            console.log('🔄 Setting up dashboard tooltip...');
            const dashboardElements = document.querySelectorAll('a[href="/dashboard.html"]');
            console.log(`🔍 Found ${dashboardElements.length} dashboard elements`);
            dashboardElements.forEach((el, index) => {
                console.log(`Dashboard element ${index + 1}:`, el);
            });
            
            tooltipManager.addDynamicTooltip('a[href="/dashboard.html"]', 'ダッシュボード：ワークアウトの統計情報と推奨事項を表示します。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/workout.html"]', 'ワークアウト：筋力トレーニングの記録と管理を行います。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/calendar.html"]', 'カレンダー：過去のワークアウト履歴と予定を確認できます。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/analysis.html"]', '分析：トレーニングデータの詳細な分析とグラフを表示します。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/progress.html"]', 'プログレッシブ・オーバーロード：筋力向上の進捗を科学的に追跡します。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/exercises.html"]', 'エクササイズデータベース：豊富なエクササイズ情報を検索できます。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/settings.html"]', '設定：アカウント情報やアプリケーションの設定を変更できます。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/help.html"]', '使い方：アプリケーションの使用方法とヘルプ情報を表示します。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            tooltipManager.addDynamicTooltip('a[href="/privacy.html"]', 'プライバシーポリシー：個人情報の取り扱いについて説明します。', {
                position: 'right',
                maxWidth: 350,
                minWidth: 250
            });

            // ヘッダー要素のツールチップ
            tooltipManager.addDynamicTooltip('#mobile-menu-btn', 'メニューを開く：モバイル用のナビゲーションメニューを表示します。', {
                position: 'bottom'
            });

            tooltipManager.addDynamicTooltip('#user-avatar', 'ユーザープロフィール：アカウント情報とログアウトオプションを表示します。', {
                position: 'bottom'
            });

            tooltipManager.addDynamicTooltip('#login-btn', 'ログイン：アカウントにログインしてアプリケーションを使用します。', {
                position: 'bottom'
            });

            tooltipManager.addDynamicTooltip('#profile-settings', '設定：アカウント情報やアプリケーションの設定を変更できます。', {
                position: 'bottom'
            });

            tooltipManager.addDynamicTooltip('#logout-btn', 'ログアウト：現在のセッションを終了し、ログイン画面に戻ります。', {
                position: 'bottom'
            });

            // モバイルサイドバーのツールチップ
            tooltipManager.addDynamicTooltip('#mobile-sidebar-close', 'メニューを閉じる：モバイル用のナビゲーションメニューを閉じます。', {
                position: 'bottom'
            });

            console.log('✅ Tooltips setup complete for navigation');

        } catch (error) {
            console.error('❌ Failed to setup tooltips:', error);
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
