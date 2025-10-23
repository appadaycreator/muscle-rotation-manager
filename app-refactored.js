// app-refactored.js - リファクタリング後のメインアプリケーション

import { pageManager } from './js/modules/pageManager.js';
import { authManager } from './js/modules/authManager.js';
import { supabaseService } from './js/services/supabaseService.js';
import { showNotification } from './js/utils/helpers.js';

class MuscleRotationApp {
    constructor() {
        this.isInitialized = false;
        this.currentWorkout = null;
        this.workoutTimer = null;
        this.workoutStartTime = null;
        this.currentLanguage = 'ja';
        this.currentFontSize = 'base';
    }

    /**
     * アプリケーションを初期化
     */
    async initialize() {
        if (this.isInitialized) {return;}

        console.log('🏋️ MuscleRotationManager - Starting Application');

        try {
            // 基本コンポーネントを読み込み
            await this.loadBasicComponents();

            // 初期ページを読み込み
            await pageManager.navigateToPage('dashboard');

            // ナビゲーションを初期化
            pageManager.initializeNavigation();

            // 認証を初期化
            await authManager.initialize();

            // モバイルメニューを初期化
            this.initializeMobileMenu();

            // オフライン同期機能を初期化
            this.initializeOfflineSync();

            this.isInitialized = true;
            console.log('✅ App initialization complete');
            console.log('Current user:', authManager.getCurrentUser());

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            showNotification('アプリケーションの初期化に失敗しました', 'error');
        }
    }

    /**
     * 基本コンポーネントを読み込み
     * パフォーマンス最適化: 並列読み込みとエラーハンドリング
     */
    async loadBasicComponents() {
        try {
            const [headerResult, sidebarResult] = await Promise.allSettled([
                pageManager.loadHeader(),
                pageManager.loadSidebar()
            ]);

            // 個別のエラーハンドリング
            if (headerResult.status === 'rejected') {
                console.warn('Header loading failed:', headerResult.reason);
            }
            if (sidebarResult.status === 'rejected') {
                console.warn('Sidebar loading failed:', sidebarResult.reason);
            }

            // 最低限のコンポーネントが読み込まれていることを確認
            if (headerResult.status === 'rejected' && sidebarResult.status === 'rejected') {
                throw new Error('Critical components failed to load');
            }
        } catch (error) {
            console.error('Failed to load basic components:', error);
            throw error;
        }
    }

    /**
     * モバイルメニューを初期化
     */
    initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileSidebarClose = document.getElementById('mobile-sidebar-close');

        if (mobileMenuBtn && mobileSidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileSidebar.classList.add('open');
            });
        }

        if (mobileSidebarClose && mobileSidebar) {
            mobileSidebarClose.addEventListener('click', () => {
                mobileSidebar.classList.remove('open');
            });
        }

        // モバイルサイドバー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (mobileSidebar &&
                !mobileSidebar.contains(e.target) &&
                !mobileMenuBtn?.contains(e.target)) {
                mobileSidebar.classList.remove('open');
            }
        });
    }

    /**
     * ワークアウトを開始
     * @param {string} muscleGroup - 筋肉部位
     */
    startWorkout(muscleGroup) {
        console.log(`Starting workout for: ${muscleGroup}`);

        // 現在のワークアウトセクションを表示
        const currentWorkoutElement = document.getElementById('current-workout');
        if (currentWorkoutElement) {
            currentWorkoutElement.classList.remove('hidden');
        }

        // タイマーを開始
        this.startWorkoutTimer();

        // 現在のワークアウトを設定
        this.currentWorkout = {
            muscleGroup,
            startTime: new Date(),
            exercises: []
        };

        showNotification(`${muscleGroup}のワークアウトを開始しました`, 'success');
    }

    /**
     * ワークアウトを停止
     */
    stopWorkout() {
        console.log('Stopping workout');

        // タイマーを停止
        this.stopWorkoutTimer();

        // 現在のワークアウトセクションを非表示
        const currentWorkoutElement = document.getElementById('current-workout');
        if (currentWorkoutElement) {
            currentWorkoutElement.classList.add('hidden');
        }

        // ワークアウトデータを保存
        if (this.currentWorkout) {
            this.saveWorkoutData();
        }

        // 現在のワークアウトをリセット
        this.currentWorkout = null;
        showNotification('ワークアウトを終了しました', 'success');
    }

    /**
     * ワークアウトタイマーを開始
     */
    startWorkoutTimer() {
        this.workoutStartTime = new Date();
        this.workoutTimer = setInterval(() => this.updateWorkoutTimer(), 1000);
    }

    /**
     * ワークアウトタイマーを停止
     */
    stopWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
    }

    /**
     * ワークアウトタイマー表示を更新
     */
    updateWorkoutTimer() {
        if (!this.workoutStartTime) {return;}

        const now = new Date();
        const diff = now - this.workoutStartTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        const timerDisplay = document.getElementById('workout-timer');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * ワークアウトデータを保存
     */
    async saveWorkoutData() {
        if (!this.currentWorkout) {
            console.warn('保存するワークアウトデータがありません');
            return;
        }

        try {
            console.log('ワークアウトデータ保存開始:', this.currentWorkout);

            // ワークアウトデータを整形
            const workoutData = this.formatWorkoutData(this.currentWorkout);

            // オンライン/オフライン判定
            const isOnline = (typeof navigator !== 'undefined' && navigator.onLine) &&
                supabaseService.isAvailable() && supabaseService.getCurrentUser();

            if (isOnline) {
                // オンライン: Supabaseに保存
                await this.saveToSupabase(workoutData);
                console.log('✅ Supabaseへの保存が完了しました');
            } else {
                // オフライン: ローカルストレージに保存
                await this.saveToLocalStorage(workoutData);
                console.log('✅ ローカルストレージへの保存が完了しました');
            }

            showNotification('ワークアウトデータを保存しました', 'success');

            // 保存後の処理
            this.onWorkoutSaved(workoutData);

        } catch (error) {
            console.error('❌ ワークアウトデータ保存エラー:', error);

            // フォールバック: ローカルストレージに保存を試行
            try {
                const workoutData = this.formatWorkoutData(this.currentWorkout);
                await this.saveToLocalStorage(workoutData);
                showNotification('オフラインでワークアウトデータを保存しました', 'warning');
            } catch (fallbackError) {
                console.error('❌ フォールバック保存も失敗:', fallbackError);
                showNotification('ワークアウトデータの保存に失敗しました', 'error');
                throw fallbackError;
            }
        }
    }

    /**
     * ワークアウトデータをSupabase形式に整形
     * @param {Object} currentWorkout - 現在のワークアウトデータ
     * @returns {Object} 整形されたワークアウトデータ
     */
    formatWorkoutData(currentWorkout) {
        const now = new Date();
        const startTime = currentWorkout.startTime || now;
        const endTime = currentWorkout.endTime || now;
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

        return {
            id: currentWorkout.id || `workout_${Date.now()}`,
            session_name: currentWorkout.name || `ワークアウト ${new Date().toLocaleDateString('ja-JP')}`,
            workout_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            total_duration_minutes: Math.max(1, durationMinutes), // 最低1分
            muscle_groups_trained: currentWorkout.muscleGroups || [],
            session_type: 'strength',
            is_completed: true,
            exercises: currentWorkout.exercises || [],
            notes: currentWorkout.notes || '',
            created_at: now.toISOString(),
            // ローカル保存用の追加フィールド
            _offline: !(typeof navigator !== 'undefined' && navigator.onLine),
            _sync_status: 'pending'
        };
    }

    /**
     * Supabaseにワークアウトデータを保存
     * @param {Object} workoutData - 保存するワークアウトデータ
     */
    async saveToSupabase(workoutData) {
        if (!supabaseService.isAvailable()) {
            throw new Error('Supabaseが利用できません');
        }

        const currentUser = supabaseService.getCurrentUser();
        if (!currentUser) {
            throw new Error('ユーザーがログインしていません');
        }

        // workout_sessionsテーブル用のデータを準備
        const sessionData = {
            session_name: workoutData.session_name,
            workout_date: workoutData.workout_date,
            start_time: workoutData.start_time,
            end_time: workoutData.end_time,
            total_duration_minutes: workoutData.total_duration_minutes,
            muscle_groups_trained: workoutData.muscle_groups_trained,
            session_type: workoutData.session_type,
            is_completed: workoutData.is_completed,
            notes: workoutData.notes
        };

        // ワークアウトセッションを保存
        const savedSession = await supabaseService.saveWorkout(sessionData);
        console.log('ワークアウトセッション保存結果:', savedSession);

        // セッションIDを取得
        const sessionId = savedSession[0]?.id;
        if (!sessionId) {
            throw new Error('ワークアウトセッションIDの取得に失敗しました');
        }

        // トレーニングログがある場合は保存
        if (workoutData.exercises && workoutData.exercises.length > 0) {
            const trainingLogs = workoutData.exercises.map(exercise => ({
                workout_session_id: sessionId,
                muscle_group_id: exercise.muscle_group_id,
                exercise_id: exercise.exercise_id,
                exercise_name: exercise.name,
                sets: exercise.sets?.length || 1,
                reps: exercise.sets?.map(set => set.reps) || [],
                weights: exercise.sets?.map(set => set.weight) || [],
                rest_seconds: exercise.sets?.map(set => set.rest_seconds) || [],
                duration_minutes: exercise.duration_minutes,
                notes: exercise.notes
            }));

            const savedLogs = await supabaseService.saveTrainingLogs(trainingLogs);
            console.log('トレーニングログ保存結果:', savedLogs);
            return { session: savedSession, logs: savedLogs };
        }

        // ローカルストレージからオフラインデータを削除（同期完了）
        this.removeFromOfflineQueue(workoutData.id);

        return { session: savedSession };
    }

    /**
     * ローカルストレージにワークアウトデータを保存
     * @param {Object} workoutData - 保存するワークアウトデータ
     */
    async saveToLocalStorage(workoutData) {
        try {
            // 既存の履歴を取得
            const existingHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');

            // 重複チェック
            const existingIndex = existingHistory.findIndex(w => w.id === workoutData.id);

            if (existingIndex >= 0) {
                // 既存データを更新
                existingHistory[existingIndex] = workoutData;
                console.log('既存のワークアウトデータを更新しました');
            } else {
                // 新規データを先頭に追加
                existingHistory.unshift(workoutData);
                console.log('新規ワークアウトデータを追加しました');
            }

            // 履歴の上限を50件に制限
            const limitedHistory = existingHistory.slice(0, 50);

            // ローカルストレージに保存
            localStorage.setItem('workoutHistory', JSON.stringify(limitedHistory));

            // オフライン同期キューに追加
            this.addToOfflineQueue(workoutData);

            console.log(`ローカルストレージに保存完了 (${limitedHistory.length}件)`);

        } catch (error) {
            console.error('ローカルストレージ保存エラー:', error);
            throw new Error(`ローカルストレージへの保存に失敗しました: ${error.message}`);
        }
    }

    /**
     * オフライン同期キューにデータを追加
     * @param {Object} workoutData - 同期待ちワークアウトデータ
     */
    addToOfflineQueue(workoutData) {
        try {
            const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');

            // 重複チェック
            const existingIndex = offlineQueue.findIndex(item => item.id === workoutData.id);

            const queueItem = {
                id: workoutData.id,
                data: workoutData,
                timestamp: new Date().toISOString(),
                retryCount: 0,
                status: 'pending'
            };

            if (existingIndex >= 0) {
                offlineQueue[existingIndex] = queueItem;
            } else {
                offlineQueue.push(queueItem);
            }

            localStorage.setItem('offlineWorkoutQueue', JSON.stringify(offlineQueue));
            console.log('オフライン同期キューに追加:', workoutData.id);

        } catch (error) {
            console.error('オフライン同期キュー追加エラー:', error);
        }
    }

    /**
     * オフライン同期キューからデータを削除
     * @param {string} workoutId - 削除するワークアウトID
     */
    removeFromOfflineQueue(workoutId) {
        try {
            const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
            const filteredQueue = offlineQueue.filter(item => item.id !== workoutId);
            localStorage.setItem('offlineWorkoutQueue', JSON.stringify(filteredQueue));
            console.log('オフライン同期キューから削除:', workoutId);
        } catch (error) {
            console.error('オフライン同期キュー削除エラー:', error);
        }
    }

    /**
     * ワークアウト保存後の処理
     * @param {Object} workoutData - 保存されたワークアウトデータ
     */
    onWorkoutSaved(workoutData) {
        // イベントを発火してUIを更新
        const event = new CustomEvent('workoutSaved', {
            detail: { workoutData }
        });
        document.dispatchEvent(event);

        // 統計情報を更新
        this.updateWorkoutStats(workoutData);

        console.log('ワークアウト保存完了イベントを発火しました');
    }

    /**
     * ワークアウト統計情報を更新
     * @param {Object} workoutData - 保存されたワークアウトデータ
     */
    updateWorkoutStats(workoutData) {
        try {
            const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');

            // 基本統計を更新
            stats.totalWorkouts = (stats.totalWorkouts || 0) + 1;
            stats.totalMinutes = (stats.totalMinutes || 0) + workoutData.total_duration_minutes;
            stats.lastWorkoutDate = workoutData.workout_date;

            // 筋肉部位別統計を更新
            if (!stats.muscleGroupStats) {
                stats.muscleGroupStats = {};
            }

            workoutData.muscle_groups_trained.forEach(muscleGroup => {
                const currentCount = stats.muscleGroupStats[muscleGroup] || 0;
                stats.muscleGroupStats[muscleGroup] = currentCount + 1;
            });

            localStorage.setItem('workoutStats', JSON.stringify(stats));
            console.log('ワークアウト統計情報を更新しました:', stats);

        } catch (error) {
            console.error('統計情報更新エラー:', error);
        }
    }

    /**
     * オフライン同期機能を初期化
     */
    initializeOfflineSync() {
        // オンライン/オフライン状態の監視
        window.addEventListener('online', () => {
            console.log('🌐 オンラインに復帰しました');
            showNotification('オンラインに復帰しました', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            console.log('📱 オフラインになりました');
            showNotification('オフラインモードになりました', 'info');
        });

        // 初期化時にオフラインデータがあれば同期を試行
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            setTimeout(() => this.syncOfflineData(), 2000); // 2秒後に実行
        }

        console.log('✅ オフライン同期機能を初期化しました');
    }

    /**
     * オフラインデータをSupabaseに同期
     */
    async syncOfflineData() {
        if (!(typeof navigator !== 'undefined' && navigator.onLine) ||
            !supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            console.log('同期条件が満たされていません');
            return;
        }

        try {
            const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');

            if (offlineQueue.length === 0) {
                console.log('同期するオフラインデータはありません');
                return;
            }

            console.log(`🔄 ${offlineQueue.length}件のオフラインデータを同期中...`);

            let syncedCount = 0;
            let failedCount = 0;

            for (const queueItem of offlineQueue) {
                try {
                    if (queueItem.status === 'synced') {
                        continue; // 既に同期済み
                    }

                    // Supabaseに保存を試行
                    await this.saveToSupabase(queueItem.data);

                    // 成功した場合、キューから削除
                    this.removeFromOfflineQueue(queueItem.id);
                    syncedCount++;

                    console.log(`✅ 同期完了: ${queueItem.id}`);

                } catch (error) {
                    console.error(`❌ 同期失敗: ${queueItem.id}`, error);
                    failedCount++;

                    // リトライ回数を増加
                    queueItem.retryCount = (queueItem.retryCount || 0) + 1;
                    queueItem.lastError = error.message;

                    // 最大リトライ回数を超えた場合はスキップ
                    if (queueItem.retryCount >= 3) {
                        console.warn(`⚠️ 最大リトライ回数を超えました: ${queueItem.id}`);
                        queueItem.status = 'failed';
                    }
                }
            }

            // 更新されたキューを保存
            const updatedQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
            localStorage.setItem('offlineWorkoutQueue', JSON.stringify(updatedQueue));

            // 結果を通知
            if (syncedCount > 0) {
                showNotification(`${syncedCount}件のワークアウトデータを同期しました`, 'success');
            }

            if (failedCount > 0) {
                showNotification(`${failedCount}件の同期に失敗しました`, 'warning');
            }

            console.log(`🔄 同期完了: 成功 ${syncedCount}件, 失敗 ${failedCount}件`);

        } catch (error) {
            console.error('❌ オフライン同期エラー:', error);
            showNotification('オフラインデータの同期に失敗しました', 'error');
        }
    }

    /**
     * オフライン同期キューの状態を取得
     * @returns {Object} 同期キューの状態
     */
    getOfflineSyncStatus() {
        try {
            const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
            const pendingCount = offlineQueue.filter(item => item.status === 'pending').length;
            const failedCount = offlineQueue.filter(item => item.status === 'failed').length;

            return {
                total: offlineQueue.length,
                pending: pendingCount,
                failed: failedCount,
                synced: offlineQueue.length - pendingCount - failedCount
            };
        } catch (error) {
            console.error('同期状態取得エラー:', error);
            return { total: 0, pending: 0, failed: 0, synced: 0 };
        }
    }

    /**
     * 現在のワークアウトを取得
     * @returns {Object|null} 現在のワークアウト
     */
    getCurrentWorkout() {
        return this.currentWorkout;
    }

    /**
     * アプリケーションが初期化済みかチェック
     * @returns {boolean} 初期化済みかどうか
     */
    isReady() {
        return this.isInitialized;
    }
}

// グローバルアプリインスタンス
const app = new MuscleRotationApp();

// DOM読み込み完了時にアプリを初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app...');
    await app.initialize();
});

// グローバルスコープにエクスポート（既存のコードとの互換性のため）
window.MuscleRotationApp = app;
window.startWorkout = (muscleGroup) => app.startWorkout(muscleGroup);
window.stopWorkout = () => app.stopWorkout();

export default app;
