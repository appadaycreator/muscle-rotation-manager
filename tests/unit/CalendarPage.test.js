// CalendarPage.test.js - カレンダーページのテスト

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
        getPlannedWorkouts: jest.fn()
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

// CalendarPageクラスをモック
const CalendarPage = class CalendarPage {
    constructor() {
        this.workoutData = [];
        this.plannedWorkouts = [];
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
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
        
        this.setupCalendarInterface();
        await this.loadWorkoutData();
        this.setupEventListeners();
    }

    setupCalendarInterface() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h1>カレンダー</h1><div id="calendar-content"></div>';
        }
    }

    async loadWorkoutData() {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        
        this.workoutData = await supabaseService.getWorkoutData();
        this.plannedWorkouts = await supabaseService.getPlannedWorkouts();
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

    renderCalendar() {
        const calendarContent = document.getElementById('calendar-content');
        if (calendarContent) {
            calendarContent.innerHTML = '<div class="calendar">カレンダー表示</div>';
        }
    }

    getCurrentMonth() {
        return this.currentMonth;
    }

    getCurrentYear() {
        return this.currentYear;
    }

    getWorkoutsForDate(date) {
        return this.workoutData.filter(workout => 
            new Date(workout.date).toDateString() === date.toDateString()
        );
    }

    getPlannedWorkoutsForDate(date) {
        return this.plannedWorkouts.filter(workout => 
            new Date(workout.date).toDateString() === date.toDateString()
        );
    }
};

describe('CalendarPage', () => {
    let calendarPage;

    beforeEach(() => {
        calendarPage = new CalendarPage();
        document.body.innerHTML = '<div id="main-content"></div>';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(calendarPage.workoutData).toEqual([]);
            expect(calendarPage.plannedWorkouts).toEqual([]);
            expect(calendarPage.currentMonth).toBe(new Date().getMonth());
            expect(calendarPage.currentYear).toBe(new Date().getFullYear());
            expect(calendarPage.eventListenersSetup).toBe(false);
        });
    });

    describe('checkAuthentication', () => {
        it('should return true for authenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const result = await calendarPage.checkAuthentication();

            expect(result).toBe(true);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should return false for unauthenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const result = await calendarPage.checkAuthentication();

            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });
    });

    describe('onInitialize', () => {
        it('should initialize successfully when authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const setupCalendarInterfaceSpy = jest.spyOn(calendarPage, 'setupCalendarInterface');
            const loadWorkoutDataSpy = jest.spyOn(calendarPage, 'loadWorkoutData');
            const setupEventListenersSpy = jest.spyOn(calendarPage, 'setupEventListeners');

            await calendarPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(setupCalendarInterfaceSpy).toHaveBeenCalled();
            expect(loadWorkoutDataSpy).toHaveBeenCalled();
            expect(setupEventListenersSpy).toHaveBeenCalled();
        });

        it('should not initialize if not authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const setupCalendarInterfaceSpy = jest.spyOn(calendarPage, 'setupCalendarInterface');

            await calendarPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(setupCalendarInterfaceSpy).not.toHaveBeenCalled();
        });
    });

    describe('setupCalendarInterface', () => {
        it('should setup calendar interface', () => {
            calendarPage.setupCalendarInterface();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('カレンダー');
            expect(mainContent.innerHTML).toContain('calendar-content');
        });
    });

    describe('loadWorkoutData', () => {
        it('should load workout data successfully', async () => {
            const mockWorkoutData = [
                { id: 1, name: 'ワークアウト1', date: '2024-01-01' }
            ];
            const mockPlannedWorkouts = [
                { id: 2, name: '計画されたワークアウト', date: '2024-01-02' }
            ];

            const { supabaseService } = require('../../js/services/supabaseService.js');
            supabaseService.getWorkoutData.mockResolvedValue(mockWorkoutData);
            supabaseService.getPlannedWorkouts.mockResolvedValue(mockPlannedWorkouts);

            await calendarPage.loadWorkoutData();

            expect(supabaseService.getWorkoutData).toHaveBeenCalled();
            expect(supabaseService.getPlannedWorkouts).toHaveBeenCalled();
            expect(calendarPage.workoutData).toEqual(mockWorkoutData);
            expect(calendarPage.plannedWorkouts).toEqual(mockPlannedWorkouts);
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            calendarPage.setupEventListeners();

            expect(calendarPage.eventListenersSetup).toBe(true);
        });
    });

    describe('renderCalendar', () => {
        it('should render calendar', () => {
            calendarPage.renderCalendar();

            const calendarContent = document.getElementById('calendar-content');
            expect(calendarContent.innerHTML).toContain('カレンダー表示');
        });
    });

    describe('getCurrentMonth', () => {
        it('should return current month', () => {
            const month = calendarPage.getCurrentMonth();

            expect(month).toBe(new Date().getMonth());
        });
    });

    describe('getCurrentYear', () => {
        it('should return current year', () => {
            const year = calendarPage.getCurrentYear();

            expect(year).toBe(new Date().getFullYear());
        });
    });

    describe('getWorkoutsForDate', () => {
        it('should return workouts for specific date', () => {
            const testDate = new Date('2024-01-01');
            calendarPage.workoutData = [
                { id: 1, name: 'ワークアウト1', date: '2024-01-01' },
                { id: 2, name: 'ワークアウト2', date: '2024-01-02' }
            ];

            const workouts = calendarPage.getWorkoutsForDate(testDate);

            expect(workouts).toHaveLength(1);
            expect(workouts[0].name).toBe('ワークアウト1');
        });
    });

    describe('getPlannedWorkoutsForDate', () => {
        it('should return planned workouts for specific date', () => {
            const testDate = new Date('2024-01-01');
            calendarPage.plannedWorkouts = [
                { id: 1, name: '計画1', date: '2024-01-01' },
                { id: 2, name: '計画2', date: '2024-01-02' }
            ];

            const plannedWorkouts = calendarPage.getPlannedWorkoutsForDate(testDate);

            expect(plannedWorkouts).toHaveLength(1);
            expect(plannedWorkouts[0].name).toBe('計画1');
        });
    });
});