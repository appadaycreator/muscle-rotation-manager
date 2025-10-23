// ProgressTrackingService.test.js - ProgressTrackingServiceクラスのテスト

import { progressTrackingService as ProgressTrackingService } from '../../js/services/progressTrackingService.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getCurrentUser: jest.fn(),
    loadData: jest.fn(),
    saveData: jest.fn(),
    client: {
      from: jest.fn()
    }
  }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

describe('ProgressTrackingService', () => {
  let progressTrackingService;
  let mockSupabaseService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    
    // ProgressTrackingServiceのインスタンス取得（シングルトン）
    progressTrackingService = ProgressTrackingService;
  });

  afterEach(() => {
    if (progressTrackingService) {
      progressTrackingService.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with Supabase client', () => {
      expect(progressTrackingService).toBeDefined();
      expect(progressTrackingService.supabase).toBeDefined();
    });
  });

  describe('1RM calculation', () => {
    test('should calculate 1RM using Brzycki formula', () => {
      const weight = 100;
      const reps = 5;
      
      const result = progressTrackingService.calculate1RM(weight, reps);
      
      expect(result).toBeGreaterThan(weight);
      expect(typeof result).toBe('number');
    });

    test('should calculate 1RM for 1 rep', () => {
      const weight = 100;
      const reps = 1;
      
      const result = progressTrackingService.calculate1RM(weight, reps);
      
      expect(result).toBe(weight);
    });

    test('should handle edge cases', () => {
      const weight = 0;
      const reps = 0;
      
      const result = progressTrackingService.calculate1RM(weight, reps);
      
      expect(result).toBe(0);
    });

    test('should handle invalid input', () => {
      const weight = -10;
      const reps = -5;
      
      const result = progressTrackingService.calculate1RM(weight, reps);
      
      expect(result).toBe(0);
    });
  });

  describe('progress data management', () => {
    test('should save progress data', async () => {
      const progressData = {
        exerciseId: 1,
        weight: 100,
        reps: 5,
        date: new Date()
      };
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(progressData);
      
      const result = await progressTrackingService.saveProgressData(progressData);
      
      expect(result).toEqual(progressData);
    });

    test('should load progress data', async () => {
      const mockProgressData = [
        { id: 1, exerciseId: 1, weight: 100, reps: 5 }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockProgressData);
      
      const result = await progressTrackingService.loadProgressData();
      
      expect(result).toEqual(mockProgressData);
    });

    test('should handle save progress data error', async () => {
      const progressData = { id: 1 };
      const error = new Error('Save failed');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await progressTrackingService.saveProgressData(progressData);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle load progress data error', async () => {
      const error = new Error('Load failed');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await progressTrackingService.loadProgressData();
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('goal management', () => {
    test('should set goal', async () => {
      const goalData = {
        exerciseId: 1,
        targetWeight: 120,
        targetDate: new Date()
      };
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(goalData);
      
      const result = await progressTrackingService.setGoal(goalData);
      
      expect(result).toEqual(goalData);
    });

    test('should get goals', async () => {
      const mockGoals = [
        { id: 1, exerciseId: 1, targetWeight: 120 }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockGoals);
      
      const result = await progressTrackingService.getGoals();
      
      expect(result).toEqual(mockGoals);
    });

    test('should update goal', async () => {
      const goalId = 1;
      const updateData = { targetWeight: 130 };
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(updateData);
      
      const result = await progressTrackingService.updateGoal(goalId, updateData);
      
      expect(result).toEqual(updateData);
    });

    test('should delete goal', async () => {
      const goalId = 1;
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue({ deleted: true });
      
      const result = await progressTrackingService.deleteGoal(goalId);
      
      expect(result.deleted).toBe(true);
    });
  });

  describe('progress analysis', () => {
    test('should calculate progress rate', () => {
      const progressData = [
        { weight: 100, reps: 5, date: new Date('2024-01-01') },
        { weight: 110, reps: 5, date: new Date('2024-01-15') }
      ];
      
      const result = progressTrackingService.calculateProgressRate(progressData);
      
      expect(typeof result).toBe('number');
    });

    test('should calculate average progress', () => {
      const progressData = [
        { weight: 100, reps: 5 },
        { weight: 110, reps: 5 },
        { weight: 120, reps: 5 }
      ];
      
      const result = progressTrackingService.calculateAverageProgress(progressData);
      
      expect(typeof result).toBe('number');
    });

    test('should predict future progress', () => {
      const progressData = [
        { weight: 100, reps: 5, date: new Date('2024-01-01') },
        { weight: 110, reps: 5, date: new Date('2024-01-15') }
      ];
      
      const result = progressTrackingService.predictFutureProgress(progressData);
      
      expect(typeof result).toBe('number');
    });
  });

  describe('goal achievement', () => {
    test('should calculate goal achievement rate', () => {
      const goals = [
        { targetWeight: 120, targetDate: new Date('2024-12-31') }
      ];
      const progressData = [
        { weight: 115, date: new Date('2024-06-01') }
      ];
      
      const result = progressTrackingService.calculateGoalAchievementRate(goals, progressData);
      
      expect(typeof result).toBe('number');
    });

    test('should check if goal is achievable', () => {
      const goal = { targetWeight: 120, targetDate: new Date('2024-12-31') };
      const progressData = [
        { weight: 100, date: new Date('2024-01-01') }
      ];
      
      const result = progressTrackingService.isGoalAchievable(goal, progressData);
      
      expect(typeof result).toBe('boolean');
    });

    test('should suggest goal adjustment', () => {
      const goal = { targetWeight: 200, targetDate: new Date('2024-12-31') };
      const progressData = [
        { weight: 100, date: new Date('2024-01-01') }
      ];
      
      const result = progressTrackingService.suggestGoalAdjustment(goal, progressData);
      
      expect(typeof result).toBe('object');
    });
  });

  describe('data validation', () => {
    test('should validate progress data', () => {
      const validData = {
        exerciseId: 1,
        weight: 100,
        reps: 5,
        date: new Date()
      };
      
      const result = progressTrackingService.validateProgressData(validData);
      
      expect(result).toBe(true);
    });

    test('should reject invalid progress data', () => {
      const invalidData = {
        exerciseId: null,
        weight: -10,
        reps: 0
      };
      
      const result = progressTrackingService.validateProgressData(invalidData);
      
      expect(result).toBe(false);
    });

    test('should validate goal data', () => {
      const validGoal = {
        exerciseId: 1,
        targetWeight: 120,
        targetDate: new Date()
      };
      
      const result = progressTrackingService.validateGoalData(validGoal);
      
      expect(result).toBe(true);
    });

    test('should reject invalid goal data', () => {
      const invalidGoal = {
        exerciseId: null,
        targetWeight: -10
      };
      
      const result = progressTrackingService.validateGoalData(invalidGoal);
      
      expect(result).toBe(false);
    });
  });

  describe('data export', () => {
    test('should export progress data to CSV', () => {
      const progressData = [
        { weight: 100, reps: 5, date: new Date('2024-01-01') }
      ];
      
      const result = progressTrackingService.exportToCSV(progressData);
      
      expect(typeof result).toBe('string');
    });

    test('should export progress data to JSON', () => {
      const progressData = [
        { weight: 100, reps: 5, date: new Date('2024-01-01') }
      ];
      
      const result = progressTrackingService.exportToJSON(progressData);
      
      expect(typeof result).toBe('string');
    });
  });

  describe('statistics', () => {
    test('should calculate workout frequency', () => {
      const progressData = [
        { date: new Date('2024-01-01') },
        { date: new Date('2024-01-02') },
        { date: new Date('2024-01-03') }
      ];
      
      const result = progressTrackingService.calculateWorkoutFrequency(progressData);
      
      expect(typeof result).toBe('number');
    });

    test('should calculate consistency score', () => {
      const progressData = [
        { date: new Date('2024-01-01') },
        { date: new Date('2024-01-02') },
        { date: new Date('2024-01-03') }
      ];
      
      const result = progressTrackingService.calculateConsistencyScore(progressData);
      
      expect(typeof result).toBe('number');
    });
  });
});