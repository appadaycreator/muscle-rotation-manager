// recommendation-algorithm.test.js - 推奨アルゴリズムのテスト

// Node.js環境での実行用
let testRunner;
if (typeof window === 'undefined') {
    const testRunnerModule = require('./test-runner.js');
    testRunner = testRunnerModule.testRunner;
} else {
    // ブラウザ環境では既存のtestRunnerを使用
    testRunner = window.testRunner || global.testRunner;
}

// 推奨サービスのモック実装
class MockRecommendationService {
    constructor() {
        this.userSettings = {
            fitnessLevel: 'intermediate',
            preferredIntensity: 'moderate',
            trainingFrequency: 4,
            restDayPreference: 'sunday'
        };
    }

    calculateRecoveryPercentage(lastWorkoutDate, muscleGroupId, lastIntensity = 'moderate') {
        if (!lastWorkoutDate) {
            return {
                percentage: 100,
                status: 'fully_recovered',
                hoursUntilRecovery: 0,
                isReady: true
            };
        }

        // 筋肉部位の基本回復時間
        const recoveryHours = {
            chest: 72, back: 72, leg: 72,
            shoulder: 48, arm: 48,
            core: 24
        };

        const baseRecoveryHours = recoveryHours[muscleGroupId] || 48;

        // 強度による調整
        const intensityMultipliers = {
            light: 0.7, moderate: 1.0, high: 1.3, extreme: 1.5
        };
        const intensityMultiplier = intensityMultipliers[lastIntensity] || 1.0;

        // 体力レベルによる調整
        const fitnessMultipliers = {
            beginner: 1.2, intermediate: 1.0, advanced: 0.8, expert: 0.7
        };
        const fitnessMultiplier = fitnessMultipliers[this.userSettings.fitnessLevel] || 1.0;

        const adjustedRecoveryHours = baseRecoveryHours * intensityMultiplier * fitnessMultiplier;

        // 経過時間を計算
        const now = new Date();
        const timeDiff = now - new Date(lastWorkoutDate);
        const hoursElapsed = timeDiff / (1000 * 60 * 60);

        const recoveryPercentage = Math.min(100, Math.max(0, Math.round((hoursElapsed / adjustedRecoveryHours) * 100)));
        const hoursUntilRecovery = Math.max(0, adjustedRecoveryHours - hoursElapsed);

        let status;
        if (recoveryPercentage >= 100) status = 'fully_recovered';
        else if (recoveryPercentage >= 80) status = 'mostly_recovered';
        else if (recoveryPercentage >= 50) status = 'partially_recovered';
        else status = 'still_recovering';

        return {
            percentage: recoveryPercentage,
            status,
            hoursUntilRecovery: Math.round(hoursUntilRecovery * 10) / 10,
            isReady: recoveryPercentage >= 80,
            adjustedRecoveryHours: Math.round(adjustedRecoveryHours * 10) / 10,
            factors: {
                baseHours: baseRecoveryHours,
                intensityMultiplier,
                fitnessMultiplier,
                lastIntensity
            }
        };
    }

    prioritizeMuscles(readyMuscles, allMuscles) {
        return readyMuscles.map(muscle => {
            let priority = 0;
            
            // 回復度による優先度
            priority += muscle.recovery;
            
            // 最後のトレーニングからの経過時間による優先度
            if (muscle.lastWorkout) {
                const daysSinceLastWorkout = this.getDaysSinceLastWorkout(muscle.lastWorkout.date);
                priority += Math.min(daysSinceLastWorkout * 10, 50);
            } else {
                priority += 100; // 未トレーニング部位は最高優先度
            }
            
            // 大筋群は優先度を上げる
            if (muscle.category === 'large') {
                priority += 20;
            }
            
            return {
                ...muscle,
                priority: Math.round(priority)
            };
        }).sort((a, b) => b.priority - a.priority);
    }

    getDaysSinceLastWorkout(date) {
        if (!date) return 999;
        const workoutDate = new Date(date);
        const now = new Date();
        const diffTime = now - workoutDate;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    updateUserSettings(newSettings) {
        this.userSettings = { ...this.userSettings, ...newSettings };
    }
}

// testRunnerは上で定義済み

// テストデータ
const testMuscleGroups = [
    {
        id: 'chest', name: '胸筋', category: 'large', recoveryHours: 72,
        scientificBasis: '大胸筋は大筋群のため、完全回復に72時間必要'
    },
    {
        id: 'back', name: '背筋', category: 'large', recoveryHours: 72,
        scientificBasis: '広背筋・僧帽筋は大筋群のため、完全回復に72時間必要'
    },
    {
        id: 'shoulder', name: '肩', category: 'medium', recoveryHours: 48,
        scientificBasis: '三角筋は中筋群のため、完全回復に48時間必要'
    },
    {
        id: 'arm', name: '腕', category: 'medium', recoveryHours: 48,
        scientificBasis: '上腕二頭筋・三頭筋は中筋群のため、完全回復に48時間必要'
    },
    {
        id: 'leg', name: '脚', category: 'large', recoveryHours: 72,
        scientificBasis: '大腿四頭筋・ハムストリングは大筋群のため、完全回復に72時間必要'
    },
    {
        id: 'core', name: '体幹', category: 'small', recoveryHours: 24,
        scientificBasis: '腹筋群は小筋群のため、完全回復に24時間必要'
    }
];

testRunner.describe('推奨アルゴリズム - 回復度計算', () => {
    let service;

    testRunner.beforeEach(() => {
        service = new MockRecommendationService();
    });

    testRunner.test('未トレーニング部位は100%回復として扱われる', () => {
        const result = service.calculateRecoveryPercentage(null, 'chest');
        
        testRunner.expect(result.percentage).toBe(100);
        testRunner.expect(result.status).toBe('fully_recovered');
        testRunner.expect(result.isReady).toBe(true);
        testRunner.expect(result.hoursUntilRecovery).toBe(0);
    });

    testRunner.test('大筋群（胸筋）の72時間回復計算が正確', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(threeDaysAgo, 'chest', 'moderate');
        
        testRunner.expect(result.percentage).toBe(100);
        testRunner.expect(result.status).toBe('fully_recovered');
        testRunner.expect(result.isReady).toBe(true);
        testRunner.expect(result.factors.baseHours).toBe(72);
    });

    testRunner.test('中筋群（肩）の48時間回復計算が正確', () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(twoDaysAgo, 'shoulder', 'moderate');
        
        testRunner.expect(result.percentage).toBe(100);
        testRunner.expect(result.status).toBe('fully_recovered');
        testRunner.expect(result.isReady).toBe(true);
        testRunner.expect(result.factors.baseHours).toBe(48);
    });

    testRunner.test('小筋群（体幹）の24時間回復計算が正確', () => {
        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(oneDayAgo, 'core', 'moderate');
        
        testRunner.expect(result.percentage).toBe(100);
        testRunner.expect(result.status).toBe('fully_recovered');
        testRunner.expect(result.isReady).toBe(true);
        testRunner.expect(result.factors.baseHours).toBe(24);
    });

    testRunner.test('回復中の部位は正確な回復度を返す', () => {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(twelveHoursAgo, 'chest', 'moderate');
        
        // 12時間 / 72時間 = 16.67% ≈ 17%
        testRunner.expect(result.percentage).toBe(17);
        testRunner.expect(result.status).toBe('still_recovering');
        testRunner.expect(result.isReady).toBe(false);
        testRunner.expect(result.hoursUntilRecovery).toBeGreaterThan(0);
    });
});

testRunner.describe('推奨アルゴリズム - 強度調整', () => {
    let service;

    testRunner.beforeEach(() => {
        service = new MockRecommendationService();
    });

    testRunner.test('軽い強度は回復時間を30%短縮', () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(twoDaysAgo, 'chest', 'light');
        
        // 72 * 0.7 = 50.4時間, 48時間経過で95%回復
        testRunner.expect(result.percentage).toBeGreaterThan(90);
        testRunner.expect(result.factors.intensityMultiplier).toBe(0.7);
        testRunner.expect(result.isReady).toBe(true);
    });

    testRunner.test('高強度は回復時間を30%延長', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(threeDaysAgo, 'chest', 'high');
        
        // 72 * 1.3 = 93.6時間, 72時間経過で77%回復
        testRunner.expect(result.percentage).toBeLessThan(80);
        testRunner.expect(result.factors.intensityMultiplier).toBe(1.3);
        testRunner.expect(result.isReady).toBe(false);
    });

    testRunner.test('極高強度は回復時間を50%延長', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(threeDaysAgo, 'chest', 'extreme');
        
        // 72 * 1.5 = 108時間, 72時間経過で67%回復
        testRunner.expect(result.percentage).toBeLessThan(70);
        testRunner.expect(result.factors.intensityMultiplier).toBe(1.5);
        testRunner.expect(result.isReady).toBe(false);
    });
});

testRunner.describe('推奨アルゴリズム - 体力レベル調整', () => {
    let service;

    testRunner.beforeEach(() => {
        service = new MockRecommendationService();
    });

    testRunner.test('初心者は回復時間が20%延長される', () => {
        service.updateUserSettings({ fitnessLevel: 'beginner' });
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(threeDaysAgo, 'chest', 'moderate');
        
        // 72 * 1.2 = 86.4時間, 72時間経過で83%回復
        testRunner.expect(result.percentage).toBeLessThan(90);
        testRunner.expect(result.factors.fitnessMultiplier).toBe(1.2);
        testRunner.expect(result.isReady).toBe(true); // 80%以上なので推奨対象
    });

    testRunner.test('上級者は回復時間が20%短縮される', () => {
        service.updateUserSettings({ fitnessLevel: 'advanced' });
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(twoDaysAgo, 'chest', 'moderate');
        
        // 72 * 0.8 = 57.6時間, 48時間経過で83%回復
        testRunner.expect(result.percentage).toBeGreaterThan(80);
        testRunner.expect(result.factors.fitnessMultiplier).toBe(0.8);
        testRunner.expect(result.isReady).toBe(true);
    });

    testRunner.test('エキスパートは回復時間が30%短縮される', () => {
        service.updateUserSettings({ fitnessLevel: 'expert' });
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(twoDaysAgo, 'chest', 'moderate');
        
        // 72 * 0.7 = 50.4時間, 48時間経過で95%回復
        testRunner.expect(result.percentage).toBeGreaterThan(90);
        testRunner.expect(result.factors.fitnessMultiplier).toBe(0.7);
        testRunner.expect(result.isReady).toBe(true);
    });
});

testRunner.describe('推奨アルゴリズム - 優先度計算', () => {
    let service;

    testRunner.beforeEach(() => {
        service = new MockRecommendationService();
    });

    testRunner.test('未トレーニング部位が最高優先度を持つ', () => {
        const muscles = [
            { id: 'chest', name: '胸筋', category: 'large', recovery: 100, lastWorkout: null },
            { id: 'back', name: '背筋', category: 'large', recovery: 100, 
              lastWorkout: { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } }
        ];

        const prioritized = service.prioritizeMuscles(muscles, muscles);
        
        testRunner.expect(prioritized[0].id).toBe('chest');
        testRunner.expect(prioritized[0].priority).toBeGreaterThan(prioritized[1].priority);
    });

    testRunner.test('大筋群は中筋群より優先度が高い', () => {
        const muscles = [
            { id: 'chest', name: '胸筋', category: 'large', recovery: 100, lastWorkout: null },
            { id: 'shoulder', name: '肩', category: 'medium', recovery: 100, lastWorkout: null }
        ];

        const prioritized = service.prioritizeMuscles(muscles, muscles);
        
        testRunner.expect(prioritized[0].id).toBe('chest');
        testRunner.expect(prioritized[0].priority).toBeGreaterThan(prioritized[1].priority);
    });

    testRunner.test('長期間トレーニングしていない部位の優先度が上がる', () => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        const muscles = [
            { id: 'chest', name: '胸筋', category: 'large', recovery: 100, 
              lastWorkout: { date: oneWeekAgo } },
            { id: 'back', name: '背筋', category: 'large', recovery: 100, 
              lastWorkout: { date: threeDaysAgo } }
        ];

        const prioritized = service.prioritizeMuscles(muscles, muscles);
        
        testRunner.expect(prioritized[0].id).toBe('chest');
        testRunner.expect(prioritized[0].priority).toBeGreaterThan(prioritized[1].priority);
    });
});

testRunner.describe('推奨アルゴリズム - 回復ステータス', () => {
    let service;

    testRunner.beforeEach(() => {
        service = new MockRecommendationService();
    });

    testRunner.test('100%回復は完全回復ステータス', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(threeDaysAgo, 'chest', 'moderate');
        
        testRunner.expect(result.status).toBe('fully_recovered');
        testRunner.expect(result.isReady).toBe(true);
    });

    testRunner.test('80-99%回復はほぼ回復ステータス', () => {
        const twoAndHalfDaysAgo = new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(twoAndHalfDaysAgo, 'chest', 'moderate');
        
        testRunner.expect(result.status).toBe('mostly_recovered');
        testRunner.expect(result.isReady).toBe(true);
    });

    testRunner.test('50-79%回復は部分回復ステータス', () => {
        const oneDayAgo = new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(oneDayAgo, 'chest', 'moderate');
        
        testRunner.expect(result.status).toBe('partially_recovered');
        testRunner.expect(result.isReady).toBe(false);
    });

    testRunner.test('50%未満は回復中ステータス', () => {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(twelveHoursAgo, 'chest', 'moderate');
        
        testRunner.expect(result.status).toBe('still_recovering');
        testRunner.expect(result.isReady).toBe(false);
    });
});

testRunner.describe('推奨アルゴリズム - 複合条件テスト', () => {
    let service;

    testRunner.beforeEach(() => {
        service = new MockRecommendationService();
    });

    testRunner.test('初心者の高強度トレーニング後の回復計算', () => {
        service.updateUserSettings({ fitnessLevel: 'beginner' });
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(threeDaysAgo, 'chest', 'high');
        
        // 72 * 1.3 * 1.2 = 112.32時間, 72時間経過で64%回復
        testRunner.expect(result.percentage).toBeLessThan(70);
        testRunner.expect(result.isReady).toBe(false);
        testRunner.expect(result.factors.intensityMultiplier).toBe(1.3);
        testRunner.expect(result.factors.fitnessMultiplier).toBe(1.2);
    });

    testRunner.test('上級者の軽強度トレーニング後の回復計算', () => {
        service.updateUserSettings({ fitnessLevel: 'advanced' });
        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(oneDayAgo, 'chest', 'light');
        
        // 72 * 0.7 * 0.8 = 40.32時間, 24時間経過で59%回復
        testRunner.expect(result.percentage).toBeGreaterThan(50);
        testRunner.expect(result.isReady).toBe(false);
        testRunner.expect(result.factors.intensityMultiplier).toBe(0.7);
        testRunner.expect(result.factors.fitnessMultiplier).toBe(0.8);
    });

    testRunner.test('エキスパートの極高強度トレーニング後でも効率的回復', () => {
        service.updateUserSettings({ fitnessLevel: 'expert' });
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(threeDaysAgo, 'chest', 'extreme');
        
        // 72 * 1.5 * 0.7 = 75.6時間, 72時間経過で95%回復
        testRunner.expect(result.percentage).toBeGreaterThan(90);
        testRunner.expect(result.isReady).toBe(true);
        testRunner.expect(result.factors.intensityMultiplier).toBe(1.5);
        testRunner.expect(result.factors.fitnessMultiplier).toBe(0.7);
    });
});

testRunner.describe('推奨アルゴリズム - エッジケース', () => {
    let service;

    testRunner.beforeEach(() => {
        service = new MockRecommendationService();
    });

    testRunner.test('無効な筋肉部位IDでもエラーにならない', () => {
        const result = service.calculateRecoveryPercentage(new Date(), 'invalid_muscle', 'moderate');
        
        // デフォルト値（48時間）が使用される
        testRunner.expect(result.factors.baseHours).toBe(48);
        testRunner.expect(typeof result.percentage).toBe('number');
    });

    testRunner.test('無効な強度でもデフォルト値が使用される', () => {
        const result = service.calculateRecoveryPercentage(new Date(), 'chest', 'invalid_intensity');
        
        testRunner.expect(result.factors.intensityMultiplier).toBe(1.0);
    });

    testRunner.test('未来の日付でも適切に処理される', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(futureDate, 'chest', 'moderate');
        
        // 未来の日付では負の値になるが、Math.maxで0以下にクランプされる
        testRunner.expect(result.percentage).toBeLessThanOrEqual(0);
        testRunner.expect(result.isReady).toBe(false);
    });

    testRunner.test('非常に古い日付でも100%を超えない', () => {
        const veryOldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = service.calculateRecoveryPercentage(veryOldDate, 'chest', 'moderate');
        
        testRunner.expect(result.percentage).toBe(100);
        testRunner.expect(result.isReady).toBe(true);
    });
});

// テスト実行
if (typeof window !== 'undefined') {
    testRunner.run();
    console.log('推奨アルゴリズムテスト完了');
} else {
    // Node.js環境での実行
    if (typeof global !== 'undefined' && global.runTests) {
        global.runTests();
    }
}
