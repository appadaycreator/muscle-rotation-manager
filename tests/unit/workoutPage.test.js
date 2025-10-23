// workoutPage.test.js - ワークアウトページのテスト

import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../js/services/supabaseService.js', () => ({
    supabaseService: {
        saveWorkout: jest.fn(),
        getWorkoutHistory: jest.fn(),
        getExercises: jest.fn()
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
    safeAsync: jest.fn(),
    safeGetElement: jest.fn(),
    safeGetElements: jest.fn(),
    debounce: jest.fn(),
    escapeHtml: jest.fn()
}));

import { supabaseService } from '../js/services/supabaseService.js';
import { authManager } from '../js/modules/authManager.js';
import { showNotification, safeAsync, safeGetElement } from '../js/utils/helpers.js';
import WorkoutPage from '../js/pages/workoutPage.js';

describe('WorkoutPage', () => {
    let workoutPage;
    let mockElement;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock DOM element
        mockElement = document.createElement('div');
        mockElement.innerHTML = `
            <div id="workout-container">
                <div id="start-workout"></div>
                <div id="current-workout" class="hidden"></div>
                <div id="workout-history"></div>
            </div>
        `;
        document.body.appendChild(mockElement);

        // Mock safeGetElement to return our mock element
        safeGetElement.mockImplementation((selector) => {
            if (selector === '#workout-container') return mockElement;
            return document.querySelector(selector);
        });

        // Create workout page instance
        workoutPage = new WorkoutPage();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(workoutPage.currentWorkout).toBeNull();
            expect(workoutPage.selectedMuscleGroups).toEqual([]);
            expect(workoutPage.exercises).toEqual([]);
            expect(workoutPage.workoutTimer).toBeNull();
            expect(workoutPage.startTime).toBeNull();
        });
    });

    describe('initialize', () => {
        test('should show login prompt when not authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            const showLoginPromptSpy = jest.spyOn(workoutPage, 'showLoginPrompt');

            await workoutPage.initialize();

            expect(showLoginPromptSpy).toHaveBeenCalled();
        });

        test('should setup interface when authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            const setupWorkoutInterfaceSpy = jest.spyOn(workoutPage, 'setupWorkoutInterface');
            const setupEventListenersSpy = jest.spyOn(workoutPage, 'setupEventListeners');
            const initializeOfflineSyncSpy = jest.spyOn(workoutPage, 'initializeOfflineSync');
            const setupAuthButtonSpy = jest.spyOn(workoutPage, 'setupAuthButton');

            // Mock safeAsync to resolve immediately
            safeAsync.mockImplementation(async (fn, context) => {
                await fn();
            });

            await workoutPage.initialize();

            expect(setupWorkoutInterfaceSpy).toHaveBeenCalled();
            expect(setupEventListenersSpy).toHaveBeenCalled();
            expect(initializeOfflineSyncSpy).toHaveBeenCalled();
            expect(setupAuthButtonSpy).toHaveBeenCalled();
        });

        test('should handle initialization errors', async () => {
            authManager.isAuthenticated.mockRejectedValue(new Error('Auth error'));

            await workoutPage.initialize();

            expect(showNotification).toHaveBeenCalledWith(
                'ワークアウトページの初期化に失敗しました',
                'error'
            );
        });
    });

    describe('showLoginPrompt', () => {
        test('should display login prompt HTML', () => {
            const mainContent = document.createElement('main');
            document.body.appendChild(mainContent);

            workoutPage.showLoginPrompt();

            expect(mainContent.innerHTML).toContain('ログインが必要です');
            expect(mainContent.innerHTML).toContain('ワークアウトを記録するには');
        });

        test('should setup login button event listener', () => {
            const mainContent = document.createElement('main');
            document.body.appendChild(mainContent);

            workoutPage.showLoginPrompt();

            const loginBtn = document.getElementById('login-btn');
            expect(loginBtn).toBeTruthy();
        });
    });

    describe('setupAuthButton', () => {
        test('should setup auth button event listener', () => {
            const authButton = document.createElement('button');
            authButton.id = 'auth-button';
            document.body.appendChild(authButton);

            workoutPage.setupAuthButton();

            authButton.click();
            expect(authManager.showLoginModal).toHaveBeenCalled();
        });
    });

    describe('startWorkout', () => {
        test('should start workout with selected muscle groups', () => {
            const muscleGroups = ['chest', 'back'];
            workoutPage.selectedMuscleGroups = muscleGroups;

            workoutPage.startWorkout();

            expect(workoutPage.currentWorkout).toBeTruthy();
            expect(workoutPage.currentWorkout.muscleGroups).toEqual(muscleGroups);
            expect(workoutPage.startTime).toBeTruthy();
        });

        test('should show current workout section', () => {
            const currentWorkout = document.createElement('div');
            currentWorkout.id = 'current-workout';
            currentWorkout.classList.add('hidden');
            document.body.appendChild(currentWorkout);

            workoutPage.startWorkout();

            expect(currentWorkout.classList.contains('hidden')).toBe(false);
        });
    });

    describe('stopWorkout', () => {
        test('should stop workout and save data', async () => {
            // Setup current workout
            workoutPage.currentWorkout = {
                muscleGroups: ['chest'],
                exercises: [],
                startTime: new Date()
            };
            workoutPage.startTime = new Date();

            const saveWorkoutDataSpy = jest.spyOn(workoutPage, 'saveWorkoutData');
            saveWorkoutDataSpy.mockResolvedValue();

            await workoutPage.stopWorkout();

            expect(saveWorkoutDataSpy).toHaveBeenCalled();
            expect(workoutPage.currentWorkout).toBeNull();
        });

        test('should hide current workout section', () => {
            const currentWorkout = document.createElement('div');
            currentWorkout.id = 'current-workout';
            document.body.appendChild(currentWorkout);

            workoutPage.stopWorkout();

            expect(currentWorkout.classList.contains('hidden')).toBe(true);
        });
    });

    describe('saveWorkoutData', () => {
        test('should save workout data to Supabase when online', async () => {
            workoutPage.currentWorkout = {
                muscleGroups: ['chest'],
                exercises: [],
                startTime: new Date()
            };

            supabaseService.saveWorkout.mockResolvedValue([{ id: 1 }]);

            await workoutPage.saveWorkoutData();

            expect(supabaseService.saveWorkout).toHaveBeenCalled();
        });

        test('should save to localStorage when offline', async () => {
            workoutPage.currentWorkout = {
                muscleGroups: ['chest'],
                exercises: [],
                startTime: new Date()
            };

            // Mock offline state
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false
            });

            supabaseService.isAvailable.mockReturnValue(false);

            await workoutPage.saveWorkoutData();

            // Should not call Supabase
            expect(supabaseService.saveWorkout).not.toHaveBeenCalled();
        });
    });

    describe('addExercise', () => {
        test('should add exercise to current workout', () => {
            const exercise = {
                name: 'Bench Press',
                muscleGroup: 'chest',
                sets: []
            };

            workoutPage.addExercise(exercise);

            expect(workoutPage.exercises).toContain(exercise);
        });
    });

    describe('updateWorkoutTimer', () => {
        test('should update timer display', () => {
            const timerDisplay = document.createElement('div');
            timerDisplay.id = 'workout-timer';
            document.body.appendChild(timerDisplay);

            workoutPage.startTime = new Date(Date.now() - 60000); // 1 minute ago

            workoutPage.updateWorkoutTimer();

            expect(timerDisplay.textContent).toBe('00:01');
        });
    });
});
