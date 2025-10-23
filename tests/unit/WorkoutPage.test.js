// WorkoutPage.test.js - WorkoutPageクラスのテスト

import { workoutPage as WorkoutPage } from '../../js/pages/workoutPage.js';

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
    
    // WorkoutPageのモジュール取得
    workoutPage = WorkoutPage;
  });

  afterEach(() => {
    if (workoutPage) {
      workoutPage.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      // WorkoutPageモジュールの基本構造を確認
      expect(workoutPage).toBeDefined();
      expect(typeof workoutPage.initialize).toBe('function');
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      // WorkoutPageの初期化をテスト
      await expect(workoutPage.initialize()).resolves.toBeUndefined();
    });
  });

  describe('basic functionality', () => {
    test('should have required methods', () => {
      // WorkoutPageモジュールの基本機能を確認
      expect(workoutPage).toBeDefined();
      expect(typeof workoutPage.initialize).toBe('function');
    });
  });

});
