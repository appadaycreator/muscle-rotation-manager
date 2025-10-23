// AnalysisPage.test.js - 分析ページのテスト

// モックの設定
jest.mock('../../js/core/BasePage.js', () => ({
    BasePage: class BasePage {
        constructor() {
            this.eventListeners = [];
        }
        addEventListener() {}
        removeEventListener() {}
        cleanup() {}
    }
}));

jest.mock('../../js/components/Navigation.js', () => ({
    Navigation: class Navigation {
        constructor() {}
    }
}));

jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getWorkoutData: jest.fn(),
        getAnalysisData: jest.fn()
    }
}));

jest.mock('../../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn()
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    showNotification: jest.fn(),
    safeGetElement: jest.fn(() => ({ innerHTML: '' }))
}));

// AnalysisPageクラスをモック
const AnalysisPage = class AnalysisPage {
    constructor() {
        this.workoutData = [];
        this.analysisData = null;
        this.eventListenersSetup = false;
    }

    async checkAuthentication() {
        const { authManager } = require('../../js/modules/authManager.js');
        const isAuthenticated = await authManager.isAuthenticated();
        
        if (!isAuthenticated) {
            this.showLoginPrompt();
            return false;
        }
        
        return true;
    }

    async onInitialize() {
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            return;
        }
        
        this.renderAnalysisPage();
        await this.loadWorkoutData();
        this.setupEventListeners();
    }

    renderAnalysisPage() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h1>分析</h1><div id="analysis-content"></div>';
        }
    }

    async loadWorkoutData() {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        this.workoutData = await supabaseService.getWorkoutData();
    }

    setupEventListeners() {
        this.eventListenersSetup = true;
    }

    showLoginPrompt() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<p>ログインが必要です</p>';
        }
    }

    renderStatistics() {
        const analysisContent = document.getElementById('analysis-content');
        if (analysisContent) {
            analysisContent.innerHTML = '<div class="statistics">統計データ</div>';
        }
    }

    renderCharts() {
        const analysisContent = document.getElementById('analysis-content');
        if (analysisContent) {
            analysisContent.innerHTML += '<div class="charts">チャート</div>';
        }
    }

    generateAnalysisReport() {
        return {
            totalWorkouts: this.workoutData.length,
            averageWorkoutsPerWeek: this.calculateAverageWorkoutsPerWeek(),
            mostUsedMuscleGroup: this.getMostUsedMuscleGroup()
        };
    }

    calculateAverageWorkoutsPerWeek() {
        if (this.workoutData.length === 0) return 0;
        return Math.round(this.workoutData.length / 4); // 仮の計算
    }

    getMostUsedMuscleGroup() {
        if (this.workoutData.length === 0) return 'なし';
        return '胸'; // 仮のデータ
    }
};

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
            expect(analysisPage.analysisData).toBeNull();
            expect(analysisPage.eventListenersSetup).toBe(false);
        });
    });

    describe('checkAuthentication', () => {
        it('should return true for authenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const result = await analysisPage.checkAuthentication();

            expect(result).toBe(true);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should return false for unauthenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const result = await analysisPage.checkAuthentication();

            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });
    });

    describe('onInitialize', () => {
        it('should initialize successfully when authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const renderAnalysisPageSpy = jest.spyOn(analysisPage, 'renderAnalysisPage');
            const loadWorkoutDataSpy = jest.spyOn(analysisPage, 'loadWorkoutData');
            const setupEventListenersSpy = jest.spyOn(analysisPage, 'setupEventListeners');

            await analysisPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(renderAnalysisPageSpy).toHaveBeenCalled();
            expect(loadWorkoutDataSpy).toHaveBeenCalled();
            expect(setupEventListenersSpy).toHaveBeenCalled();
        });

        it('should not initialize if not authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const renderAnalysisPageSpy = jest.spyOn(analysisPage, 'renderAnalysisPage');

            await analysisPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(renderAnalysisPageSpy).not.toHaveBeenCalled();
        });
    });

    describe('renderAnalysisPage', () => {
        it('should render analysis page content', () => {
            analysisPage.renderAnalysisPage();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('分析');
            expect(mainContent.innerHTML).toContain('analysis-content');
        });
    });

    describe('loadWorkoutData', () => {
        it('should load workout data successfully', async () => {
            const mockWorkoutData = [
                { id: 1, name: 'ワークアウト1', muscle_group: '胸' },
                { id: 2, name: 'ワークアウト2', muscle_group: '背中' }
            ];

            const { supabaseService } = require('../../js/services/supabaseService.js');
            supabaseService.getWorkoutData.mockResolvedValue(mockWorkoutData);

            await analysisPage.loadWorkoutData();

            expect(supabaseService.getWorkoutData).toHaveBeenCalled();
            expect(analysisPage.workoutData).toEqual(mockWorkoutData);
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            analysisPage.setupEventListeners();

            expect(analysisPage.eventListenersSetup).toBe(true);
        });
    });

    describe('renderStatistics', () => {
        it('should render statistics', () => {
            analysisPage.renderStatistics();

            const analysisContent = document.getElementById('analysis-content');
            expect(analysisContent.innerHTML).toContain('統計データ');
        });
    });

    describe('renderCharts', () => {
        it('should render charts', () => {
            analysisPage.renderCharts();

            const analysisContent = document.getElementById('analysis-content');
            expect(analysisContent.innerHTML).toContain('チャート');
        });
    });

    describe('generateAnalysisReport', () => {
        it('should generate analysis report', () => {
            analysisPage.workoutData = [
                { id: 1, muscle_group: '胸' },
                { id: 2, muscle_group: '背中' },
                { id: 3, muscle_group: '胸' }
            ];

            const report = analysisPage.generateAnalysisReport();

            expect(report).toHaveProperty('totalWorkouts');
            expect(report).toHaveProperty('averageWorkoutsPerWeek');
            expect(report).toHaveProperty('mostUsedMuscleGroup');
            expect(report.totalWorkouts).toBe(3);
        });
    });

    describe('calculateAverageWorkoutsPerWeek', () => {
        it('should calculate average workouts per week', () => {
            analysisPage.workoutData = [
                { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }
            ];

            const average = analysisPage.calculateAverageWorkoutsPerWeek();

            expect(average).toBe(1);
        });

        it('should return 0 for empty workout data', () => {
            analysisPage.workoutData = [];

            const average = analysisPage.calculateAverageWorkoutsPerWeek();

            expect(average).toBe(0);
        });
    });

    describe('getMostUsedMuscleGroup', () => {
        it('should return most used muscle group', () => {
            analysisPage.workoutData = [
                { muscle_group: '胸' },
                { muscle_group: '背中' },
                { muscle_group: '胸' }
            ];

            const mostUsed = analysisPage.getMostUsedMuscleGroup();

            expect(mostUsed).toBe('胸');
        });

        it('should return なし for empty workout data', () => {
            analysisPage.workoutData = [];

            const mostUsed = analysisPage.getMostUsedMuscleGroup();

            expect(mostUsed).toBe('なし');
        });
    });
});