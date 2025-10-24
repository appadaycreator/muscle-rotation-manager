/**
 * ChartService テストスイート
 */

import { chartService } from '../../js/services/chartService.js';
import { handleError } from '../../js/utils/errorHandler.js';

// モックの設定
jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

// Chart.js のモック
const mockChart = {
    destroy: jest.fn(),
    update: jest.fn(),
    data: {
        labels: [],
        datasets: []
    }
};

// Chart.js のコンストラクタをモック
global.Chart = jest.fn().mockImplementation(() => mockChart);

describe('ChartService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<canvas id="test-chart"></canvas>';
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(chartService.charts).toBeInstanceOf(Map);
            expect(chartService.defaultColors).toEqual({
                primary: '#3B82F6',
                secondary: '#10B981',
                accent: '#F59E0B',
                danger: '#EF4444',
                success: '#22C55E',
                warning: '#F97316'
            });
        });
    });

    describe('destroyChart', () => {
        it('should destroy existing chart', () => {
            const chartId = 'test-chart';
            chartService.charts.set(chartId, mockChart);
            
            chartService.destroyChart(chartId);
            
            expect(mockChart.destroy).toHaveBeenCalled();
            expect(chartService.charts.has(chartId)).toBe(false);
        });

        it('should handle non-existent chart gracefully', () => {
            expect(() => chartService.destroyChart('non-existent')).not.toThrow();
        });

        it('should handle destroy errors', () => {
            const chartId = 'test-chart';
            const errorChart = {
                destroy: jest.fn().mockImplementation(() => {
                    throw new Error('Destroy failed');
                })
            };
            chartService.charts.set(chartId, errorChart);
            
            chartService.destroyChart(chartId);
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                { context: 'ChartService.destroyChart' }
            );
        });
    });

    describe('createOneRMChart', () => {
        it('should create 1RM chart successfully', () => {
            const canvasId = 'test-chart';
            const data = [
                { workout_date: '2024-01-01', one_rm: 100 },
                { workout_date: '2024-01-02', one_rm: 105 }
            ];
            const options = { title: 'Test 1RM Chart' };
            
            const result = chartService.createOneRMChart(canvasId, data, options);
            
            expect(Chart).toHaveBeenCalled();
            expect(chartService.charts.has(canvasId)).toBe(true);
        });

        it('should handle missing canvas element', () => {
            const canvasId = 'non-existent';
            const data = [];
            
            expect(() => chartService.createOneRMChart(canvasId, data)).toThrow();
        });

        it('should handle chart creation errors', () => {
            const canvasId = 'test-chart';
            const data = [];
            Chart.mockImplementation(() => {
                throw new Error('Chart creation failed');
            });
            
            expect(() => chartService.createOneRMChart(canvasId, data)).toThrow();
        });
    });

    describe('createVolumeChart', () => {
        it('should create volume chart successfully', () => {
            const canvasId = 'test-chart';
            const data = [
                { workout_date: '2024-01-01', total_volume: 1000 },
                { workout_date: '2024-01-02', total_volume: 1200 }
            ];
            
            const result = chartService.createVolumeChart(canvasId, data);
            
            expect(Chart).toHaveBeenCalled();
            expect(chartService.charts.has(canvasId)).toBe(true);
        });
    });

    describe('createProgressChart', () => {
        it('should create progress chart successfully', () => {
            const canvasId = 'test-chart';
            const data = [
                { workout_date: '2024-01-01', weight: 100, reps: 10 },
                { workout_date: '2024-01-02', weight: 105, reps: 8 }
            ];
            
            const result = chartService.createProgressChart(canvasId, data);
            
            expect(Chart).toHaveBeenCalled();
            expect(chartService.charts.has(canvasId)).toBe(true);
        });
    });

    describe('createMuscleGroupChart', () => {
        it('should create muscle group chart successfully', () => {
            const canvasId = 'test-chart';
            const data = [
                { muscle_group: 'chest', total_volume: 1000 },
                { muscle_group: 'back', total_volume: 1200 }
            ];
            
            const result = chartService.createMuscleGroupChart(canvasId, data);
            
            expect(Chart).toHaveBeenCalled();
            expect(chartService.charts.has(canvasId)).toBe(true);
        });
    });

    describe('createFrequencyChart', () => {
        it('should create frequency chart successfully', () => {
            const canvasId = 'test-chart';
            const data = [
                { muscle_group: 'chest', frequency: 3 },
                { muscle_group: 'back', frequency: 2 }
            ];
            
            const result = chartService.createFrequencyChart(canvasId, data);
            
            expect(Chart).toHaveBeenCalled();
            expect(chartService.charts.has(canvasId)).toBe(true);
        });
    });

    describe('updateChart', () => {
        it('should update existing chart', () => {
            const chartId = 'test-chart';
            chartService.charts.set(chartId, mockChart);
            
            chartService.updateChart(chartId, { labels: ['New Label'] });
            
            expect(mockChart.update).toHaveBeenCalled();
        });

        it('should handle non-existent chart', () => {
            expect(() => chartService.updateChart('non-existent', {})).not.toThrow();
        });
    });

    describe('destroyAllCharts', () => {
        it('should destroy all charts', () => {
            chartService.charts.set('chart1', mockChart);
            chartService.charts.set('chart2', mockChart);
            
            chartService.destroyAllCharts();
            
            expect(mockChart.destroy).toHaveBeenCalledTimes(2);
            expect(chartService.charts.size).toBe(0);
        });
    });

    describe('getChart', () => {
        it('should return existing chart', () => {
            const chartId = 'test-chart';
            chartService.charts.set(chartId, mockChart);
            
            const result = chartService.getChart(chartId);
            
            expect(result).toBe(mockChart);
        });

        it('should return null for non-existent chart', () => {
            const result = chartService.getChart('non-existent');
            
            expect(result).toBe(null);
        });
    });

    describe('integration', () => {
        it('should handle multiple chart operations', () => {
            const canvasId = 'test-chart';
            const data = [
                { workout_date: '2024-01-01', one_rm: 100 }
            ];
            
            // チャートを作成
            chartService.createOneRMChart(canvasId, data);
            
            // チャートを更新
            chartService.updateChart(canvasId, { labels: ['Updated'] });
            
            // チャートを取得
            const chart = chartService.getChart(canvasId);
            expect(chart).toBeTruthy();
            
            // チャートを破棄
            chartService.destroyChart(canvasId);
            expect(chartService.charts.has(canvasId)).toBe(false);
        });
    });
});