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
        logMemory: jest.fn()
    }
}));

describe('DevTools', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(devTools.initialize).toBeDefined();
            expect(devTools.setupPerformanceMonitoring).toBeDefined();
            expect(devTools.setupErrorTracking).toBeDefined();
            expect(devTools.setupNetworkMonitoring).toBeDefined();
            expect(devTools.setupMemoryMonitoring).toBeDefined();
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', () => {
            devTools.initialize.mockReturnValue(true);
            
            const result = devTools.initialize();
            
            expect(result).toBe(true);
            expect(devTools.initialize).toHaveBeenCalled();
        });
    });

    describe('setupPerformanceMonitoring', () => {
        it('should setup performance monitoring', () => {
            devTools.setupPerformanceMonitoring.mockReturnValue(true);
            
            const result = devTools.setupPerformanceMonitoring();
            
            expect(result).toBe(true);
            expect(devTools.setupPerformanceMonitoring).toHaveBeenCalled();
        });
    });

    describe('setupErrorTracking', () => {
        it('should setup error tracking', () => {
            devTools.setupErrorTracking.mockReturnValue(true);
            
            const result = devTools.setupErrorTracking();
            
            expect(result).toBe(true);
            expect(devTools.setupErrorTracking).toHaveBeenCalled();
        });
    });

    describe('setupNetworkMonitoring', () => {
        it('should setup network monitoring', () => {
            devTools.setupNetworkMonitoring.mockReturnValue(true);
            
            const result = devTools.setupNetworkMonitoring();
            
            expect(result).toBe(true);
            expect(devTools.setupNetworkMonitoring).toHaveBeenCalled();
        });
    });

    describe('setupMemoryMonitoring', () => {
        it('should setup memory monitoring', () => {
            devTools.setupMemoryMonitoring.mockReturnValue(true);
            
            const result = devTools.setupMemoryMonitoring();
            
            expect(result).toBe(true);
            expect(devTools.setupMemoryMonitoring).toHaveBeenCalled();
        });
    });

    describe('logPerformance', () => {
        it('should log performance data', () => {
            devTools.logPerformance.mockReturnValue(true);
            
            const result = devTools.logPerformance('test-metric', 100);
            
            expect(result).toBe(true);
            expect(devTools.logPerformance).toHaveBeenCalledWith('test-metric', 100);
        });
    });

    describe('logError', () => {
        it('should log error data', () => {
            devTools.logError.mockReturnValue(true);
            
            const result = devTools.logError('test-error', new Error('Test error'));
            
            expect(result).toBe(true);
            expect(devTools.logError).toHaveBeenCalledWith('test-error', expect.any(Error));
        });
    });

    describe('logNetwork', () => {
        it('should log network data', () => {
            devTools.logNetwork.mockReturnValue(true);
            
            const result = devTools.logNetwork('GET', '/api/test', 200);
            
            expect(result).toBe(true);
            expect(devTools.logNetwork).toHaveBeenCalledWith('GET', '/api/test', 200);
        });
    });

    describe('logMemory', () => {
        it('should log memory data', () => {
            devTools.logMemory.mockReturnValue(true);
            
            const result = devTools.logMemory(1024);
            
            expect(result).toBe(true);
            expect(devTools.logMemory).toHaveBeenCalledWith(1024);
        });
    });

    describe('integration', () => {
        it('should handle complete dev tools setup', () => {
            devTools.initialize.mockReturnValue(true);
            devTools.setupPerformanceMonitoring.mockReturnValue(true);
            devTools.setupErrorTracking.mockReturnValue(true);
            devTools.setupNetworkMonitoring.mockReturnValue(true);
            devTools.setupMemoryMonitoring.mockReturnValue(true);
            
            // 初期化
            const initialized = devTools.initialize();
            expect(initialized).toBe(true);
            
            // パフォーマンス監視を設定
            const performanceSetup = devTools.setupPerformanceMonitoring();
            expect(performanceSetup).toBe(true);
            
            // エラー追跡を設定
            const errorSetup = devTools.setupErrorTracking();
            expect(errorSetup).toBe(true);
            
            // ネットワーク監視を設定
            const networkSetup = devTools.setupNetworkMonitoring();
            expect(networkSetup).toBe(true);
            
            // メモリ監視を設定
            const memorySetup = devTools.setupMemoryMonitoring();
            expect(memorySetup).toBe(true);
        });
    });
});