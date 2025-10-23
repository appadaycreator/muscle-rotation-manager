// ProgressPage.test.js - プログレスページのテスト

import ProgressPage from '../../js/pages/progressPage.js';

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
  value: jest.fn(() => []),
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn(),
  writable: true
});

describe('ProgressPage', () => {
  let progressPage;

    beforeEach(() => {
    progressPage = ProgressPage;
        jest.clearAllMocks();
    });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(progressPage.currentUser).toBeNull();
      expect(progressPage.selectedExercise).toBeNull();
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await expect(progressPage.initialize()).resolves.not.toThrow();
    });
  });

  describe('loadProgressData', () => {
    test('should load progress data', async () => {
      await expect(progressPage.loadProgressData()).resolves.not.toThrow();
    });
  });

  describe('renderProgressCharts', () => {
    test('should render progress charts', () => {
      expect(() => progressPage.renderProgressCharts()).not.toThrow();
    });
  });

  describe('updateProgressCharts', () => {
    test('should update progress charts', () => {
      expect(() => progressPage.updateProgressCharts()).not.toThrow();
    });
  });

  describe('getProgressStats', () => {
    test('should get progress stats', () => {
      const stats = progressPage.getProgressStats();
      expect(typeof stats).toBe('object');
    });
  });
});