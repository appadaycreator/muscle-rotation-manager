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
            expect(router.routes).toBeDefined();
            expect(router.currentRoute).toBeNull();
            expect(router.pageCache).toBeDefined();
        });
    });

    describe('getCurrentPath', () => {
        it('should return current path', () => {
            // getCurrentPathはwindow.location.pathnameを返すだけなので、
            // 現在のパスをテストする
            const path = router.getCurrentPath();
            expect(typeof path).toBe('string');
            expect(path).toBeDefined();
        });
    });

    describe('navigateTo', () => {
        it('should navigate to path', () => {
            const mockPushState = jest.fn();
            Object.defineProperty(window.history, 'pushState', {
                value: mockPushState,
                writable: true
            });

            router.navigateTo('/test');
            expect(mockPushState).toHaveBeenCalled();
        });
    });

    describe('goBack', () => {
        it('should go back in history', () => {
            const mockBack = jest.fn();
            Object.defineProperty(window.history, 'back', {
                value: mockBack,
                writable: true
            });

            router.goBack();
            expect(mockBack).toHaveBeenCalled();
        });
    });

    describe('goForward', () => {
        it('should go forward in history', () => {
            const mockForward = jest.fn();
            Object.defineProperty(window.history, 'forward', {
                value: mockForward,
                writable: true
            });

            router.goForward();
            expect(mockForward).toHaveBeenCalled();
        });
    });

    describe('clearCache', () => {
        it('should clear page cache', () => {
            router.pageCache.set('test', 'content');
            expect(router.pageCache.size).toBe(1);

            router.clearCache();
            expect(router.pageCache.size).toBe(0);
        });
    });
});