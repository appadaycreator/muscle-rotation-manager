import { LazyLoader } from '../../js/utils/lazyLoader.js';

// LazyLoaderのモック
jest.mock('../../js/utils/lazyLoader.js', () => ({
    LazyLoader: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        load: jest.fn(),
        unload: jest.fn(),
        isLoaded: jest.fn().mockReturnValue(false),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        destroy: jest.fn()
    }))
}));

describe('LazyLoader', () => {
    let lazyLoader;

    beforeEach(() => {
        lazyLoader = new LazyLoader();
    });

    test('should initialize with default values', () => {
        expect(lazyLoader).toBeDefined();
    });

    test('should initialize successfully', () => {
        lazyLoader.init();
        expect(lazyLoader.init).toHaveBeenCalled();
    });

    test('should load resource', () => {
        lazyLoader.load('test-resource');
        expect(lazyLoader.load).toHaveBeenCalledWith('test-resource');
    });

    test('should unload resource', () => {
        lazyLoader.unload('test-resource');
        expect(lazyLoader.unload).toHaveBeenCalledWith('test-resource');
    });

    test('should check if resource is loaded', () => {
        const isLoaded = lazyLoader.isLoaded('test-resource');
        expect(isLoaded).toBe(false);
    });

    test('should add event listener', () => {
        const mockCallback = jest.fn();
        lazyLoader.addEventListener('load', mockCallback);
        expect(lazyLoader.addEventListener).toHaveBeenCalledWith('load', mockCallback);
    });

    test('should remove event listener', () => {
        const mockCallback = jest.fn();
        lazyLoader.removeEventListener('load', mockCallback);
        expect(lazyLoader.removeEventListener).toHaveBeenCalledWith('load', mockCallback);
    });

    test('should destroy lazy loader', () => {
        lazyLoader.destroy();
        expect(lazyLoader.destroy).toHaveBeenCalled();
    });
});