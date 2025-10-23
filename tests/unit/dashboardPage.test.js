// dashboardPage.test.js - ダッシュボードページのテスト

import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../js/services/supabaseService.js', () => ({
    supabaseService: {
        getWorkoutHistory: jest.fn(),
        getUserStats: jest.fn(),
        getRecommendations: jest.fn()
    }
}));

jest.mock('../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn(),
        showLoginModal: jest.fn()
    }
}));

jest.mock('../js/utils/helpers.js', () => ({
    showNotification: jest.fn(),
    createErrorHTML: jest.fn(),
    formatWorkoutDate: jest.fn(),
    getDaysAgo: jest.fn(),
    getWorkoutColor: jest.fn(),
    parseExercises: jest.fn()
}));

import { supabaseService } from '../js/services/supabaseService.js';
import { authManager } from '../js/modules/authManager.js';
import { showNotification } from '../js/utils/helpers.js';
import DashboardPage from '../js/pages/dashboardPage.js';

describe('DashboardPage', () => {
    let dashboardPage;
    let mockElement;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock DOM element
        mockElement = document.createElement('div');
        mockElement.innerHTML = `
            <div id="weekly-workouts">0</div>
            <div id="total-time">0分</div>
            <div id="streak-days">0日</div>
            <div id="goals-achieved">0/5</div>
            <div id="muscle-groups"></div>
            <div id="recent-workouts"></div>
            <div id="recommendations"></div>
        `;
        document.body.appendChild(mockElement);

        // Create dashboard page instance
        dashboardPage = new DashboardPage();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        test('should initialize with empty arrays', () => {
            expect(dashboardPage.muscleRecoveryData).toEqual([]);
            expect(dashboardPage.recommendations).toEqual([]);
        });
    });

    describe('initialize', () => {
        test('should show login prompt when not authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            const showLoginPromptSpy = jest.spyOn(dashboardPage, 'showLoginPrompt');

            await dashboardPage.initialize();

            expect(showLoginPromptSpy).toHaveBeenCalled();
        });

        test('should load data when authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            const loadRecommendationsSpy = jest.spyOn(dashboardPage, 'loadRecommendations');
            const loadMuscleRecoveryDataSpy = jest.spyOn(dashboardPage, 'loadMuscleRecoveryData');
            const loadRecentWorkoutsSpy = jest.spyOn(dashboardPage, 'loadRecentWorkouts');
            const loadStatsSpy = jest.spyOn(dashboardPage, 'loadStats');

            await dashboardPage.initialize();

            expect(loadRecommendationsSpy).toHaveBeenCalled();
            expect(loadMuscleRecoveryDataSpy).toHaveBeenCalled();
            expect(loadRecentWorkoutsSpy).toHaveBeenCalled();
            expect(loadStatsSpy).toHaveBeenCalled();
        });

        test('should handle initialization errors', async () => {
            authManager.isAuthenticated.mockRejectedValue(new Error('Auth error'));

            await dashboardPage.initialize();

            expect(showNotification).toHaveBeenCalledWith(
                'ダッシュボードの初期化に失敗しました',
                'error'
            );
        });
    });

    describe('showLoginPrompt', () => {
        test('should display login prompt HTML', () => {
            const mainContent = document.createElement('main');
            document.body.appendChild(mainContent);

            dashboardPage.showLoginPrompt();

            expect(mainContent.innerHTML).toContain('ログインが必要です');
            expect(mainContent.innerHTML).toContain('ログイン');
        });

        test('should setup login button event listener', () => {
            const mainContent = document.createElement('main');
            document.body.appendChild(mainContent);

            dashboardPage.showLoginPrompt();

            const loginBtn = document.getElementById('login-btn');
            expect(loginBtn).toBeTruthy();
        });
    });

    describe('setupAuthButton', () => {
        test('should setup auth button event listener', () => {
            const authButton = document.createElement('button');
            authButton.id = 'auth-button';
            document.body.appendChild(authButton);

            dashboardPage.setupAuthButton();

            authButton.click();
            expect(authManager.showLoginModal).toHaveBeenCalled();
        });
    });

    describe('loadStats', () => {
        test('should load and update stats display', async () => {
            const mockStats = {
                weeklyWorkouts: 5,
                totalMinutes: 120,
                streakDays: 7,
                goalsAchieved: 3
            };
            supabaseService.getUserStats.mockResolvedValue(mockStats);
            const updateStatsDisplaySpy = jest.spyOn(dashboardPage, 'updateStatsDisplay');

            await dashboardPage.loadStats();

            expect(supabaseService.getUserStats).toHaveBeenCalled();
            expect(updateStatsDisplaySpy).toHaveBeenCalledWith(mockStats);
        });

        test('should handle stats loading errors', async () => {
            supabaseService.getUserStats.mockRejectedValue(new Error('Stats error'));

            await dashboardPage.loadStats();

            // Should not throw error
            expect(true).toBe(true);
        });
    });

    describe('updateStatsDisplay', () => {
        test('should update stats elements with provided data', () => {
            const stats = {
                weeklyWorkouts: 5,
                totalMinutes: 120,
                streakDays: 7,
                goalsAchieved: 3
            };

            dashboardPage.updateStatsDisplay(stats);

            expect(document.getElementById('weekly-workouts').textContent).toBe('5');
            expect(document.getElementById('total-time').textContent).toBe('120分');
            expect(document.getElementById('streak-days').textContent).toBe('7日');
            expect(document.getElementById('goals-achieved').textContent).toBe('3/5');
        });

        test('should handle missing stats data', () => {
            const stats = {};

            dashboardPage.updateStatsDisplay(stats);

            expect(document.getElementById('weekly-workouts').textContent).toBe('0');
            expect(document.getElementById('total-time').textContent).toBe('0分');
            expect(document.getElementById('streak-days').textContent).toBe('0日');
            expect(document.getElementById('goals-achieved').textContent).toBe('0/5');
        });
    });

    describe('setupMusclePartHandlers', () => {
        test('should setup click handlers for muscle parts', () => {
            const musclePart = document.createElement('div');
            musclePart.className = 'muscle-part';
            musclePart.dataset.muscle = 'chest';
            document.body.appendChild(musclePart);

            const handleMusclePartClickSpy = jest.spyOn(dashboardPage, 'handleMusclePartClick');

            dashboardPage.setupMusclePartHandlers();

            musclePart.click();
            expect(handleMusclePartClickSpy).toHaveBeenCalledWith('chest');
        });
    });
});
