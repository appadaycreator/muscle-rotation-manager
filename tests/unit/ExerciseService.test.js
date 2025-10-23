// ExerciseService.test.js - ExerciseServiceクラスのテスト

import ExerciseService from '../../js/services/exerciseService.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getCurrentUser: jest.fn(),
    loadData: jest.fn(),
    saveData: jest.fn()
  }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn(),
  executeWithRetry: jest.fn()
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn()
}));

describe('ExerciseService', () => {
  let exerciseService;
  let mockSupabaseService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    
    // ExerciseServiceのインスタンス取得（シングルトン）
    exerciseService = ExerciseService;
  });

  afterEach(() => {
    if (exerciseService) {
      exerciseService.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(exerciseService).toBeDefined();
      expect(exerciseService.cache).toBeDefined();
    });
  });

  describe('getAllExercises', () => {
    test('should handle Supabase unavailable', async () => {
      mockSupabaseService.isAvailable.mockReturnValue(false);
      
      const result = await exerciseService.getAllExercises();
      
      expect(result).toEqual([]);
    });
  });

  describe('searchExercises', () => {
    test('should return empty array for no results', async () => {
      const searchTerm = 'nonexistent';
      
      mockSupabaseService.isAvailable.mockReturnValue(false);
      
      const result = await exerciseService.searchExercises(searchTerm);
      
      expect(result).toEqual([]);
    });
  });

  describe('cache management', () => {
    test('should clear cache', () => {
      exerciseService.clearCache();
      
      expect(exerciseService.cache.size).toBe(0);
    });
  });
});