/**
 * WorkoutPage テストスイート
 */

import { workoutPage } from '../../js/pages/workoutPage.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { authManager } from '../../js/modules/authManager.js';
import { showNotification, safeGetElement, safeAsync } from '../../js/utils/helpers.js';
import { handleError } from '../../js/utils/errorHandler.js';
import { tooltipManager } from '../../js/utils/tooltip.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getCurrentUser: jest.fn(),
        loadData: jest.fn(),
        saveData: jest.fn()
    }
}));

jest.mock('../../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn(),
        showAuthModal: jest.fn()
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    showNotification: jest.fn(),
    safeGetElement: jest.fn(),
    safeAsync: jest.fn()
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

jest.mock('../../js/utils/tooltip.js', () => ({
    tooltipManager: {
        initialize: jest.fn(),
        addTooltip: jest.fn()
    }
}));

describe('WorkoutPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="main-content"></div>';
        safeGetElement.mockReturnValue(document.querySelector('#main-content'));
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(workoutPage.isInitialized).toBe(false);
        });
    });

    describe('init', () => {
        it('should initialize successfully when authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await workoutPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(workoutPage.isInitialized).toBe(true);
        });

        it('should show login prompt when not authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            
            await workoutPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            authManager.isAuthenticated.mockRejectedValue(new Error('Auth check failed'));
            
            await workoutPage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'WorkoutPage.init'
            );
        });
    });

    describe('loadWorkoutData', () => {
        it('should load workout data successfully', async () => {
            const mockData = {
                workouts: [],
                exercises: [],
                muscleGroups: []
            };
            
            authManager.isAuthenticated.mockResolvedValue(true);
            supabaseService.loadData.mockResolvedValue(mockData);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await workoutPage.init();
            
            expect(supabaseService.loadData).toHaveBeenCalled();
        });

        it('should handle data loading errors', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            supabaseService.loadData.mockRejectedValue(new Error('Data loading failed'));
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await workoutPage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'WorkoutPage.loadWorkoutData'
            );
        });
    });

    describe('renderWorkoutPage', () => {
        it('should render workout page content', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await workoutPage.init();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('ワークアウト');
        });
    });

    describe('setupTooltips', () => {
        it('should setup tooltips', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await workoutPage.init();
            
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(workoutPage.setupTooltips).toBeDefined();
        });
    });

    describe('showLoginPrompt', () => {
        it('should render login prompt', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            
            await workoutPage.init();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('ログインが必要です');
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow when authenticated', async () => {
            const mockData = {
                workouts: [],
                exercises: [],
                muscleGroups: []
            };
            
            authManager.isAuthenticated.mockResolvedValue(true);
            supabaseService.loadData.mockResolvedValue(mockData);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await workoutPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(supabaseService.loadData).toHaveBeenCalled();
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(workoutPage.isInitialized).toBe(true);
        });

        it('should handle multiple initialization calls', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await workoutPage.init();
            await workoutPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalledTimes(2);
        });
    });
});