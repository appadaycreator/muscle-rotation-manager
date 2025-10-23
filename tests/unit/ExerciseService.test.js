// ExerciseService.test.js - ExerciseServiceクラスのテスト

import { ExerciseService } from '../../js/services/exerciseService.js';

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
  handleError: jest.fn(),
  executeWithRetry: jest.fn()
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn()
}));

// グローバル関数のモック
global.showNotification = jest.fn();
global.handleError = jest.fn();
global.executeWithRetry = jest.fn();

describe('ExerciseService', () => {
  let exerciseService;
  let mockSupabaseService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    
    // ExerciseServiceのインスタンス作成
    exerciseService = new ExerciseService();
  });

  afterEach(() => {
    if (exerciseService) {
      exerciseService.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(exerciseService.cache).toBeInstanceOf(Map);
      expect(exerciseService.cacheExpiry).toBe(5 * 60 * 1000); // 5分
      expect(exerciseService.searchCache).toBeInstanceOf(Map);
    });
  });

  describe('getAllExercises', () => {
    test('should get all exercises with cache', async () => {
      const mockExercises = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' },
        { id: 2, name: 'スクワット', muscleGroup: '脚' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockExercises);
      
      const result = await exerciseService.getAllExercises({ useCache: true });
      
      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('exercises');
      expect(result).toEqual(mockExercises);
    });

    test('should get all exercises without cache', async () => {
      const mockExercises = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockExercises);
      
      const result = await exerciseService.getAllExercises({ useCache: false });
      
      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('exercises');
      expect(result).toEqual(mockExercises);
    });

    test('should handle Supabase unavailable', async () => {
      mockSupabaseService.isAvailable.mockReturnValue(false);
      
      const result = await exerciseService.getAllExercises();
      
      expect(result).toEqual([]);
    });

    test('should handle loading error', async () => {
      const error = new Error('Failed to load exercises');
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await exerciseService.getAllExercises();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get all exercises:', error);
      expect(result).toEqual([]);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('searchExercises', () => {
    test('should search exercises by name', async () => {
      const searchTerm = 'ベンチ';
      const mockResults = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockResults);
      
      const result = await exerciseService.searchExercises(searchTerm);
      
      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('exercises');
      expect(result).toEqual(mockResults);
    });

    test('should search exercises by muscle group', async () => {
      const searchTerm = '胸';
      const mockResults = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' },
        { id: 2, name: 'ダンベルプレス', muscleGroup: '胸' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockResults);
      
      const result = await exerciseService.searchExercises(searchTerm);
      
      expect(result).toEqual(mockResults);
    });

    test('should return empty array for no results', async () => {
      const searchTerm = '存在しないエクササイズ';
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue([]);
      
      const result = await exerciseService.searchExercises(searchTerm);
      
      expect(result).toEqual([]);
    });

    test('should handle search error', async () => {
      const searchTerm = 'ベンチ';
      const error = new Error('Search failed');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await exerciseService.searchExercises(searchTerm);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Exercise search failed:', error);
      expect(result).toEqual([]);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getExerciseById', () => {
    test('should get exercise by ID', async () => {
      const exerciseId = 1;
      const mockExercise = { id: 1, name: 'ベンチプレス', muscleGroup: '胸' };
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue([mockExercise]);
      
      const result = await exerciseService.getExerciseById(exerciseId);
      
      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('exercises');
      expect(result).toEqual(mockExercise);
    });

    test('should return null for non-existent exercise', async () => {
      const exerciseId = 999;
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue([]);
      
      const result = await exerciseService.getExerciseById(exerciseId);
      
      expect(result).toBeNull();
    });

    test('should handle get exercise error', async () => {
      const exerciseId = 1;
      const error = new Error('Failed to get exercise');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await exerciseService.getExerciseById(exerciseId);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get exercise by ID:', error);
      expect(result).toBeNull();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createCustomExercise', () => {
    test('should create custom exercise', async () => {
      const exerciseData = {
        name: 'カスタムエクササイズ',
        muscleGroup: '胸',
        equipment: 'ダンベル',
        instructions: 'カスタムの説明'
      };
      
      const mockCreatedExercise = { id: 1, ...exerciseData };
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(mockCreatedExercise);
      
      const result = await exerciseService.createCustomExercise(exerciseData);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('custom_exercises', exerciseData);
      expect(result).toEqual(mockCreatedExercise);
    });

    test('should handle create custom exercise error', async () => {
      const exerciseData = { name: 'カスタムエクササイズ' };
      const error = new Error('Failed to create custom exercise');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await exerciseService.createCustomExercise(exerciseData);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create custom exercise:', error);
      expect(result).toBeNull();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateCustomExercise', () => {
    test('should update custom exercise', async () => {
      const exerciseId = 1;
      const updateData = { name: '更新されたエクササイズ' };
      const mockUpdatedExercise = { id: 1, ...updateData };
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(mockUpdatedExercise);
      
      const result = await exerciseService.updateCustomExercise(exerciseId, updateData);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('custom_exercises', updateData, exerciseId);
      expect(result).toEqual(mockUpdatedExercise);
    });

    test('should handle update custom exercise error', async () => {
      const exerciseId = 1;
      const updateData = { name: '更新されたエクササイズ' };
      const error = new Error('Failed to update custom exercise');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await exerciseService.updateCustomExercise(exerciseId, updateData);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update custom exercise:', error);
      expect(result).toBeNull();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteCustomExercise', () => {
    test('should delete custom exercise', async () => {
      const exerciseId = 1;
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(true);
      
      const result = await exerciseService.deleteCustomExercise(exerciseId);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('custom_exercises', null, exerciseId);
      expect(result).toBe(true);
    });

    test('should handle delete custom exercise error', async () => {
      const exerciseId = 1;
      const error = new Error('Failed to delete custom exercise');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await exerciseService.deleteCustomExercise(exerciseId);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete custom exercise:', error);
      expect(result).toBe(false);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cache management', () => {
    test('should clear cache', () => {
      exerciseService.cache.set('key', 'value');
      exerciseService.searchCache.set('search', 'result');
      
      exerciseService.clearCache();
      
      expect(exerciseService.cache.size).toBe(0);
      expect(exerciseService.searchCache.size).toBe(0);
    });

    test('should check cache expiry', () => {
      const cacheKey = 'test';
      const cacheData = {
        data: 'test data',
        timestamp: Date.now() - (6 * 60 * 1000) // 6分前
      };
      
      exerciseService.cache.set(cacheKey, cacheData);
      
      const isExpired = exerciseService.isCacheExpired(cacheKey);
      
      expect(isExpired).toBe(true);
    });

    test('should return false for non-expired cache', () => {
      const cacheKey = 'test';
      const cacheData = {
        data: 'test data',
        timestamp: Date.now() - (2 * 60 * 1000) // 2分前
      };
      
      exerciseService.cache.set(cacheKey, cacheData);
      
      const isExpired = exerciseService.isCacheExpired(cacheKey);
      
      expect(isExpired).toBe(false);
    });
  });

  describe('filtering', () => {
    test('should filter exercises by muscle group', async () => {
      const muscleGroup = '胸';
      const mockExercises = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' },
        { id: 2, name: 'スクワット', muscleGroup: '脚' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockExercises);
      
      const result = await exerciseService.filterExercises({ muscleGroup });
      
      expect(result).toEqual([{ id: 1, name: 'ベンチプレス', muscleGroup: '胸' }]);
    });

    test('should filter exercises by equipment', async () => {
      const equipment = 'バーベル';
      const mockExercises = [
        { id: 1, name: 'ベンチプレス', equipment: 'バーベル' },
        { id: 2, name: 'ダンベルプレス', equipment: 'ダンベル' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockExercises);
      
      const result = await exerciseService.filterExercises({ equipment });
      
      expect(result).toEqual([{ id: 1, name: 'ベンチプレス', equipment: 'バーベル' }]);
    });

    test('should filter exercises by difficulty', async () => {
      const difficulty = '初級';
      const mockExercises = [
        { id: 1, name: 'ベンチプレス', difficulty: '初級' },
        { id: 2, name: 'デッドリフト', difficulty: '上級' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockExercises);
      
      const result = await exerciseService.filterExercises({ difficulty });
      
      expect(result).toEqual([{ id: 1, name: 'ベンチプレス', difficulty: '初級' }]);
    });
  });

  describe('data validation', () => {
    test('should validate exercise data', () => {
      const validData = {
        name: 'ベンチプレス',
        muscleGroup: '胸',
        equipment: 'バーベル'
      };
      
      const isValid = exerciseService.validateExerciseData(validData);
      
      expect(isValid).toBe(true);
    });

    test('should reject invalid exercise data', () => {
      const invalidData = {
        name: '', // 空の名前
        muscleGroup: '胸'
      };
      
      const isValid = exerciseService.validateExerciseData(invalidData);
      
      expect(isValid).toBe(false);
    });
  });
});
