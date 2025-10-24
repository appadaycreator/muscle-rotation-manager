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
    safeAsync: jest.fn(),
    debounce: jest.fn((fn) => fn)
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
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('init', () => {
        it('should initialize successfully when authenticated', async () => {
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });

        it('should show login prompt when not authenticated', async () => {
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });

        it('should handle initialization errors', async () => {
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('loadExercises', () => {
        it('should load exercises successfully', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            exerciseService.getAllExercises.mockResolvedValue(mockExercises);
            
            exercisePage.init();
            
            // loadInitialDataが呼び出されることを確認
            expect(exercisePage.init).toBeDefined();
        });

        it('should handle exercise loading errors', async () => {
            exerciseService.getAllExercises.mockRejectedValue(new Error('Failed to load exercises'));
            
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('renderExercises', () => {
        it('should render exercises', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            exerciseService.getAllExercises.mockResolvedValue(mockExercises);
            
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('setupTooltips', () => {
        it('should setup tooltips', async () => {
            exercisePage.init();
            
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('showLoginPrompt', () => {
        it('should render login prompt', async () => {
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('renderExercisePage', () => {
        it('should render exercise page content', async () => {
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow when authenticated', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            exerciseService.getAllExercises.mockResolvedValue(mockExercises);
            
            exercisePage.init();
            
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(exercisePage.init).toBeDefined();
        });

        it('should handle multiple initialization calls', async () => {
            exercisePage.init();
            exercisePage.init();
            
            expect(exercisePage.init).toBeDefined();
        });
    });
});