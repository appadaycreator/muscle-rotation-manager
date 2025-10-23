// accessibilityManager.js - アクセシビリティ機能の管理

import { showNotification } from './helpers.js';
import { handleError } from './errorHandler.js';

/**
 * アクセシビリティマネージャー
 */
class AccessibilityManager {
    constructor() {
        this.focusHistory = [];
        this.announcements = [];
        this.keyboardNavigation = true;
        this.screenReaderMode = false;
        this.highContrastMode = false;
        this.largeTextMode = false;
        this.reducedMotionMode = false;
        this.colorBlindMode = false;
        this.fontSize = 'normal';
        this.voiceNavigation = false;
        this.gestureSupport = false;

        // ARIA live region
        this.liveRegion = null;

        // フォーカス管理
        this.focusTrap = null;
        this.lastFocusedElement = null;

        // アクセシビリティ設定
        this.accessibilitySettings = {
            fontSize: 'normal',
            contrast: 'normal',
            motion: 'normal',
            colorBlind: 'none',
            voice: false,
            gestures: false
        };

        this.initialize();
    }

    /**
     * アクセシビリティ機能を初期化
     */
    initialize() {
        try {
            this.detectAccessibilityPreferences();
            this.setupARIALiveRegion();
            this.setupKeyboardNavigation();
            this.setupFocusManagement();
            this.setupScreenReaderSupport();
            this.setupColorAndContrastSupport();
            this.setupMotionSupport();
            this.setupSemanticStructure();
            this.setupAccessibilityShortcuts();

            console.log('♿ アクセシビリティ機能を初期化しました');
        } catch (error) {
            handleError(error, {
                context: 'アクセシビリティ初期化',
                showNotification: false
            });
        }
    }

    /**
     * アクセシビリティ設定を検出
     */
    detectAccessibilityPreferences() {
        // 高コントラストモード
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.enableHighContrastMode();
        }

        // 動きの軽減
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.enableReducedMotionMode();
        }

        // 大きなテキスト（推定）
        if (window.matchMedia('(min-resolution: 2dppx)').matches) {
            // 高DPIディスプレイでの文字サイズ調整
            this.checkLargeTextPreference();
        }

        // スクリーンリーダーの検出（推定）
        this.detectScreenReader();
    }

    /**
     * スクリーンリーダーの検出
     */
    detectScreenReader() {
        // 一般的なスクリーンリーダーのユーザーエージェント文字列をチェック
        const userAgent = navigator.userAgent.toLowerCase();
        const screenReaderIndicators = [
            'nvda', 'jaws', 'voiceover', 'talkback', 'orca'
        ];

        const hasScreenReader = screenReaderIndicators.some(indicator =>
            userAgent.includes(indicator)
        );

        // または、特定のアクセシビリティAPIの使用を検出
        const hasAccessibilityAPI = 'speechSynthesis' in window ||
                                   'webkitSpeechSynthesis' in window;

        if (hasScreenReader || hasAccessibilityAPI) {
            this.enableScreenReaderMode();
        }
    }

    /**
     * 大きなテキスト設定をチェック
     */
    checkLargeTextPreference() {
        const testElement = document.createElement('div');
        testElement.style.cssText = `
            font-size: 1rem;
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
        `;
        testElement.textContent = 'Test';
        document.body.appendChild(testElement);

        const computedSize = parseFloat(window.getComputedStyle(testElement).fontSize);
        document.body.removeChild(testElement);

        // 基準サイズより大きい場合
        if (computedSize > 16) {
            this.enableLargeTextMode();
        }
    }

    /**
     * ARIA Live Regionを設定
     */
    setupARIALiveRegion() {
        // 既存のlive regionを削除
        const existingRegion = document.getElementById('aria-live-region');
        if (existingRegion) {
            existingRegion.remove();
        }

        // 新しいlive regionを作成
        this.liveRegion = document.createElement('div');
        this.liveRegion.id = 'aria-live-region';
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;

        document.body.appendChild(this.liveRegion);
    }

    /**
     * スクリーンリーダーに読み上げさせる
     */
    announce(message, priority = 'polite') {
        if (!this.liveRegion) {return;}

        // 重複する通知を防ぐ
        if (this.announcements.includes(message)) {return;}

        this.announcements.push(message);

        // 古い通知を削除（最大5件まで保持）
        if (this.announcements.length > 5) {
            this.announcements.shift();
        }

        // live regionの属性を更新
        this.liveRegion.setAttribute('aria-live', priority);

        // メッセージを設定
        this.liveRegion.textContent = message;

        // 一定時間後にクリア
        setTimeout(() => {
            if (this.liveRegion.textContent === message) {
                this.liveRegion.textContent = '';
            }

            const index = this.announcements.indexOf(message);
            if (index > -1) {
                this.announcements.splice(index, 1);
            }
        }, 3000);

        console.log('📢 アナウンス:', message);
    }

    /**
     * キーボードナビゲーションを設定
     */
    setupKeyboardNavigation() {
        // Tab順序の最適化
        this.optimizeTabOrder();

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // フォーカス可能な要素のスタイル改善
        this.enhanceFocusStyles();
    }

    /**
     * Tab順序を最適化
     */
    optimizeTabOrder() {
        const focusableElements = this.getFocusableElements();

        focusableElements.forEach((element, index) => {
            // 論理的な順序でtabindexを設定
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }

            // フォーカス可能要素にrole属性を追加（必要に応じて）
            if (element.tagName === 'DIV' && element.onclick) {
                element.setAttribute('role', 'button');
                element.setAttribute('tabindex', '0');
            }
        });
    }

    /**
     * フォーカス可能な要素を取得
     */
    getFocusableElements() {
        const selector = `
            a[href],
            button:not([disabled]),
            input:not([disabled]),
            select:not([disabled]),
            textarea:not([disabled]),
            [tabindex]:not([tabindex="-1"]),
            [contenteditable="true"]
        `;

        return Array.from(document.querySelectorAll(selector))
            .filter(element => {
                return element.offsetWidth > 0 &&
                       element.offsetHeight > 0 &&
                       !element.hidden;
            });
    }

    /**
     * フォーカススタイルを強化
     */
    enhanceFocusStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 高コントラストフォーカススタイル */
            *:focus {
                outline: 3px solid #005fcc !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 1px #ffffff, 0 0 0 4px #005fcc !important;
            }
            
            /* ボタンのフォーカススタイル */
            button:focus,
            .btn:focus {
                background-color: #0056b3 !important;
                color: white !important;
            }
            
            /* 入力フィールドのフォーカススタイル */
            input:focus,
            textarea:focus,
            select:focus {
                border-color: #005fcc !important;
                background-color: #f0f8ff !important;
            }
            
            /* スキップリンク */
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                z-index: 10000;
                border-radius: 4px;
            }
            
            .skip-link:focus {
                top: 6px;
            }
            
            /* 高コントラストモード */
            .high-contrast-mode {
                filter: contrast(150%) brightness(110%);
            }
            
            .high-contrast-mode * {
                text-shadow: none !important;
                box-shadow: none !important;
            }
            
            /* 大きなテキストモード */
            .large-text-mode {
                font-size: 1.25em !important;
            }
            
            .large-text-mode button,
            .large-text-mode .btn {
                padding: 12px 20px !important;
                font-size: 1.1em !important;
            }
            
            /* 動きの軽減モード */
            .reduced-motion-mode * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);

        // スキップリンクを追加
        this.addSkipLinks();
    }

    /**
     * スキップリンクを追加
     */
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>
            <a href="#navigation" class="skip-link">ナビゲーションへスキップ</a>
        `;

        document.body.insertBefore(skipLinks, document.body.firstChild);

        // メインコンテンツにIDを追加
        const mainContent = document.querySelector('main, .main-content, #app');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    /**
     * キーボードナビゲーション処理
     */
    handleKeyboardNavigation(event) {
        const { key, ctrlKey, altKey, shiftKey } = event;

        // Escapeキーでモーダルを閉じる
        if (key === 'Escape') {
            this.closeModals();
            return;
        }

        // Alt + 数字キーでクイックナビゲーション
        if (altKey && /^[1-9]$/.test(key)) {
            this.handleQuickNavigation(parseInt(key));
            event.preventDefault();
            return;
        }

        // Ctrl + / でヘルプを表示
        if (ctrlKey && key === '/') {
            this.showKeyboardShortcuts();
            event.preventDefault();
            return;
        }

        // 矢印キーでのナビゲーション
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            this.handleArrowNavigation(event);
        }

        // Enterキーでクリック可能要素を活性化
        if (key === 'Enter') {
            this.handleEnterKey(event);
        }

        // Spaceキーでボタンを活性化
        if (key === ' ') {
            this.handleSpaceKey(event);
        }
    }

    /**
     * モーダルを閉じる
     */
    closeModals() {
        const modals = document.querySelectorAll('.modal, [role="dialog"]');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');

                // フォーカスを元の位置に戻す
                if (this.lastFocusedElement) {
                    this.lastFocusedElement.focus();
                }

                this.announce('ダイアログを閉じました');
            }
        });
    }

    /**
     * クイックナビゲーション
     */
    handleQuickNavigation(number) {
        const landmarks = [
            'main, [role="main"]',
            'nav, [role="navigation"]',
            'header, [role="banner"]',
            'footer, [role="contentinfo"]',
            'aside, [role="complementary"]',
            '[role="search"]',
            'form',
            '.workout-wizard',
            '#current-workout'
        ];

        const selector = landmarks[number - 1];
        if (selector) {
            const element = document.querySelector(selector);
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.announce(`${this.getElementDescription(element)}に移動しました`);
            }
        }
    }

    /**
     * 要素の説明を取得
     */
    getElementDescription(element) {
        const role = element.getAttribute('role');
        const ariaLabel = element.getAttribute('aria-label');
        const tagName = element.tagName.toLowerCase();

        if (ariaLabel) {return ariaLabel;}
        if (role) {return role;}

        const descriptions = {
            main: 'メインコンテンツ',
            nav: 'ナビゲーション',
            header: 'ヘッダー',
            footer: 'フッター',
            aside: 'サイドバー',
            form: 'フォーム'
        };

        return descriptions[tagName] || element.textContent?.slice(0, 20) || 'コンテンツ';
    }

    /**
     * 矢印キーナビゲーション
     */
    handleArrowNavigation(event) {
        const { key } = event;
        const currentElement = document.activeElement;

        // グリッドレイアウトでの矢印キーナビゲーション
        if (currentElement.closest('.grid, .muscle-groups-grid, .exercise-presets')) {
            this.handleGridNavigation(event);
            return;
        }

        // リストでの矢印キーナビゲーション
        if (currentElement.closest('[role="listbox"], .list')) {
            this.handleListNavigation(event);

        }
    }

    /**
     * グリッドナビゲーション
     */
    handleGridNavigation(event) {
        const { key } = event;
        const grid = document.activeElement.closest('.grid, .muscle-groups-grid, .exercise-presets');
        const items = Array.from(grid.querySelectorAll('button, .clickable, [tabindex="0"]'));
        const currentIndex = items.indexOf(document.activeElement);

        if (currentIndex === -1) {return;}

        const gridColumns = this.getGridColumns(grid);
        let newIndex;

        switch (key) {
            case 'ArrowUp':
                newIndex = currentIndex - gridColumns;
                break;
            case 'ArrowDown':
                newIndex = currentIndex + gridColumns;
                break;
            case 'ArrowLeft':
                newIndex = currentIndex - 1;
                break;
            case 'ArrowRight':
                newIndex = currentIndex + 1;
                break;
        }

        if (newIndex >= 0 && newIndex < items.length) {
            items[newIndex].focus();
            event.preventDefault();
        }
    }

    /**
     * グリッドの列数を取得
     */
    getGridColumns(grid) {
        const style = window.getComputedStyle(grid);
        const gridTemplateColumns = style.gridTemplateColumns;

        if (gridTemplateColumns && gridTemplateColumns !== 'none') {
            return gridTemplateColumns.split(' ').length;
        }

        // フォールバック: 要素の幅から推定
        const firstItem = grid.querySelector('button, .clickable, [tabindex="0"]');
        if (firstItem) {
            const gridWidth = grid.offsetWidth;
            const itemWidth = firstItem.offsetWidth;
            return Math.floor(gridWidth / itemWidth);
        }

        return 3; // デフォルト
    }

    /**
     * リストナビゲーション
     */
    handleListNavigation(event) {
        const { key } = event;
        const list = document.activeElement.closest('[role="listbox"], .list');
        const items = Array.from(list.querySelectorAll('[role="option"], li, .list-item'));
        const currentIndex = items.indexOf(document.activeElement);

        if (currentIndex === -1) {return;}

        let newIndex;

        switch (key) {
            case 'ArrowUp':
                newIndex = currentIndex - 1;
                break;
            case 'ArrowDown':
                newIndex = currentIndex + 1;
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = items.length - 1;
                break;
        }

        if (newIndex >= 0 && newIndex < items.length) {
            items[newIndex].focus();
            event.preventDefault();
        }
    }

    /**
     * Enterキー処理
     */
    handleEnterKey(event) {
        const element = event.target;

        // ボタンやリンク以外でEnterキーが押された場合
        if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
            if (element.onclick || element.getAttribute('role') === 'button') {
                element.click();
                event.preventDefault();
            }
        }
    }

    /**
     * Spaceキー処理
     */
    handleSpaceKey(event) {
        const element = event.target;

        // ボタンでSpaceキーが押された場合
        if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
            element.click();
            event.preventDefault();
        }
    }

    /**
     * フォーカス管理を設定
     */
    setupFocusManagement() {
        // フォーカス履歴の記録
        document.addEventListener('focusin', (e) => {
            this.focusHistory.push(e.target);
            if (this.focusHistory.length > 10) {
                this.focusHistory.shift();
            }
        });

        // モーダルのフォーカストラップ
        this.setupModalFocusTrap();
    }

    /**
     * モーダルのフォーカストラップを設定
     */
    setupModalFocusTrap() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const modal = node.querySelector?.('.modal, [role="dialog"]') ||
                                    (node.classList?.contains('modal') ? node : null);

                        if (modal) {
                            this.trapFocusInModal(modal);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * モーダル内にフォーカスをトラップ
     */
    trapFocusInModal(modal) {
        this.lastFocusedElement = document.activeElement;

        const focusableElements = modal.querySelectorAll(`
            button:not([disabled]),
            input:not([disabled]),
            select:not([disabled]),
            textarea:not([disabled]),
            [tabindex]:not([tabindex="-1"])
        `);

        if (focusableElements.length === 0) {return;}

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // 最初の要素にフォーカス
        firstElement.focus();

        // Tabキーでのフォーカス循環
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift+Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        this.announce('ダイアログが開きました');
    }

    /**
     * スクリーンリーダーサポートを設定
     */
    setupScreenReaderSupport() {
        // ARIA属性の自動追加
        this.addARIAAttributes();

        // ランドマークの設定
        this.setupLandmarks();

        // 見出し構造の最適化
        this.optimizeHeadingStructure();
    }

    /**
     * ARIA属性を自動追加
     */
    addARIAAttributes() {
        // ボタンにaria-labelを追加
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            const text = button.textContent.trim();
            const icon = button.querySelector('i');

            if (!text && icon) {
                // アイコンのみのボタン
                const iconClass = icon.className;
                const ariaLabel = this.getIconAriaLabel(iconClass);
                if (ariaLabel) {
                    button.setAttribute('aria-label', ariaLabel);
                }
            }
        });

        // フォームにaria-labelledbyを追加
        document.querySelectorAll('input, select, textarea').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label && !input.getAttribute('aria-labelledby')) {
                if (!label.id) {
                    label.id = `label-${input.id}`;
                }
                input.setAttribute('aria-labelledby', label.id);
            }
        });

        // リストにroleを追加
        document.querySelectorAll('ul, ol').forEach(list => {
            if (!list.getAttribute('role')) {
                list.setAttribute('role', 'list');
            }

            list.querySelectorAll('li').forEach(item => {
                if (!item.getAttribute('role')) {
                    item.setAttribute('role', 'listitem');
                }
            });
        });
    }

    /**
     * アイコンのARIAラベルを取得
     */
    getIconAriaLabel(iconClass) {
        const iconLabels = {
            'fa-plus': '追加',
            'fa-edit': '編集',
            'fa-trash': '削除',
            'fa-save': '保存',
            'fa-close': '閉じる',
            'fa-times': '閉じる',
            'fa-check': '確認',
            'fa-arrow-left': '戻る',
            'fa-arrow-right': '次へ',
            'fa-home': 'ホーム',
            'fa-user': 'ユーザー',
            'fa-settings': '設定',
            'fa-search': '検索',
            'fa-menu': 'メニュー',
            'fa-bars': 'メニュー',
            'fa-play': '再生',
            'fa-pause': '一時停止',
            'fa-stop': '停止',
            'fa-dumbbell': 'ワークアウト',
            'fa-calendar': 'カレンダー',
            'fa-chart': 'グラフ'
        };

        for (const [className, label] of Object.entries(iconLabels)) {
            if (iconClass.includes(className)) {
                return label;
            }
        }

        return null;
    }

    /**
     * ランドマークを設定
     */
    setupLandmarks() {
        // メインコンテンツ
        const main = document.querySelector('main');
        if (!main) {
            const mainContent = document.querySelector('.main-content, #app, .page-content');
            if (mainContent && !mainContent.getAttribute('role')) {
                mainContent.setAttribute('role', 'main');
            }
        }

        // ナビゲーション
        document.querySelectorAll('nav, .navigation, .navbar').forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });

        // バナー（ヘッダー）
        document.querySelectorAll('header, .header').forEach(header => {
            if (!header.getAttribute('role')) {
                header.setAttribute('role', 'banner');
            }
        });

        // コンテンツ情報（フッター）
        document.querySelectorAll('footer, .footer').forEach(footer => {
            if (!footer.getAttribute('role')) {
                footer.setAttribute('role', 'contentinfo');
            }
        });

        // 補完コンテンツ
        document.querySelectorAll('aside, .sidebar').forEach(aside => {
            if (!aside.getAttribute('role')) {
                aside.setAttribute('role', 'complementary');
            }
        });
    }

    /**
     * 見出し構造を最適化
     */
    optimizeHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let currentLevel = 0;

        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));

            // 見出しレベルの論理的な順序をチェック
            if (level > currentLevel + 1) {
                console.warn(`見出し構造の問題: h${currentLevel}の後にh${level}があります`, heading);
            }

            currentLevel = level;

            // 見出しにIDを追加（なければ）
            if (!heading.id) {
                const text = heading.textContent.trim();
                const id = text.toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .substring(0, 50);

                if (id && !document.getElementById(id)) {
                    heading.id = id;
                }
            }
        });
    }

    /**
     * 色とコントラストサポートを設定
     */
    setupColorAndContrastSupport() {
        // 高コントラストモードの切り替えボタンを追加
        this.addContrastToggle();

        // 色覚サポート
        this.setupColorBlindnessSupport();
    }

    /**
     * コントラスト切り替えボタンを追加
     */
    addContrastToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'contrast-toggle';
        toggle.className = 'accessibility-toggle';
        toggle.innerHTML = '<i class="fas fa-adjust"></i> 高コントラスト';
        toggle.setAttribute('aria-label', '高コントラストモードの切り替え');

        toggle.addEventListener('click', () => {
            this.toggleHighContrastMode();
        });

        // アクセシビリティメニューに追加
        this.addToAccessibilityMenu(toggle);
    }

    /**
     * 高コントラストモードを切り替え
     */
    toggleHighContrastMode() {
        this.highContrastMode = !this.highContrastMode;
        document.body.classList.toggle('high-contrast-mode', this.highContrastMode);

        const message = this.highContrastMode ?
            '高コントラストモードを有効にしました' :
            '高コントラストモードを無効にしました';

        this.announce(message);
        showNotification(message, 'info');

        // 設定を保存
        localStorage.setItem('highContrastMode', this.highContrastMode.toString());
    }

    /**
     * 高コントラストモードを有効化
     */
    enableHighContrastMode() {
        this.highContrastMode = true;
        document.body.classList.add('high-contrast-mode');
        console.log('🎨 高コントラストモードを有効にしました');
    }

    /**
     * 色覚サポートを設定
     */
    setupColorBlindnessSupport() {
        // 色だけに依存しない情報伝達
        const style = document.createElement('style');
        style.textContent = `
            /* 色覚サポート */
            .success::before { content: "✓ "; }
            .error::before { content: "✗ "; }
            .warning::before { content: "⚠ "; }
            .info::before { content: "ℹ "; }
            
            /* パターンやテクスチャでの区別 */
            .color-blind-support .success {
                background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
            }
            
            .color-blind-support .error {
                background-image: repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * モーション設定サポートを設定
     */
    setupMotionSupport() {
        // 動きの軽減モード切り替えボタンを追加
        const toggle = document.createElement('button');
        toggle.id = 'motion-toggle';
        toggle.className = 'accessibility-toggle';
        toggle.innerHTML = '<i class="fas fa-pause"></i> 動きを軽減';
        toggle.setAttribute('aria-label', '動きの軽減モードの切り替え');

        toggle.addEventListener('click', () => {
            this.toggleReducedMotionMode();
        });

        this.addToAccessibilityMenu(toggle);
    }

    /**
     * 動きの軽減モードを切り替え
     */
    toggleReducedMotionMode() {
        this.reducedMotionMode = !this.reducedMotionMode;
        document.body.classList.toggle('reduced-motion-mode', this.reducedMotionMode);

        const message = this.reducedMotionMode ?
            '動きの軽減モードを有効にしました' :
            '動きの軽減モードを無効にしました';

        this.announce(message);
        showNotification(message, 'info');

        localStorage.setItem('reducedMotionMode', this.reducedMotionMode.toString());
    }

    /**
     * 動きの軽減モードを有効化
     */
    enableReducedMotionMode() {
        this.reducedMotionMode = true;
        document.body.classList.add('reduced-motion-mode');
        console.log('🎭 動きの軽減モードを有効にしました');
    }

    /**
     * 大きなテキストモードを有効化
     */
    enableLargeTextMode() {
        this.largeTextMode = true;
        document.body.classList.add('large-text-mode');
        console.log('📝 大きなテキストモードを有効にしました');
    }

    /**
     * スクリーンリーダーモードを有効化
     */
    enableScreenReaderMode() {
        this.screenReaderMode = true;
        document.body.classList.add('screen-reader-mode');

        // スクリーンリーダー用の追加情報を表示
        const style = document.createElement('style');
        style.textContent = `
            .screen-reader-mode .sr-only {
                position: static !important;
                width: auto !important;
                height: auto !important;
                overflow: visible !important;
                clip: auto !important;
            }
        `;
        document.head.appendChild(style);

        console.log('👁 スクリーンリーダーモードを有効にしました');
    }

    /**
     * セマンティック構造を設定
     */
    setupSemanticStructure() {
        // 適切なHTML5セマンティック要素の使用を促進
        this.validateSemanticStructure();

        // ARIA属性の追加
        this.enhanceSemanticMeaning();
    }

    /**
     * セマンティック構造を検証
     */
    validateSemanticStructure() {
        const issues = [];

        // main要素の存在チェック
        if (!document.querySelector('main, [role="main"]')) {
            issues.push('main要素またはrole="main"が見つかりません');
        }

        // 見出し構造のチェック
        const h1Elements = document.querySelectorAll('h1');
        if (h1Elements.length === 0) {
            issues.push('h1要素が見つかりません');
        } else if (h1Elements.length > 1) {
            issues.push('h1要素が複数あります');
        }

        // リンクのアクセシビリティチェック
        document.querySelectorAll('a').forEach(link => {
            if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
                issues.push('テキストまたはaria-labelがないリンクがあります');
            }
        });

        if (issues.length > 0) {
            console.warn('セマンティック構造の問題:', issues);
        }
    }

    /**
     * セマンティックな意味を強化
     */
    enhanceSemanticMeaning() {
        // 状態を示す要素にaria-live属性を追加
        document.querySelectorAll('.status, .notification, .alert').forEach(element => {
            if (!element.getAttribute('aria-live')) {
                element.setAttribute('aria-live', 'polite');
            }
        });

        // 進行状況を示す要素
        document.querySelectorAll('.progress, .loading').forEach(element => {
            if (!element.getAttribute('role')) {
                element.setAttribute('role', 'progressbar');
            }
        });

        // タブパネル
        document.querySelectorAll('.tab-panel, .step').forEach(panel => {
            if (!panel.getAttribute('role')) {
                panel.setAttribute('role', 'tabpanel');
            }
        });
    }

    /**
     * アクセシビリティショートカットを設定
     */
    setupAccessibilityShortcuts() {
        // ヘルプダイアログを作成
        this.createAccessibilityHelp();
    }

    /**
     * キーボードショートカットヘルプを表示
     */
    showKeyboardShortcuts() {
        const helpModal = document.getElementById('keyboard-shortcuts-help');
        if (helpModal) {
            helpModal.style.display = 'block';
            helpModal.setAttribute('aria-hidden', 'false');
            helpModal.focus();
            this.announce('キーボードショートカットヘルプを開きました');
        }
    }

    /**
     * アクセシビリティヘルプを作成
     */
    createAccessibilityHelp() {
        const helpModal = document.createElement('div');
        helpModal.id = 'keyboard-shortcuts-help';
        helpModal.className = 'modal';
        helpModal.setAttribute('role', 'dialog');
        helpModal.setAttribute('aria-labelledby', 'help-title');
        helpModal.setAttribute('aria-hidden', 'true');
        helpModal.style.display = 'none';

        helpModal.innerHTML = `
            <div class="modal-content">
                <h2 id="help-title">キーボードショートカット</h2>
                <div class="shortcuts-list">
                    <h3>ナビゲーション</h3>
                    <ul>
                        <li><kbd>Tab</kbd> - 次の要素に移動</li>
                        <li><kbd>Shift + Tab</kbd> - 前の要素に移動</li>
                        <li><kbd>矢印キー</kbd> - グリッド内を移動</li>
                        <li><kbd>Enter</kbd> - 要素を活性化</li>
                        <li><kbd>Space</kbd> - ボタンを押す</li>
                        <li><kbd>Escape</kbd> - モーダルを閉じる</li>
                    </ul>
                    
                    <h3>クイックアクセス</h3>
                    <ul>
                        <li><kbd>Alt + 1</kbd> - メインコンテンツ</li>
                        <li><kbd>Alt + 2</kbd> - ナビゲーション</li>
                        <li><kbd>Alt + 3</kbd> - ヘッダー</li>
                        <li><kbd>Alt + 8</kbd> - ワークアウト</li>
                        <li><kbd>Ctrl + /</kbd> - このヘルプ</li>
                    </ul>
                </div>
                <button class="close-help">閉じる</button>
            </div>
        `;

        document.body.appendChild(helpModal);

        // 閉じるボタンのイベント
        helpModal.querySelector('.close-help').addEventListener('click', () => {
            helpModal.style.display = 'none';
            helpModal.setAttribute('aria-hidden', 'true');
        });
    }

    /**
     * アクセシビリティメニューに要素を追加
     */
    addToAccessibilityMenu(element) {
        let menu = document.getElementById('accessibility-menu');

        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'accessibility-menu';
            menu.className = 'accessibility-menu';
            menu.innerHTML = '<h3>アクセシビリティ設定</h3>';

            // 設定メニューに追加するか、フローティングメニューとして作成
            const settingsContainer = document.querySelector('.settings-menu, #settings');
            if (settingsContainer) {
                settingsContainer.appendChild(menu);
            } else {
                menu.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    display: none;
                `;
                document.body.appendChild(menu);
            }
        }

        menu.appendChild(element);
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
        const highContrast = localStorage.getItem('highContrastMode') === 'true';
        if (highContrast) {
            this.enableHighContrastMode();
        }

        const reducedMotion = localStorage.getItem('reducedMotionMode') === 'true';
        if (reducedMotion) {
            this.enableReducedMotionMode();
        }
    }

    /**
     * アクセシビリティスコアを計算
     */
    calculateAccessibilityScore() {
        let score = 0;
        let maxScore = 0;

        // キーボードナビゲーション
        maxScore += 20;
        if (this.getFocusableElements().length > 0) {score += 20;}

        // ARIA属性
        maxScore += 20;
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
        if (ariaElements.length > 0) {score += 20;}

        // セマンティック構造
        maxScore += 20;
        if (document.querySelector('main, [role="main"]')) {score += 10;}
        if (document.querySelector('h1')) {score += 10;}

        // 色とコントラスト
        maxScore += 20;
        if (this.highContrastMode || window.matchMedia('(prefers-contrast: high)').matches) {
            score += 20;
        } else {
            score += 10; // 基本的な色使い
        }

        // モーション設定
        maxScore += 20;
        if (this.reducedMotionMode || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            score += 20;
        } else {
            score += 10; // 基本的なアニメーション
        }

        const percentage = Math.round((score / maxScore) * 100);
        console.log(`♿ アクセシビリティスコア: ${percentage}% (${score}/${maxScore})`);

        return percentage;
    }

    /**
     * アクセシビリティ統計を取得
     */
    getAccessibilityStats() {
        return {
            score: this.calculateAccessibilityScore(),
            screenReaderMode: this.screenReaderMode,
            highContrastMode: this.highContrastMode,
            largeTextMode: this.largeTextMode,
            reducedMotionMode: this.reducedMotionMode,
            focusableElements: this.getFocusableElements().length,
            ariaElements: document.querySelectorAll('[aria-label], [aria-labelledby], [role]').length,
            headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
            landmarks: document.querySelectorAll('main, nav, header, footer, aside, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]').length
        };
    }
}

// グローバルインスタンス作成
const accessibilityManager = new AccessibilityManager();

// 設定読み込み
document.addEventListener('DOMContentLoaded', () => {
    accessibilityManager.loadSettings();
});

// グローバルアクセス用
window.accessibilityManager = accessibilityManager;

export default accessibilityManager;
