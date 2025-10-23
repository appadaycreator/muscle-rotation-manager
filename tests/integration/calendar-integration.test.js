// calendar-integration.test.js - カレンダー機能の統合テスト

import { TestRunner } from '../test-runner.js';

const testRunner = new TestRunner();

// DOM環境のセットアップ
function setupDOM() {
    // カレンダーコンテナを作成
    const container = document.createElement('div');
    container.id = 'calendar-container';
    document.body.appendChild(container);

    // 通知コンテナを作成
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);

    return container;
}

// DOM環境のクリーンアップ
function cleanupDOM() {
    const container = document.getElementById('calendar-container');
    const notificationContainer = document.getElementById('notification-container');
    const modal = document.getElementById('calendar-modal');
    
    if (container) container.remove();
    if (notificationContainer) notificationContainer.remove();
    if (modal) modal.remove();
}

// モックSupabaseサービス
const mockSupabaseService = {
    isAvailable: () => true,
    getCurrentUser: () => ({ id: 'test-user' }),
    getWorkouts: async (limit) => {
        return [
            {
                id: 'workout1',
                workout_date: '2024-01-15',
                session_name: '胸筋トレーニング',
                muscle_groups_trained: ['chest'],
                total_duration_minutes: 60,
                is_completed: true
            },
            {
                id: 'workout2',
                workout_date: '2024-01-16',
                session_name: '背筋トレーニング',
                muscle_groups_trained: ['back'],
                total_duration_minutes: 70,
                is_completed: true
            }
        ];
    }
};

// カレンダーページの統合テスト
testRunner.describe('カレンダー機能の統合テスト', () => {
    let container;

    testRunner.beforeEach(() => {
        container = setupDOM();
        
        // LocalStorageをクリア
        localStorage.clear();
        
        // モックデータを設定
        localStorage.setItem('workoutHistory', JSON.stringify([
            {
                id: 'local1',
                date: '2024-01-15',
                name: '胸筋トレーニング',
                muscle_groups: ['chest'],
                duration: 3600
            },
            {
                id: 'local2',
                date: '2024-01-16',
                name: '背筋トレーニング',
                muscle_groups: ['back'],
                duration: 4200
            }
        ]));
        
        localStorage.setItem('plannedWorkouts', JSON.stringify([
            {
                id: 'planned1',
                planned_date: '2024-01-20',
                name: '脚トレーニング予定',
                muscle_groups: ['leg']
            }
        ]));
    });

    testRunner.afterEach(() => {
        cleanupDOM();
        localStorage.clear();
    });

    testRunner.test('カレンダーページの初期化が正常に動作する', async () => {
        // カレンダーページクラスの動的インポート
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        // 初期化
        await CalendarPage.initialize();
        
        // カレンダーコンテナが正しく設定されていることを確認
        const calendarContainer = document.getElementById('calendar-container');
        testRunner.assertNotNull(calendarContainer);
        
        // カレンダーの基本要素が存在することを確認
        const monthDisplay = document.getElementById('current-month');
        const calendarDates = document.getElementById('calendar-dates');
        const prevButton = document.getElementById('prev-month');
        const nextButton = document.getElementById('next-month');
        
        testRunner.assertNotNull(monthDisplay);
        testRunner.assertNotNull(calendarDates);
        testRunner.assertNotNull(prevButton);
        testRunner.assertNotNull(nextButton);
    });

    testRunner.test('ワークアウトデータの読み込みが正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        // データを読み込み
        await CalendarPage.loadWorkoutData();
        
        // ワークアウトデータが正しく読み込まれていることを確認
        testRunner.assertTrue(CalendarPage.workoutData.length >= 2);
        
        // 予定データが正しく読み込まれていることを確認
        testRunner.assertTrue(CalendarPage.plannedWorkouts.length >= 1);
    });

    testRunner.test('カレンダーのレンダリングが正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        // カレンダーの日付セルが生成されていることを確認
        const dateCells = document.querySelectorAll('.calendar-date-cell');
        testRunner.assertTrue(dateCells.length >= 35); // 最低5週分（35日）
        testRunner.assertTrue(dateCells.length <= 42); // 最大6週分（42日）
        
        // 月表示が設定されていることを確認
        const monthDisplay = document.getElementById('current-month');
        testRunner.assertTrue(monthDisplay.textContent.includes('年'));
        testRunner.assertTrue(monthDisplay.textContent.includes('月'));
    });

    testRunner.test('月移動ボタンが正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        const monthDisplay = document.getElementById('current-month');
        const initialMonth = monthDisplay.textContent;
        
        // 次月ボタンをクリック
        const nextButton = document.getElementById('next-month');
        nextButton.click();
        
        // 月表示が変更されていることを確認
        const newMonth = monthDisplay.textContent;
        testRunner.assertNotEqual(initialMonth, newMonth);
        
        // 前月ボタンをクリック
        const prevButton = document.getElementById('prev-month');
        prevButton.click();
        
        // 元の月に戻っていることを確認
        const backToOriginal = monthDisplay.textContent;
        testRunner.assertEqual(initialMonth, backToOriginal);
    });

    testRunner.test('日付セルのクリックでモーダルが表示される', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        // 日付セルをクリック
        const dateCells = document.querySelectorAll('.calendar-date-cell');
        const firstCell = dateCells[0];
        testRunner.assertNotNull(firstCell);
        
        firstCell.click();
        
        // モーダルが表示されていることを確認
        const modal = document.getElementById('calendar-modal');
        testRunner.assertNotNull(modal);
        
        // モーダルの基本要素が存在することを確認
        const modalTitle = modal.querySelector('h3');
        const closeButton = modal.querySelector('button');
        testRunner.assertNotNull(modalTitle);
        testRunner.assertNotNull(closeButton);
    });

    testRunner.test('ワークアウトドットが正しく表示される', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        // ワークアウトドットが存在することを確認
        const workoutDots = document.querySelectorAll('.workout-dot');
        testRunner.assertTrue(workoutDots.length > 0);
        
        // 各ドットが適切な色クラスを持っていることを確認
        let hasValidColorClass = false;
        workoutDots.forEach(dot => {
            const classList = Array.from(dot.classList);
            const colorClasses = ['chest-color', 'back-color', 'shoulder-color', 'arm-color', 'leg-color', 'core-color'];
            if (colorClasses.some(colorClass => classList.includes(colorClass))) {
                hasValidColorClass = true;
            }
        });
        testRunner.assertTrue(hasValidColorClass);
    });

    testRunner.test('統計情報が正しく表示される', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        // 月間統計コンテナが存在することを確認
        const monthlyStats = document.getElementById('monthly-stats');
        testRunner.assertNotNull(monthlyStats);
        
        // 部位別統計コンテナが存在することを確認
        const muscleStats = document.getElementById('muscle-stats');
        testRunner.assertNotNull(muscleStats);
        
        // 統計データが表示されていることを確認
        testRunner.assertTrue(monthlyStats.children.length > 0);
        testRunner.assertTrue(muscleStats.children.length > 0);
    });

    testRunner.test('予定の追加機能が正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        const initialPlannedCount = CalendarPage.plannedWorkouts.length;
        
        // 予定を追加
        await CalendarPage.addPlannedWorkout('2024-01-25', {
            name: 'テスト予定',
            muscle_groups: ['core']
        });
        
        // 予定が追加されていることを確認
        testRunner.assertEqual(CalendarPage.plannedWorkouts.length, initialPlannedCount + 1);
        
        // LocalStorageに保存されていることを確認
        const savedPlanned = JSON.parse(localStorage.getItem('plannedWorkouts') || '[]');
        testRunner.assertEqual(savedPlanned.length, initialPlannedCount + 1);
        
        // 追加された予定の内容を確認
        const addedWorkout = CalendarPage.plannedWorkouts[CalendarPage.plannedWorkouts.length - 1];
        testRunner.assertEqual(addedWorkout.name, 'テスト予定');
        testRunner.assertEqual(addedWorkout.muscle_groups[0], 'core');
        testRunner.assertEqual(addedWorkout.planned_date, '2024-01-25');
    });

    testRunner.test('予定の削除機能が正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        const initialPlannedCount = CalendarPage.plannedWorkouts.length;
        testRunner.assertTrue(initialPlannedCount > 0);
        
        const workoutToDelete = CalendarPage.plannedWorkouts[0];
        
        // 予定を削除
        const result = await CalendarPage.removePlannedWorkout(workoutToDelete.id);
        
        // 削除が成功していることを確認
        testRunner.assertTrue(result);
        testRunner.assertEqual(CalendarPage.plannedWorkouts.length, initialPlannedCount - 1);
        
        // LocalStorageからも削除されていることを確認
        const savedPlanned = JSON.parse(localStorage.getItem('plannedWorkouts') || '[]');
        testRunner.assertEqual(savedPlanned.length, initialPlannedCount - 1);
        
        // 削除されたワークアウトが存在しないことを確認
        const remainingWorkouts = CalendarPage.plannedWorkouts.filter(
            w => w.id === workoutToDelete.id
        );
        testRunner.assertEqual(remainingWorkouts.length, 0);
    });

    testRunner.test('レスポンシブ対応が正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        // モバイルサイズをシミュレート
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375
        });
        
        await CalendarPage.initialize();
        
        // カレンダーが正常にレンダリングされていることを確認
        const calendarDates = document.getElementById('calendar-dates');
        testRunner.assertNotNull(calendarDates);
        
        // 日付セルが存在することを確認
        const dateCells = document.querySelectorAll('.calendar-date-cell');
        testRunner.assertTrue(dateCells.length > 0);
        
        // デスクトップサイズに戻す
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024
        });
    });

    testRunner.test('エラーハンドリングが正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        // LocalStorageを無効化してエラーを発生させる
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
            throw new Error('LocalStorage error');
        };
        
        try {
            // エラーが発生しても初期化が完了することを確認
            await CalendarPage.initialize();
            
            const calendarContainer = document.getElementById('calendar-container');
            testRunner.assertNotNull(calendarContainer);
        } finally {
            // LocalStorageを復元
            localStorage.setItem = originalSetItem;
        }
    });

    testRunner.test('パフォーマンス: 大量データでのレンダリング性能', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        // 大量のワークアウトデータを生成
        const largeDataSet = [];
        for (let i = 0; i < 500; i++) {
            largeDataSet.push({
                id: `workout_${i}`,
                date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
                name: `ワークアウト${i}`,
                muscle_groups: ['chest'],
                duration: 3600
            });
        }
        
        localStorage.setItem('workoutHistory', JSON.stringify(largeDataSet));
        
        // レンダリング開始時間
        const startTime = performance.now();
        
        await CalendarPage.initialize();
        
        // レンダリング終了時間
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // レンダリング時間が500ms以下であることを確認
        testRunner.assertTrue(renderTime < 500);
        
        // カレンダーが正常にレンダリングされていることを確認
        const dateCells = document.querySelectorAll('.calendar-date-cell');
        testRunner.assertTrue(dateCells.length > 0);
        
        // ワークアウトドットが表示されていることを確認
        const workoutDots = document.querySelectorAll('.workout-dot');
        testRunner.assertTrue(workoutDots.length > 0);
    });
});

// UIインタラクションのテスト
testRunner.describe('カレンダーUIインタラクションのテスト', () => {
    let container;

    testRunner.beforeEach(() => {
        container = setupDOM();
        localStorage.clear();
    });

    testRunner.afterEach(() => {
        cleanupDOM();
        localStorage.clear();
    });

    testRunner.test('キーボードナビゲーションが正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        // 日付セルをクリックしてモーダルを開く
        const dateCells = document.querySelectorAll('.calendar-date-cell');
        dateCells[0].click();
        
        let modal = document.getElementById('calendar-modal');
        testRunner.assertNotNull(modal);
        
        // ESCキーでモーダルを閉じる
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escEvent);
        
        // 少し待ってからモーダルが削除されていることを確認
        setTimeout(() => {
            modal = document.getElementById('calendar-modal');
            testRunner.assertNull(modal);
        }, 100);
    });

    testRunner.test('タッチイベントが正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        // タッチイベントをシミュレート
        const dateCells = document.querySelectorAll('.calendar-date-cell');
        const firstCell = dateCells[0];
        
        const touchStartEvent = new TouchEvent('touchstart', {
            touches: [{ clientX: 100, clientY: 100 }]
        });
        const touchEndEvent = new TouchEvent('touchend');
        
        firstCell.dispatchEvent(touchStartEvent);
        firstCell.dispatchEvent(touchEndEvent);
        
        // クリックイベントも発火させる（タッチ後のクリック）
        firstCell.click();
        
        // モーダルが表示されていることを確認
        const modal = document.getElementById('calendar-modal');
        testRunner.assertNotNull(modal);
    });

    testRunner.test('アクセシビリティ対応が正常に動作する', async () => {
        const { default: CalendarPage } = await import('../../js/pages/calendarPage.js');
        
        await CalendarPage.initialize();
        
        // フォーカス可能な要素が存在することを確認
        const focusableElements = container.querySelectorAll(
            'button, [tabindex]:not([tabindex="-1"])'
        );
        testRunner.assertTrue(focusableElements.length > 0);
        
        // ボタンにaria-labelまたはテキストが設定されていることを確認
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            const hasLabel = button.getAttribute('aria-label') || 
                           button.textContent.trim() || 
                           button.querySelector('i'); // アイコンボタンの場合
            testRunner.assertTrue(!!hasLabel);
        });
    });
});

// エクスポート
export { testRunner as calendarIntegrationTests };
