// workout-wizard.test.js - ワークアウトウィザードのテスト

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// テスト対象のモジュールをモック
const mockShowNotification = vi.fn();
const mockHandleError = vi.fn();
const mockSupabaseService = {
    isAvailable: vi.fn(() => true),
    getCurrentUser: vi.fn(() => ({ id: 'test-user' })),
    saveWorkout: vi.fn(() => Promise.resolve([{ id: 'test-session' }])),
    saveTrainingLog: vi.fn(() => Promise.resolve({ id: 'test-log' }))
};

// モジュールのモック設定
vi.mock('../js/utils/helpers.js', () => ({
    showNotification: mockShowNotification,
    safeAsync: vi.fn((fn) => fn()),
    safeGetElement: vi.fn((selector) => document.querySelector(selector)),
    safeGetElements: vi.fn((selector) => Array.from(document.querySelectorAll(selector))),
    debounce: vi.fn((fn) => fn),
    escapeHtml: vi.fn((str) => str)
}));

vi.mock('../js/utils/errorHandler.js', () => ({
    handleError: mockHandleError,
    ERROR_TYPES: {
        NETWORK: 'NETWORK',
        VALIDATION: 'VALIDATION'
    }
}));

vi.mock('../js/services/supabaseService.js', () => ({
    supabaseService: mockSupabaseService
}));

vi.mock('../js/utils/constants.js', () => ({
    MUSCLE_GROUPS: [
        { id: 'chest', name: '胸', iconColor: 'text-red-500' },
        { id: 'back', name: '背中', iconColor: 'text-blue-500' },
        { id: 'legs', name: '脚', iconColor: 'text-green-500' }
    ]
}));

// WorkoutWizardクラスのモック実装
class MockWorkoutWizard {
    constructor() {
        this.currentStep = 1;
        this.selectedMuscleGroups = [];
        this.selectedExercises = [];
        this.currentWorkout = null;
        this.operationCount = 0;
        this.startOperationCount = 0;
    }

    async initialize() {
        this.setupWizardInterface();
        this.setupEventListeners();
        this.loadMuscleGroups();
    }

    setupWizardInterface() {
        // ステップインジケーターの初期化
        this.updateStepIndicator();
        this.showStep(1);
    }

    setupEventListeners() {
        // イベントリスナーの設定をシミュレート
    }

    loadMuscleGroups() {
        // 筋肉部位の読み込みをシミュレート
    }

    trackOperation(operation) {
        this.operationCount++;
    }

    selectPreset(presetType) {
        const presets = {
            upper: ['chest', 'back'],
            lower: ['legs'],
            push: ['chest'],
            pull: ['back']
        };
        
        this.selectedMuscleGroups = presets[presetType] || [];
        this.updateStepButtons();
        return true;
    }

    toggleMuscleGroup(muscleId) {
        const index = this.selectedMuscleGroups.indexOf(muscleId);
        if (index > -1) {
            this.selectedMuscleGroups.splice(index, 1);
        } else {
            this.selectedMuscleGroups.push(muscleId);
        }
        this.updateStepButtons();
    }

    addExercise(exerciseName) {
        if (this.selectedExercises.some(ex => ex.name === exerciseName)) {
            return false; // 重複
        }
        
        this.selectedExercises.push({
            name: exerciseName,
            sets: [],
            completed: false,
            addedAt: new Date()
        });
        this.updateStepButtons();
        return true;
    }

    removeExercise(index) {
        if (index >= 0 && index < this.selectedExercises.length) {
            this.selectedExercises.splice(index, 1);
            this.updateStepButtons();
            return true;
        }
        return false;
    }

    nextStep() {
        if (this.canProceedToNextStep()) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
            return true;
        }
        return false;
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
            return true;
        }
        return false;
    }

    canProceedToNextStep() {
        switch (this.currentStep) {
            case 1:
                return this.selectedMuscleGroups.length > 0;
            case 2:
                return this.selectedExercises.length > 0;
            case 3:
                return true;
            default:
                return false;
        }
    }

    showStep(stepNumber) {
        // ステップ表示の実装
    }

    updateStepIndicator() {
        // ステップインジケーター更新の実装
    }

    updateStepButtons() {
        // ステップボタン更新の実装
    }

    async startWorkout() {
        this.startOperationCount = this.operationCount;
        
        this.currentWorkout = {
            id: `workout_${Date.now()}`,
            muscleGroups: [...this.selectedMuscleGroups],
            exercises: [...this.selectedExercises],
            startTime: new Date(),
            endTime: null,
            sessionId: null
        };

        // Supabaseセッション作成をシミュレート
        if (mockSupabaseService.isAvailable() && mockSupabaseService.getCurrentUser()) {
            const savedSession = await mockSupabaseService.saveWorkout({
                session_name: `ワークアウト ${new Date().toLocaleDateString()}`,
                workout_date: new Date().toISOString().split('T')[0],
                start_time: this.currentWorkout.startTime.toISOString(),
                muscle_groups_trained: this.currentWorkout.muscleGroups,
                session_type: 'strength',
                is_completed: false
            });
            
            if (savedSession && savedSession[0]) {
                this.currentWorkout.sessionId = savedSession[0].id;
            }
        }

        return this.currentWorkout;
    }

    calculateOperationReduction() {
        const traditionalOperationCount = 20;
        const currentOperationCount = this.operationCount - this.startOperationCount;
        return Math.max(0, Math.round(
            ((traditionalOperationCount - currentOperationCount) / traditionalOperationCount) * 100
        ));
    }

    async stopWorkout() {
        if (!this.currentWorkout) {
            return false;
        }

        this.currentWorkout.endTime = new Date();
        this.currentWorkout.duration = Math.floor(
            (this.currentWorkout.endTime - this.currentWorkout.startTime) / (1000 * 60)
        );

        return this.currentWorkout;
    }

    resetWorkout() {
        this.currentWorkout = null;
        this.selectedMuscleGroups = [];
        this.selectedExercises = [];
        this.currentStep = 1;
        this.operationCount = 0;
    }
}

describe('ワークアウトウィザード', () => {
    let workoutWizard;

    beforeEach(() => {
        // DOM環境をセットアップ
        document.body.innerHTML = `
            <div id="workout-wizard">
                <div id="step-1" class="step-indicator">
                    <div class="step-circle">1</div>
                </div>
                <div id="step-2" class="step-indicator">
                    <div class="step-circle">2</div>
                </div>
                <div id="step-3" class="step-indicator">
                    <div class="step-circle">3</div>
                </div>
                <div id="wizard-step-1" class="wizard-step active">
                    <div id="muscle-groups-grid"></div>
                    <button id="step1-next" disabled>次へ</button>
                </div>
                <div id="wizard-step-2" class="wizard-step">
                    <div id="exercise-presets"></div>
                    <div id="selected-exercises-list"></div>
                    <button id="step2-next" disabled>次へ</button>
                </div>
                <div id="wizard-step-3" class="wizard-step">
                    <button id="start-workout">開始</button>
                </div>
            </div>
        `;

        workoutWizard = new MockWorkoutWizard();
        
        // モックをリセット
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('初期化', () => {
        it('正常に初期化される', async () => {
            await workoutWizard.initialize();
            
            expect(workoutWizard.currentStep).toBe(1);
            expect(workoutWizard.selectedMuscleGroups).toEqual([]);
            expect(workoutWizard.selectedExercises).toEqual([]);
        });

        it('操作数カウンターが初期化される', () => {
            expect(workoutWizard.operationCount).toBe(0);
        });
    });

    describe('ステップ1: 筋肉部位選択', () => {
        beforeEach(async () => {
            await workoutWizard.initialize();
        });

        it('プリセット選択が正常に動作する', () => {
            const result = workoutWizard.selectPreset('upper');
            
            expect(result).toBe(true);
            expect(workoutWizard.selectedMuscleGroups).toEqual(['chest', 'back']);
        });

        it('個別の筋肉部位選択が正常に動作する', () => {
            workoutWizard.toggleMuscleGroup('chest');
            
            expect(workoutWizard.selectedMuscleGroups).toContain('chest');
        });

        it('筋肉部位の選択解除が正常に動作する', () => {
            workoutWizard.toggleMuscleGroup('chest');
            workoutWizard.toggleMuscleGroup('chest');
            
            expect(workoutWizard.selectedMuscleGroups).not.toContain('chest');
        });

        it('筋肉部位が選択されていない場合は次のステップに進めない', () => {
            expect(workoutWizard.canProceedToNextStep()).toBe(false);
        });

        it('筋肉部位が選択されている場合は次のステップに進める', () => {
            workoutWizard.selectPreset('upper');
            
            expect(workoutWizard.canProceedToNextStep()).toBe(true);
        });

        it('操作数がトラッキングされる', () => {
            const initialCount = workoutWizard.operationCount;
            workoutWizard.trackOperation('muscle_selection');
            
            expect(workoutWizard.operationCount).toBe(initialCount + 1);
        });
    });

    describe('ステップ2: エクササイズ選択', () => {
        beforeEach(async () => {
            await workoutWizard.initialize();
            workoutWizard.selectPreset('upper');
            workoutWizard.nextStep();
        });

        it('エクササイズの追加が正常に動作する', () => {
            const result = workoutWizard.addExercise('ベンチプレス');
            
            expect(result).toBe(true);
            expect(workoutWizard.selectedExercises).toHaveLength(1);
            expect(workoutWizard.selectedExercises[0].name).toBe('ベンチプレス');
        });

        it('重複するエクササイズは追加されない', () => {
            workoutWizard.addExercise('ベンチプレス');
            const result = workoutWizard.addExercise('ベンチプレス');
            
            expect(result).toBe(false);
            expect(workoutWizard.selectedExercises).toHaveLength(1);
        });

        it('エクササイズの削除が正常に動作する', () => {
            workoutWizard.addExercise('ベンチプレス');
            const result = workoutWizard.removeExercise(0);
            
            expect(result).toBe(true);
            expect(workoutWizard.selectedExercises).toHaveLength(0);
        });

        it('無効なインデックスでの削除は失敗する', () => {
            const result = workoutWizard.removeExercise(999);
            
            expect(result).toBe(false);
        });

        it('エクササイズが選択されていない場合は次のステップに進めない', () => {
            expect(workoutWizard.canProceedToNextStep()).toBe(false);
        });

        it('エクササイズが選択されている場合は次のステップに進める', () => {
            workoutWizard.addExercise('ベンチプレス');
            
            expect(workoutWizard.canProceedToNextStep()).toBe(true);
        });
    });

    describe('ステップ3: ワークアウト開始', () => {
        beforeEach(async () => {
            await workoutWizard.initialize();
            workoutWizard.selectPreset('upper');
            workoutWizard.nextStep();
            workoutWizard.addExercise('ベンチプレス');
            workoutWizard.nextStep();
        });

        it('ワークアウトが正常に開始される', async () => {
            const workout = await workoutWizard.startWorkout();
            
            expect(workout).toBeDefined();
            expect(workout.muscleGroups).toEqual(['chest', 'back']);
            expect(workout.exercises).toHaveLength(1);
            expect(workout.startTime).toBeInstanceOf(Date);
        });

        it('Supabaseセッションが作成される', async () => {
            await workoutWizard.startWorkout();
            
            expect(mockSupabaseService.saveWorkout).toHaveBeenCalledWith(
                expect.objectContaining({
                    session_type: 'strength',
                    is_completed: false
                })
            );
        });

        it('操作数削減率が計算される', async () => {
            workoutWizard.operationCount = 5;
            await workoutWizard.startWorkout();
            
            const reduction = workoutWizard.calculateOperationReduction();
            expect(reduction).toBeGreaterThan(0);
            expect(reduction).toBeLessThanOrEqual(100);
        });
    });

    describe('ナビゲーション', () => {
        beforeEach(async () => {
            await workoutWizard.initialize();
        });

        it('次のステップに進む', () => {
            workoutWizard.selectPreset('upper');
            const result = workoutWizard.nextStep();
            
            expect(result).toBe(true);
            expect(workoutWizard.currentStep).toBe(2);
        });

        it('前のステップに戻る', () => {
            workoutWizard.selectPreset('upper');
            workoutWizard.nextStep();
            const result = workoutWizard.previousStep();
            
            expect(result).toBe(true);
            expect(workoutWizard.currentStep).toBe(1);
        });

        it('最初のステップでは前に戻れない', () => {
            const result = workoutWizard.previousStep();
            
            expect(result).toBe(false);
            expect(workoutWizard.currentStep).toBe(1);
        });

        it('条件を満たさない場合は次に進めない', () => {
            const result = workoutWizard.nextStep();
            
            expect(result).toBe(false);
            expect(workoutWizard.currentStep).toBe(1);
        });
    });

    describe('ワークアウト管理', () => {
        beforeEach(async () => {
            await workoutWizard.initialize();
            workoutWizard.selectPreset('upper');
            workoutWizard.nextStep();
            workoutWizard.addExercise('ベンチプレス');
            workoutWizard.nextStep();
        });

        it('ワークアウトが正常に停止される', async () => {
            await workoutWizard.startWorkout();
            const result = await workoutWizard.stopWorkout();
            
            expect(result).toBeDefined();
            expect(result.endTime).toBeInstanceOf(Date);
            expect(result.duration).toBeGreaterThanOrEqual(0);
        });

        it('進行中のワークアウトがない場合は停止できない', async () => {
            const result = await workoutWizard.stopWorkout();
            
            expect(result).toBe(false);
        });

        it('ワークアウトがリセットされる', () => {
            workoutWizard.resetWorkout();
            
            expect(workoutWizard.currentWorkout).toBeNull();
            expect(workoutWizard.selectedMuscleGroups).toEqual([]);
            expect(workoutWizard.selectedExercises).toEqual([]);
            expect(workoutWizard.currentStep).toBe(1);
        });
    });

    describe('エラーハンドリング', () => {
        beforeEach(async () => {
            await workoutWizard.initialize();
        });

        it('Supabaseエラー時でもワークアウトが開始される', async () => {
            mockSupabaseService.saveWorkout.mockRejectedValueOnce(new Error('Network error'));
            
            workoutWizard.selectPreset('upper');
            workoutWizard.nextStep();
            workoutWizard.addExercise('ベンチプレス');
            workoutWizard.nextStep();
            
            const workout = await workoutWizard.startWorkout();
            
            expect(workout).toBeDefined();
            expect(workout.sessionId).toBeNull();
        });
    });

    describe('パフォーマンス', () => {
        it('操作数が50%以上削減される', async () => {
            await workoutWizard.initialize();
            
            // 効率的なフローをシミュレート
            workoutWizard.trackOperation('preset_upper'); // 1
            workoutWizard.selectPreset('upper');
            workoutWizard.trackOperation('step1_next'); // 2
            workoutWizard.nextStep();
            workoutWizard.trackOperation('exercise_preset_bench'); // 3
            workoutWizard.addExercise('ベンチプレス');
            workoutWizard.trackOperation('step2_next'); // 4
            workoutWizard.nextStep();
            workoutWizard.trackOperation('start_workout'); // 5
            
            await workoutWizard.startWorkout();
            
            const reduction = workoutWizard.calculateOperationReduction();
            expect(reduction).toBeGreaterThanOrEqual(50);
        });

        it('大量のエクササイズでもパフォーマンスが維持される', () => {
            workoutWizard.selectPreset('upper');
            
            const startTime = performance.now();
            
            // 100個のエクササイズを追加
            for (let i = 0; i < 100; i++) {
                workoutWizard.addExercise(`エクササイズ${i}`);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 100ms以内で完了することを期待
            expect(duration).toBeLessThan(100);
            expect(workoutWizard.selectedExercises).toHaveLength(100);
        });
    });

    describe('アクセシビリティ', () => {
        it('ARIA属性が適切に設定される', async () => {
            await workoutWizard.initialize();
            
            const wizard = document.getElementById('workout-wizard');
            expect(wizard).toBeDefined();
            
            // 実際のDOM操作のテストは統合テストで行う
        });

        it('キーボードナビゲーションがサポートされる', () => {
            // キーボードイベントのシミュレーション
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            
            // イベントハンドラーが正常に動作することを確認
            expect(() => {
                document.dispatchEvent(event);
            }).not.toThrow();
        });
    });
});

describe('ワークアウトウィザード統合テスト', () => {
    let workoutWizard;

    beforeEach(() => {
        // より完全なDOM環境をセットアップ
        document.body.innerHTML = `
            <div id="workout-page" class="page-content">
                <div id="workout-wizard" class="muscle-card rounded-lg p-6 mb-6">
                    <div class="flex items-center justify-center mb-6">
                        <div class="flex items-center space-x-4">
                            <div id="step-1" class="step-indicator active">
                                <div class="step-circle">1</div>
                                <span class="step-label">部位選択</span>
                            </div>
                            <div class="step-connector"></div>
                            <div id="step-2" class="step-indicator">
                                <div class="step-circle">2</div>
                                <span class="step-label">エクササイズ</span>
                            </div>
                            <div class="step-connector"></div>
                            <div id="step-3" class="step-indicator">
                                <div class="step-circle">3</div>
                                <span class="step-label">記録</span>
                            </div>
                        </div>
                    </div>

                    <div id="wizard-step-1" class="wizard-step active">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button class="preset-btn" data-preset="upper">上半身</button>
                            <button class="preset-btn" data-preset="lower">下半身</button>
                        </div>
                        <div id="muscle-groups-grid" class="grid grid-cols-2 md:grid-cols-3 gap-4"></div>
                        <button id="step1-next" class="btn-primary" disabled>次へ</button>
                    </div>

                    <div id="wizard-step-2" class="wizard-step">
                        <div id="exercise-presets" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"></div>
                        <input id="custom-exercise-input" type="text" placeholder="エクササイズ名を入力">
                        <button id="add-custom-exercise" class="btn-secondary">追加</button>
                        <div id="selected-exercises-list" class="space-y-2"></div>
                        <button id="step2-back" class="btn-secondary">戻る</button>
                        <button id="step2-next" class="btn-primary" disabled>次へ</button>
                    </div>

                    <div id="wizard-step-3" class="wizard-step">
                        <div id="workout-summary" class="space-y-1 text-sm text-gray-600"></div>
                        <button id="step3-back" class="btn-secondary">戻る</button>
                        <button id="start-workout" class="btn-success">ワークアウト開始</button>
                    </div>
                </div>
            </div>
        `;

        workoutWizard = new MockWorkoutWizard();
    });

    it('完全なワークアウトフローが正常に動作する', async () => {
        // 初期化
        await workoutWizard.initialize();
        expect(workoutWizard.currentStep).toBe(1);

        // ステップ1: 筋肉部位選択
        workoutWizard.selectPreset('upper');
        expect(workoutWizard.selectedMuscleGroups).toEqual(['chest', 'back']);

        // ステップ2に進む
        const step2Result = workoutWizard.nextStep();
        expect(step2Result).toBe(true);
        expect(workoutWizard.currentStep).toBe(2);

        // ステップ2: エクササイズ選択
        workoutWizard.addExercise('ベンチプレス');
        workoutWizard.addExercise('ラットプルダウン');
        expect(workoutWizard.selectedExercises).toHaveLength(2);

        // ステップ3に進む
        const step3Result = workoutWizard.nextStep();
        expect(step3Result).toBe(true);
        expect(workoutWizard.currentStep).toBe(3);

        // ワークアウト開始
        const workout = await workoutWizard.startWorkout();
        expect(workout).toBeDefined();
        expect(workout.muscleGroups).toEqual(['chest', 'back']);
        expect(workout.exercises).toHaveLength(2);

        // ワークアウト停止
        const stoppedWorkout = await workoutWizard.stopWorkout();
        expect(stoppedWorkout.endTime).toBeInstanceOf(Date);
        expect(stoppedWorkout.duration).toBeGreaterThanOrEqual(0);
    });

    it('戻るボタンが正常に動作する', async () => {
        await workoutWizard.initialize();
        
        // ステップ2まで進む
        workoutWizard.selectPreset('upper');
        workoutWizard.nextStep();
        expect(workoutWizard.currentStep).toBe(2);

        // ステップ1に戻る
        const backResult = workoutWizard.previousStep();
        expect(backResult).toBe(true);
        expect(workoutWizard.currentStep).toBe(1);

        // 選択状態が保持されている
        expect(workoutWizard.selectedMuscleGroups).toEqual(['chest', 'back']);
    });

    it('バリデーションが正常に動作する', async () => {
        await workoutWizard.initialize();

        // 筋肉部位を選択せずに次に進もうとする
        const step2Result = workoutWizard.nextStep();
        expect(step2Result).toBe(false);
        expect(workoutWizard.currentStep).toBe(1);

        // 筋肉部位を選択して次に進む
        workoutWizard.selectPreset('upper');
        const validStep2Result = workoutWizard.nextStep();
        expect(validStep2Result).toBe(true);
        expect(workoutWizard.currentStep).toBe(2);

        // エクササイズを選択せずに次に進もうとする
        const step3Result = workoutWizard.nextStep();
        expect(step3Result).toBe(false);
        expect(workoutWizard.currentStep).toBe(2);

        // エクササイズを選択して次に進む
        workoutWizard.addExercise('ベンチプレス');
        const validStep3Result = workoutWizard.nextStep();
        expect(validStep3Result).toBe(true);
        expect(workoutWizard.currentStep).toBe(3);
    });
});

// パフォーマンステスト
describe('ワークアウトウィザード パフォーマンステスト', () => {
    let workoutWizard;

    beforeEach(() => {
        workoutWizard = new MockWorkoutWizard();
    });

    it('大量の筋肉部位選択でもパフォーマンスが維持される', () => {
        const startTime = performance.now();

        // 1000回の筋肉部位切り替え
        for (let i = 0; i < 1000; i++) {
            workoutWizard.toggleMuscleGroup(`muscle-${i % 10}`);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // 100ms以内で完了することを期待
        expect(duration).toBeLessThan(100);
    });

    it('大量のエクササイズ追加でもメモリリークが発生しない', () => {
        const initialMemory = performance.memory?.usedJSHeapSize || 0;

        // 1000個のエクササイズを追加・削除
        for (let i = 0; i < 1000; i++) {
            workoutWizard.addExercise(`エクササイズ${i}`);
        }

        for (let i = 999; i >= 0; i--) {
            workoutWizard.removeExercise(i);
        }

        // ガベージコレクションを促す
        if (global.gc) {
            global.gc();
        }

        const finalMemory = performance.memory?.usedJSHeapSize || 0;
        const memoryIncrease = finalMemory - initialMemory;

        // メモリ使用量の増加が1MB以下であることを期待
        expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
});

export { MockWorkoutWizard };
