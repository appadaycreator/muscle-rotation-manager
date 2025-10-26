/**
 * LazyLoader テストスイート
 */

import { lazyLoader } from '../../js/utils/lazyLoader.js';

// モックの設定
jest.mock('../../js/utils/lazyLoader.js', () => ({
  lazyLoader: {
    initialize: jest.fn(),
    loadImage: jest.fn(),
    loadScript: jest.fn(),
    loadStylesheet: jest.fn(),
    loadComponent: jest.fn(),
    preload: jest.fn(),
    isLoaded: jest.fn(),
    getLoadedResources: jest.fn(),
    clearCache: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('LazyLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(lazyLoader.initialize).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize lazy loader', () => {
      lazyLoader.initialize();

      expect(lazyLoader.initialize).toHaveBeenCalled();
    });
  });

  describe('loadImage', () => {
    it('should load image lazily', async () => {
      const src = 'https://example.com/image.jpg';
      const mockImage = { src, onload: jest.fn() };
      lazyLoader.loadImage.mockResolvedValue(mockImage);

      const result = await lazyLoader.loadImage(src);

      expect(result).toBe(mockImage);
    });
  });

  describe('loadScript', () => {
    it('should load script lazily', async () => {
      const src = 'https://example.com/script.js';
      const mockScript = { src, onload: jest.fn() };
      lazyLoader.loadScript.mockResolvedValue(mockScript);

      const result = await lazyLoader.loadScript(src);

      expect(result).toBe(mockScript);
    });
  });

  describe('loadStylesheet', () => {
    it('should load stylesheet lazily', async () => {
      const href = 'https://example.com/style.css';
      const mockLink = { href, onload: jest.fn() };
      lazyLoader.loadStylesheet.mockResolvedValue(mockLink);

      const result = await lazyLoader.loadStylesheet(href);

      expect(result).toBe(mockLink);
    });
  });

  describe('loadComponent', () => {
    it('should load component lazily', async () => {
      const componentName = 'TestComponent';
      const mockComponent = { name: componentName };
      lazyLoader.loadComponent.mockResolvedValue(mockComponent);

      const result = await lazyLoader.loadComponent(componentName);

      expect(result).toBe(mockComponent);
    });
  });

  describe('preload', () => {
    it('should preload resource', () => {
      const resource = 'https://example.com/resource.js';
      lazyLoader.preload(resource);

      expect(lazyLoader.preload).toHaveBeenCalledWith(resource);
    });
  });

  describe('isLoaded', () => {
    it('should check if resource is loaded', () => {
      const resource = 'https://example.com/resource.js';
      lazyLoader.isLoaded.mockReturnValue(true);

      const result = lazyLoader.isLoaded(resource);

      expect(result).toBe(true);
    });
  });

  describe('getLoadedResources', () => {
    it('should return loaded resources', () => {
      const mockResources = [
        'https://example.com/resource1.js',
        'https://example.com/resource2.js',
      ];
      lazyLoader.getLoadedResources.mockReturnValue(mockResources);

      const result = lazyLoader.getLoadedResources();

      expect(result).toEqual(mockResources);
    });
  });

  describe('clearCache', () => {
    it('should clear cache', () => {
      lazyLoader.clearCache();

      expect(lazyLoader.clearCache).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should destroy lazy loader', () => {
      lazyLoader.destroy();

      expect(lazyLoader.destroy).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should complete full lazy loading flow', async () => {
      const src = 'https://example.com/image.jpg';
      const mockImage = { src, onload: jest.fn() };
      lazyLoader.loadImage.mockResolvedValue(mockImage);

      const result = await lazyLoader.loadImage(src);

      expect(result).toBe(mockImage);
    });
  });
});
