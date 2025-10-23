import { DevTools } from '../../js/utils/DevTools.js';

describe('DevTools', () => {
  let devTools;

  beforeEach(() => {
    devTools = new DevTools();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(devTools).toBeDefined();
      expect(devTools.isEnabled).toBe(false);
      expect(devTools.logs).toEqual([]);
    });
  });

  describe('enable', () => {
    test('should enable dev tools', () => {
      devTools.enable();
      expect(devTools.isEnabled).toBe(true);
    });
  });

  describe('disable', () => {
    test('should disable dev tools', () => {
      devTools.enable();
      devTools.disable();
      expect(devTools.isEnabled).toBe(false);
    });
  });

  describe('log', () => {
    test('should log message when enabled', () => {
      devTools.enable();
      devTools.log('Test message');
      expect(devTools.logs).toContain('Test message');
      expect(console.log).toHaveBeenCalledWith('DevTools LOG:', 'Test message');
    });

    test('should not log when disabled', () => {
      devTools.log('Test message');
      expect(devTools.logs).not.toContain('Test message');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('clearLogs', () => {
    test('should clear logs', () => {
      devTools.enable();
      devTools.log('Test message');
      devTools.clearLogs();
      expect(devTools.logs).toEqual([]);
    });
  });

  describe('getLogs', () => {
    test('should return logs', () => {
      devTools.enable();
      devTools.log('Test message 1');
      devTools.log('Test message 2');
      expect(devTools.getLogs()).toEqual(['Test message 1', 'Test message 2']);
    });
  });

  describe('measurePerformance', () => {
    test('should measure performance when enabled', () => {
      devTools.enable();
      const mockFn = jest.fn(() => 'result');
      const result = devTools.measurePerformance('testFunction', mockFn);
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DevTools PERFORMANCE: testFunction took'));
    });

    test('should execute function without measurement when disabled', () => {
      const mockFn = jest.fn(() => 'result');
      const result = devTools.measurePerformance('testFunction', mockFn);
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('DevTools PERFORMANCE:'));
    });
  });

  describe('checkMemoryUsage', () => {
    test('should check memory usage when enabled', () => {
      devTools.enable();
      const memoryUsage = devTools.checkMemoryUsage();
      expect(memoryUsage).toBeDefined();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DevTools MEMORY:'));
    });

    test('should return null when disabled', () => {
      const memoryUsage = devTools.checkMemoryUsage();
      expect(memoryUsage).toBeNull();
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('DevTools MEMORY:'));
    });
  });

  describe('validateData', () => {
    test('should validate data when enabled', () => {
      devTools.enable();
      const mockValidator = jest.fn().mockReturnValue(true);
      const result = devTools.validateData('testData', mockValidator);
      expect(mockValidator).toHaveBeenCalledWith('testData');
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DevTools VALIDATION: testData is valid: true'));
    });

    test('should return true when disabled', () => {
      const mockValidator = jest.fn().mockReturnValue(false);
      const result = devTools.validateData('testData', mockValidator);
      expect(mockValidator).not.toHaveBeenCalled();
      expect(result).toBe(true);
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('DevTools VALIDATION:'));
    });
  });
});