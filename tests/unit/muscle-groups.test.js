/**
 * 筋肉部位管理機能のユニットテスト
 * テスト駆動開発用のサンプルテストケース
 */

// テストランナーの読み込み（ブラウザ環境では不要）
if (typeof require !== 'undefined') {
    const { test, describe, expect, beforeEach } = require('./test-runner.js');
}

describe('筋肉部位管理機能', () => {
    let muscleGroups;

    beforeEach(() => {
        // テスト用の筋肉部位データを初期化
        muscleGroups = {
            chest: { name: '胸', recoveryHours: 72, lastWorkout: null },
            back: { name: '背中', recoveryHours: 72, lastWorkout: null },
            shoulders: { name: '肩', recoveryHours: 48, lastWorkout: null },
            arms: { name: '腕', recoveryHours: 48, lastWorkout: null },
            legs: { name: '脚', recoveryHours: 72, lastWorkout: null },
            abs: { name: '腹', recoveryHours: 24, lastWorkout: null }
        };
    });

    test('筋肉部位の基本データが正しく定義されている', () => {
        expect(Object.keys(muscleGroups)).toHaveLength(6);
        expect(muscleGroups.chest.name).toBe('胸');
        expect(muscleGroups.back.recoveryHours).toBe(72);
        expect(muscleGroups.shoulders.recoveryHours).toBe(48);
    });

    test('大筋群の回復時間が72時間に設定されている', () => {
        const largeMuscleGroups = ['chest', 'back', 'legs'];
        largeMuscleGroups.forEach(group => {
            expect(muscleGroups[group].recoveryHours).toBe(72);
        });
    });

    test('小筋群の回復時間が48時間に設定されている', () => {
        const smallMuscleGroups = ['shoulders', 'arms'];
        smallMuscleGroups.forEach(group => {
            expect(muscleGroups[group].recoveryHours).toBe(48);
        });
    });

    test('腹筋の回復時間が24時間に設定されている', () => {
        expect(muscleGroups.abs.recoveryHours).toBe(24);
    });

    test('初期状態では全ての部位のlastWorkoutがnullである', () => {
        Object.values(muscleGroups).forEach(group => {
            expect(group.lastWorkout).toBe(null);
        });
    });
});

describe('回復期間計算機能', () => {
    test('回復期間を正しく計算できる', () => {
        const calculateRecoveryTime = (lastWorkout, recoveryHours) => {
            if (!lastWorkout) return 0;
            const now = new Date();
            const lastWorkoutTime = new Date(lastWorkout);
            const timeDiff = now - lastWorkoutTime;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            return Math.max(0, recoveryHours - hoursDiff);
        };

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const remainingRecovery = calculateRecoveryTime(yesterday, 72);
        expect(remainingRecovery).toBe(48); // 72 - 24 = 48時間
    });

    test('回復完了した部位は0時間を返す', () => {
        const calculateRecoveryTime = (lastWorkout, recoveryHours) => {
            if (!lastWorkout) return 0;
            const now = new Date();
            const lastWorkoutTime = new Date(lastWorkout);
            const timeDiff = now - lastWorkoutTime;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            return Math.max(0, recoveryHours - hoursDiff);
        };

        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        
        const remainingRecovery = calculateRecoveryTime(threeDaysAgo, 72);
        expect(remainingRecovery).toBe(0); // 72時間経過済み
    });
});

describe('推奨部位選択機能', () => {
    test('回復完了した部位を推奨リストに含める', () => {
        const getRecommendedMuscleGroups = (muscleGroups) => {
            const now = new Date();
            return Object.entries(muscleGroups).filter(([key, group]) => {
                if (!group.lastWorkout) return true;
                const lastWorkoutTime = new Date(group.lastWorkout);
                const timeDiff = now - lastWorkoutTime;
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                return hoursDiff >= group.recoveryHours;
            }).map(([key, group]) => ({ key, ...group }));
        };

        const testMuscleGroups = {
            chest: { name: '胸', recoveryHours: 72, lastWorkout: null },
            back: { name: '背中', recoveryHours: 72, lastWorkout: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            shoulders: { name: '肩', recoveryHours: 48, lastWorkout: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        };

        const recommended = getRecommendedMuscleGroups(testMuscleGroups);
        expect(recommended).toHaveLength(2); // chest (null) と back (3日前)
        expect(recommended.find(g => g.key === 'chest')).toBeTruthy();
        expect(recommended.find(g => g.key === 'back')).toBeTruthy();
    });

    test('回復中の部位は推奨リストから除外される', () => {
        const getRecommendedMuscleGroups = (muscleGroups) => {
            const now = new Date();
            return Object.entries(muscleGroups).filter(([key, group]) => {
                if (!group.lastWorkout) return true;
                const lastWorkoutTime = new Date(group.lastWorkout);
                const timeDiff = now - lastWorkoutTime;
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                return hoursDiff >= group.recoveryHours;
            }).map(([key, group]) => ({ key, ...group }));
        };

        const testMuscleGroups = {
            chest: { name: '胸', recoveryHours: 72, lastWorkout: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }, // 1日前（回復中）
            shoulders: { name: '肩', recoveryHours: 48, lastWorkout: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } // 1日前（回復中）
        };

        const recommended = getRecommendedMuscleGroups(testMuscleGroups);
        expect(recommended).toHaveLength(0); // 全て回復中
    });
});

describe('ローテーション分割機能', () => {
    test('2分割ローテーションが正しく生成される', () => {
        const create2DaySplit = () => {
            return [
                { name: '上半身', groups: ['chest', 'back', 'shoulders', 'arms'] },
                { name: '下半身', groups: ['legs', 'abs'] }
            ];
        };

        const split = create2DaySplit();
        expect(split).toHaveLength(2);
        expect(split[0].groups).toContain('chest');
        expect(split[0].groups).toContain('back');
        expect(split[1].groups).toContain('legs');
    });

    test('3分割ローテーションが正しく生成される', () => {
        const create3DaySplit = () => {
            return [
                { name: 'プッシュ', groups: ['chest', 'shoulders'] },
                { name: 'プル', groups: ['back', 'arms'] },
                { name: 'レッグ', groups: ['legs', 'abs'] }
            ];
        };

        const split = create3DaySplit();
        expect(split).toHaveLength(3);
        expect(split[0].groups).toContain('chest');
        expect(split[1].groups).toContain('back');
        expect(split[2].groups).toContain('legs');
    });

    test('4分割ローテーションが正しく生成される', () => {
        const create4DaySplit = () => {
            return [
                { name: '胸・三頭', groups: ['chest'] },
                { name: '背中・二頭', groups: ['back', 'arms'] },
                { name: '肩', groups: ['shoulders'] },
                { name: '脚・腹', groups: ['legs', 'abs'] }
            ];
        };

        const split = create4DaySplit();
        expect(split).toHaveLength(4);
        expect(split[0].groups).toContain('chest');
        expect(split[1].groups).toContain('back');
        expect(split[2].groups).toContain('shoulders');
        expect(split[3].groups).toContain('legs');
    });
});

// ブラウザ環境でのテスト実行
if (typeof window !== 'undefined') {
    console.log('🧪 筋肉部位管理機能のユニットテストを実行します...');
}
