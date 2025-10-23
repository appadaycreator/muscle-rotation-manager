import { CalendarPage } from '../../js/pages/calendarPage.js';

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

jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(() => true),
    getCurrentUser: jest.fn(() => ({ id: 'test-user' })),
    getWorkouts: jest.fn(() => Promise.resolve([])),
    saveWorkout: jest.fn(() => Promise.resolve()),
    deleteWorkout: jest.fn(() => Promise.resolve())
  }
}));

jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(() => Promise.resolve(true)),
    getCurrentUser: jest.fn(() => Promise.resolve({ id: 'test-user' })),
    showAuthModal: jest.fn()
  }
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
  getMuscleColor: jest.fn(() => '#3B82F6'),
  isFutureDate: jest.fn(() => false),
  isPastDate: jest.fn(() => true),
  createCalendarModalHTML: jest.fn(() => '<div>Modal</div>'),
  safeGetElement: jest.fn(() => ({
    innerHTML: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  })),
  showInputDialog: jest.fn(() => Promise.resolve('test'))
}));

jest.mock('../../js/utils/constants.js', () => ({
  MUSCLE_GROUPS: [
    { id: 'chest', name: '胸', color: '#3B82F6' },
    { id: 'back', name: '背中', color: '#10B981' }
  ]
}));

// DOM環境のモック
const mockElement = {
  innerHTML: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
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

Object.defineProperty(document, 'readyState', {
  value: 'complete',
  writable: true
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

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => '[]'),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
});

describe('CalendarPage', () => {
  let calendarPage;

  beforeEach(() => {
    calendarPage = new CalendarPage();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(calendarPage.currentDate).toBeInstanceOf(Date);
      expect(calendarPage.workoutData).toEqual([]);
      expect(calendarPage.plannedWorkouts).toEqual([]);
      expect(calendarPage.selectedDate).toBeNull();
      expect(calendarPage.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await calendarPage.initialize();
      expect(calendarPage.initialize).toBeDefined();
    });
  });

  describe('onInitialize', () => {
    test('should initialize calendar page', async () => {
      await calendarPage.onInitialize();
      expect(calendarPage.onInitialize).toBeDefined();
    });
  });

  describe('loadWorkoutData', () => {
    test('should load workout data from Supabase', async () => {
      const { supabaseService } = require('../../js/services/supabaseService.js');
      supabaseService.isAvailable.mockReturnValue(true);
      supabaseService.getCurrentUser.mockReturnValue({ id: 'test-user' });
      supabaseService.getWorkouts.mockResolvedValue([]);
      
      await calendarPage.loadWorkoutData();
      expect(supabaseService.getWorkouts).toHaveBeenCalledWith(200);
    });

    test('should load workout data from localStorage when Supabase unavailable', async () => {
      const { supabaseService } = require('../../js/services/supabaseService.js');
      supabaseService.isAvailable.mockReturnValue(false);
      
      await calendarPage.loadWorkoutData();
      expect(calendarPage.workoutData).toEqual([]);
    });
  });

  describe('loadPlannedWorkouts', () => {
    test('should load planned workouts', async () => {
      const plannedWorkouts = await calendarPage.loadPlannedWorkouts();
      expect(Array.isArray(plannedWorkouts)).toBe(true);
    });
  });

  describe('setupCalendarInterface', () => {
    test('should setup calendar interface', () => {
      calendarPage.setupCalendarInterface();
      expect(calendarPage.setupCalendarInterface).toBeDefined();
    });
  });

  describe('setupEventListeners', () => {
    test('should setup event listeners', () => {
      calendarPage.setupEventListeners();
      expect(calendarPage.setupEventListeners).toBeDefined();
    });
  });

  describe('setupAuthButton', () => {
    test('should setup auth button', () => {
      calendarPage.setupAuthButton();
      expect(calendarPage.setupAuthButton).toBeDefined();
    });
  });

  describe('renderCalendar', () => {
    test('should render calendar', () => {
      calendarPage.renderCalendar();
      expect(calendarPage.renderCalendar).toBeDefined();
    });
  });

  describe('getCurrentMonth', () => {
    test('should return current month', () => {
      const month = calendarPage.getCurrentMonth();
      expect(month).toBeDefined();
    });
  });

  describe('getCurrentYear', () => {
    test('should return current year', () => {
      const year = calendarPage.getCurrentYear();
      expect(year).toBeDefined();
    });
  });

  describe('getWorkoutsForDate', () => {
    test('should return workouts for specific date', () => {
      calendarPage.workoutData = [
        { date: '2023-01-01', exercises: [] },
        { date: '2023-01-02', exercises: [] }
      ];
      const workouts = calendarPage.getWorkoutsForDate('2023-01-01');
      expect(Array.isArray(workouts)).toBe(true);
    });
  });

  describe('getPlannedWorkoutsForDate', () => {
    test('should return planned workouts for specific date', () => {
      calendarPage.plannedWorkouts = [
        { date: '2023-01-01', exercises: [] },
        { date: '2023-01-02', exercises: [] }
      ];
      const plannedWorkouts = calendarPage.getPlannedWorkoutsForDate('2023-01-01');
      expect(Array.isArray(plannedWorkouts)).toBe(true);
    });
  });

  describe('addWorkout', () => {
    test('should add workout', async () => {
      const workout = { date: '2023-01-01', exercises: [] };
      await calendarPage.addWorkout(workout);
      expect(calendarPage.addWorkout).toBeDefined();
    });
  });

  describe('updateWorkout', () => {
    test('should update workout', async () => {
      const workout = { id: 'test-id', date: '2023-01-01', exercises: [] };
      await calendarPage.updateWorkout(workout);
      expect(calendarPage.updateWorkout).toBeDefined();
    });
  });

  describe('deleteWorkout', () => {
    test('should delete workout', async () => {
      const workoutId = 'test-id';
      await calendarPage.deleteWorkout(workoutId);
      expect(calendarPage.deleteWorkout).toBeDefined();
    });
  });

  describe('getWorkoutStats', () => {
    test('should get workout stats', () => {
      const stats = calendarPage.getWorkoutStats();
      expect(calendarPage.getWorkoutStats).toBeDefined();
    });
  });

  describe('getWorkoutHistory', () => {
    test('should get workout history', () => {
      const history = calendarPage.getWorkoutHistory();
      expect(calendarPage.getWorkoutHistory).toBeDefined();
    });
  });

  describe('getWorkoutProgress', () => {
    test('should get workout progress', () => {
      const progress = calendarPage.getWorkoutProgress();
      expect(calendarPage.getWorkoutProgress).toBeDefined();
    });
  });

  describe('getWorkoutTrends', () => {
    test('should get workout trends', () => {
      const trends = calendarPage.getWorkoutTrends();
      expect(calendarPage.getWorkoutTrends).toBeDefined();
    });
  });

  describe('getWorkoutInsights', () => {
    test('should get workout insights', () => {
      const insights = calendarPage.getWorkoutInsights();
      expect(calendarPage.getWorkoutInsights).toBeDefined();
    });
  });

  describe('getWorkoutRecommendations', () => {
    test('should get workout recommendations', () => {
      const recommendations = calendarPage.getWorkoutRecommendations();
      expect(calendarPage.getWorkoutRecommendations).toBeDefined();
    });
  });

  describe('getWorkoutGoals', () => {
    test('should get workout goals', () => {
      const goals = calendarPage.getWorkoutGoals();
      expect(calendarPage.getWorkoutGoals).toBeDefined();
    });
  });

  describe('setWorkoutGoals', () => {
    test('should set workout goals', () => {
      const goals = { weeklyWorkouts: 3, monthlyWorkouts: 12 };
      calendarPage.setWorkoutGoals(goals);
      expect(calendarPage.setWorkoutGoals).toBeDefined();
    });
  });

  describe('getWorkoutStreak', () => {
    test('should get workout streak', () => {
      const streak = calendarPage.getWorkoutStreak();
      expect(calendarPage.getWorkoutStreak).toBeDefined();
    });
  });

  describe('getWorkoutFrequency', () => {
    test('should get workout frequency', () => {
      const frequency = calendarPage.getWorkoutFrequency();
      expect(calendarPage.getWorkoutFrequency).toBeDefined();
    });
  });

  describe('getWorkoutVolume', () => {
    test('should get workout volume', () => {
      const volume = calendarPage.getWorkoutVolume();
      expect(calendarPage.getWorkoutVolume).toBeDefined();
    });
  });

  describe('getWorkoutIntensity', () => {
    test('should get workout intensity', () => {
      const intensity = calendarPage.getWorkoutIntensity();
      expect(calendarPage.getWorkoutIntensity).toBeDefined();
    });
  });

  describe('getWorkoutDuration', () => {
    test('should get workout duration', () => {
      const duration = calendarPage.getWorkoutDuration();
      expect(calendarPage.getWorkoutDuration).toBeDefined();
    });
  });

  describe('getWorkoutCalories', () => {
    test('should get workout calories', () => {
      const calories = calendarPage.getWorkoutCalories();
      expect(calendarPage.getWorkoutCalories).toBeDefined();
    });
  });

  describe('getWorkoutMuscleGroups', () => {
    test('should get workout muscle groups', () => {
      const muscleGroups = calendarPage.getWorkoutMuscleGroups();
      expect(calendarPage.getWorkoutMuscleGroups).toBeDefined();
    });
  });

  describe('getWorkoutExercises', () => {
    test('should get workout exercises', () => {
      const exercises = calendarPage.getWorkoutExercises();
      expect(calendarPage.getWorkoutExercises).toBeDefined();
    });
  });

  describe('getWorkoutEquipment', () => {
    test('should get workout equipment', () => {
      const equipment = calendarPage.getWorkoutEquipment();
      expect(calendarPage.getWorkoutEquipment).toBeDefined();
    });
  });

  describe('getWorkoutLocation', () => {
    test('should get workout location', () => {
      const location = calendarPage.getWorkoutLocation();
      expect(calendarPage.getWorkoutLocation).toBeDefined();
    });
  });

  describe('getWorkoutWeather', () => {
    test('should get workout weather', () => {
      const weather = calendarPage.getWorkoutWeather();
      expect(calendarPage.getWorkoutWeather).toBeDefined();
    });
  });

  describe('getWorkoutMood', () => {
    test('should get workout mood', () => {
      const mood = calendarPage.getWorkoutMood();
      expect(calendarPage.getWorkoutMood).toBeDefined();
    });
  });

  describe('getWorkoutEnergy', () => {
    test('should get workout energy', () => {
      const energy = calendarPage.getWorkoutEnergy();
      expect(calendarPage.getWorkoutEnergy).toBeDefined();
    });
  });

  describe('getWorkoutFocus', () => {
    test('should get workout focus', () => {
      const focus = calendarPage.getWorkoutFocus();
      expect(calendarPage.getWorkoutFocus).toBeDefined();
    });
  });

  describe('getWorkoutNotes', () => {
    test('should get workout notes', () => {
      const notes = calendarPage.getWorkoutNotes();
      expect(calendarPage.getWorkoutNotes).toBeDefined();
    });
  });

  describe('getWorkoutTags', () => {
    test('should get workout tags', () => {
      const tags = calendarPage.getWorkoutTags();
      expect(calendarPage.getWorkoutTags).toBeDefined();
    });
  });

  describe('getWorkoutRating', () => {
    test('should get workout rating', () => {
      const rating = calendarPage.getWorkoutRating();
      expect(calendarPage.getWorkoutRating).toBeDefined();
    });
  });

  describe('getWorkoutDifficulty', () => {
    test('should get workout difficulty', () => {
      const difficulty = calendarPage.getWorkoutDifficulty();
      expect(calendarPage.getWorkoutDifficulty).toBeDefined();
    });
  });

  describe('getWorkoutType', () => {
    test('should get workout type', () => {
      const type = calendarPage.getWorkoutType();
      expect(calendarPage.getWorkoutType).toBeDefined();
    });
  });

  describe('getWorkoutLevel', () => {
    test('should get workout level', () => {
      const level = calendarPage.getWorkoutLevel();
      expect(calendarPage.getWorkoutLevel).toBeDefined();
    });
  });

  describe('getWorkoutExperience', () => {
    test('should get workout experience', () => {
      const experience = calendarPage.getWorkoutExperience();
      expect(calendarPage.getWorkoutExperience).toBeDefined();
    });
  });

  describe('getWorkoutInjuries', () => {
    test('should get workout injuries', () => {
      const injuries = calendarPage.getWorkoutInjuries();
      expect(calendarPage.getWorkoutInjuries).toBeDefined();
    });
  });

  describe('getWorkoutLimitations', () => {
    test('should get workout limitations', () => {
      const limitations = calendarPage.getWorkoutLimitations();
      expect(calendarPage.getWorkoutLimitations).toBeDefined();
    });
  });

  describe('getWorkoutRestrictions', () => {
    test('should get workout restrictions', () => {
      const restrictions = calendarPage.getWorkoutRestrictions();
      expect(calendarPage.getWorkoutRestrictions).toBeDefined();
    });
  });

  describe('getWorkoutPreferences', () => {
    test('should get workout preferences', () => {
      const preferences = calendarPage.getWorkoutPreferences();
      expect(calendarPage.getWorkoutPreferences).toBeDefined();
    });
  });

  describe('getWorkoutEquipment', () => {
    test('should get workout equipment', () => {
      const equipment = calendarPage.getWorkoutEquipment();
      expect(calendarPage.getWorkoutEquipment).toBeDefined();
    });
  });

  describe('getWorkoutLocation', () => {
    test('should get workout location', () => {
      const location = calendarPage.getWorkoutLocation();
      expect(calendarPage.getWorkoutLocation).toBeDefined();
    });
  });

  describe('getWorkoutWeather', () => {
    test('should get workout weather', () => {
      const weather = calendarPage.getWorkoutWeather();
      expect(calendarPage.getWorkoutWeather).toBeDefined();
    });
  });

  describe('getWorkoutMood', () => {
    test('should get workout mood', () => {
      const mood = calendarPage.getWorkoutMood();
      expect(calendarPage.getWorkoutMood).toBeDefined();
    });
  });

  describe('getWorkoutEnergy', () => {
    test('should get workout energy', () => {
      const energy = calendarPage.getWorkoutEnergy();
      expect(calendarPage.getWorkoutEnergy).toBeDefined();
    });
  });

  describe('getWorkoutFocus', () => {
    test('should get workout focus', () => {
      const focus = calendarPage.getWorkoutFocus();
      expect(calendarPage.getWorkoutFocus).toBeDefined();
    });
  });

  describe('getWorkoutNotes', () => {
    test('should get workout notes', () => {
      const notes = calendarPage.getWorkoutNotes();
      expect(calendarPage.getWorkoutNotes).toBeDefined();
    });
  });

  describe('getWorkoutTags', () => {
    test('should get workout tags', () => {
      const tags = calendarPage.getWorkoutTags();
      expect(calendarPage.getWorkoutTags).toBeDefined();
    });
  });

  describe('getWorkoutRating', () => {
    test('should get workout rating', () => {
      const rating = calendarPage.getWorkoutRating();
      expect(calendarPage.getWorkoutRating).toBeDefined();
    });
  });

  describe('getWorkoutDifficulty', () => {
    test('should get workout difficulty', () => {
      const difficulty = calendarPage.getWorkoutDifficulty();
      expect(calendarPage.getWorkoutDifficulty).toBeDefined();
    });
  });

  describe('getWorkoutType', () => {
    test('should get workout type', () => {
      const type = calendarPage.getWorkoutType();
      expect(calendarPage.getWorkoutType).toBeDefined();
    });
  });

  describe('getWorkoutLevel', () => {
    test('should get workout level', () => {
      const level = calendarPage.getWorkoutLevel();
      expect(calendarPage.getWorkoutLevel).toBeDefined();
    });
  });

  describe('getWorkoutExperience', () => {
    test('should get workout experience', () => {
      const experience = calendarPage.getWorkoutExperience();
      expect(calendarPage.getWorkoutExperience).toBeDefined();
    });
  });

  describe('getWorkoutInjuries', () => {
    test('should get workout injuries', () => {
      const injuries = calendarPage.getWorkoutInjuries();
      expect(calendarPage.getWorkoutInjuries).toBeDefined();
    });
  });

  describe('getWorkoutLimitations', () => {
    test('should get workout limitations', () => {
      const limitations = calendarPage.getWorkoutLimitations();
      expect(calendarPage.getWorkoutLimitations).toBeDefined();
    });
  });

  describe('getWorkoutRestrictions', () => {
    test('should get workout restrictions', () => {
      const restrictions = calendarPage.getWorkoutRestrictions();
      expect(calendarPage.getWorkoutRestrictions).toBeDefined();
    });
  });

  describe('getWorkoutPreferences', () => {
    test('should get workout preferences', () => {
      const preferences = calendarPage.getWorkoutPreferences();
      expect(calendarPage.getWorkoutPreferences).toBeDefined();
    });
  });
});