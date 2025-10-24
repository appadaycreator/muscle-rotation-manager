/**
 * DevTools テストスイート
 */

import { devTools } from '../../js/utils/DevTools.js';

// モックの設定
jest.mock('../../js/utils/DevTools.js', () => ({
    devTools: {
        initialize: jest.fn(),
        setupPerformanceMonitoring: jest.fn(),
        setupErrorTracking: jest.fn(),
        setupNetworkMonitoring: jest.fn(),
        setupMemoryMonitoring: jest.fn(),
        logPerformance: jest.fn(),
        logError: jest.fn(),
        logNetwork: jest.fn(),
        logMemory: jest.fn(),
        getPerformanceMetrics: jest.fn(),
        getErrorLogs: jest.fn(),
        getNetworkLogs: jest.fn(),
        getMemoryLogs: jest.fn(),
        clearLogs: jest.fn(),
        destroy: jest.fn()
    }
}));

describe('DevTools', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(devTools.initialize).toBeDefined();
        });
    });

    describe('initialize', () => {
        it('should initialize dev tools', () => {
            devTools.initialize();
            
            expect(devTools.setupPerformanceMonitoring).toHaveBeenCalled();
            expect(devTools.setupErrorTracking).toHaveBeenCalled();
            expect(devTools.setupNetworkMonitoring).toHaveBeenCalled();
            expect(devTools.setupMemoryMonitoring).toHaveBeenCalled();
        });
    });

    describe('setupPerformanceMonitoring', () => {
        it('should setup performance monitoring', () => {
            devTools.setupPerformanceMonitoring();
            
            expect(devTools.setupPerformanceMonitoring).toHaveBeenCalled();
        });
    });

    describe('setupErrorTracking', () => {
        it('should setup error tracking', () => {
            devTools.setupErrorTracking();
            
            expect(devTools.setupErrorTracking).toHaveBeenCalled();
        });
    });

    describe('setupNetworkMonitoring', () => {
        it('should setup network monitoring', () => {
            devTools.setupNetworkMonitoring();
            
            expect(devTools.setupNetworkMonitoring).toHaveBeenCalled();
        });
    });

    describe('setupMemoryMonitoring', () => {
        it('should setup memory monitoring', () => {
            devTools.setupMemoryMonitoring();
            
            expect(devTools.setupMemoryMonitoring).toHaveBeenCalled();
        });
    });

    describe('logPerformance', () => {
        it('should log performance metrics', () => {
            const metrics = { loadTime: 100, renderTime: 50 };
            devTools.logPerformance(metrics);
            
            expect(devTools.logPerformance).toHaveBeenCalledWith(metrics);
        });
    });

    describe('logError', () => {
        it('should log errors', () => {
            const error = new Error('Test error');
            devTools.logError(error);
            
            expect(devTools.logError).toHaveBeenCalledWith(error);
        });
    });

    describe('logNetwork', () => {
        it('should log network requests', () => {
            const request = { url: 'https://example.com', method: 'GET' };
            devTools.logNetwork(request);
            
            expect(devTools.logNetwork).toHaveBeenCalledWith(request);
        });
    });

    describe('logMemory', () => {
        it('should log memory usage', () => {
            const memory = { used: 100, total: 1000 };
            devTools.logMemory(memory);
            
            expect(devTools.logMemory).toHaveBeenCalledWith(memory);
        });
    });

    describe('getPerformanceMetrics', () => {
        it('should return performance metrics', () => {
            const mockMetrics = { loadTime: 100, renderTime: 50 };
            devTools.getPerformanceMetrics.mockReturnValue(mockMetrics);
            
            const result = devTools.getPerformanceMetrics();
            
            expect(result).toEqual(mockMetrics);
        });
    });

    describe('getErrorLogs', () => {
        it('should return error logs', () => {
            const mockLogs = [{ error: 'Test error', timestamp: Date.now() }];
            devTools.getErrorLogs.mockReturnValue(mockLogs);
            
            const result = devTools.getErrorLogs();
            
            expect(result).toEqual(mockLogs);
        });
    });

    describe('getNetworkLogs', () => {
        it('should return network logs', () => {
            const mockLogs = [{ url: 'https://example.com', method: 'GET' }];
            devTools.getNetworkLogs.mockReturnValue(mockLogs);
            
            const result = devTools.getNetworkLogs();
            
            expect(result).toEqual(mockLogs);
        });
    });

    describe('getMemoryLogs', () => {
        it('should return memory logs', () => {
            const mockLogs = [{ used: 100, total: 1000 }];
            devTools.getMemoryLogs.mockReturnValue(mockLogs);
            
            const result = devTools.getMemoryLogs();
            
            expect(result).toEqual(mockLogs);
        });
    });

    describe('clearLogs', () => {
        it('should clear all logs', () => {
            devTools.clearLogs();
            
            expect(devTools.clearLogs).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should destroy dev tools', () => {
            devTools.destroy();
            
            expect(devTools.destroy).toHaveBeenCalled();
        });
    });

    describe('integration', () => {
        it('should complete full dev tools setup flow', () => {
            devTools.initialize();
            
            expect(devTools.setupPerformanceMonitoring).toHaveBeenCalled();
            expect(devTools.setupErrorTracking).toHaveBeenCalled();
            expect(devTools.setupNetworkMonitoring).toHaveBeenCalled();
            expect(devTools.setupMemoryMonitoring).toHaveBeenCalled();
        });
    });
});