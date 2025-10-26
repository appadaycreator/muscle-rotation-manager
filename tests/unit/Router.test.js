// tests/unit/Router.test.js - Routerのテスト

import { Router, router } from '../../js/utils/router.js';

describe('Router', () => {
  let testRouter;

  beforeEach(() => {
    testRouter = new Router();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(testRouter.routes).toBeDefined();
      expect(testRouter.currentRoute).toBeNull();
      expect(testRouter.pageCache).toBeDefined();
    });
  });

  describe('getCurrentPath', () => {
    it('should return current path', () => {
      // getCurrentPathはwindow.location.pathnameを返すだけなので、
      // 現在のパスをテストする
      const path = testRouter.getCurrentPath();
      expect(typeof path).toBe('string');
      expect(path).toBeDefined();
    });
  });

  describe('navigateTo', () => {
    it('should navigate to path', () => {
      const mockPushState = jest.fn();
      Object.defineProperty(window.history, 'pushState', {
        value: mockPushState,
        writable: true,
      });

      testRouter.navigateTo('/test');
      expect(mockPushState).toHaveBeenCalled();
    });
  });

  describe('goBack', () => {
    it('should go back in history', () => {
      const mockBack = jest.fn();
      Object.defineProperty(window.history, 'back', {
        value: mockBack,
        writable: true,
      });

      testRouter.goBack();
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('goForward', () => {
    it('should go forward in history', () => {
      const mockForward = jest.fn();
      Object.defineProperty(window.history, 'forward', {
        value: mockForward,
        writable: true,
      });

      testRouter.goForward();
      expect(mockForward).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear page cache', () => {
      testRouter.pageCache.set('test', 'content');
      expect(testRouter.pageCache.size).toBe(1);

      testRouter.clearCache();
      expect(testRouter.pageCache.size).toBe(0);
    });
  });
});
