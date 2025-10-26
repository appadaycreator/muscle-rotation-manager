// helpers.js - ユーティリティ関数

import {
  NOTIFICATION_DURATION,
  NOTIFICATION_FADE_DURATION,
} from './constants.js';
import { handleError } from './errorHandler.js';

/**
 * 通知を表示する
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 通知タイプ (info, success, error, warning)
 */
export function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  if (!container) {
    return;
  }

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
  if (diff === 0) {
    return '今日';
  }
  if (diff === 1) {
    return '昨日';
  }
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
  if (workoutName.includes('背筋') || workoutName.includes('back')) {
    return 'back-color';
  }
  if (workoutName.includes('肩') || workoutName.includes('shoulder')) {
    return 'shoulder-color';
  }
  if (workoutName.includes('腕') || workoutName.includes('arm')) {
    return 'arm-color';
  }
  if (workoutName.includes('脚') || workoutName.includes('leg')) {
    return 'leg-color';
  }
  if (workoutName.includes('体幹') || workoutName.includes('core')) {
    return 'core-color';
  }
  return 'chest-color';
}

/**
 * 筋肉部位IDから色クラスを取得
 * @param {string} muscleId - 筋肉部位ID
 * @returns {string} 色クラス
 */
export function getMuscleColor(muscleId) {
  const colorMap = {
    chest: 'chest-color',
    back: 'back-color',
    shoulders: 'shoulder-color',
    arms: 'arm-color',
    legs: 'leg-color',
    abs: 'core-color',
  };
  return colorMap[muscleId] || 'chest-color';
}

/**
 * 筋肉部位IDから背景色クラスを取得
 * @param {string} muscleId - 筋肉部位ID
 * @returns {string} 背景色クラス
 */
export function getMuscleBgColor(muscleId) {
  const bgColorMap = {
    chest: 'bg-red-100',
    back: 'bg-green-100',
    shoulder: 'bg-yellow-100',
    arm: 'bg-purple-100',
    leg: 'bg-blue-100',
    core: 'bg-pink-100',
  };
  return bgColorMap[muscleId] || 'bg-red-100';
}

/**
 * 筋肉部位IDからテキスト色クラスを取得
 * @param {string} muscleId - 筋肉部位ID
 * @returns {string} テキスト色クラス
 */
export function getMuscleTextColor(muscleId) {
  const textColorMap = {
    chest: 'text-red-700',
    back: 'text-green-700',
    shoulder: 'text-yellow-700',
    arm: 'text-purple-700',
    leg: 'text-blue-700',
    core: 'text-pink-700',
  };
  return textColorMap[muscleId] || 'text-red-700';
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
  return new Promise((resolve) => setTimeout(resolve, ms));
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
 * @returns {Array<Element>} DOMエレメントの配列
 */
export function safeGetElements(selector, context = document) {
  try {
    return Array.from(context.querySelectorAll(selector));
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
  const element =
    typeof target === 'string' ? safeGetElement(target, context) : target;
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
    '=': '&#x3D;',
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
export function safeSetHTML(
  target,
  html,
  context = document,
  escapeContent = false
) {
  const element =
    typeof target === 'string' ? safeGetElement(target, context) : target;
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
  const element =
    typeof target === 'string' ? safeGetElement(target, context) : target;
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

// 非推奨のhandleError関数は削除されました。
// 代わりにerrorHandler.jsのhandleError関数を使用してください。

/**
 * 非同期関数を安全に実行
 * @param {Function} asyncFn - 非同期関数
 * @param {string} context - エラーコンテキスト
 * @param {*} fallbackValue - エラー時のフォールバック値
 * @returns {Promise<*>} 実行結果またはフォールバック値
 */
export async function safeAsync(
  asyncFn,
  context = 'Async operation',
  fallbackValue = null
) {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, { context });
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
 * カスタム入力ダイアログを表示
 * @param {string} message - 入力メッセージ
 * @param {string} defaultValue - デフォルト値
 * @returns {Promise<string|null>} 入力値またはnull
 */
export function showInputDialog(message, defaultValue = '') {
  return new Promise((resolve) => {
    // カスタム入力ダイアログを作成
    const dialog = document.createElement('div');
    dialog.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
                <div class="flex items-center mb-4">
                    <i class="fas fa-edit text-blue-500 text-xl mr-3"></i>
                    <h3 class="text-lg font-semibold text-gray-900">入力</h3>
                </div>
                <p class="text-gray-700 mb-4">${message}</p>
                <input type="text" 
                       class="input-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6" 
                       value="${defaultValue}" 
                       placeholder="入力してください">
                <div class="flex justify-end space-x-3">
                    <button class="cancel-btn px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        キャンセル
                    </button>
                    <button class="ok-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        OK
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(dialog);

    const inputField = dialog.querySelector('.input-field');
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const okBtn = dialog.querySelector('.ok-btn');

    // フォーカスを設定
    inputField.focus();
    inputField.select();

    const cleanup = () => {
      document.body.removeChild(dialog);
    };

    const handleOk = () => {
      const value = inputField.value.trim();
      cleanup();
      resolve(value || null);
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    // イベントリスナー
    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);

    // Enterキーで確定、ESCキーでキャンセル
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleOk();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    });

    // ESCキーでキャンセル
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // 背景クリックでキャンセル
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        handleCancel();
      }
    });
  });
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
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 日付が未来かどうかをチェック
 * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
 * @returns {boolean} 未来の日付かどうか
 */
export function isFutureDate(dateStr) {
  const today = new Date();
  const targetDate = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate > today;
}

/**
 * 日付が過去かどうかをチェック
 * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
 * @returns {boolean} 過去の日付かどうか
 */
export function isPastDate(dateStr) {
  const today = new Date();
  const targetDate = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate < today;
}

/**
 * カレンダー用の詳細モーダルHTMLを生成
 * @param {string} dateStr - 日付文字列
 * @param {Array} workouts - ワークアウト配列
 * @param {Array} plannedWorkouts - 予定されたワークアウト配列
 * @returns {string} モーダルHTML
 */
export function createCalendarModalHTML(
  dateStr,
  workouts,
  plannedWorkouts = []
) {
  const formattedDate = formatDate(dateStr);
  const isToday = isTodayDate(dateStr);
  const isFuture = isFutureDate(dateStr);

  let content = '';

  // 実際のワークアウト履歴
  if (workouts.length > 0) {
    content += `
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-dumbbell text-green-500 mr-2"></i>
                    実施したトレーニング
                </h4>
                <div class="space-y-3">
                    ${workouts
                      .map(
                        (workout) => `
                        <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="font-semibold text-gray-800">
                                    ${escapeHtml(workout.name || 'ワークアウト')}
                                </h5>
                                <span class="text-sm text-gray-500">
                                    ${workout.duration ? `${Math.floor(workout.duration / 60)}分` : ''}
                                </span>
                            </div>
                            <div class="text-sm text-gray-600 mb-2">
                                <i class="fas fa-bullseye text-blue-500 mr-1"></i>
                                部位: ${
                                  Array.isArray(workout.muscle_groups)
                                    ? workout.muscle_groups.join(', ')
                                    : workout.muscle_groups || '部位不明'
                                }
                            </div>
                            ${
                              workout.exercises && workout.exercises.length > 0
                                ? `
                                <div class="text-sm text-gray-600">
                                    <i class="fas fa-list text-purple-500 mr-1"></i>
                                    種目: ${workout.exercises.map((ex) => ex.name).join(', ')}
                                </div>
                            `
                                : ''
                            }
                            ${
                              workout.notes
                                ? `
                                <div class="text-sm text-gray-600 mt-2 italic">
                                    <i class="fas fa-sticky-note text-yellow-500 mr-1"></i>
                                    ${escapeHtml(workout.notes)}
                                </div>
                            `
                                : ''
                            }
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
        `;
  }

  // 予定されたワークアウト
  if (plannedWorkouts.length > 0) {
    content += `
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-calendar-check text-blue-500 mr-2"></i>
                    予定されたトレーニング
                </h4>
                <div class="space-y-3">
                    ${plannedWorkouts
                      .map(
                        (workout) => `
                        <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="font-semibold text-gray-800">
                                    ${escapeHtml(workout.name || 'ワークアウト')}
                                </h5>
                                <span class="text-sm text-blue-600 font-medium">
                                    予定
                                </span>
                            </div>
                            <div class="text-sm text-gray-600">
                                <i class="fas fa-bullseye text-blue-500 mr-1"></i>
                                部位: ${
                                  Array.isArray(workout.muscle_groups)
                                    ? workout.muscle_groups.join(', ')
                                    : workout.muscle_groups || '部位不明'
                                }
                            </div>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
        `;
  }

  // 何もない場合
  if (workouts.length === 0 && plannedWorkouts.length === 0) {
    if (isFuture) {
      content = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-calendar-plus text-4xl mb-4 text-gray-300"></i>
                    <p class="text-lg mb-2">この日はまだ予定がありません</p>
                    <p class="text-sm">トレーニング予定を追加してみましょう</p>
                </div>
            `;
    } else {
      content = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-info-circle text-4xl mb-4 text-gray-300"></i>
                    <p class="text-lg mb-2">この日はトレーニングを行っていません</p>
                    <p class="text-sm">休息日として過ごされました</p>
                </div>
            `;
    }
  }

  return `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" id="calendar-modal">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-calendar-day text-blue-500 mr-2"></i>
                        ${formattedDate}
                        ${isToday ? '<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">今日</span>' : ''}
                        ${isFuture ? '<span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">未来</span>' : ''}
                    </h3>
                    <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="document.getElementById('calendar-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="px-6 py-4">
                    ${content}
                </div>
                <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div class="flex justify-end space-x-3">
                        ${
                          isFuture
                            ? `
                            <button class="px-4 py-2 bg-blue-500 text-white rounded-lg 
                                           hover:bg-blue-600 transition-colors" 
                                    onclick="addPlannedWorkout('${dateStr}')">
                                <i class="fas fa-plus mr-2"></i>
                                予定を追加
                            </button>
                        `
                            : ''
                        }
                        <button class="px-4 py-2 bg-gray-500 text-white rounded-lg 
                                       hover:bg-gray-600 transition-colors" 
                                onclick="document.getElementById('calendar-modal').remove()">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
