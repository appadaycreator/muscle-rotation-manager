// js/utils/tooltip.js - ツールチップ機能

/**
 * ツールチップ管理クラス
 * カーソルを当てると説明が表示される機能を提供
 */
export class TooltipManager {
    constructor() {
        this.tooltips = new Map();
        this.activeTooltip = null;
        this.isInitialized = false;
        this.themes = new Map();
        this.animations = new Map();
        this.defaultConfig = {
            position: 'top',
            delay: 300,
            maxWidth: 300,
            theme: 'light',
            animation: true,
            arrow: true,
            interactive: false,
            trigger: 'hover',
            hideOnScroll: true,
            hideOnResize: true,
            accessibility: true
        };
        
        // デフォルトテーマを設定
        this.setupDefaultThemes();
        this.setupDefaultAnimations();
    }

    /**
     * デフォルトテーマを設定
     */
    setupDefaultThemes() {
        // ライトテーマ
        this.themes.set('light', {
            backgroundColor: '#ffffff',
            color: '#333333',
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            padding: '12px 16px'
        });

        // ダークテーマ
        this.themes.set('dark', {
            backgroundColor: '#2d3748',
            color: '#ffffff',
            border: '1px solid #4a5568',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            padding: '12px 16px'
        });

        // プライマリテーマ
        this.themes.set('primary', {
            backgroundColor: '#3182ce',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(49, 130, 206, 0.3)',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            padding: '12px 16px'
        });

        // 成功テーマ
        this.themes.set('success', {
            backgroundColor: '#38a169',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(56, 161, 105, 0.3)',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            padding: '12px 16px'
        });

        // 警告テーマ
        this.themes.set('warning', {
            backgroundColor: '#ed8936',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(237, 137, 54, 0.3)',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            padding: '12px 16px'
        });

        // エラーテーマ
        this.themes.set('error', {
            backgroundColor: '#e53e3e',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(229, 62, 62, 0.3)',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            padding: '12px 16px'
        });
    }

    /**
     * デフォルトアニメーションを設定
     */
    setupDefaultAnimations() {
        // フェードインアニメーション
        this.animations.set('fadeIn', {
            show: {
                opacity: '0',
                transform: 'translateY(-10px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            },
            visible: {
                opacity: '1',
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            },
            hide: {
                opacity: '0',
                transform: 'translateY(-10px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            }
        });

        // スライドアニメーション
        this.animations.set('slide', {
            show: {
                opacity: '0',
                transform: 'translateY(20px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            },
            visible: {
                opacity: '1',
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            },
            hide: {
                opacity: '0',
                transform: 'translateY(20px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            }
        });

        // スケールアニメーション
        this.animations.set('scale', {
            show: {
                opacity: '0',
                transform: 'scale(0.8)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            },
            visible: {
                opacity: '1',
                transform: 'scale(1)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            },
            hide: {
                opacity: '0',
                transform: 'scale(0.8)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            }
        });

        // バウンスアニメーション
        this.animations.set('bounce', {
            show: {
                opacity: '0',
                transform: 'translateY(-20px) scale(0.8)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            },
            visible: {
                opacity: '1',
                transform: 'translateY(0) scale(1)',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            },
            hide: {
                opacity: '0',
                transform: 'translateY(-20px) scale(0.8)',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
            }
        });
    }

    /**
     * ツールチップ機能を初期化
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('🔄 Initializing tooltip manager...');

            // ツールチップコンテナを作成
            this.createTooltipContainer();

            // グローバルイベントリスナーを設定
            this.setupGlobalEventListeners();

            this.isInitialized = true;
            console.log('✅ Tooltip manager initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize tooltip manager:', error);
            throw error;
        }
    }

    /**
     * ツールチップコンテナを作成
     */
    createTooltipContainer() {
        // 既存のコンテナがあれば削除
        const existingContainer = document.getElementById('tooltip-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // 新しいコンテナを作成
        const container = document.createElement('div');
        container.id = 'tooltip-container';
        container.className = 'tooltip-container';
        container.style.cssText = `
            position: fixed;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        document.body.appendChild(container);
    }

    /**
     * グローバルイベントリスナーを設定
     */
    setupGlobalEventListeners() {
        // マウスオーバーイベント
        document.addEventListener('mouseover', (e) => {
            const element = e.target.closest('[data-tooltip]');
            if (element) {
                this.showTooltip(element, e);
            }
        });

        // マウスアウトイベント
        document.addEventListener('mouseout', (e) => {
            const element = e.target.closest('[data-tooltip]');
            if (element) {
                this.hideTooltip();
            }
        });

        // マウス移動イベント
        document.addEventListener('mousemove', (e) => {
            if (this.activeTooltip) {
                this.updateTooltipPosition(e);
            }
        });

        // スクロールイベント
        document.addEventListener('scroll', () => {
            if (this.activeTooltip) {
                this.hideTooltip();
            }
        });

        // ウィンドウリサイズイベント
        window.addEventListener('resize', () => {
            if (this.activeTooltip) {
                this.hideTooltip();
            }
        });
    }

    /**
     * ツールチップを表示
     */
    showTooltip(element, event) {
        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) {return;}

        // 既存のツールチップを非表示
        this.hideTooltip();

        // 設定を取得
        const config = this.getElementConfig(element);

        // 遅延を適用
        if (config.delay > 0) {
            setTimeout(() => {
                if (this.isElementHovered(element)) {
                    this.createTooltip(tooltipText, config, event);
                }
            }, config.delay);
        } else {
            this.createTooltip(tooltipText, config, event);
        }
    }

    /**
     * テーマを追加
     * @param {string} name - テーマ名
     * @param {Object} styles - スタイル設定
     */
    addTheme(name, styles) {
        this.themes.set(name, styles);
    }

    /**
     * アニメーションを追加
     * @param {string} name - アニメーション名
     * @param {Object} animation - アニメーション設定
     */
    addAnimation(name, animation) {
        this.animations.set(name, animation);
    }

    /**
     * ツールチップのテーマを取得
     * @param {string} themeName - テーマ名
     * @returns {Object} テーマ設定
     */
    getTheme(themeName) {
        return this.themes.get(themeName) || this.themes.get('light');
    }

    /**
     * ツールチップのアニメーションを取得
     * @param {string} animationName - アニメーション名
     * @returns {Object} アニメーション設定
     */
    getAnimation(animationName) {
        return this.animations.get(animationName) || this.animations.get('fadeIn');
    }

    /**
     * ツールチップを作成
     */
    createTooltip(text, config, event) {
        const container = document.getElementById('tooltip-container');
        if (!container) {return;}

        // ツールチップ要素を作成
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${config.theme}`;
        tooltip.innerHTML = this.formatTooltipContent(text);

        // テーマとアニメーションを適用
        this.applyTooltipTheme(tooltip, config);
        this.applyTooltipAnimation(tooltip, config);

        // コンテナに追加
        container.appendChild(tooltip);
        this.activeTooltip = tooltip;

        // 位置を計算して設定
        this.positionTooltip(tooltip, event, config);

        // アニメーションで表示
        this.showTooltipWithAnimation(tooltip, config);
    }

    /**
     * ツールチップのテーマを適用
     * @param {HTMLElement} tooltip - ツールチップ要素
     * @param {Object} config - 設定
     */
    applyTooltipTheme(tooltip, config) {
        const theme = this.getTheme(config.theme);
        
        // 基本スタイルを適用
        Object.assign(tooltip.style, {
            position: 'absolute',
            maxWidth: `${config.maxWidth}px`,
            zIndex: '10001',
            pointerEvents: 'none',
            ...theme
        });

        // 矢印を追加
        if (config.arrow) {
            this.addTooltipArrow(tooltip, config);
        }
    }

    /**
     * ツールチップのアニメーションを適用
     * @param {HTMLElement} tooltip - ツールチップ要素
     * @param {Object} config - 設定
     */
    applyTooltipAnimation(tooltip, config) {
        if (!config.animation) return;

        const animation = this.getAnimation(config.animation);
        
        // 初期状態を設定
        Object.assign(tooltip.style, animation.show);
    }

    /**
     * ツールチップをアニメーション付きで表示
     * @param {HTMLElement} tooltip - ツールチップ要素
     * @param {Object} config - 設定
     */
    showTooltipWithAnimation(tooltip, config) {
        if (!config.animation) {
            tooltip.style.opacity = '1';
            return;
        }

        const animation = this.getAnimation(config.animation);
        
        // アニメーションで表示
        requestAnimationFrame(() => {
            Object.assign(tooltip.style, animation.visible);
        });
    }

    /**
     * ツールチップの矢印を追加
     * @param {HTMLElement} tooltip - ツールチップ要素
     * @param {Object} config - 設定
     */
    addTooltipArrow(tooltip, config) {
        const arrow = document.createElement('div');
        arrow.className = 'tooltip-arrow';
        arrow.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
        `;

        // 位置に応じて矢印の向きを設定
        switch (config.position) {
            case 'top':
                arrow.style.bottom = '-12px';
                arrow.style.left = '50%';
                arrow.style.transform = 'translateX(-50%)';
                arrow.style.borderTopColor = this.getTheme(config.theme).backgroundColor;
                break;
            case 'bottom':
                arrow.style.top = '-12px';
                arrow.style.left = '50%';
                arrow.style.transform = 'translateX(-50%)';
                arrow.style.borderBottomColor = this.getTheme(config.theme).backgroundColor;
                break;
            case 'left':
                arrow.style.right = '-12px';
                arrow.style.top = '50%';
                arrow.style.transform = 'translateY(-50%)';
                arrow.style.borderLeftColor = this.getTheme(config.theme).backgroundColor;
                break;
            case 'right':
                arrow.style.left = '-12px';
                arrow.style.top = '50%';
                arrow.style.transform = 'translateY(-50%)';
                arrow.style.borderRightColor = this.getTheme(config.theme).backgroundColor;
                break;
        }

        tooltip.appendChild(arrow);
    }

    /**
     * ツールチップの位置を計算
     */
    positionTooltip(tooltip, event, config) {
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let x, y;

        switch (config.position) {
            case 'top':
                x = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                y = rect.top - tooltipRect.height - 8;
                break;
            case 'bottom':
                x = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                y = rect.bottom + 8;
                break;
            case 'left':
                x = rect.left - tooltipRect.width - 8;
                y = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                x = rect.right + 8;
                y = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            default:
                x = event.clientX + 10;
                y = event.clientY - tooltipRect.height - 10;
        }

        // ビューポート内に収まるように調整
        x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8));
        y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8));

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    /**
     * ツールチップの位置を更新
     */
    updateTooltipPosition(event) {
        if (!this.activeTooltip) {return;}

        const tooltip = this.activeTooltip;
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let x = event.clientX + 10;
        let y = event.clientY - tooltipRect.height - 10;

        // ビューポート内に収まるように調整
        x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8));
        y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8));

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    /**
     * ツールチップを非表示
     */
    hideTooltip() {
        const container = document.getElementById('tooltip-container');
        if (!container || !this.activeTooltip) {return;}

        // アニメーション設定を取得
        const config = this.getActiveTooltipConfig();
        if (config && config.animation) {
            const animation = this.getAnimation(config.animation);
            Object.assign(this.activeTooltip.style, animation.hide);
            
            // アニメーション完了後に削除
            setTimeout(() => {
                this.removeActiveTooltip();
            }, 200);
        } else {
            // アニメーションなしの場合は即座に削除
            this.removeActiveTooltip();
        }
    }

    /**
     * アクティブなツールチップの設定を取得
     * @returns {Object|null} 設定
     */
    getActiveTooltipConfig() {
        if (!this.activeTooltip) return null;
        
        // ツールチップの設定を取得（簡易版）
        return {
            animation: 'fadeIn',
            theme: 'light'
        };
    }

    /**
     * アクティブなツールチップを削除
     */
    removeActiveTooltip() {
        if (this.activeTooltip && this.activeTooltip.parentNode) {
            this.activeTooltip.parentNode.removeChild(this.activeTooltip);
        }
        this.activeTooltip = null;
        
        const container = document.getElementById('tooltip-container');
        if (container) {
            container.style.opacity = '0';
        }
    }

    /**
     * 要素の設定を取得
     */
    getElementConfig(element) {
        const config = { ...this.defaultConfig };

        // データ属性から設定を取得
        const position = element.getAttribute('data-tooltip-position');
        const delay = element.getAttribute('data-tooltip-delay');
        const maxWidth = element.getAttribute('data-tooltip-max-width');
        const theme = element.getAttribute('data-tooltip-theme');
        const animation = element.getAttribute('data-tooltip-animation');

        if (position) {config.position = position;}
        if (delay) {config.delay = parseInt(delay);}
        if (maxWidth) {config.maxWidth = parseInt(maxWidth);}
        if (theme) {config.theme = theme;}
        if (animation !== null) {config.animation = animation === 'true';}

        return config;
    }

    /**
     * ツールチップのスタイルを適用
     */
    applyTooltipStyles(tooltip, config) {
        tooltip.style.cssText = `
            position: absolute;
            max-width: ${config.maxWidth}px;
            padding: 8px 12px;
            background: ${config.theme === 'dark' ? '#1f2937' : '#ffffff'};
            color: ${config.theme === 'dark' ? '#f9fafb' : '#1f2937'};
            border: 1px solid ${config.theme === 'dark' ? '#374151' : '#e5e7eb'};
            border-radius: 6px;
            font-size: 14px;
            line-height: 1.4;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            opacity: 0;
            transform: translateY(5px);
            transition: all 0.2s ease;
            word-wrap: break-word;
            z-index: 10001;
        `;
    }

    /**
     * ツールチップの内容をフォーマット
     */
    formatTooltipContent(text) {
        // HTMLタグをエスケープ
        const escapedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        // 改行を<br>に変換
        return escapedText.replace(/\n/g, '<br>');
    }

    /**
     * 要素がホバーされているかチェック
     */
    isElementHovered(element) {
        return element.matches(':hover');
    }

    /**
     * 要素にツールチップを追加
     */
    addTooltip(element, text, config = {}) {
        if (!element || !text) {return;}

        element.setAttribute('data-tooltip', text);

        // 設定をデータ属性に追加
        if (config.position) {element.setAttribute('data-tooltip-position', config.position);}
        if (config.delay !== undefined) {element.setAttribute('data-tooltip-delay', config.delay);}
        if (config.maxWidth) {element.setAttribute('data-tooltip-max-width', config.maxWidth);}
        if (config.theme) {element.setAttribute('data-tooltip-theme', config.theme);}
        if (config.animation !== undefined) {element.setAttribute('data-tooltip-animation', config.animation);}
    }

    /**
     * 要素からツールチップを削除
     */
    removeTooltip(element) {
        if (!element) {return;}

        element.removeAttribute('data-tooltip');
        element.removeAttribute('data-tooltip-position');
        element.removeAttribute('data-tooltip-delay');
        element.removeAttribute('data-tooltip-max-width');
        element.removeAttribute('data-tooltip-theme');
        element.removeAttribute('data-tooltip-animation');
    }

    /**
     * 複数の要素に一括でツールチップを追加
     */
    addTooltipsToElements(elements, text, config = {}) {
        if (!Array.isArray(elements)) {return;}

        elements.forEach(element => {
            this.addTooltip(element, text, config);
        });
    }

    /**
     * 筋肉部位用のツールチップを追加
     */
    addMuscleGroupTooltip(element, muscleGroup) {
        const tooltips = {
            chest: '胸筋（大胸筋）\n回復期間: 48-72時間\n主なエクササイズ: ベンチプレス、プッシュアップ',
            back: '背筋（広背筋、僧帽筋）\n回復期間: 48-72時間\n主なエクササイズ: プルアップ、デッドリフト',
            shoulder: '肩（三角筋）\n回復期間: 24-48時間\n主なエクササイズ: ショルダープレス、サイドレイズ',
            arm: '腕（上腕二頭筋、三頭筋）\n回復期間: 24-48時間\n主なエクササイズ: バーベルカール、トライセップス',
            leg: '脚（大腿四頭筋、ハムストリング）\n回復期間: 72-96時間\n主なエクササイズ: スクワット、デッドリフト',
            core: '体幹（腹筋、背筋）\n回復期間: 24-48時間\n主なエクササイズ: プランク、クランチ'
        };

        const tooltipText = tooltips[muscleGroup] || '筋肉部位の詳細情報';
        this.addTooltip(element, tooltipText, {
            position: 'top',
            maxWidth: 250,
            theme: 'light'
        });
    }

    /**
     * エクササイズ用のツールチップを追加
     */
    addExerciseTooltip(element, exercise) {
        const tooltipText = `${exercise.name}\n難易度: ${exercise.difficulty}\n対象部位: ${exercise.muscleGroups.join(', ')}\n${exercise.description || ''}`;

        this.addTooltip(element, tooltipText, {
            position: 'top',
            maxWidth: 300,
            theme: 'light'
        });
    }

    /**
     * 統計データ用のツールチップを追加
     */
    addStatsTooltip(element, statType) {
        const tooltips = {
            totalWorkouts: '総ワークアウト数\nこれまでに記録されたワークアウトの合計数',
            currentStreak: '現在の連続日数\n連続してワークアウトを行っている日数',
            weeklyGoal: '週間目標\n1週間に設定されたワークアウト目標数',
            progressRate: '進捗率\n目標に対する現在の進捗状況',
            recoveryTime: '回復時間\n最後のワークアウトからの経過時間',
            muscleBalance: '筋肉バランス\n各部位のトレーニング頻度のバランス'
        };

        const tooltipText = tooltips[statType] || '統計データの詳細';
        this.addTooltip(element, tooltipText, {
            position: 'top',
            maxWidth: 200,
            theme: 'light'
        });
    }

    /**
     * 複数のツールチップを一括追加
     * @param {Array} tooltipConfigs - ツールチップ設定の配列
     */
    addTooltips(tooltipConfigs) {
        try {
            tooltipConfigs.forEach(({ element, text, config }) => {
                this.addTooltip(element, text, config);
            });
            console.log(`✅ Added ${tooltipConfigs.length} tooltips`);
        } catch (error) {
            console.error('❌ Failed to add multiple tooltips:', error);
        }
    }

    /**
     * 動的ツールチップを追加（要素が後から追加される場合）
     * @param {string} selector - セレクター
     * @param {string} text - ツールチップテキスト
     * @param {Object} config - 設定オブジェクト
     */
    addDynamicTooltip(selector, text, config = {}) {
        try {
            // 既存の要素にツールチップを適用
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.addTooltip(element, text, config);
            });

            // 新しい要素が追加された時の監視を設定
            this.observeNewElements(selector, text, config);
            
            console.log(`✅ Dynamic tooltip added for selector: ${selector}`);

        } catch (error) {
            console.error(`❌ Failed to add dynamic tooltip for selector ${selector}:`, error);
        }
    }

    /**
     * 新しい要素の監視を設定
     * @param {string} selector - セレクター
     * @param {string} text - ツールチップテキスト
     * @param {Object} config - 設定オブジェクト
     */
    observeNewElements(selector, text, config) {
        try {
            if (!this.observer) {
                this.observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // 新しく追加された要素をチェック
                                if (node.matches && node.matches(selector)) {
                                    this.addTooltip(node, text, config);
                                }
                                
                                // 子要素もチェック
                                const childElements = node.querySelectorAll && node.querySelectorAll(selector);
                                if (childElements) {
                                    childElements.forEach(element => {
                                        this.addTooltip(element, text, config);
                                    });
                                }
                            }
                        });
                    });
                });
            }

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });

        } catch (error) {
            console.error('❌ Failed to observe new elements:', error);
        }
    }

    /**
     * ツールチップの表示位置を自動調整
     * @param {HTMLElement} tooltip - ツールチップ要素
     * @param {HTMLElement} target - ターゲット要素
     */
    adjustTooltipPosition(tooltip, target) {
        try {
            const tooltipRect = tooltip.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let position = tooltip.dataset.position || 'top';
            let top = targetRect.top - tooltipRect.height - 10;
            let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

            // 右端にはみ出す場合
            if (left + tooltipRect.width > viewportWidth - 10) {
                left = viewportWidth - tooltipRect.width - 10;
            }

            // 左端にはみ出す場合
            if (left < 10) {
                left = 10;
            }

            // 上端にはみ出す場合
            if (top < 10) {
                position = 'bottom';
                top = targetRect.bottom + 10;
            }

            // 下端にはみ出す場合
            if (top + tooltipRect.height > viewportHeight - 10) {
                position = 'top';
                top = targetRect.top - tooltipRect.height - 10;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.dataset.position = position;

        } catch (error) {
            console.error('❌ Failed to adjust tooltip position:', error);
        }
    }

    /**
     * ツールチップのテーマを設定
     * @param {string} theme - テーマ名
     */
    setTheme(theme) {
        try {
            const tooltipContainer = document.getElementById('tooltip-container');
            if (tooltipContainer) {
                tooltipContainer.className = `tooltip-container theme-${theme}`;
            }
            console.log(`✅ Tooltip theme set to: ${theme}`);
        } catch (error) {
            console.error('❌ Failed to set tooltip theme:', error);
        }
    }

    /**
     * ツールチップのアニメーションを設定
     * @param {boolean} enabled - アニメーション有効/無効
     */
    setAnimation(enabled) {
        try {
            this.defaultConfig.animation = enabled;
            console.log(`✅ Tooltip animation ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('❌ Failed to set tooltip animation:', error);
        }
    }

    /**
     * ツールチップマネージャーを破棄
     */
    destroy() {
        this.hideTooltip();
        this.tooltips.clear();
        this.isInitialized = false;

        // オブザーバーを停止
        if (this.observer) {
            this.observer.disconnect();
        }

        const container = document.getElementById('tooltip-container');
        if (container) {
            container.remove();
        }

        console.log('🗑️ Tooltip manager destroyed');
    }
}

// グローバルインスタンス
export const tooltipManager = new TooltipManager();
