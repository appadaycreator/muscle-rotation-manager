/**
 * ProgressPage テストスイート
 */

import { progressPage } from '../../js/pages/progressPage.js';
import { progressTrackingService } from '../../js/services/progressTrackingService.js';
import { chartService } from '../../js/services/chartService.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { reportService } from '../../js/services/reportService.js';
import { handleError } from '../../js/utils/errorHandler.js';
import { safeGetElement, safeGetElements } from '../../js/utils/helpers.js';
import { tooltipManager } from '../../js/utils/tooltip.js';

// モックの設定
jest.mock('../../js/services/progressTrackingService.js', () => ({
    progressTrackingService: {
        getProgressData: jest.fn(),
        calculate1RM: jest.fn(),
        getGoals: jest.fn()
    }
}));

jest.mock('../../js/services/chartService.js', () => ({
    chartService: {
        createProgressChart: jest.fn(),
        create1RMChart: jest.fn(),
        createVolumeChart: jest.fn()
    }
}));

jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getCurrentUser: jest.fn(),
        loadData: jest.fn(),
        saveData: jest.fn()
    }
}));

jest.mock('../../js/services/reportService.js', () => ({
    reportService: {
        generateProgressReport: jest.fn()
    }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

jest.mock('../../js/utils/helpers.js', () => ({
    safeGetElement: jest.fn(),
    safeGetElements: jest.fn()
}));

jest.mock('../../js/utils/tooltip.js', () => ({
    tooltipManager: {
        initialize: jest.fn(),
        addTooltip: jest.fn()
    }
}));

describe('ProgressPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<main></main>';
        safeGetElement.mockReturnValue(document.querySelector('main'));
        safeGetElements.mockReturnValue([]);
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(progressPage.currentUser).toBe(null);
            expect(progressPage.selectedExercise).toBe(null);
            expect(progressPage.progressData).toEqual([]);
            expect(progressPage.goalsData).toEqual([]);
            expect(progressPage.isInitialized).toBe(false);
        });
    });

    describe('init', () => {
        it('should initialize successfully with authenticated user', async () => {
            const mockUser = { id: 'user123', email: 'test@example.com' };
            supabaseService.getCurrentUser.mockResolvedValue(mockUser);
            
            await progressPage.init();
            
            expect(progressPage.currentUser).toBe(mockUser);
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(progressPage.isInitialized).toBe(true);
        });

        it('should handle unauthenticated user', async () => {
            supabaseService.getCurrentUser.mockResolvedValue(null);
            
            await progressPage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ProgressPage.init'
            );
        });

        it('should handle initialization errors', async () => {
            supabaseService.getCurrentUser.mockRejectedValue(new Error('Database error'));
            
            await progressPage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ProgressPage.init'
            );
        });
    });

    describe('render', () => {
        it('should render progress page content', async () => {
            await progressPage.render();
            
            const main = document.querySelector('main');
            expect(main.innerHTML).toContain('プログレッシブ・オーバーロード追跡');
            expect(main.innerHTML).toContain('エクササイズ選択');
            expect(main.innerHTML).toContain('筋肉部位');
            expect(main.innerHTML).toContain('エクササイズ');
        });

        it('should return early if main element is not found', async () => {
            safeGetElement.mockReturnValue(null);
            
            await progressPage.render();
            
            expect(safeGetElement).toHaveBeenCalledWith('main');
        });
    });

    describe('bindEvents', () => {
        it('should bind event listeners', async () => {
            await progressPage.bindEvents();
            
            // イベントリスナーが設定されていることを確認
            expect(safeGetElement).toHaveBeenCalled();
        });
    });

    describe('loadExercises', () => {
        it('should load exercises successfully', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            supabaseService.loadData.mockResolvedValue(mockExercises);
            
            await progressPage.loadExercises();
            
            expect(supabaseService.loadData).toHaveBeenCalledWith('exercises');
        });

        it('should handle exercise loading errors', async () => {
            supabaseService.loadData.mockRejectedValue(new Error('Failed to load exercises'));
            
            await progressPage.loadExercises();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ProgressPage.loadExercises'
            );
        });
    });

    describe('loadProgressData', () => {
        it('should load progress data successfully', async () => {
            const mockProgressData = [
                { date: '2024-01-01', weight: 100, reps: 10 },
                { date: '2024-01-02', weight: 105, reps: 8 }
            ];
            progressTrackingService.getProgressData.mockResolvedValue(mockProgressData);
            
            await progressPage.loadProgressData();
            
            expect(progressTrackingService.getProgressData).toHaveBeenCalled();
        });

        it('should handle progress data loading errors', async () => {
            progressTrackingService.getProgressData.mockRejectedValue(new Error('Failed to load progress data'));
            
            await progressPage.loadProgressData();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ProgressPage.loadProgressData'
            );
        });
    });

    describe('setupTooltips', () => {
        it('should setup tooltips for progress page', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            progressPage.setupTooltips();
            
            expect(tooltipManager.addTooltip).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Setting up tooltips for progress page');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Tooltips setup complete for progress page');
            
            consoleSpy.mockRestore();
        });

        it('should handle tooltip setup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            tooltipManager.addTooltip.mockImplementation(() => {
                throw new Error('Tooltip setup failed');
            });
            
            progressPage.setupTooltips();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '❌ Failed to setup tooltips:', 
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow', async () => {
            const mockUser = { id: 'user123', email: 'test@example.com' };
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            const mockProgressData = [
                { date: '2024-01-01', weight: 100, reps: 10 }
            ];
            
            supabaseService.getCurrentUser.mockResolvedValue(mockUser);
            supabaseService.loadData.mockResolvedValue(mockExercises);
            progressTrackingService.getProgressData.mockResolvedValue(mockProgressData);
            
            await progressPage.init();
            
            expect(progressPage.currentUser).toBe(mockUser);
            expect(progressPage.isInitialized).toBe(true);
            expect(tooltipManager.initialize).toHaveBeenCalled();
        });

        it('should handle multiple initialization calls', async () => {
            const mockUser = { id: 'user123', email: 'test@example.com' };
            supabaseService.getCurrentUser.mockResolvedValue(mockUser);
            
            await progressPage.init();
            await progressPage.init();
            
            expect(progressPage.isInitialized).toBe(true);
        });
    });
});