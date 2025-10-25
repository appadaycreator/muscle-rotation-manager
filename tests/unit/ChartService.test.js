// tests/unit/ChartService.test.js - ChartServiceのテスト

import { chartService } from '../../js/services/chartService.js';

// Chart.jsのモック
const mockChart = {
    destroy: jest.fn(),
    resize: jest.fn(),
    update: jest.fn(),
    data: {},
    options: {}
};

// Chart.jsのコンストラクタをモック
global.Chart = jest.fn(() => mockChart);

// モック設定
jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

describe('ChartService', () => {
    let service;
    let mockCanvas;

    beforeEach(() => {
        // モックキャンバス要素
        mockCanvas = {
            getContext: jest.fn(() => ({
                fillRect: jest.fn(),
                clearRect: jest.fn()
            }))
        };

        // document.getElementByIdのモック
        global.document = {
            getElementById: jest.fn(() => mockCanvas)
        };
        
        // getElementByIdをモック関数として設定
        global.document.getElementById = jest.fn(() => mockCanvas);

        service = chartService;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(service.charts).toBeInstanceOf(Map);
            expect(service.defaultColors).toEqual({
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
            service.charts.set(chartId, mockChart);

            service.destroyChart(chartId);

            expect(mockChart.destroy).toHaveBeenCalled();
            expect(service.charts.has(chartId)).toBe(false);
        });

        it('should handle non-existent chart', () => {
            service.destroyChart('non-existent');

            expect(mockChart.destroy).not.toHaveBeenCalled();
        });
    });

    describe('createOneRMChart', () => {
        it('should create 1RM chart successfully', () => {
            const canvasId = 'one-rm-chart';
            const data = [
                { workout_date: '2024-01-01', one_rm: 100 },
                { workout_date: '2024-01-02', one_rm: 105 }
            ];

            const result = service.createOneRMChart(canvasId, data);

            expect(global.document.getElementById).toHaveBeenCalledWith(canvasId);
            expect(global.Chart).toHaveBeenCalled();
            expect(service.charts.has(canvasId)).toBe(true);
            expect(result).toBeDefined();
        });

        it('should handle missing canvas element', () => {
            global.document.getElementById.mockReturnValue(null);

            const result = service.createOneRMChart('missing-canvas', []);

            expect(result).toBeNull();
        });
    });

    describe('createProgressChart', () => {
        it('should create progress chart successfully', () => {
            const canvasId = 'progress-chart';
            const data = [
                { date: '2024-01-01', value: 100 },
                { date: '2024-01-02', value: 105 }
            ];

            const result = service.createProgressChart(canvasId, data);

            expect(global.document.getElementById).toHaveBeenCalledWith(canvasId);
            expect(global.Chart).toHaveBeenCalled();
            expect(service.charts.has(canvasId)).toBe(true);
            expect(result).toBeDefined();
        });
    });

    describe('destroyAllCharts', () => {
        it('should destroy all charts', () => {
            const chart1 = { destroy: jest.fn() };
            const chart2 = { destroy: jest.fn() };
            
            // 既存のチャートをクリア
            service.charts.clear();
            
            // チャートを直接追加
            service.charts.set('chart1', chart1);
            service.charts.set('chart2', chart2);

            // チャートが追加されたことを確認
            expect(service.charts.size).toBe(2);

            service.destroyAllCharts();

            expect(chart1.destroy).toHaveBeenCalled();
            expect(chart2.destroy).toHaveBeenCalled();
            expect(service.charts.size).toBe(0);
        });
    });

    describe('updateChart', () => {
        it('should update existing chart', () => {
            const chartId = 'test-chart';
            const newData = { labels: ['A', 'B'], datasets: [] };
            service.charts.set(chartId, mockChart);

            service.updateChart(chartId, newData);

            expect(mockChart.data).toBe(newData);
            expect(mockChart.update).toHaveBeenCalled();
        });
    });

    describe('getChart', () => {
        it('should return existing chart', () => {
            const chartId = 'test-chart';
            service.charts.set(chartId, mockChart);

            const result = service.getChart(chartId);

            expect(result).toBeDefined();
        });

        it('should return null for non-existent chart', () => {
            const result = service.getChart('non-existent');

            expect(result).toBeNull();
        });
    });
});