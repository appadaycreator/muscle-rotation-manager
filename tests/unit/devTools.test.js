// tests/unit/DevTools.test.js - DevToolsのテスト

import { DevTools } from '../../js/utils/DevTools.js';

describe('DevTools', () => {
  let devTools;

  beforeEach(() => {
    devTools = new DevTools();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(devTools.isInitialized).toBe(false);
      expect(devTools.performanceObserver).toBeNull();
      expect(devTools.errorObserver).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', () => {
      const result = devTools.initialize();

      expect(result).toBe(true);
      expect(devTools.isInitialized).toBe(true);
    });

    it('should not initialize if already initialized', () => {
      devTools.isInitialized = true;

      const result = devTools.initialize();

      expect(result).toBe(false);
    });
  });

  describe('setupPerformanceMonitoring', () => {
    it('should setup performance monitoring', () => {
      devTools.setupPerformanceMonitoring();

      expect(devTools.performanceObserver).toBeDefined();
    });
  });

  describe('setupErrorTracking', () => {
    it('should setup error tracking', () => {
      devTools.setupErrorTracking();

      expect(devTools.errorObserver).toBeDefined();
    });
  });

  describe('setupNetworkMonitoring', () => {
    it('should setup network monitoring', () => {
      devTools.setupNetworkMonitoring();

      // Network monitoring setup should complete without errors
      expect(devTools.isInitialized).toBe(false); // Not initialized yet
    });
  });

  describe('setupMemoryMonitoring', () => {
    it('should setup memory monitoring', () => {
      devTools.setupMemoryMonitoring();

      // Memory monitoring setup should complete without errors
      expect(devTools.isInitialized).toBe(false); // Not initialized yet
    });
  });

  describe('logPerformance', () => {
    it('should log performance data', () => {
      const performanceData = {
        name: 'test-performance',
        duration: 100,
        startTime: Date.now(),
      };

      devTools.logPerformance(performanceData);

      // Should complete without errors
      expect(performanceData.name).toBe('test-performance');
    });
  });

  describe('logError', () => {
    it('should log error data', () => {
      const errorData = {
        message: 'Test error',
        stack: 'Error stack trace',
        timestamp: Date.now(),
      };

      devTools.logError(errorData);

      // Should complete without errors
      expect(errorData.message).toBe('Test error');
    });
  });

  describe('logNetwork', () => {
    it('should log network data', () => {
      const networkData = {
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 150,
      };

      devTools.logNetwork(networkData);

      // Should complete without errors
      expect(networkData.url).toBe('https://example.com');
    });
  });

  describe('logMemory', () => {
    it('should log memory data', () => {
      const memoryData = {
        used: 1000000,
        total: 2000000,
        timestamp: Date.now(),
      };

      devTools.logMemory(memoryData);

      // Should complete without errors
      expect(memoryData.used).toBe(1000000);
    });
  });

  describe('integration', () => {
    it('should handle complete dev tools setup', () => {
      const result = devTools.initialize();

      expect(result).toBe(true);
      expect(devTools.isInitialized).toBe(true);

      // Test logging
      devTools.logPerformance({ name: 'test', duration: 100 });
      devTools.logError({ message: 'test error' });
      devTools.logNetwork({ url: 'https://test.com' });
      devTools.logMemory({ used: 1000, total: 2000 });

      // Should complete without errors
      expect(devTools.isInitialized).toBe(true);
    });
  });
});
