// DevTools.test.js - DevToolsのテスト

import { DevTools } from '../../js/utils/DevTools.js';

describe('DevTools', () => {
  let devTools;

  beforeEach(() => {
    devTools = new DevTools();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(devTools).toBeDefined();
      expect(devTools.isEnabled).toBe(false);
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
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      devTools.log('Test message');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test message');
      consoleSpy.mockRestore();
    });

    test('should not log message when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      devTools.log('Test message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('warn', () => {
    test('should warn message when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      devTools.warn('Test warning');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test warning');
      consoleSpy.mockRestore();
    });

    test('should not warn message when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      devTools.warn('Test warning');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('error', () => {
    test('should error message when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      devTools.error('Test error');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test error');
      consoleSpy.mockRestore();
    });

    test('should not error message when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      devTools.error('Test error');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('group', () => {
    test('should group messages when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      
      devTools.group('Test group');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test group');
      consoleSpy.mockRestore();
    });

    test('should not group messages when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      
      devTools.group('Test group');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('groupEnd', () => {
    test('should end group when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
      
      devTools.groupEnd();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should not end group when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
      
      devTools.groupEnd();
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('time', () => {
    test('should start timer when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'time').mockImplementation();
      
      devTools.time('Test timer');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test timer');
      consoleSpy.mockRestore();
    });

    test('should not start timer when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'time').mockImplementation();
      
      devTools.time('Test timer');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('timeEnd', () => {
    test('should end timer when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'timeEnd').mockImplementation();
      
      devTools.timeEnd('Test timer');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test timer');
      consoleSpy.mockRestore();
    });

    test('should not end timer when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'timeEnd').mockImplementation();
      
      devTools.timeEnd('Test timer');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('table', () => {
    test('should log table when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'table').mockImplementation();
      
      devTools.table({ name: 'Test' });
      
      expect(consoleSpy).toHaveBeenCalledWith({ name: 'Test' });
      consoleSpy.mockRestore();
    });

    test('should not log table when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'table').mockImplementation();
      
      devTools.table({ name: 'Test' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trace', () => {
    test('should trace when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'trace').mockImplementation();
      
      devTools.trace('Test trace');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test trace');
      consoleSpy.mockRestore();
    });

    test('should not trace when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'trace').mockImplementation();
      
      devTools.trace('Test trace');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('clear', () => {
    test('should clear console when enabled', () => {
      devTools.enable();
      const consoleSpy = jest.spyOn(console, 'clear').mockImplementation();
      
      devTools.clear();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should not clear console when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'clear').mockImplementation();
      
      devTools.clear();
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    test('should return status when disabled', () => {
      const status = devTools.getStatus();
      expect(status).toBe(false);
    });

    test('should return status when enabled', () => {
      devTools.enable();
      const status = devTools.getStatus();
      expect(status).toBe(true);
    });
  });
});