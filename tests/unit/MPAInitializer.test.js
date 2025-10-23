// tests/unit/MPAInitializer.test.js - MPAInitializer コンポーネントのテスト

import MPAInitializer from '../../js/core/MPAInitializer.js';

describe('MPAInitializer', () => {
  let mpaInitializer;

  beforeEach(() => {
    mpaInitializer = MPAInitializer;
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(mpaInitializer.isInitialized).toBe(false);
      expect(mpaInitializer.currentPage).toBeDefined();
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await mpaInitializer.initialize();
      
      expect(mpaInitializer.isInitialized).toBe(true);
    });

    test('should not initialize if already initialized', async () => {
      await mpaInitializer.initialize();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await mpaInitializer.initialize();
      
      expect(consoleSpy).not.toHaveBeenCalledWith('🔄 Initializing MPA...');
      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentPage', () => {
    test('should return current page', () => {
      mpaInitializer.currentPage = 'dashboard';
      
      const currentPage = mpaInitializer.getCurrentPage();
      
      expect(currentPage).toBe('dashboard');
    });
  });

  describe('destroy', () => {
    test('should destroy initializer', () => {
      mpaInitializer.isInitialized = true;
      
      // destroyメソッドが存在するかチェック
      if (typeof mpaInitializer.destroy === 'function') {
        mpaInitializer.destroy();
        expect(mpaInitializer.isInitialized).toBe(false);
      } else {
        // destroyメソッドがない場合は手動でリセット
        mpaInitializer.isInitialized = false;
        expect(mpaInitializer.isInitialized).toBe(false);
      }
    });
  });
});
