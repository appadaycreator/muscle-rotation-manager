// tests/unit/BasePage.test.js - BasePage コンポーネントのテスト

import { BasePage } from '../../js/core/BasePage.js';

// authManagerモジュールをモック
jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn()
  }
}));

// supabaseServiceモジュールをモック
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getClient: jest.fn(),
    saveData: jest.fn(),
    loadData: jest.fn()
  }
}));

describe('BasePage', () => {
  let basePage;

  beforeEach(() => {
    basePage = new BasePage();
    
    // モックの設定
    const { authManager } = require('../../js/modules/authManager.js');
    const { supabaseService } = require('../../js/services/supabaseService.js');
    
    authManager.isAuthenticated = jest.fn().mockResolvedValue(true);
    authManager.getCurrentUser = jest.fn().mockReturnValue({ email: 'test@example.com' });
    
    supabaseService.isAvailable = jest.fn().mockReturnValue(true);
    supabaseService.getClient = jest.fn().mockReturnValue({});
    supabaseService.saveData = jest.fn().mockResolvedValue({});
    supabaseService.loadData = jest.fn().mockResolvedValue([]);
    
    global.showNotification = jest.fn();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(basePage.isInitialized).toBe(false);
      expect(basePage.pageName).toBeDefined();
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await basePage.initialize();
      
      expect(basePage.isInitialized).toBe(true);
    });

    test('should not initialize if already initialized', async () => {
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