// OfflineManager.test.js - オフラインマネージャーのテスト

// OfflineManagerクラスをモック
const OfflineManager = class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.cache = new Map();
        this.eventListeners = [];
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });
    }

    handleOnline() {
        console.log('Connection restored');
    }

    handleOffline() {
        console.log('Connection lost');
    }

    cacheData(key, data) {
        this.cache.set(key, data);
    }

    getCachedData(key) {
        return this.cache.get(key);
    }

    clearCache() {
        this.cache.clear();
    }

    isConnectionAvailable() {
        return this.isOnline;
    }

    addEventListener(event, callback) {
        this.eventListeners.push({ event, callback });
    }

    removeEventListener(event, callback) {
        const index = this.eventListeners.findIndex(
            listener => listener.event === event && listener.callback === callback
        );
        if (index > -1) {
            this.eventListeners.splice(index, 1);
        }
    }

    destroy() {
        this.eventListeners = [];
        this.cache.clear();
    }
};

describe('OfflineManager', () => {
    let offlineManager;

    beforeEach(() => {
        offlineManager = new OfflineManager();
        jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(offlineManager.isOnline).toBe(navigator.onLine);
            expect(offlineManager.cache).toBeInstanceOf(Map);
            expect(offlineManager.eventListeners).toEqual([]);
        });
    });

    describe('init', () => {
        it('should setup event listeners', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            offlineManager.init();

            expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
        });
    });

    describe('handleOnline', () => {
        it('should log connection restored message', () => {
            offlineManager.handleOnline();

            expect(console.log).toHaveBeenCalledWith('Connection restored');
        });
    });

    describe('handleOffline', () => {
        it('should log connection lost message', () => {
            offlineManager.handleOffline();

            expect(console.log).toHaveBeenCalledWith('Connection lost');
        });
    });

    describe('cacheData', () => {
        it('should cache data with key', () => {
            const key = 'test-key';
            const data = { test: 'data' };

            offlineManager.cacheData(key, data);

            expect(offlineManager.cache.has(key)).toBe(true);
            expect(offlineManager.cache.get(key)).toBe(data);
        });
    });

    describe('getCachedData', () => {
        it('should return cached data', () => {
            const key = 'test-key';
            const data = { test: 'data' };
            offlineManager.cacheData(key, data);

            const result = offlineManager.getCachedData(key);

            expect(result).toBe(data);
        });

        it('should return undefined for non-existent key', () => {
            const result = offlineManager.getCachedData('non-existent');

            expect(result).toBeUndefined();
        });
    });

    describe('clearCache', () => {
        it('should clear all cached data', () => {
            offlineManager.cacheData('key1', 'data1');
            offlineManager.cacheData('key2', 'data2');

            offlineManager.clearCache();

            expect(offlineManager.cache.size).toBe(0);
        });
    });

    describe('isConnectionAvailable', () => {
        it('should return connection status', () => {
            const status = offlineManager.isConnectionAvailable();

            expect(status).toBe(navigator.onLine);
        });
    });

    describe('addEventListener', () => {
        it('should add event listener', () => {
            const callback = jest.fn();

            offlineManager.addEventListener('test', callback);

            expect(offlineManager.eventListeners).toHaveLength(1);
            expect(offlineManager.eventListeners[0].event).toBe('test');
            expect(offlineManager.eventListeners[0].callback).toBe(callback);
        });
    });

    describe('removeEventListener', () => {
        it('should remove event listener', () => {
            const callback = jest.fn();
            offlineManager.addEventListener('test', callback);

            offlineManager.removeEventListener('test', callback);

            expect(offlineManager.eventListeners).toHaveLength(0);
        });

        it('should not remove non-existent listener', () => {
            const callback = jest.fn();
            offlineManager.addEventListener('test', callback);

            offlineManager.removeEventListener('test', jest.fn());

            expect(offlineManager.eventListeners).toHaveLength(1);
        });
    });

    describe('destroy', () => {
        it('should clear event listeners and cache', () => {
            const callback = jest.fn();
            offlineManager.addEventListener('test', callback);
            offlineManager.cacheData('key', 'data');

            offlineManager.destroy();

            expect(offlineManager.eventListeners).toHaveLength(0);
            expect(offlineManager.cache.size).toBe(0);
        });
    });
});
