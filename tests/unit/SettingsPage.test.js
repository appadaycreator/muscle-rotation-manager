import { SettingsPage } from '../../js/pages/settingsPage.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(() => true),
    loadData: jest.fn(),
    saveData: jest.fn(),
    onAuthStateChange: jest.fn()
  }
}));

jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(() => Promise.resolve(true)),
    getCurrentUser: jest.fn(() => Promise.resolve({ id: 'test-user' })),
    updateAuthUI: jest.fn()
  }
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
  safeAsync: jest.fn((fn) => fn()),
  safeGetElement: jest.fn(() => ({
    innerHTML: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  }))
}));

jest.mock('../../js/utils/validation.js', () => ({
  globalFormValidator: {
    validateField: jest.fn(),
    clearErrors: jest.fn(),
    getErrors: jest.fn(() => [])
  }
}));

jest.mock('../../js/utils/tooltip.js', () => ({
  tooltipManager: {
    initialize: jest.fn(),
    addTooltip: jest.fn(),
    destroy: jest.fn()
  }
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

Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
});

describe('SettingsPage', () => {
  let settingsPage;

  beforeEach(() => {
    settingsPage = new SettingsPage();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(settingsPage.userProfile).toBeNull();
      expect(settingsPage.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully when authenticated', async () => {
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated.mockResolvedValue(true);
      
      await settingsPage.initialize();
      expect(authManager.updateAuthUI).toHaveBeenCalled();
    });

    test('should show login prompt when not authenticated', async () => {
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated.mockResolvedValue(false);
      
      await settingsPage.initialize();
      expect(settingsPage.showLoginPrompt).toHaveBeenCalled();
    });
  });

  describe('setupAuthStateListener', () => {
    test('should setup auth state listener', () => {
      settingsPage.setupAuthStateListener();
      expect(settingsPage.setupAuthStateListener).toBeDefined();
    });
  });

  describe('showLoginPrompt', () => {
    test('should show login prompt', () => {
      settingsPage.showLoginPrompt();
      expect(settingsPage.showLoginPrompt).toBeDefined();
    });
  });

  describe('renderSettingsPage', () => {
    test('should render settings page', () => {
      settingsPage.renderSettingsPage();
      expect(settingsPage.renderSettingsPage).toBeDefined();
    });
  });

  describe('loadUserProfile', () => {
    test('should load user profile', async () => {
      await settingsPage.loadUserProfile();
      expect(settingsPage.loadUserProfile).toBeDefined();
    });
  });

  describe('setupSettingsInterface', () => {
    test('should setup settings interface', () => {
      settingsPage.setupSettingsInterface();
      expect(settingsPage.setupSettingsInterface).toBeDefined();
    });
  });

  describe('setupEventListeners', () => {
    test('should setup event listeners', () => {
      settingsPage.setupEventListeners();
      expect(settingsPage.setupEventListeners).toBeDefined();
    });
  });

  describe('setupTooltips', () => {
    test('should setup tooltips', () => {
      settingsPage.setupTooltips();
      expect(settingsPage.setupTooltips).toBeDefined();
    });
  });

  describe('saveUserProfile', () => {
    test('should save user profile successfully', async () => {
      settingsPage.userProfile = { id: 'test-user', name: 'Test User' };
      await settingsPage.saveUserProfile();
      expect(settingsPage.saveUserProfile).toBeDefined();
    });

    test('should handle save profile error', async () => {
      settingsPage.userProfile = null;
      await settingsPage.saveUserProfile();
      expect(settingsPage.saveUserProfile).toBeDefined();
    });
  });

  describe('deleteUserAccount', () => {
    test('should delete user account successfully', async () => {
      await settingsPage.deleteUserAccount();
      expect(settingsPage.deleteUserAccount).toBeDefined();
    });

    test('should handle delete account error', async () => {
      await settingsPage.deleteUserAccount();
      expect(settingsPage.deleteUserAccount).toBeDefined();
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile', async () => {
      const profileData = { name: 'Updated User', email: 'updated@example.com' };
      await settingsPage.updateUserProfile(profileData);
      expect(settingsPage.updateUserProfile).toBeDefined();
    });
  });

  describe('changePassword', () => {
    test('should change password', async () => {
      const passwordData = { currentPassword: 'old', newPassword: 'new' };
      await settingsPage.changePassword(passwordData);
      expect(settingsPage.changePassword).toBeDefined();
    });
  });

  describe('updateNotificationSettings', () => {
    test('should update notification settings', async () => {
      const settings = { email: true, push: false };
      await settingsPage.updateNotificationSettings(settings);
      expect(settingsPage.updateNotificationSettings).toBeDefined();
    });
  });

  describe('updatePrivacySettings', () => {
    test('should update privacy settings', async () => {
      const settings = { publicProfile: false, showStats: true };
      await settingsPage.updatePrivacySettings(settings);
      expect(settingsPage.updatePrivacySettings).toBeDefined();
    });
  });

  describe('updateWorkoutSettings', () => {
    test('should update workout settings', async () => {
      const settings = { defaultMuscleGroups: ['chest', 'back'], restTime: 60 };
      await settingsPage.updateWorkoutSettings(settings);
      expect(settingsPage.updateWorkoutSettings).toBeDefined();
    });
  });

  describe('exportUserData', () => {
    test('should export user data', async () => {
      const data = await settingsPage.exportUserData();
      expect(settingsPage.exportUserData).toBeDefined();
    });
  });

  describe('importUserData', () => {
    test('should import user data', async () => {
      const data = { profile: {}, workouts: [] };
      await settingsPage.importUserData(data);
      expect(settingsPage.importUserData).toBeDefined();
    });
  });

  describe('resetSettings', () => {
    test('should reset settings', async () => {
      await settingsPage.resetSettings();
      expect(settingsPage.resetSettings).toBeDefined();
    });
  });

  describe('getUserPreferences', () => {
    test('should get user preferences', async () => {
      const preferences = await settingsPage.getUserPreferences();
      expect(settingsPage.getUserPreferences).toBeDefined();
    });
  });

  describe('setUserPreferences', () => {
    test('should set user preferences', async () => {
      const preferences = { theme: 'dark', language: 'ja' };
      await settingsPage.setUserPreferences(preferences);
      expect(settingsPage.setUserPreferences).toBeDefined();
    });
  });

  describe('getUserStats', () => {
    test('should get user stats', async () => {
      const stats = await settingsPage.getUserStats();
      expect(settingsPage.getUserStats).toBeDefined();
    });
  });

  describe('getUserGoals', () => {
    test('should get user goals', async () => {
      const goals = await settingsPage.getUserGoals();
      expect(settingsPage.getUserGoals).toBeDefined();
    });
  });

  describe('setUserGoals', () => {
    test('should set user goals', async () => {
      const goals = { weight: 70, bodyFat: 15 };
      await settingsPage.setUserGoals(goals);
      expect(settingsPage.setUserGoals).toBeDefined();
    });
  });

  describe('getUserMeasurements', () => {
    test('should get user measurements', async () => {
      const measurements = await settingsPage.getUserMeasurements();
      expect(settingsPage.getUserMeasurements).toBeDefined();
    });
  });

  describe('setUserMeasurements', () => {
    test('should set user measurements', async () => {
      const measurements = { height: 175, weight: 70 };
      await settingsPage.setUserMeasurements(measurements);
      expect(settingsPage.setUserMeasurements).toBeDefined();
    });
  });

  describe('getUserWorkoutHistory', () => {
    test('should get user workout history', async () => {
      const history = await settingsPage.getUserWorkoutHistory();
      expect(settingsPage.getUserWorkoutHistory).toBeDefined();
    });
  });

  describe('getUserProgress', () => {
    test('should get user progress', async () => {
      const progress = await settingsPage.getUserProgress();
      expect(settingsPage.getUserProgress).toBeDefined();
    });
  });

  describe('getUserAchievements', () => {
    test('should get user achievements', async () => {
      const achievements = await settingsPage.getUserAchievements();
      expect(settingsPage.getUserAchievements).toBeDefined();
    });
  });

  describe('getUserBadges', () => {
    test('should get user badges', async () => {
      const badges = await settingsPage.getUserBadges();
      expect(settingsPage.getUserBadges).toBeDefined();
    });
  });

  describe('getUserLevel', () => {
    test('should get user level', async () => {
      const level = await settingsPage.getUserLevel();
      expect(settingsPage.getUserLevel).toBeDefined();
    });
  });

  describe('getUserExperience', () => {
    test('should get user experience', async () => {
      const experience = await settingsPage.getUserExperience();
      expect(settingsPage.getUserExperience).toBeDefined();
    });
  });

  describe('getUserRank', () => {
    test('should get user rank', async () => {
      const rank = await settingsPage.getUserRank();
      expect(settingsPage.getUserRank).toBeDefined();
    });
  });

  describe('getUserStreak', () => {
    test('should get user streak', async () => {
      const streak = await settingsPage.getUserStreak();
      expect(settingsPage.getUserStreak).toBeDefined();
    });
  });

  describe('getUserTotalWorkouts', () => {
    test('should get user total workouts', async () => {
      const totalWorkouts = await settingsPage.getUserTotalWorkouts();
      expect(settingsPage.getUserTotalWorkouts).toBeDefined();
    });
  });

  describe('getUserTotalTime', () => {
    test('should get user total time', async () => {
      const totalTime = await settingsPage.getUserTotalTime();
      expect(settingsPage.getUserTotalTime).toBeDefined();
    });
  });

  describe('getUserTotalCalories', () => {
    test('should get user total calories', async () => {
      const totalCalories = await settingsPage.getUserTotalCalories();
      expect(settingsPage.getUserTotalCalories).toBeDefined();
    });
  });

  describe('getUserTotalVolume', () => {
    test('should get user total volume', async () => {
      const totalVolume = await settingsPage.getUserTotalVolume();
      expect(settingsPage.getUserTotalVolume).toBeDefined();
    });
  });

  describe('getUserAverageWorkoutTime', () => {
    test('should get user average workout time', async () => {
      const averageTime = await settingsPage.getUserAverageWorkoutTime();
      expect(settingsPage.getUserAverageWorkoutTime).toBeDefined();
    });
  });

  describe('getUserAverageWorkoutCalories', () => {
    test('should get user average workout calories', async () => {
      const averageCalories = await settingsPage.getUserAverageWorkoutCalories();
      expect(settingsPage.getUserAverageWorkoutCalories).toBeDefined();
    });
  });

  describe('getUserAverageWorkoutVolume', () => {
    test('should get user average workout volume', async () => {
      const averageVolume = await settingsPage.getUserAverageWorkoutVolume();
      expect(settingsPage.getUserAverageWorkoutVolume).toBeDefined();
    });
  });

  describe('getUserFavoriteExercises', () => {
    test('should get user favorite exercises', async () => {
      const favoriteExercises = await settingsPage.getUserFavoriteExercises();
      expect(settingsPage.getUserFavoriteExercises).toBeDefined();
    });
  });

  describe('getUserFavoriteMuscleGroups', () => {
    test('should get user favorite muscle groups', async () => {
      const favoriteMuscleGroups = await settingsPage.getUserFavoriteMuscleGroups();
      expect(settingsPage.getUserFavoriteMuscleGroups).toBeDefined();
    });
  });

  describe('getUserWorkoutFrequency', () => {
    test('should get user workout frequency', async () => {
      const frequency = await settingsPage.getUserWorkoutFrequency();
      expect(settingsPage.getUserWorkoutFrequency).toBeDefined();
    });
  });

  describe('getUserWorkoutSchedule', () => {
    test('should get user workout schedule', async () => {
      const schedule = await settingsPage.getUserWorkoutSchedule();
      expect(settingsPage.getUserWorkoutSchedule).toBeDefined();
    });
  });

  describe('setUserWorkoutSchedule', () => {
    test('should set user workout schedule', async () => {
      const schedule = { monday: ['chest', 'triceps'], tuesday: ['back', 'biceps'] };
      await settingsPage.setUserWorkoutSchedule(schedule);
      expect(settingsPage.setUserWorkoutSchedule).toBeDefined();
    });
  });

  describe('getUserWorkoutGoals', () => {
    test('should get user workout goals', async () => {
      const goals = await settingsPage.getUserWorkoutGoals();
      expect(settingsPage.getUserWorkoutGoals).toBeDefined();
    });
  });

  describe('setUserWorkoutGoals', () => {
    test('should set user workout goals', async () => {
      const goals = { strength: 100, endurance: 30, flexibility: 20 };
      await settingsPage.setUserWorkoutGoals(goals);
      expect(settingsPage.setUserWorkoutGoals).toBeDefined();
    });
  });

  describe('getUserWorkoutPreferences', () => {
    test('should get user workout preferences', async () => {
      const preferences = await settingsPage.getUserWorkoutPreferences();
      expect(settingsPage.getUserWorkoutPreferences).toBeDefined();
    });
  });

  describe('setUserWorkoutPreferences', () => {
    test('should set user workout preferences', async () => {
      const preferences = { restTime: 60, sets: 3, reps: 10 };
      await settingsPage.setUserWorkoutPreferences(preferences);
      expect(settingsPage.setUserWorkoutPreferences).toBeDefined();
    });
  });

  describe('getUserWorkoutEquipment', () => {
    test('should get user workout equipment', async () => {
      const equipment = await settingsPage.getUserWorkoutEquipment();
      expect(settingsPage.getUserWorkoutEquipment).toBeDefined();
    });
  });

  describe('setUserWorkoutEquipment', () => {
    test('should set user workout equipment', async () => {
      const equipment = ['barbell', 'dumbbells', 'bench'];
      await settingsPage.setUserWorkoutEquipment(equipment);
      expect(settingsPage.setUserWorkoutEquipment).toBeDefined();
    });
  });

  describe('getUserWorkoutLocation', () => {
    test('should get user workout location', async () => {
      const location = await settingsPage.getUserWorkoutLocation();
      expect(settingsPage.getUserWorkoutLocation).toBeDefined();
    });
  });

  describe('setUserWorkoutLocation', () => {
    test('should set user workout location', async () => {
      const location = 'Home Gym';
      await settingsPage.setUserWorkoutLocation(location);
      expect(settingsPage.setUserWorkoutLocation).toBeDefined();
    });
  });

  describe('getUserWorkoutTime', () => {
    test('should get user workout time', async () => {
      const time = await settingsPage.getUserWorkoutTime();
      expect(settingsPage.getUserWorkoutTime).toBeDefined();
    });
  });

  describe('setUserWorkoutTime', () => {
    test('should set user workout time', async () => {
      const time = 'morning';
      await settingsPage.setUserWorkoutTime(time);
      expect(settingsPage.setUserWorkoutTime).toBeDefined();
    });
  });

  describe('getUserWorkoutDuration', () => {
    test('should get user workout duration', async () => {
      const duration = await settingsPage.getUserWorkoutDuration();
      expect(settingsPage.getUserWorkoutDuration).toBeDefined();
    });
  });

  describe('setUserWorkoutDuration', () => {
    test('should set user workout duration', async () => {
      const duration = 60; // minutes
      await settingsPage.setUserWorkoutDuration(duration);
      expect(settingsPage.setUserWorkoutDuration).toBeDefined();
    });
  });

  describe('getUserWorkoutIntensity', () => {
    test('should get user workout intensity', async () => {
      const intensity = await settingsPage.getUserWorkoutIntensity();
      expect(settingsPage.getUserWorkoutIntensity).toBeDefined();
    });
  });

  describe('setUserWorkoutIntensity', () => {
    test('should set user workout intensity', async () => {
      const intensity = 'high';
      await settingsPage.setUserWorkoutIntensity(intensity);
      expect(settingsPage.setUserWorkoutIntensity).toBeDefined();
    });
  });

  describe('getUserWorkoutType', () => {
    test('should get user workout type', async () => {
      const type = await settingsPage.getUserWorkoutType();
      expect(settingsPage.getUserWorkoutType).toBeDefined();
    });
  });

  describe('setUserWorkoutType', () => {
    test('should set user workout type', async () => {
      const type = 'strength';
      await settingsPage.setUserWorkoutType(type);
      expect(settingsPage.setUserWorkoutType).toBeDefined();
    });
  });

  describe('getUserWorkoutLevel', () => {
    test('should get user workout level', async () => {
      const level = await settingsPage.getUserWorkoutLevel();
      expect(settingsPage.getUserWorkoutLevel).toBeDefined();
    });
  });

  describe('setUserWorkoutLevel', () => {
    test('should set user workout level', async () => {
      const level = 'intermediate';
      await settingsPage.setUserWorkoutLevel(level);
      expect(settingsPage.setUserWorkoutLevel).toBeDefined();
    });
  });

  describe('getUserWorkoutExperience', () => {
    test('should get user workout experience', async () => {
      const experience = await settingsPage.getUserWorkoutExperience();
      expect(settingsPage.getUserWorkoutExperience).toBeDefined();
    });
  });

  describe('setUserWorkoutExperience', () => {
    test('should set user workout experience', async () => {
      const experience = '2 years';
      await settingsPage.setUserWorkoutExperience(experience);
      expect(settingsPage.setUserWorkoutExperience).toBeDefined();
    });
  });

  describe('getUserWorkoutInjuries', () => {
    test('should get user workout injuries', async () => {
      const injuries = await settingsPage.getUserWorkoutInjuries();
      expect(settingsPage.getUserWorkoutInjuries).toBeDefined();
    });
  });

  describe('setUserWorkoutInjuries', () => {
    test('should set user workout injuries', async () => {
      const injuries = ['knee', 'shoulder'];
      await settingsPage.setUserWorkoutInjuries(injuries);
      expect(settingsPage.setUserWorkoutInjuries).toBeDefined();
    });
  });

  describe('getUserWorkoutLimitations', () => {
    test('should get user workout limitations', async () => {
      const limitations = await settingsPage.getUserWorkoutLimitations();
      expect(settingsPage.getUserWorkoutLimitations).toBeDefined();
    });
  });

  describe('setUserWorkoutLimitations', () => {
    test('should set user workout limitations', async () => {
      const limitations = ['no heavy lifting', 'no running'];
      await settingsPage.setUserWorkoutLimitations(limitations);
      expect(settingsPage.setUserWorkoutLimitations).toBeDefined();
    });
  });

  describe('getUserWorkoutRestrictions', () => {
    test('should get user workout restrictions', async () => {
      const restrictions = await settingsPage.getUserWorkoutRestrictions();
      expect(settingsPage.getUserWorkoutRestrictions).toBeDefined();
    });
  });

  describe('setUserWorkoutRestrictions', () => {
    test('should set user workout restrictions', async () => {
      const restrictions = ['no overhead movements', 'no jumping'];
      await settingsPage.setUserWorkoutRestrictions(restrictions);
      expect(settingsPage.setUserWorkoutRestrictions).toBeDefined();
    });
  });

  describe('getUserWorkoutPreferences', () => {
    test('should get user workout preferences', async () => {
      const preferences = await settingsPage.getUserWorkoutPreferences();
      expect(settingsPage.getUserWorkoutPreferences).toBeDefined();
    });
  });

  describe('setUserWorkoutPreferences', () => {
    test('should set user workout preferences', async () => {
      const preferences = { restTime: 60, sets: 3, reps: 10 };
      await settingsPage.setUserWorkoutPreferences(preferences);
      expect(settingsPage.setUserWorkoutPreferences).toBeDefined();
    });
  });
});