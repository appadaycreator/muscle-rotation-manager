// ProgressTrackingService.test.js - ProgressTrackingServiceクラスのテスト

import { ProgressTrackingService } from '../../js/services/progressTrackingService.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getCurrentUser: jest.fn(),
    saveData: jest.fn(),
    loadData: jest.fn()
  }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

// グローバル関数のモック
global.handleError = jest.fn();

describe('ProgressTrackingService', () => {
  let progressTrackingService;
  let mockSupabaseService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    
    // ProgressTrackingServiceのインスタンス作成
    progressTrackingService = new ProgressTrackingService();
  });

  afterEach(() => {
    if (progressTrackingService) {
      progressTrackingService.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with Supabase client', () => {
      expect(progressTrackingService.supabase).toBeDefined();
    });
  });

  describe('1RM calculation', () => {
    test('should calculate 1RM using Brzycki formula', () => {
      const weight = 100;
      const reps = 5;
      const expected1RM = 100 * (36 / (37 - 5)); // 112.5
      
      const result = progressTrackingService.calculateOneRM(weight, reps);
      
      expect(result).toBeCloseTo(expected1RM, 1);
    });

    test('should calculate 1RM for 1 rep', () => {
      const weight = 100;
      const reps = 1;
      
      const result = progressTrackingService.calculateOneRM(weight, reps);
      
      expect(result).toBe(100);
    });

    test('should handle edge cases', () => {
      const weight = 100;
      const reps = 37; // 37回は計算式で0除算になる
      
      const result = progressTrackingService.calculateOneRM(weight, reps);
      
      expect(result).toBe(weight); // フォールバック値
    });

    test('should handle invalid input', () => {
      const weight = -100;
      const reps = 5;
      
      const result = progressTrackingService.calculateOneRM(weight, reps);
      
      expect(result).toBe(0);
    });
  });

  describe('progress data management', () => {
    test('should save progress data', async () => {
      const progressData = {
        exercise: 'ベンチプレス',
        date: '2024-01-01',
        weight: 100,
        reps: 5,
        sets: 3
      };
      
      const mockSavedData = { id: 1, ...progressData };
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(mockSavedData);
      
      const result = await progressTrackingService.saveProgressData(progressData);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('progress_data', progressData);
      expect(result).toEqual(mockSavedData);
    });

    test('should load progress data', async () => {
      const mockProgressData = [
        { id: 1, exercise: 'ベンチプレス', date: '2024-01-01', weight: 100, reps: 5 },
        { id: 2, exercise: 'ベンチプレス', date: '2024-01-08', weight: 105, reps: 5 }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockProgressData);
      
      const result = await progressTrackingService.getProgressData('ベンチプレス');
      
      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('progress_data', { exercise: 'ベンチプレス' });
      expect(result).toEqual(mockProgressData);
    });

    test('should handle save progress data error', async () => {
      const progressData = { exercise: 'ベンチプレス' };
      const error = new Error('Save failed');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await progressTrackingService.saveProgressData(progressData);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save progress data:', error);
      expect(result).toBeNull();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle load progress data error', async () => {
      const error = new Error('Load failed');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await progressTrackingService.getProgressData('ベンチプレス');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load progress data:', error);
      expect(result).toEqual([]);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('goal management', () => {
    test('should set goal', async () => {
      const goalData = {
        exercise: 'ベンチプレス',
        targetWeight: 120,
        targetDate: '2024-06-01',
        currentWeight: 100
      };
      
      const mockCreatedGoal = { id: 1, ...goalData };
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(mockCreatedGoal);
      
      const result = await progressTrackingService.setGoal(goalData);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('goals', goalData);
      expect(result).toEqual(mockCreatedGoal);
    });

    test('should get goals', async () => {
      const mockGoals = [
        { id: 1, exercise: 'ベンチプレス', targetWeight: 120, targetDate: '2024-06-01' },
        { id: 2, exercise: 'スクワット', targetWeight: 150, targetDate: '2024-06-01' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockGoals);
      
      const result = await progressTrackingService.getGoals();
      
      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('goals');
      expect(result).toEqual(mockGoals);
    });

    test('should update goal', async () => {
      const goalId = 1;
      const updateData = { targetWeight: 130 };
      const mockUpdatedGoal = { id: 1, targetWeight: 130 };
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(mockUpdatedGoal);
      
      const result = await progressTrackingService.updateGoal(goalId, updateData);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('goals', updateData, goalId);
      expect(result).toEqual(mockUpdatedGoal);
    });

    test('should delete goal', async () => {
      const goalId = 1;
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(true);
      
      const result = await progressTrackingService.deleteGoal(goalId);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('goals', null, goalId);
      expect(result).toBe(true);
    });
  });

  describe('progress analysis', () => {
    test('should calculate progress rate', () => {
      const progressData = [
        { date: '2024-01-01', weight: 100 },
        { date: '2024-01-08', weight: 105 },
        { date: '2024-01-15', weight: 110 }
      ];
      
      const progressRate = progressTrackingService.calculateProgressRate(progressData);
      
      expect(progressRate).toBe(10); // 10%の向上
    });

    test('should calculate average progress', () => {
      const progressData = [
        { date: '2024-01-01', weight: 100 },
        { date: '2024-01-08', weight: 105 },
        { date: '2024-01-15', weight: 110 }
      ];
      
      const averageProgress = progressTrackingService.calculateAverageProgress(progressData);
      
      expect(averageProgress).toBe(5); // 週平均5kgの向上
    });

    test('should predict future progress', () => {
      const progressData = [
        { date: '2024-01-01', weight: 100 },
        { date: '2024-01-08', weight: 105 },
        { date: '2024-01-15', weight: 110 }
      ];
      
      const prediction = progressTrackingService.predictFutureProgress(progressData, 4); // 4週後
      
      expect(prediction).toBe(130); // 週5kg × 4週 = 20kg向上
    });
  });

  describe('goal achievement', () => {
    test('should calculate goal achievement rate', () => {
      const goals = [
        { targetWeight: 120, currentWeight: 100, targetDate: '2024-06-01' },
        { targetWeight: 150, currentWeight: 130, targetDate: '2024-06-01' }
      ];
      
      const achievementRate = progressTrackingService.calculateGoalAchievementRate(goals);
      
      expect(achievementRate).toBe(50); // 50%の目標達成
    });

    test('should check if goal is achievable', () => {
      const goal = {
        targetWeight: 120,
        currentWeight: 100,
        targetDate: '2024-06-01',
        startDate: '2024-01-01'
      };
      
      const isAchievable = progressTrackingService.isGoalAchievable(goal);
      
      expect(isAchievable).toBe(true); // 5ヶ月で20kgは達成可能
    });

    test('should suggest goal adjustment', () => {
      const goal = {
        targetWeight: 200,
        currentWeight: 100,
        targetDate: '2024-06-01',
        startDate: '2024-01-01'
      };
      
      const suggestion = progressTrackingService.suggestGoalAdjustment(goal);
      
      expect(suggestion).toBeDefined();
      expect(suggestion.recommendedTarget).toBeLessThan(200);
    });
  });

  describe('data validation', () => {
    test('should validate progress data', () => {
      const validData = {
        exercise: 'ベンチプレス',
        date: '2024-01-01',
        weight: 100,
        reps: 5,
        sets: 3
      };
      
      const isValid = progressTrackingService.validateProgressData(validData);
      
      expect(isValid).toBe(true);
    });

    test('should reject invalid progress data', () => {
      const invalidData = {
        exercise: '', // 空のエクササイズ名
        date: '2024-01-01',
        weight: -100, // 負の重量
        reps: 0 // 0回
      };
      
      const isValid = progressTrackingService.validateProgressData(invalidData);
      
      expect(isValid).toBe(false);
    });

    test('should validate goal data', () => {
      const validGoal = {
        exercise: 'ベンチプレス',
        targetWeight: 120,
        targetDate: '2024-06-01',
        currentWeight: 100
      };
      
      const isValid = progressTrackingService.validateGoalData(validGoal);
      
      expect(isValid).toBe(true);
    });

    test('should reject invalid goal data', () => {
      const invalidGoal = {
        exercise: '', // 空のエクササイズ名
        targetWeight: 0, // 0の目標重量
        targetDate: '2024-01-01', // 過去の日付
        currentWeight: 100
      };
      
      const isValid = progressTrackingService.validateGoalData(invalidGoal);
      
      expect(isValid).toBe(false);
    });
  });

  describe('data export', () => {
    test('should export progress data to CSV', () => {
      const progressData = [
        { date: '2024-01-01', weight: 100, reps: 5 },
        { date: '2024-01-08', weight: 105, reps: 5 }
      ];
      
      const csvData = progressTrackingService.exportToCSV(progressData);
      
      expect(csvData).toContain('date,weight,reps');
      expect(csvData).toContain('2024-01-01,100,5');
    });

    test('should export progress data to JSON', () => {
      const progressData = [
        { date: '2024-01-01', weight: 100, reps: 5 },
        { date: '2024-01-08', weight: 105, reps: 5 }
      ];
      
      const jsonData = progressTrackingService.exportToJSON(progressData);
      
      expect(jsonData).toBe(JSON.stringify(progressData, null, 2));
    });
  });

  describe('statistics', () => {
    test('should calculate workout frequency', () => {
      const progressData = [
        { date: '2024-01-01', exercise: 'ベンチプレス' },
        { date: '2024-01-03', exercise: 'ベンチプレス' },
        { date: '2024-01-05', exercise: 'ベンチプレス' }
      ];
      
      const frequency = progressTrackingService.calculateWorkoutFrequency(progressData);
      
      expect(frequency).toBe(3); // 3回のワークアウト
    });

    test('should calculate consistency score', () => {
      const progressData = [
        { date: '2024-01-01', exercise: 'ベンチプレス' },
        { date: '2024-01-03', exercise: 'ベンチプレス' },
        { date: '2024-01-05', exercise: 'ベンチプレス' }
      ];
      
      const consistency = progressTrackingService.calculateConsistencyScore(progressData);
      
      expect(consistency).toBeGreaterThan(0);
      expect(consistency).toBeLessThanOrEqual(100);
    });
  });
});
