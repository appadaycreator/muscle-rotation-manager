// helpers.js - ユーティリティ関数

import { NOTIFICATION_DURATION, NOTIFICATION_FADE_DURATION } from './constants.js';

/**
 * 通知を表示する
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 通知タイプ (info, success, error, warning)
 */
export function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) {return;}

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, NOTIFICATION_FADE_DURATION);
    }, NOTIFICATION_DURATION);
}

/**
 * 日付を日本語形式でフォーマット
 * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
 * @returns {string} フォーマットされた日付
 */
export function formatWorkoutDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 何日前かを計算
 * @param {string} dateStr - 日付文字列
 * @returns {string} 相対日付
 */
export function getDaysAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) {return '今日';}
    if (diff === 1) {return '昨日';}
    return `${diff}日前`;
}

/**
 * 今日の日付かチェック
 * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
 * @returns {boolean} 今日かどうか
 */
export function isTodayDate(dateStr) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return dateStr === `${y}-${m}-${d}`;
}

/**
 * 日付を表示用にフォーマット
 * @param {string} dateString - 日付文字列 (YYYY-MM-DD)
 * @returns {string} フォーマットされた日付
 */
export function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}年${month}月${day}日 (${dayOfWeek})`;
}

/**
 * ワークアウト名から筋肉部位の色を取得
 * @param {string} workoutName - ワークアウト名
 * @returns {string} 色クラス
 */
export function getWorkoutColor(workoutName) {
    if (workoutName.includes('背筋')) {return 'back-color';}
    if (workoutName.includes('肩')) {return 'shoulder-color';}
    if (workoutName.includes('腕')) {return 'arm-color';}
    if (workoutName.includes('脚')) {return 'leg-color';}
    if (workoutName.includes('体幹')) {return 'core-color';}
    return 'chest-color';
}

/**
 * エクササイズ配列を安全にパース
 * @param {string} exercisesStr - JSON文字列
 * @returns {Array} エクササイズ配列
 */
export function parseExercises(exercisesStr) {
    try {
        const exercises = JSON.parse(exercisesStr || '[]');
        return Array.isArray(exercises) ? exercises : [];
    } catch {
        return [];
    }
}

/**
 * API遅延をシミュレート
 * @param {number} ms - 遅延時間（ミリ秒）
 * @returns {Promise} プロミス
 */
export function simulateApiDelay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全にDOMエレメントを取得
 * @param {string} selector - セレクター（ID、クラス、要素名など）
 * @param {Element|Document} context - 検索コンテキスト（デフォルト: document）
 * @returns {Element|null} DOMエレメント
 */
export function safeGetElement(selector, context = document) {
    try {
        return selector.startsWith('#')
            ? context.getElementById(selector.slice(1))
            : context.querySelector(selector);
    } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return null;
    }
}

/**
 * 安全に複数のDOMエレメントを取得
 * @param {string} selector - セレクター
 * @param {Element|Document} context - 検索コンテキスト（デフォルト: document）
 * @returns {NodeList} DOMエレメントのリスト
 */
export function safeGetElements(selector, context = document) {
    try {
        return context.querySelectorAll(selector);
    } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return [];
    }
}

/**
 * 安全にDOMエレメントのテキストを設定
 * @param {string|Element} target - エレメントIDまたはエレメント
 * @param {string} text - 設定するテキスト
 * @param {Element|Document} context - 検索コンテキスト
 */
export function safeSetText(target, text, context = document) {
    const element = typeof target === 'string'
        ? safeGetElement(target, context)
        : target;
    if (element) {
        element.textContent = text;
    }
}

/**
 * HTMLエスケープ処理
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') {
        return String(str);
    }

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    return str.replace(/[&<>"'`=/]/g, (match) => escapeMap[match]);
}

/**
 * 安全にDOMエレメントのHTMLを設定（XSS対策付き）
 * @param {string|Element} target - エレメントIDまたはエレメント
 * @param {string} html - 設定するHTML
 * @param {Element|Document} context - 検索コンテキスト
 * @param {boolean} escapeContent - HTMLエスケープするかどうか（デフォルト: false）
 */
export function safeSetHTML(target, html, context = document, escapeContent = false) {
    const element = typeof target === 'string'
        ? safeGetElement(target, context)
        : target;
    if (element) {
        element.innerHTML = escapeContent ? escapeHtml(html) : html;
    }
}

/**
 * 安全にテキストコンテンツを設定（XSS対策）
 * @param {string|Element} target - エレメントIDまたはエレメント
 * @param {string} content - 設定するコンテンツ
 * @param {Element|Document} context - 検索コンテキスト
 */
export function safeSetContent(target, content, context = document) {
    const element = typeof target === 'string'
        ? safeGetElement(target, context)
        : target;
    if (element) {
        // textContentを使用してXSSを防ぐ
        element.textContent = content;
    }
}

/**
 * エラーメッセージ用のHTMLを生成
 * @param {string} message - エラーメッセージ
 * @param {string} icon - アイコンクラス
 * @returns {string} エラーHTML
 */
export function createErrorHTML(message, icon = 'fas fa-exclamation-triangle') {
    return `
        <div class="text-center text-gray-500 py-8">
            <i class="${icon} text-xl mb-2"></i>
            <p>${message}</p>
        </div>
    `;
}

/**
 * 統一されたエラーハンドリング
 * @param {Error} error - エラーオブジェクト
 * @param {string} context - エラーが発生したコンテキスト
 * @param {boolean} showNotification - 通知を表示するか
 * @returns {string} エラーメッセージ
 */
export function handleError(error, context = 'Unknown', showNotification = true) {
    const errorMessage = error?.message || 'Unknown error occurred';
    const fullMessage = `${context}: ${errorMessage}`;

    console.error(fullMessage, error);

    if (showNotification) {
        showNotification(
            `${context}でエラーが発生しました`,
            'error'
        );
    }

    return fullMessage;
}

/**
 * 非同期関数を安全に実行
 * @param {Function} asyncFn - 非同期関数
 * @param {string} context - エラーコンテキスト
 * @param {*} fallbackValue - エラー時のフォールバック値
 * @returns {Promise<*>} 実行結果またはフォールバック値
 */
export async function safeAsync(asyncFn, context = 'Async operation', fallbackValue = null) {
    try {
        return await asyncFn();
    } catch (error) {
        handleError(error, context);
        return fallbackValue;
    }
}

/**
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
export function debounce(func, wait) {
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
 * スロットル関数
 * @param {Function} func - 実行する関数
 * @param {number} limit - 制限時間（ミリ秒）
 * @returns {Function} スロットルされた関数
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
