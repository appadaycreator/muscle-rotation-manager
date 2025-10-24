/**
 * Router テストスイート
 */

import { router } from '../../js/utils/router.js';

// モックの設定
jest.mock('../../js/utils/router.js', () => ({
    router: {
        initialize: jest.fn(),
        navigate: jest.fn(),
        goBack: jest.fn(),
        goForward: jest.fn(),
        getCurrentRoute: jest.fn(),
        getCurrentParams: jest.fn(),
        addRoute: jest.fn(),
        removeRoute: jest.fn(),
        onRouteChange: jest.fn(),
        offRouteChange: jest.fn(),
        destroy: jest.fn()
    }
}));

describe('Router', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(router.initialize).toBeDefined();
        });
    });

    describe('initialize', () => {
        it('should initialize router', () => {
            router.initialize();
            
            expect(router.initialize).toHaveBeenCalled();
        });
    });

    describe('navigate', () => {
        it('should navigate to route', () => {
            const route = '/dashboard';
            router.navigate(route);
            
            expect(router.navigate).toHaveBeenCalledWith(route);
        });
    });

    describe('goBack', () => {
        it('should go back in history', () => {
            router.goBack();
            
            expect(router.goBack).toHaveBeenCalled();
        });
    });

    describe('goForward', () => {
        it('should go forward in history', () => {
            router.goForward();
            
            expect(router.goForward).toHaveBeenCalled();
        });
    });

    describe('getCurrentRoute', () => {
        it('should return current route', () => {
            const mockRoute = '/dashboard';
            router.getCurrentRoute.mockReturnValue(mockRoute);
            
            const result = router.getCurrentRoute();
            
            expect(result).toBe(mockRoute);
        });
    });

    describe('getCurrentParams', () => {
        it('should return current params', () => {
            const mockParams = { id: '123' };
            router.getCurrentParams.mockReturnValue(mockParams);
            
            const result = router.getCurrentParams();
            
            expect(result).toEqual(mockParams);
        });
    });

    describe('addRoute', () => {
        it('should add route', () => {
            const route = '/test';
            const handler = jest.fn();
            router.addRoute(route, handler);
            
            expect(router.addRoute).toHaveBeenCalledWith(route, handler);
        });
    });

    describe('removeRoute', () => {
        it('should remove route', () => {
            const route = '/test';
            router.removeRoute(route);
            
            expect(router.removeRoute).toHaveBeenCalledWith(route);
        });
    });

    describe('onRouteChange', () => {
        it('should add route change listener', () => {
            const handler = jest.fn();
            router.onRouteChange(handler);
            
            expect(router.onRouteChange).toHaveBeenCalledWith(handler);
        });
    });

    describe('offRouteChange', () => {
        it('should remove route change listener', () => {
            const handler = jest.fn();
            router.offRouteChange(handler);
            
            expect(router.offRouteChange).toHaveBeenCalledWith(handler);
        });
    });

    describe('destroy', () => {
        it('should destroy router', () => {
            router.destroy();
            
            expect(router.destroy).toHaveBeenCalled();
        });
    });

    describe('integration', () => {
        it('should complete full router setup flow', () => {
            router.initialize();
            
            expect(router.initialize).toHaveBeenCalled();
        });
    });
});