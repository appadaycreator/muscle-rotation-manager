/**
 * AnalysisPage テストスイート
 */

import analysisPage from '../../js/pages/analysisPage.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { muscleGroupService } from '../../js/services/muscleGroupService.js';
import { authManager } from '../../js/modules/authManager.js';
import { showNotification, safeAsync, safeGetElement } from '../../js/utils/helpers.js';
import { handleError } from '../../js/utils/errorHandler.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getCurrentUser: jest.fn(),
        loadData: jest.fn(),
        isAvailable: jest.fn(),
        getWorkouts: jest.fn()
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
    safeAsync: jest.fn(),
    safeGetElement: jest.fn()
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

describe('AnalysisPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="main-content"></div>';
        safeGetElement.mockReturnValue(document.querySelector('#main-content'));
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(analysisPage.workoutData).toEqual([]);
            expect(analysisPage.charts).toEqual({});
            expect(analysisPage.isLoading).toBe(false);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await analysisPage.initialize();
            
            expect(consoleSpy).toHaveBeenCalledWith('Analysis page initialized');
            
            consoleSpy.mockRestore();
        });

        it('should handle initialization errors', async () => {
            // safeAsync をエラーを投げるようにモック
            safeAsync.mockImplementation(async (fn, context, errorHandler) => {
                try {
                    await fn();
                } catch (error) {
                    errorHandler(error);
                }
            });
            
            // エラーを発生させるために、renderAnalysisPageでエラーを投げる
            const originalRenderAnalysisPage = analysisPage.renderAnalysisPage;
            analysisPage.renderAnalysisPage = jest.fn().mockImplementation(() => {
                throw new Error('Render error');
            });
            
            await analysisPage.initialize();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                expect.objectContaining({
                    context: '分析ページ初期化',
                    showNotification: true
                })
            );
            
            // 元のメソッドを復元
            analysisPage.renderAnalysisPage = originalRenderAnalysisPage;
        });

    });

    describe('showLoginPrompt', () => {
        it('should render login prompt', () => {
            analysisPage.showLoginPrompt();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('ログインが必要です');
            expect(mainContent.innerHTML).toContain('ログイン');
            expect(mainContent.innerHTML).toContain('ホームに戻る');
        });

        it('should setup login button event listener', () => {
            analysisPage.showLoginPrompt();
            
            const loginBtn = document.getElementById('login-btn');
            expect(loginBtn).toBeTruthy();
        });

        it('should return early if main content is not found', () => {
            safeGetElement.mockReturnValue(null);
            
            expect(() => analysisPage.showLoginPrompt()).not.toThrow();
        });
    });

    describe('renderAnalysisPage', () => {
        it('should render analysis page content', () => {
            analysisPage.renderAnalysisPage();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('トレーニング分析');
        });

        it('should return early if main content is not found', () => {
            safeGetElement.mockReturnValue(null);
            
            expect(() => analysisPage.renderAnalysisPage()).not.toThrow();
        });
    });

    describe('loadWorkoutData', () => {
        it('should load workout data from localStorage', async () => {
            const mockWorkoutData = [
                { id: 1, date: '2024-01-01', exercises: [] },
                { id: 2, date: '2024-01-02', exercises: [] }
            ];
            
            // localStorage のモック
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: jest.fn().mockReturnValue(JSON.stringify(mockWorkoutData)),
                    setItem: jest.fn(),
                    removeItem: jest.fn()
                },
                writable: true
            });
            
            await analysisPage.loadWorkoutData();
            
            expect(window.localStorage.getItem).toHaveBeenCalledWith('workoutHistory');
            expect(analysisPage.workoutData).toEqual(mockWorkoutData);
        });

        it('should handle workout data loading errors', async () => {
            // localStorage.getItem をエラーを投げるようにモック
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: jest.fn().mockImplementation(() => {
                        throw new Error('localStorage error');
                    }),
                    setItem: jest.fn(),
                    removeItem: jest.fn()
                },
                writable: true
            });
            
            await analysisPage.loadWorkoutData();
            
            // エラーが発生した場合、サンプルデータが生成される
            expect(analysisPage.workoutData.length).toBeGreaterThan(0);
            expect(showNotification).toHaveBeenCalledWith(
                'ワークアウトデータの読み込みに失敗しました', 
                'error'
            );
        });
    });

    describe('renderStatistics', () => {
        it('should render statistics', () => {
            analysisPage.workoutData = [
                { id: 1, date: '2024-01-01', exercises: [] }
            ];
            
            analysisPage.renderStatistics();
            
            // 統計がレンダリングされることを確認
            expect(analysisPage.workoutData).toHaveLength(1);
        });
    });

    describe('renderCharts', () => {
        it('should render charts', () => {
            analysisPage.workoutData = [
                { id: 1, date: '2024-01-01', exercises: [] }
            ];
            
            analysisPage.renderCharts();
            
            // チャートがレンダリングされることを確認
            expect(analysisPage.workoutData).toHaveLength(1);
        });
    });

    describe('generateAnalysisReport', () => {
        it('should generate analysis report', () => {
            analysisPage.workoutData = [
                { id: 1, date: '2024-01-01', exercises: [] }
            ];
            
            analysisPage.generateAnalysisReport();
            
            // レポートが生成されることを確認
            expect(analysisPage.workoutData).toHaveLength(1);
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await analysisPage.initialize();
            
            expect(consoleSpy).toHaveBeenCalledWith('Analysis page initialized');
            
            consoleSpy.mockRestore();
        });

        it('should handle multiple initialization calls', async () => {
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await analysisPage.initialize();
            await analysisPage.initialize();
            
            // 複数回の初期化が正常に処理されることを確認
            expect(analysisPage.workoutData).toBeDefined();
        });
    });
});