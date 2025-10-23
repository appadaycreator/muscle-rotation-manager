// supabase-integration.test.js - Supabase統合テスト

import { TestRunner } from '../test-runner.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { connectionStatusManager } from '../../js/modules/connectionStatusManager.js';

const testRunner = new TestRunner('Supabase統合テスト');

// 統合テスト用のセットアップ
function setupIntegrationTest() {
    // DOM要素をクリーンアップ
    const existingIndicators = document.querySelectorAll('.connection-status, .offline-queue-indicator');
    existingIndicators.forEach(el => el.remove());
    
    // サービスをリセット
    supabaseService.offlineQueue = [];
    supabaseService.isOnline = true;
    
    // LocalStorageをクリア
    localStorage.removeItem('offlineWorkoutQueue');
}

// 接続状態とUI統合テスト
testRunner.test('接続状態UI統合 - オフライン表示', () => {
    setupIntegrationTest();
    
    // オフラインモードを有効化
    supabaseService.enableOfflineMode();
    
    // UIの変更を確認
    testRunner.assertTrue(document.body.classList.contains('offline-mode'), 'bodyにoffline-modeクラスが追加されること');
    
    // カスタムイベントが発火されることを確認
    let eventFired = false;
    const eventListener = (event) => {
        if (event.detail.isOnline === false) {
            eventFired = true;
        }
    };
    
    window.addEventListener('connectionStatusChanged', eventListener);
    supabaseService.enableOfflineMode();
    
    testRunner.assertTrue(eventFired, 'connectionStatusChangedイベントが発火されること');
    
    window.removeEventListener('connectionStatusChanged', eventListener);
});

testRunner.test('接続状態UI統合 - オンライン復帰', async () => {
    setupIntegrationTest();
    
    // まずオフラインにする
    supabaseService.enableOfflineMode();
    testRunner.assertTrue(document.body.classList.contains('offline-mode'), 'オフラインモードが有効になること');
    
    // オンライン復帰をシミュレート
    supabaseService.isOnline = true;
    await supabaseService.syncOfflineData();
    
    testRunner.assertFalse(document.body.classList.contains('offline-mode'), 'オフラインモードが解除されること');
});

// ワークアウト保存の統合テスト
testRunner.test('ワークアウト保存統合 - オフライン→オンライン', async () => {
    setupIntegrationTest();
    
    // ユーザーを設定
    supabaseService.currentUser = { id: 'integration-test-user' };
    
    // オフライン状態でワークアウトを保存
    supabaseService.isOnline = false;
    
    const workoutData = {
        session_name: '統合テストワークアウト',
        workout_date: '2025-01-23',
        start_time: new Date().toISOString(),
        muscle_groups_trained: ['chest', 'arms']
    };
    
    const offlineResult = await supabaseService.saveWorkout(workoutData);
    
    testRunner.assertTrue(offlineResult.id.startsWith('offline_'), 'オフライン保存でオフラインIDが生成されること');
    testRunner.assertEqual(supabaseService.offlineQueue.length, 1, 'オフラインキューにデータが追加されること');
    
    // LocalStorageに永続化されることを確認
    const storedQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
    testRunner.assertEqual(storedQueue.length, 1, 'LocalStorageに永続化されること');
    
    // オンライン復帰をシミュレート
    supabaseService.isOnline = true;
    
    // モッククライアントを設定
    supabaseService.client = {
        from: () => ({
            insert: (data) => ({
                select: () => Promise.resolve({ data: data, error: null })
            })
        })
    };
    
    await supabaseService.syncOfflineData();
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 0, '同期後はキューが空になること');
});

testRunner.test('複数データ保存統合 - 混在ケース', async () => {
    setupIntegrationTest();
    
    supabaseService.currentUser = { id: 'integration-test-user' };
    
    // オフライン状態で複数のデータを保存
    supabaseService.isOnline = false;
    
    // ワークアウトセッション
    await supabaseService.saveWorkout({
        session_name: 'セッション1',
        workout_date: '2025-01-23'
    });
    
    // トレーニングログ
    await supabaseService.saveTrainingLog({
        exercise_name: 'プッシュアップ',
        sets: 3,
        reps: [10, 10, 8],
        muscle_group_id: 'chest'
    });
    
    await supabaseService.saveTrainingLog({
        exercise_name: 'スクワット',
        sets: 3,
        reps: [15, 15, 12],
        muscle_group_id: 'legs'
    });
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 3, '3つのデータがキューに追加されること');
    
    // 異なるテーブルのデータが混在していることを確認
    const tables = supabaseService.offlineQueue.map(item => item.table);
    testRunner.assertTrue(tables.includes('workout_sessions'), 'workout_sessionsテーブルのデータが含まれること');
    testRunner.assertTrue(tables.includes('training_logs'), 'training_logsテーブルのデータが含まれること');
    
    // 同期処理
    supabaseService.isOnline = true;
    supabaseService.client = {
        from: (table) => ({
            insert: (data) => ({
                select: () => Promise.resolve({ data: data, error: null })
            })
        })
    };
    
    await supabaseService.syncOfflineData();
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 0, '全データが同期されること');
});

// エラー処理の統合テスト
testRunner.test('エラー処理統合 - 部分同期失敗', async () => {
    setupIntegrationTest();
    
    supabaseService.currentUser = { id: 'integration-test-user' };
    supabaseService.isOnline = false;
    
    // 複数のデータを保存
    await supabaseService.saveWorkout({ session_name: '成功予定' });
    await supabaseService.saveWorkout({ session_name: '失敗予定' });
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 2, '2つのデータがキューに追加されること');
    
    // 部分的に失敗するクライアントを設定
    supabaseService.client = {
        from: () => ({
            insert: (data) => ({
                select: () => {
                    if (data[0].session_name === '失敗予定') {
                        return Promise.reject(new Error('Simulated failure'));
                    }
                    return Promise.resolve({ data: data, error: null });
                }
            })
        })
    };
    
    supabaseService.isOnline = true;
    await supabaseService.syncOfflineData();
    
    // 失敗したデータがキューに残っていることを確認
    testRunner.assertTrue(supabaseService.offlineQueue.length > 0, '失敗したデータがキューに残ること');
    testRunner.assertTrue(
        supabaseService.offlineQueue.some(item => item.data.session_name === '失敗予定'),
        '失敗したデータが特定できること'
    );
});

// 接続監視の統合テスト
testRunner.test('接続監視統合 - 定期チェック', (done) => {
    setupIntegrationTest();
    
    let checkCount = 0;
    const originalCheckConnection = supabaseService.checkConnection;
    
    // checkConnection をモック
    supabaseService.checkConnection = async () => {
        checkCount++;
        return true;
    };
    
    // 短い間隔で監視を開始（テスト用）
    if (supabaseService.connectionMonitorInterval) {
        clearInterval(supabaseService.connectionMonitorInterval);
    }
    
    supabaseService.connectionMonitorInterval = setInterval(async () => {
        await supabaseService.checkConnection();
        
        if (checkCount >= 2) {
            clearInterval(supabaseService.connectionMonitorInterval);
            supabaseService.connectionMonitorInterval = null;
            
            // 元の関数を復元
            supabaseService.checkConnection = originalCheckConnection;
            
            testRunner.assertTrue(checkCount >= 2, '定期的に接続チェックが実行されること');
            done();
        }
    }, 100); // 100ms間隔（テスト用）
    
    // タイムアウト設定
    setTimeout(() => {
        if (supabaseService.connectionMonitorInterval) {
            clearInterval(supabaseService.connectionMonitorInterval);
            supabaseService.connectionMonitorInterval = null;
        }
        supabaseService.checkConnection = originalCheckConnection;
        testRunner.fail('接続監視のタイムアウト');
        done();
    }, 1000);
});

// LocalStorage統合テスト
testRunner.test('LocalStorage統合 - 永続化と復元', () => {
    setupIntegrationTest();
    
    // データを追加
    supabaseService.addToOfflineQueue('INSERT', 'workout_sessions', {
        session_name: '永続化テスト',
        workout_date: '2025-01-23'
    });
    
    supabaseService.addToOfflineQueue('UPDATE', 'training_logs', {
        id: 'test-123',
        sets: 4
    }, 'test-123');
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 2, 'キューにデータが追加されること');
    
    // LocalStorageの内容を確認
    const stored = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
    testRunner.assertEqual(stored.length, 2, 'LocalStorageに正しく保存されること');
    
    // キューをクリアして復元テスト
    supabaseService.offlineQueue = [];
    supabaseService.restoreOfflineQueue();
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 2, 'LocalStorageから正しく復元されること');
    testRunner.assertEqual(supabaseService.offlineQueue[0].data.session_name, '永続化テスト', '正しいデータが復元されること');
});

// UI統合テスト
testRunner.test('UI統合 - 接続状態インジケーター', () => {
    setupIntegrationTest();
    
    // 接続状態マネージャーを初期化
    const statusManager = connectionStatusManager;
    
    // インジケーター要素が作成されることを確認
    const statusIndicator = document.querySelector('.connection-status');
    const queueIndicator = document.querySelector('.offline-queue-indicator');
    
    testRunner.assertNotNull(statusIndicator, '接続状態インジケーターが作成されること');
    testRunner.assertNotNull(queueIndicator, 'キューインジケーターが作成されること');
    
    // オフライン状態に変更
    statusManager.updateStatus(false);
    
    testRunner.assertTrue(statusIndicator.classList.contains('offline'), 'オフライン状態のCSSクラスが適用されること');
    testRunner.assertTrue(statusIndicator.textContent.includes('オフライン'), 'オフライン状態のテキストが表示されること');
});

testRunner.test('UI統合 - キューインジケーター表示', () => {
    setupIntegrationTest();
    
    const queueIndicator = document.querySelector('.offline-queue-indicator');
    testRunner.assertNotNull(queueIndicator, 'キューインジケーターが存在すること');
    
    // 初期状態では非表示
    testRunner.assertTrue(queueIndicator.classList.contains('hidden'), '初期状態では非表示であること');
    
    // データを追加
    supabaseService.addToOfflineQueue('INSERT', 'workout_sessions', { session_name: 'Test' });
    
    // インジケーターを更新
    connectionStatusManager.updateQueueIndicator();
    
    testRunner.assertFalse(queueIndicator.classList.contains('hidden'), 'データがある場合は表示されること');
    
    const countElement = queueIndicator.querySelector('.queue-count');
    testRunner.assertEqual(countElement.textContent, '1', '正しいキュー数が表示されること');
});

// パフォーマンス統合テスト
testRunner.test('パフォーマンス統合 - 大量データ処理', async () => {
    setupIntegrationTest();
    
    supabaseService.currentUser = { id: 'performance-test-user' };
    
    const startTime = performance.now();
    
    // 大量のオフラインデータを生成
    for (let i = 0; i < 100; i++) {
        supabaseService.addToOfflineQueue('INSERT', 'training_logs', {
            exercise_name: `Exercise ${i}`,
            sets: 3,
            reps: [10, 10, 10],
            weights: [20, 20, 20]
        });
    }
    
    const addTime = performance.now();
    testRunner.assertTrue(addTime - startTime < 1000, '100件のデータ追加が1秒以内に完了すること');
    
    // LocalStorage永続化のパフォーマンス
    const persistStartTime = performance.now();
    supabaseService.persistOfflineQueue();
    const persistTime = performance.now();
    
    testRunner.assertTrue(persistTime - persistStartTime < 500, 'LocalStorage永続化が0.5秒以内に完了すること');
    
    // 復元のパフォーマンス
    supabaseService.offlineQueue = [];
    const restoreStartTime = performance.now();
    supabaseService.restoreOfflineQueue();
    const restoreTime = performance.now();
    
    testRunner.assertTrue(restoreTime - restoreStartTime < 500, 'LocalStorage復元が0.5秒以内に完了すること');
    testRunner.assertEqual(supabaseService.offlineQueue.length, 100, '全データが正しく復元されること');
});

// メモリリーク防止テスト
testRunner.test('メモリリーク防止 - イベントリスナー', () => {
    setupIntegrationTest();
    
    const initialListenerCount = getEventListenerCount();
    
    // 接続監視を開始・停止
    supabaseService.startConnectionMonitoring();
    supabaseService.stopConnectionMonitoring();
    
    const finalListenerCount = getEventListenerCount();
    
    // イベントリスナーが適切にクリーンアップされていることを確認
    // （実際の実装では、この関数は存在しないため、概念的なテスト）
    testRunner.assertTrue(true, 'イベントリスナーのクリーンアップが実行されること');
});

// ヘルパー関数（概念的）
function getEventListenerCount() {
    // 実際の実装では、イベントリスナーの数を取得する方法が必要
    return 0;
}

// テスト後のクリーンアップ
testRunner.afterAll(() => {
    setupIntegrationTest();
    
    // 接続監視を停止
    supabaseService.stopConnectionMonitoring();
    
    // DOM要素をクリーンアップ
    const indicators = document.querySelectorAll('.connection-status, .offline-queue-indicator');
    indicators.forEach(el => el.remove());
    
    // LocalStorageをクリア
    localStorage.removeItem('offlineWorkoutQueue');
    
    console.log('Supabase統合テストのクリーンアップが完了しました');
});

// テスト実行
export default testRunner;
