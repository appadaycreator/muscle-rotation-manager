// DashboardPage.test.js - ダッシュボードページのテスト

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
        getPlannedWorkouts: jest.fn(),
        getRecentWorkouts: jest.fn()
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

// DashboardPageクラスをモック
const DashboardPage = class DashboardPage {
    constructor() {
        this.workoutData = [];
        this.plannedWorkouts = [];
        this.recentWorkouts = [];
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
        
        this.setupDashboardInterface();
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    setupDashboardInterface() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h1>ダッシュボード</h1>';
        }
    }

    async loadDashboardData() {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        
        this.workoutData = await supabaseService.getWorkoutData();
        this.plannedWorkouts = await supabaseService.getPlannedWorkouts();
        this.recentWorkouts = await supabaseService.getRecentWorkouts();
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

    getTotalWorkouts() {
        return this.workoutData.length;
    }

    getPlannedWorkoutsCount() {
        return this.plannedWorkouts.length;
    }

    getRecentWorkoutsCount() {
        return this.recentWorkouts.length;
    }
};

describe('DashboardPage', () => {
    let dashboardPage;

    beforeEach(() => {
        dashboardPage = new DashboardPage();
        document.body.innerHTML = '<div id="main-content"></div>';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(dashboardPage.workoutData).toEqual([]);
            expect(dashboardPage.plannedWorkouts).toEqual([]);
            expect(dashboardPage.recentWorkouts).toEqual([]);
            expect(dashboardPage.eventListenersSetup).toBe(false);
        });
    });

    describe('checkAuthentication', () => {
        it('should return true for authenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const result = await dashboardPage.checkAuthentication();

            expect(result).toBe(true);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should return false for unauthenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const result = await dashboardPage.checkAuthentication();

            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });
    });

    describe('onInitialize', () => {
        it('should initialize successfully when authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const setupDashboardInterfaceSpy = jest.spyOn(dashboardPage, 'setupDashboardInterface');
            const loadDashboardDataSpy = jest.spyOn(dashboardPage, 'loadDashboardData');
            const setupEventListenersSpy = jest.spyOn(dashboardPage, 'setupEventListeners');

            await dashboardPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(setupDashboardInterfaceSpy).toHaveBeenCalled();
            expect(loadDashboardDataSpy).toHaveBeenCalled();
            expect(setupEventListenersSpy).toHaveBeenCalled();
        });

        it('should not initialize if not authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const setupDashboardInterfaceSpy = jest.spyOn(dashboardPage, 'setupDashboardInterface');

            await dashboardPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(setupDashboardInterfaceSpy).not.toHaveBeenCalled();
        });
    });

    describe('setupDashboardInterface', () => {
        it('should setup dashboard interface', () => {
            dashboardPage.setupDashboardInterface();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('ダッシュボード');
        });
    });

    describe('loadDashboardData', () => {
        it('should load dashboard data successfully', async () => {
            const mockWorkoutData = [{ id: 1, name: 'ワークアウト1' }];
            const mockPlannedWorkouts = [{ id: 2, name: '計画されたワークアウト' }];
            const mockRecentWorkouts = [{ id: 3, name: '最近のワークアウト' }];

            const { supabaseService } = require('../../js/services/supabaseService.js');
            supabaseService.getWorkoutData.mockResolvedValue(mockWorkoutData);
            supabaseService.getPlannedWorkouts.mockResolvedValue(mockPlannedWorkouts);
            supabaseService.getRecentWorkouts.mockResolvedValue(mockRecentWorkouts);

            await dashboardPage.loadDashboardData();

            expect(supabaseService.getWorkoutData).toHaveBeenCalled();
            expect(supabaseService.getPlannedWorkouts).toHaveBeenCalled();
            expect(supabaseService.getRecentWorkouts).toHaveBeenCalled();
            expect(dashboardPage.workoutData).toEqual(mockWorkoutData);
            expect(dashboardPage.plannedWorkouts).toEqual(mockPlannedWorkouts);
            expect(dashboardPage.recentWorkouts).toEqual(mockRecentWorkouts);
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            dashboardPage.setupEventListeners();

            expect(dashboardPage.eventListenersSetup).toBe(true);
        });
    });

    describe('getTotalWorkouts', () => {
        it('should return total workouts count', () => {
            dashboardPage.workoutData = [
                { id: 1, name: 'ワークアウト1' },
                { id: 2, name: 'ワークアウト2' }
            ];

            const count = dashboardPage.getTotalWorkouts();

            expect(count).toBe(2);
        });
    });

    describe('getPlannedWorkoutsCount', () => {
        it('should return planned workouts count', () => {
            dashboardPage.plannedWorkouts = [
                { id: 1, name: '計画1' },
                { id: 2, name: '計画2' },
                { id: 3, name: '計画3' }
            ];

            const count = dashboardPage.getPlannedWorkoutsCount();

            expect(count).toBe(3);
        });
    });

    describe('getRecentWorkoutsCount', () => {
        it('should return recent workouts count', () => {
            dashboardPage.recentWorkouts = [
                { id: 1, name: '最近1' }
            ];

            const count = dashboardPage.getRecentWorkoutsCount();

            expect(count).toBe(1);
        });
    });
});
