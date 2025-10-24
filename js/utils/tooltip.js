/**
 * ツールチップユーティリティ
 * TooltipManagerのインスタンスを提供
 */
import { TooltipManager } from './TooltipManager.js';

// グローバルなツールチップマネージャーのインスタンス
export const tooltipManager = new TooltipManager();

// 初期化済みフラグ
let isInitialized = false;

/**
 * ツールチップマネージャーを初期化
 */
export function initializeTooltip() {
    if (!isInitialized) {
        tooltipManager.initialize();
        isInitialized = true;
    }
}

/**
 * ツールチップを追加
 */
export function addTooltip(element, text, options = {}) {
    tooltipManager.addTooltip(element, text, options);
}

/**
 * 動的ツールチップを追加
 */
export function addDynamicTooltip(selector, text, options = {}) {
    tooltipManager.addDynamicTooltip(selector, text, options);
}

/**
 * ツールチップマネージャーを破棄
 */
export function destroyTooltip() {
    if (isInitialized) {
        tooltipManager.destroy();
        isInitialized = false;
    }
}
