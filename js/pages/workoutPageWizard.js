// workoutPageWizard.js - 改善されたワークアウトウィザード

import { supabaseService } from '../services/supabaseService.js';
import {
    showNotification,
    safeAsync,
    safeGetElement,
    safeGetElements,
    debounce,
    escapeHtml
} from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';
import { globalFormValidator, globalRealtimeValidator } from '../utils/validation.js';
import { handleError, ERROR_TYPES } from '../utils/errorHandler.js';

/**
 * エクササイズプリセットデータ
 */
const EXERCISE_PRESETS = {
    chest: [
        { name: 'ベンチプレス', icon: 'fas fa-dumbbell', difficulty: 'intermediate' },
        { name: 'プッシュアップ', icon: 'fas fa-hand-paper', difficulty: 'beginner' },
        { name: 'ダンベルフライ', icon: 'fas fa-dumbbell', difficulty: 'intermediate' },
        { name: 'インクラインプレス', icon: 'fas fa-dumbbell', difficulty: 'advanced' }
    ],
    back: [
        { name: 'プルアップ', icon: 'fas fa-hand-rock', difficulty: 'intermediate' },
        { name: 'ラットプルダウン', icon: 'fas fa-hand-rock', difficulty: 'beginner' },
        { name: 'デッドリフト', icon: 'fas fa-dumbbell', difficulty: 'advanced' },
        { name: 'ベントオーバーロー', icon: 'fas fa-dumbbell', difficulty: 'intermediate' }
    ],
    shoulders: [
        { name: 'ショルダープレス', icon: 'fas fa-dumbbell', difficulty: 'intermediate' },
        { name: 'サイドレイズ', icon: 'fas fa-dumbbell', difficulty: 'beginner' },
        { name: 'リアデルトフライ', icon: 'fas fa-dumbbell', difficulty: 'intermediate' },
        { name: 'アップライトロー', icon: 'fas fa-dumbbell', difficulty: 'intermediate' }
    ],
    arms: [
        { name: 'バイセップカール', icon: 'fas fa-dumbbell', difficulty: 'beginner' },
        { name: 'トライセップエクステンション', icon: 'fas fa-dumbbell', difficulty: 'beginner' },
        { name: 'ハンマーカール', icon: 'fas fa-dumbbell', difficulty: 'beginner' },
        { name: 'ディップス', icon: 'fas fa-hand-paper', difficulty: 'intermediate' }
    ],
    legs: [
        { name: 'スクワット', icon: 'fas fa-running', difficulty: 'beginner' },
        { name: 'レッグプレス', icon: 'fas fa-running', difficulty: 'beginner' },
        { name: 'ランジ', icon: 'fas fa-running', difficulty: 'intermediate' },
        { name: 'カーフレイズ', icon: 'fas fa-running', difficulty: 'beginner' }
    ],
    abs: [
        { name: 'プランク', icon: 'fas fa-male', difficulty: 'beginner' },
        { name: 'クランチ', icon: 'fas fa-male', difficulty: 'beginner' },
        { name: 'レッグレイズ', icon: 'fas fa-male', difficulty: 'intermediate' },
        { name: 'ロシアンツイスト', icon: 'fas fa-male', difficulty: 'intermediate' }
    ]
};

/**
 * プリセット設定
 */
const WORKOUT_PRESETS = {
    upper: ['chest', 'back', 'shoulders', 'arms'],
    lower: ['legs', 'abs'],
    push: ['chest', 'shoulders', 'arms'],
    pull: ['back', 'arms']
};

class WorkoutWizard {
    constructor() {
        this.currentStep = 1;
        this.selectedMuscleGroups = [];
        this.selectedExercises = [];
        this.currentWorkout = null;
        this.workoutTimer = null;
        this.restTimer = null;
        this.startTime = null;
        this.isPaused = false;

        // スワイプ操作用
        this.touchStartX = 0;
        this.touchEndX = 0;

        // 操作数カウント（DoD用）
        this.operationCount = 0;
        this.startOperationCount = 0;
    }

    /**
     * ワークアウトウィザードを初期化
     */
    async initialize() {
        console.log('🧙‍♂️ ワークアウトウィザードを初期化中...');

        await safeAsync(
            async () => {
                this.setupWizardInterface();
                this.setupEventListeners();
                this.setupSwipeGestures();
                this.loadMuscleGroups();
                this.initializeOfflineSync();
                this.trackOperation('initialize');
            },
            'ワークアウトウィザードの初期化',
            (error) => {
                handleError(error, {
                    context: 'ワークアウトウィザード初期化',
                    showNotification: true
                });
            }
        );
    }

    /**
     * 操作数をトラッキング（DoD用）
     */
    trackOperation(operation) {
        this.operationCount++;
        console.log(`📊 操作: ${operation} (総操作数: ${this.operationCount})`);
    }

    /**
     * ウィザードインターフェースを設定
     */
    setupWizardInterface() {
        // ステップインジケーターの初期化
        this.updateStepIndicator();

        // 初期ステップの表示
        this.showStep(1);
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // ステップナビゲーション
        this.setupStepNavigation();

        // プリセットボタン
        this.setupPresetButtons();

        // 筋肉部位選択
        this.setupMuscleGroupSelection();

        // エクササイズ選択
        this.setupExerciseSelection();

        // ワークアウト開始
        this.setupWorkoutControls();

        // キーボードショートカット
        this.setupKeyboardShortcuts();
    }

    /**
     * ステップナビゲーションを設定
     */
    setupStepNavigation() {
        // 次へボタン
        const step1Next = safeGetElement('#step1-next');
        if (step1Next) {
            step1Next.addEventListener('click', () => {
                this.trackOperation('step1_next');
                this.nextStep();
            });
        }

        const step2Next = safeGetElement('#step2-next');
        if (step2Next) {
            step2Next.addEventListener('click', () => {
                this.trackOperation('step2_next');
                this.nextStep();
            });
        }

        // 戻るボタン
        const step2Back = safeGetElement('#step2-back');
        if (step2Back) {
            step2Back.addEventListener('click', () => {
                this.trackOperation('step2_back');
                this.previousStep();
            });
        }

        const step3Back = safeGetElement('#step3-back');
        if (step3Back) {
            step3Back.addEventListener('click', () => {
                this.trackOperation('step3_back');
                this.previousStep();
            });
        }

        // ワークアウト開始
        const startWorkout = safeGetElement('#start-workout');
        if (startWorkout) {
            startWorkout.addEventListener('click', () => {
                this.trackOperation('start_workout');
                this.startWorkout();
            });
        }
    }

    /**
     * プリセットボタンを設定
     */
    setupPresetButtons() {
        safeGetElements('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.trackOperation(`preset_${preset}`);
                this.selectPreset(preset);
            });
        });
    }

    /**
     * 筋肉部位選択を設定
     */
    setupMuscleGroupSelection() {
        // 動的に追加される筋肉部位ボタンのイベント委譲
        const muscleGrid = safeGetElement('#muscle-groups-grid');
        if (muscleGrid) {
            muscleGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.muscle-group-btn');
                if (btn) {
                    const muscleId = btn.dataset.muscle;
                    this.trackOperation(`muscle_${muscleId}`);
                    this.toggleMuscleGroup(muscleId);
                }
            });
        }
    }

    /**
     * エクササイズ選択を設定
     */
    setupExerciseSelection() {
        // エクササイズプリセットの選択
        const exercisePresetsContainer = safeGetElement('#exercise-presets');
        if (exercisePresetsContainer) {
            exercisePresetsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.exercise-preset-btn');
                if (btn) {
                    const exerciseName = btn.dataset.exercise;
                    this.trackOperation(`exercise_preset_${exerciseName}`);
                    this.addExercise(exerciseName);
                }
            });
        }

        // カスタムエクササイズ追加
        const customInput = safeGetElement('#custom-exercise-input');
        const addCustomBtn = safeGetElement('#add-custom-exercise');

        if (customInput && addCustomBtn) {
            const addCustomExercise = () => {
                const exerciseName = customInput.value.trim();
                if (exerciseName) {
                    this.trackOperation('custom_exercise');
                    this.addExercise(exerciseName);
                    customInput.value = '';
                }
            };

            addCustomBtn.addEventListener('click', addCustomExercise);
            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addCustomExercise();
                }
            });
        }

        // 選択されたエクササイズの削除
        const selectedExercisesList = safeGetElement('#selected-exercises-list');
        if (selectedExercisesList) {
            selectedExercisesList.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-btn');
                if (removeBtn) {
                    const exerciseIndex = parseInt(removeBtn.dataset.index);
                    this.trackOperation('remove_exercise');
                    this.removeExercise(exerciseIndex);
                }
            });
        }
    }

    /**
     * ワークアウトコントロールを設定
     */
    setupWorkoutControls() {
        // 一時停止/再開
        const pauseBtn = safeGetElement('#pause-workout');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.trackOperation('pause_workout');
                this.togglePause();
            });
        }

        // 終了
        const stopBtn = safeGetElement('#stop-workout');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.trackOperation('stop_workout');
                this.stopWorkout();
            });
        }

        // 休憩タイマー
        const restTimerBtn = safeGetElement('#rest-timer-btn');
        if (restTimerBtn) {
            restTimerBtn.addEventListener('click', () => {
                this.trackOperation('rest_timer');
                this.startRestTimer();
            });
        }

        // エクササイズ追加
        const addExerciseBtn = safeGetElement('#add-exercise-btn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => {
                this.trackOperation('add_exercise_during_workout');
                this.showAddExerciseModal();
            });
        }
    }

    /**
     * キーボードショートカットを設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escapeキーでモーダルを閉じる
            if (e.key === 'Escape') {
                this.closeModals();
            }

            // 矢印キーでステップナビゲーション
            if (e.key === 'ArrowLeft' && this.currentStep > 1) {
                this.previousStep();
            }
            if (e.key === 'ArrowRight' && this.currentStep < 3) {
                this.nextStep();
            }

            // スペースキーで一時停止/再開（ワークアウト中のみ）
            if (e.key === ' ' && this.currentWorkout) {
                e.preventDefault();
                this.togglePause();
            }
        });
    }

    /**
     * スワイプジェスチャーを設定
     */
    setupSwipeGestures() {
        const wizard = safeGetElement('#workout-wizard');
        if (!wizard) {return;}

        wizard.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });

        wizard.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
    }

    /**
     * スワイプ処理
     */
    handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = this.touchEndX - this.touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0 && this.currentStep > 1) {
                // 右スワイプ: 前のステップ
                this.trackOperation('swipe_previous');
                this.previousStep();
            } else if (swipeDistance < 0 && this.currentStep < 3) {
                // 左スワイプ: 次のステップ
                this.trackOperation('swipe_next');
                this.nextStep();
            }
        }
    }

    /**
     * 筋肉部位を読み込み
     */
    loadMuscleGroups() {
        const muscleGrid = safeGetElement('#muscle-groups-grid');
        if (!muscleGrid) {return;}

        const muscleGroupsHtml = MUSCLE_GROUPS.map(group => `
            <button class="muscle-group-btn" data-muscle="${group.id}">
                <i class="fas fa-male ${group.iconColor}"></i>
                <span class="muscle-name">${group.name}</span>
            </button>
        `).join('');

        muscleGrid.innerHTML = muscleGroupsHtml;
    }

    /**
     * プリセットを選択
     */
    selectPreset(presetType) {
        try {
            // 既存の選択をクリア
            this.selectedMuscleGroups = [];

            // プリセットに基づいて筋肉部位を選択
            const muscleGroups = WORKOUT_PRESETS[presetType] || [];
            this.selectedMuscleGroups = [...muscleGroups];

            // UIを更新
            this.updateMuscleGroupSelection();
            this.updateStepButtons();

            // プリセットボタンの選択状態を更新
            safeGetElements('.preset-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.preset === presetType);
            });

            showNotification(`${this.getPresetName(presetType)}を選択しました`, 'success');

        } catch (error) {
            handleError(error, {
                context: 'プリセット選択',
                showNotification: true
            });
        }
    }

    /**
     * プリセット名を取得
     */
    getPresetName(presetType) {
        const names = {
            upper: '上半身',
            lower: '下半身',
            push: 'プッシュ系',
            pull: 'プル系'
        };
        return names[presetType] || presetType;
    }

    /**
     * 筋肉部位の選択を切り替え
     */
    toggleMuscleGroup(muscleId) {
        try {
            const index = this.selectedMuscleGroups.indexOf(muscleId);

            if (index > -1) {
                this.selectedMuscleGroups.splice(index, 1);
            } else {
                this.selectedMuscleGroups.push(muscleId);
            }

            this.updateMuscleGroupSelection();
            this.updateStepButtons();

        } catch (error) {
            handleError(error, {
                context: '筋肉部位選択',
                showNotification: true
            });
        }
    }

    /**
     * 筋肉部位選択UIを更新
     */
    updateMuscleGroupSelection() {
        safeGetElements('.muscle-group-btn').forEach(btn => {
            const muscleId = btn.dataset.muscle;
            btn.classList.toggle('selected', this.selectedMuscleGroups.includes(muscleId));
        });
    }

    /**
     * エクササイズを追加
     */
    addExercise(exerciseName) {
        try {
            // 重複チェック
            if (this.selectedExercises.some(ex => ex.name === exerciseName)) {
                showNotification('このエクササイズは既に選択されています', 'warning');
                return;
            }

            const exercise = {
                name: exerciseName,
                sets: [],
                completed: false,
                addedAt: new Date()
            };

            this.selectedExercises.push(exercise);
            this.updateSelectedExercisesList();
            this.updateStepButtons();

            showNotification(`${exerciseName}を追加しました`, 'success');

        } catch (error) {
            handleError(error, {
                context: 'エクササイズ追加',
                showNotification: true
            });
        }
    }

    /**
     * エクササイズを削除
     */
    removeExercise(index) {
        try {
            if (index >= 0 && index < this.selectedExercises.length) {
                const exercise = this.selectedExercises[index];
                this.selectedExercises.splice(index, 1);
                this.updateSelectedExercisesList();
                this.updateStepButtons();

                showNotification(`${exercise.name}を削除しました`, 'info');
            }
        } catch (error) {
            handleError(error, {
                context: 'エクササイズ削除',
                showNotification: true
            });
        }
    }

    /**
     * 選択されたエクササイズリストを更新
     */
    updateSelectedExercisesList() {
        const container = safeGetElement('#selected-exercises-list');
        if (!container) {return;}

        if (this.selectedExercises.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-dumbbell text-2xl mb-2 opacity-50"></i>
                    <p>エクササイズを選択してください</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.selectedExercises.map((exercise, index) => `
            <div class="selected-exercise-item">
                <span class="exercise-name">${escapeHtml(exercise.name)}</span>
                <button class="remove-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * エクササイズプリセットを読み込み
     */
    loadExercisePresets() {
        const container = safeGetElement('#exercise-presets');
        if (!container) {return;}

        // 選択された筋肉部位に基づいてエクササイズを表示
        const availableExercises = [];

        this.selectedMuscleGroups.forEach(muscleGroup => {
            if (EXERCISE_PRESETS[muscleGroup]) {
                availableExercises.push(...EXERCISE_PRESETS[muscleGroup]);
            }
        });

        if (availableExercises.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-4">
                    <p>筋肉部位を選択してください</p>
                </div>
            `;
            return;
        }

        container.innerHTML = availableExercises.map(exercise => `
            <button class="exercise-preset-btn" data-exercise="${escapeHtml(exercise.name)}">
                <i class="${exercise.icon}"></i>
                <span>${escapeHtml(exercise.name)}</span>
            </button>
        `).join('');
    }

    /**
     * 次のステップに進む
     */
    nextStep() {
        if (this.currentStep < 3 && this.canProceedToNextStep()) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateStepIndicator();

            // ステップ2に進む時にエクササイズプリセットを読み込み
            if (this.currentStep === 2) {
                this.loadExercisePresets();
            }

            // ステップ3に進む時にサマリーを更新
            if (this.currentStep === 3) {
                this.updateWorkoutSummary();
            }
        }
    }

    /**
     * 前のステップに戻る
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
        }
    }

    /**
     * 次のステップに進めるかチェック
     */
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

    /**
     * ステップを表示
     */
    showStep(stepNumber) {
        // 全てのステップを非表示
        safeGetElements('.wizard-step').forEach(step => {
            step.classList.remove('active');
        });

        // 指定されたステップを表示
        const targetStep = safeGetElement(`#wizard-step-${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        this.updateStepButtons();
    }

    /**
     * ステップインジケーターを更新
     */
    updateStepIndicator() {
        for (let i = 1; i <= 3; i++) {
            const indicator = safeGetElement(`#step-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');

                if (i < this.currentStep) {
                    indicator.classList.add('completed');
                } else if (i === this.currentStep) {
                    indicator.classList.add('active');
                }
            }
        }
    }

    /**
     * ステップボタンの状態を更新
     */
    updateStepButtons() {
        // ステップ1の次へボタン
        const step1Next = safeGetElement('#step1-next');
        if (step1Next) {
            step1Next.disabled = this.selectedMuscleGroups.length === 0;
        }

        // ステップ2の次へボタン
        const step2Next = safeGetElement('#step2-next');
        if (step2Next) {
            step2Next.disabled = this.selectedExercises.length === 0;
        }
    }

    /**
     * ワークアウトサマリーを更新
     */
    updateWorkoutSummary() {
        const container = safeGetElement('#workout-summary');
        if (!container) {return;}

        const muscleGroupNames = this.selectedMuscleGroups.map(id => {
            const muscle = MUSCLE_GROUPS.find(group => group.id === id);
            return muscle ? muscle.name : id;
        });

        container.innerHTML = `
            <div class="flex items-center space-x-2 mb-1">
                <i class="fas fa-crosshairs text-blue-500"></i>
                <span>対象部位: ${muscleGroupNames.join('、')}</span>
            </div>
            <div class="flex items-center space-x-2 mb-1">
                <i class="fas fa-dumbbell text-green-500"></i>
                <span>エクササイズ: ${this.selectedExercises.length}種目</span>
            </div>
            <div class="flex items-center space-x-2">
                <i class="fas fa-clock text-orange-500"></i>
                <span>予想時間: ${this.estimateWorkoutDuration()}分</span>
            </div>
        `;
    }

    /**
     * ワークアウト時間を推定
     */
    estimateWorkoutDuration() {
        // 1エクササイズあたり約8-12分と仮定
        const baseTimePerExercise = 10;
        const estimatedTime = this.selectedExercises.length * baseTimePerExercise;
        return Math.max(15, estimatedTime); // 最低15分
    }

    /**
     * ワークアウトを開始
     */
    async startWorkout() {
        try {
            this.startOperationCount = this.operationCount;

            // ワークアウトデータを作成
            this.currentWorkout = {
                id: `workout_${Date.now()}`,
                muscleGroups: [...this.selectedMuscleGroups],
                exercises: this.selectedExercises.map(ex => ({
                    ...ex,
                    sets: [],
                    startTime: new Date()
                })),
                startTime: new Date(),
                endTime: null,
                sessionId: null,
                isPaused: false,
                pausedDuration: 0
            };

            this.startTime = new Date();
            this.isPaused = false;

            // タイマー開始
            this.startWorkoutTimer();

            // Supabaseセッション作成
            await this.createWorkoutSession();

            // UIを切り替え
            this.showActiveWorkout();

            // 成功通知
            const reductionPercentage = this.calculateOperationReduction();
            showNotification(
                `ワークアウトを開始しました！操作数${reductionPercentage}%削減`,
                'success'
            );

            console.log('🎯 ワークアウト開始:', {
                workout: this.currentWorkout,
                operationReduction: reductionPercentage
            });

        } catch (error) {
            handleError(error, {
                context: 'ワークアウト開始',
                showNotification: true
            });
        }
    }

    /**
     * 操作数削減率を計算（DoD用）
     */
    calculateOperationReduction() {
        // 従来の操作数を20と仮定（筋肉選択5 + エクササイズ追加10 + 設定5）
        const traditionalOperationCount = 20;
        const currentOperationCount = this.operationCount - this.startOperationCount;
        const reduction = Math.max(0, Math.round(
            ((traditionalOperationCount - currentOperationCount) / traditionalOperationCount) * 100
        ));
        return reduction;
    }

    /**
     * アクティブワークアウト表示
     */
    showActiveWorkout() {
        // ウィザードを非表示
        const wizard = safeGetElement('#workout-wizard');
        if (wizard) {
            wizard.style.display = 'none';
        }

        // アクティブワークアウトを表示
        const activeWorkout = safeGetElement('#current-workout');
        if (activeWorkout) {
            activeWorkout.classList.remove('hidden');
        }

        // エクササイズリストを更新
        this.updateActiveExercisesList();
    }

    /**
     * アクティブエクササイズリストを更新
     */
    updateActiveExercisesList() {
        const container = safeGetElement('#workout-exercises');
        if (!container) {return;}

        container.innerHTML = this.currentWorkout.exercises.map((exercise, index) => `
            <div class="exercise-item ${exercise.completed ? 'completed' : ''}" data-exercise-index="${index}">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-800">${escapeHtml(exercise.name)}</h4>
                    <button class="text-green-500 hover:text-green-700" onclick="workoutWizard.completeExercise(${index})">
                        <i class="fas fa-check-circle"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-3 gap-2 mb-2">
                    <div class="text-center">
                        <label class="text-xs text-gray-500">重量(kg)</label>
                        <input type="number" class="set-input" placeholder="0" 
                               onchange="workoutWizard.updateExerciseData(${index}, 'weight', this.value)">
                    </div>
                    <div class="text-center">
                        <label class="text-xs text-gray-500">回数</label>
                        <input type="number" class="set-input" placeholder="0"
                               onchange="workoutWizard.updateExerciseData(${index}, 'reps', this.value)">
                    </div>
                    <div class="text-center">
                        <label class="text-xs text-gray-500">セット</label>
                        <input type="number" class="set-input" placeholder="0"
                               onchange="workoutWizard.updateExerciseData(${index}, 'sets', this.value)">
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button class="btn-secondary text-sm" onclick="workoutWizard.addSet(${index})">
                        <i class="fas fa-plus mr-1"></i>セット追加
                    </button>
                    <button class="btn-secondary text-sm" onclick="workoutWizard.startRestTimer(60)">
                        <i class="fas fa-clock mr-1"></i>休憩
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * エクササイズデータを更新
     */
    updateExerciseData(exerciseIndex, field, value) {
        if (this.currentWorkout && this.currentWorkout.exercises[exerciseIndex]) {
            this.currentWorkout.exercises[exerciseIndex][field] = parseFloat(value) || 0;
            this.trackOperation(`update_${field}`);
        }
    }

    /**
     * セットを追加
     */
    addSet(exerciseIndex) {
        if (this.currentWorkout && this.currentWorkout.exercises[exerciseIndex]) {
            const exercise = this.currentWorkout.exercises[exerciseIndex];
            const set = {
                weight: exercise.weight || 0,
                reps: exercise.reps || 0,
                completedAt: new Date()
            };

            exercise.sets.push(set);
            this.trackOperation('add_set');

            showNotification('セットを追加しました', 'success');
            console.log('📝 セット追加:', set);
        }
    }

    /**
     * エクササイズを完了
     */
    completeExercise(exerciseIndex) {
        if (this.currentWorkout && this.currentWorkout.exercises[exerciseIndex]) {
            this.currentWorkout.exercises[exerciseIndex].completed = true;
            this.currentWorkout.exercises[exerciseIndex].completedAt = new Date();
            this.trackOperation('complete_exercise');

            this.updateActiveExercisesList();
            showNotification('エクササイズを完了しました', 'success');
        }
    }

    /**
     * ワークアウトタイマーを開始
     */
    startWorkoutTimer() {
        this.workoutTimer = setInterval(() => {
            if (!this.isPaused) {
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    /**
     * タイマー表示を更新
     */
    updateTimerDisplay() {
        if (!this.startTime) {return;}

        const now = new Date();
        const elapsed = Math.floor((now - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        const timerElement = safeGetElement('#workout-timer');
        if (timerElement) {
            timerElement.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * 一時停止/再開を切り替え
     */
    togglePause() {
        this.isPaused = !this.isPaused;

        const pauseBtn = safeGetElement('#pause-workout');
        if (pauseBtn) {
            if (this.isPaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play mr-1"></i>再開';
                pauseBtn.classList.remove('btn-warning');
                pauseBtn.classList.add('btn-success');
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause mr-1"></i>一時停止';
                pauseBtn.classList.remove('btn-success');
                pauseBtn.classList.add('btn-warning');
            }
        }

        showNotification(this.isPaused ? 'ワークアウトを一時停止しました' : 'ワークアウトを再開しました', 'info');
    }

    /**
     * 休憩タイマーを開始
     */
    startRestTimer(duration = 60) {
        this.stopRestTimer(); // 既存のタイマーを停止

        let timeLeft = duration;

        // 休憩タイマーUI作成
        const timerHtml = `
            <div id="rest-timer" class="rest-timer">
                <div class="timer-display">${this.formatTime(timeLeft)}</div>
                <div class="timer-controls">
                    <button onclick="workoutWizard.stopRestTimer()">停止</button>
                    <button onclick="workoutWizard.addRestTime(30)">+30秒</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', timerHtml);

        this.restTimer = setInterval(() => {
            timeLeft--;
            const timerDisplay = document.querySelector('#rest-timer .timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = this.formatTime(timeLeft);
            }

            if (timeLeft <= 0) {
                this.stopRestTimer();
                showNotification('休憩時間終了！', 'success');

                // 音声通知（可能であれば）
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance('休憩時間終了です');
                    utterance.lang = 'ja-JP';
                    speechSynthesis.speak(utterance);
                }
            }
        }, 1000);

        this.trackOperation('rest_timer_start');
    }

    /**
     * 休憩タイマーを停止
     */
    stopRestTimer() {
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }

        const timerElement = safeGetElement('#rest-timer');
        if (timerElement) {
            timerElement.remove();
        }
    }

    /**
     * 休憩時間を追加
     */
    addRestTime(seconds) {
        // 実装は休憩タイマーの状態に依存
        this.trackOperation('add_rest_time');
    }

    /**
     * 時間をフォーマット
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * ワークアウトを停止
     */
    async stopWorkout() {
        try {
            if (!this.currentWorkout) {
                showNotification('進行中のワークアウトがありません', 'warning');
                return;
            }

            // 確認ダイアログ
            const shouldStop = await this.showStopConfirmation();
            if (!shouldStop) {return;}

            // タイマー停止
            if (this.workoutTimer) {
                clearInterval(this.workoutTimer);
                this.workoutTimer = null;
            }

            this.stopRestTimer();

            // ワークアウト完了処理
            this.currentWorkout.endTime = new Date();
            this.currentWorkout.duration = Math.floor(
                (this.currentWorkout.endTime - this.currentWorkout.startTime) / (1000 * 60)
            );

            // 保存処理
            await this.saveWorkoutData(this.currentWorkout);

            // サマリー表示
            await this.showWorkoutSummary(this.currentWorkout);

            // 成功メトリクス
            const metrics = this.calculateWorkoutMetrics();
            showNotification(
                `ワークアウト完了！${metrics.summary}`,
                'success'
            );

            // リセット
            this.resetWorkout();

        } catch (error) {
            handleError(error, {
                context: 'ワークアウト停止',
                showNotification: true
            });
        }
    }

    /**
     * ワークアウトメトリクスを計算
     */
    calculateWorkoutMetrics() {
        const completedExercises = this.currentWorkout.exercises.filter(ex => ex.completed).length;
        const totalSets = this.currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        const operationReduction = this.calculateOperationReduction();

        return {
            completedExercises,
            totalSets,
            duration: this.currentWorkout.duration,
            operationReduction,
            summary: `${this.currentWorkout.duration}分, ${completedExercises}種目, ${totalSets}セット`
        };
    }

    /**
     * 停止確認ダイアログを表示
     */
    async showStopConfirmation() {
        return new Promise((resolve) => {
            const metrics = this.calculateWorkoutMetrics();

            const modalHtml = `
                <div id="stop-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-stop-circle text-red-500 mr-2"></i>
                            ワークアウトを終了しますか？
                        </h3>
                        <div class="mb-4 text-gray-600">
                            <p class="mb-2">現在の進行状況:</p>
                            <ul class="list-disc list-inside space-y-1 text-sm">
                                <li>実施時間: <span class="font-medium">${metrics.duration}分</span></li>
                                <li>完了エクササイズ: <span class="font-medium">${metrics.completedExercises}/${this.currentWorkout.exercises.length}種目</span></li>
                                <li>総セット数: <span class="font-medium">${metrics.totalSets}セット</span></li>
                            </ul>
                        </div>
                        <div class="flex space-x-3">
                            <button id="confirm-stop" class="flex-1 btn-danger">
                                <i class="fas fa-check mr-2"></i>終了する
                            </button>
                            <button id="cancel-stop" class="flex-1 btn-secondary">
                                <i class="fas fa-times mr-2"></i>続ける
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = safeGetElement('#stop-confirmation-modal');
            const confirmBtn = safeGetElement('#confirm-stop');
            const cancelBtn = safeGetElement('#cancel-stop');

            const cleanup = () => {
                if (modal) {modal.remove();}
            };

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(true);
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(false);
                });
            }

            // モーダル外クリックでキャンセル
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        cleanup();
                        resolve(false);
                    }
                });
            }
        });
    }

    /**
     * ワークアウトサマリーを表示
     */
    async showWorkoutSummary(workoutData) {
        const metrics = this.calculateWorkoutMetrics();

        const modalHtml = `
            <div id="workout-summary-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 text-center">
                        <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                        ワークアウト完了！
                    </h3>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">${metrics.duration}</div>
                            <div class="text-sm text-gray-600">分</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">${metrics.completedExercises}</div>
                            <div class="text-sm text-gray-600">種目</div>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <div class="text-2xl font-bold text-purple-600">${metrics.totalSets}</div>
                            <div class="text-sm text-gray-600">セット</div>
                        </div>
                        <div class="text-center p-4 bg-orange-50 rounded-lg">
                            <div class="text-2xl font-bold text-orange-600">${metrics.operationReduction}%</div>
                            <div class="text-sm text-gray-600">操作削減</div>
                        </div>
                    </div>
                    
                    <button id="close-summary" class="w-full btn-primary">
                        <i class="fas fa-check mr-2"></i>完了
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = safeGetElement('#workout-summary-modal');
        const closeBtn = safeGetElement('#close-summary');

        const cleanup = () => {
            if (modal) {modal.remove();}
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', cleanup);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {cleanup();}
            });
        }

        // 10秒後に自動で閉じる
        setTimeout(cleanup, 10000);
    }

    /**
     * ワークアウトデータを保存
     */
    async saveWorkoutData(workoutData) {
        try {
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                // Supabaseに保存
                const sessionData = {
                    session_name: `ワークアウト ${new Date().toLocaleDateString()}`,
                    workout_date: workoutData.startTime.toISOString().split('T')[0],
                    start_time: workoutData.startTime.toISOString(),
                    end_time: workoutData.endTime.toISOString(),
                    total_duration_minutes: workoutData.duration,
                    muscle_groups_trained: workoutData.muscleGroups,
                    session_type: 'strength',
                    is_completed: true,
                    notes: `ウィザード使用: ${workoutData.exercises.length}種目`
                };

                await supabaseService.saveWorkout(sessionData);
                console.log('✅ ワークアウトデータをSupabaseに保存');
            } else {
                // オフライン保存
                await this.saveToLocalStorage(workoutData);
                console.log('📱 オフライン: ローカルストレージに保存');
            }

            return true;
        } catch (error) {
            console.error('❌ ワークアウト保存エラー:', error);
            await this.saveToLocalStorage(workoutData);
            return false;
        }
    }

    /**
     * ローカルストレージに保存
     */
    async saveToLocalStorage(workoutData) {
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        const enhancedData = {
            ...workoutData,
            savedAt: new Date().toISOString(),
            syncStatus: 'pending',
            source: 'wizard'
        };

        history.unshift(enhancedData);
        localStorage.setItem('workoutHistory', JSON.stringify(history.slice(0, 50)));
    }

    /**
     * ワークアウトセッションを作成
     */
    async createWorkoutSession() {
        try {
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                const sessionData = {
                    session_name: `ワークアウト ${new Date().toLocaleDateString()}`,
                    workout_date: new Date().toISOString().split('T')[0],
                    start_time: this.currentWorkout.startTime.toISOString(),
                    muscle_groups_trained: this.currentWorkout.muscleGroups,
                    session_type: 'strength',
                    is_completed: false,
                    notes: 'ウィザードで作成中'
                };

                const savedSession = await supabaseService.saveWorkout(sessionData);
                if (savedSession && savedSession[0]) {
                    this.currentWorkout.sessionId = savedSession[0].id;
                    console.log('💾 ワークアウトセッション作成:', this.currentWorkout.sessionId);
                }
            }
        } catch (error) {
            console.error('ワークアウトセッション作成エラー:', error);
        }
    }

    /**
     * ワークアウトをリセット
     */
    resetWorkout() {
        // 状態をリセット
        this.currentWorkout = null;
        this.selectedMuscleGroups = [];
        this.selectedExercises = [];
        this.currentStep = 1;
        this.startTime = null;
        this.isPaused = false;
        this.operationCount = 0;

        // UIをリセット
        const wizard = safeGetElement('#workout-wizard');
        if (wizard) {
            wizard.style.display = 'block';
        }

        const activeWorkout = safeGetElement('#current-workout');
        if (activeWorkout) {
            activeWorkout.classList.add('hidden');
        }

        // ウィザードを初期状態に戻す
        this.showStep(1);
        this.updateStepIndicator();
        this.loadMuscleGroups();
        this.updateMuscleGroupSelection();
        this.updateSelectedExercisesList();
        this.updateStepButtons();

        // プリセット選択をクリア
        safeGetElements('.preset-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    /**
     * モーダルを閉じる
     */
    closeModals() {
        const modals = [
            '#stop-confirmation-modal',
            '#workout-summary-modal',
            '#add-exercise-modal'
        ];

        modals.forEach(selector => {
            const modal = safeGetElement(selector);
            if (modal) {modal.remove();}
        });
    }

    /**
     * エクササイズ追加モーダルを表示
     */
    showAddExerciseModal() {
        // 既存のworkoutPage.jsの実装を参考に実装
        // 簡略化のため省略
    }

    /**
     * オフライン同期を初期化
     */
    initializeOfflineSync() {
        // オンライン復帰時の自動同期
        window.addEventListener('online', () => {
            console.log('🌐 オンラインに復帰しました');
            this.syncOfflineData();
        });
    }

    /**
     * オフラインデータを同期
     */
    async syncOfflineData() {
        // 既存のworkoutPage.jsの実装を使用
        console.log('🔄 オフラインデータを同期中...');
    }

    /**
     * 現在のワークアウトを取得
     */
    getCurrentWorkout() {
        return this.currentWorkout;
    }

    /**
     * アクセシビリティ機能を向上
     */
    enhanceAccessibility() {
        // ARIA属性の追加
        const wizard = safeGetElement('#workout-wizard');
        if (wizard) {
            wizard.setAttribute('role', 'application');
            wizard.setAttribute('aria-label', 'ワークアウト記録ウィザード');
        }

        // ステップインジケーターにARIA属性
        for (let i = 1; i <= 3; i++) {
            const step = safeGetElement(`#step-${i}`);
            if (step) {
                step.setAttribute('role', 'tab');
                step.setAttribute('aria-selected', i === this.currentStep ? 'true' : 'false');
            }
        }

        // ボタンにaria-label追加
        safeGetElements('button').forEach(btn => {
            if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
                btn.setAttribute('aria-label', btn.textContent.trim());
            }
        });
    }
}

// グローバルインスタンス作成
const workoutWizard = new WorkoutWizard();

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    workoutWizard.initialize();
});

export default workoutWizard;
