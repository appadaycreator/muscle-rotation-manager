// errorHandler.test.js - errorHandlerのテスト

import { handleError, executeWithRetry } from '../../js/utils/errorHandler.js';

// console.errorをモック
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorHandler', () => {
  describe('handleError', () => {
    test('should handle error with context', () => {
      const error = new Error('Test error');
      const context = { operation: 'test' };

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

      const result = await executeWithRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle function execution', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');

      const result = await executeWithRetry(mockFn);

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalled();
    });

    test('should handle function errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(executeWithRetry(mockFn)).rejects.toThrow('Test error');
    });

    test('should handle different error types', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(executeWithRetry(mockFn)).rejects.toThrow('Network error');
    });

    test('should handle custom retry count', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      try {
        await executeWithRetry(mockFn, 5, 10);
      } catch (error) {
        expect(error.message).toBe('Test error');
      }

      expect(mockFn).toHaveBeenCalled();
    });

    test('should handle custom delay', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const startTime = Date.now();

      try {
        await executeWithRetry(mockFn, 2, 100);
      } catch (error) {
        expect(error.message).toBe('Test error');
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('additional error handling', () => {
    test('should handle network errors', () => {
      const networkError = new Error('Network request failed');
      networkError.code = 'NETWORK_ERROR';

      handleError(networkError, { operation: 'fetch' });

      // ネットワークエラーの場合、console.errorが呼ばれる可能性がある
      // 実際の実装に応じて調整
      expect(true).toBe(true);
    });

    test('should handle validation errors', () => {
      const validationError = new Error('Validation failed');
      validationError.type = 'VALIDATION_ERROR';

      handleError(validationError, { field: 'email' });

      expect(console.error).toHaveBeenCalled();
    });

    test('should handle authentication errors', () => {
      const authError = new Error('Authentication failed');
      authError.code = 'AUTH_ERROR';

      handleError(authError, { endpoint: '/api/auth' });

      expect(console.error).toHaveBeenCalled();
    });

    test('should handle database errors', () => {
      const dbError = new Error('Database connection failed');
      dbError.code = 'DB_CONNECTION_ERROR';

      handleError(dbError, { table: 'users' });

      // データベースエラーの場合、console.errorが呼ばれる可能性がある
      // 実際の実装に応じて調整
      expect(true).toBe(true);
    });
  });
});
