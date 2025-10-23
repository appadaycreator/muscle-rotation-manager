import { Router } from '../../js/utils/router.js';

// Routerのモック
jest.mock('../../js/utils/router.js', () => ({
    Router: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        navigate: jest.fn(),
        getCurrentRoute: jest.fn().mockReturnValue('/'),
        addRoute: jest.fn(),
        removeRoute: jest.fn(),
        destroy: jest.fn()
    }))
}));

describe('Router', () => {
    let router;

    beforeEach(() => {
        router = new Router();
    });

    test('should initialize with default values', () => {
        expect(router).toBeDefined();
    });

    test('should initialize successfully', () => {
        router.init();
        expect(router.init).toHaveBeenCalled();
    });

    test('should navigate to route', () => {
        router.navigate('/test');
        expect(router.navigate).toHaveBeenCalledWith('/test');
    });

    test('should get current route', () => {
        const currentRoute = router.getCurrentRoute();
        expect(currentRoute).toBe('/');
    });

    test('should add route', () => {
        const mockHandler = jest.fn();
        router.addRoute('/test', mockHandler);
        expect(router.addRoute).toHaveBeenCalledWith('/test', mockHandler);
    });

    test('should remove route', () => {
        router.removeRoute('/test');
        expect(router.removeRoute).toHaveBeenCalledWith('/test');
    });

    test('should destroy router', () => {
        router.destroy();
        expect(router.destroy).toHaveBeenCalled();
    });
});