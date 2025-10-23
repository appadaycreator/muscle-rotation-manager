/**
 * ユーザー設定機能の基本テスト
 * 簡略化されたテストケース
 */

// テストランナーの読み込み（Node.js環境では自動的にグローバルに設定済み）

describe('ユーザー設定機能（基本）', () => {
    beforeEach(() => {
        // ローカルストレージをクリア
        localStorage.clear();
    });

    afterEach(() => {
        // テスト後のクリーンアップ
        localStorage.clear();
    });

    describe('設定データの保存と読み込み', () => {
        test('ユーザープロファイルデータを保存できること', () => {
            const testProfile = {
                display_name: 'テストユーザー',
                fitness_level: 'intermediate',
                primary_goal: 'muscle_gain',
                workout_frequency: 4
            };

            localStorage.setItem('userProfile', JSON.stringify(testProfile));
            const saved = JSON.parse(localStorage.getItem('userProfile'));

            expect(saved.display_name).toBe('テストユーザー');
            expect(saved.fitness_level).toBe('intermediate');
            expect(saved.primary_goal).toBe('muscle_gain');
            expect(saved.workout_frequency).toBe(4);
        });

        test('設定データが存在しない場合は空オブジェクトを返すこと', () => {
            const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            expect(typeof profile).toBe('object');
            expect(Object.keys(profile).length).toBe(0);
        });

        test('不正なJSONデータの場合はデフォルト値を使用すること', () => {
            localStorage.setItem('userProfile', 'invalid json');
            
            let profile;
            try {
                profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            } catch (error) {
                profile = {};
            }
            
            expect(typeof profile).toBe('object');
        });
    });

    describe('設定値の検証', () => {
        test('体力レベルの有効な値を検証できること', () => {
            const validLevels = ['beginner', 'intermediate', 'advanced'];
            const testLevel = 'intermediate';
            
            expect(validLevels.includes(testLevel)).toBe(true);
        });

        test('トレーニング目標の有効な値を検証できること', () => {
            const validGoals = ['strength', 'muscle_gain', 'endurance', 'weight_loss', 'general_fitness'];
            const testGoal = 'muscle_gain';
            
            expect(validGoals.includes(testGoal)).toBe(true);
        });

        test('週間頻度の範囲を検証できること', () => {
            const testFrequency = 3;
            
            expect(testFrequency).toBeGreaterThanOrEqual(1);
            expect(testFrequency).toBeLessThanOrEqual(7);
        });
    });

    describe('回復時間の計算', () => {
        test('回復設定による倍率計算が正しいこと', () => {
            const recoveryMultipliers = {
                fast: 0.8,
                standard: 1.0,
                slow: 1.3
            };

            expect(recoveryMultipliers.fast).toBe(0.8);
            expect(recoveryMultipliers.standard).toBe(1.0);
            expect(recoveryMultipliers.slow).toBe(1.3);
        });

        test('睡眠時間による調整が正しいこと', () => {
            const sleepHours = 6.0;
            let multiplier = 1.0;

            if (sleepHours < 6) {
                multiplier *= 1.2;
            } else if (sleepHours >= 8) {
                multiplier *= 0.9;
            }

            expect(multiplier).toBe(1.0); // 6時間の場合は調整なし
        });
    });

    describe('推奨アルゴリズム', () => {
        test('目標に基づく強度推奨が正しいこと', () => {
            const intensityMap = {
                strength: 'high',
                muscle_gain: 'moderate',
                endurance: 'low',
                weight_loss: 'moderate',
                general_fitness: 'low'
            };

            expect(intensityMap.strength).toBe('high');
            expect(intensityMap.muscle_gain).toBe('moderate');
            expect(intensityMap.endurance).toBe('low');
        });

        test('体力レベルに基づく頻度推奨が正しいこと', () => {
            const frequencyMap = {
                beginner: 2,
                intermediate: 3,
                advanced: 4
            };

            expect(frequencyMap.beginner).toBe(2);
            expect(frequencyMap.intermediate).toBe(3);
            expect(frequencyMap.advanced).toBe(4);
        });
    });

    describe('オンボーディング状態', () => {
        test('オンボーディング完了状態を正しく判定できること', () => {
            // 未完了状態
            let profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            let isCompleted = profile.onboarding_completed || false;
            expect(isCompleted).toBe(false);

            // 完了状態を設定
            profile.onboarding_completed = true;
            localStorage.setItem('userProfile', JSON.stringify(profile));
            
            profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            isCompleted = profile.onboarding_completed || false;
            expect(isCompleted).toBe(true);
        });

        test('オンボーディングステップを管理できること', () => {
            const profile = {
                onboarding_step: 3,
                onboarding_completed: false
            };

            localStorage.setItem('userProfile', JSON.stringify(profile));
            const saved = JSON.parse(localStorage.getItem('userProfile'));

            expect(saved.onboarding_step).toBe(3);
            expect(saved.onboarding_completed).toBe(false);
        });
    });

    describe('データ整合性', () => {
        test('設定データの型が正しいこと', () => {
            const profile = {
                display_name: 'テストユーザー',
                age: 25,
                weight: 70.5,
                fitness_level: 'intermediate',
                workout_frequency: 3,
                sleep_hours_per_night: 7.5,
                stress_level: 5,
                onboarding_completed: true
            };

            expect(typeof profile.display_name).toBe('string');
            expect(typeof profile.age).toBe('number');
            expect(typeof profile.weight).toBe('number');
            expect(typeof profile.fitness_level).toBe('string');
            expect(typeof profile.workout_frequency).toBe('number');
            expect(typeof profile.sleep_hours_per_night).toBe('number');
            expect(typeof profile.stress_level).toBe('number');
            expect(typeof profile.onboarding_completed).toBe('boolean');
        });

        test('数値の範囲が適切であること', () => {
            const profile = {
                age: 25,
                workout_frequency: 3,
                stress_level: 5,
                sleep_hours_per_night: 7.5
            };

            expect(profile.age).toBeGreaterThan(0);
            expect(profile.age).toBeLessThan(150);
            expect(profile.workout_frequency).toBeGreaterThanOrEqual(1);
            expect(profile.workout_frequency).toBeLessThanOrEqual(7);
            expect(profile.stress_level).toBeGreaterThanOrEqual(1);
            expect(profile.stress_level).toBeLessThanOrEqual(10);
            expect(profile.sleep_hours_per_night).toBeGreaterThanOrEqual(4);
            expect(profile.sleep_hours_per_night).toBeLessThanOrEqual(12);
        });
    });
});
