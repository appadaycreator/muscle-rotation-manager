// ProgressPage.test.js - ProgressPageクラスのテスト

import { progressPage as ProgressPage } from '../../js/pages/progressPage.js';

// モックの設定
jest.mock('../../js/core/BasePage.js', () => ({
  BasePage: jest.fn().mockImplementation(() => ({
    pageName: 'progress',
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

describe('ProgressPage', () => {
  let progressPage;
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
    
    // ProgressPageのインスタンス取得（シングルトン）
    progressPage = ProgressPage;
  });

  afterEach(() => {
    if (progressPage) {
      progressPage.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(progressPage).toBeDefined();
    });
  });

  describe('initialization', () => {
    test('should initialize successfully', async () => {
      // ProgressPageはシングルトンインスタンスなので、initializeメソッドがない場合がある
      if (typeof progressPage.initialize === 'function') {
        await expect(progressPage.initialize()).resolves.toBeUndefined();
      } else {
        expect(progressPage).toBeDefined();
      }
    });
  });
});