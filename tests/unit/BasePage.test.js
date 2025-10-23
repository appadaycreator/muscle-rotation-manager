// tests/unit/BasePage.test.js - BasePageクラスのテスト

import { BasePage } from '../../js/core/BasePage.js';

describe('BasePage', () => {
  let basePage;
  let mockAuthManager;
  let mockSupabaseService;

  beforeEach(() => {
    // モックの設定
    mockAuthManager = {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      getCurrentUser: jest.fn().mockReturnValue({ email: 'test@example.com' })
    };

    mockSupabaseService = {
      isAvailable: jest.fn().mockReturnValue(true),
      saveData: jest.fn().mockResolvedValue({ id: 1 }),
      loadData: jest.fn().mockResolvedValue([]),
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
          })
        })
      })
    };

    // グローバルモックの設定
    global.authManager = mockAuthManager;
    global.supabaseService = mockSupabaseService;

    basePage = new BasePage();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      const mockOnInitialize = jest.fn().mockResolvedValue();
      const mockSetupEventListeners = jest.fn();
      const mockLoadData = jest.fn().mockResolvedValue();

      basePage.onInitialize = mockOnInitialize;
      basePage.setupEventListeners = mockSetupEventListeners;
      basePage.loadData = mockLoadData;

      await basePage.initialize();

      expect(basePage.isInitialized).toBe(true);
      expect(mockOnInitialize).toHaveBeenCalled();
      expect(mockSetupEventListeners).toHaveBeenCalled();
      expect(mockLoadData).toHaveBeenCalled();
    });

    test('should not initialize if already initialized', async () => {
      basePage.isInitialized = true;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await basePage.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Page base already initialized');
      consoleSpy.mockRestore();
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      basePage.onInitialize = jest.fn().mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const handleErrorSpy = jest.spyOn(basePage, 'handleError').mockImplementation();

      await basePage.initialize();

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to initialize base page:', error);
      expect(handleErrorSpy).toHaveBeenCalledWith(error);
      
      consoleErrorSpy.mockRestore();
      handleErrorSpy.mockRestore();
    });
  });

  describe('checkAuthentication', () => {
    test('should pass for authenticated user', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(true);
      basePage.requiresAuth = jest.fn().mockReturnValue(true);

      await basePage.checkAuthentication();

      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
    });

    test('should redirect for unauthenticated user', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      basePage.requiresAuth = jest.fn().mockReturnValue(true);
      
      const mockShowNotification = jest.fn();
      global.showNotification = mockShowNotification;
      
      // window.location.hrefのモック
      delete window.location;
      window.location = { href: '' };

      await basePage.checkAuthentication();

      expect(mockShowNotification).toHaveBeenCalledWith('ログインが必要です', 'warning');
      expect(window.location.href).toBe('/index.html');
    });
  });

  describe('addEventListener', () => {
    test('should add event listener to element', () => {
      const element = document.createElement('button');
      const handler = jest.fn();
      
      basePage.addEventListener(element, 'click', handler);
      
      expect(basePage.eventListeners.size).toBe(1);
    });

    test('should not add listener if element is null', () => {
      const handler = jest.fn();
      
      basePage.addEventListener(null, 'click', handler);
      
      expect(basePage.eventListeners.size).toBe(0);
    });

    test('should not add listener if handler is not function', () => {
      const element = document.createElement('button');
      
      basePage.addEventListener(element, 'click', 'not a function');
      
      expect(basePage.eventListeners.size).toBe(0);
    });
  });

  describe('removeEventListener', () => {
    test('should remove event listener', () => {
      const element = document.createElement('button');
      const handler = jest.fn();
      
      basePage.addEventListener(element, 'click', handler);
      expect(basePage.eventListeners.size).toBe(1);
      
      basePage.removeEventListener(element, 'click', handler);
      expect(basePage.eventListeners.size).toBe(0);
    });
  });

  describe('cleanup', () => {
    test('should remove all event listeners', () => {
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      basePage.addEventListener(element1, 'click', handler1);
      basePage.addEventListener(element2, 'change', handler2);
      expect(basePage.eventListeners.size).toBe(2);
      
      basePage.cleanup();
      expect(basePage.eventListeners.size).toBe(0);
    });
  });

  describe('destroy', () => {
    test('should destroy page and cleanup', () => {
      const cleanupSpy = jest.spyOn(basePage, 'cleanup');
      
      basePage.destroy();
      
      expect(cleanupSpy).toHaveBeenCalled();
      expect(basePage.isInitialized).toBe(false);
    });
  });

  describe('saveData', () => {
    test('should save data via Supabase when available', async () => {
      const data = { test: 'data' };
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockResolvedValue({ id: 1 });

      const result = await basePage.saveData(data);

      expect(mockSupabaseService.saveData).toHaveBeenCalledWith(data);
      expect(result).toEqual({ id: 1 });
    });

    test('should save to localStorage when Supabase unavailable', async () => {
      const data = { test: 'data' };
      mockSupabaseService.isAvailable.mockReturnValue(false);
      
      const saveToLocalStorageSpy = jest.spyOn(basePage, 'saveToLocalStorage').mockResolvedValue({ id: 1 });

      const result = await basePage.saveData(data);

      expect(saveToLocalStorageSpy).toHaveBeenCalledWith(data);
      expect(result).toEqual({ id: 1 });
    });

    test('should handle save errors', async () => {
      const data = { test: 'data' };
      const error = new Error('Save failed');
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.saveData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(basePage.saveData(data)).rejects.toThrow('Save failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save data:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadDataFromStorage', () => {
    test('should load data via Supabase when available', async () => {
      const mockData = [{ id: 1, name: 'test' }];
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockResolvedValue(mockData);

      const result = await basePage.loadDataFromStorage();

      expect(mockSupabaseService.loadData).toHaveBeenCalledWith('base');
      expect(result).toEqual(mockData);
    });

    test('should load from localStorage when Supabase unavailable', async () => {
      const mockData = [{ id: 1, name: 'test' }];
      mockSupabaseService.isAvailable.mockReturnValue(false);
      
      const loadFromLocalStorageSpy = jest.spyOn(basePage, 'loadFromLocalStorage').mockResolvedValue(mockData);

      const result = await basePage.loadDataFromStorage();

      expect(loadFromLocalStorageSpy).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('should handle load errors', async () => {
      const error = new Error('Load failed');
      mockSupabaseService.isAvailable.mockReturnValue(true);
      mockSupabaseService.loadData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await basePage.loadDataFromStorage();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load data:', error);
      expect(result).toEqual([]);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getState', () => {
    test('should return current state', () => {
      const state = basePage.getState();
      
      expect(state).toEqual({
        pageName: 'base',
        isInitialized: false,
        eventListenersCount: 0
      });
    });
  });
});
