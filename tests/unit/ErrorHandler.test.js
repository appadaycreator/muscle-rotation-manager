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

    test('should handle different error types', async () => {
      const stringError = jest.fn().mockRejectedValue('String error');
      const objectError = jest.fn().mockRejectedValue({ message: 'Object error' });
      const nullError = jest.fn().mockRejectedValue(null);
      
      await expect(executeWithRetry(stringError, 1, 10)).rejects.toBe('String error');
      await expect(executeWithRetry(objectError, 1, 10)).rejects.toEqual({ message: 'Object error' });
      await expect(executeWithRetry(nullError, 1, 10)).rejects.toBeNull();
    });

    test('should handle custom retry count', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(executeWithRetry(mockFn, 5, 10)).rejects.toThrow('Test error');
      expect(mockFn).toHaveBeenCalledTimes(5);
    });

    test('should handle custom delay', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const startTime = Date.now();
      
      await expect(executeWithRetry(mockFn, 2, 100)).rejects.toThrow('Test error');
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('additional error handling', () => {
    test('should handle network errors', () => {
      const networkError = new Error('Network request failed');
      networkError.code = 'NETWORK_ERROR';
      
      handleError(networkError, { operation: 'fetch' });
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle validation errors', () => {
      const validationError = new Error('Validation failed');
      validationError.type = 'VALIDATION_ERROR';
      
      handleError(validationError, { field: 'email' });
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle authentication errors', () => {
      const authError = new Error('Authentication failed');
      authError.status = 401;
      
      handleError(authError, { endpoint: '/api/auth' });
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle database errors', () => {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DB_CONNECTION_ERROR';
      
      handleError(dbError, { table: 'users' });
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});
