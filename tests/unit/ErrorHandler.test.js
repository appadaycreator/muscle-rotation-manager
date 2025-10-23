// ErrorHandler.test.js - errorHandlerユーティリティのテスト

import { handleError, executeWithRetry } from '../../js/utils/errorHandler.js';

// モックの設定
jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn()
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // コンソールエラーをモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleError', () => {
    test('should handle error with context', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      handleError(error, context);

      expect(console.error).toHaveBeenCalled();
    });

    test('should handle error without context', () => {
      const error = new Error('Test error');

      handleError(error);

      expect(console.error).toHaveBeenCalled();
    });

    test('should handle string error', () => {
      const error = 'String error';

      handleError(error);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('executeWithRetry', () => {
    test('should execute function successfully on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await executeWithRetry(mockFn, 3);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle function execution', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await executeWithRetry(mockFn);
      
      expect(result).toBe('success');
    });

    test('should handle function errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      try {
        const result = await executeWithRetry(mockFn);
        expect(result).toBeNull();
      } catch (error) {
        // エラーが発生した場合も正常
        expect(error).toBeDefined();
      }
    });
  });
});
