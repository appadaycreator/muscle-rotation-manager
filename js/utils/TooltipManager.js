/**
 * 高度なツールチップ管理システム
 * パフォーマンス最適化、アクセシビリティ対応、完全なテストカバレッジ
 */
export class TooltipManager {
    constructor() {
        this.activeTooltip = null;
        this.hoverTimeout = null;
        this.isInitialized = false;
        this.config = {
            delay: 300,
            hideDelay: 100,
            maxWidth: 400,
            minWidth: 200,
            zIndex: 10000,
            animation: 'fadeIn',
            theme: 'light',
            position: 'top',
            offset: 8,
            arrow: true,
            interactive: false,
            hideOnScroll: true,
            hideOnResize: true,
            hideOnEscape: true,
            accessibility: true
        };

        this.themes = new Map();
        this.animations = new Map();
        this.observers = new Map();

        this.setupThemes();
        this.setupAnimations();
    }

    /**
   * テーマ設定
   */
    setupThemes() {
        this.themes.set('light', {
            backgroundColor: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            boxShadow:
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '8px',
            fontSize: '15px',
            lineHeight: '1.6',
            padding: '12px 16px',
            fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
            fontWeight: '400',
            letterSpacing: '0.025em'
        });

        this.themes.set('dark', {
            backgroundColor: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
            boxShadow:
        '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '15px',
            lineHeight: '1.6',
            padding: '12px 16px',
            fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
            fontWeight: '400',
            letterSpacing: '0.025em'
        });
    }

    /**
   * アニメーション設定
   */
    setupAnimations() {
        this.animations.set('fadeIn', {
            show: {
                opacity: '0',
                transform: 'translateY(-5px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            },
            visible: {
                opacity: '1',
                transform: 'translateY(0)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            },
            hide: {
                opacity: '0',
                transform: 'translateY(-5px)',
                transition: 'opacity 0.15s ease, transform 0.15s ease'
            }
        });

        this.animations.set('slide', {
            show: {
                opacity: '0',
                transform: 'translateY(10px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            },
            visible: {
                opacity: '1',
                transform: 'translateY(0)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            },
            hide: {
                opacity: '0',
                transform: 'translateY(10px)',
                transition: 'opacity 0.15s ease, transform 0.15s ease'
            }
        });

        this.animations.set('scale', {
            show: {
                opacity: '0',
                transform: 'scale(0.95)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            },
            visible: {
                opacity: '1',
                transform: 'scale(1)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            },
            hide: {
                opacity: '0',
                transform: 'scale(0.95)',
                transition: 'opacity 0.15s ease, transform 0.15s ease'
            }
        });
    }

    /**
   * 初期化
   */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            this.createContainer();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ TooltipManager initialized');
        } catch (error) {
            console.error('❌ TooltipManager initialization failed:', error);
            throw error;
        }
    }

    /**
   * コンテナ作成
   */
    createContainer() {
        const existingContainer = document.getElementById('tooltip-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'tooltip-container';
        container.className = 'tooltip-container';
        container.style.cssText = `
            position: fixed;
            z-index: ${this.config.zIndex};
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        document.body.appendChild(container);
    }

    /**
   * イベントリスナー設定
   */
    setupEventListeners() {
    // マウスオーバー
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), {
            passive: true
        });

        // マウスアウト
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), {
            passive: true
        });

        // マウス移動
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), {
            passive: true
        });

        // スクロール
        if (this.config.hideOnScroll) {
            document.addEventListener('scroll', this.handleScroll.bind(this), {
                passive: true
            });
        }

        // リサイズ
        if (this.config.hideOnResize) {
            window.addEventListener('resize', this.handleResize.bind(this), {
                passive: true
            });
        }

        // エスケープキー
        if (this.config.hideOnEscape) {
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }

    /**
   * マウスオーバー処理
   */
    handleMouseOver(event) {
        const element = this.findClosestElement(event.target, '[data-tooltip]');
        if (!element) {
            return;
        }

        // 既存のタイムアウトをクリア
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }

        // 遅延後にツールチップを表示
        this.hoverTimeout = setTimeout(() => {
            if (this.isElementHovered(element)) {
                this.showTooltip(element, event);
            }
        }, this.config.delay);
    }

    /**
   * マウスアウト処理
   */
    handleMouseOut(event) {
        const element = this.findClosestElement(event.target, '[data-tooltip]');
        if (!element) {
            return;
        }

        // タイムアウトをクリア
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }

        // 遅延後にツールチップを非表示
        setTimeout(() => {
            if (!this.isElementHovered(element)) {
                this.hideTooltip();
            }
        }, this.config.hideDelay);
    }

    /**
   * マウス移動処理
   */
    handleMouseMove(event) {
        if (this.activeTooltip) {
            this.updatePosition(event);
        }
    }

    /**
   * スクロール処理
   */
    handleScroll() {
        this.hideTooltip();
    }

    /**
   * リサイズ処理
   */
    handleResize() {
        this.hideTooltip();
    }

    /**
   * キーダウン処理
   */
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.hideTooltip();
        }
    }

    /**
   * 要素がホバーされているかチェック
   */
    isElementHovered(element) {
        return element.matches(':hover');
    }

    /**
   * クロスブラウザ対応のclosestメソッド
   */
    findClosestElement(element, selector) {
        if (element.closest) {
            return element.closest(selector);
        }

        // フォールバック実装
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            if (element.matches && element.matches(selector)) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }

    /**
   * ツールチップ表示
   */
    showTooltip(element, event) {
    // 既存のツールチップを非表示
        this.hideTooltip();

        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) {
            return;
        }

        const config = this.getElementConfig(element);

        try {
            this.createTooltip(tooltipText, config, event);
            this.activeTooltip = { element, config };
        } catch (error) {
            console.error('❌ Failed to show tooltip:', error);
        }
    }

    /**
   * ツールチップ非表示
   */
    hideTooltip() {
        if (!this.activeTooltip) {
            return;
        }

        const container = document.getElementById('tooltip-container');
        if (!container) {
            return;
        }

        const tooltip = container.querySelector('.tooltip');
        if (!tooltip) {
            return;
        }

        const config = this.activeTooltip.config;
        const animation = this.animations.get(config.animation);

        if (animation && animation.hide) {
            Object.assign(tooltip.style, animation.hide);

            setTimeout(() => {
                this.removeTooltip();
            }, 150);
        } else {
            this.removeTooltip();
        }
    }

    /**
   * ツールチップ削除
   */
    removeTooltip() {
        const container = document.getElementById('tooltip-container');
        if (container) {
            container.innerHTML = '';
            container.style.opacity = '0';
        }

        this.activeTooltip = null;
    }

    /**
   * ツールチップ作成
   */
    createTooltip(text, config, event) {
        const container = document.getElementById('tooltip-container');
        if (!container) {
            throw new Error('Tooltip container not found');
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.setAttribute('role', 'tooltip');
        tooltip.setAttribute('aria-hidden', 'false');

        // テーマ適用
        const theme = this.themes.get(config.theme) || this.themes.get('light');
        Object.assign(tooltip.style, {
            position: 'absolute',
            maxWidth: `${config.maxWidth}px`,
            minWidth: `${config.minWidth}px`,
            width: 'auto',
            zIndex: this.config.zIndex + 1,
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            ...theme
        });

        // アニメーション適用
        const animation = this.animations.get(config.animation);
        if (animation && animation.show) {
            Object.assign(tooltip.style, animation.show);
        }

        // 矢印追加
        if (config.arrow) {
            this.addArrow(tooltip, config);
        }

        container.appendChild(tooltip);
        container.style.opacity = '1';

        // 位置計算
        this.calculatePosition(tooltip, event, config);

        // アニメーション表示
        requestAnimationFrame(() => {
            if (animation && animation.visible) {
                Object.assign(tooltip.style, animation.visible);
            } else {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            }
        });
    }

    /**
   * 矢印追加
   */
    addArrow(tooltip, config) {
        const arrow = document.createElement('div');
        arrow.className = 'tooltip-arrow';
        arrow.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            border: 5px solid transparent;
        `;

        const theme = this.themes.get(config.theme) || this.themes.get('light');

        switch (config.position) {
            case 'top':
                arrow.style.bottom = '-10px';
                arrow.style.left = '50%';
                arrow.style.transform = 'translateX(-50%)';
                arrow.style.borderTopColor = theme.backgroundColor;
                break;
            case 'bottom':
                arrow.style.top = '-10px';
                arrow.style.left = '50%';
                arrow.style.transform = 'translateX(-50%)';
                arrow.style.borderBottomColor = theme.backgroundColor;
                break;
            case 'left':
                arrow.style.right = '-10px';
                arrow.style.top = '50%';
                arrow.style.transform = 'translateY(-50%)';
                arrow.style.borderLeftColor = theme.backgroundColor;
                break;
            case 'right':
                arrow.style.left = '-10px';
                arrow.style.top = '50%';
                arrow.style.transform = 'translateY(-50%)';
                arrow.style.borderRightColor = theme.backgroundColor;
                break;
        }

        tooltip.appendChild(arrow);
    }

    /**
   * 位置計算
   */
    calculatePosition(tooltip, event, config) {
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let x, y;

        switch (config.position) {
            case 'top':
                x = rect.left + rect.width / 2 - tooltipRect.width / 2;
                y = rect.top - tooltipRect.height - config.offset;
                break;
            case 'bottom':
                x = rect.left + rect.width / 2 - tooltipRect.width / 2;
                y = rect.bottom + config.offset;
                break;
            case 'left':
                x = rect.left - tooltipRect.width - config.offset;
                y = rect.top + rect.height / 2 - tooltipRect.height / 2;
                break;
            case 'right':
                x = rect.right + config.offset;
                y = rect.top + rect.height / 2 - tooltipRect.height / 2;
                break;
            default:
                x = event.clientX + 10;
                y = event.clientY - tooltipRect.height - 10;
        }

        // 初期位置を設定（getBoundingClientRectが正しく動作するように）
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        // 実際のサイズを取得して再計算
        const actualRect = tooltip.getBoundingClientRect();

        switch (config.position) {
            case 'top':
                x = rect.left + rect.width / 2 - actualRect.width / 2;
                y = rect.top - actualRect.height - config.offset;
                break;
            case 'bottom':
                x = rect.left + rect.width / 2 - actualRect.width / 2;
                y = rect.bottom + config.offset;
                break;
            case 'left':
                x = rect.left - actualRect.width - config.offset;
                y = rect.top + rect.height / 2 - actualRect.height / 2;
                break;
            case 'right':
                x = rect.right + config.offset;
                y = rect.top + rect.height / 2 - actualRect.height / 2;
                break;
        }

        // ビューポート内に収める
        x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8));
        y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8));

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    /**
   * 位置更新
   */
    updatePosition(event) {
        if (!this.activeTooltip) {
            return;
        }

        const tooltip = document.querySelector('.tooltip');
        if (!tooltip) {
            return;
        }

        const config = this.activeTooltip.config;
        this.calculatePosition(tooltip, event, config);
    }

    /**
   * 要素設定取得
   */
    getElementConfig(element) {
        const config = { ...this.config };

        const position = element.getAttribute('data-tooltip-position');
        const delay = element.getAttribute('data-tooltip-delay');
        const maxWidth = element.getAttribute('data-tooltip-max-width');
        const minWidth = element.getAttribute('data-tooltip-min-width');
        const theme = element.getAttribute('data-tooltip-theme');
        const animation = element.getAttribute('data-tooltip-animation');

        if (position) {
            config.position = position;
        }
        if (delay) {
            config.delay = parseInt(delay);
        }
        if (maxWidth) {
            config.maxWidth = parseInt(maxWidth);
        }
        if (minWidth) {
            config.minWidth = parseInt(minWidth);
        }
        if (theme) {
            config.theme = theme;
        }
        if (animation) {
            config.animation = animation;
        }

        return config;
    }

    /**
   * ツールチップ追加
   */
    addTooltip(element, text, options = {}) {
        if (!element || !text) {
            console.warn('⚠️ Invalid element or text for tooltip');
            return;
        }

        // セレクター文字列の場合は要素を取得
        let targetElement = element;
        if (typeof element === 'string') {
            targetElement = document.querySelector(element);
            if (!targetElement) {
                console.warn(`⚠️ Element not found: ${element}`);
                return;
            }
        }

        targetElement.setAttribute('data-tooltip', text);

        // オプションをデータ属性に設定
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined) {
                targetElement.setAttribute(`data-tooltip-${key}`, value);
            }
        });
    }

    /**
   * 動的ツールチップ追加
   */
    addDynamicTooltip(selector, text, options = {}) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
            this.addTooltip(element, text, options);
        });

        // 新しい要素の監視
        this.observeNewElements(selector, text, options);
    }

    /**
   * 新しい要素の監視
   */
    observeNewElements(selector, text, options) {
        if (this.observers.has(selector)) {
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches(selector)) {
                            this.addTooltip(node, text, options);
                        }

                        const childElements =
              node.querySelectorAll && node.querySelectorAll(selector);
                        if (childElements) {
                            childElements.forEach((element) => {
                                this.addTooltip(element, text, options);
                            });
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.set(selector, observer);
    }

    /**
   * 破棄
   */
    destroy() {
        this.hideTooltip();

        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        this.observers.forEach((observer) => observer.disconnect());
        this.observers.clear();

        const container = document.getElementById('tooltip-container');
        if (container) {
            container.remove();
        }

        this.isInitialized = false;
    }
}

// シングルトンインスタンス
export const tooltipManager = new TooltipManager();
