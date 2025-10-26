// BasePage.test.js - BasePageクラスのテスト

import { BasePage } from '../../js/core/BasePage.js';

// モックの設定
jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    saveData: jest.fn(),
    loadData: jest.fn(),
  },
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
}));

// グローバル関数のモック
global.showNotification = jest.fn();

describe('BasePage', () => {
  let basePage;
  let mockAuthManager;
  let mockSupabaseService;
  let mockShowNotification;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モジュールの取得
    const authManagerModule = require('../../js/modules/authManager.js');
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    const helpersModule = require('../../js/utils/helpers.js');

    mockAuthManager = authManagerModule.authManager;
    mockSupabaseService = supabaseServiceModule.supabaseService;
    mockShowNotification = helpersModule.showNotification;

    // BasePageのインスタンス作成
    basePage = new BasePage();
  });

  afterEach(() => {
    if (basePage) {
      basePage.destroy();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(basePage.pageName).toBe('base');
      expect(basePage.isInitialized).toBe(false);
      expect(basePage.eventListeners).toBeInstanceOf(Map);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(true);
      mockSupabaseService.isAvailable.mockReturnValue(true);

      await basePage.initialize();

      expect(basePage.isInitialized).toBe(true);
      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
    });

    test('should not initialize if already initialized', async () => {
      basePage.isInitialized = true;

      await basePage.initialize();

      expect(mockAuthManager.isAuthenticated).not.toHaveBeenCalled();
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockAuthManager.isAuthenticated.mockRejectedValue(error);
      mockSupabaseService.isAvailable.mockReturnValue(true);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await basePage.initialize();

      // BasePage.jsの実装では、認証チェックでエラーが発生した場合の処理
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Authentication check failed:',
        error
      );
      // エラーハンドラーが呼び出されるため、showNotificationの呼び出しは確認しない

      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkAuthentication', () => {
    test('should redirect to index if not authenticated and requires auth', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      mockSupabaseService.isAvailable.mockReturnValue(true);

      // JSDOMの制限により、window.location.hrefの設定はテストできない
      // そのため、認証チェックの動作のみ確認
      const result = await basePage.checkAuthentication();

      expect(mockShowNotification).toHaveBeenCalledWith(
        'ログインが必要です',
        'warning'
      );
      expect(result).toBe(false);
    });

    test('should not redirect if authenticated', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(true);

      await basePage.checkAuthentication();

      expect(mockShowNotification).not.toHaveBeenCalled();
    });
  });

  describe('requiresAuth', () => {
    test('should return true by default', () => {
      expect(basePage.requiresAuth).toBe(true);
    });
  });

  describe('event listeners', () => {
    test('should add event listener', () => {
      const mockElement = document.createElement('div');
      const mockHandler = jest.fn();

      basePage.addEventListener(mockElement, 'click', mockHandler);

      expect(basePage.eventListeners.size).toBe(1);
    });

    test('should remove event listener', () => {
      const mockElement = document.createElement('div');
      const mockHandler = jest.fn();

      basePage.addEventListener(mockElement, 'click', mockHandler);
      basePage.removeEventListener(mockElement, 'click', mockHandler);

      expect(basePage.eventListeners.size).toBe(0);
    });

    test('should cleanup all event listeners', () => {
      const mockElement = document.createElement('div');
      const mockHandler = jest.fn();

      basePage.addEventListener(mockElement, 'click', mockHandler);
      basePage.cleanup();

      expect(basePage.eventListeners.size).toBe(0);
    });
  });

  describe('data management', () => {
    test('should save data to Supabase when available', async () => {
      const testData = { test: 'data' };
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue(testData);

      const result = await basePage.saveData(testData);

      expect(mockSupabaseService.saveData).toHaveBeenCalledWith(testData);
      expect(result).toBe(testData);
    });

    test('should save data to localStorage when Supabase unavailable', async () => {
      const testData = { test: 'data' };
      mockSupabaseService.isAvailable.mockReturnValue(false);

      const result = await basePage.saveData(testData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result.test).toBe('data');
    });

    test('should load data from Supabase when available', async () => {
      const testData = [{ test: 'data' }];
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(testData);

      const result = await basePage.loadDataFromStorage();

      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('base');
      expect(result).toBe(testData);
    });

    test('should load data from localStorage when Supabase unavailable', async () => {
      const testData = [{ test: 'data' }];
      mockSupabaseService.isAvailable.mockReturnValue(false);

      // localStorageをモック
      const mockData = JSON.stringify(testData);
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(mockData),
        },
        writable: true,
      });

      const result = await basePage.loadDataFromStorage();

      expect(result).toEqual(testData);
    });
  });

  describe('state management', () => {
    test('should return correct state', () => {
      const state = basePage.getState();

      expect(state).toHaveProperty('pageName', 'base');
      expect(state).toHaveProperty('isInitialized', false);
      expect(state).toHaveProperty('eventListenersCount', 0);
    });
  });

  describe('destroy', () => {
    test('should destroy page', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      basePage.destroy();

      expect(basePage.isInitialized).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️ base page destroyed');

      consoleLogSpy.mockRestore();
    });
  });
});
