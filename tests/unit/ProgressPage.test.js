// ProgressPage.test.js - プログレスページのテスト

import { progressPage } from '../../js/pages/progressPage.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getCurrentUser: jest.fn(() => Promise.resolve({ id: 'test-user-id' })),
        getClient: jest.fn(() => ({
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
                    }))
                }))
            }))
        }))
    }
}));

jest.mock('../../js/services/progressTrackingService.js', () => ({
    progressTrackingService: {
        getProgressHistory: jest.fn(() => Promise.resolve([])),
        calculateGoalProgress: jest.fn(() => Promise.resolve({ progress: [] }))
    }
}));

jest.mock('../../js/services/chartService.js', () => ({
    chartService: {
        createLineChart: jest.fn(),
        destroyAllCharts: jest.fn()
    }
}));

jest.mock('../../js/services/reportService.js', () => ({
    reportService: {
        generateProgressReport: jest.fn(() => Promise.resolve({}))
    }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

jest.mock('../../js/utils/helpers.js', () => ({
    safeGetElement: jest.fn((id) => {
        if (id === 'main') {
            return { innerHTML: '' };
        }
        return null;
    }),
    safeGetElements: jest.fn(() => [])
}));

jest.mock('../../js/utils/tooltip.js', () => ({
    tooltipManager: {
        initialize: jest.fn(),
        addTooltip: jest.fn()
    }
}));

describe('ProgressPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateOneRM', () => {
        test('1回の場合は重量をそのまま返す', () => {
            const result = progressPage.calculateOneRM(100, 1);
            expect(result).toBe(100);
        });

        test('複数回の場合はEpley公式で計算', () => {
            const result = progressPage.calculateOneRM(100, 10);
            expect(result).toBe(133.33);
        });

        test('重量が0の場合は0を返す', () => {
            const result = progressPage.calculateOneRM(0, 5);
            expect(result).toBe(0);
        });

        test('回数が0の場合は0を返す', () => {
            const result = progressPage.calculateOneRM(100, 0);
            expect(result).toBe(0);
        });
    });

    describe('calculateOverloadRate', () => {
        test('正常なオーバーロード率を計算', () => {
            const oneRMHistory = [100, 110, 120];
            const result = progressPage.calculateOverloadRate(oneRMHistory);
            expect(result).toBe(20);
        });

        test('データが1つの場合は0を返す', () => {
            const oneRMHistory = [100];
            const result = progressPage.calculateOverloadRate(oneRMHistory);
            expect(result).toBe(0);
        });

        test('最初の1RMが0の場合は0を返す', () => {
            const oneRMHistory = [0, 100];
            const result = progressPage.calculateOverloadRate(oneRMHistory);
            expect(result).toBe(0);
        });
    });

    describe('analyzeTrend', () => {
        test('改善トレンドを正しく判定', () => {
            const oneRMHistory = [100, 105, 110];
            const result = progressPage.analyzeTrend(oneRMHistory);
            expect(result).toBe('improving');
        });

        test('プラトートレンドを正しく判定', () => {
            const oneRMHistory = [100, 102, 103];
            const result = progressPage.analyzeTrend(oneRMHistory);
            expect(result).toBe('plateau');
        });

        test('低下トレンドを正しく判定', () => {
            const oneRMHistory = [100, 95, 90];
            const result = progressPage.analyzeTrend(oneRMHistory);
            expect(result).toBe('declining');
        });

        test('データが3未満の場合はinsufficient_dataを返す', () => {
            const oneRMHistory = [100, 105];
            const result = progressPage.analyzeTrend(oneRMHistory);
            expect(result).toBe('insufficient_data');
        });
    });

    describe('generateRecommendations', () => {
        test('高いオーバーロード率の場合の推奨事項', () => {
            const recommendations = progressPage.generateRecommendations(15, 'improving', [100, 110, 120]);
            expect(recommendations).toContain('素晴らしい進歩です！現在のトレーニングを継続してください。');
        });

        test('プラトーの場合の推奨事項', () => {
            const recommendations = progressPage.generateRecommendations(0, 'plateau', [100, 100, 100]);
            expect(recommendations).toContain('プラトー状態です。トレーニング方法を見直してみてください。');
            expect(recommendations).toContain('プラトーを打破するために、新しいエクササイズやトレーニング方法を試してみてください。');
        });

        test('低下トレンドの場合の推奨事項', () => {
            const recommendations = progressPage.generateRecommendations(-5, 'declining', [100, 95, 90]);
            expect(recommendations).toContain('パフォーマンスが低下しています。休息を取るか、トレーニング強度を調整してください。');
            expect(recommendations).toContain('オーバートレーニングの可能性があります。休息日を増やしてください。');
        });

        test('次の目標を提案', () => {
            const recommendations = progressPage.generateRecommendations(5, 'improving', [100, 105, 110]);
            expect(recommendations).toContain('次の目標: 115.5kg（現在の1RMの5%増）');
        });
    });

    describe('calculateProgressiveOverload', () => {
        test('データが不足している場合', () => {
            const result = progressPage.calculateProgressiveOverload([], 'exercise-1');
            expect(result.isProgressive).toBe(false);
            expect(result.overloadRate).toBe(0);
            expect(result.trend).toBe('insufficient_data');
        });

        test('エクササイズデータが不足している場合', () => {
            const progressData = [
                { exercise_id: 'exercise-2', weight: 100, reps: 10, workout_date: '2024-01-01' }
            ];
            const result = progressPage.calculateProgressiveOverload(progressData, 'exercise-1');
            expect(result.isProgressive).toBe(false);
            expect(result.trend).toBe('insufficient_data');
        });

        test('正常なプログレッシブ・オーバーロード分析', () => {
            const progressData = [
                { exercise_id: 'exercise-1', weight: 100, reps: 10, workout_date: '2024-01-01' },
                { exercise_id: 'exercise-1', weight: 110, reps: 10, workout_date: '2024-01-08' },
                { exercise_id: 'exercise-1', weight: 120, reps: 10, workout_date: '2024-01-15' }
            ];
            const result = progressPage.calculateProgressiveOverload(progressData, 'exercise-1');
            
            expect(result.isProgressive).toBe(true);
            expect(result.overloadRate).toBeGreaterThan(0);
            expect(result.trend).toBe('improving');
            expect(result.recommendations).toBeDefined();
            expect(result.oneRMHistory).toBeDefined();
            expect(result.improvement).toBeGreaterThan(0);
        });
    });

    describe('getTrendText', () => {
        test('各トレンドのテキストを正しく返す', () => {
            expect(progressPage.getTrendText('improving')).toBe('改善中');
            expect(progressPage.getTrendText('plateau')).toBe('プラトー');
            expect(progressPage.getTrendText('declining')).toBe('低下中');
            expect(progressPage.getTrendText('insufficient_data')).toBe('データ不足');
            expect(progressPage.getTrendText('error')).toBe('エラー');
            expect(progressPage.getTrendText('unknown')).toBe('不明');
        });
    });

    describe('getTrendIcon', () => {
        test('各トレンドのアイコンを正しく返す', () => {
            expect(progressPage.getTrendIcon('improving')).toContain('fa-arrow-up');
            expect(progressPage.getTrendIcon('plateau')).toContain('fa-minus');
            expect(progressPage.getTrendIcon('declining')).toContain('fa-arrow-down');
            expect(progressPage.getTrendIcon('insufficient_data')).toContain('fa-question');
            expect(progressPage.getTrendIcon('error')).toContain('fa-exclamation-triangle');
        });
    });

    describe('setupTooltips', () => {
        test('ツールチップが正しく設定される', () => {
            const { tooltipManager } = require('../../js/utils/tooltip.js');
            
            progressPage.setupTooltips();
            
            expect(tooltipManager.addTooltip).toHaveBeenCalledWith('#one-rm-calculator', expect.any(Object));
            expect(tooltipManager.addTooltip).toHaveBeenCalledWith('#progressive-overload-card', expect.any(Object));
            expect(tooltipManager.addTooltip).toHaveBeenCalledWith('#progress-chart', expect.any(Object));
            expect(tooltipManager.addTooltip).toHaveBeenCalledWith('#goal-setting', expect.any(Object));
            expect(tooltipManager.addTooltip).toHaveBeenCalledWith('#recommendations', expect.any(Object));
        });
    });
});