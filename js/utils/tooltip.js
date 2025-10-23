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
        this.defaultConfig = {
            position: 'top',
            delay: 300,
            maxWidth: 300,
            theme: 'light',
            animation: true
        };
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
     * ツールチップを作成
     */
    createTooltip(text, config, event) {
        const container = document.getElementById('tooltip-container');
        if (!container) {return;}

        // ツールチップ要素を作成
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${config.theme}`;
        tooltip.innerHTML = this.formatTooltipContent(text);

        // スタイルを適用
        this.applyTooltipStyles(tooltip, config);

        // コンテナに追加
        container.appendChild(tooltip);
        this.activeTooltip = tooltip;

        // 位置を計算して設定
        this.positionTooltip(tooltip, event, config);

        // アニメーションで表示
        if (config.animation) {
            requestAnimationFrame(() => {
                container.style.opacity = '1';
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            });
        } else {
            container.style.opacity = '1';
            tooltip.style.opacity = '1';
        }
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

        // アニメーションで非表示
        this.activeTooltip.style.opacity = '0';
        this.activeTooltip.style.transform = 'translateY(5px)';

        setTimeout(() => {
            if (this.activeTooltip && this.activeTooltip.parentNode) {
                this.activeTooltip.parentNode.removeChild(this.activeTooltip);
            }
            this.activeTooltip = null;
            container.style.opacity = '0';
        }, 200);
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
     * ツールチップマネージャーを破棄
     */
    destroy() {
        this.hideTooltip();
        this.tooltips.clear();
        this.isInitialized = false;

        const container = document.getElementById('tooltip-container');
        if (container) {
            container.remove();
        }

        console.log('🗑️ Tooltip manager destroyed');
    }
}

// グローバルインスタンス
export const tooltipManager = new TooltipManager();
