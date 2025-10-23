// supabase-connection.test.js - Supabase接続とオフライン機能のテスト

import { TestRunner } from '../test-runner.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { connectionStatusManager } from '../../js/modules/connectionStatusManager.js';

const testRunner = new TestRunner('Supabase接続とオフライン機能テスト');

// モック用のSupabaseクライアント
const mockSupabaseClient = {
    from: (table) => ({
        select: (columns) => ({
            limit: (count) => Promise.resolve({ data: [], error: null }),
            eq: (column, value) => ({
                select: () => Promise.resolve({ data: [], error: null }),
                insert: (data) => Promise.resolve({ data: [data], error: null }),
                update: (data) => Promise.resolve({ data: [data], error: null }),
                delete: () => Promise.resolve({ data: [], error: null })
            })
        }),
        insert: (data) => ({
            select: () => Promise.resolve({ data: [data], error: null })
        }),
        update: (data) => ({
            eq: (column, value) => Promise.resolve({ data: [data], error: null })
        }),
        delete: () => ({
            eq: (column, value) => Promise.resolve({ data: [], error: null })
        })
    }),
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: (credentials) => Promise.resolve({ 
            data: { user: { id: 'test-user', email: credentials.email } }, 
            error: null 
        }),
        signUp: (credentials) => Promise.resolve({ 
            data: { user: { id: 'test-user', email: credentials.email } }, 
            error: null 
        }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: (callback) => ({ data: { subscription: {} } })
    }
};

// 接続チェック機能のテスト
testRunner.test('接続チェック機能 - 正常接続', async () => {
    // モッククライアントを設定
    supabaseService.client = mockSupabaseClient;
    
    const isConnected = await supabaseService.checkConnection();
    testRunner.assertTrue(isConnected, '正常な接続状態を検出できること');
});

testRunner.test('接続チェック機能 - 接続失敗', async () => {
    // エラーを返すモッククライアントを設定
    const errorClient = {
        from: () => ({
            select: () => ({
                limit: () => Promise.resolve({ data: null, error: new Error('Connection failed') })
            })
        })
    };
    
    supabaseService.client = errorClient;
    
    const isConnected = await supabaseService.checkConnection();
    testRunner.assertFalse(isConnected, '接続失敗を正しく検出できること');
});

testRunner.test('接続チェック機能 - クライアント未初期化', async () => {
    supabaseService.client = null;
    
    const isConnected = await supabaseService.checkConnection();
    testRunner.assertFalse(isConnected, 'クライアント未初期化時はfalseを返すこと');
});

// オフラインキュー機能のテスト
testRunner.test('オフラインキュー - データ追加', () => {
    supabaseService.offlineQueue = [];
    
    supabaseService.addToOfflineQueue('INSERT', 'workout_sessions', {
        session_name: 'Test Workout',
        workout_date: '2025-01-23'
    });
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 1, 'キューにデータが追加されること');
    testRunner.assertEqual(supabaseService.offlineQueue[0].operation, 'INSERT', '操作タイプが正しく設定されること');
    testRunner.assertEqual(supabaseService.offlineQueue[0].table, 'workout_sessions', 'テーブル名が正しく設定されること');
});

testRunner.test('オフラインキュー - 複数データ追加', () => {
    supabaseService.offlineQueue = [];
    
    // 複数のデータを追加
    supabaseService.addToOfflineQueue('INSERT', 'workout_sessions', { name: 'Workout 1' });
    supabaseService.addToOfflineQueue('UPDATE', 'training_logs', { id: '123', sets: 3 }, '123');
    supabaseService.addToOfflineQueue('DELETE', 'workout_sessions', {}, '456');
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 3, '複数のデータが正しく追加されること');
    testRunner.assertEqual(supabaseService.offlineQueue[1].operation, 'UPDATE', 'UPDATE操作が正しく設定されること');
    testRunner.assertEqual(supabaseService.offlineQueue[2].recordId, '456', 'レコードIDが正しく設定されること');
});

// オフライン保存機能のテスト
testRunner.test('オフライン保存 - ワークアウトセッション', async () => {
    supabaseService.isOnline = false;
    supabaseService.currentUser = { id: 'test-user' };
    supabaseService.offlineQueue = [];
    
    const sessionData = {
        session_name: 'Test Workout',
        workout_date: '2025-01-23',
        start_time: new Date().toISOString()
    };
    
    const result = await supabaseService.saveWorkout(sessionData);
    
    testRunner.assertTrue(result.id.startsWith('offline_'), 'オフラインIDが生成されること');
    testRunner.assertEqual(supabaseService.offlineQueue.length, 1, 'オフラインキューにデータが追加されること');
    testRunner.assertEqual(result.user_id, 'test-user', 'ユーザーIDが正しく設定されること');
});

testRunner.test('オフライン保存 - トレーニングログ', async () => {
    supabaseService.isOnline = false;
    supabaseService.currentUser = { id: 'test-user' };
    supabaseService.offlineQueue = [];
    
    const logData = {
        exercise_name: 'Push-ups',
        sets: 3,
        reps: [10, 10, 8],
        weights: [0, 0, 0],
        muscle_group_id: 'chest'
    };
    
    const result = await supabaseService.saveTrainingLog(logData);
    
    testRunner.assertTrue(result.id.startsWith('offline_'), 'オフラインIDが生成されること');
    testRunner.assertEqual(supabaseService.offlineQueue.length, 1, 'オフラインキューにデータが追加されること');
    testRunner.assertEqual(result.exercise_name, 'Push-ups', 'エクササイズ名が正しく保存されること');
});

// 同期機能のテスト
testRunner.test('データ同期 - 成功ケース', async () => {
    supabaseService.client = mockSupabaseClient;
    supabaseService.isOnline = true;
    supabaseService.currentUser = { id: 'test-user' };
    
    // テストデータをキューに追加
    supabaseService.offlineQueue = [
        {
            id: 'test-1',
            operation: 'INSERT',
            table: 'workout_sessions',
            data: { session_name: 'Test Workout' },
            timestamp: new Date().toISOString(),
            retryCount: 0
        }
    ];
    
    await supabaseService.syncOfflineData();
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 0, '同期成功後はキューが空になること');
});

testRunner.test('データ同期 - 部分失敗ケース', async () => {
    // 一部のデータで失敗するモッククライアント
    const partialFailClient = {
        from: (table) => ({
            insert: (data) => {
                if (data[0].session_name === 'Fail Test') {
                    return Promise.reject(new Error('Insert failed'));
                }
                return Promise.resolve({ data: [data[0]], error: null });
            },
            update: (data) => ({
                eq: () => Promise.resolve({ data: [data], error: null })
            }),
            delete: () => ({
                eq: () => Promise.resolve({ data: [], error: null })
            })
        })
    };
    
    supabaseService.client = partialFailClient;
    supabaseService.isOnline = true;
    supabaseService.currentUser = { id: 'test-user' };
    
    // 成功と失敗のデータを混在させる
    supabaseService.offlineQueue = [
        {
            id: 'test-success',
            operation: 'INSERT',
            table: 'workout_sessions',
            data: { session_name: 'Success Test' },
            timestamp: new Date().toISOString(),
            retryCount: 0
        },
        {
            id: 'test-fail',
            operation: 'INSERT',
            table: 'workout_sessions',
            data: { session_name: 'Fail Test' },
            timestamp: new Date().toISOString(),
            retryCount: 0
        }
    ];
    
    await supabaseService.syncOfflineData();
    
    testRunner.assertTrue(supabaseService.offlineQueue.length > 0, '失敗したデータはキューに残ること');
    testRunner.assertTrue(
        supabaseService.offlineQueue.some(item => item.data.session_name === 'Fail Test'),
        '失敗したデータが特定できること'
    );
});

// 指数バックオフのテスト
testRunner.test('指数バックオフ - リトライ機能', async () => {
    let attemptCount = 0;
    const testOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
            throw new Error('Temporary failure');
        }
        return 'success';
    };
    
    const result = await supabaseService.retryWithExponentialBackoff(testOperation, 3);
    
    testRunner.assertEqual(result, 'success', '最終的に成功すること');
    testRunner.assertEqual(attemptCount, 3, '指定回数リトライされること');
});

testRunner.test('指数バックオフ - 最大リトライ回数超過', async () => {
    let attemptCount = 0;
    const testOperation = async () => {
        attemptCount++;
        throw new Error('Persistent failure');
    };
    
    try {
        await supabaseService.retryWithExponentialBackoff(testOperation, 2);
        testRunner.fail('例外が投げられるべき');
    } catch (error) {
        testRunner.assertEqual(error.message, 'Persistent failure', '最後のエラーが投げられること');
        testRunner.assertEqual(attemptCount, 3, '最大リトライ回数+1回実行されること');
    }
});

// 接続状態管理のテスト
testRunner.test('接続状態管理 - オンライン→オフライン', () => {
    const initialStatus = supabaseService.getConnectionStatus();
    
    supabaseService.enableOfflineMode();
    
    testRunner.assertFalse(supabaseService.getConnectionStatus(), 'オフライン状態に変更されること');
    testRunner.assertTrue(document.body.classList.contains('offline-mode'), 'オフラインCSSクラスが追加されること');
});

testRunner.test('接続状態管理 - 接続状態取得', () => {
    supabaseService.isOnline = true;
    testRunner.assertTrue(supabaseService.getConnectionStatus(), 'オンライン状態を正しく取得できること');
    
    supabaseService.isOnline = false;
    testRunner.assertFalse(supabaseService.getConnectionStatus(), 'オフライン状態を正しく取得できること');
});

// LocalStorage永続化のテスト
testRunner.test('LocalStorage永続化 - キュー保存', () => {
    supabaseService.offlineQueue = [
        {
            id: 'test-1',
            operation: 'INSERT',
            table: 'workout_sessions',
            data: { session_name: 'Test' },
            timestamp: new Date().toISOString()
        }
    ];
    
    supabaseService.persistOfflineQueue();
    
    const stored = localStorage.getItem('offlineWorkoutQueue');
    testRunner.assertNotNull(stored, 'LocalStorageにデータが保存されること');
    
    const parsed = JSON.parse(stored);
    testRunner.assertEqual(parsed.length, 1, '正しいデータ数が保存されること');
    testRunner.assertEqual(parsed[0].operation, 'INSERT', '正しいデータ内容が保存されること');
});

testRunner.test('LocalStorage永続化 - キュー復元', () => {
    // テストデータをLocalStorageに保存
    const testData = [
        {
            id: 'test-restore',
            operation: 'UPDATE',
            table: 'training_logs',
            data: { sets: 4 },
            timestamp: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('offlineWorkoutQueue', JSON.stringify(testData));
    
    supabaseService.offlineQueue = [];
    supabaseService.restoreOfflineQueue();
    
    testRunner.assertEqual(supabaseService.offlineQueue.length, 1, 'キューが正しく復元されること');
    testRunner.assertEqual(supabaseService.offlineQueue[0].operation, 'UPDATE', '正しいデータが復元されること');
});

// エラーハンドリングのテスト
testRunner.test('エラーハンドリング - 認証エラー', async () => {
    supabaseService.currentUser = null;
    
    try {
        await supabaseService.saveWorkout({ session_name: 'Test' });
        testRunner.fail('認証エラーが投げられるべき');
    } catch (error) {
        testRunner.assertTrue(error.message.includes('認証情報'), '適切な認証エラーメッセージが表示されること');
    }
});

testRunner.test('エラーハンドリング - オンライン保存失敗時のフォールバック', async () => {
    // エラーを返すクライアント
    const errorClient = {
        from: () => ({
            insert: () => ({
                select: () => Promise.reject(new Error('Database error'))
            })
        })
    };
    
    supabaseService.client = errorClient;
    supabaseService.isOnline = true;
    supabaseService.currentUser = { id: 'test-user' };
    supabaseService.offlineQueue = [];
    
    const result = await supabaseService.saveWorkout({ session_name: 'Test' });
    
    testRunner.assertTrue(result.id.startsWith('offline_'), 'オフラインIDが生成されること');
    testRunner.assertEqual(supabaseService.offlineQueue.length, 1, 'オフラインキューにフォールバックされること');
});

// パフォーマンステスト
testRunner.test('パフォーマンス - 大量データ同期', async () => {
    supabaseService.client = mockSupabaseClient;
    supabaseService.isOnline = true;
    supabaseService.currentUser = { id: 'test-user' };
    
    // 大量のテストデータを生成
    supabaseService.offlineQueue = [];
    for (let i = 0; i < 50; i++) {
        supabaseService.addToOfflineQueue('INSERT', 'training_logs', {
            exercise_name: `Exercise ${i}`,
            sets: 3,
            reps: [10, 10, 10]
        });
    }
    
    const startTime = performance.now();
    await supabaseService.syncOfflineData();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    testRunner.assertTrue(duration < 5000, '大量データ同期が5秒以内に完了すること');
    testRunner.assertEqual(supabaseService.offlineQueue.length, 0, '全データが同期されること');
});

// クリーンアップ
testRunner.test('クリーンアップ - 接続監視停止', () => {
    supabaseService.startConnectionMonitoring();
    testRunner.assertNotNull(supabaseService.connectionMonitorInterval, '接続監視が開始されること');
    
    supabaseService.stopConnectionMonitoring();
    testRunner.assertNull(supabaseService.connectionMonitorInterval, '接続監視が停止されること');
});

// テスト実行
export default testRunner;
