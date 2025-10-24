/**
 * DashboardPage テストスイート
 */

import { dashboardPage } from '../../js/pages/dashboardPage.js';
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

describe('DashboardPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="main-content"></div>';
        safeGetElement.mockReturnValue(document.querySelector('#main-content'));
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(dashboardPage.isInitialized).toBe(false);
        });
    });

    describe('init', () => {
        it('should initialize successfully when authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await dashboardPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(dashboardPage.isInitialized).toBe(true);
        });

        it('should show login prompt when not authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            
            await dashboardPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            authManager.isAuthenticated.mockRejectedValue(new Error('Auth check failed'));
            
            await dashboardPage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'DashboardPage.init'
            );
        });
    });

    describe('loadDashboardData', () => {
        it('should load dashboard data successfully', async () => {
            const mockData = {
                workouts: [],
                progress: [],
                recommendations: []
            };
            
            authManager.isAuthenticated.mockResolvedValue(true);
            supabaseService.loadData.mockResolvedValue(mockData);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await dashboardPage.init();
            
            expect(supabaseService.loadData).toHaveBeenCalled();
        });

        it('should handle data loading errors', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            supabaseService.loadData.mockRejectedValue(new Error('Data loading failed'));
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await dashboardPage.init();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'DashboardPage.loadDashboardData'
            );
        });
    });

    describe('renderDashboard', () => {
        it('should render dashboard content', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await dashboardPage.init();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('ダッシュボード');
        });
    });

    describe('setupTooltips', () => {
        it('should setup tooltips', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await dashboardPage.init();
            
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(dashboardPage.setupTooltips).toBeDefined();
        });
    });

    describe('showLoginPrompt', () => {
        it('should render login prompt', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            
            await dashboardPage.init();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('ログインが必要です');
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow when authenticated', async () => {
            const mockData = {
                workouts: [],
                progress: [],
                recommendations: []
            };
            
            authManager.isAuthenticated.mockResolvedValue(true);
            supabaseService.loadData.mockResolvedValue(mockData);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await dashboardPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(supabaseService.loadData).toHaveBeenCalled();
            expect(tooltipManager.initialize).toHaveBeenCalled();
            expect(dashboardPage.isInitialized).toBe(true);
        });

        it('should handle multiple initialization calls', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await dashboardPage.init();
            await dashboardPage.init();
            
            expect(authManager.isAuthenticated).toHaveBeenCalledTimes(2);
        });
    });
});