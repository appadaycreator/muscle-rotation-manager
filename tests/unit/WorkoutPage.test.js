import { WorkoutPage } from '../../js/pages/workoutPage.js';

// モックの設定
jest.mock('../../js/core/BasePage.js', () => ({
  BasePage: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    destroy: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    cleanupEventListeners: jest.fn(),
    saveData: jest.fn(),
    loadData: jest.fn(),
    getState: jest.fn(() => ({})),
    requiresAuth: true
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
    isAvailable: jest.fn(() => true),
    loadData: jest.fn(),
    saveData: jest.fn()
  }
}));

jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(() => Promise.resolve(true)),
    getCurrentUser: jest.fn(() => Promise.resolve({ id: 'test-user' }))
  }
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn()
}));

jest.mock('../../js/utils/tooltip.js', () => ({
  tooltipManager: {
    initialize: jest.fn(),
    addMuscleGroupTooltip: jest.fn(),
    addExerciseTooltip: jest.fn()
  }
}));

// DOM環境のモック
const mockElement = {
  innerHTML: '',
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  dataset: {}
};

Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockElement)
});

Object.defineProperty(document, 'querySelector', {
  value: jest.fn(() => mockElement)
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(() => [])
});

Object.defineProperty(window, 'setTimeout', {
  value: jest.fn((callback) => {
    callback();
    return 1;
  })
});

Object.defineProperty(window, 'clearTimeout', {
  value: jest.fn()
});

describe('WorkoutPage', () => {
  let workoutPage;

  beforeEach(() => {
    workoutPage = new WorkoutPage();
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
      expect(workoutPage.muscleGroupCache).toBeInstanceOf(Map);
    });
  });

  describe('checkAuthentication', () => {
    test('should return true for authenticated user', async () => {
      const result = await workoutPage.checkAuthentication();
      expect(result).toBe(true);
    });

    test('should return false for unauthenticated user', async () => {
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated.mockResolvedValue(false);
      
      const result = await workoutPage.checkAuthentication();
      expect(result).toBe(false);
    });
  });

  describe('onInitialize', () => {
    test('should initialize successfully when authenticated', async () => {
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated.mockResolvedValue(true);
      
      await workoutPage.onInitialize();
      expect(workoutPage.navigation.initialize).toHaveBeenCalled();
    });

    test('should not initialize if not authenticated', async () => {
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated.mockResolvedValue(false);
      
      await workoutPage.onInitialize();
      expect(workoutPage.navigation.initialize).not.toHaveBeenCalled();
    });
  });

  describe('showLoginPrompt', () => {
    test('should show login prompt', () => {
      workoutPage.showLoginPrompt();
      expect(document.getElementById).toHaveBeenCalledWith('main-content');
    });
  });

  describe('loadExerciseData', () => {
    test('should load exercise data', async () => {
      await workoutPage.loadExerciseData();
      expect(workoutPage.exercises).toBeDefined();
    });
  });

  describe('setupEventListeners', () => {
    test('should setup event listeners', () => {
      workoutPage.setupEventListeners();
      expect(workoutPage.eventListenersSetup).toBe(true);
    });
  });

  describe('setupTooltips', () => {
    test('should setup tooltips', () => {
      workoutPage.setupTooltips();
      expect(workoutPage.eventListenersSetup).toBe(true);
    });
  });

  describe('updateQuickStartButton', () => {
    test('should update quick start button', () => {
      workoutPage.updateQuickStartButton();
      expect(document.getElementById).toHaveBeenCalledWith('quick-start-btn');
    });
  });

  describe('selectMuscleGroup', () => {
    test('should select muscle group', () => {
      workoutPage.selectMuscleGroup('胸');
      expect(workoutPage.selectedMuscles).toContain('胸');
    });

    test('should deselect muscle group if already selected', () => {
      workoutPage.selectedMuscles = ['胸'];
      workoutPage.selectMuscleGroup('胸');
      expect(workoutPage.selectedMuscles).not.toContain('胸');
    });
  });

  describe('startWorkout', () => {
    test('should start workout', () => {
      workoutPage.selectedMuscles = ['胸'];
      workoutPage.startWorkout();
      expect(workoutPage.currentWorkout).toBeDefined();
    });

    test('should not start workout without selected muscles', () => {
      workoutPage.selectedMuscles = [];
      workoutPage.startWorkout();
      expect(workoutPage.currentWorkout).toBeNull();
    });
  });

  describe('endWorkout', () => {
    test('should end workout', () => {
      workoutPage.currentWorkout = { id: 'test-workout' };
      workoutPage.endWorkout();
      expect(workoutPage.currentWorkout).toBeNull();
    });
  });

  describe('addExercise', () => {
    test('should add exercise to workout', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const exercise = { name: 'Test Exercise', sets: [] };
      workoutPage.addExercise(exercise);
      expect(workoutPage.currentWorkout.exercises).toContain(exercise);
    });
  });

  describe('removeExercise', () => {
    test('should remove exercise from workout', () => {
      const exercise = { name: 'Test Exercise', sets: [] };
      workoutPage.currentWorkout = { exercises: [exercise] };
      workoutPage.removeExercise(exercise);
      expect(workoutPage.currentWorkout.exercises).not.toContain(exercise);
    });
  });

  describe('addSet', () => {
    test('should add set to exercise', () => {
      const exercise = { name: 'Test Exercise', sets: [] };
      workoutPage.addSet(exercise, 100, 10);
      expect(exercise.sets).toHaveLength(1);
      expect(exercise.sets[0]).toEqual({ weight: 100, reps: 10 });
    });
  });

  describe('removeSet', () => {
    test('should remove set from exercise', () => {
      const exercise = { name: 'Test Exercise', sets: [{ weight: 100, reps: 10 }] };
      workoutPage.removeSet(exercise, 0);
      expect(exercise.sets).toHaveLength(0);
    });
  });

  describe('calculateOneRM', () => {
    test('should calculate one rep max', () => {
      const result = workoutPage.calculateOneRM(100, 10);
      expect(result).toBeCloseTo(133.33, 1);
    });

    test('should return weight for single rep', () => {
      const result = workoutPage.calculateOneRM(100, 1);
      expect(result).toBe(100);
    });
  });

  describe('saveWorkout', () => {
    test('should save workout', async () => {
      workoutPage.currentWorkout = { id: 'test-workout' };
      await workoutPage.saveWorkout();
      expect(workoutPage.currentWorkout).toBeNull();
    });
  });

  describe('loadWorkouts', () => {
    test('should load workouts', async () => {
      const workouts = await workoutPage.loadWorkouts();
      expect(Array.isArray(workouts)).toBe(true);
    });
  });

  describe('getWorkoutHistory', () => {
    test('should get workout history', async () => {
      const history = await workoutPage.getWorkoutHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('getMuscleGroupStats', () => {
    test('should get muscle group stats', async () => {
      const stats = await workoutPage.getMuscleGroupStats();
      expect(stats).toBeDefined();
    });
  });

  describe('getProgressData', () => {
    test('should get progress data', async () => {
      const progress = await workoutPage.getProgressData();
      expect(progress).toBeDefined();
    });
  });

  describe('initializeMuscleGroupCache', () => {
    test('should initialize muscle group cache', () => {
      workoutPage.initializeMuscleGroupCache();
      expect(workoutPage.muscleGroupCache).toBeInstanceOf(Map);
    });
  });

  describe('getMuscleGroupId', () => {
    test('should get muscle group ID from cache', async () => {
      workoutPage.muscleGroupCache.set('胸', 'test-id');
      const id = await workoutPage.getMuscleGroupId('胸');
      expect(id).toBe('test-id');
    });
  });

  describe('createMuscleGroup', () => {
    test('should create muscle group', async () => {
      const group = await workoutPage.createMuscleGroup('胸');
      expect(group).toBeDefined();
    });
  });

  describe('getExercisesForMuscleGroup', () => {
    test('should get exercises for muscle group', async () => {
      const exercises = await workoutPage.getExercisesForMuscleGroup('胸');
      expect(Array.isArray(exercises)).toBe(true);
    });
  });

  describe('createExercise', () => {
    test('should create exercise', async () => {
      const exercise = await workoutPage.createExercise('Test Exercise', '胸');
      expect(exercise).toBeDefined();
    });
  });

  describe('getWorkoutRecommendations', () => {
    test('should get workout recommendations', async () => {
      const recommendations = await workoutPage.getWorkoutRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('getWorkoutPlan', () => {
    test('should get workout plan', async () => {
      const plan = await workoutPage.getWorkoutPlan();
      expect(plan).toBeDefined();
    });
  });

  describe('getWorkoutStats', () => {
    test('should get workout stats', async () => {
      const stats = await workoutPage.getWorkoutStats();
      expect(stats).toBeDefined();
    });
  });

  describe('getWorkoutSummary', () => {
    test('should get workout summary', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const summary = workoutPage.getWorkoutSummary();
      expect(summary).toBeDefined();
    });
  });

  describe('exportWorkoutData', () => {
    test('should export workout data', () => {
      const data = workoutPage.exportWorkoutData();
      expect(data).toBeDefined();
    });
  });

  describe('importWorkoutData', () => {
    test('should import workout data', async () => {
      const data = { workouts: [] };
      await workoutPage.importWorkoutData(data);
      expect(workoutPage.workouts).toBeDefined();
    });
  });

  describe('resetWorkoutData', () => {
    test('should reset workout data', () => {
      workoutPage.resetWorkoutData();
      expect(workoutPage.currentWorkout).toBeNull();
      expect(workoutPage.selectedMuscles).toEqual([]);
      expect(workoutPage.selectedExercises).toEqual([]);
    });
  });

  describe('getWorkoutTimer', () => {
    test('should get workout timer', () => {
      workoutPage.workoutStartTime = Date.now();
      const timer = workoutPage.getWorkoutTimer();
      expect(timer).toBeDefined();
    });
  });

  describe('pauseWorkout', () => {
    test('should pause workout', () => {
      workoutPage.currentWorkout = { id: 'test-workout' };
      workoutPage.pauseWorkout();
      expect(workoutPage.workoutTimer).toBeNull();
    });
  });

  describe('resumeWorkout', () => {
    test('should resume workout', () => {
      workoutPage.currentWorkout = { id: 'test-workout' };
      workoutPage.resumeWorkout();
      expect(workoutPage.workoutStartTime).toBeDefined();
    });
  });

  describe('getWorkoutDuration', () => {
    test('should get workout duration', () => {
      workoutPage.workoutStartTime = Date.now() - 60000; // 1 minute ago
      const duration = workoutPage.getWorkoutDuration();
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('getWorkoutCalories', () => {
    test('should get workout calories', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const calories = workoutPage.getWorkoutCalories();
      expect(calories).toBeDefined();
    });
  });

  describe('getWorkoutVolume', () => {
    test('should get workout volume', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const volume = workoutPage.getWorkoutVolume();
      expect(volume).toBeDefined();
    });
  });

  describe('getWorkoutIntensity', () => {
    test('should get workout intensity', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const intensity = workoutPage.getWorkoutIntensity();
      expect(intensity).toBeDefined();
    });
  });

  describe('getWorkoutDifficulty', () => {
    test('should get workout difficulty', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const difficulty = workoutPage.getWorkoutDifficulty();
      expect(difficulty).toBeDefined();
    });
  });

  describe('getWorkoutRating', () => {
    test('should get workout rating', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const rating = workoutPage.getWorkoutRating();
      expect(rating).toBeDefined();
    });
  });

  describe('setWorkoutRating', () => {
    test('should set workout rating', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutRating(5);
      expect(workoutPage.currentWorkout.rating).toBe(5);
    });
  });

  describe('getWorkoutNotes', () => {
    test('should get workout notes', () => {
      workoutPage.currentWorkout = { notes: 'Test notes' };
      const notes = workoutPage.getWorkoutNotes();
      expect(notes).toBe('Test notes');
    });
  });

  describe('setWorkoutNotes', () => {
    test('should set workout notes', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutNotes('Test notes');
      expect(workoutPage.currentWorkout.notes).toBe('Test notes');
    });
  });

  describe('getWorkoutTags', () => {
    test('should get workout tags', () => {
      workoutPage.currentWorkout = { tags: ['strength', 'chest'] };
      const tags = workoutPage.getWorkoutTags();
      expect(tags).toEqual(['strength', 'chest']);
    });
  });

  describe('setWorkoutTags', () => {
    test('should set workout tags', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutTags(['strength', 'chest']);
      expect(workoutPage.currentWorkout.tags).toEqual(['strength', 'chest']);
    });
  });

  describe('getWorkoutLocation', () => {
    test('should get workout location', () => {
      workoutPage.currentWorkout = { location: 'Gym' };
      const location = workoutPage.getWorkoutLocation();
      expect(location).toBe('Gym');
    });
  });

  describe('setWorkoutLocation', () => {
    test('should set workout location', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutLocation('Gym');
      expect(workoutPage.currentWorkout.location).toBe('Gym');
    });
  });

  describe('getWorkoutWeather', () => {
    test('should get workout weather', () => {
      workoutPage.currentWorkout = { weather: 'Sunny' };
      const weather = workoutPage.getWorkoutWeather();
      expect(weather).toBe('Sunny');
    });
  });

  describe('setWorkoutWeather', () => {
    test('should set workout weather', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutWeather('Sunny');
      expect(workoutPage.currentWorkout.weather).toBe('Sunny');
    });
  });

  describe('getWorkoutMood', () => {
    test('should get workout mood', () => {
      workoutPage.currentWorkout = { mood: 'Great' };
      const mood = workoutPage.getWorkoutMood();
      expect(mood).toBe('Great');
    });
  });

  describe('setWorkoutMood', () => {
    test('should set workout mood', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutMood('Great');
      expect(workoutPage.currentWorkout.mood).toBe('Great');
    });
  });

  describe('getWorkoutEnergy', () => {
    test('should get workout energy', () => {
      workoutPage.currentWorkout = { energy: 'High' };
      const energy = workoutPage.getWorkoutEnergy();
      expect(energy).toBe('High');
    });
  });

  describe('setWorkoutEnergy', () => {
    test('should set workout energy', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutEnergy('High');
      expect(workoutPage.currentWorkout.energy).toBe('High');
    });
  });

  describe('getWorkoutFocus', () => {
    test('should get workout focus', () => {
      workoutPage.currentWorkout = { focus: 'Strength' };
      const focus = workoutPage.getWorkoutFocus();
      expect(focus).toBe('Strength');
    });
  });

  describe('setWorkoutFocus', () => {
    test('should set workout focus', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutFocus('Strength');
      expect(workoutPage.currentWorkout.focus).toBe('Strength');
    });
  });

  describe('getWorkoutGoal', () => {
    test('should get workout goal', () => {
      workoutPage.currentWorkout = { goal: 'Build Muscle' };
      const goal = workoutPage.getWorkoutGoal();
      expect(goal).toBe('Build Muscle');
    });
  });

  describe('setWorkoutGoal', () => {
    test('should set workout goal', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutGoal('Build Muscle');
      expect(workoutPage.currentWorkout.goal).toBe('Build Muscle');
    });
  });

  describe('getWorkoutType', () => {
    test('should get workout type', () => {
      workoutPage.currentWorkout = { type: 'Strength' };
      const type = workoutPage.getWorkoutType();
      expect(type).toBe('Strength');
    });
  });

  describe('setWorkoutType', () => {
    test('should set workout type', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutType('Strength');
      expect(workoutPage.currentWorkout.type).toBe('Strength');
    });
  });

  describe('getWorkoutEquipment', () => {
    test('should get workout equipment', () => {
      workoutPage.currentWorkout = { equipment: ['Barbell', 'Dumbbells'] };
      const equipment = workoutPage.getWorkoutEquipment();
      expect(equipment).toEqual(['Barbell', 'Dumbbells']);
    });
  });

  describe('setWorkoutEquipment', () => {
    test('should set workout equipment', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutEquipment(['Barbell', 'Dumbbells']);
      expect(workoutPage.currentWorkout.equipment).toEqual(['Barbell', 'Dumbbells']);
    });
  });

  describe('getWorkoutDuration', () => {
    test('should get workout duration', () => {
      workoutPage.workoutStartTime = Date.now() - 60000; // 1 minute ago
      const duration = workoutPage.getWorkoutDuration();
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('getWorkoutCalories', () => {
    test('should get workout calories', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const calories = workoutPage.getWorkoutCalories();
      expect(calories).toBeDefined();
    });
  });

  describe('getWorkoutVolume', () => {
    test('should get workout volume', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const volume = workoutPage.getWorkoutVolume();
      expect(volume).toBeDefined();
    });
  });

  describe('getWorkoutIntensity', () => {
    test('should get workout intensity', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const intensity = workoutPage.getWorkoutIntensity();
      expect(intensity).toBeDefined();
    });
  });

  describe('getWorkoutDifficulty', () => {
    test('should get workout difficulty', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const difficulty = workoutPage.getWorkoutDifficulty();
      expect(difficulty).toBeDefined();
    });
  });

  describe('getWorkoutRating', () => {
    test('should get workout rating', () => {
      workoutPage.currentWorkout = { exercises: [] };
      const rating = workoutPage.getWorkoutRating();
      expect(rating).toBeDefined();
    });
  });

  describe('setWorkoutRating', () => {
    test('should set workout rating', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutRating(5);
      expect(workoutPage.currentWorkout.rating).toBe(5);
    });
  });

  describe('getWorkoutNotes', () => {
    test('should get workout notes', () => {
      workoutPage.currentWorkout = { notes: 'Test notes' };
      const notes = workoutPage.getWorkoutNotes();
      expect(notes).toBe('Test notes');
    });
  });

  describe('setWorkoutNotes', () => {
    test('should set workout notes', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutNotes('Test notes');
      expect(workoutPage.currentWorkout.notes).toBe('Test notes');
    });
  });

  describe('getWorkoutTags', () => {
    test('should get workout tags', () => {
      workoutPage.currentWorkout = { tags: ['strength', 'chest'] };
      const tags = workoutPage.getWorkoutTags();
      expect(tags).toEqual(['strength', 'chest']);
    });
  });

  describe('setWorkoutTags', () => {
    test('should set workout tags', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutTags(['strength', 'chest']);
      expect(workoutPage.currentWorkout.tags).toEqual(['strength', 'chest']);
    });
  });

  describe('getWorkoutLocation', () => {
    test('should get workout location', () => {
      workoutPage.currentWorkout = { location: 'Gym' };
      const location = workoutPage.getWorkoutLocation();
      expect(location).toBe('Gym');
    });
  });

  describe('setWorkoutLocation', () => {
    test('should set workout location', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutLocation('Gym');
      expect(workoutPage.currentWorkout.location).toBe('Gym');
    });
  });

  describe('getWorkoutWeather', () => {
    test('should get workout weather', () => {
      workoutPage.currentWorkout = { weather: 'Sunny' };
      const weather = workoutPage.getWorkoutWeather();
      expect(weather).toBe('Sunny');
    });
  });

  describe('setWorkoutWeather', () => {
    test('should set workout weather', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutWeather('Sunny');
      expect(workoutPage.currentWorkout.weather).toBe('Sunny');
    });
  });

  describe('getWorkoutMood', () => {
    test('should get workout mood', () => {
      workoutPage.currentWorkout = { mood: 'Great' };
      const mood = workoutPage.getWorkoutMood();
      expect(mood).toBe('Great');
    });
  });

  describe('setWorkoutMood', () => {
    test('should set workout mood', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutMood('Great');
      expect(workoutPage.currentWorkout.mood).toBe('Great');
    });
  });

  describe('getWorkoutEnergy', () => {
    test('should get workout energy', () => {
      workoutPage.currentWorkout = { energy: 'High' };
      const energy = workoutPage.getWorkoutEnergy();
      expect(energy).toBe('High');
    });
  });

  describe('setWorkoutEnergy', () => {
    test('should set workout energy', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutEnergy('High');
      expect(workoutPage.currentWorkout.energy).toBe('High');
    });
  });

  describe('getWorkoutFocus', () => {
    test('should get workout focus', () => {
      workoutPage.currentWorkout = { focus: 'Strength' };
      const focus = workoutPage.getWorkoutFocus();
      expect(focus).toBe('Strength');
    });
  });

  describe('setWorkoutFocus', () => {
    test('should set workout focus', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutFocus('Strength');
      expect(workoutPage.currentWorkout.focus).toBe('Strength');
    });
  });

  describe('getWorkoutGoal', () => {
    test('should get workout goal', () => {
      workoutPage.currentWorkout = { goal: 'Build Muscle' };
      const goal = workoutPage.getWorkoutGoal();
      expect(goal).toBe('Build Muscle');
    });
  });

  describe('setWorkoutGoal', () => {
    test('should set workout goal', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutGoal('Build Muscle');
      expect(workoutPage.currentWorkout.goal).toBe('Build Muscle');
    });
  });

  describe('getWorkoutType', () => {
    test('should get workout type', () => {
      workoutPage.currentWorkout = { type: 'Strength' };
      const type = workoutPage.getWorkoutType();
      expect(type).toBe('Strength');
    });
  });

  describe('setWorkoutType', () => {
    test('should set workout type', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutType('Strength');
      expect(workoutPage.currentWorkout.type).toBe('Strength');
    });
  });

  describe('getWorkoutEquipment', () => {
    test('should get workout equipment', () => {
      workoutPage.currentWorkout = { equipment: ['Barbell', 'Dumbbells'] };
      const equipment = workoutPage.getWorkoutEquipment();
      expect(equipment).toEqual(['Barbell', 'Dumbbells']);
    });
  });

  describe('setWorkoutEquipment', () => {
    test('should set workout equipment', () => {
      workoutPage.currentWorkout = { exercises: [] };
      workoutPage.setWorkoutEquipment(['Barbell', 'Dumbbells']);
      expect(workoutPage.currentWorkout.equipment).toEqual(['Barbell', 'Dumbbells']);
    });
  });
});
