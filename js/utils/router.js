// router.js - ルーティング機能

import { showNotification } from './helpers.js';
import { lazyLoader } from './lazyLoader.js';

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.pageCache = new Map();
        this.init();
    }

    /**
     * ルーターを初期化
     */
    init() {
        // ルートを定義
        this.defineRoutes();

        // ブラウザの戻る/進むボタンに対応
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange(e.state?.route || this.getCurrentPath());
        });

        // 初期ルートを処理
        this.handleRouteChange(this.getCurrentPath());
    }

    /**
     * ルートを定義
     */
    defineRoutes() {
        // ダッシュボード
        this.routes.set('/', {
            name: 'dashboard',
            title: 'ダッシュボード',
            component: 'dashboard',
            requiresAuth: true
        });

        // ワークアウト
        this.routes.set('/workout', {
            name: 'workout',
            title: 'ワークアウト',
            component: 'workout',
            requiresAuth: true
        });

        // カレンダー
        this.routes.set('/calendar', {
            name: 'calendar',
            title: 'カレンダー',
            component: 'calendar',
            requiresAuth: true
        });

        // 分析
        this.routes.set('/analysis', {
            name: 'analysis',
            title: '分析',
            component: 'analysis',
            requiresAuth: true
        });

        // プログレッシブ・オーバーロード
        this.routes.set('/progress', {
            name: 'progress',
            title: 'プログレッシブ・オーバーロード',
            component: 'progress',
            requiresAuth: true
        });

        // エクササイズデータベース
        this.routes.set('/exercises', {
            name: 'exercises',
            title: 'エクササイズデータベース',
            component: 'exercises',
            requiresAuth: true
        });

        // 設定
        this.routes.set('/settings', {
            name: 'settings',
            title: '設定',
            component: 'settings',
            requiresAuth: true
        });

        // 使い方
        this.routes.set('/help', {
            name: 'help',
            title: '使い方',
            component: 'help',
            requiresAuth: false
        });

        // プライバシーポリシー
        this.routes.set('/privacy', {
            name: 'privacy',
            title: 'プライバシーポリシー',
            component: 'privacy',
            requiresAuth: false
        });

        // 404エラー
        this.routes.set('/404', {
            name: '404',
            title: 'ページが見つかりません',
            component: '404',
            requiresAuth: false
        });
    }

    /**
     * 現在のパスを取得
     */
    getCurrentPath() {
        return window.location.pathname;
    }

    /**
     * ルート変更を処理
     */
    async handleRouteChange(path) {
        try {
            console.log('🔄 ルート変更:', path);

            // ルートを解決
            const route = this.resolveRoute(path);

            if (!route) {
                console.warn('ルートが見つかりません:', path);
                this.show404Page();
                return;
            }

            // 認証が必要なページかチェック
            if (route.requiresAuth && !this.isAuthenticated()) {
                this.navigateTo('/');
                showNotification('ログインが必要です', 'warning');
                return;
            }

            // ページタイトルを更新
            document.title = `${route.title} - MuscleRotationManager`;

            // ページコンテンツを読み込み
            await this.loadPage(route);

            // ナビゲーション状態を更新
            this.updateNavigation(route.name);

            // ルート変更イベントを発火
            this.dispatchRouteChangeEvent(route);

        } catch (error) {
            console.error('ルート変更エラー:', error);
            this.navigateTo('/404');
        }
    }

    /**
     * ルートを解決
     */
    resolveRoute(path) {
        // 完全一致
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }

        // 動的ルートの処理（将来の拡張用）
        for (const [routePath, route] of this.routes) {
            if (this.matchDynamicRoute(routePath, path)) {
                return route;
            }
        }

        return null;
    }

    /**
     * 動的ルートのマッチング（将来の拡張用）
     */
    matchDynamicRoute(routePath, path) {
        // 例: /workout/:id のような動的ルート
        const routeRegex = routePath.replace(/:\w+/g, '([^/]+)');
        const regex = new RegExp(`^${routeRegex}$`);
        return regex.test(path);
    }

    /**
     * 認証状態をチェック
     */
    isAuthenticated() {
        // 実際の認証チェックロジックを実装
        return localStorage.getItem('user') !== null;
    }

    /**
     * ページを読み込み
     */
    async loadPage(route) {
        try {
            // メインコンテンツエリアを取得
            const mainContent = document.getElementById('main-content');
            if (!mainContent) {
                throw new Error('メインコンテンツエリアが見つかりません');
            }

            // ページコンテンツを読み込み
            const content = await this.loadPageContent(route.component);

            // コンテンツを挿入
            mainContent.innerHTML = content;

            // ページコンポーネントを初期化
            await this.initializePageComponent(route);

        } catch (error) {
            console.error('ページ読み込みエラー:', error);
            throw error;
        }
    }

    /**
     * ページコンテンツを読み込み
     */
    async loadPageContent(componentName) {
        // キャッシュをチェック
        if (this.pageCache.has(componentName)) {
            return this.pageCache.get(componentName);
        }

        try {
            // キャッシュバスティング用のタイムスタンプを追加
            const timestamp = Date.now();
            const url = `partials/${componentName}.html?t=${timestamp}`;
            
            // partialsからHTMLファイルを読み込み
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load partials/${componentName}.html`);
            }

            const content = await response.text();
            this.pageCache.set(componentName, content);
            return content;

        } catch (error) {
            console.error(`ページコンテンツ読み込みエラー (${componentName}):`, error);
            return this.getErrorPage();
        }
    }

    /**
     * エラーページを取得
     */
    getErrorPage() {
        return `
            <div class="page-content">
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">ページの読み込みに失敗しました</h2>
                    <p class="mb-4">しばらく時間をおいてから再度お試しください。</p>
                    <button onclick="router.navigateTo('/')" class="btn-primary">
                        <i class="fas fa-home mr-2"></i>ホームに戻る
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * ページコンポーネントを初期化
     */
    async initializePageComponent(route) {
        try {
            // 遅延ローダーを使用してページコンポーネントを読み込み
            const pageModule = await lazyLoader.loadPageModule(route.component);

            if (pageModule && typeof pageModule.initialize === 'function') {
                await pageModule.initialize();
            }

        } catch (error) {
            console.error(`ページコンポーネント初期化エラー (${route.component}):`, error);
        }
    }

    /**
     * ナビゲーション状態を更新
     */
    updateNavigation(activePageName) {
        // ナビゲーションアイテムのアクティブ状態を更新
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // アクティブなナビゲーションアイテムをハイライト
        const activeNavItem = document.querySelector(`[data-page="${activePageName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }

    /**
     * ルート変更イベントを発火
     */
    dispatchRouteChangeEvent(route) {
        const event = new CustomEvent('routechange', {
            detail: {
                route,
                path: this.getCurrentPath()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * 指定されたルートにナビゲート
     */
    navigateTo(path) {
        if (path === this.getCurrentPath()) {
            return; // 同じページの場合は何もしない
        }

        // 個別HTMLファイルへの直接ナビゲーションをチェック
        if (this.isDirectHtmlFile(path)) {
            window.location.href = path;
            return;
        }

        // 履歴に追加
        window.history.pushState({ route: path }, '', path);

        // ルート変更を処理
        this.handleRouteChange(path);
    }

    /**
     * 個別HTMLファイルへの直接ナビゲーションかチェック
     */
    isDirectHtmlFile(path) {
        // .html拡張子がある場合のみHTMLファイルとして扱う
        return path.endsWith('.html');
    }

    /**
     * 404ページを表示
     */
    show404Page() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
            <div class="page-content">
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">404 - ページが見つかりません</h2>
                    <p class="mb-4">お探しのページは存在しないか、移動された可能性があります。</p>
                    <div class="flex justify-center space-x-4">
                        <button onclick="router.navigateTo('/')" class="btn-primary">
                            <i class="fas fa-home mr-2"></i>ホームに戻る
                        </button>
                        <button onclick="window.history.back()" class="btn-secondary">
                            <i class="fas fa-arrow-left mr-2"></i>前のページに戻る
                        </button>
                    </div>
                </div>
            </div>
        `;

            // ページタイトルを更新
            document.title = '404 - ページが見つかりません - MuscleRotationManager';
        }
    }

    /**
     * 指定されたルートに置換（履歴に追加しない）
     */
    replaceTo(path) {
        window.history.replaceState({ route: path }, '', path);
        this.handleRouteChange(path);
    }

    /**
     * 前のページに戻る
     */
    goBack() {
        window.history.back();
    }

    /**
     * 次のページに進む
     */
    goForward() {
        window.history.forward();
    }

    /**
     * 現在のルート情報を取得
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * ルートキャッシュをクリア
     */
    clearCache() {
        this.pageCache.clear();
        console.log('🔄 Router cache cleared');
    }

    /**
     * 完全なキャッシュクリア
     */
    clearAllCache() {
        // ルーターキャッシュをクリア
        this.pageCache.clear();
        
        // ローカルストレージをクリア
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
            console.log('🔄 Local storage cleared');
        }
        
        // セッションストレージをクリア
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
            console.log('🔄 Session storage cleared');
        }
        
        // Service Workerをクリア
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
                console.log('🔄 Service workers cleared');
            });
        }
        
        // ブラウザキャッシュをクリア
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
                console.log('🔄 Browser caches cleared');
            });
        }
        
        console.log('🔄 All caches cleared successfully');
    }

    /**
     * 特定のページのキャッシュをクリア
     */
    clearPageCache(pageName) {
        this.pageCache.delete(pageName);
    }
}

// グローバルルーターインスタンスを作成
const router = new Router();

// グローバルに公開
window.router = router;

// グローバルキャッシュクリア機能を追加
window.clearAllCache = () => {
    router.clearAllCache();
    console.log('🔄 すべてのキャッシュがクリアされました');
};

// デバッグ用のグローバル関数
window.debugRouter = () => {
    console.log('🔍 Router Debug Info:');
    console.log('Current path:', router.getCurrentPath());
    console.log('Current route:', router.getCurrentRoute());
    console.log('Available routes:', Array.from(router.routes.keys()));
    console.log('Page cache size:', router.pageCache.size);
    console.log('Page cache keys:', Array.from(router.pageCache.keys()));
};

export default router;
