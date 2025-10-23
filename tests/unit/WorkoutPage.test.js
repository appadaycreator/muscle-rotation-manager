// WorkoutPage.test.js - WorkoutPageクラスのテスト

import WorkoutPage from '../../js/pages/workoutPage.js';

// モックの設定
jest.mock('../../js/core/BasePage.js', () => ({
  BasePage: jest.fn().mockImplementation(() => ({
    pageName: 'workout',
    isInitialized: false,
    eventListeners: new Map(),
    requiresAuth: true,
    initialize: jest.fn(),
    checkAuthentication: jest.fn(),
    onInitialize: jest.fn(),
    setupEventListeners: jest.fn(),
    loadData: jest.fn(),
    handleError: jest.fn(),
    cleanup: jest.fn(),
    destroy: jest.fn()
  }))
}));

jest.mock('../../js/components/Navigation.js', () => ({
  Navigation: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    destroy: jest.fn()
  }))
}));

jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getCurrentUser: jest.fn(),
    saveData: jest.fn(),
    loadData: jest.fn()
  }
}));

jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn()
  }
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn()
}));

// グローバル関数のモック
global.showNotification = jest.fn();

describe('WorkoutPage', () => {
  let workoutPage;
  let mockNavigation;
  let mockSupabaseService;
  let mockAuthManager;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const navigationModule = require('../../js/components/Navigation.js');
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    const authManagerModule = require('../../js/modules/authManager.js');
    
    mockNavigation = navigationModule.Navigation;
    mockSupabaseService = supabaseServiceModule.supabaseService;
    mockAuthManager = authManagerModule.authManager;
    
    // WorkoutPageのインスタンス作成
    workoutPage = new WorkoutPage();
  });

  afterEach(() => {
    if (workoutPage) {
      workoutPage.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(workoutPage.currentWorkout).toBeNull();
      expect(workoutPage.workoutTimer).toBeNull();
      expect(workoutPage.workoutStartTime).toBeNull();
      expect(workoutPage.exercises).toEqual([]);
      expect(workoutPage.muscleGroups).toEqual(['胸', '背中', '肩', '腕', '脚', '腹筋']);
      expect(workoutPage.selectedMuscles).toEqual([]);
      expect(workoutPage.selectedExercises).toEqual([]);
      expect(workoutPage.eventListenersSetup).toBe(false);
    });
  });

  describe('checkAuthentication', () => {
    test('should check authentication status', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(true);
      
      const result = await workoutPage.checkAuthentication();
      
      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle authentication failure', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      
      const result = await workoutPage.checkAuthentication();
      
      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('muscle group selection', () => {
    test('should toggle muscle group selection', () => {
      const muscleGroup = '胸';
      
      // 初回選択
      workoutPage.toggleMuscleGroup(muscleGroup);
      expect(workoutPage.selectedMuscles).toContain(muscleGroup);
      
      // 再度選択（解除）
      workoutPage.toggleMuscleGroup(muscleGroup);
      expect(workoutPage.selectedMuscles).not.toContain(muscleGroup);
    });

    test('should clear all muscle group selections', () => {
      workoutPage.selectedMuscles = ['胸', '背中', '肩'];
      
      workoutPage.clearMuscleSelections();
      
      expect(workoutPage.selectedMuscles).toEqual([]);
    });
  });

  describe('exercise selection', () => {
    test('should add exercise to selection', () => {
      const exercise = { id: 1, name: 'ベンチプレス' };
      
      workoutPage.addExercise(exercise);
      
      expect(workoutPage.selectedExercises).toContain(exercise);
    });

    test('should remove exercise from selection', () => {
      const exercise = { id: 1, name: 'ベンチプレス' };
      workoutPage.selectedExercises = [exercise];
      
      workoutPage.removeExercise(exercise);
      
      expect(workoutPage.selectedExercises).not.toContain(exercise);
    });

    test('should clear all exercise selections', () => {
      workoutPage.selectedExercises = [
        { id: 1, name: 'ベンチプレス' },
        { id: 2, name: 'スクワット' }
      ];
      
      workoutPage.clearExerciseSelections();
      
      expect(workoutPage.selectedExercises).toEqual([]);
    });
  });

  describe('workout management', () => {
    test('should start workout', () => {
      const workoutData = {
        exercises: [{ id: 1, name: 'ベンチプレス' }],
        startTime: new Date()
      };
      
      workoutPage.startWorkout(workoutData);
      
      expect(workoutPage.currentWorkout).toEqual(workoutData);
      expect(workoutPage.workoutStartTime).toBeDefined();
    });

    test('should end workout', () => {
      workoutPage.currentWorkout = { id: 1 };
      workoutPage.workoutStartTime = new Date();
      
      workoutPage.endWorkout();
      
      expect(workoutPage.currentWorkout).toBeNull();
      expect(workoutPage.workoutStartTime).toBeNull();
    });

    test('should get workout duration', () => {
      const startTime = new Date();
      workoutPage.workoutStartTime = startTime;
      
      // 1秒待機
      setTimeout(() => {
        const duration = workoutPage.getWorkoutDuration();
        expect(duration).toBeGreaterThan(0);
      }, 1000);
    });
  });

  describe('exercise data management', () => {
    test('should load exercises', async () => {
      const mockExercises = [
        { id: 1, name: 'ベンチプレス', muscleGroup: '胸' },
        { id: 2, name: 'スクワット', muscleGroup: '脚' }
      ];
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockExercises);
      
      await workoutPage.loadExercises();
      
      expect(workoutPage.exercises).toEqual(mockExercises);
    });

    test('should handle exercise loading error', async () => {
      const error = new Error('Failed to load exercises');
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await workoutPage.loadExercises();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load exercises:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('timer functionality', () => {
    test('should start workout timer', () => {
      workoutPage.startWorkoutTimer();
      
      expect(workoutPage.workoutTimer).toBeDefined();
    });

    test('should stop workout timer', () => {
      workoutPage.workoutTimer = setInterval(() => {}, 1000);
      
      workoutPage.stopWorkoutTimer();
      
      expect(workoutPage.workoutTimer).toBeNull();
    });
  });

  describe('event listeners', () => {
    test('should setup event listeners', () => {
      workoutPage.setupEventListeners();
      
      expect(workoutPage.eventListenersSetup).toBe(true);
    });

    test('should not setup event listeners if already setup', () => {
      workoutPage.eventListenersSetup = true;
      
      workoutPage.setupEventListeners();
      
      expect(workoutPage.eventListenersSetup).toBe(true);
    });
  });

  describe('data persistence', () => {
    test('should save workout data', async () => {
      const workoutData = {
        exercises: [{ id: 1, name: 'ベンチプレス' }],
        duration: 3600,
        startTime: new Date()
      };
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(workoutData);
      
      const result = await workoutPage.saveWorkoutData(workoutData);
      
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith(workoutData);
      expect(result).toEqual(workoutData);
    });

    test('should handle save workout data error', async () => {
      const workoutData = { id: 1 };
      const error = new Error('Save failed');
      
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await workoutPage.saveWorkoutData(workoutData);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save workout data:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    test('should cleanup resources', () => {
      workoutPage.workoutTimer = setInterval(() => {}, 1000);
      workoutPage.currentWorkout = { id: 1 };
      
      workoutPage.cleanup();
      
      expect(workoutPage.workoutTimer).toBeNull();
      expect(workoutPage.currentWorkout).toBeNull();
    });
  });
});
