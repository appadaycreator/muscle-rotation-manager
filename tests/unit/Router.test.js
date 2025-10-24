// tests/unit/Router.test.js - Routerのテスト

import { Router } from '../../js/utils/router.js';

describe('Router', () => {
    let router;

    beforeEach(() => {
        router = new Router();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(router.routes).toEqual({});
            expect(router.currentRoute).toBe('');
            expect(router.currentParams).toEqual({});
            expect(router.history).toEqual([]);
            expect(router.historyIndex).toBe(-1);
            expect(router.listeners).toEqual([]);
        });
    });

    describe('initialize', () => {
        it('should initialize router', () => {
            router.initialize();

            expect(router.isInitialized).toBe(true);
        });
    });

    describe('navigate', () => {
        it('should navigate to route', () => {
            const mockHandler = jest.fn();
            router.addRoute('/test', mockHandler);

            router.navigate('/test');

            expect(router.currentRoute).toBe('/test');
            expect(mockHandler).toHaveBeenCalled();
        });

        it('should handle route with parameters', () => {
            const mockHandler = jest.fn();
            router.addRoute('/user/:id', mockHandler);

            router.navigate('/user/123');

            expect(router.currentRoute).toBe('/user/123');
            expect(router.currentParams).toEqual({ id: '123' });
            expect(mockHandler).toHaveBeenCalledWith({ id: '123' });
        });
    });

    describe('goBack', () => {
        it('should go back in history', () => {
            router.history = ['/page1', '/page2'];
            router.historyIndex = 1;

            router.goBack();

            expect(router.currentRoute).toBe('/page1');
            expect(router.historyIndex).toBe(0);
        });

        it('should not go back if at beginning', () => {
            router.history = ['/page1'];
            router.historyIndex = 0;

            router.goBack();

            expect(router.currentRoute).toBe('/page1');
            expect(router.historyIndex).toBe(0);
        });
    });

    describe('goForward', () => {
        it('should go forward in history', () => {
            router.history = ['/page1', '/page2'];
            router.historyIndex = 0;

            router.goForward();

            expect(router.currentRoute).toBe('/page2');
            expect(router.historyIndex).toBe(1);
        });

        it('should not go forward if at end', () => {
            router.history = ['/page1', '/page2'];
            router.historyIndex = 1;

            router.goForward();

            expect(router.currentRoute).toBe('/page2');
            expect(router.historyIndex).toBe(1);
        });
    });

    describe('getCurrentRoute', () => {
        it('should return current route', () => {
            router.currentRoute = '/test';

            const result = router.getCurrentRoute();

            expect(result).toBe('/test');
        });
    });

    describe('getCurrentParams', () => {
        it('should return current params', () => {
            router.currentParams = { id: '123' };

            const result = router.getCurrentParams();

            expect(result).toEqual({ id: '123' });
        });
    });

    describe('addRoute', () => {
        it('should add route', () => {
            const mockHandler = jest.fn();

            router.addRoute('/test', mockHandler);

            expect(router.routes['/test']).toBe(mockHandler);
        });
    });

    describe('removeRoute', () => {
        it('should remove route', () => {
            const mockHandler = jest.fn();
            router.addRoute('/test', mockHandler);

            router.removeRoute('/test');

            expect(router.routes['/test']).toBeUndefined();
        });
    });

    describe('onRouteChange', () => {
        it('should add route change listener', () => {
            const mockListener = jest.fn();

            router.onRouteChange(mockListener);

            expect(router.listeners).toContain(mockListener);
        });
    });

    describe('offRouteChange', () => {
        it('should remove route change listener', () => {
            const mockListener = jest.fn();
            router.onRouteChange(mockListener);

            router.offRouteChange(mockListener);

            expect(router.listeners).not.toContain(mockListener);
        });
    });

    describe('destroy', () => {
        it('should destroy router', () => {
            router.isInitialized = true;
            router.listeners = [jest.fn()];

            router.destroy();

            expect(router.isInitialized).toBe(false);
            expect(router.listeners).toHaveLength(0);
        });
    });

    describe('integration', () => {
        it('should complete full router setup flow', () => {
            const mockHandler = jest.fn();
            const mockListener = jest.fn();

            // Initialize
            router.initialize();
            expect(router.isInitialized).toBe(true);

            // Add route
            router.addRoute('/test', mockHandler);
            expect(router.routes['/test']).toBe(mockHandler);

            // Add listener
            router.onRouteChange(mockListener);
            expect(router.listeners).toContain(mockListener);

            // Navigate
            router.navigate('/test');
            expect(router.currentRoute).toBe('/test');
            expect(mockHandler).toHaveBeenCalled();

            // Remove listener
            router.offRouteChange(mockListener);
            expect(router.listeners).not.toContain(mockListener);

            // Remove route
            router.removeRoute('/test');
            expect(router.routes['/test']).toBeUndefined();

            // Destroy
            router.destroy();
            expect(router.isInitialized).toBe(false);
        });
    });
});