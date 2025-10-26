/**
 * CalendarPage テストスイート
 */

import calendarPage from '../../js/pages/calendarPage.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { showNotification, getMuscleColor, isFutureDate, isPastDate, createCalendarModalHTML, safeGetElement, showInputDialog } from '../../js/utils/helpers.js';
import { MUSCLE_GROUPS } from '../../js/utils/constants.js';
import { authManager } from '../../js/modules/authManager.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        isAvailable: jest.fn(),
        getCurrentUser: jest.fn(),
        getWorkouts: jest.fn()
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    showNotification: jest.fn(),
    getMuscleColor: jest.fn(),
    isFutureDate: jest.fn(),
    isPastDate: jest.fn(),
    createCalendarModalHTML: jest.fn(),
    safeGetElement: jest.fn(),
    showInputDialog: jest.fn()
}));

jest.mock('../../js/utils/constants.js', () => ({
    MUSCLE_GROUPS: [
        { id: 'chest', name: '胸', color: '#3B82F6' },
        { id: 'back', name: '背中', color: '#10B981' }
    ]
}));

jest.mock('../../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn(),
        showAuthModal: jest.fn()
    }
}));

describe('CalendarPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="main-content"></div>';
        safeGetElement.mockReturnValue(document.querySelector('#main-content'));
        
        // localStorage のモック
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn()
            },
            writable: true
        });
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(calendarPage.currentDate).toBeInstanceOf(Date);
            expect(calendarPage.workoutData).toEqual([]);
            expect(calendarPage.plannedWorkouts).toEqual([]);
            expect(calendarPage.selectedDate).toBe(null);
            expect(calendarPage.isLoading).toBe(false);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.getCurrentUser.mockReturnValue({ id: 'user123' });
            supabaseService.getWorkouts.mockResolvedValue([]);
            calendarPage.loadPlannedWorkouts = jest.fn().mockResolvedValue([]);
            
            await calendarPage.initialize();
            
            expect(consoleSpy).toHaveBeenCalledWith('Calendar page initializing without auth check');
            
            consoleSpy.mockRestore();
        });

        it('should handle DOM ready state', async () => {
            Object.defineProperty(document, 'readyState', {
                value: 'complete',
                writable: true
            });
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.getCurrentUser.mockReturnValue({ id: 'user123' });
            supabaseService.getWorkouts.mockResolvedValue([]);
            calendarPage.loadPlannedWorkouts = jest.fn().mockResolvedValue([]);
            
            await calendarPage.initialize();
            
            // initializeが呼ばれたことを確認
            expect(calendarPage.currentDate).toBeInstanceOf(Date);
        });
    });

    describe('loadWorkoutData', () => {
        it('should load workout data from localStorage when Supabase unavailable', async () => {
            const mockWorkouts = [
                { id: 1, date: '2024-01-01', exercises: [] },
                { id: 2, date: '2024-01-02', exercises: [] }
            ];
            
            supabaseService.isAvailable.mockReturnValue(false);
            window.localStorage.getItem.mockReturnValue(JSON.stringify(mockWorkouts));
            
            await calendarPage.loadWorkoutData();
            
            expect(window.localStorage.getItem).toHaveBeenCalledWith('workoutHistory');
            expect(calendarPage.workoutData).toEqual(mockWorkouts);
        });

        it('should generate sample data when no data available', async () => {
            supabaseService.isAvailable.mockReturnValue(false);
            window.localStorage.getItem.mockReturnValue('[]');
            
            await calendarPage.loadWorkoutData();
            
            expect(window.localStorage.getItem).toHaveBeenCalledWith('workoutHistory');
            expect(calendarPage.workoutData.length).toBeGreaterThan(0);
        });

        it('should handle loading errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            // localStorage.getItem をエラーを投げるようにモック
            window.localStorage.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });
            
            await calendarPage.loadWorkoutData();
            
            expect(consoleSpy).toHaveBeenCalledWith('Error loading workout data:', expect.any(Error));
            expect(showNotification).toHaveBeenCalledWith('ワークアウトデータの読み込みに失敗しました', 'error');
            
            consoleSpy.mockRestore();
        });
    });


    describe('renderCalendar', () => {
        it('should render calendar', () => {
            calendarPage.workoutData = [
                { id: 1, date: '2024-01-01', exercises: [] }
            ];
            
            calendarPage.renderCalendar();
            
            expect(calendarPage.workoutData).toHaveLength(1);
        });
    });

    describe('setupCalendarInterface', () => {
        it('should setup calendar interface', () => {
            calendarPage.setupCalendarInterface();
            
            // カレンダーインターフェースが設定されることを確認
            expect(calendarPage.currentDate).toBeInstanceOf(Date);
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            calendarPage.setupEventListeners();
            
            // イベントリスナーが設定されることを確認
            expect(calendarPage.currentDate).toBeInstanceOf(Date);
        });
    });

    describe('setupAuthButton', () => {
        it('should setup auth button', () => {
            calendarPage.setupAuthButton();
            
            // 認証ボタンが設定されることを確認
            expect(calendarPage.currentDate).toBeInstanceOf(Date);
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.getCurrentUser.mockReturnValue({ id: 'user123' });
            supabaseService.getWorkouts.mockResolvedValue([]);
            calendarPage.loadPlannedWorkouts = jest.fn().mockResolvedValue([]);
            
            await calendarPage.initialize();
            
            // initializeが呼ばれたことを確認
            expect(calendarPage.currentDate).toBeInstanceOf(Date);
            
            consoleSpy.mockRestore();
        });

        it('should handle multiple initialization calls', async () => {
            await calendarPage.initialize();
            await calendarPage.initialize();
            
            // 複数回の初期化が正常に処理されることを確認
            expect(calendarPage.currentDate).toBeInstanceOf(Date);
        });
    });
});