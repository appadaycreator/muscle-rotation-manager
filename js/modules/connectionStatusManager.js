// connectionStatusManager.js - 接続状態管理とUI表示

import { supabaseService } from '../services/supabaseService.js';

class ConnectionStatusManager {
  constructor() {
    this.statusIndicator = null;
    this.queueIndicator = null;
    this.initialize();
  }

  /**
   * 接続状態管理を初期化
   */
  initialize() {
    this.createStatusIndicator();
    this.createQueueIndicator();
    this.bindEvents();
    this.updateStatus();
  }

  /**
   * 接続状態インジケーターを作成
   */
  createStatusIndicator() {
    this.statusIndicator = document.createElement('div');
    this.statusIndicator.className = 'connection-status online';
    this.statusIndicator.textContent = '🟢 オンライン';
    document.body.appendChild(this.statusIndicator);
  }

  /**
   * オフラインキューインジケーターを作成
   */
  createQueueIndicator() {
    this.queueIndicator = document.createElement('div');
    this.queueIndicator.className = 'offline-queue-indicator hidden';
    this.queueIndicator.innerHTML =
      '📤 同期待ち: <span class="queue-count">0</span>件';
    this.queueIndicator.addEventListener('click', () =>
      this.showQueueDetails()
    );
    document.body.appendChild(this.queueIndicator);
  }

  /**
   * イベントリスナーを設定
   */
  bindEvents() {
    // 接続状態変更イベント
    window.addEventListener('connectionStatusChanged', (event) => {
      this.updateStatus(event.detail.isOnline);
    });

    // オンライン/オフラインイベント
    window.addEventListener('online', () => {
      console.log('🟢 ネットワーク接続が復旧しました');
      this.updateStatus(true);
    });

    window.addEventListener('offline', () => {
      console.log('🔴 ネットワーク接続が切断されました');
      this.updateStatus(false);
    });

    // 定期的にキュー状況を更新
    setInterval(() => {
      this.updateQueueIndicator();
    }, 5000);
  }

  /**
   * 接続状態を更新
   * @param {boolean} isOnline - オンライン状態
   */
  updateStatus(isOnline = null) {
    const currentStatus =
      isOnline !== null ? isOnline : supabaseService.getConnectionStatus();

    if (currentStatus) {
      this.statusIndicator.className = 'connection-status online';
      this.statusIndicator.textContent = '🟢 オンライン';
    } else {
      this.statusIndicator.className = 'connection-status offline';
      this.statusIndicator.textContent = '🔴 オフライン';
    }

    this.updateQueueIndicator();
  }

  /**
   * 同期中状態を表示
   */
  showSyncingStatus() {
    this.statusIndicator.className = 'connection-status syncing';
    this.statusIndicator.innerHTML =
      '🔄 同期中 <span class="sync-indicator">⟳</span>';
  }

  /**
   * キューインジケーターを更新
   */
  updateQueueIndicator() {
    const queueLength = supabaseService.offlineQueue
      ? supabaseService.offlineQueue.length
      : 0;

    if (queueLength > 0) {
      this.queueIndicator.classList.remove('hidden');
      this.queueIndicator.querySelector('.queue-count').textContent =
        queueLength;
    } else {
      this.queueIndicator.classList.add('hidden');
    }
  }

  /**
   * キューの詳細を表示
   */
  showQueueDetails() {
    const queueLength = supabaseService.offlineQueue
      ? supabaseService.offlineQueue.length
      : 0;

    if (queueLength === 0) {
      this.showCustomAlert('同期待ちのデータはありません。');
      return;
    }

    const queueItems = supabaseService.offlineQueue
      .map((item, index) => {
        const timestamp = new Date(item.timestamp).toLocaleString('ja-JP');
        return `${index + 1}. ${item.operation} ${item.table} (${timestamp})`;
      })
      .join('\n');

    const message = `同期待ちデータ (${queueLength}件):\n\n${queueItems}\n\nオンライン復帰時に自動同期されます。`;
    this.showCustomAlert(message);
  }

  /**
   * 手動同期を実行
   */
  async forcSync() {
    if (!supabaseService.getConnectionStatus()) {
      this.showCustomAlert('オフライン状態のため同期できません。');
      return;
    }

    this.showSyncingStatus();

    try {
      await supabaseService.syncOfflineData();
      this.updateStatus(true);
    } catch (error) {
      console.error('手動同期エラー:', error);
      this.showCustomAlert(
        '同期に失敗しました。しばらく後に再試行してください。'
      );
      this.updateStatus(false);
    }
  }

  /**
   * 接続テストを実行
   */
  async testConnection() {
    this.showSyncingStatus();

    const isConnected = await supabaseService.checkConnection();
    this.updateStatus(isConnected);

    const message = isConnected
      ? '✅ データベース接続は正常です。'
      : '❌ データベースに接続できません。';

    this.showCustomAlert(message);
  }

  /**
   * インジケーターを非表示
   */
  hide() {
    if (this.statusIndicator) {
      this.statusIndicator.style.display = 'none';
    }
    if (this.queueIndicator) {
      this.queueIndicator.style.display = 'none';
    }
  }

  /**
   * インジケーターを表示
   */
  show() {
    if (this.statusIndicator) {
      this.statusIndicator.style.display = 'block';
    }
    if (this.queueIndicator && supabaseService.offlineQueue.length > 0) {
      this.queueIndicator.style.display = 'block';
    }
  }

  /**
   * カスタムアラートダイアログを表示
   * @param {string} message - 表示するメッセージ
   */
  showCustomAlert(message) {
    // 既存のアラートダイアログがあれば削除
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // アラートダイアログを作成
    const alertDiv = document.createElement('div');
    alertDiv.className =
      'custom-alert fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    alertDiv.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">接続状態</h3>
                    <p class="text-gray-700 whitespace-pre-line">${message}</p>
                </div>
                <div class="flex justify-end">
                    <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        OK
                    </button>
                </div>
            </div>
        `;

    // クリックイベントを追加
    const okButton = alertDiv.querySelector('button');
    okButton.addEventListener('click', () => {
      alertDiv.remove();
    });

    // 背景クリックで閉じる
    alertDiv.addEventListener('click', (e) => {
      if (e.target === alertDiv) {
        alertDiv.remove();
      }
    });

    // ESCキーで閉じる
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        alertDiv.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(alertDiv);
  }

  /**
   * リソースをクリーンアップ
   */
  destroy() {
    if (this.statusIndicator) {
      this.statusIndicator.remove();
    }
    if (this.queueIndicator) {
      this.queueIndicator.remove();
    }
  }
}

// シングルトンインスタンスをエクスポート
export const connectionStatusManager = new ConnectionStatusManager();
