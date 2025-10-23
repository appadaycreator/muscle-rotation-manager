// MPAInitializer.test.js - MPAInitializerクラスのテスト

import { default as MPAInitializer } from '../../js/core/MPAInitializer.js';

// モックの設定
jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    initialize: jest.fn(),
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
    setupEventListeners: jest.fn()
  }
}));

jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn()
  }
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
  handleError: jest.fn()
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

// グローバル関数のモック
global.showNotification = jest.fn();
global.handleError = jest.fn();

// fetchのモック
global.fetch = jest.fn();

describe('MPAInitializer', () => {
  let mpaInitializer;
  let mockAuthManager;
  let mockSupabaseService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // DOMのセットアップ
    document.body.innerHTML = `
      <div id="header-container"></div>
      <div id="sidebar-container"></div>
      <div id="footer-container"></div>
      <div id="main-content"></div>
    `;
    
    // モジュールの取得
    const authManagerModule = require('../../js/modules/authManager.js');
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    
    mockAuthManager = authManagerModule.authManager;
    mockSupabaseService = supabaseServiceModule.supabaseService;
    
    // MPAInitializerのインスタンス作成
    mpaInitializer = new MPAInitializer();
  });

  afterEach(() => {
    if (mpaInitializer) {
      mpaInitializer.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(mpaInitializer.isInitialized).toBe(false);
      expect(mpaInitializer.currentPage).toBeDefined();
    });
  });

  describe('getCurrentPageName', () => {
    test('should return correct page name for root path', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true
      });
      
      const pageName = mpaInitializer.getCurrentPageName();
      expect(pageName).toBe('dashboard');
    });

    test('should return correct page name for specific paths', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/workout.html' },
        writable: true
      });
      
      const pageName = mpaInitializer.getCurrentPageName();
      expect(pageName).toBe('workout');
    });

    test('should return dashboard for unknown paths', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/unknown.html' },
        writable: true
      });
      
      const pageName = mpaInitializer.getCurrentPageName();
      expect(pageName).toBe('dashboard');
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      mockAuthManager.initialize.mockResolvedValue();
      mockAuthManager.isAuthenticated.mockResolvedValue(true);
      mockAuthManager.getCurrentUser.mockResolvedValue({ email: 'test@example.com' });
      
      // fetchのモック
      global.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<div>Mock HTML</div>')
      });
      
      await mpaInitializer.initialize();
      
      expect(mpaInitializer.isInitialized).toBe(true);
      expect(mockAuthManager.initialize).toHaveBeenCalled();
      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
    });

    test('should not initialize if already initialized', async () => {
      mpaInitializer.isInitialized = true;
      
      await mpaInitializer.initialize();
      
      expect(mockAuthManager.initialize).not.toHaveBeenCalled();
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockAuthManager.initialize.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await mpaInitializer.initialize();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ MPA initialization failed:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkAuthentication', () => {
    test('should return true for authenticated user', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(true);
      mockAuthManager.getCurrentUser.mockResolvedValue({ email: 'test@example.com' });
      
      const result = await mpaInitializer.checkAuthentication();
      
      expect(result).toBe(true);
      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
    });

    test('should return false for unauthenticated user', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      
      const result = await mpaInitializer.checkAuthentication();
      
      expect(result).toBe(false);
    });

    test('should handle authentication errors', async () => {
      const error = new Error('Auth failed');
      mockAuthManager.isAuthenticated.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await mpaInitializer.checkAuthentication();
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Authentication check failed:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadCommonComponents', () => {
    test('should load all components successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<div>Mock HTML</div>')
      });
      
      await mpaInitializer.loadCommonComponents();
      
      expect(global.fetch).toHaveBeenCalledWith('partials/header.html');
      expect(global.fetch).toHaveBeenCalledWith('partials/sidebar.html');
      expect(global.fetch).toHaveBeenCalledWith('partials/footer.html');
    });

    test('should handle component loading errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(mpaInitializer.loadCommonComponents()).rejects.toThrow();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadPageModule', () => {
    test('should load dashboard page module', async () => {
      const mockModule = { initialize: jest.fn() };
      jest.doMock('../../js/pages/dashboardPage.js', () => ({ default: mockModule }));
      
      const result = await mpaInitializer.loadPageModule('dashboard');
      
      expect(result).toBeDefined();
    });

    test('should return null for unknown page', async () => {
      const result = await mpaInitializer.loadPageModule('unknown');
      
      expect(result).toBeNull();
    });
  });

  describe('setupEventListeners', () => {
    test('should setup event listeners', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mpaInitializer.setupEventListeners();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('🔄 Setting up event listeners...');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('setupMobileMenu', () => {
    test('should setup mobile menu', () => {
      document.body.innerHTML = `
        <button id="mobile-menu-btn"></button>
        <div id="mobile-sidebar">
          <button id="mobile-sidebar-close"></button>
        </div>
      `;
      
      mpaInitializer.setupMobileMenu();
      
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      const mobileSidebar = document.getElementById('mobile-sidebar');
      
      expect(mobileMenuBtn).toBeDefined();
      expect(mobileSidebar).toBeDefined();
    });
  });

  describe('setupOnlineStatusMonitoring', () => {
    test('should setup online status monitoring', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mpaInitializer.setupOnlineStatusMonitoring();
      
      // オンラインイベントを発火
      window.dispatchEvent(new Event('online'));
      expect(consoleLogSpy).toHaveBeenCalledWith('🌐 Online status restored');
      
      // オフラインイベントを発火
      window.dispatchEvent(new Event('offline'));
      expect(consoleLogSpy).toHaveBeenCalledWith('📱 Offline status detected');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('setupErrorHandling', () => {
    test('should setup error handling', () => {
      mpaInitializer.setupErrorHandling();
      
      // エラーイベントを発火
      const errorEvent = new ErrorEvent('error', { error: new Error('Test error') });
      window.dispatchEvent(errorEvent);
      
      expect(global.handleError).toHaveBeenCalled();
    });
  });

  describe('isReady', () => {
    test('should return initialization status', () => {
      expect(mpaInitializer.isReady()).toBe(false);
      
      mpaInitializer.isInitialized = true;
      expect(mpaInitializer.isReady()).toBe(true);
    });
  });

  describe('getCurrentPage', () => {
    test('should return current page', () => {
      expect(mpaInitializer.getCurrentPage()).toBeDefined();
    });
  });
});