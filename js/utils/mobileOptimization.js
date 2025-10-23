// mobileOptimization.js - モバイル操作性の向上

import { showNotification } from './helpers.js';
import { handleError } from './errorHandler.js';

/**
 * モバイル最適化マネージャー
 */
class MobileOptimizationManager {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.swipeThreshold = 50;
        this.tapThreshold = 10;
        this.longPressThreshold = 500;
        this.doubleTapThreshold = 300;

        // タッチ状態管理
        this.isLongPressing = false;
        this.longPressTimer = null;
        this.lastTap = 0;
        this.tapCount = 0;

        // スワイプコールバック
        this.swipeCallbacks = new Map();

        // 片手操作モード
        this.oneHandedMode = false;

        // ハプティックフィードバック対応
        this.hapticSupported = 'vibrate' in navigator;

        this.initialize();
    }

    /**
     * モバイル最適化を初期化
     */
    initialize() {
        try {
            this.setupTouchTargets();
            this.setupSwipeGestures();
            this.setupOneHandedMode();
            this.setupHapticFeedback();
            this.setupViewportOptimization();
            this.setupAccessibilityFeatures();

            console.log('📱 モバイル最適化を初期化しました');
        } catch (error) {
            handleError(error, {
                context: 'モバイル最適化初期化',
                showNotification: false
            });
        }
    }

    /**
     * タッチターゲットサイズを最適化
     */
    setupTouchTargets() {
        // 最小44pxのタッチターゲットを確保
        const style = document.createElement('style');
        style.textContent = `
            /* タッチターゲット最適化 */
            button, 
            .btn, 
            .clickable, 
            input[type="button"], 
            input[type="submit"], 
            .touch-target {
                min-height: 44px;
                min-width: 44px;
                position: relative;
            }
            
            /* 小さなボタンのタッチエリア拡張 */
            .small-button {
                position: relative;
            }
            
            .small-button::before {
                content: '';
                position: absolute;
                top: -8px;
                left: -8px;
                right: -8px;
                bottom: -8px;
                z-index: -1;
            }
            
            /* タッチフィードバック */
            .touch-feedback {
                transition: transform 0.1s ease, background-color 0.1s ease;
            }
            
            .touch-feedback:active {
                transform: scale(0.95);
                background-color: rgba(0, 0, 0, 0.05);
            }
            
            /* スワイプ可能要素の視覚的ヒント */
            .swipeable {
                position: relative;
                overflow: hidden;
            }
            
            .swipeable::after {
                content: '';
                position: absolute;
                top: 50%;
                right: 8px;
                width: 4px;
                height: 20px;
                background: linear-gradient(to bottom, transparent, #ccc, transparent);
                transform: translateY(-50%);
                opacity: 0.5;
            }
        `;
        document.head.appendChild(style);

        // 既存の要素にタッチフィードバックを追加
        this.addTouchFeedback();
    }

    /**
     * タッチフィードバックを追加
     */
    addTouchFeedback() {
        const touchElements = document.querySelectorAll('button, .btn, .clickable, .touch-target');

        touchElements.forEach(element => {
            if (!element.classList.contains('touch-feedback')) {
                element.classList.add('touch-feedback');

                // タッチイベントリスナー追加
                element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
                element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
            }
        });
    }

    /**
     * タッチ開始処理
     */
    handleTouchStart(event) {
        const element = event.currentTarget;

        // ハプティックフィードバック
        this.triggerHapticFeedback('light');

        // 長押し検出開始
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(element, event);
        }, this.longPressThreshold);

        // ダブルタップ検出
        const now = Date.now();
        if (now - this.lastTap < this.doubleTapThreshold) {
            this.tapCount++;
            if (this.tapCount === 2) {
                this.handleDoubleTap(element, event);
                this.tapCount = 0;
            }
        } else {
            this.tapCount = 1;
        }
        this.lastTap = now;
    }

    /**
     * タッチ終了処理
     */
    handleTouchEnd(event) {
        // 長押しタイマーをクリア
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        this.isLongPressing = false;
    }

    /**
     * 長押し処理
     */
    handleLongPress(element, event) {
        this.isLongPressing = true;
        this.triggerHapticFeedback('medium');

        // 長押しイベントを発火
        const longPressEvent = new CustomEvent('longpress', {
            detail: { originalEvent: event, element }
        });
        element.dispatchEvent(longPressEvent);

        console.log('👆 長押しを検出:', element);
    }

    /**
     * ダブルタップ処理
     */
    handleDoubleTap(element, event) {
        this.triggerHapticFeedback('heavy');

        // ダブルタップイベントを発火
        const doubleTapEvent = new CustomEvent('doubletap', {
            detail: { originalEvent: event, element }
        });
        element.dispatchEvent(doubleTapEvent);

        console.log('👆👆 ダブルタップを検出:', element);
    }

    /**
     * スワイプジェスチャーを設定
     */
    setupSwipeGestures() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(e);
        }, { passive: true });
    }

    /**
     * スワイプ処理
     */
    handleSwipe(event) {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // スワイプの閾値チェック
        if (Math.max(absDeltaX, absDeltaY) < this.swipeThreshold) {
            return;
        }

        let direction;
        if (absDeltaX > absDeltaY) {
            // 水平スワイプ
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            // 垂直スワイプ
            direction = deltaY > 0 ? 'down' : 'up';
        }

        // スワイプイベントを発火
        const swipeEvent = new CustomEvent('swipe', {
            detail: {
                direction,
                deltaX,
                deltaY,
                originalEvent: event,
                target: event.target
            }
        });

        document.dispatchEvent(swipeEvent);

        // 登録されたコールバックを実行
        this.executeSwipeCallbacks(direction, event);

        console.log(`👉 スワイプ検出: ${direction}`, { deltaX, deltaY });
    }

    /**
     * スワイプコールバックを登録
     */
    registerSwipeCallback(direction, callback, element = document) {
        if (!this.swipeCallbacks.has(element)) {
            this.swipeCallbacks.set(element, new Map());
        }

        const elementCallbacks = this.swipeCallbacks.get(element);
        if (!elementCallbacks.has(direction)) {
            elementCallbacks.set(direction, []);
        }

        elementCallbacks.get(direction).push(callback);
    }

    /**
     * スワイプコールバックを実行
     */
    executeSwipeCallbacks(direction, event) {
        let element = event.target;

        // 要素の階層を上に辿ってコールバックを探す
        while (element && element !== document) {
            const elementCallbacks = this.swipeCallbacks.get(element);
            if (elementCallbacks && elementCallbacks.has(direction)) {
                elementCallbacks.get(direction).forEach(callback => {
                    try {
                        callback(event);
                    } catch (error) {
                        console.error('スワイプコールバックエラー:', error);
                    }
                });
                break; // 最初に見つかったコールバックのみ実行
            }
            element = element.parentElement;
        }

        // グローバルコールバック
        const globalCallbacks = this.swipeCallbacks.get(document);
        if (globalCallbacks && globalCallbacks.has(direction)) {
            globalCallbacks.get(direction).forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error('グローバルスワイプコールバックエラー:', error);
                }
            });
        }
    }

    /**
     * 片手操作モードを設定
     */
    setupOneHandedMode() {
        // 片手操作モード切り替えボタンを追加
        this.createOneHandedModeToggle();

        // 画面サイズに基づいて自動的に片手モードを提案
        this.detectOneHandedNeed();
    }

    /**
     * 片手操作モード切り替えボタンを作成
     */
    createOneHandedModeToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'one-handed-toggle';
        toggle.className = 'one-handed-toggle';
        toggle.innerHTML = `
            <i class="fas fa-hand-paper"></i>
            <span>片手モード</span>
        `;
        toggle.setAttribute('aria-label', '片手操作モードの切り替え');

        toggle.addEventListener('click', () => {
            this.toggleOneHandedMode();
        });

        // 設定メニューに追加（存在する場合）
        const settingsContainer = document.querySelector('#settings-container, .settings-menu');
        if (settingsContainer) {
            settingsContainer.appendChild(toggle);
        } else {
            // フローティングボタンとして追加
            toggle.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                z-index: 1000;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 50%;
                width: 56px;
                height: 56px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(toggle);
        }
    }

    /**
     * 片手操作の必要性を検出
     */
    detectOneHandedNeed() {
        const screenHeight = window.screen.height;
        const screenWidth = window.screen.width;

        // 大画面デバイス（6インチ以上相当）で片手モードを提案
        if (screenHeight > 800 && screenWidth > 400) {
            setTimeout(() => {
                if (!localStorage.getItem('oneHandedModePrompted')) {
                    this.showOneHandedModePrompt();
                    localStorage.setItem('oneHandedModePrompted', 'true');
                }
            }, 5000); // 5秒後に提案
        }
    }

    /**
     * 片手モード提案を表示
     */
    showOneHandedModePrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'one-handed-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <h3>片手操作モードを試してみませんか？</h3>
                <p>大画面での操作を楽にします</p>
                <div class="prompt-actions">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        後で
                    </button>
                    <button class="btn-primary" onclick="mobileOptimization.enableOneHandedMode(); this.parentElement.parentElement.parentElement.remove();">
                        有効にする
                    </button>
                </div>
            </div>
        `;

        prompt.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            padding: 16px;
            animation: slideUp 0.3s ease-out;
        `;

        document.body.appendChild(prompt);

        // 10秒後に自動で閉じる
        setTimeout(() => {
            if (prompt.parentElement) {
                prompt.remove();
            }
        }, 10000);
    }

    /**
     * 片手操作モードを切り替え
     */
    toggleOneHandedMode() {
        this.oneHandedMode = !this.oneHandedMode;

        if (this.oneHandedMode) {
            this.enableOneHandedMode();
        } else {
            this.disableOneHandedMode();
        }
    }

    /**
     * 片手操作モードを有効化
     */
    enableOneHandedMode() {
        this.oneHandedMode = true;
        document.body.classList.add('one-handed-mode');

        // 片手モード用のスタイルを適用
        const style = document.createElement('style');
        style.id = 'one-handed-styles';
        style.textContent = `
            .one-handed-mode {
                --reach-zone: 75vh; /* 親指の届く範囲 */
            }
            
            .one-handed-mode .main-content {
                padding-bottom: 25vh; /* 下部に余白を追加 */
            }
            
            .one-handed-mode .floating-action-button {
                bottom: 25vh; /* ボタンを下げる */
            }
            
            .one-handed-mode .bottom-navigation {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 25vh;
                background: linear-gradient(to top, rgba(255,255,255,0.95), transparent);
                pointer-events: none;
            }
            
            .one-handed-mode .quick-actions {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                display: flex;
                justify-content: space-around;
                pointer-events: all;
            }
            
            .one-handed-mode .reach-indicator {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: var(--reach-zone);
                border-top: 2px dashed rgba(59, 130, 246, 0.3);
                pointer-events: none;
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);

        // クイックアクションエリアを作成
        this.createQuickActions();

        // 到達範囲インジケーターを表示
        this.showReachIndicator();

        this.triggerHapticFeedback('medium');
        showNotification('片手操作モードを有効にしました', 'success');

        // 設定を保存
        localStorage.setItem('oneHandedMode', 'true');
    }

    /**
     * 片手操作モードを無効化
     */
    disableOneHandedMode() {
        this.oneHandedMode = false;
        document.body.classList.remove('one-handed-mode');

        // 片手モード用のスタイルを削除
        const style = document.getElementById('one-handed-styles');
        if (style) {
            style.remove();
        }

        // クイックアクションエリアを削除
        const quickActions = document.querySelector('.quick-actions');
        if (quickActions) {
            quickActions.remove();
        }

        // 到達範囲インジケーターを削除
        const reachIndicator = document.querySelector('.reach-indicator');
        if (reachIndicator) {
            reachIndicator.remove();
        }

        showNotification('片手操作モードを無効にしました', 'info');

        // 設定を保存
        localStorage.setItem('oneHandedMode', 'false');
    }

    /**
     * クイックアクションエリアを作成
     */
    createQuickActions() {
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions';
        quickActions.innerHTML = `
            <button class="quick-action-btn" data-action="back">
                <i class="fas fa-arrow-left"></i>
            </button>
            <button class="quick-action-btn" data-action="home">
                <i class="fas fa-home"></i>
            </button>
            <button class="quick-action-btn" data-action="menu">
                <i class="fas fa-bars"></i>
            </button>
            <button class="quick-action-btn" data-action="add">
                <i class="fas fa-plus"></i>
            </button>
        `;

        // クイックアクションのイベントリスナー
        quickActions.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.quick-action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                this.handleQuickAction(action);
            }
        });

        document.body.appendChild(quickActions);
    }

    /**
     * クイックアクション処理
     */
    handleQuickAction(action) {
        this.triggerHapticFeedback('light');

        switch (action) {
            case 'back':
                window.history.back();
                break;
            case 'home':
                // ホームページに移動
                window.location.hash = '#dashboard';
                break;
            case 'menu':
                // サイドバーを開く
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('open');
                }
                break;
            case 'add':
                // 新規追加（コンテキストに応じて）
                const addBtn = document.querySelector('#add-exercise-btn, .add-button');
                if (addBtn) {
                    addBtn.click();
                }
                break;
        }
    }

    /**
     * 到達範囲インジケーターを表示
     */
    showReachIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'reach-indicator';
        document.body.appendChild(indicator);

        // 3秒後に自動で非表示
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 300);
            }
        }, 3000);
    }

    /**
     * ハプティックフィードバックを設定
     */
    setupHapticFeedback() {
        // ハプティックフィードバックの設定を確認
        const hapticEnabled = localStorage.getItem('hapticEnabled') !== 'false';

        if (!hapticEnabled) {
            this.hapticSupported = false;
        }
    }

    /**
     * ハプティックフィードバックを実行
     */
    triggerHapticFeedback(intensity = 'light') {
        if (!this.hapticSupported) {return;}

        const patterns = {
            light: [10],
            medium: [50],
            heavy: [100],
            success: [10, 50, 10],
            error: [100, 50, 100],
            warning: [50, 30, 50]
        };

        const pattern = patterns[intensity] || patterns.light;

        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.warn('ハプティックフィードバック実行エラー:', error);
        }
    }

    /**
     * ビューポート最適化
     */
    setupViewportOptimization() {
        // ビューポートメタタグの最適化
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

        // セーフエリア対応
        const style = document.createElement('style');
        style.textContent = `
            /* セーフエリア対応 */
            .safe-area-inset {
                padding-top: env(safe-area-inset-top);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
                padding-bottom: env(safe-area-inset-bottom);
            }
            
            /* ノッチ対応 */
            @supports (padding: max(0px)) {
                .safe-area-top {
                    padding-top: max(20px, env(safe-area-inset-top));
                }
                
                .safe-area-bottom {
                    padding-bottom: max(20px, env(safe-area-inset-bottom));
                }
            }
        `;
        document.head.appendChild(style);

        // 画面回転対応
        this.setupOrientationHandling();
    }

    /**
     * 画面回転対応
     */
    setupOrientationHandling() {
        const handleOrientationChange = () => {
            // 回転後のレイアウト調整
            setTimeout(() => {
                this.adjustLayoutForOrientation();
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
    }

    /**
     * 画面向きに応じたレイアウト調整
     */
    adjustLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;

        document.body.classList.toggle('landscape-mode', isLandscape);
        document.body.classList.toggle('portrait-mode', !isLandscape);

        // 横向き時の最適化
        if (isLandscape) {
            // サイドバーを自動で開く
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && window.innerWidth > 768) {
                sidebar.classList.add('auto-open');
            }
        }
    }

    /**
     * アクセシビリティ機能を設定
     */
    setupAccessibilityFeatures() {
        // 大きなテキスト設定の検出
        this.detectLargeTextPreference();

        // 高コントラストモードの検出
        this.detectHighContrastPreference();

        // 動きの軽減設定の検出
        this.detectReducedMotionPreference();
    }

    /**
     * 大きなテキスト設定を検出
     */
    detectLargeTextPreference() {
        // システムの文字サイズ設定を検出（可能な場合）
        const testElement = document.createElement('div');
        testElement.style.cssText = 'font-size: 1rem; position: absolute; visibility: hidden;';
        document.body.appendChild(testElement);

        const computedSize = window.getComputedStyle(testElement).fontSize;
        const baseFontSize = parseFloat(computedSize);

        document.body.removeChild(testElement);

        // 基準より大きい場合は大きなテキストモードを適用
        if (baseFontSize > 16) {
            document.body.classList.add('large-text-mode');
            console.log('📝 大きなテキストモードを検出');
        }
    }

    /**
     * 高コントラストモードを検出
     */
    detectHighContrastPreference() {
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast-mode');
            console.log('🎨 高コントラストモードを検出');
        }
    }

    /**
     * 動きの軽減設定を検出
     */
    detectReducedMotionPreference() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion-mode');
            console.log('🎭 動きの軽減モードを検出');
        }
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
        const oneHandedMode = localStorage.getItem('oneHandedMode') === 'true';
        if (oneHandedMode) {
            this.enableOneHandedMode();
        }

        const hapticEnabled = localStorage.getItem('hapticEnabled') !== 'false';
        this.hapticSupported = this.hapticSupported && hapticEnabled;
    }

    /**
     * パフォーマンス最適化
     */
    optimizePerformance() {
        // タッチイベントのパッシブリスナー化
        const passiveEvents = ['touchstart', 'touchmove', 'touchend'];
        passiveEvents.forEach(eventType => {
            document.addEventListener(eventType, () => {}, { passive: true });
        });

        // スクロール最適化
        document.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 16), { passive: true }); // 60fps
    }

    /**
     * スクロール処理
     */
    handleScroll() {
        // スクロール位置に応じたUI調整
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        // ヘッダーの自動非表示
        const header = document.querySelector('.header, .navbar');
        if (header) {
            header.classList.toggle('scrolled', scrollY > 50);
        }

        // フローティングボタンの表示制御
        const fab = document.querySelector('.floating-action-button');
        if (fab) {
            fab.classList.toggle('visible', scrollY > windowHeight * 0.3);
        }
    }

    /**
     * スロットル関数
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * デバウンス関数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * モバイル最適化の統計を取得
     */
    getOptimizationStats() {
        return {
            oneHandedMode: this.oneHandedMode,
            hapticSupported: this.hapticSupported,
            touchTargetsOptimized: document.querySelectorAll('.touch-feedback').length,
            swipeCallbacksRegistered: this.swipeCallbacks.size,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        };
    }
}

// グローバルインスタンス作成
const mobileOptimization = new MobileOptimizationManager();

// 設定読み込み
document.addEventListener('DOMContentLoaded', () => {
    mobileOptimization.loadSettings();
    mobileOptimization.optimizePerformance();
});

// グローバルアクセス用
window.mobileOptimization = mobileOptimization;

export default mobileOptimization;
