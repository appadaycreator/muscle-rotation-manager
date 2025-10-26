// workoutPage.test.js - WorkoutPageクラスのテスト

import { WorkoutPage } from '../../js/pages/workoutPage.js';

// モック
jest.mock('../../js/services/exerciseService.js', () => ({
  exerciseService: {
    getExercises: jest.fn().mockResolvedValue([
      { id: '1', name: 'ベンチプレス', muscle_group: 'chest', equipment: 'barbell' },
      { id: '2', name: 'スクワット', muscle_group: 'legs', equipment: 'barbell' },
    ]),
  },
}));

jest.mock('../../js/services/workoutDataService.js', () => ({
  workoutDataService: {
    saveWorkout: jest.fn().mockResolvedValue({ success: true }),
    getWorkoutHistory: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAuthenticated: jest.fn().mockReturnValue(true),
    getCurrentUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
  },
}));

jest.mock('../../js/utils/helpers.js', () => ({
  safeGetElement: jest.fn((id) => {
    const mockElement = { id, innerHTML: '', appendChild: jest.fn(), removeChild: jest.fn() };
    return mockElement;
  }),
  showNotification: jest.fn(),
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn(),
}));

describe('WorkoutPage', () => {
  let workoutPage;
  let mockContainer;

  beforeEach(() => {
    // DOM要素のモック
    mockContainer = document.createElement('div');
    mockContainer.id = 'main-content';
    document.body.appendChild(mockContainer);

    // WorkoutPageのインスタンスを作成
    workoutPage = new WorkoutPage();
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('should initialize successfully', () => {
      expect(workoutPage).toBeDefined();
      expect(workoutPage.pageName).toBe('WorkoutPage');
    });

    test('should have required properties', () => {
      expect(workoutPage.currentWorkout).toBeDefined();
      expect(workoutPage.exercises).toEqual([]);
      expect(workoutPage.isWorkoutActive).toBe(false);
    });
  });

  describe('エクササイズ読み込み', () => {
    test('should load exercises successfully', async () => {
      await workoutPage.loadExercises();
      
      expect(workoutPage.exercises).toHaveLength(2);
      expect(workoutPage.exercises[0].name).toBe('ベンチプレス');
    });

    test('should handle exercise loading errors', async () => {
      const { exerciseService } = require('../../js/services/exerciseService.js');
      exerciseService.getExercises.mockRejectedValue(new Error('Test error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await workoutPage.loadExercises();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('ワークアウト管理', () => {
    test('should start workout', () => {
      workoutPage.startWorkout();
      
      expect(workoutPage.isWorkoutActive).toBe(true);
      expect(workoutPage.currentWorkout.startTime).toBeDefined();
    });

    test('should end workout', () => {
      workoutPage.startWorkout();
      workoutPage.endWorkout();
      
      expect(workoutPage.isWorkoutActive).toBe(false);
      expect(workoutPage.currentWorkout.endTime).toBeDefined();
    });

    test('should add exercise to workout', () => {
      const exercise = { id: '1', name: 'ベンチプレス', muscle_group: 'chest' };
      
      workoutPage.addExerciseToWorkout(exercise);
      
      expect(workoutPage.currentWorkout.exercises).toContain(exercise);
    });

    test('should remove exercise from workout', () => {
      const exercise = { id: '1', name: 'ベンチプレス', muscle_group: 'chest' };
      
      workoutPage.addExerciseToWorkout(exercise);
      workoutPage.removeExerciseFromWorkout('1');
      
      expect(workoutPage.currentWorkout.exercises).toHaveLength(0);
    });
  });

  describe('セット管理', () => {
    test('should add set to exercise', () => {
      const exercise = { id: '1', name: 'ベンチプレス', muscle_group: 'chest' };
      workoutPage.addExerciseToWorkout(exercise);
      
      workoutPage.addSetToExercise('1', { weight: 60, reps: 10 });
      
      const exerciseInWorkout = workoutPage.currentWorkout.exercises.find(ex => ex.id === '1');
      expect(exerciseInWorkout.sets).toHaveLength(1);
      expect(exerciseInWorkout.sets[0].weight).toBe(60);
      expect(exerciseInWorkout.sets[0].reps).toBe(10);
    });

    test('should remove set from exercise', () => {
      const exercise = { id: '1', name: 'ベンチプレス', muscle_group: 'chest' };
      workoutPage.addExerciseToWorkout(exercise);
      workoutPage.addSetToExercise('1', { weight: 60, reps: 10 });
      workoutPage.addSetToExercise('1', { weight: 65, reps: 8 });
      
      workoutPage.removeSetFromExercise('1', 0);
      
      const exerciseInWorkout = workoutPage.currentWorkout.exercises.find(ex => ex.id === '1');
      expect(exerciseInWorkout.sets).toHaveLength(1);
      expect(exerciseInWorkout.sets[0].weight).toBe(65);
    });

    test('should update set in exercise', () => {
      const exercise = { id: '1', name: 'ベンチプレス', muscle_group: 'chest' };
      workoutPage.addExerciseToWorkout(exercise);
      workoutPage.addSetToExercise('1', { weight: 60, reps: 10 });
      
      workoutPage.updateSetInExercise('1', 0, { weight: 65, reps: 8 });
      
      const exerciseInWorkout = workoutPage.currentWorkout.exercises.find(ex => ex.id === '1');
      expect(exerciseInWorkout.sets[0].weight).toBe(65);
      expect(exerciseInWorkout.sets[0].reps).toBe(8);
    });
  });

  describe('ワークアウト保存', () => {
    test('should save workout successfully', async () => {
      const { workoutDataService } = require('../../js/services/workoutDataService.js');
      
      workoutPage.startWorkout();
      workoutPage.addExerciseToWorkout({ id: '1', name: 'ベンチプレス', muscle_group: 'chest' });
      workoutPage.addSetToExercise('1', { weight: 60, reps: 10 });
      
      await workoutPage.saveWorkout();
      
      expect(workoutDataService.saveWorkout).toHaveBeenCalled();
    });

    test('should handle save workout errors', async () => {
      const { workoutDataService } = require('../../js/services/workoutDataService.js');
      workoutDataService.saveWorkout.mockRejectedValue(new Error('Save error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      workoutPage.startWorkout();
      await workoutPage.saveWorkout();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should require authentication for saving', async () => {
      const { supabaseService } = require('../../js/services/supabaseService.js');
      supabaseService.isAuthenticated.mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      workoutPage.startWorkout();
      await workoutPage.saveWorkout();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('統計計算', () => {
    test('should calculate workout statistics', () => {
      const exercise = { id: '1', name: 'ベンチプレス', muscle_group: 'chest' };
      workoutPage.addExerciseToWorkout(exercise);
      workoutPage.addSetToExercise('1', { weight: 60, reps: 10 });
      workoutPage.addSetToExercise('1', { weight: 65, reps: 8 });
      
      const stats = workoutPage.calculateWorkoutStats();
      
      expect(stats.totalSets).toBe(2);
      expect(stats.totalVolume).toBe(600 + 520); // 60*10 + 65*8
      expect(stats.exerciseCount).toBe(1);
    });

    test('should calculate exercise volume', () => {
      const exercise = { id: '1', name: 'ベンチプレス', muscle_group: 'chest' };
      workoutPage.addExerciseToWorkout(exercise);
      workoutPage.addSetToExercise('1', { weight: 60, reps: 10 });
      workoutPage.addSetToExercise('1', { weight: 65, reps: 8 });
      
      const volume = workoutPage.calculateExerciseVolume('1');
      
      expect(volume).toBe(600 + 520); // 60*10 + 65*8
    });
  });

  describe('レンダリング', () => {
    test('should render workout interface', () => {
      const container = document.createElement('div');
      container.id = 'workout-interface';
      document.body.appendChild(container);

      workoutPage.renderWorkoutInterface();
      
      expect(container.innerHTML).toContain('workout');
      
      document.body.removeChild(container);
    });

    test('should render exercise list', () => {
      const container = document.createElement('div');
      container.id = 'exercise-list';
      document.body.appendChild(container);

      workoutPage.exercises = [
        { id: '1', name: 'ベンチプレス', muscle_group: 'chest' },
        { id: '2', name: 'スクワット', muscle_group: 'legs' },
      ];

      workoutPage.renderExerciseList();
      
      expect(container.innerHTML).toContain('ベンチプレス');
      expect(container.innerHTML).toContain('スクワット');
      
      document.body.removeChild(container);
    });

    test('should render current workout', () => {
      const container = document.createElement('div');
      container.id = 'current-workout';
      document.body.appendChild(container);

      workoutPage.startWorkout();
      workoutPage.addExerciseToWorkout({ id: '1', name: 'ベンチプレス', muscle_group: 'chest' });

      workoutPage.renderCurrentWorkout();
      
      expect(container.innerHTML).toContain('ベンチプレス');
      
      document.body.removeChild(container);
    });
  });

  describe('エラーハンドリング', () => {
    test('should handle rendering errors gracefully', () => {
      const container = document.createElement('div');
      container.id = 'workout-interface';
      document.body.appendChild(container);

      // エラーを発生させる
      workoutPage.renderWorkoutInterface = jest.fn().mockImplementation(() => {
        throw new Error('Render error');
      });

      expect(() => workoutPage.renderWorkoutInterface()).toThrow('Render error');
      
      document.body.removeChild(container);
    });
  });
});