/**
 * ChartService テストスイート
 */

import { chartService } from '../../js/services/chartService.js';

// Chart.jsのモック
global.Chart = jest.fn();

// モックの設定
jest.mock('../../js/services/chartService.js', () => ({
    chartService: {
        createChart: jest.fn(),
        updateChart: jest.fn(),
        destroyChart: jest.fn(),
        getChartInstance: jest.fn()
    }
}));

describe('ChartService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(chartService.createChart).toBeDefined();
            expect(chartService.updateChart).toBeDefined();
            expect(chartService.destroyChart).toBeDefined();
            expect(chartService.getChartInstance).toBeDefined();
        });
    });

    describe('createChart', () => {
        it('should create chart successfully', () => {
            const mockChart = { id: 'test-chart' };
            chartService.createChart.mockReturnValue(mockChart);
            
            const result = chartService.createChart('canvas-id', { type: 'line' });
            
            expect(result).toEqual(mockChart);
            expect(chartService.createChart).toHaveBeenCalledWith('canvas-id', { type: 'line' });
        });
    });

    describe('updateChart', () => {
        it('should update chart successfully', () => {
            const mockChart = { id: 'test-chart' };
            chartService.updateChart.mockReturnValue(mockChart);
            
            const result = chartService.updateChart('test-chart', { data: [1, 2, 3] });
            
            expect(result).toEqual(mockChart);
            expect(chartService.updateChart).toHaveBeenCalledWith('test-chart', { data: [1, 2, 3] });
        });
    });

    describe('destroyChart', () => {
        it('should destroy chart successfully', () => {
            chartService.destroyChart.mockReturnValue(true);
            
            const result = chartService.destroyChart('test-chart');
            
            expect(result).toBe(true);
            expect(chartService.destroyChart).toHaveBeenCalledWith('test-chart');
        });
    });

    describe('getChartInstance', () => {
        it('should return chart instance', () => {
            const mockChart = { id: 'test-chart' };
            chartService.getChartInstance.mockReturnValue(mockChart);
            
            const result = chartService.getChartInstance('test-chart');
            
            expect(result).toEqual(mockChart);
            expect(chartService.getChartInstance).toHaveBeenCalledWith('test-chart');
        });
    });

    describe('integration', () => {
        it('should handle complete chart lifecycle', () => {
            const mockChart = { id: 'test-chart' };
            
            chartService.createChart.mockReturnValue(mockChart);
            chartService.updateChart.mockReturnValue(mockChart);
            chartService.destroyChart.mockReturnValue(true);
            chartService.getChartInstance.mockReturnValue(mockChart);
            
            // チャートを作成
            const createdChart = chartService.createChart('canvas-id', { type: 'line' });
            expect(createdChart).toEqual(mockChart);
            
            // チャートを更新
            const updatedChart = chartService.updateChart('test-chart', { data: [1, 2, 3] });
            expect(updatedChart).toEqual(mockChart);
            
            // チャートインスタンスを取得
            const instance = chartService.getChartInstance('test-chart');
            expect(instance).toEqual(mockChart);
            
            // チャートを破棄
            const destroyed = chartService.destroyChart('test-chart');
            expect(destroyed).toBe(true);
        });
    });
});