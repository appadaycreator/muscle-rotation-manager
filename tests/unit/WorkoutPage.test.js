// WorkoutPage.test.js - ワークアウトページのテスト

import WorkoutPage from '../../js/pages/workoutPage.js';

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

describe('WorkoutPage', () => {
  let workoutPage;

  beforeEach(() => {
    workoutPage = WorkoutPage;
    jest.clearAllMocks();
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

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await expect(workoutPage.initialize()).resolves.not.toThrow();
    });
  });

  describe('checkAuthentication', () => {
    test('should check authentication', async () => {
      const result = await workoutPage.checkAuthentication();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('startWorkout', () => {
    test('should start workout', () => {
      expect(() => workoutPage.startWorkout()).not.toThrow();
    });
  });

  describe('endWorkout', () => {
    test('should end workout', () => {
      expect(() => workoutPage.endWorkout()).not.toThrow();
    });
  });

  describe('pauseWorkout', () => {
    test('should pause workout', () => {
      expect(() => workoutPage.pauseWorkout()).not.toThrow();
    });
  });

  describe('resumeWorkout', () => {
    test('should resume workout', () => {
      expect(() => workoutPage.resumeWorkout()).not.toThrow();
    });
  });

  describe('addExercise', () => {
    test('should add exercise', () => {
      const exercise = { name: 'Push-ups', sets: 3, reps: 10 };
      expect(() => workoutPage.addExercise(exercise)).not.toThrow();
    });
  });

  describe('removeExercise', () => {
    test('should remove exercise', () => {
      const exerciseId = 1;
      expect(() => workoutPage.removeExercise(exerciseId)).not.toThrow();
    });
  });

  describe('updateExercise', () => {
    test('should update exercise', () => {
      const exercise = { id: 1, name: 'Push-ups', sets: 3, reps: 10 };
      expect(() => workoutPage.updateExercise(exercise)).not.toThrow();
    });
  });

  describe('getWorkoutDuration', () => {
    test('should get workout duration', () => {
      const duration = workoutPage.getWorkoutDuration();
      expect(typeof duration).toBe('number');
    });
  });
});