// ChartService.test.js - ChartServiceクラスのテスト

import ChartService from '../../js/services/chartService.js';

// モックの設定
jest.mock('../../js/utils/helpers.js', () => ({
  safeGetElement: jest.fn((id) => {
    const mockElement = {
      id: id,
      getContext: jest.fn(() => ({
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        createImageData: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 })),
        transform: jest.fn(),
        setLineDash: jest.fn(),
        getLineDash: jest.fn(),
        createLinearGradient: jest.fn(),
        createRadialGradient: jest.fn(),
        createPattern: jest.fn(),
        closePath: jest.fn(),
        clip: jest.fn(),
        isPointInPath: jest.fn(),
        isPointInStroke: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      style: {},
      width: 400,
      height: 300
    };
    return mockElement;
  }),
  showNotification: jest.fn()
}));

describe('ChartService', () => {
  let chartService;

  beforeEach(() => {
    chartService = new ChartService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (chartService) {
      chartService.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(chartService.charts).toBeInstanceOf(Map);
      expect(chartService.defaultOptions).toBeDefined();
    });
  });

  describe('line chart creation', () => {
    test('should create line chart successfully', () => {
      const canvasId = 'test-chart';
      const data = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20, 30]
        }]
      };

      const chart = chartService.createLineChart(canvasId, data);

      expect(chart).toBeDefined();
      expect(chartService.charts.has(canvasId)).toBe(true);
    });

    test('should handle line chart creation error', () => {
      const canvasId = 'invalid-chart';
      const data = null;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const chart = chartService.createLineChart(canvasId, data);

      expect(chart).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('bar chart creation', () => {
    test('should create bar chart successfully', () => {
      const canvasId = 'test-bar-chart';
      const data = {
        labels: ['A', 'B', 'C'],
        datasets: [{
          label: 'Test Data',
          data: [5, 10, 15]
        }]
      };

      const chart = chartService.createBarChart(canvasId, data);

      expect(chart).toBeDefined();
      expect(chartService.charts.has(canvasId)).toBe(true);
    });
  });

  describe('pie chart creation', () => {
    test('should create pie chart successfully', () => {
      const canvasId = 'test-pie-chart';
      const data = {
        labels: ['Red', 'Blue', 'Yellow'],
        datasets: [{
          data: [30, 50, 20]
        }]
      };

      const chart = chartService.createPieChart(canvasId, data);

      expect(chart).toBeDefined();
      expect(chartService.charts.has(canvasId)).toBe(true);
    });
  });

  describe('chart update', () => {
    test('should update existing chart', () => {
      const canvasId = 'test-chart';
      const initialData = {
        labels: ['Jan', 'Feb'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20]
        }]
      };

      const chart = chartService.createLineChart(canvasId, initialData);
      expect(chart).toBeDefined();

      const newData = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20, 30]
        }]
      };

      const updatedChart = chartService.updateChart(canvasId, newData);
      expect(updatedChart).toBeDefined();
    });

    test('should handle update of non-existent chart', () => {
      const canvasId = 'non-existent-chart';
      const data = { labels: [], datasets: [] };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = chartService.updateChart(canvasId, data);

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Chart not found:', canvasId);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('chart destruction', () => {
    test('should destroy specific chart', () => {
      const canvasId = 'test-chart';
      const data = {
        labels: ['Jan', 'Feb'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20]
        }]
      };

      const chart = chartService.createLineChart(canvasId, data);
      expect(chartService.charts.has(canvasId)).toBe(true);

      chartService.destroyChart(canvasId);
      expect(chartService.charts.has(canvasId)).toBe(false);
    });

    test('should destroy all charts', () => {
      const chart1 = chartService.createLineChart('chart1', { labels: [], datasets: [] });
      const chart2 = chartService.createBarChart('chart2', { labels: [], datasets: [] });

      expect(chartService.charts.size).toBe(2);

      chartService.destroyAllCharts();
      expect(chartService.charts.size).toBe(0);
    });
  });

  describe('chart options', () => {
    test('should apply custom options', () => {
      const canvasId = 'test-chart';
      const data = {
        labels: ['Jan', 'Feb'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20]
        }]
      };

      const customOptions = {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Custom Chart'
          }
        }
      };

      const chart = chartService.createLineChart(canvasId, data, customOptions);
      expect(chart).toBeDefined();
    });
  });

  describe('chart validation', () => {
    test('should validate chart data', () => {
      const validData = {
        labels: ['Jan', 'Feb'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20]
        }]
      };

      const isValid = chartService.validateChartData(validData);
      expect(isValid).toBe(true);
    });

    test('should reject invalid chart data', () => {
      const invalidData = {
        labels: ['Jan', 'Feb'],
        datasets: [] // Empty datasets
      };

      const isValid = chartService.validateChartData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('chart utilities', () => {
    test('should get chart by ID', () => {
      const canvasId = 'test-chart';
      const data = {
        labels: ['Jan', 'Feb'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20]
        }]
      };

      chartService.createLineChart(canvasId, data);
      const chart = chartService.getChart(canvasId);

      expect(chart).toBeDefined();
    });

    test('should return null for non-existent chart', () => {
      const chart = chartService.getChart('non-existent');
      expect(chart).toBeNull();
    });

    test('should check if chart exists', () => {
      const canvasId = 'test-chart';
      const data = {
        labels: ['Jan', 'Feb'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20]
        }]
      };

      expect(chartService.hasChart(canvasId)).toBe(false);
      chartService.createLineChart(canvasId, data);
      expect(chartService.hasChart(canvasId)).toBe(true);
    });
  });
});
