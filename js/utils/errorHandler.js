// errorHandler.js - 統一されたエラーハンドリングシステム

import { showNotification } from './helpers.js';

/**
 * エラータイプの定数
 */
export const ERROR_TYPES = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    DATABASE: 'DATABASE',
    VALIDATION: 'VALIDATION',
    STORAGE: 'STORAGE',
    PERMISSION: 'PERMISSION',
    QUOTA: 'QUOTA',
    TIMEOUT: 'TIMEOUT',
    UNKNOWN: 'UNKNOWN'
};

/**
 * エラーメッセージの日本語化マップ
 */
const ERROR_MESSAGES = {
    // ネットワークエラー
    [ERROR_TYPES.NETWORK]: {
        default: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
        offline: 'オフライン状態です。インターネット接続を確認してください。',
        timeout: 'リクエストがタイムアウトしました。しばらく時間をおいて再試行してください。',
        server_error: 'サーバーエラーが発生しました。しばらく時間をおいて再試行してください。'
    },

    // 認証エラー
    [ERROR_TYPES.AUTH]: {
        default: '認証エラーが発生しました。再度ログインしてください。',
        invalid_credentials: 'メールアドレスまたはパスワードが正しくありません。',
        email_not_confirmed: 'メールアドレスが確認されていません。確認メールをご確認ください。',
        user_not_found: 'ユーザーが見つかりません。',
        session_expired: 'セッションが期限切れです。再度ログインしてください。',
        signup_disabled: '新規登録は現在無効になっています。',
        email_already_registered: 'このメールアドレスは既に登録されています。'
    },

    // データベースエラー
    [ERROR_TYPES.DATABASE]: {
        default: 'データベースエラーが発生しました。しばらく時間をおいて再試行してください。',
        connection_failed: 'データベースへの接続に失敗しました。',
        query_failed: 'データの取得に失敗しました。',
        insert_failed: 'データの保存に失敗しました。',
        update_failed: 'データの更新に失敗しました。',
        delete_failed: 'データの削除に失敗しました。'
    },

    // バリデーションエラー
    [ERROR_TYPES.VALIDATION]: {
        default: '入力内容に問題があります。',
        required_field: '必須項目が入力されていません。',
        invalid_email: '有効なメールアドレスを入力してください。',
        invalid_password: 'パスワードは8文字以上で入力してください。',
        invalid_format: '入力形式が正しくありません。'
    },

    // ストレージエラー
    [ERROR_TYPES.STORAGE]: {
        default: 'ストレージエラーが発生しました。',
        quota_exceeded: 'ストレージ容量が不足しています。不要なデータを削除してください。',
        file_too_large: 'ファイルサイズが大きすぎます。',
        unsupported_format: 'サポートされていないファイル形式です。'
    },

    // 権限エラー
    [ERROR_TYPES.PERMISSION]: {
        default: 'この操作を実行する権限がありません。',
        access_denied: 'アクセスが拒否されました。',
        insufficient_privileges: '権限が不足しています。'
    },

    // その他
    [ERROR_TYPES.QUOTA]: {
        default: '利用制限に達しました。しばらく時間をおいて再試行してください。'
    },

    [ERROR_TYPES.TIMEOUT]: {
        default: 'タイムアウトが発生しました。しばらく時間をおいて再試行してください。'
    },

    [ERROR_TYPES.UNKNOWN]: {
        default: '予期しないエラーが発生しました。問題が続く場合はサポートにお問い合わせください。'
    }
};

/**
 * エラーの種類を判定
 * @param {Error|string} error - エラーオブジェクトまたはメッセージ
 * @returns {string} エラータイプ
 */
export function determineErrorType(error) {
    const errorMessage = typeof error === 'string' ? error : error?.message || '';
    const errorCode = error?.code || '';

    // ネットワークエラー
    if (!navigator.onLine) {
        return ERROR_TYPES.NETWORK;
    }

    if (errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('NetworkError') ||
        errorCode === 'NETWORK_ERROR') {
        return ERROR_TYPES.NETWORK;
    }

    // 認証エラー
    if (errorMessage.includes('Invalid login credentials') ||
        errorMessage.includes('Email not confirmed') ||
        errorMessage.includes('User not found') ||
        errorMessage.includes('Invalid email') ||
        errorMessage.includes('Signup is disabled') ||
        errorMessage.includes('User already registered') ||
        errorCode === 'invalid_credentials' ||
        errorCode === 'email_not_confirmed' ||
        errorCode === 'signup_disabled') {
        return ERROR_TYPES.AUTH;
    }

    // データベースエラー
    if (errorMessage.includes('duplicate key') ||
        errorMessage.includes('foreign key') ||
        errorMessage.includes('constraint') ||
        errorMessage.includes('PostgreSQL') ||
        errorCode?.startsWith('23')) {
        return ERROR_TYPES.DATABASE;
    }

    // ストレージエラー
    if (errorMessage.includes('QuotaExceededError') ||
        errorMessage.includes('storage quota') ||
        errorMessage.includes('file too large') ||
        errorCode === 'QuotaExceededError') {
        return ERROR_TYPES.STORAGE;
    }

    // バリデーションエラー
    if (errorMessage.includes('validation') ||
        errorMessage.includes('required') ||
        errorMessage.includes('invalid format')) {
        return ERROR_TYPES.VALIDATION;
    }

    // タイムアウトエラー
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('TimeoutError') ||
        errorCode === 'TIMEOUT') {
        return ERROR_TYPES.TIMEOUT;
    }

    return ERROR_TYPES.UNKNOWN;
}

/**
 * エラーメッセージを取得
 * @param {string} errorType - エラータイプ
 * @param {string} specificKey - 具体的なエラーキー
 * @returns {string} 日本語エラーメッセージ
 */
export function getErrorMessage(errorType, specificKey = 'default') {
    const typeMessages = ERROR_MESSAGES[errorType];
    if (!typeMessages) {
        return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].default;
    }

    return typeMessages[specificKey] || typeMessages.default;
}

/**
 * エラーの詳細情報を判定
 * @param {Error|string} error - エラーオブジェクト
 * @returns {string} 具体的なエラーキー
 */
function determineSpecificErrorKey(error) {
    const errorMessage = typeof error === 'string' ? error : error?.message || '';

    // 認証エラーの詳細判定
    if (errorMessage.includes('Invalid login credentials')) {
        return 'invalid_credentials';
    }
    if (errorMessage.includes('Email not confirmed')) {
        return 'email_not_confirmed';
    }
    if (errorMessage.includes('User not found')) {
        return 'user_not_found';
    }
    if (errorMessage.includes('Signup is disabled')) {
        return 'signup_disabled';
    }
    if (errorMessage.includes('User already registered')) {
        return 'email_already_registered';
    }

    // ネットワークエラーの詳細判定
    if (!navigator.onLine) {
        return 'offline';
    }
    if (errorMessage.includes('timeout')) {
        return 'timeout';
    }
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        return 'server_error';
    }

    // ストレージエラーの詳細判定
    if (errorMessage.includes('QuotaExceededError')) {
        return 'quota_exceeded';
    }
    if (errorMessage.includes('file too large')) {
        return 'file_too_large';
    }
    if (errorMessage.includes('unsupported')) {
        return 'unsupported_format';
    }

    return 'default';
}

/**
 * 統一されたエラーハンドラー
 * @param {Error|string} error - エラーオブジェクトまたはメッセージ
 * @param {Object} options - オプション設定
 * @param {string} options.context - エラーが発生したコンテキスト
 * @param {boolean} options.showNotification - 通知を表示するか
 * @param {boolean} options.logToConsole - コンソールにログを出力するか
 * @param {Function} options.onRetry - リトライ関数
 * @param {number} options.maxRetries - 最大リトライ回数
 * @returns {Object} エラー情報オブジェクト
 */
export function handleError(error, options = {}) {
    const {
        context = 'Unknown',
        showNotification: shouldShowNotification = true,
        logToConsole = true,
        onRetry = null,
        maxRetries = 0
    } = options;

    const errorType = determineErrorType(error);
    const specificKey = determineSpecificErrorKey(error);
    const userMessage = getErrorMessage(errorType, specificKey);

    const errorInfo = {
        type: errorType,
        message: userMessage,
        originalError: error,
        context,
        timestamp: new Date().toISOString(),
        canRetry: shouldAllowRetry(errorType),
        retryCount: 0,
        maxRetries
    };

    // コンソールログ
    if (logToConsole) {
        console.error(`[${context}] ${errorType}:`, {
            userMessage,
            originalError: error,
            errorInfo
        });
    }

    // 通知表示
    if (shouldShowNotification) {
        const notificationType = getNotificationType(errorType);
        showNotification(userMessage, notificationType);
    }

    // リトライ可能な場合の処理
    if (errorInfo.canRetry && onRetry && maxRetries > 0) {
        errorInfo.retry = () => {
            if (errorInfo.retryCount < maxRetries) {
                errorInfo.retryCount++;
                console.log(`Retrying... (${errorInfo.retryCount}/${maxRetries})`);
                return onRetry();
            } else {
                console.warn('Maximum retry attempts reached');
                return Promise.reject(new Error('最大リトライ回数に達しました'));
            }
        };
    }

    return errorInfo;
}

/**
 * リトライを許可するかどうかを判定
 * @param {string} errorType - エラータイプ
 * @returns {boolean} リトライ可能かどうか
 */
function shouldAllowRetry(errorType) {
    const retryableTypes = [
        ERROR_TYPES.NETWORK,
        ERROR_TYPES.DATABASE,
        ERROR_TYPES.TIMEOUT
    ];

    return retryableTypes.includes(errorType);
}

/**
 * 通知タイプを取得
 * @param {string} errorType - エラータイプ
 * @returns {string} 通知タイプ
 */
function getNotificationType(errorType) {
    switch (errorType) {
        case ERROR_TYPES.NETWORK:
            return 'warning';
        case ERROR_TYPES.AUTH:
            return 'error';
        case ERROR_TYPES.DATABASE:
            return 'error';
        case ERROR_TYPES.VALIDATION:
            return 'warning';
        case ERROR_TYPES.STORAGE:
            return 'warning';
        case ERROR_TYPES.PERMISSION:
            return 'error';
        default:
            return 'error';
    }
}

/**
 * オフライン状態を検知
 * @returns {boolean} オフライン状態かどうか
 */
export function isOffline() {
    return !navigator.onLine;
}

/**
 * オンライン状態の変更を監視
 * @param {Function} onOnline - オンライン時のコールバック
 * @param {Function} onOffline - オフライン時のコールバック
 */
export function watchOnlineStatus(onOnline, onOffline) {
    const handleOnline = () => {
        console.log('🌐 オンライン状態になりました');
        showNotification('インターネット接続が復旧しました', 'success');
        if (onOnline) {onOnline();}
    };

    const handleOffline = () => {
        console.log('📴 オフライン状態になりました');
        showNotification('インターネット接続が切断されました', 'warning');
        if (onOffline) {onOffline();}
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初期状態をチェック
    if (isOffline() && onOffline) {
        onOffline();
    }

    // クリーンアップ関数を返す
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}

/**
 * リトライ機能付きの非同期関数実行
 * @param {Function} asyncFn - 実行する非同期関数
 * @param {Object} options - オプション設定
 * @returns {Promise} 実行結果
 */
export async function executeWithRetry(asyncFn, options = {}) {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        backoffMultiplier = 2,
        context = 'Async operation'
    } = options;

    let lastError;
    let delay = retryDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await asyncFn();
        } catch (error) {
            lastError = error;
            const errorType = determineErrorType(error);

            // リトライ不可能なエラーの場合は即座に失敗
            if (!shouldAllowRetry(errorType)) {
                throw handleError(error, { context }).originalError;
            }

            // 最後の試行の場合はエラーを投げる
            if (attempt === maxRetries) {
                break;
            }

            console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

            // 指数バックオフで待機
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= backoffMultiplier;
        }
    }

    // 全てのリトライが失敗した場合
    throw handleError(lastError, {
        context: `${context} (${maxRetries + 1}回試行後)`
    }).originalError;
}

/**
 * エラー情報をローカルストレージに保存（デバッグ用）
 * @param {Object} errorInfo - エラー情報
 */
export function logErrorToStorage(errorInfo) {
    try {
        const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        errorLogs.push({
            ...errorInfo,
            id: Date.now().toString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // 最新100件のみ保持
        if (errorLogs.length > 100) {
            errorLogs.splice(0, errorLogs.length - 100);
        }

        localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
    } catch (e) {
        console.warn('Failed to log error to storage:', e);
    }
}

/**
 * 保存されたエラーログを取得
 * @returns {Array} エラーログ配列
 */
export function getErrorLogs() {
    try {
        return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch (e) {
        console.warn('Failed to retrieve error logs:', e);
        return [];
    }
}

/**
 * エラーログをクリア
 */
export function clearErrorLogs() {
    try {
        localStorage.removeItem('errorLogs');
        console.log('Error logs cleared');
    } catch (e) {
        console.warn('Failed to clear error logs:', e);
    }
}
