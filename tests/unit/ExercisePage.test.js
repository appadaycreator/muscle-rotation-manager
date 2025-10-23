// ExercisePage.test.js - ExercisePageクラスのテスト

import ExercisePage from '../../js/pages/exercisePage.js';

// モックの設定
jest.mock('../../js/services/exerciseService.js', () => ({
  exerciseService: {
    getAllExercises: jest.fn(),
    searchExercises: jest.fn(),
    getExerciseById: jest.fn(),
    createCustomExercise: jest.fn(),
    updateCustomExercise: jest.fn(),
    deleteCustomExercise: jest.fn()
  }
}));

jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    saveData: jest.fn(),
    loadData: jest.fn()
  }
}));

jest.mock('../../js/services/muscleGroupService.js', () => ({
  muscleGroupService: {
    getMuscleGroups: jest.fn(),
    getMuscleGroupById: jest.fn()
  }
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
  debounce: jest.fn((fn, delay) => fn)
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

// グローバル関数のモック
global.showNotification = jest.fn();
global.handleError = jest.fn();

describe('ExercisePage', () => {
  let exercisePage;
  let mockExerciseService;
  let mockSupabaseService;
  let mockMuscleGroupService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // DOMのセットアップ
    document.body.innerHTML = `
      <div id="exercise-search"></div>
      <div id="exercise-filters"></div>
      <div id="exercise-list"></div>
      <div id="exercise-details"></div>
    `;
    
    // モジュールの取得
    const exerciseServiceModule = require('../../js/services/exerciseService.js');
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    const muscleGroupServiceModule = require('../../js/services/muscleGroupService.js');
    
    mockExerciseService = exerciseServiceModule.exerciseService;
    mockSupabaseService = supabaseServiceModule.supabaseService;
    mockMuscleGroupService = muscleGroupServiceModule.muscleGroupService;
    
    // ExercisePageのインスタンス作成
    exercisePage = new ExercisePage();
  });

  afterEach(() => {
    if (exercisePage) {
      exercisePage.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(exercisePage.currentExercises).toEqual([]);
      expect(exercisePage.totalExercises).toBe(0);
      expect(exercisePage.currentFilters).toEqual({});
      expect(exercisePage.selectedExercise).toBeNull();
      expect(exercisePage.isLoading).toBe(false);
    });
  });

  describe('initialization', () => {
    test('should initialize successfully', () => {
      expect(exercisePage).toBeDefined();
    });
  });

  describe('exercise loading', () => {
    test('should load initial data', async () => {
      const mockExercises = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' },
        { id: 2, name: 'スクワット', muscleGroup: '脚' }
      ];
      
      mockExerciseService.getAllExercises.mockResolvedValue(mockExercises);
      
      await exercisePage.loadInitialData();
      
      expect(mockExerciseService.getAllExercises).toHaveBeenCalled();
      expect(exercisePage.currentExercises).toEqual(mockExercises);
    });

    test('should handle loading error', async () => {
      const error = new Error('Failed to load exercises');
      mockExerciseService.getAllExercises.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await exercisePage.loadInitialData();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load initial data:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('exercise search', () => {
    test('should perform search', async () => {
      const searchTerm = 'ベンチ';
      const mockResults = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' }
      ];
      
      mockExerciseService.searchExercises.mockResolvedValue(mockResults);
      
      await exercisePage.performSearch(searchTerm);
      
      expect(mockExerciseService.searchExercises).toHaveBeenCalledWith(searchTerm);
      expect(exercisePage.currentExercises).toEqual(mockResults);
    });

    test('should handle search error', async () => {
      const searchTerm = 'ベンチ';
      const error = new Error('Search failed');
      
      mockExerciseService.searchExercises.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await exercisePage.performSearch(searchTerm);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Search failed:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('exercise selection', () => {
    test('should select exercise', () => {
      const exercise = { id: 1, name: 'ベンチプレス' };
      
      exercisePage.selectExercise(exercise);
      
      expect(exercisePage.selectedExercise).toEqual(exercise);
    });

    test('should clear exercise selection', () => {
      exercisePage.selectedExercise = { id: 1, name: 'ベンチプレス' };
      
      exercisePage.clearSelection();
      
      expect(exercisePage.selectedExercise).toBeNull();
    });
  });

  describe('exercise filtering', () => {
    test('should apply filters', async () => {
      const filters = { muscleGroup: '胸', equipment: 'バーベル' };
      const mockFilteredExercises = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸', equipment: 'バーベル' }
      ];
      
      mockExerciseService.getAllExercises.mockResolvedValue(mockFilteredExercises);
      
      await exercisePage.applyFilters(filters);
      
      expect(exercisePage.currentFilters).toEqual(filters);
      expect(mockExerciseService.getAllExercises).toHaveBeenCalledWith(filters);
    });

    test('should clear filters', async () => {
      exercisePage.currentFilters = { muscleGroup: '胸' };
      const mockAllExercises = [
        { id: 1, name: 'ベンチプレス' },
        { id: 2, name: 'スクワット' }
      ];
      
      mockExerciseService.getAllExercises.mockResolvedValue(mockAllExercises);
      
      await exercisePage.clearFilters();
      
      expect(exercisePage.currentFilters).toEqual({});
      expect(mockExerciseService.getAllExercises).toHaveBeenCalledWith({});
    });
  });

  describe('custom exercise management', () => {
    test('should create custom exercise', async () => {
      const exerciseData = {
        name: 'カスタムエクササイズ',
        muscleGroup: '胸',
        equipment: 'ダンベル'
      };
      
      const mockCreatedExercise = { id: 1, ...exerciseData };
      mockExerciseService.createCustomExercise.mockResolvedValue(mockCreatedExercise);
      
      const result = await exercisePage.createCustomExercise(exerciseData);
      
      expect(mockExerciseService.createCustomExercise).toHaveBeenCalledWith(exerciseData);
      expect(result).toEqual(mockCreatedExercise);
    });

    test('should update custom exercise', async () => {
      const exerciseId = 1;
      const updateData = { name: '更新されたエクササイズ' };
      const mockUpdatedExercise = { id: 1, ...updateData };
      
      mockExerciseService.updateCustomExercise.mockResolvedValue(mockUpdatedExercise);
      
      const result = await exercisePage.updateCustomExercise(exerciseId, updateData);
      
      expect(mockExerciseService.updateCustomExercise).toHaveBeenCalledWith(exerciseId, updateData);
      expect(result).toEqual(mockUpdatedExercise);
    });

    test('should delete custom exercise', async () => {
      const exerciseId = 1;
      
      mockExerciseService.deleteCustomExercise.mockResolvedValue(true);
      
      const result = await exercisePage.deleteCustomExercise(exerciseId);
      
      expect(mockExerciseService.deleteCustomExercise).toHaveBeenCalledWith(exerciseId);
      expect(result).toBe(true);
    });
  });

  describe('exercise details', () => {
    test('should load exercise details', async () => {
      const exerciseId = 1;
      const mockExerciseDetails = {
        id: 1,
        name: 'ベンチプレス',
        muscleGroup: '胸',
        equipment: 'バーベル',
        instructions: 'ベンチに横になり...'
      };
      
      mockExerciseService.getExerciseById.mockResolvedValue(mockExerciseDetails);
      
      const result = await exercisePage.loadExerciseDetails(exerciseId);
      
      expect(mockExerciseService.getExerciseById).toHaveBeenCalledWith(exerciseId);
      expect(result).toEqual(mockExerciseDetails);
    });

    test('should handle exercise details loading error', async () => {
      const exerciseId = 1;
      const error = new Error('Exercise not found');
      
      mockExerciseService.getExerciseById.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await exercisePage.loadExerciseDetails(exerciseId);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load exercise details:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loading state management', () => {
    test('should set loading state', () => {
      exercisePage.setLoading(true);
      
      expect(exercisePage.isLoading).toBe(true);
    });

    test('should clear loading state', () => {
      exercisePage.isLoading = true;
      
      exercisePage.setLoading(false);
      
      expect(exercisePage.isLoading).toBe(false);
    });
  });

  describe('data refresh', () => {
    test('should refresh exercise data', async () => {
      const mockExercises = [
        { id: 1, name: 'ベンチプレス' },
        { id: 2, name: 'スクワット' }
      ];
      
      mockExerciseService.getAllExercises.mockResolvedValue(mockExercises);
      
      await exercisePage.refreshData();
      
      expect(mockExerciseService.getAllExercises).toHaveBeenCalled();
      expect(exercisePage.currentExercises).toEqual(mockExercises);
    });
  });

  describe('error handling', () => {
    test('should handle general errors', () => {
      const error = new Error('Test error');
      
      exercisePage.handleError(error);
      
      expect(global.handleError).toHaveBeenCalledWith(error, {
        context: 'ExercisePage',
        showNotification: true
      });
    });
  });
});
