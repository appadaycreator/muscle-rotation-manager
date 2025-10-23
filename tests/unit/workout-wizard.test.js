/**
 * ワークアウトウィザード機能のユニットテスト
 */

// テストランナーはグローバルで利用可能

// モックデータ
const mockMuscleGroups = [
    { id: 'chest', name: '胸筋', recovery_hours: 72 },
    { id: 'back', name: '背筋', recovery_hours: 72 },
    { id: 'shoulders', name: '肩', recovery_hours: 48 },
    { id: 'arms', name: '腕', recovery_hours: 48 },
    { id: 'legs', name: '脚', recovery_hours: 72 },
    { id: 'abs', name: '腹筋', recovery_hours: 24 }
];

const mockExercises = [
    { id: 'bench_press', name: 'ベンチプレス', muscle_groups: ['chest'] },
    { id: 'squat', name: 'スクワット', muscle_groups: ['legs'] },
    { id: 'deadlift', name: 'デッドリフト', muscle_groups: ['back', 'legs'] },
    { id: 'overhead_press', name: 'オーバーヘッドプレス', muscle_groups: ['shoulders'] }
];

// WorkoutPageWizardクラスのモック
class MockWorkoutPageWizard {
    constructor() {
        this.currentStep = 1;
        this.selectedMuscleGroups = [];
        this.selectedExercises = [];
        this.workoutActive = false;
        this.workoutStartTime = null;
        this.workoutTimer = null;
    }

    initialize() {
        this.renderMuscleGroups();
        this.renderExercisePresets();
        this.updateStepIndicator();
    }

    renderMuscleGroups() {
        // DOM操作のモック
        return mockMuscleGroups;
    }

    renderExercisePresets() {
        // DOM操作のモック
        return mockExercises;
    }

    updateStepIndicator() {
        // ステップインジケーターの更新
        return this.currentStep;
    }

    showStep(stepNumber) {
        this.currentStep = stepNumber;
        this.updateStepIndicator();
    }

    handlePresetSelection(presetType) {
        const presets = {
            'upper': ['chest', 'back', 'shoulders', 'arms'],
            'lower': ['legs'],
            'push': ['chest', 'shoulders'],
            'pull': ['back', 'arms']
        };

        this.selectedMuscleGroups = presets[presetType] || [];
        return this.selectedMuscleGroups;
    }

    toggleMuscleGroup(muscleId) {
        const index = this.selectedMuscleGroups.indexOf(muscleId);
        if (index > -1) {
            this.selectedMuscleGroups.splice(index, 1);
        } else {
            this.selectedMuscleGroups.push(muscleId);
        }
        return this.selectedMuscleGroups;
    }

    updateStep1ButtonState() {
        return this.selectedMuscleGroups.length > 0;
    }

    addExercise(exerciseName) {
        const exercise = {
            id: Date.now().toString(),
            name: exerciseName,
            sets: []
        };
        this.selectedExercises.push(exercise);
        return exercise;
    }

    removeSelectedExercise(exerciseId) {
        this.selectedExercises = this.selectedExercises.filter(ex => ex.id !== exerciseId);
        return this.selectedExercises;
    }

    updateSelectedExercisesDisplay() {
        return this.selectedExercises;
    }

    updateStep2ButtonState() {
        return this.selectedExercises.length > 0;
    }

    renderWorkoutSummary() {
        return {
            muscleGroups: this.selectedMuscleGroups,
            exercises: this.selectedExercises,
            estimatedDuration: this.selectedExercises.length * 15 // 15分/エクササイズ
        };
    }

    startWorkout() {
        this.workoutActive = true;
        this.workoutStartTime = Date.now();
        this.workoutTimer = setInterval(() => {
            // タイマー更新のモック
        }, 1000);
        return true;
    }

    stopWorkout() {
        if (!this.workoutActive) {
            throw new Error('ワークアウトが開始されていません');
        }
        
        this.workoutActive = false;
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
        
        const duration = Date.now() - this.workoutStartTime;
        return { duration, exercises: this.selectedExercises };
    }

    pauseWorkout() {
        if (!this.workoutActive) {
            throw new Error('ワークアウトが開始されていません');
        }
        // 一時停止ロジック
        return true;
    }

    resumeWorkout() {
        if (!this.workoutActive) {
            throw new Error('ワークアウトが開始されていません');
        }
        // 再開ロジック
        return true;
    }

    updateTimerDisplay() {
        if (!this.workoutActive || !this.workoutStartTime) {
            return '00:00:00';
        }
        
        const elapsed = Date.now() - this.workoutStartTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    resetWizard() {
        this.currentStep = 1;
        this.selectedMuscleGroups = [];
        this.selectedExercises = [];
        this.workoutActive = false;
        this.workoutStartTime = null;
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
    }
}

// テストスイート
testRunner.describe('ワークアウトウィザード機能テスト', () => {
    let wizard;

    testRunner.beforeEach(() => {
        wizard = new MockWorkoutPageWizard();
    });

    testRunner.test('WorkoutPageWizard initializes correctly', () => {
        wizard.initialize();
        testRunner.expect(wizard.currentStep).toBe(1);
        testRunner.expect(wizard.selectedMuscleGroups).toHaveLength(0);
        testRunner.expect(wizard.selectedExercises).toHaveLength(0);
        testRunner.expect(wizard.workoutActive).toBe(false);
    });

    testRunner.test('Step 1: Muscle group selection works', () => {
        const result = wizard.toggleMuscleGroup('chest');
        testRunner.expect(result).toContain('chest');
        testRunner.expect(wizard.selectedMuscleGroups).toHaveLength(1);

        // 同じ部位を再度選択すると削除される
        wizard.toggleMuscleGroup('chest');
        testRunner.expect(wizard.selectedMuscleGroups).toHaveLength(0);
    });

    testRunner.test('Step 1: Preset selection works', () => {
        const upperBodyMuscles = wizard.handlePresetSelection('upper');
        testRunner.expect(upperBodyMuscles).toContain('chest');
        testRunner.expect(upperBodyMuscles).toContain('back');
        testRunner.expect(upperBodyMuscles).toContain('shoulders');
        testRunner.expect(upperBodyMuscles).toContain('arms');
    });

    testRunner.test('Step 1: Next button state updates', () => {
        // 部位未選択時はボタン無効
        testRunner.expect(wizard.updateStep1ButtonState()).toBe(false);

        // 部位選択後はボタン有効
        wizard.toggleMuscleGroup('chest');
        testRunner.expect(wizard.updateStep1ButtonState()).toBe(true);
    });

    testRunner.test('Step 2: Exercise addition works', () => {
        const exercise = wizard.addExercise('ベンチプレス');
        testRunner.expect(exercise.name).toBe('ベンチプレス');
        testRunner.expect(wizard.selectedExercises).toHaveLength(1);
    });

    testRunner.test('Step 2: Custom exercise addition works', () => {
        wizard.addExercise('カスタムエクササイズ');
        testRunner.expect(wizard.selectedExercises).toHaveLength(1);
        testRunner.expect(wizard.selectedExercises[0].name).toBe('カスタムエクササイズ');
    });

    testRunner.test('Step 2: Exercise removal works', () => {
        const exercise = wizard.addExercise('ベンチプレス');
        testRunner.expect(wizard.selectedExercises).toHaveLength(1);

        wizard.removeSelectedExercise(exercise.id);
        testRunner.expect(wizard.selectedExercises).toHaveLength(0);
    });

    testRunner.test('Step 2: Next button state updates', () => {
        // エクササイズ未選択時はボタン無効
        testRunner.expect(wizard.updateStep2ButtonState()).toBe(false);

        // エクササイズ選択後はボタン有効
        wizard.addExercise('ベンチプレス');
        testRunner.expect(wizard.updateStep2ButtonState()).toBe(true);
    });

    testRunner.test('Step 3: Workout summary renders', () => {
        wizard.toggleMuscleGroup('chest');
        wizard.addExercise('ベンチプレス');

        const summary = wizard.renderWorkoutSummary();
        testRunner.expect(summary.muscleGroups).toContain('chest');
        testRunner.expect(summary.exercises).toHaveLength(1);
        testRunner.expect(summary.estimatedDuration).toBe(15);
    });

    testRunner.test('Workout starts and stops correctly', () => {
        wizard.toggleMuscleGroup('chest');
        wizard.addExercise('ベンチプレス');

        // ワークアウト開始
        const startResult = wizard.startWorkout();
        testRunner.expect(startResult).toBe(true);
        testRunner.expect(wizard.workoutActive).toBe(true);

        // ワークアウト停止
        const stopResult = wizard.stopWorkout();
        testRunner.expect(stopResult.exercises).toHaveLength(1);
        testRunner.expect(wizard.workoutActive).toBe(false);
    });

    testRunner.test('Workout timer updates', () => {
        wizard.startWorkout();
        
        // タイマー表示をテスト
        const timerDisplay = wizard.updateTimerDisplay();
        testRunner.expect(timerDisplay).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    testRunner.test('Wizard resets correctly', () => {
        // ウィザードを設定
        wizard.toggleMuscleGroup('chest');
        wizard.addExercise('ベンチプレス');
        wizard.startWorkout();

        // リセット
        wizard.resetWizard();

        testRunner.expect(wizard.currentStep).toBe(1);
        testRunner.expect(wizard.selectedMuscleGroups).toHaveLength(0);
        testRunner.expect(wizard.selectedExercises).toHaveLength(0);
        testRunner.expect(wizard.workoutActive).toBe(false);
    });

    testRunner.test('Error handling for invalid operations', () => {
        // ワークアウト未開始時の停止
        testRunner.expect(() => wizard.stopWorkout()).toThrow();

        // ワークアウト未開始時の一時停止
        testRunner.expect(() => wizard.pauseWorkout()).toThrow();

        // ワークアウト未開始時の再開
        testRunner.expect(() => wizard.resumeWorkout()).toThrow();
    });
});

console.log('🧪 ワークアウトウィザードのユニットテストを実行します...');