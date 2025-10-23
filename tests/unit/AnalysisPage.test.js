// AnalysisPage.test.js - 分析ページのテスト

import AnalysisPage from '../../js/pages/analysisPage.js';

// DOM モック
const mockElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  innerHTML: '',
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn()
};

// document モック
Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(() => [])
});

// window.location のモック
delete window.location;
window.location = { href: '' };

describe('AnalysisPage', () => {
  let analysisPage;

  beforeEach(() => {
    analysisPage = AnalysisPage;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(analysisPage.workoutData).toEqual([]);
      expect(analysisPage.charts).toEqual({});
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await expect(analysisPage.initialize()).resolves.not.toThrow();
    });
  });

  describe('loadWorkoutData', () => {
    test('should load workout data', async () => {
      await expect(analysisPage.loadWorkoutData()).resolves.not.toThrow();
    });
  });

  describe('renderCharts', () => {
    test('should render charts', () => {
      expect(() => analysisPage.renderCharts()).not.toThrow();
    });
  });

  describe('updateCharts', () => {
    test('should update charts', () => {
      expect(() => analysisPage.updateCharts()).not.toThrow();
    });
  });

  describe('getWorkoutStats', () => {
    test('should get workout stats', () => {
      const stats = analysisPage.getWorkoutStats();
      expect(typeof stats).toBe('object');
    });
  });
});