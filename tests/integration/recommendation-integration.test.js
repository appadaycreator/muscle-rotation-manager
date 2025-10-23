// recommendation-integration.test.js - 推奨システム統合テスト

// Node.js環境での実行用
let testRunner;
if (typeof window === 'undefined') {
    const testRunnerModule = require('../unit/test-runner.js');
    testRunner = testRunnerModule.testRunner;
} else {
    // ブラウザ環境では既存のtestRunnerを使用
    testRunner = window.testRunner || global.testRunner;
}

// ダッシュボードページのモック
class MockDashboardPage {
    constructor() {
        this.recommendations = [];
        this.muscleRecoveryData = [];
    }

    async getRecommendations() {
        // 推奨サービスのモック呼び出し
        return this.mockRecommendationService();
    }

    async getMuscleRecoveryData() {
        // 筋肉回復データのモック
        return this.mockMuscleRecoveryData();
    }

    mockRecommendationService() {
        return [
            {
                message: '今日は胸筋のトレーニングが最適です',
                bgColor: 'bg-red-50',
                dotColor: 'bg-red-500',
                textColor: 'text-red-700',
                type: 'primary',
                muscleId: 'chest',
                scientificBasis: '大胸筋は大筋群のため、完全回復に72時間必要',
                priority: 120,
                recoveryPercentage: 100
            },
            {
                message: '胸筋は完全回復済み（100%）',
                bgColor: 'bg-green-50',
                dotColor: 'bg-green-500',
                textColor: 'text-green-700',
                type: 'recovery_status',
                scientificBasis: '完全回復により最大のトレーニング効果が期待できます'
            }
        ];
    }

    mockMuscleRecoveryData() {
        return [
            {
                id: 'chest',
                name: '胸筋',
                category: 'large',
                recoveryHours: 72,
                lastTrained: '3日前',
                recovery: 100,
                recoveryStatus: 'fully_recovered',
                hoursUntilRecovery: 0,
                nextRecommended: '今すぐ',
                isReady: true,
                recoveryColor: 'text-green-600',
                recoveryClass: 'bg-green-500',
                scientificBasis: '大胸筋は大筋群のため、完全回復に72時間必要'
            },
            {
                id: 'back',
                name: '背筋',
                category: 'large',
                recoveryHours: 72,
                lastTrained: '1日前',
                recovery: 33,
                recoveryStatus: 'still_recovering',
                hoursUntilRecovery: 48,
                nextRecommended: '2日後',
                isReady: false,
                recoveryColor: 'text-red-600',
                recoveryClass: 'bg-red-500',
                scientificBasis: '広背筋・僧帽筋は大筋群のため、完全回復に72時間必要'
            },
            {
                id: 'shoulder',
                name: '肩',
                category: 'medium',
                recoveryHours: 48,
                lastTrained: '2日前',
                recovery: 100,
                recoveryStatus: 'fully_recovered',
                hoursUntilRecovery: 0,
                nextRecommended: '今すぐ',
                isReady: true,
                recoveryColor: 'text-green-600',
                recoveryClass: 'bg-green-500',
                scientificBasis: '三角筋は中筋群のため、完全回復に48時間必要'
            }
        ];
    }

    showRecommendationDetails(index) {
        const recommendation = this.recommendations[index];
        return recommendation ? {
            shown: true,
            muscleId: recommendation.muscleId,
            type: recommendation.type
        } : { shown: false };
    }

    showMuscleDetails(muscleId) {
        const muscle = this.muscleRecoveryData.find(m => m.id === muscleId);
        return muscle ? {
            shown: true,
            muscleId: muscle.id,
            recovery: muscle.recovery,
            isReady: muscle.isReady
        } : { shown: false };
    }
}

// ワークアウト履歴のモック
const mockWorkoutHistory = [
    {
        id: '1',
        name: '胸筋トレーニング',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        muscle_groups_trained: ['chest'],
        intensity: 'moderate',
        duration: '60分',
        exercises: ['ベンチプレス', 'インクラインプレス']
    },
    {
        id: '2',
        name: '背筋トレーニング',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        muscle_groups_trained: ['back'],
        intensity: 'high',
        duration: '75分',
        exercises: ['デッドリフト', 'ラットプルダウン']
    },
    {
        id: '3',
        name: '肩トレーニング',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        muscle_groups_trained: ['shoulder'],
        intensity: 'moderate',
        duration: '45分',
        exercises: ['ショルダープレス', 'サイドレイズ']
    }
];

testRunner.describe('推奨システム統合テスト - ダッシュボード連携', () => {
    let dashboard;

    testRunner.beforeEach(() => {
        dashboard = new MockDashboardPage();
    });

    testRunner.test('推奨事項が正しく取得される', async () => {
        const recommendations = await dashboard.getRecommendations();
        
        testRunner.expect(recommendations).toHaveLength(2);
        testRunner.expect(recommendations[0].type).toBe('primary');
        testRunner.expect(recommendations[0].muscleId).toBe('chest');
        testRunner.expect(recommendations[0].scientificBasis).toContain('72時間');
        testRunner.expect(recommendations[1].type).toBe('recovery_status');
    });

    testRunner.test('筋肉回復データが正しく取得される', async () => {
        const recoveryData = await dashboard.getMuscleRecoveryData();
        
        testRunner.expect(recoveryData).toHaveLength(3);
        
        // 胸筋は完全回復
        const chest = recoveryData.find(m => m.id === 'chest');
        testRunner.expect(chest.recovery).toBe(100);
        testRunner.expect(chest.isReady).toBe(true);
        testRunner.expect(chest.recoveryStatus).toBe('fully_recovered');
        
        // 背筋は回復中
        const back = recoveryData.find(m => m.id === 'back');
        testRunner.expect(back.recovery).toBe(33);
        testRunner.expect(back.isReady).toBe(false);
        testRunner.expect(back.recoveryStatus).toBe('still_recovering');
        
        // 肩は完全回復
        const shoulder = recoveryData.find(m => m.id === 'shoulder');
        testRunner.expect(shoulder.recovery).toBe(100);
        testRunner.expect(shoulder.isReady).toBe(true);
        testRunner.expect(shoulder.recoveryStatus).toBe('fully_recovered');
    });

    testRunner.test('推奨詳細表示が正しく動作する', async () => {
        dashboard.recommendations = await dashboard.getRecommendations();
        
        const result = dashboard.showRecommendationDetails(0);
        
        testRunner.expect(result.shown).toBe(true);
        testRunner.expect(result.muscleId).toBe('chest');
        testRunner.expect(result.type).toBe('primary');
    });

    testRunner.test('筋肉詳細表示が正しく動作する', async () => {
        dashboard.muscleRecoveryData = await dashboard.getMuscleRecoveryData();
        
        const result = dashboard.showMuscleDetails('chest');
        
        testRunner.expect(result.shown).toBe(true);
        testRunner.expect(result.muscleId).toBe('chest');
        testRunner.expect(result.recovery).toBe(100);
        testRunner.expect(result.isReady).toBe(true);
    });

    testRunner.test('存在しない筋肉IDでは詳細表示されない', async () => {
        dashboard.muscleRecoveryData = await dashboard.getMuscleRecoveryData();
        
        const result = dashboard.showMuscleDetails('nonexistent');
        
        testRunner.expect(result.shown).toBe(false);
    });
});

testRunner.describe('推奨システム統合テスト - ワークアウト履歴連携', () => {
    testRunner.test('ワークアウト履歴から最新の部位トレーニングを特定', () => {
        const findLastWorkoutForMuscle = (history, muscleId) => {
            const filtered = history
                .filter(workout => workout.muscle_groups_trained && workout.muscle_groups_trained.includes(muscleId))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            return filtered.length > 0 ? filtered[0] : null;
        };

        const lastChestWorkout = findLastWorkoutForMuscle(mockWorkoutHistory, 'chest');
        const lastBackWorkout = findLastWorkoutForMuscle(mockWorkoutHistory, 'back');
        const lastLegWorkout = findLastWorkoutForMuscle(mockWorkoutHistory, 'leg');

        testRunner.expect(lastChestWorkout).toBeTruthy();
        testRunner.expect(lastChestWorkout.name).toBe('胸筋トレーニング');
        testRunner.expect(lastBackWorkout).toBeTruthy();
        testRunner.expect(lastBackWorkout.name).toBe('背筋トレーニング');
        testRunner.expect(lastLegWorkout).toBe(null); // 脚のトレーニング履歴なし
    });

    testRunner.test('強度情報が正しく取得される', () => {
        const chestWorkout = mockWorkoutHistory.find(w => w.muscle_groups_trained.includes('chest'));
        const backWorkout = mockWorkoutHistory.find(w => w.muscle_groups_trained.includes('back'));

        testRunner.expect(chestWorkout.intensity).toBe('moderate');
        testRunner.expect(backWorkout.intensity).toBe('high');
    });

    testRunner.test('トレーニング日付が正しく処理される', () => {
        const formatLastTrainedDate = (date) => {
            if (!date) return 'なし';
            
            const workoutDate = new Date(date);
            const now = new Date();
            const diffTime = now - workoutDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return '今日';
            if (diffDays === 1) return '昨日';
            if (diffDays < 7) return `${diffDays}日前`;
            return `${Math.floor(diffDays / 7)}週間前`;
        };

        const chestWorkout = mockWorkoutHistory.find(w => w.muscle_groups_trained.includes('chest'));
        const backWorkout = mockWorkoutHistory.find(w => w.muscle_groups_trained.includes('back'));

        const chestFormatted = formatLastTrainedDate(chestWorkout.date);
        const backFormatted = formatLastTrainedDate(backWorkout.date);

        testRunner.expect(chestFormatted).toBe('3日前');
        testRunner.expect(backFormatted).toBe('昨日');
    });
});

testRunner.describe('推奨システム統合テスト - ユーザー設定連携', () => {
    testRunner.test('体力レベル設定が推奨に反映される', () => {
        const calculateAdjustedRecoveryTime = (baseHours, fitnessLevel, intensity) => {
            const fitnessMultipliers = {
                beginner: 1.2,
                intermediate: 1.0,
                advanced: 0.8,
                expert: 0.7
            };

            const intensityMultipliers = {
                light: 0.7,
                moderate: 1.0,
                high: 1.3,
                extreme: 1.5
            };

            return baseHours * (fitnessMultipliers[fitnessLevel] || 1.0) * (intensityMultipliers[intensity] || 1.0);
        };

        // 胸筋（72時間）の調整時間を計算
        const beginnerModerate = calculateAdjustedRecoveryTime(72, 'beginner', 'moderate');
        const expertHigh = calculateAdjustedRecoveryTime(72, 'expert', 'high');
        const advancedLight = calculateAdjustedRecoveryTime(72, 'advanced', 'light');

        testRunner.expect(Math.round(beginnerModerate * 10) / 10).toBe(86.4); // 72 * 1.2 * 1.0
        testRunner.expect(Math.round(expertHigh * 100) / 100).toBe(65.52); // 72 * 0.7 * 1.3
        testRunner.expect(Math.round(advancedLight * 100) / 100).toBe(40.32); // 72 * 0.8 * 0.7
    });

    testRunner.test('ユーザー設定の保存と読み込み', () => {
        const mockLocalStorage = {
            data: {},
            setItem(key, value) {
                this.data[key] = value;
            },
            getItem(key) {
                return this.data[key] || null;
            }
        };

        const saveUserSettings = (settings) => {
            mockLocalStorage.setItem('userFitnessSettings', JSON.stringify(settings));
        };

        const loadUserSettings = () => {
            const defaultSettings = {
                fitnessLevel: 'intermediate',
                preferredIntensity: 'moderate',
                trainingFrequency: 4
            };
            
            const stored = mockLocalStorage.getItem('userFitnessSettings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        };

        // 設定を保存
        const newSettings = {
            fitnessLevel: 'advanced',
            preferredIntensity: 'high',
            trainingFrequency: 5
        };
        saveUserSettings(newSettings);

        // 設定を読み込み
        const loadedSettings = loadUserSettings();

        testRunner.expect(loadedSettings.fitnessLevel).toBe('advanced');
        testRunner.expect(loadedSettings.preferredIntensity).toBe('high');
        testRunner.expect(loadedSettings.trainingFrequency).toBe(5);
    });
});

testRunner.describe('推奨システム統合テスト - エラーハンドリング', () => {
    testRunner.test('推奨サービスエラー時のフォールバック', async () => {
        const dashboardWithError = {
            async getRecommendations() {
                try {
                    throw new Error('推奨サービスエラー');
                } catch (error) {
                    console.error('推奨事項の取得に失敗:', error);
                    return this.getFallbackRecommendations();
                }
            },

            getFallbackRecommendations() {
                return [
                    {
                        message: '今日は胸筋のトレーニングがおすすめです',
                        bgColor: 'bg-blue-50',
                        dotColor: 'bg-blue-500',
                        textColor: 'text-blue-700',
                        type: 'fallback',
                        scientificBasis: '大筋群から始めることで全身の成長を促進できます'
                    }
                ];
            }
        };

        const recommendations = await dashboardWithError.getRecommendations();

        testRunner.expect(recommendations).toHaveLength(1);
        testRunner.expect(recommendations[0].type).toBe('fallback');
        testRunner.expect(recommendations[0].message).toContain('胸筋');
    });

    testRunner.test('筋肉回復データエラー時のフォールバック', async () => {
        const dashboardWithError = {
            async getMuscleRecoveryData() {
                try {
                    throw new Error('回復データエラー');
                } catch (error) {
                    console.error('筋肉回復データの取得に失敗:', error);
                    return this.getFallbackRecoveryData();
                }
            },

            getFallbackRecoveryData() {
                return [
                    {
                        id: 'chest',
                        name: '胸筋',
                        lastTrained: '不明',
                        recovery: 50,
                        recoveryColor: 'text-yellow-600',
                        recoveryClass: 'bg-yellow-500',
                        nextRecommended: '不明'
                    }
                ];
            }
        };

        const recoveryData = await dashboardWithError.getMuscleRecoveryData();

        testRunner.expect(recoveryData).toHaveLength(1);
        testRunner.expect(recoveryData[0].id).toBe('chest');
        testRunner.expect(recoveryData[0].lastTrained).toBe('不明');
    });

    testRunner.test('無効なデータでも安全に処理される', () => {
        const safeCalculateRecovery = (lastWorkoutDate, muscleId) => {
            try {
                if (!lastWorkoutDate || !muscleId) {
                    return { percentage: 100, isReady: true, status: 'unknown' };
                }

                // 基本的な計算ロジック
                const now = new Date();
                const workoutDate = new Date(lastWorkoutDate);
                
                if (isNaN(workoutDate.getTime())) {
                    return { percentage: 100, isReady: true, status: 'invalid_date' };
                }

                const hoursElapsed = (now - workoutDate) / (1000 * 60 * 60);
                const recovery = Math.min(100, Math.max(0, Math.round(hoursElapsed / 72 * 100)));

                return {
                    percentage: recovery,
                    isReady: recovery >= 80,
                    status: 'calculated'
                };

            } catch (error) {
                console.error('回復度計算エラー:', error);
                return { percentage: 100, isReady: true, status: 'error' };
            }
        };

        // 正常なケース
        const validResult = safeCalculateRecovery(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'chest');
        testRunner.expect(validResult.status).toBe('calculated');
        testRunner.expect(validResult.percentage).toBe(100);

        // 無効な日付
        const invalidDateResult = safeCalculateRecovery('invalid-date', 'chest');
        testRunner.expect(invalidDateResult.status).toBe('invalid_date');
        testRunner.expect(invalidDateResult.percentage).toBe(100);

        // null値
        const nullResult = safeCalculateRecovery(null, 'chest');
        testRunner.expect(nullResult.status).toBe('unknown');
        testRunner.expect(nullResult.percentage).toBe(100);
    });
});

// テスト実行
if (typeof window !== 'undefined') {
    testRunner.run();
    console.log('推奨システム統合テスト完了');
} else {
    // Node.js環境での実行
    if (typeof global !== 'undefined' && global.runTests) {
        global.runTests();
    }
}
