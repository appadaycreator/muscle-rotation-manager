/**
 * 仕様書駆動開発（SDD）の実践例
 * SPEC.mdの要件から直接テストケースを生成
 */

// テストランナーの読み込み
import {
  test,
  describe,
  expect,
  beforeEach,
  runTests,
} from '../unit/test-runner.js';

/**
 * 仕様書駆動開発実践例: カレンダー機能
 *
 * SPEC.mdからの要件:
 * - 月間表示: カレンダー形式でのトレーニング履歴表示
 * - 日別詳細: 特定日のワークアウト詳細表示
 * - 色分け表示: 部位別の色分けによる視覚化
 */

describe('仕様書駆動開発実践例: カレンダー機能', () => {
  let calendarManager;
  let mockWorkoutData;

  beforeEach(() => {
    calendarManager = new CalendarManager();

    mockWorkoutData = [
      {
        date: '2024-01-15',
        muscleGroups: ['chest', 'shoulders'],
        exercises: [
          { name: 'ベンチプレス', muscleGroup: 'chest' },
          { name: 'ショルダープレス', muscleGroup: 'shoulders' },
        ],
        duration: 3600, // 60分
      },
      {
        date: '2024-01-17',
        muscleGroups: ['back', 'arms'],
        exercises: [
          { name: 'デッドリフト', muscleGroup: 'back' },
          { name: 'バーベルカール', muscleGroup: 'arms' },
        ],
        duration: 4200, // 70分
      },
      {
        date: '2024-01-20',
        muscleGroups: ['legs'],
        exercises: [
          { name: 'スクワット', muscleGroup: 'legs' },
          { name: 'レッグプレス', muscleGroup: 'legs' },
        ],
        duration: 5400, // 90分
      },
    ];
  });

  // 【仕様】月間表示: カレンダー形式でのトレーニング履歴表示
  describe('【SPEC準拠】月間表示機能', () => {
    test('指定月のカレンダーデータを生成できる', () => {
      const calendar = calendarManager.generateMonthlyCalendar(
        2024,
        1,
        mockWorkoutData
      );

      // カレンダーの基本構造を検証
      expect(calendar.year).toBe(2024);
      expect(calendar.month).toBe(1);
      expect(calendar.days).toHaveLength(31); // 1月は31日

      // ワークアウトがある日を検証
      const day15 = calendar.days.find((day) => day.date === 15);
      expect(day15.hasWorkout).toBeTruthy();
      expect(day15.workoutCount).toBe(1);

      const day17 = calendar.days.find((day) => day.date === 17);
      expect(day17.hasWorkout).toBeTruthy();

      const day20 = calendar.days.find((day) => day.date === 20);
      expect(day20.hasWorkout).toBeTruthy();
    });

    test('ワークアウトがない日は適切に表示される', () => {
      const calendar = calendarManager.generateMonthlyCalendar(
        2024,
        1,
        mockWorkoutData
      );

      const day1 = calendar.days.find((day) => day.date === 1);
      expect(day1.hasWorkout).toBeFalsy();
      expect(day1.workoutCount).toBe(0);
      expect(day1.muscleGroups).toHaveLength(0);
    });

    test('週の開始日を設定できる', () => {
      // 日曜日開始
      const calendarSun = calendarManager.generateMonthlyCalendar(2024, 1, [], {
        weekStartsOn: 0,
      });
      expect(calendarSun.weekStartsOn).toBe(0);

      // 月曜日開始
      const calendarMon = calendarManager.generateMonthlyCalendar(2024, 1, [], {
        weekStartsOn: 1,
      });
      expect(calendarMon.weekStartsOn).toBe(1);
    });
  });

  // 【仕様】日別詳細: 特定日のワークアウト詳細表示
  describe('【SPEC準拠】日別詳細機能', () => {
    test('特定日のワークアウト詳細を取得できる', () => {
      const dayDetail = calendarManager.getDayDetail(
        '2024-01-15',
        mockWorkoutData
      );

      expect(dayDetail.date).toBe('2024-01-15');
      expect(dayDetail.workouts).toHaveLength(1);
      expect(dayDetail.workouts[0].muscleGroups).toEqual([
        'chest',
        'shoulders',
      ]);
      expect(dayDetail.workouts[0].exercises).toHaveLength(2);
      expect(dayDetail.totalDuration).toBe(3600);
    });

    test('複数のワークアウトがある日の詳細を取得できる', () => {
      const multipleWorkouts = [
        ...mockWorkoutData,
        {
          date: '2024-01-15', // 同じ日に追加
          muscleGroups: ['abs'],
          exercises: [{ name: 'プランク', muscleGroup: 'abs' }],
          duration: 1800, // 30分
        },
      ];

      const dayDetail = calendarManager.getDayDetail(
        '2024-01-15',
        multipleWorkouts
      );

      expect(dayDetail.workouts).toHaveLength(2);
      expect(dayDetail.totalDuration).toBe(5400); // 60分 + 30分
      expect(dayDetail.uniqueMuscleGroups).toEqual([
        'chest',
        'shoulders',
        'abs',
      ]);
    });

    test('ワークアウトがない日の詳細を取得できる', () => {
      const dayDetail = calendarManager.getDayDetail(
        '2024-01-01',
        mockWorkoutData
      );

      expect(dayDetail.date).toBe('2024-01-01');
      expect(dayDetail.workouts).toHaveLength(0);
      expect(dayDetail.totalDuration).toBe(0);
      expect(dayDetail.uniqueMuscleGroups).toHaveLength(0);
    });
  });

  // 【仕様】色分け表示: 部位別の色分けによる視覚化
  describe('【SPEC準拠】色分け表示機能', () => {
    test('筋肉部位ごとに色が割り当てられる', () => {
      const colorScheme = calendarManager.getMuscleGroupColors();

      expect(colorScheme.chest).toBeTruthy();
      expect(colorScheme.back).toBeTruthy();
      expect(colorScheme.shoulders).toBeTruthy();
      expect(colorScheme.arms).toBeTruthy();
      expect(colorScheme.legs).toBeTruthy();
      expect(colorScheme.abs).toBeTruthy();

      // 色が重複していないことを確認
      const colors = Object.values(colorScheme);
      const uniqueColors = [...new Set(colors)];
      expect(colors).toHaveLength(uniqueColors.length);
    });

    test('日付に対応する色を取得できる', () => {
      const dayColors = calendarManager.getDayColors(
        '2024-01-15',
        mockWorkoutData
      );

      expect(dayColors).toContain(calendarManager.getMuscleGroupColors().chest);
      expect(dayColors).toContain(
        calendarManager.getMuscleGroupColors().shoulders
      );
      expect(dayColors).toHaveLength(2);
    });

    test('複数部位の色をブレンドできる', () => {
      const blendedColor = calendarManager.blendColors(['chest', 'shoulders']);

      expect(blendedColor).toBeTruthy();
      expect(typeof blendedColor).toBe('string');
      expect(blendedColor).toContain('#'); // HEX色形式
    });

    test('ワークアウトがない日は中性色を返す', () => {
      const dayColors = calendarManager.getDayColors(
        '2024-01-01',
        mockWorkoutData
      );

      expect(dayColors).toHaveLength(1);
      expect(dayColors[0]).toBe('#f3f4f6'); // グレー系の中性色
    });
  });

  // 【仕様】追加要件: カレンダーナビゲーション
  describe('【SPEC準拠】カレンダーナビゲーション機能', () => {
    test('前月・次月に移動できる', () => {
      const currentMonth = { year: 2024, month: 1 };

      const prevMonth = calendarManager.getPreviousMonth(currentMonth);
      expect(prevMonth.year).toBe(2023);
      expect(prevMonth.month).toBe(12);

      const nextMonth = calendarManager.getNextMonth(currentMonth);
      expect(nextMonth.year).toBe(2024);
      expect(nextMonth.month).toBe(2);
    });

    test('年をまたぐ移動が正しく処理される', () => {
      const decemberMonth = { year: 2024, month: 12 };
      const nextMonth = calendarManager.getNextMonth(decemberMonth);

      expect(nextMonth.year).toBe(2025);
      expect(nextMonth.month).toBe(1);

      const januaryMonth = { year: 2024, month: 1 };
      const prevMonth = calendarManager.getPreviousMonth(januaryMonth);

      expect(prevMonth.year).toBe(2023);
      expect(prevMonth.month).toBe(12);
    });

    test('今日の日付を取得できる', () => {
      const today = calendarManager.getToday();

      expect(today.year).toBeTruthy();
      expect(today.month).toBeTruthy();
      expect(today.date).toBeTruthy();
      expect(today.month).toBeGreaterThan(0);
      expect(today.month).toBeLessThan(13);
    });
  });
});

// 仕様書駆動開発に基づく実装
class CalendarManager {
  constructor() {
    this.muscleGroupColors = {
      chest: '#ef4444', // 赤
      back: '#3b82f6', // 青
      shoulders: '#f59e0b', // オレンジ
      arms: '#10b981', // 緑
      legs: '#8b5cf6', // 紫
      abs: '#f97316', // オレンジ系
    };
  }

  generateMonthlyCalendar(year, month, workoutData, options = {}) {
    const { weekStartsOn = 0 } = options; // 0: 日曜日, 1: 月曜日
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let date = 1; date <= daysInMonth; date++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayWorkouts = workoutData.filter((w) => w.date === dateString);

      const muscleGroups = [
        ...new Set(dayWorkouts.flatMap((w) => w.muscleGroups)),
      ];

      days.push({
        date,
        dateString,
        hasWorkout: dayWorkouts.length > 0,
        workoutCount: dayWorkouts.length,
        muscleGroups,
        colors: this.getDayColors(dateString, workoutData),
      });
    }

    return {
      year,
      month,
      days,
      weekStartsOn,
      monthName: this.getMonthName(month),
    };
  }

  getDayDetail(dateString, workoutData) {
    const workouts = workoutData.filter((w) => w.date === dateString);
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const uniqueMuscleGroups = [
      ...new Set(workouts.flatMap((w) => w.muscleGroups)),
    ];

    return {
      date: dateString,
      workouts,
      totalDuration,
      uniqueMuscleGroups,
      exerciseCount: workouts.reduce((sum, w) => sum + w.exercises.length, 0),
    };
  }

  getMuscleGroupColors() {
    return { ...this.muscleGroupColors };
  }

  getDayColors(dateString, workoutData) {
    const dayWorkouts = workoutData.filter((w) => w.date === dateString);

    if (dayWorkouts.length === 0) {
      return ['#f3f4f6']; // グレー
    }

    const muscleGroups = [
      ...new Set(dayWorkouts.flatMap((w) => w.muscleGroups)),
    ];

    return muscleGroups.map((group) => this.muscleGroupColors[group]);
  }

  blendColors(muscleGroups) {
    if (muscleGroups.length === 0) return '#f3f4f6';
    if (muscleGroups.length === 1)
      return this.muscleGroupColors[muscleGroups[0]];

    // 簡単な色ブレンド（実際の実装ではより高度な色混合を使用）
    const colors = muscleGroups.map((group) => this.muscleGroupColors[group]);
    return colors[0]; // 最初の色を返す（簡略化）
  }

  getPreviousMonth(currentMonth) {
    const { year, month } = currentMonth;

    if (month === 1) {
      return { year: year - 1, month: 12 };
    }

    return { year, month: month - 1 };
  }

  getNextMonth(currentMonth) {
    const { year, month } = currentMonth;

    if (month === 12) {
      return { year: year + 1, month: 1 };
    }

    return { year, month: month + 1 };
  }

  getToday() {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      date: now.getDate(),
    };
  }

  getMonthName(month) {
    const monthNames = [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ];
    return monthNames[month - 1];
  }
}

// グローバルに公開（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.CalendarManager = CalendarManager;
}

// Node.js環境用エクスポート
if (typeof module !== 'undefined') {
  module.exports = { CalendarManager };
}

/*
仕様書駆動開発のポイント:

1. 仕様書を正確に理解
   - SPEC.mdの要件を詳細に分析
   - 曖昧な部分は明確化
   - 受け入れ条件を定義

2. 仕様から直接テストを作成
   - 要件ごとにテストケースを作成
   - 【SPEC準拠】タグで仕様との対応を明確化
   - エッジケースも仕様に基づいて定義

3. テストファーストで実装
   - 仕様理解 → テスト作成 → 実装
   - 仕様変更時はテストから更新
   - 実装が仕様を満たすことを保証

4. 継続的な仕様との整合性確認
   - 仕様書更新時のテスト見直し
   - 新機能追加時の既存仕様への影響確認
   - ドキュメントとコードの同期維持

5. ステークホルダーとの合意形成
   - テストケースを通じた要件確認
   - 受け入れテストとしての活用
   - 仕様理解の共有
*/

// テスト実行
runTests();
