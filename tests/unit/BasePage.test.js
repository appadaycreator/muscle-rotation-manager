// tests/unit/BasePage.test.js - BasePage コンポーネントのテスト

import { BasePage } from '../../js/core/BasePage.js';

describe('BasePage', () => {
  let basePage;

  beforeEach(() => {
    basePage = new BasePage();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(basePage.isInitialized).toBe(false);
      expect(basePage.pageName).toBeDefined();
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      // モックの設定
      global.authManager = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        getCurrentUser: jest.fn().mockReturnValue({ email: 'test@example.com' })
      };
      global.supabaseService = {
        getClient: jest.fn().mockReturnValue({})
      };
      global.showNotification = jest.fn();
      
      await basePage.initialize();
      
      expect(basePage.isInitialized).toBe(true);
    });

    test('should not initialize if already initialized', async () => {
      // モックの設定
      global.authManager = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        getCurrentUser: jest.fn().mockReturnValue({ email: 'test@example.com' })
      };
      global.supabaseService = {
        getClient: jest.fn().mockReturnValue({})
      };
      global.showNotification = jest.fn();
      
      await basePage.initialize();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await basePage.initialize();
      
      expect(consoleSpy).not.toHaveBeenCalledWith('🔄 Initializing basepage...');
      consoleSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    test('should destroy page', () => {
      basePage.isInitialized = true;
      
      basePage.destroy();
      
      expect(basePage.isInitialized).toBe(false);
    });
  });
});