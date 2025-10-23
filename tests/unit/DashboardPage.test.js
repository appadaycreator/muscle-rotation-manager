// DashboardPage.test.js - ダッシュボードページのテスト

import DashboardPage from '../../js/pages/dashboardPage.js';

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

describe('DashboardPage', () => {
  let dashboardPage;

  beforeEach(() => {
    dashboardPage = DashboardPage;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(dashboardPage.muscleRecoveryData).toEqual([]);
      expect(dashboardPage.recommendations).toEqual([]);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await expect(dashboardPage.initialize()).resolves.not.toThrow();
    });
  });

  describe('setupMusclePartHandlers', () => {
    test('should setup muscle part handlers', () => {
      expect(() => dashboardPage.setupMusclePartHandlers()).not.toThrow();
    });
  });

  describe('showLoginPrompt', () => {
    test('should show login prompt', () => {
      expect(() => dashboardPage.showLoginPrompt()).not.toThrow();
    });
  });

  describe('renderDashboard', () => {
    test('should render dashboard', () => {
      expect(() => dashboardPage.renderDashboard()).not.toThrow();
    });
  });

  describe('setupAuthButton', () => {
    test('should setup auth button', () => {
      expect(() => dashboardPage.setupAuthButton()).not.toThrow();
    });
  });

  describe('loadStats', () => {
    test('should load stats', async () => {
      await expect(dashboardPage.loadStats()).resolves.not.toThrow();
    });
  });

  describe('updateStatsDisplay', () => {
    test('should update stats display', () => {
      const stats = { totalWorkouts: 10, currentStreak: 5, weeklyProgress: 2, lastWorkout: null };
      expect(() => dashboardPage.updateStatsDisplay(stats)).not.toThrow();
    });
  });

  describe('handleMusclePartClick', () => {
    test('should handle muscle part click', () => {
      const muscle = 'chest';
      expect(() => dashboardPage.handleMusclePartClick(muscle)).not.toThrow();
    });
  });

  describe('showRecommendationDetails', () => {
    test('should show recommendation details', () => {
      const index = 0;
      expect(() => dashboardPage.showRecommendationDetails(index)).not.toThrow();
    });
  });

  describe('showMuscleDetails', () => {
    test('should show muscle details', () => {
      const muscleId = 'chest';
      expect(() => dashboardPage.showMuscleDetails(muscleId)).not.toThrow();
    });
  });

  describe('getFitnessLevelName', () => {
    test('should get fitness level name', () => {
      const level = 'beginner';
      const name = dashboardPage.getFitnessLevelName(level);
      expect(typeof name).toBe('string');
    });
  });

  describe('loadRecommendations', () => {
    test('should load recommendations', async () => {
      await expect(dashboardPage.loadRecommendations()).resolves.not.toThrow();
    });
  });

  describe('loadMuscleRecoveryData', () => {
    test('should load muscle recovery data', async () => {
      await expect(dashboardPage.loadMuscleRecoveryData()).resolves.not.toThrow();
    });
  });

  describe('loadRecentWorkouts', () => {
    test('should load recent workouts', async () => {
      await expect(dashboardPage.loadRecentWorkouts()).resolves.not.toThrow();
    });
  });

  describe('getRecommendations', () => {
    test('should get recommendations', async () => {
      await expect(dashboardPage.getRecommendations()).resolves.not.toThrow();
    });
  });

  describe('getMuscleRecoveryData', () => {
    test('should get muscle recovery data', async () => {
      await expect(dashboardPage.getMuscleRecoveryData()).resolves.not.toThrow();
    });
  });

  describe('getRecentWorkouts', () => {
    test('should get recent workouts', async () => {
      await expect(dashboardPage.getRecentWorkouts()).resolves.not.toThrow();
    });
  });

  describe('setupTooltips', () => {
    test('should setup tooltips', () => {
      expect(() => dashboardPage.setupTooltips()).not.toThrow();
    });
  });
});