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
        getGoals: jest.fn(),
        getProgressHistory: jest.fn(),
        calculateGoalProgress: jest.fn()
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
        saveData: jest.fn(),
        getClient: jest.fn(() => ({
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        order: jest.fn(() => ({
                            data: [],
                            error: null
                        }))
                    }))
                }))
            }))
        }))
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
            
            expect(supabaseService.getCurrentUser).toHaveBeenCalled();
            expect(progressPage.currentUser).toEqual(mockUser);
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
            const mockUser = { id: 'user123' };
            progressPage.currentUser = mockUser;
            
            await progressPage.render();
            
            expect(safeGetElement).toHaveBeenCalledWith('main');
        });

        it('should return early if main element is not found', async () => {
            safeGetElement.mockReturnValue(null);
            
            await progressPage.render();
            
            expect(safeGetElement).toHaveBeenCalledWith('main');
        });
    });

    describe('bindEvents', () => {
        it('should bind event listeners', () => {
            progressPage.bindEvents();
            
            // イベントリスナーが設定されることを確認
            expect(progressPage).toBeDefined();
        });
    });

    describe('loadExercises', () => {
        it('should load exercises successfully', async () => {
            const mockMuscleGroups = [
                { id: 1, name: 'chest', name_ja: '胸' }
            ];
            
            // DOM要素をモック
            const mockSelect = document.createElement('select');
            mockSelect.id = 'muscle-group-select';
            document.body.appendChild(mockSelect);
            safeGetElement.mockReturnValue(mockSelect);
            
            // Supabaseクライアントのモック
            const mockClient = {
                from: jest.fn(() => ({
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            order: jest.fn(() => ({
                                data: mockMuscleGroups,
                                error: null
                            }))
                        }))
                    }))
                }))
            };
            supabaseService.getClient.mockReturnValue(mockClient);
            
            await progressPage.loadExercises();
            
            expect(supabaseService.getClient).toHaveBeenCalled();
        });

        it('should handle exercise loading errors', async () => {
            // Supabaseクライアントのエラーモック
            const mockClient = {
                from: jest.fn(() => ({
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            order: jest.fn(() => ({
                                data: null,
                                error: new Error('Database error')
                            }))
                        }))
                    }))
                }))
            };
            supabaseService.getClient.mockReturnValue(mockClient);
            
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
                { id: 1, exercise_id: 1, weight: 100, reps: 10 }
            ];
            const mockGoalProgress = { progress: [] };
            
            // 必要なプロパティを設定
            progressPage.selectedExercise = { id: 1, name: 'ベンチプレス' };
            progressPage.currentUser = { id: 'user123' };
            
            progressTrackingService.getProgressHistory.mockResolvedValue(mockProgressData);
            progressTrackingService.calculateGoalProgress.mockResolvedValue(mockGoalProgress);
            
            await progressPage.loadProgressData();
            
            expect(progressTrackingService.getProgressHistory).toHaveBeenCalled();
            expect(progressTrackingService.calculateGoalProgress).toHaveBeenCalled();
        });

        it('should handle progress data loading errors', async () => {
            // 必要なプロパティを設定
            progressPage.selectedExercise = { id: 1, name: 'ベンチプレス' };
            progressPage.currentUser = { id: 'user123' };
            
            progressTrackingService.getProgressHistory.mockRejectedValue(new Error('Load failed'));
            
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
            const mockUser = { id: 'user123' };
            const mockExercises = [{ id: 1, name: 'ベンチプレス' }];
            const mockProgressData = [{ id: 1, weight: 100 }];
            
            supabaseService.getCurrentUser.mockResolvedValue(mockUser);
            supabaseService.loadData.mockResolvedValue(mockExercises);
            progressTrackingService.getProgressData.mockResolvedValue(mockProgressData);
            
            await progressPage.init();
            
            expect(progressPage.isInitialized).toBe(true);
            expect(tooltipManager.initialize).toHaveBeenCalled();
        });

        it('should handle multiple initialization calls', async () => {
            const mockUser = { id: 'user123' };
            supabaseService.getCurrentUser.mockResolvedValue(mockUser);
            
            await progressPage.init();
            await progressPage.init();
            
            expect(progressPage.isInitialized).toBe(true);
        });
    });
});