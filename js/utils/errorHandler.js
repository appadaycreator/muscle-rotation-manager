// errorHandler.js - 統一されたエラーハンドリングシステム

import { showNotification } from './helpers.js';

/**
 * エラータイプの定数
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  CONNECTION: 'CONNECTION',
  AUTH: 'AUTH',
  DATABASE: 'DATABASE',
  VALIDATION: 'VALIDATION',
  STORAGE: 'STORAGE',
  PERMISSION: 'PERMISSION',
  QUOTA: 'QUOTA',
  TIMEOUT: 'TIMEOUT',
  SYNC: 'SYNC',
  UNKNOWN: 'UNKNOWN',
};

/**
 * エラーメッセージの日本語化マップ（解決方法付き）
 */
const ERROR_MESSAGES = {
  // ネットワークエラー
  [ERROR_TYPES.NETWORK]: {
    default: {
      message: 'インターネット接続に問題があります',
      description: 'ネットワークエラーが発生しました',
      solutions: [
        'Wi-Fiまたはモバイルデータ接続を確認してください',
        'ルーターの電源を一度切って再起動してください',
        'しばらく時間をおいて再試行してください',
      ],
      severity: 'warning',
    },
    offline: {
      message: 'オフライン状態です',
      description: 'インターネット接続が切断されています',
      solutions: [
        'Wi-Fi設定を確認してください',
        'モバイルデータがオンになっているか確認してください',
        '機内モードがオフになっているか確認してください',
      ],
      severity: 'error',
    },
    timeout: {
      message: '通信がタイムアウトしました',
      description: 'サーバーからの応答に時間がかかりすぎています',
      solutions: [
        '通信環境の良い場所で再試行してください',
        'アプリを再起動してください',
        'しばらく時間をおいて再試行してください',
      ],
      severity: 'warning',
    },
    server_error: {
      message: 'サーバーに一時的な問題があります',
      description: 'サーバーエラーが発生しました（5xx系エラー）',
      solutions: [
        'しばらく時間をおいて再試行してください',
        'アプリを再起動してください',
        '問題が続く場合はサポートにお問い合わせください',
      ],
      severity: 'error',
    },
  },

  // 接続エラー
  [ERROR_TYPES.CONNECTION]: {
    default: {
      message: 'データベース接続に問題があります',
      description: '接続エラーが発生しました',
      solutions: [
        'インターネット接続を確認してください',
        'アプリを再起動してください',
        'しばらく時間をおいて再試行してください',
      ],
      severity: 'warning',
    },
    lost: {
      message: '接続が切断されました',
      description: 'データベースとの接続が失われました',
      solutions: [
        'オフラインモードで動作します',
        '接続復旧時に自動同期されます',
        'インターネット接続を確認してください',
      ],
      severity: 'warning',
    },
    restored: {
      message: '接続が復旧しました',
      description: 'データベース接続が回復しました',
      solutions: ['データを同期中です', '通常の操作が可能になりました'],
      severity: 'success',
    },
    failed: {
      message: 'データベースに接続できません',
      description: '接続の確立に失敗しました',
      solutions: [
        'インターネット接続を確認してください',
        'サーバーの状態を確認してください',
        'しばらく時間をおいて再試行してください',
      ],
      severity: 'error',
    },
    unstable: {
      message: '接続が不安定です',
      description: 'データベース接続が不安定な状態です',
      solutions: [
        'データ保存に時間がかかる場合があります',
        '通信環境の良い場所に移動してください',
        '重要なデータは手動で保存してください',
      ],
      severity: 'warning',
    },
  },

  // 同期エラー
  [ERROR_TYPES.SYNC]: {
    default: {
      message: 'データ同期に問題があります',
      description: 'オフラインデータの同期に失敗しました',
      solutions: [
        'インターネット接続を確認してください',
        '手動で同期を再試行してください',
        'データが失われる可能性があります',
      ],
      severity: 'error',
    },
    queue_full: {
      message: '同期キューが満杯です',
      description: 'オフラインデータが蓄積されすぎています',
      solutions: [
        'オンライン状態で同期を完了してください',
        '不要なデータを削除してください',
        'アプリを再起動してください',
      ],
      severity: 'warning',
    },
    partial_failure: {
      message: '一部のデータ同期に失敗しました',
      description: '同期処理が部分的に失敗しました',
      solutions: [
        '失敗したデータは再試行されます',
        '手動で同期を再実行してください',
        'データの整合性を確認してください',
      ],
      severity: 'warning',
    },
  },

  // 認証エラー
  [ERROR_TYPES.AUTH]: {
    default: {
      message: 'ログインが必要です',
      description: '認証エラーが発生しました',
      solutions: [
        '再度ログインしてください',
        'パスワードを忘れた場合はリセットしてください',
        'アカウントをお持ちでない場合は新規登録してください',
      ],
      severity: 'error',
    },
    invalid_credentials: {
      message: 'メールアドレスまたはパスワードが正しくありません',
      description: 'ログイン情報が一致しません',
      solutions: [
        'メールアドレスのスペルを確認してください',
        'パスワードの大文字・小文字を確認してください',
        'パスワードリセット機能をご利用ください',
      ],
      severity: 'error',
    },
    email_not_confirmed: {
      message: 'メールアドレスの確認が必要です',
      description: 'アカウントのメール確認が完了していません',
      solutions: [
        'メールボックスで確認メールをチェックしてください',
        'スパムフォルダも確認してください',
        '確認メールの再送信をリクエストしてください',
      ],
      severity: 'warning',
    },
    user_not_found: {
      message: 'ユーザーが見つかりません',
      description: '指定されたアカウントが存在しません',
      solutions: [
        'メールアドレスを正しく入力してください',
        '新規アカウントを作成してください',
        'サポートにお問い合わせください',
      ],
      severity: 'error',
    },
    session_expired: {
      message: 'セッションの有効期限が切れました',
      description: 'ログイン状態が期限切れです',
      solutions: [
        '再度ログインしてください',
        '「ログイン状態を保持」にチェックを入れてください',
        'ブラウザのCookieを有効にしてください',
      ],
      severity: 'warning',
    },
    signup_disabled: {
      message: '新規登録は一時的に無効です',
      description: 'アカウント作成機能が停止中です',
      solutions: [
        'しばらく時間をおいて再試行してください',
        '既存のアカウントでログインしてください',
        'サポートにお問い合わせください',
      ],
      severity: 'info',
    },
    email_already_registered: {
      message: 'このメールアドレスは既に使用されています',
      description: 'アカウントが既に存在します',
      solutions: [
        'ログインページからサインインしてください',
        'パスワードを忘れた場合はリセットしてください',
        '別のメールアドレスで登録してください',
      ],
      severity: 'warning',
    },
  },

  // データベースエラー
  [ERROR_TYPES.DATABASE]: {
    default: {
      message: 'データの処理に失敗しました',
      description: 'データベースエラーが発生しました',
      solutions: [
        'しばらく時間をおいて再試行してください',
        'アプリを再起動してください',
        '問題が続く場合はサポートにお問い合わせください',
      ],
      severity: 'error',
    },
    connection_failed: {
      message: 'データベースに接続できません',
      description: 'サーバーとの接続に失敗しました',
      solutions: [
        'インターネット接続を確認してください',
        'しばらく時間をおいて再試行してください',
        'アプリを再起動してください',
      ],
      severity: 'error',
    },
    relationship_error: {
      message: 'データベースの関係性エラーが発生しました',
      description: 'テーブル間の関係性が見つかりません',
      solutions: [
        'アプリを再起動してください',
        'しばらく時間をおいて再試行してください',
        '問題が続く場合はサポートにお問い合わせください',
      ],
      severity: 'warning',
    },
    query_failed: {
      message: 'データの取得に失敗しました',
      description: 'データベースからの情報取得でエラーが発生しました',
      solutions: [
        'ページを再読み込みしてください',
        'フィルターや検索条件を変更してください',
        'しばらく時間をおいて再試行してください',
      ],
      severity: 'warning',
    },
    insert_failed: {
      message: 'データの保存に失敗しました',
      description: '新しい情報の保存でエラーが発生しました',
      solutions: [
        '入力内容を確認してください',
        'もう一度保存を試してください',
        'オフライン状態の場合、オンライン時に自動保存されます',
      ],
      severity: 'error',
    },
    update_failed: {
      message: 'データの更新に失敗しました',
      description: '情報の変更でエラーが発生しました',
      solutions: [
        'ページを再読み込みして最新情報を取得してください',
        '変更内容を確認してください',
        'もう一度更新を試してください',
      ],
      severity: 'warning',
    },
    delete_failed: {
      message: 'データの削除に失敗しました',
      description: '情報の削除でエラーが発生しました',
      solutions: [
        'ページを再読み込みしてください',
        '削除権限があるか確認してください',
        'もう一度削除を試してください',
      ],
      severity: 'warning',
    },
  },

  // バリデーションエラー
  [ERROR_TYPES.VALIDATION]: {
    default: {
      message: '入力内容を確認してください',
      description: '入力値に問題があります',
      solutions: [
        '必須項目がすべて入力されているか確認してください',
        '入力形式が正しいか確認してください',
        '文字数制限を確認してください',
      ],
      severity: 'warning',
    },
    required_field: {
      message: '必須項目が入力されていません',
      description: '必要な情報が不足しています',
      solutions: [
        '赤色で表示されている項目を入力してください',
        'すべての必須項目（*マーク）を確認してください',
        '空白や特殊文字のみの入力は無効です',
      ],
      severity: 'warning',
    },
    invalid_email: {
      message: 'メールアドレスの形式が正しくありません',
      description: '有効なメールアドレスを入力してください',
      solutions: [
        '「example@domain.com」の形式で入力してください',
        '@マークが含まれているか確認してください',
        'スペースや特殊文字が含まれていないか確認してください',
      ],
      severity: 'warning',
    },
    invalid_password: {
      message: 'パスワードの条件を満たしていません',
      description: 'パスワードの長さが不十分です',
      solutions: [
        '8文字以上で入力してください',
        '英数字や特殊文字を含めるとより安全です',
      ],
      severity: 'warning',
    },
    invalid_format: {
      message: '入力形式が正しくありません',
      description: '指定された形式で入力してください',
      solutions: [
        '入力例を参考にしてください',
        '数値のみ、文字のみなど制限を確認してください',
        '日付形式や電話番号形式を確認してください',
      ],
      severity: 'warning',
    },
  },

  // ストレージエラー
  [ERROR_TYPES.STORAGE]: {
    default: {
      message: 'ストレージに問題があります',
      description: 'データの保存領域でエラーが発生しました',
      solutions: [
        'ブラウザのキャッシュをクリアしてください',
        '不要なデータを削除してください',
        'デバイスの空き容量を確認してください',
      ],
      severity: 'warning',
    },
    quota_exceeded: {
      message: 'ストレージ容量が不足しています',
      description: 'データ保存領域の上限に達しました',
      solutions: [
        '古いワークアウトデータを削除してください',
        'ブラウザのキャッシュをクリアしてください',
        'デバイスの空き容量を増やしてください',
      ],
      severity: 'error',
    },
    file_too_large: {
      message: 'ファイルサイズが大きすぎます',
      description: 'アップロードファイルの容量制限を超えています',
      solutions: [
        'ファイルサイズを小さくしてください',
        '画像の場合は圧縮してください',
        '別の形式で保存してください',
      ],
      severity: 'warning',
    },
    unsupported_format: {
      message: 'サポートされていないファイル形式です',
      description: 'このファイル形式は使用できません',
      solutions: [
        'JPG、PNG、PDF形式を使用してください',
        'ファイル拡張子を確認してください',
        'ファイルを変換してください',
      ],
      severity: 'warning',
    },
  },

  // 権限エラー
  [ERROR_TYPES.PERMISSION]: {
    default: {
      message: 'この操作を実行する権限がありません',
      description: 'アクセス権限が不足しています',
      solutions: [
        'ログインしているか確認してください',
        '管理者に権限を確認してください',
        '別のアカウントでお試しください',
      ],
      severity: 'error',
    },
    access_denied: {
      message: 'アクセスが拒否されました',
      description: 'このリソースへのアクセス権限がありません',
      solutions: [
        'ログイン状態を確認してください',
        '適切な権限を持つアカウントでログインしてください',
        'サポートに権限の確認を依頼してください',
      ],
      severity: 'error',
    },
    insufficient_privileges: {
      message: '権限が不足しています',
      description: 'この操作に必要な権限がありません',
      solutions: [
        '管理者権限が必要な操作です',
        'アカウントの権限レベルを確認してください',
        '管理者に権限の付与を依頼してください',
      ],
      severity: 'error',
    },
  },

  // その他
  [ERROR_TYPES.QUOTA]: {
    default: {
      message: '利用制限に達しました',
      description: 'API使用量やリクエスト数の上限に達しました',
      solutions: [
        'しばらく時間をおいて再試行してください',
        '利用プランのアップグレードを検討してください',
        'サポートに制限の詳細を確認してください',
      ],
      severity: 'warning',
    },
  },

  [ERROR_TYPES.TIMEOUT]: {
    default: {
      message: '処理がタイムアウトしました',
      description: '操作に時間がかかりすぎています',
      solutions: [
        'しばらく時間をおいて再試行してください',
        'より安定したネットワーク環境で試してください',
        '処理するデータ量を減らしてください',
      ],
      severity: 'warning',
    },
  },

  [ERROR_TYPES.UNKNOWN]: {
    default: {
      message: '予期しないエラーが発生しました',
      description: '原因不明のエラーです',
      solutions: [
        'ページを再読み込みしてください',
        'アプリを再起動してください',
        '問題が続く場合はサポートにお問い合わせください',
      ],
      severity: 'error',
    },
  },
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

  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('NetworkError') ||
    errorCode === 'NETWORK_ERROR'
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // 接続エラー
  if (
    errorMessage.includes('connection') ||
    errorMessage.includes('Connection') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorCode === 'CONNECTION_ERROR' ||
    errorCode === 'ECONNREFUSED'
  ) {
    return ERROR_TYPES.CONNECTION;
  }

  // 同期エラー
  if (
    errorMessage.includes('sync') ||
    errorMessage.includes('synchronization') ||
    errorMessage.includes('queue') ||
    errorCode === 'SYNC_ERROR'
  ) {
    return ERROR_TYPES.SYNC;
  }

  // 認証エラー
  if (
    errorMessage.includes('Invalid login credentials') ||
    errorMessage.includes('Email not confirmed') ||
    errorMessage.includes('User not found') ||
    errorMessage.includes('Invalid email') ||
    errorMessage.includes('Signup is disabled') ||
    errorMessage.includes('User already registered') ||
    errorCode === 'invalid_credentials' ||
    errorCode === 'email_not_confirmed' ||
    errorCode === 'signup_disabled'
  ) {
    return ERROR_TYPES.AUTH;
  }

  // データベースエラー
  if (
    errorMessage.includes('duplicate key') ||
    errorMessage.includes('foreign key') ||
    errorMessage.includes('constraint') ||
    errorMessage.includes('PostgreSQL') ||
    errorMessage.includes('relationship') ||
    errorMessage.includes('schema cache') ||
    errorCode?.startsWith('23') ||
    errorCode === 'PGRST200'
  ) {
    return ERROR_TYPES.DATABASE;
  }

  // ストレージエラー
  if (
    errorMessage.includes('QuotaExceededError') ||
    errorMessage.includes('storage quota') ||
    errorMessage.includes('file too large') ||
    errorCode === 'QuotaExceededError'
  ) {
    return ERROR_TYPES.STORAGE;
  }

  // バリデーションエラー
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('required') ||
    errorMessage.includes('invalid format')
  ) {
    return ERROR_TYPES.VALIDATION;
  }

  // タイムアウトエラー
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('TimeoutError') ||
    errorCode === 'TIMEOUT'
  ) {
    return ERROR_TYPES.TIMEOUT;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * エラーメッセージを取得
 * @param {string} errorType - エラータイプ
 * @param {string} specificKey - 具体的なエラーキー
 * @returns {Object} エラーメッセージオブジェクト
 */
export function getErrorMessage(errorType, specificKey = 'default') {
  const typeMessages = ERROR_MESSAGES[errorType];
  if (!typeMessages) {
    return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN].default;
  }

  return typeMessages[specificKey] || typeMessages.default;
}

/**
 * ユーザーフレンドリーなエラー通知を表示
 * @param {Object} errorInfo - エラー情報オブジェクト
 * @param {Object} options - 表示オプション
 */
export function showUserFriendlyError(errorInfo, options = {}) {
  const {
    showSolutions = true,
    autoHide = true,
    position = 'top-right',
  } = options;

  const errorData = errorInfo.errorData || {};
  const {
    message,
    description,
    solutions = [],
    severity = 'error',
  } = errorData;

  // エラー通知のHTML作成
  const errorId = `error-${Date.now()}`;
  const solutionsHtml =
    showSolutions && solutions.length > 0
      ? `
        <div class="error-solutions mt-3">
            <p class="text-sm font-medium mb-2">解決方法:</p>
            <ul class="text-sm space-y-1">
                ${solutions
                  .map(
                    (solution) => `
                    <li class="flex items-start">
                        <i class="fas fa-lightbulb text-yellow-400 mr-2 mt-0.5 flex-shrink-0"></i>
                        <span>${solution}</span>
                    </li>
                `
                  )
                  .join('')}
            </ul>
        </div>
    `
      : '';

  const errorHtml = `
        <div id="${errorId}" class="error-notification ${severity} ${position}">
            <div class="error-content">
                <div class="error-header">
                    <div class="error-icon">
                        ${getErrorIcon(severity)}
                    </div>
                    <div class="error-text">
                        <h4 class="error-title">${message}</h4>
                        ${description ? `<p class="error-description">${description}</p>` : ''}
                    </div>
                    <button class="error-close" onclick="this.closest('.error-notification').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${solutionsHtml}
            </div>
        </div>
    `;

  // 既存のエラー通知を削除
  document.querySelectorAll('.error-notification').forEach((el) => el.remove());

  // 新しいエラー通知を追加
  document.body.insertAdjacentHTML('beforeend', errorHtml);

  // 自動非表示
  if (autoHide) {
    const hideDelay = severity === 'error' ? 10000 : 7000; // エラーは長めに表示
    setTimeout(() => {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
    }, hideDelay);
  }

  // アクセシビリティ対応
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'assertive');
    errorElement.focus();
  }
}

/**
 * エラーアイコンを取得
 * @param {string} severity - エラーの重要度
 * @returns {string} アイコンHTML
 */
function getErrorIcon(severity) {
  const icons = {
    error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
    warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
    info: '<i class="fas fa-info-circle text-blue-500"></i>',
    success: '<i class="fas fa-check-circle text-green-500"></i>',
  };
  return icons[severity] || icons.error;
}

// closeErrorNotification関数は削除 - インライン処理に変更

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
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503')
  ) {
    return 'server_error';
  }

  // データベースエラーの詳細判定
  if (
    errorMessage.includes('relationship') ||
    errorMessage.includes('schema cache') ||
    error?.code === 'PGRST200'
  ) {
    return 'relationship_error';
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
 * 統一されたエラーハンドラー（改善版）
 * @param {Error|string} error - エラーオブジェクトまたはメッセージ
 * @param {Object} options - オプション設定
 * @param {string} options.context - エラーが発生したコンテキスト
 * @param {boolean} options.showNotification - 通知を表示するか
 * @param {boolean} options.logToConsole - コンソールにログを出力するか
 * @param {Function} options.onRetry - リトライ関数
 * @param {number} options.maxRetries - 最大リトライ回数
 * @param {boolean} options.showSolutions - 解決方法を表示するか
 * @returns {Object} エラー情報オブジェクト
 */
export function handleError(error, options = {}) {
  const {
    context = 'Unknown',
    showNotification: shouldShowNotification = true,
    logToConsole = true,
    onRetry = null,
    maxRetries = 0,
    showSolutions = true,
  } = options;

  const errorType = determineErrorType(error);
  const specificKey = determineSpecificErrorKey(error);
  const errorData = getErrorMessage(errorType, specificKey);

  const errorInfo = {
    type: errorType,
    errorData,
    originalError: error,
    context,
    timestamp: new Date().toISOString(),
    canRetry: shouldAllowRetry(errorType),
    retryCount: 0,
    maxRetries,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // コンソールログ（開発者向け詳細情報）
  if (logToConsole) {
    const logLevel = errorData.severity === 'error' ? 'error' : 'warn';
    console[logLevel](`[${context}] ${errorType}:`, {
      message: errorData.message,
      description: errorData.description,
      solutions: errorData.solutions,
      originalError: error,
      errorInfo,
    });
  }

  // エラーログをローカルストレージに保存（デバッグ用）
  logErrorToStorage(errorInfo);

  // ユーザーフレンドリーな通知表示
  if (shouldShowNotification) {
    if (showSolutions) {
      showUserFriendlyError(errorInfo, {
        showSolutions: true,
        autoHide: errorData.severity !== 'error', // エラーは手動で閉じる
      });
    } else {
      // 従来の簡易通知
      const notificationType = getNotificationType(errorType);
      showNotification(errorData.message, notificationType);
    }
  }

  // リトライ機能
  if (errorInfo.canRetry && onRetry && maxRetries > 0) {
    errorInfo.retry = async () => {
      if (errorInfo.retryCount < maxRetries) {
        errorInfo.retryCount++;
        console.log(`🔄 リトライ中... (${errorInfo.retryCount}/${maxRetries})`);

        try {
          const result = await onRetry();
          console.log('✅ リトライ成功');
          showNotification('操作が正常に完了しました', 'success');
          return result;
        } catch (retryError) {
          console.warn(
            `❌ リトライ失敗 (${errorInfo.retryCount}/${maxRetries}):`,
            retryError
          );

          if (errorInfo.retryCount >= maxRetries) {
            const finalError = new Error(
              `最大リトライ回数(${maxRetries})に達しました`
            );
            return handleError(finalError, {
              context: `${context} (リトライ失敗)`,
              showNotification: true,
              showSolutions: true,
            });
          }

          throw retryError;
        }
      } else {
        throw new Error('最大リトライ回数に達しました');
      }
    };
  }

  // カスタムイベントを発火（他のコンポーネントが監視可能）
  window.dispatchEvent(
    new CustomEvent('applicationError', {
      detail: errorInfo,
    })
  );

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
    ERROR_TYPES.CONNECTION,
    ERROR_TYPES.DATABASE,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.SYNC,
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
    case ERROR_TYPES.CONNECTION:
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
    case ERROR_TYPES.SYNC:
      return 'info';
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
    if (onOnline) {
      onOnline();
    }
  };

  const handleOffline = () => {
    console.log('📴 オフライン状態になりました');
    showNotification('インターネット接続が切断されました', 'warning');
    if (onOffline) {
      onOffline();
    }
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
    context = 'Async operation',
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

      console.log(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
      );

      // 指数バックオフで待機
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  // 全てのリトライが失敗した場合
  throw handleError(lastError, {
    context: `${context} (${maxRetries + 1}回試行後)`,
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
      url: window.location.href,
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
