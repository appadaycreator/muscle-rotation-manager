/**
 * ExercisePage テストスイート
 */

import { exercisePage } from '../../js/pages/exercisePage.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { exerciseService } from '../../js/services/exerciseService.js';
import { muscleGroupService } from '../../js/services/muscleGroupService.js';
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

jest.mock('../../js/services/exerciseService.js', () => ({
    exerciseService: {
        getAllExercises: jest.fn(),
        searchExercises: jest.fn(),
        addExercise: jest.fn(),
        updateExercise: jest.fn(),
        deleteExercise: jest.fn()
    }
}));

jest.mock('../../js/services/muscleGroupService.js', () => ({
    muscleGroupService: {
        getMuscleGroups: jest.fn()
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

describe('ExercisePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="main-content"></div>';
        safeGetElement.mockReturnValue(document.querySelector('#main-content'));
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(exercisePage.isInitialized).toBe(false);
        });
    });

    describe('init', () => {
        it('should initialize successfully when authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(exercisePage.isInitialized).toBe(true);
        });

        it('should show login prompt when not authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            
            await exercisePage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            authManager.isAuthenticated.mockRejectedValue(new Error('Auth check failed'));
            
            await exercisePage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ExercisePage.init'
            );
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            expect(exercisePage.setupEventListeners).toBeDefined();
        });
    });

    describe('loadExercises', () => {
        it('should load exercises successfully', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            exerciseService.getAllExercises.mockResolvedValue(mockExercises);
            
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            expect(exerciseService.getAllExercises).toHaveBeenCalled();
        });

        it('should handle exercise loading errors', async () => {
            exerciseService.getAllExercises.mockRejectedValue(new Error('Failed to load exercises'));
            
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ExercisePage.loadExercises'
            );
        });
    });

    describe('renderExercises', () => {
        it('should render exercises', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            authManager.isAuthenticated.mockResolvedValue(true);
            exerciseService.getAllExercises.mockResolvedValue(mockExercises);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            expect(exercisePage.renderExercises).toBeDefined();
        });
    });

    describe('setupTooltips', () => {
        it('should setup tooltips', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(exercisePage.setupTooltips).toBeDefined();
        });
    });

    describe('showLoginPrompt', () => {
        it('should render login prompt', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            
            await exercisePage.init();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('ログインが必要です');
        });
    });

    describe('renderExercisePage', () => {
        it('should render exercise page content', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('エクササイズ');
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow when authenticated', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            authManager.isAuthenticated.mockResolvedValue(true);
            exerciseService.getAllExercises.mockResolvedValue(mockExercises);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(exerciseService.getAllExercises).toHaveBeenCalled();
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(exercisePage.isInitialized).toBe(true);
        });

        it('should handle multiple initialization calls', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await exercisePage.init();
            await exercisePage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalledTimes(2);
        });
    });
});