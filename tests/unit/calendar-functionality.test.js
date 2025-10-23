// calendar-functionality.test.js - カレンダー機能のユニットテスト

import { TestRunner } from '../test-runner.js';

const testRunner = new TestRunner();

// モックデータ
const mockWorkoutData = [
    {
        id: 'workout1',
        date: '2024-01-15',
        name: '胸筋トレーニング',
        muscle_groups: ['chest'],
        duration: 3600,
        exercises: [
            { name: 'ベンチプレス', sets: 3, reps: 10, weight: 80 }
        ]
    },
    {
        id: 'workout2',
        date: '2024-01-16',
        name: '背筋トレーニング',
        muscle_groups: ['back'],
        duration: 4200,
        exercises: [
            { name: 'デッドリフト', sets: 3, reps: 8, weight: 100 }
        ]
    },
    {
        id: 'workout3',
        date: '2024-01-17',
        name: '複合トレーニング',
        muscle_groups: ['chest', 'shoulder'],
        duration: 5400,
        exercises: [
            { name: 'ベンチプレス', sets: 3, reps: 10, weight: 80 },
            { name: 'ショルダープレス', sets: 3, reps: 12, weight: 40 }
        ]
    }
];

const mockPlannedWorkouts = [
    {
        id: 'planned1',
        planned_date: '2024-01-20',
        name: '脚トレーニング予定',
        muscle_groups: ['leg']
    },
    {
        id: 'planned2',
        planned_date: '2024-01-22',
        name: '腕トレーニング予定',
        muscle_groups: ['arm']
    }
];

// カレンダーページのモック
class MockCalendarPage {
    constructor() {
        this.currentDate = new Date(2024, 0, 15); // 2024年1月15日
        this.workoutData = [...mockWorkoutData];
        this.plannedWorkouts = [...mockPlannedWorkouts];
        this.selectedDate = null;
        this.isLoading = false;
    }

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isToday(date) {
        const today = new Date();
        return this.formatDateString(date) === this.formatDateString(today);
    }

    getWorkoutsForDate(dateStr) {
        return this.workoutData.filter(workout => {
            const workoutDate = workout.date || workout.startTime || workout.workout_date;
            if (!workoutDate) return false;
            const date = new Date(workoutDate);
            return this.formatDateString(date) === dateStr;
        });
    }

    getPlannedWorkoutsForDate(dateStr) {
        return this.plannedWorkouts.filter(workout => {
            const plannedDate = workout.planned_date || workout.date;
            if (!plannedDate) return false;
            const date = new Date(plannedDate);
            return this.formatDateString(date) === dateStr;
        });
    }

    async addPlannedWorkout(dateStr, workoutData) {
        const plannedWorkout = {
            id: `planned_${Date.now()}`,
            planned_date: dateStr,
            name: workoutData.name || 'トレーニング予定',
            muscle_groups: workoutData.muscle_groups || ['chest'],
            created_at: new Date().toISOString()
        };
        
        this.plannedWorkouts.push(plannedWorkout);
        return plannedWorkout;
    }

    async removePlannedWorkout(plannedWorkoutId) {
        const initialLength = this.plannedWorkouts.length;
        this.plannedWorkouts = this.plannedWorkouts.filter(
            workout => workout.id !== plannedWorkoutId
        );
        return this.plannedWorkouts.length < initialLength;
    }
}

// テストケース
testRunner.describe('カレンダー機能のテスト', () => {
    let calendarPage;

    testRunner.beforeEach(() => {
        calendarPage = new MockCalendarPage();
    });

    testRunner.test('日付文字列のフォーマットが正しく動作する', () => {
        const date = new Date(2024, 0, 15); // 2024年1月15日
        const formatted = calendarPage.formatDateString(date);
        testRunner.assertEqual(formatted, '2024-01-15');
    });

    testRunner.test('指定日のワークアウトを正しく取得できる', () => {
        const workouts = calendarPage.getWorkoutsForDate('2024-01-15');
        testRunner.assertEqual(workouts.length, 1);
        testRunner.assertEqual(workouts[0].name, '胸筋トレーニング');
        testRunner.assertEqual(workouts[0].muscle_groups[0], 'chest');
    });

    testRunner.test('複数の部位を含むワークアウトを正しく取得できる', () => {
        const workouts = calendarPage.getWorkoutsForDate('2024-01-17');
        testRunner.assertEqual(workouts.length, 1);
        testRunner.assertEqual(workouts[0].muscle_groups.length, 2);
        testRunner.assertTrue(workouts[0].muscle_groups.includes('chest'));
        testRunner.assertTrue(workouts[0].muscle_groups.includes('shoulder'));
    });

    testRunner.test('ワークアウトが存在しない日は空配列を返す', () => {
        const workouts = calendarPage.getWorkoutsForDate('2024-01-18');
        testRunner.assertEqual(workouts.length, 0);
    });

    testRunner.test('指定日の予定されたワークアウトを正しく取得できる', () => {
        const plannedWorkouts = calendarPage.getPlannedWorkoutsForDate('2024-01-20');
        testRunner.assertEqual(plannedWorkouts.length, 1);
        testRunner.assertEqual(plannedWorkouts[0].name, '脚トレーニング予定');
        testRunner.assertEqual(plannedWorkouts[0].muscle_groups[0], 'leg');
    });

    testRunner.test('予定されたワークアウトが存在しない日は空配列を返す', () => {
        const plannedWorkouts = calendarPage.getPlannedWorkoutsForDate('2024-01-19');
        testRunner.assertEqual(plannedWorkouts.length, 0);
    });

    testRunner.test('新しい予定を正しく追加できる', async () => {
        const initialCount = calendarPage.plannedWorkouts.length;
        const newWorkout = await calendarPage.addPlannedWorkout('2024-01-25', {
            name: '新しいトレーニング',
            muscle_groups: ['core']
        });

        testRunner.assertEqual(calendarPage.plannedWorkouts.length, initialCount + 1);
        testRunner.assertEqual(newWorkout.name, '新しいトレーニング');
        testRunner.assertEqual(newWorkout.muscle_groups[0], 'core');
        testRunner.assertEqual(newWorkout.planned_date, '2024-01-25');
    });

    testRunner.test('予定を正しく削除できる', async () => {
        const initialCount = calendarPage.plannedWorkouts.length;
        const workoutToDelete = calendarPage.plannedWorkouts[0];
        const result = await calendarPage.removePlannedWorkout(workoutToDelete.id);

        testRunner.assertTrue(result);
        testRunner.assertEqual(calendarPage.plannedWorkouts.length, initialCount - 1);
        
        // 削除されたワークアウトが存在しないことを確認
        const remainingWorkouts = calendarPage.plannedWorkouts.filter(
            w => w.id === workoutToDelete.id
        );
        testRunner.assertEqual(remainingWorkouts.length, 0);
    });

    testRunner.test('存在しない予定の削除は失敗する', async () => {
        const initialCount = calendarPage.plannedWorkouts.length;
        const result = await calendarPage.removePlannedWorkout('non-existent-id');

        testRunner.assertFalse(result);
        testRunner.assertEqual(calendarPage.plannedWorkouts.length, initialCount);
    });

    testRunner.test('今日の日付判定が正しく動作する', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        testRunner.assertTrue(calendarPage.isToday(today));
        testRunner.assertFalse(calendarPage.isToday(yesterday));
        testRunner.assertFalse(calendarPage.isToday(tomorrow));
    });

    testRunner.test('月の境界での日付処理が正しく動作する', () => {
        // 月末
        const endOfMonth = new Date(2024, 0, 31); // 2024年1月31日
        const formatted1 = calendarPage.formatDateString(endOfMonth);
        testRunner.assertEqual(formatted1, '2024-01-31');

        // 月初
        const startOfMonth = new Date(2024, 1, 1); // 2024年2月1日
        const formatted2 = calendarPage.formatDateString(startOfMonth);
        testRunner.assertEqual(formatted2, '2024-02-01');
    });

    testRunner.test('うるう年の2月29日を正しく処理できる', () => {
        const leapDay = new Date(2024, 1, 29); // 2024年2月29日（うるう年）
        const formatted = calendarPage.formatDateString(leapDay);
        testRunner.assertEqual(formatted, '2024-02-29');
    });

    testRunner.test('ワークアウトデータの統計計算が正しく動作する', () => {
        // 1月のワークアウト数をカウント
        const januaryWorkouts = calendarPage.workoutData.filter(workout => {
            const date = new Date(workout.date);
            return date.getFullYear() === 2024 && date.getMonth() === 0;
        });

        testRunner.assertEqual(januaryWorkouts.length, 3);

        // 総時間の計算
        const totalDuration = januaryWorkouts.reduce((sum, workout) => 
            sum + (workout.duration || 0), 0);
        testRunner.assertEqual(totalDuration, 13200); // 3600 + 4200 + 5400

        // 平均時間の計算
        const avgDuration = Math.floor(totalDuration / januaryWorkouts.length / 60);
        testRunner.assertEqual(avgDuration, 73); // 13200 / 3 / 60 = 73.33... → 73
    });

    testRunner.test('部位別ワークアウト数の集計が正しく動作する', () => {
        const muscleCount = {};
        
        calendarPage.workoutData.forEach(workout => {
            const muscles = workout.muscle_groups || [];
            muscles.forEach(muscle => {
                muscleCount[muscle] = (muscleCount[muscle] || 0) + 1;
            });
        });

        testRunner.assertEqual(muscleCount['chest'], 2); // workout1, workout3
        testRunner.assertEqual(muscleCount['back'], 1);  // workout2
        testRunner.assertEqual(muscleCount['shoulder'], 1); // workout3
        testRunner.assertEqual(muscleCount['leg'], undefined); // なし
    });

    testRunner.test('エラーハンドリング: 無効な日付データの処理', () => {
        // 無効な日付を持つワークアウトデータ
        const invalidWorkout = {
            id: 'invalid',
            date: null,
            name: '無効なワークアウト'
        };
        
        calendarPage.workoutData.push(invalidWorkout);
        
        // 無効なデータは除外されることを確認
        const workouts = calendarPage.getWorkoutsForDate('2024-01-15');
        const invalidWorkouts = workouts.filter(w => w.id === 'invalid');
        testRunner.assertEqual(invalidWorkouts.length, 0);
    });

    testRunner.test('パフォーマンス: 大量データでの検索性能', () => {
        // 大量のワークアウトデータを生成
        const largeDataSet = [];
        for (let i = 0; i < 1000; i++) {
            largeDataSet.push({
                id: `workout_${i}`,
                date: `2024-01-${String((i % 31) + 1).padStart(2, '0')}`,
                name: `ワークアウト${i}`,
                muscle_groups: ['chest']
            });
        }
        
        calendarPage.workoutData = largeDataSet;
        
        // 検索開始時間
        const startTime = performance.now();
        
        // 特定日のワークアウトを検索
        const workouts = calendarPage.getWorkoutsForDate('2024-01-15');
        
        // 検索終了時間
        const endTime = performance.now();
        const searchTime = endTime - startTime;
        
        // 検索時間が100ms以下であることを確認（パフォーマンス要件）
        testRunner.assertTrue(searchTime < 100);
        
        // 正しい数のワークアウトが見つかることを確認
        testRunner.assertTrue(workouts.length > 0);
    });
});

// ヘルパー関数のテスト
testRunner.describe('カレンダーヘルパー関数のテスト', () => {
    testRunner.test('getMuscleColor関数が正しい色を返す', async () => {
        // helpers.jsから関数をインポート（動的インポート）
        const { getMuscleColor } = await import('../../js/utils/helpers.js');
        
        testRunner.assertEqual(getMuscleColor('chest'), 'chest-color');
        testRunner.assertEqual(getMuscleColor('back'), 'back-color');
        testRunner.assertEqual(getMuscleColor('shoulder'), 'shoulder-color');
        testRunner.assertEqual(getMuscleColor('arm'), 'arm-color');
        testRunner.assertEqual(getMuscleColor('leg'), 'leg-color');
        testRunner.assertEqual(getMuscleColor('core'), 'core-color');
        testRunner.assertEqual(getMuscleColor('unknown'), 'chest-color'); // デフォルト
    });

    testRunner.test('getMuscleBgColor関数が正しい背景色を返す', async () => {
        const { getMuscleBgColor } = await import('../../js/utils/helpers.js');
        
        testRunner.assertEqual(getMuscleBgColor('chest'), 'bg-red-100');
        testRunner.assertEqual(getMuscleBgColor('back'), 'bg-green-100');
        testRunner.assertEqual(getMuscleBgColor('shoulder'), 'bg-yellow-100');
        testRunner.assertEqual(getMuscleBgColor('arm'), 'bg-purple-100');
        testRunner.assertEqual(getMuscleBgColor('leg'), 'bg-blue-100');
        testRunner.assertEqual(getMuscleBgColor('core'), 'bg-pink-100');
        testRunner.assertEqual(getMuscleBgColor('unknown'), 'bg-red-100'); // デフォルト
    });

    testRunner.test('isFutureDate関数が正しく動作する', async () => {
        const { isFutureDate } = await import('../../js/utils/helpers.js');
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        testRunner.assertFalse(isFutureDate(todayStr));
        testRunner.assertTrue(isFutureDate(tomorrowStr));
        testRunner.assertFalse(isFutureDate(yesterdayStr));
    });

    testRunner.test('isPastDate関数が正しく動作する', async () => {
        const { isPastDate } = await import('../../js/utils/helpers.js');
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        testRunner.assertFalse(isPastDate(todayStr));
        testRunner.assertFalse(isPastDate(tomorrowStr));
        testRunner.assertTrue(isPastDate(yesterdayStr));
    });
});

// エクスポート
export { testRunner as calendarFunctionalityTests };
