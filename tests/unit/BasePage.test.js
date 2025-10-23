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