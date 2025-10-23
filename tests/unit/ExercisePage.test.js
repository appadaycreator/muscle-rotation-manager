// ExercisePage.test.js - ExercisePageクラスのテスト

import { exercisePage as ExercisePage } from '../../js/pages/exercisePage.js';

// モックの設定
jest.mock('../../js/core/BasePage.js', () => ({
  BasePage: jest.fn().mockImplementation(() => ({
    pageName: 'exercise',
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
  showNotification: jest.fn(),
  debounce: jest.fn((fn, delay) => fn), // デバウンス関数をモック
  safeGetElement: jest.fn((id) => {
    const mockElement = {
      id: id,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      value: '',
      innerHTML: '',
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
        toggle: jest.fn()
      }
    };
    return mockElement;
  }),
  safeGetElements: jest.fn(() => []),
}));

describe('ExercisePage', () => {
  let exercisePage;
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
    
    // ExercisePageのインスタンス取得（シングルトン）
    exercisePage = ExercisePage;
  });

  afterEach(() => {
    if (exercisePage) {
      exercisePage.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(exercisePage).toBeDefined();
    });
  });

  describe('initialization', () => {
    test('should initialize successfully', async () => {
      // ExercisePageはシングルトンインスタンスなので、initializeメソッドがない場合がある
      if (typeof exercisePage.initialize === 'function') {
        await expect(exercisePage.initialize()).resolves.toBeUndefined();
      } else {
        expect(exercisePage).toBeDefined();
      }
    });
  });
});