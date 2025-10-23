// ExercisePage.test.js - エクササイズページのテスト

import ExercisePage from '../../js/pages/exercisePage.js';

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

describe('ExercisePage', () => {
  let exercisePage;

  beforeEach(() => {
    exercisePage = ExercisePage;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(exercisePage.currentExercises).toEqual([]);
      expect(exercisePage.totalExercises).toBe(0);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await expect(exercisePage.initialize()).resolves.not.toThrow();
    });
  });

  describe('loadExercises', () => {
    test('should load exercises', async () => {
      await expect(exercisePage.loadExercises()).resolves.not.toThrow();
    });
  });

  describe('renderExercises', () => {
    test('should render exercises', () => {
      expect(() => exercisePage.renderExercises()).not.toThrow();
    });
  });

  describe('filterExercises', () => {
    test('should filter exercises', () => {
      const filter = { muscleGroup: 'chest' };
      expect(() => exercisePage.filterExercises(filter)).not.toThrow();
    });
  });

  describe('searchExercises', () => {
    test('should search exercises', () => {
      const query = 'push';
      expect(() => exercisePage.searchExercises(query)).not.toThrow();
    });
  });

  describe('sortExercises', () => {
    test('should sort exercises', () => {
      const sortBy = 'name';
      expect(() => exercisePage.sortExercises(sortBy)).not.toThrow();
    });
  });

  describe('getExerciseById', () => {
    test('should get exercise by id', () => {
      const exerciseId = 1;
      const exercise = exercisePage.getExerciseById(exerciseId);
      expect(exercise).toBeDefined();
    });
  });

  describe('getExercisesByMuscleGroup', () => {
    test('should get exercises by muscle group', () => {
      const muscleGroup = 'chest';
      const exercises = exercisePage.getExercisesByMuscleGroup(muscleGroup);
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe('getExercisesByEquipment', () => {
    test('should get exercises by equipment', () => {
      const equipment = 'dumbbell';
      const exercises = exercisePage.getExercisesByEquipment(equipment);
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe('getExercisesByDifficulty', () => {
    test('should get exercises by difficulty', () => {
      const difficulty = 'beginner';
      const exercises = exercisePage.getExercisesByDifficulty(difficulty);
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe('addExercise', () => {
    test('should add exercise', () => {
      const exercise = { name: 'Push-ups', muscleGroup: 'chest' };
      expect(() => exercisePage.addExercise(exercise)).not.toThrow();
    });
  });

  describe('updateExercise', () => {
    test('should update exercise', () => {
      const exercise = { id: 1, name: 'Push-ups', muscleGroup: 'chest' };
      expect(() => exercisePage.updateExercise(exercise)).not.toThrow();
    });
  });

  describe('deleteExercise', () => {
    test('should delete exercise', () => {
      const exerciseId = 1;
      expect(() => exercisePage.deleteExercise(exerciseId)).not.toThrow();
    });
  });

  describe('favoriteExercise', () => {
    test('should favorite exercise', () => {
      const exerciseId = 1;
      expect(() => exercisePage.favoriteExercise(exerciseId)).not.toThrow();
    });
  });

  describe('unfavoriteExercise', () => {
    test('should unfavorite exercise', () => {
      const exerciseId = 1;
      expect(() => exercisePage.unfavoriteExercise(exerciseId)).not.toThrow();
    });
  });

  describe('getFavoriteExercises', () => {
    test('should get favorite exercises', () => {
      const exercises = exercisePage.getFavoriteExercises();
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe('getRecentExercises', () => {
    test('should get recent exercises', () => {
      const exercises = exercisePage.getRecentExercises();
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe('getPopularExercises', () => {
    test('should get popular exercises', () => {
      const exercises = exercisePage.getPopularExercises();
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe('getRecommendedExercises', () => {
    test('should get recommended exercises', () => {
      const exercises = exercisePage.getRecommendedExercises();
      expect(Array.isArray(exercises)).toBe(true);
    });
  });
});