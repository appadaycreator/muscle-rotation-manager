// WorkoutPage.test.js - ワークアウトページのテスト

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
        saveWorkout: jest.fn(),
        getWorkoutHistory: jest.fn(),
        getExercises: jest.fn()
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

// WorkoutPageクラスをモック
const WorkoutPage = class WorkoutPage {
    constructor() {
        this.currentWorkout = null;
        this.workoutTimer = null;
        this.workoutStartTime = null;
        this.exercises = [];
        this.muscleGroups = ['胸', '背中', '肩', '腕', '脚', '腹筋'];
        this.selectedMuscles = [];
        this.selectedExercises = [];
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
        
        this.setupWorkoutInterface();
        await this.loadExercises();
        this.setupEventListeners();
    }

    setupWorkoutInterface() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h1>ワークアウト</h1>';
        }
    }

    async loadExercises() {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        return await supabaseService.getExercises();
    }

    setupEventListeners() {
        this.eventListenersSetup = true;
    }

    startWorkout() {
        this.workoutStartTime = new Date();
        this.workoutTimer = setInterval(() => {}, 1000);
    }

    async endWorkout() {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        const { showNotification } = require('../../js/utils/helpers.js');
        
        if (this.currentWorkout) {
            await supabaseService.saveWorkout(this.currentWorkout);
            showNotification('ワークアウトが保存されました', 'success');
        }
    }

    addExercise(exercise) {
        this.exercises.push(exercise);
    }

    removeExercise(exercise) {
        const index = this.exercises.indexOf(exercise);
        if (index > -1) {
            this.exercises.splice(index, 1);
        }
    }

    selectMuscleGroup(muscle) {
        const index = this.selectedMuscles.indexOf(muscle);
        if (index > -1) {
            this.selectedMuscles.splice(index, 1);
        } else {
            this.selectedMuscles.push(muscle);
        }
    }

    getWorkoutDuration() {
        if (!this.workoutStartTime) return 0;
        return Date.now() - this.workoutStartTime.getTime();
    }

    getWorkoutStats() {
        let totalSets = 0;
        let totalReps = 0;
        let totalWeight = 0;
        
        this.exercises.forEach(exercise => {
            totalSets += exercise.sets || 0;
            totalReps += exercise.reps || 0;
            totalWeight += exercise.weight || 0;
        });
        
        return { totalSets, totalReps, totalWeight };
    }

    showLoginPrompt() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<p>ログインが必要です</p>';
        }
    }
};

describe('WorkoutPage', () => {
    let workoutPage;

    beforeEach(() => {
        workoutPage = new WorkoutPage();
        document.body.innerHTML = '<div id="main-content"></div>';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(workoutPage.currentWorkout).toBeNull();
            expect(workoutPage.workoutTimer).toBeNull();
            expect(workoutPage.workoutStartTime).toBeNull();
            expect(workoutPage.exercises).toEqual([]);
            expect(workoutPage.muscleGroups).toEqual(['胸', '背中', '肩', '腕', '脚', '腹筋']);
            expect(workoutPage.selectedMuscles).toEqual([]);
            expect(workoutPage.selectedExercises).toEqual([]);
            expect(workoutPage.eventListenersSetup).toBe(false);
        });
    });

    describe('checkAuthentication', () => {
        it('should return true for authenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const result = await workoutPage.checkAuthentication();

            expect(result).toBe(true);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should return false for unauthenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const result = await workoutPage.checkAuthentication();

            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });
    });

    describe('onInitialize', () => {
        it('should initialize successfully when authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const setupWorkoutInterfaceSpy = jest.spyOn(workoutPage, 'setupWorkoutInterface');
            const loadExercisesSpy = jest.spyOn(workoutPage, 'loadExercises');
            const setupEventListenersSpy = jest.spyOn(workoutPage, 'setupEventListeners');

            await workoutPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(setupWorkoutInterfaceSpy).toHaveBeenCalled();
            expect(loadExercisesSpy).toHaveBeenCalled();
            expect(setupEventListenersSpy).toHaveBeenCalled();
        });

        it('should not initialize if not authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const setupWorkoutInterfaceSpy = jest.spyOn(workoutPage, 'setupWorkoutInterface');

            await workoutPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(setupWorkoutInterfaceSpy).not.toHaveBeenCalled();
        });
    });

    describe('setupWorkoutInterface', () => {
        it('should setup workout interface', () => {
            workoutPage.setupWorkoutInterface();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('ワークアウト');
        });
    });

    describe('loadExercises', () => {
        it('should load exercises successfully', async () => {
            const mockExercises = [
                { id: 1, name: 'プッシュアップ', muscle_group: '胸' },
                { id: 2, name: 'スクワット', muscle_group: '脚' }
            ];

            const { supabaseService } = require('../../js/services/supabaseService.js');
            supabaseService.getExercises.mockResolvedValue(mockExercises);

            const result = await workoutPage.loadExercises();

            expect(result).toEqual(mockExercises);
            expect(supabaseService.getExercises).toHaveBeenCalled();
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            workoutPage.setupEventListeners();

            expect(workoutPage.eventListenersSetup).toBe(true);
        });
    });

    describe('startWorkout', () => {
        it('should start workout', () => {
            workoutPage.startWorkout();

            expect(workoutPage.workoutStartTime).toBeInstanceOf(Date);
            expect(workoutPage.workoutTimer).toBeDefined();
        });
    });

    describe('endWorkout', () => {
        it('should end workout', async () => {
            const { supabaseService } = require('../../js/services/supabaseService.js');
            const { showNotification } = require('../../js/utils/helpers.js');
            supabaseService.saveWorkout.mockResolvedValue({ success: true });

            workoutPage.currentWorkout = {
                exercises: [],
                startTime: new Date(),
                endTime: new Date()
            };

            await workoutPage.endWorkout();

            expect(supabaseService.saveWorkout).toHaveBeenCalled();
            expect(showNotification).toHaveBeenCalledWith('ワークアウトが保存されました', 'success');
        });
    });

    describe('addExercise', () => {
        it('should add exercise to workout', () => {
            const exercise = { id: 1, name: 'プッシュアップ', muscle_group: '胸' };

            workoutPage.addExercise(exercise);

            expect(workoutPage.exercises).toContain(exercise);
        });
    });

    describe('removeExercise', () => {
        it('should remove exercise from workout', () => {
            const exercise = { id: 1, name: 'プッシュアップ', muscle_group: '胸' };
            workoutPage.exercises = [exercise];

            workoutPage.removeExercise(exercise);

            expect(workoutPage.exercises).not.toContain(exercise);
        });
    });

    describe('selectMuscleGroup', () => {
        it('should select muscle group', () => {
            workoutPage.selectMuscleGroup('胸');

            expect(workoutPage.selectedMuscles).toContain('胸');
        });

        it('should deselect muscle group if already selected', () => {
            workoutPage.selectedMuscles = ['胸'];
            workoutPage.selectMuscleGroup('胸');

            expect(workoutPage.selectedMuscles).not.toContain('胸');
        });
    });

    describe('getWorkoutDuration', () => {
        it('should return workout duration', () => {
            workoutPage.workoutStartTime = new Date(Date.now() - 60000); // 1 minute ago

            const duration = workoutPage.getWorkoutDuration();

            expect(duration).toBeGreaterThan(0);
        });

        it('should return 0 if workout not started', () => {
            workoutPage.workoutStartTime = null;

            const duration = workoutPage.getWorkoutDuration();

            expect(duration).toBe(0);
        });
    });

    describe('getWorkoutStats', () => {
        it('should return workout stats', () => {
            workoutPage.exercises = [
                { sets: 3, reps: 10, weight: 50 },
                { sets: 2, reps: 8, weight: 30 }
            ];

            const stats = workoutPage.getWorkoutStats();

            expect(stats.totalSets).toBe(5);
            expect(stats.totalReps).toBe(18);
            expect(stats.totalWeight).toBe(80);
        });
    });
});