/**
 * テスト駆動開発（TDD）の実践例
 * Red → Green → Refactor サイクルの実演
 */

// テストランナーの読み込み（ブラウザ環境では不要）
if (typeof require !== 'undefined') {
    const { test, describe, expect, beforeEach } = require('../unit/test-runner.js');
}

/**
 * TDD実践例: ワークアウト統計計算機能
 * 
 * 要件:
 * - ワークアウトデータから統計情報を計算する
 * - 総ボリューム（重量×回数×セット数）を計算
 * - 平均重量を計算
 * - 最大重量を取得
 * - 部位別の統計を提供
 */

describe('TDD実践例: ワークアウト統計計算機能', () => {
    let workoutStats;
    let sampleWorkouts;

    beforeEach(() => {
        // Step 1: Red - まずテストを書く（実装はまだない）
        workoutStats = new WorkoutStatsCalculator();
        
        sampleWorkouts = [
            {
                date: '2024-01-01',
                exercises: [
                    {
                        name: 'ベンチプレス',
                        muscleGroup: 'chest',
                        sets: [
                            { weight: 80, reps: 10 },
                            { weight: 85, reps: 8 },
                            { weight: 90, reps: 6 }
                        ]
                    },
                    {
                        name: 'インクラインプレス',
                        muscleGroup: 'chest',
                        sets: [
                            { weight: 70, reps: 12 },
                            { weight: 75, reps: 10 }
                        ]
                    }
                ]
            },
            {
                date: '2024-01-03',
                exercises: [
                    {
                        name: 'スクワット',
                        muscleGroup: 'legs',
                        sets: [
                            { weight: 100, reps: 12 },
                            { weight: 110, reps: 10 },
                            { weight: 120, reps: 8 }
                        ]
                    }
                ]
            }
        ];
    });

    // Red Phase: テストを先に書く（実装前なので失敗する）
    test('総ボリュームを正しく計算できる', () => {
        const totalVolume = workoutStats.calculateTotalVolume(sampleWorkouts);
        
        // 期待値の計算:
        // ベンチプレス: (80*10) + (85*8) + (90*6) = 800 + 680 + 540 = 2020
        // インクライン: (70*12) + (75*10) = 840 + 750 = 1590
        // スクワット: (100*12) + (110*10) + (120*8) = 1200 + 1100 + 960 = 3260
        // 合計: 2020 + 1590 + 3260 = 6870
        expect(totalVolume).toBe(6870);
    });

    test('平均重量を正しく計算できる', () => {
        const avgWeight = workoutStats.calculateAverageWeight(sampleWorkouts);
        
        // 全セットの重量: 80,85,90,70,75,100,110,120
        // 平均: (80+85+90+70+75+100+110+120) / 8 = 730 / 8 = 91.25
        expect(avgWeight).toBe(91.25);
    });

    test('最大重量を正しく取得できる', () => {
        const maxWeight = workoutStats.getMaxWeight(sampleWorkouts);
        expect(maxWeight).toBe(120);
    });

    test('部位別統計を正しく計算できる', () => {
        const statsByMuscleGroup = workoutStats.getStatsByMuscleGroup(sampleWorkouts);
        
        expect(statsByMuscleGroup.chest.totalVolume).toBe(3610); // 2020 + 1590
        expect(statsByMuscleGroup.chest.exerciseCount).toBe(2);
        expect(statsByMuscleGroup.legs.totalVolume).toBe(3260);
        expect(statsByMuscleGroup.legs.exerciseCount).toBe(1);
    });

    test('空のデータに対して適切に処理する', () => {
        const emptyStats = workoutStats.calculateTotalVolume([]);
        expect(emptyStats).toBe(0);
        
        const emptyAvg = workoutStats.calculateAverageWeight([]);
        expect(emptyAvg).toBe(0);
        
        const emptyMax = workoutStats.getMaxWeight([]);
        expect(emptyMax).toBe(0);
    });

    test('無効なデータに対してエラーを発生させる', () => {
        expect(() => {
            workoutStats.calculateTotalVolume(null);
        }).toThrow('無効なワークアウトデータです');
        
        expect(() => {
            workoutStats.calculateTotalVolume('invalid');
        }).toThrow('無効なワークアウトデータです');
    });
});

// Green Phase: テストを通すための最小限の実装
class WorkoutStatsCalculator {
    calculateTotalVolume(workouts) {
        if (!workouts || !Array.isArray(workouts)) {
            throw new Error('無効なワークアウトデータです');
        }
        
        if (workouts.length === 0) return 0;
        
        let totalVolume = 0;
        
        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    totalVolume += set.weight * set.reps;
                });
            });
        });
        
        return totalVolume;
    }
    
    calculateAverageWeight(workouts) {
        if (!workouts || !Array.isArray(workouts)) {
            throw new Error('無効なワークアウトデータです');
        }
        
        if (workouts.length === 0) return 0;
        
        let totalWeight = 0;
        let setCount = 0;
        
        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    totalWeight += set.weight;
                    setCount++;
                });
            });
        });
        
        return setCount > 0 ? totalWeight / setCount : 0;
    }
    
    getMaxWeight(workouts) {
        if (!workouts || !Array.isArray(workouts)) {
            throw new Error('無効なワークアウトデータです');
        }
        
        if (workouts.length === 0) return 0;
        
        let maxWeight = 0;
        
        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    if (set.weight > maxWeight) {
                        maxWeight = set.weight;
                    }
                });
            });
        });
        
        return maxWeight;
    }
    
    getStatsByMuscleGroup(workouts) {
        if (!workouts || !Array.isArray(workouts)) {
            throw new Error('無効なワークアウトデータです');
        }
        
        const stats = {};
        
        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                const muscleGroup = exercise.muscleGroup;
                
                if (!stats[muscleGroup]) {
                    stats[muscleGroup] = {
                        totalVolume: 0,
                        exerciseCount: 0,
                        totalSets: 0
                    };
                }
                
                stats[muscleGroup].exerciseCount++;
                
                exercise.sets.forEach(set => {
                    stats[muscleGroup].totalVolume += set.weight * set.reps;
                    stats[muscleGroup].totalSets++;
                });
            });
        });
        
        return stats;
    }
}

// Refactor Phase: コードの改善（テストは変更しない）
describe('TDD実践例: リファクタリング後の改善版', () => {
    let improvedStats;

    beforeEach(() => {
        improvedStats = new ImprovedWorkoutStatsCalculator();
    });

    test('リファクタリング後も同じ結果を返す', () => {
        const sampleWorkouts = [
            {
                exercises: [
                    {
                        muscleGroup: 'chest',
                        sets: [{ weight: 80, reps: 10 }]
                    }
                ]
            }
        ];
        
        const volume = improvedStats.calculateTotalVolume(sampleWorkouts);
        expect(volume).toBe(800);
    });
});

// Refactor Phase: より保守性の高い実装
class ImprovedWorkoutStatsCalculator {
    calculateTotalVolume(workouts) {
        this._validateWorkouts(workouts);
        if (workouts.length === 0) return 0;
        
        return this._getAllSets(workouts)
            .reduce((total, set) => total + (set.weight * set.reps), 0);
    }
    
    calculateAverageWeight(workouts) {
        this._validateWorkouts(workouts);
        if (workouts.length === 0) return 0;
        
        const allSets = this._getAllSets(workouts);
        const totalWeight = allSets.reduce((sum, set) => sum + set.weight, 0);
        
        return allSets.length > 0 ? totalWeight / allSets.length : 0;
    }
    
    getMaxWeight(workouts) {
        this._validateWorkouts(workouts);
        if (workouts.length === 0) return 0;
        
        const weights = this._getAllSets(workouts).map(set => set.weight);
        return Math.max(...weights);
    }
    
    getStatsByMuscleGroup(workouts) {
        this._validateWorkouts(workouts);
        
        const stats = {};
        
        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                const group = exercise.muscleGroup;
                
                if (!stats[group]) {
                    stats[group] = { totalVolume: 0, exerciseCount: 0, totalSets: 0 };
                }
                
                stats[group].exerciseCount++;
                stats[group].totalSets += exercise.sets.length;
                stats[group].totalVolume += exercise.sets
                    .reduce((sum, set) => sum + (set.weight * set.reps), 0);
            });
        });
        
        return stats;
    }
    
    // プライベートメソッド: 共通処理の抽出
    _validateWorkouts(workouts) {
        if (!workouts || !Array.isArray(workouts)) {
            throw new Error('無効なワークアウトデータです');
        }
    }
    
    _getAllSets(workouts) {
        return workouts.flatMap(workout => 
            workout.exercises.flatMap(exercise => exercise.sets)
        );
    }
}

// グローバルに公開（ブラウザ環境用）
if (typeof window !== 'undefined') {
    window.WorkoutStatsCalculator = WorkoutStatsCalculator;
    window.ImprovedWorkoutStatsCalculator = ImprovedWorkoutStatsCalculator;
}

// Node.js環境用エクスポート
if (typeof module !== 'undefined') {
    module.exports = { WorkoutStatsCalculator, ImprovedWorkoutStatsCalculator };
}

/*
TDDサイクルの実践ポイント:

1. Red Phase (失敗するテストを書く)
   - 要件を明確にする
   - 期待する動作をテストで表現
   - 実装前にテストを実行して失敗を確認

2. Green Phase (テストを通す最小限の実装)
   - テストを通すことだけに集中
   - 美しいコードは後回し
   - 動作することを最優先

3. Refactor Phase (コードの改善)
   - テストが通った状態で改善
   - 重複の除去
   - 可読性・保守性の向上
   - テストは変更しない

4. 継続的な改善
   - 新しい要件が来たら再びRedから開始
   - 小さなサイクルを繰り返す
   - テストがあることで安心してリファクタリング可能
*/
