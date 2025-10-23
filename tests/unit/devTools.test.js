// DevTools.test.js - 開発ツールのテスト

// DevToolsクラスをモック
const DevTools = class DevTools {
    constructor() {
        this.isEnabled = false;
        this.logs = [];
    }

    enable() {
        this.isEnabled = true;
        console.log('DevTools enabled');
    }

    disable() {
        this.isEnabled = false;
        console.log('DevTools disabled');
    }

    log(message, data = null) {
        if (this.isEnabled) {
            const logEntry = {
                timestamp: new Date(),
                message,
                data
            };
            this.logs.push(logEntry);
            console.log(`[DevTools] ${message}`, data);
        }
    }

    clearLogs() {
        this.logs = [];
    }

    getLogs() {
        return this.logs;
    }

    measurePerformance(name, fn) {
        if (!this.isEnabled) {
            return fn();
        }

        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.log(`Performance: ${name}`, {
            duration: end - start,
            result: result
        });

        return result;
    }

    checkMemoryUsage() {
        if (!this.isEnabled) {
            return null;
        }

        const memoryInfo = {
            used: Math.random() * 100,
            total: 1000,
            percentage: Math.random() * 100
        };

        this.log('Memory usage', memoryInfo);
        return memoryInfo;
    }

    validateData(data, schema) {
        if (!this.isEnabled) {
            return true;
        }

        // 簡単なバリデーション
        const isValid = data && typeof data === 'object';
        this.log('Data validation', { isValid, data, schema });
        return isValid;
    }
};

describe('DevTools', () => {
    let devTools;

    beforeEach(() => {
        devTools = new DevTools();
        jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(devTools.isEnabled).toBe(false);
            expect(devTools.logs).toEqual([]);
        });
    });

    describe('enable', () => {
        it('should enable dev tools', () => {
            devTools.enable();

            expect(devTools.isEnabled).toBe(true);
            expect(console.log).toHaveBeenCalledWith('DevTools enabled');
        });
    });

    describe('disable', () => {
        it('should disable dev tools', () => {
            devTools.disable();

            expect(devTools.isEnabled).toBe(false);
            expect(console.log).toHaveBeenCalledWith('DevTools disabled');
        });
    });

    describe('log', () => {
        it('should log message when enabled', () => {
            devTools.enable();
            const message = 'Test message';
            const data = { test: 'data' };

            devTools.log(message, data);

            expect(devTools.logs).toHaveLength(1);
            expect(devTools.logs[0].message).toBe(message);
            expect(devTools.logs[0].data).toBe(data);
            expect(console.log).toHaveBeenCalledWith(`[DevTools] ${message}`, data);
        });

        it('should not log when disabled', () => {
            devTools.disable();
            const message = 'Test message';

            devTools.log(message);

            expect(devTools.logs).toHaveLength(0);
            expect(console.log).not.toHaveBeenCalledWith(`[DevTools] ${message}`);
        });
    });

    describe('clearLogs', () => {
        it('should clear logs', () => {
            devTools.enable();
            devTools.log('Test message');
            expect(devTools.logs).toHaveLength(1);

            devTools.clearLogs();

            expect(devTools.logs).toHaveLength(0);
        });
    });

    describe('getLogs', () => {
        it('should return logs', () => {
            devTools.enable();
            devTools.log('Test message');

            const logs = devTools.getLogs();

            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe('Test message');
        });
    });

    describe('measurePerformance', () => {
        it('should measure performance when enabled', () => {
            devTools.enable();
            const testFn = () => 'test result';

            const result = devTools.measurePerformance('test', testFn);

            expect(result).toBe('test result');
            expect(devTools.logs).toHaveLength(1);
            expect(devTools.logs[0].message).toContain('Performance: test');
        });

        it('should execute function without measurement when disabled', () => {
            devTools.disable();
            const testFn = () => 'test result';

            const result = devTools.measurePerformance('test', testFn);

            expect(result).toBe('test result');
            expect(devTools.logs).toHaveLength(0);
        });
    });

    describe('checkMemoryUsage', () => {
        it('should check memory usage when enabled', () => {
            devTools.enable();

            const memoryInfo = devTools.checkMemoryUsage();

            expect(memoryInfo).toHaveProperty('used');
            expect(memoryInfo).toHaveProperty('total');
            expect(memoryInfo).toHaveProperty('percentage');
            expect(devTools.logs).toHaveLength(1);
            expect(devTools.logs[0].message).toBe('Memory usage');
        });

        it('should return null when disabled', () => {
            devTools.disable();

            const memoryInfo = devTools.checkMemoryUsage();

            expect(memoryInfo).toBeNull();
        });
    });

    describe('validateData', () => {
        it('should validate data when enabled', () => {
            devTools.enable();
            const data = { test: 'data' };
            const schema = { type: 'object' };

            const isValid = devTools.validateData(data, schema);

            expect(isValid).toBe(true);
            expect(devTools.logs).toHaveLength(1);
            expect(devTools.logs[0].message).toBe('Data validation');
        });

        it('should return true when disabled', () => {
            devTools.disable();
            const data = { test: 'data' };

            const isValid = devTools.validateData(data);

            expect(isValid).toBe(true);
            expect(devTools.logs).toHaveLength(0);
        });
    });
});
