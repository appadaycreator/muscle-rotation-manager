// offlineManager.js - オフライン対応データ管理

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.dbName = 'MuscleRotationDB';
    this.dbVersion = 1;
    this.db = null;
    this.syncInProgress = false;
    this.initializeIndexedDB();
    this.setupEventListeners();
  }

  /**
   * IndexedDBを初期化
   */
  async initializeIndexedDB() {
    try {
      this.db = await this.openDatabase();
      console.log('✅ IndexedDB initialized');

      // 既存の同期キューを復元
      await this.restoreSyncQueue();
    } catch (error) {
      console.error('❌ IndexedDB initialization failed:', error);
      // フォールバックとしてLocalStorageを使用
      this.useLocalStorageFallback = true;
    }
  }

  /**
   * データベースを開く
   * @returns {Promise<IDBDatabase>}
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // ワークアウトセッションストア
        if (!db.objectStoreNames.contains('workoutSessions')) {
          const workoutStore = db.createObjectStore('workoutSessions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          workoutStore.createIndex('date', 'workout_date', { unique: false });
          workoutStore.createIndex('userId', 'user_id', { unique: false });
          workoutStore.createIndex('syncStatus', 'sync_status', {
            unique: false,
          });
        }

        // トレーニングログストア
        if (!db.objectStoreNames.contains('trainingLogs')) {
          const logsStore = db.createObjectStore('trainingLogs', {
            keyPath: 'id',
            autoIncrement: true,
          });
          logsStore.createIndex('sessionId', 'workout_session_id', {
            unique: false,
          });
          logsStore.createIndex('date', 'workout_date', { unique: false });
          logsStore.createIndex('syncStatus', 'sync_status', { unique: false });
        }

        // 同期キューストア
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          syncStore.createIndex('priority', 'priority', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 設定ストア
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('📊 IndexedDB schema created');
      };
    });
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // オンライン/オフライン状態の監視
    window.addEventListener('online', () => {
      console.log('🌐 オンラインになりました');
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      console.log('📴 オフラインになりました');
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // ページアンロード時の処理
    window.addEventListener('beforeunload', () => {
      this.persistSyncQueue();
    });

    // Visibility API でタブの状態を監視
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  /**
   * オンライン状態変更の処理
   * @param {boolean} isOnline - オンライン状態
   */
  async handleOnlineStatusChange(isOnline) {
    if (isOnline) {
      // オンライン復帰時の処理
      document.body.classList.remove('offline-mode');

      // 同期キューを処理
      await this.processSyncQueue();

      // UI更新イベントを発火
      window.dispatchEvent(new CustomEvent('connectionRestored'));
    } else {
      // オフライン時の処理
      document.body.classList.add('offline-mode');

      // UI更新イベントを発火
      window.dispatchEvent(new CustomEvent('connectionLost'));
    }
  }

  /**
   * ワークアウトセッションを保存（オフライン対応）
   * @param {Object} sessionData - セッションデータ
   * @returns {Promise<Object>} 保存結果
   */
  async saveWorkoutSession(sessionData) {
    const session = {
      ...sessionData,
      id:
        sessionData.id ||
        `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sync_status: this.isOnline ? 'synced' : 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (this.db) {
        // IndexedDBに保存
        await this.saveToIndexedDB('workoutSessions', session);
      } else {
        // LocalStorageフォールバック
        await this.saveToLocalStorage('workoutSessions', session);
      }

      // オフライン時は同期キューに追加
      if (!this.isOnline) {
        await this.addToSyncQueue({
          type: 'CREATE_WORKOUT_SESSION',
          data: session,
          priority: 1,
        });
      }

      console.log(
        `💾 ワークアウトセッション保存: ${session.id} (${session.sync_status})`
      );
      return session;
    } catch (error) {
      console.error('❌ ワークアウトセッション保存失敗:', error);
      throw error;
    }
  }

  /**
   * トレーニングログを保存（オフライン対応）
   * @param {Array} logs - ログ配列
   * @returns {Promise<Array>} 保存結果
   */
  async saveTrainingLogs(logs) {
    const processedLogs = logs.map((log) => ({
      ...log,
      id:
        log.id ||
        `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sync_status: this.isOnline ? 'synced' : 'pending',
      created_at: new Date().toISOString(),
    }));

    try {
      if (this.db) {
        // IndexedDBに一括保存
        await Promise.all(
          processedLogs.map((log) => this.saveToIndexedDB('trainingLogs', log))
        );
      } else {
        // LocalStorageフォールバック
        await Promise.all(
          processedLogs.map((log) =>
            this.saveToLocalStorage('trainingLogs', log)
          )
        );
      }

      // オフライン時は同期キューに追加
      if (!this.isOnline) {
        await this.addToSyncQueue({
          type: 'CREATE_TRAINING_LOGS',
          data: processedLogs,
          priority: 2,
        });
      }

      console.log(
        `💾 トレーニングログ保存: ${processedLogs.length}件 (${processedLogs[0]?.sync_status})`
      );
      return processedLogs;
    } catch (error) {
      console.error('❌ トレーニングログ保存失敗:', error);
      throw error;
    }
  }

  /**
   * ワークアウトセッションを取得
   * @param {Object} options - 取得オプション
   * @returns {Promise<Array>} セッション配列
   */
  async getWorkoutSessions(options = {}) {
    const { limit = 20, offset = 0, userId = null } = options;

    try {
      if (this.db) {
        return await this.getFromIndexedDB('workoutSessions', {
          limit,
          offset,
          userId,
        });
      } else {
        return await this.getFromLocalStorage('workoutSessions', {
          limit,
          offset,
          userId,
        });
      }
    } catch (error) {
      console.error('❌ ワークアウトセッション取得失敗:', error);
      return [];
    }
  }

  /**
   * IndexedDBにデータを保存
   * @param {string} storeName - ストア名
   * @param {Object} data - データ
   * @returns {Promise<void>}
   */
  saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * IndexedDBからデータを取得
   * @param {string} storeName - ストア名
   * @param {Object} options - オプション
   * @returns {Promise<Array>}
   */
  getFromIndexedDB(storeName, options = {}) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];

        // フィルタリング
        if (options.userId) {
          results = results.filter((item) => item.user_id === options.userId);
        }

        // ソート（日付降順）
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // ページネーション
        const { limit = 20, offset = 0 } = options;
        results = results.slice(offset, offset + limit);

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * LocalStorageにデータを保存（フォールバック）
   * @param {string} storeName - ストア名
   * @param {Object} data - データ
   * @returns {Promise<void>}
   */
  async saveToLocalStorage(storeName, data) {
    try {
      const key = `offline_${storeName}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');

      // 既存データの更新または新規追加
      const index = existing.findIndex((item) => item.id === data.id);
      if (index >= 0) {
        existing[index] = data;
      } else {
        existing.push(data);
      }

      // 最新1000件のみ保持
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }

      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('LocalStorage保存エラー:', error);
      throw error;
    }
  }

  /**
   * LocalStorageからデータを取得（フォールバック）
   * @param {string} storeName - ストア名
   * @param {Object} options - オプション
   * @returns {Promise<Array>}
   */
  async getFromLocalStorage(storeName, options = {}) {
    try {
      const key = `offline_${storeName}`;
      let results = JSON.parse(localStorage.getItem(key) || '[]');

      // フィルタリング
      if (options.userId) {
        results = results.filter((item) => item.user_id === options.userId);
      }

      // ソート
      results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // ページネーション
      const { limit = 20, offset = 0 } = options;
      return results.slice(offset, offset + limit);
    } catch (error) {
      console.error('LocalStorage取得エラー:', error);
      return [];
    }
  }

  /**
   * 同期キューにアイテムを追加
   * @param {Object} item - 同期アイテム
   * @returns {Promise<void>}
   */
  async addToSyncQueue(item) {
    const queueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.syncQueue.push(queueItem);

    // IndexedDBにも保存
    if (this.db) {
      try {
        await this.saveToIndexedDB('syncQueue', queueItem);
      } catch (error) {
        console.warn('同期キューの永続化に失敗:', error);
      }
    }

    console.log(`📤 同期キューに追加: ${item.type}`);
  }

  /**
   * 同期キューを処理
   * @returns {Promise<void>}
   */
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`📤 同期開始: ${this.syncQueue.length}件`);

    // 優先度順にソート
    this.syncQueue.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    const results = {
      success: 0,
      failed: 0,
      total: this.syncQueue.length,
    };

    // 同期処理を並列実行（最大3件）
    const concurrency = 3;
    for (let i = 0; i < this.syncQueue.length; i += concurrency) {
      const batch = this.syncQueue.slice(i, i + concurrency);

      const batchPromises = batch.map(async (item) => {
        try {
          await this.syncItem(item);
          results.success++;

          // 成功したアイテムをキューから削除
          const queueIndex = this.syncQueue.findIndex((q) => q.id === item.id);
          if (queueIndex >= 0) {
            this.syncQueue.splice(queueIndex, 1);
          }

          // IndexedDBからも削除
          if (this.db) {
            await this.deleteFromIndexedDB('syncQueue', item.id);
          }
        } catch (error) {
          results.failed++;
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = error.message;

          console.error(`❌ 同期失敗: ${item.type}`, error);

          // 最大リトライ回数に達した場合は削除
          if (item.retryCount >= item.maxRetries) {
            const queueIndex = this.syncQueue.findIndex(
              (q) => q.id === item.id
            );
            if (queueIndex >= 0) {
              this.syncQueue.splice(queueIndex, 1);
            }
            console.warn(
              `⚠️ 同期諦め: ${item.type} (${item.retryCount}回試行)`
            );
          }
        }
      });

      await Promise.allSettled(batchPromises);
    }

    this.syncInProgress = false;

    // 同期結果を通知
    if (results.success > 0) {
      window.dispatchEvent(
        new CustomEvent('syncCompleted', {
          detail: { success: results.success, failed: results.failed },
        })
      );
    }

    console.log(
      `✅ 同期完了: 成功 ${results.success}件, 失敗 ${results.failed}件`
    );
  }

  /**
   * 個別アイテムを同期
   * @param {Object} item - 同期アイテム
   * @returns {Promise<void>}
   */
  async syncItem(item) {
    switch (item.type) {
      case 'CREATE_WORKOUT_SESSION':
        await this.syncWorkoutSession(item.data);
        break;
      case 'CREATE_TRAINING_LOGS':
        await this.syncTrainingLogs(item.data);
        break;
      case 'UPDATE_SETTINGS':
        await this.syncSettings(item.data);
        break;
      default:
        throw new Error(`未対応の同期タイプ: ${item.type}`);
    }
  }

  /**
   * ワークアウトセッションを同期
   * @param {Object} sessionData - セッションデータ
   * @returns {Promise<void>}
   */
  async syncWorkoutSession(sessionData) {
    // 実際のSupabaseサービスを使用して同期
    if (window.supabaseService && window.supabaseService.saveWorkout) {
      const result = await window.supabaseService.saveWorkout(sessionData);

      // ローカルデータの同期状態を更新
      sessionData.sync_status = 'synced';
      sessionData.server_id = result.id;

      if (this.db) {
        await this.saveToIndexedDB('workoutSessions', sessionData);
      }
    }
  }

  /**
   * トレーニングログを同期
   * @param {Array} logs - ログ配列
   * @returns {Promise<void>}
   */
  async syncTrainingLogs(logs) {
    if (window.supabaseService && window.supabaseService.saveTrainingLogs) {
      const result = await window.supabaseService.saveTrainingLogs(logs);

      // ローカルデータの同期状態を更新
      logs.forEach((log, index) => {
        log.sync_status = 'synced';
        log.server_id = result[index]?.id;
      });

      if (this.db) {
        await Promise.all(
          logs.map((log) => this.saveToIndexedDB('trainingLogs', log))
        );
      }
    }
  }

  /**
   * 設定を同期
   * @param {Object} settings - 設定データ
   * @returns {Promise<void>}
   */
  async syncSettings(settings) {
    if (window.supabaseService && window.supabaseService.saveUserProfile) {
      await window.supabaseService.saveUserProfile(settings);
    }
  }

  /**
   * 同期キューを復元
   * @returns {Promise<void>}
   */
  async restoreSyncQueue() {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        console.log(`📥 同期キュー復元: ${this.syncQueue.length}件`);
      };
    } catch (error) {
      console.warn('同期キュー復元に失敗:', error);
    }
  }

  /**
   * 同期キューを永続化
   */
  persistSyncQueue() {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.warn('同期キュー永続化に失敗:', error);
    }
  }

  /**
   * IndexedDBからデータを削除
   * @param {string} storeName - ストア名
   * @param {string} id - ID
   * @returns {Promise<void>}
   */
  deleteFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * オフライン状態を取得
   * @returns {boolean} オフライン状態
   */
  isOffline() {
    return !this.isOnline;
  }

  /**
   * 同期待ちアイテム数を取得
   * @returns {number} 同期待ちアイテム数
   */
  getPendingSyncCount() {
    return this.syncQueue.length;
  }

  /**
   * 統計情報を取得
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      isOnline: this.isOnline,
      pendingSyncItems: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      useLocalStorageFallback: this.useLocalStorageFallback,
      dbInitialized: !!this.db,
    };
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.persistSyncQueue();
    if (this.db) {
      this.db.close();
    }
  }
}

// シングルトンインスタンスをエクスポート
export const offlineManager = new OfflineManager();
