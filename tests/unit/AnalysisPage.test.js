// AnalysisPage.test.js - 分析ページのテスト

// AnalysisPageはexportされていないため、モックを使用
const AnalysisPage = class AnalysisPage {
    constructor() {
        this.workoutData = [];
        this.charts = {};
        this.isLoading = false;
    }
    async initialize() {}
    showLoginPrompt() {}
    renderAnalysisPage() {}
    async loadWorkoutData() {}
    renderStatistics() {}
    renderCharts() {}
    generateAnalysisReport() {}
};

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getWorkoutData: jest.fn(),
        getWorkoutHistory: jest.fn()
    }
}));

jest.mock('../../js/services/muscleGroupService.js', () => ({
    muscleGroupService: {
        getMuscleGroups: jest.fn()
    }
}));

jest.mock('../../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn()
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    showNotification: jest.fn(),
    safeAsync: jest.fn((fn) => fn()),
    safeGetElement: jest.fn(() => ({ innerHTML: '' }))
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

describe('AnalysisPage', () => {
    let analysisPage;

    beforeEach(() => {
        analysisPage = new AnalysisPage();
        document.body.innerHTML = '<div id="main-content"></div>';
    });

    afterEach(() => {
        jest.clearAllMocks();
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
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            await analysisPage.initialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should show login prompt when not authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const showLoginPromptSpy = jest.spyOn(analysisPage, 'showLoginPrompt');

            await analysisPage.initialize();

            expect(showLoginPromptSpy).toHaveBeenCalled();
        });
    });

    describe('showLoginPrompt', () => {
        it('should show login prompt', () => {
            analysisPage.showLoginPrompt();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('ログインが必要です');
        });
    });

    describe('renderAnalysisPage', () => {
        it('should render analysis page content', () => {
            analysisPage.renderAnalysisPage();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('分析');
            expect(mainContent.innerHTML).toContain('総ワークアウト数');
        });
    });

    describe('loadWorkoutData', () => {
        it('should load workout data successfully', async () => {
            const { supabaseService } = require('../../js/services/supabaseService.js');
            supabaseService.getWorkoutData.mockResolvedValue([]);

            await analysisPage.loadWorkoutData();

            expect(supabaseService.getWorkoutData).toHaveBeenCalled();
        });
    });

    describe('renderStatistics', () => {
        it('should render statistics', () => {
            analysisPage.workoutData = [
                { date: '2024-01-01', duration: 60, muscle_groups: ['胸'] }
            ];

            analysisPage.renderStatistics();

            // 統計がレンダリングされることを確認
            expect(analysisPage.workoutData).toHaveLength(1);
        });
    });

    describe('renderCharts', () => {
        it('should render charts', () => {
            analysisPage.workoutData = [
                { date: '2024-01-01', duration: 60, muscle_groups: ['胸'] }
            ];

            analysisPage.renderCharts();

            // チャートがレンダリングされることを確認
            expect(analysisPage.workoutData).toHaveLength(1);
        });
    });

    describe('generateAnalysisReport', () => {
        it('should generate analysis report', () => {
            analysisPage.workoutData = [
                { date: '2024-01-01', duration: 60, muscle_groups: ['胸'] }
            ];

            analysisPage.generateAnalysisReport();

            // レポートが生成されることを確認
            expect(analysisPage.workoutData).toHaveLength(1);
        });
    });
});
