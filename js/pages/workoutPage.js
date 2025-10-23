// workoutPage.js - ワークアウトページの機能

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

class WorkoutPage {
    constructor() {
        this.currentWorkout = null;
        this.selectedMuscleGroups = [];
        this.exercises = [];
        this.workoutTimer = null;
        this.startTime = null;
    }

    /**
     * ワークアウトページを初期化
     */
    async initialize() {
        console.log('Workout page initialized');

        await safeAsync(
            async () => {
                await this.setupWorkoutInterface();
                this.setupEventListeners();
            },
            'ワークアウトページの初期化'
        );
    }

    /**
     * ワークアウトインターフェースを設定
     */
    async setupWorkoutInterface() {
        const container = safeGetElement('#workout-container');
        if (!container) {
            console.warn('Workout container not found');
            return;
        }

        // 筋肉部位選択セクション
        const muscleGroupsHtml = MUSCLE_GROUPS.map(group => `
            <div class="muscle-group-card ${group.bgColor} hover:${group.hoverColor} 
                 rounded-lg p-4 cursor-pointer transition-colors border-2 border-transparent"
                 data-muscle="${group.id}">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-male ${group.iconColor} text-2xl"></i>
                    <div>
                        <h3 class="font-semibold ${group.textColor}">${group.name}</h3>
                        <p class="text-sm text-gray-600">クリックして選択</p>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6">
                <!-- ワークアウト開始セクション -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-dumbbell text-blue-500 mr-2"></i>
                        新しいワークアウト
                    </h2>
                    
                    <!-- 筋肉部位選択 -->
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-700 mb-3">
                            対象部位を選択
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${muscleGroupsHtml}
                        </div>
                    </div>

                    <!-- 選択された部位 -->
                    <div id="selected-muscles" class="mb-6 hidden">
                        <h3 class="text-lg font-semibold text-gray-700 mb-3">
                            選択された部位
                        </h3>
                        <div id="selected-muscles-list" class="flex flex-wrap gap-2">
                        </div>
                    </div>

                    <!-- ワークアウト開始ボタン -->
                    <button id="start-workout-btn" 
                            class="w-full bg-blue-500 hover:bg-blue-600 text-white 
                                   font-semibold py-3 px-6 rounded-lg transition-colors
                                   disabled:bg-gray-300 disabled:cursor-not-allowed"
                            disabled>
                        <i class="fas fa-play mr-2"></i>
                        ワークアウトを開始
                    </button>
                </div>

                <!-- 現在のワークアウトセクション -->
                <div id="current-workout-section" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-stopwatch text-green-500 mr-2"></i>
                            ワークアウト中
                        </h2>
                        <div class="flex items-center space-x-4">
                            <div class="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                                <span id="workout-timer">00:00</span>
                            </div>
                            <button id="stop-workout-btn" 
                                    class="bg-red-500 hover:bg-red-600 text-white 
                                           px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-stop mr-1"></i>
                                終了
                            </button>
                        </div>
                    </div>

                    <!-- エクササイズリスト -->
                    <div id="exercises-list" class="space-y-4">
                    </div>

                    <!-- エクササイズ追加ボタン -->
                    <button id="add-exercise-btn" 
                            class="w-full bg-green-500 hover:bg-green-600 text-white 
                                   font-semibold py-2 px-4 rounded-lg transition-colors mt-4">
                        <i class="fas fa-plus mr-2"></i>
                        エクササイズを追加
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 筋肉部位選択（デバウンス付き）
        const debouncedToggle = debounce((muscleId, card) => {
            this.toggleMuscleGroup(muscleId, card);
        }, 100);

        safeGetElements('.muscle-group-card').forEach(card => {
            card.addEventListener('click', () => {
                const muscleId = card.dataset.muscle;
                debouncedToggle(muscleId, card);
            });
        });

        // ワークアウト開始
        const startBtn = safeGetElement('#start-workout-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startWorkout());
        }

        // ワークアウト終了
        const stopBtn = safeGetElement('#stop-workout-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopWorkout());
        }

        // エクササイズ追加
        const addExerciseBtn = safeGetElement('#add-exercise-btn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => this.showAddExerciseModal());
        }
    }

    /**
     * 筋肉部位の選択を切り替え
     * @param {string} muscleId - 筋肉部位ID
     * @param {Element} cardElement - カード要素
     */
    toggleMuscleGroup(muscleId, cardElement) {
        const index = this.selectedMuscleGroups.indexOf(muscleId);

        if (index > -1) {
            // 選択解除
            this.selectedMuscleGroups.splice(index, 1);
            cardElement.classList.remove('border-blue-500', 'bg-blue-50');
        } else {
            // 選択
            this.selectedMuscleGroups.push(muscleId);
            cardElement.classList.add('border-blue-500', 'bg-blue-50');
        }

        this.updateSelectedMusclesDisplay();
        this.updateStartButtonState();
    }

    /**
     * 選択された筋肉部位の表示を更新
     */
    updateSelectedMusclesDisplay() {
        const container = safeGetElement('#selected-muscles');
        const listContainer = safeGetElement('#selected-muscles-list');

        if (!container || !listContainer) {
            console.warn('Selected muscles display containers not found');
            return;
        }

        if (this.selectedMuscleGroups.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        const muscleNames = this.selectedMuscleGroups.map(id => {
            const muscle = MUSCLE_GROUPS.find(group => group.id === id);
            return muscle ? muscle.name : id;
        });

        listContainer.innerHTML = muscleNames.map(name => `
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                ${name}
            </span>
        `).join('');
    }

    /**
     * 開始ボタンの状態を更新
     */
    updateStartButtonState() {
        const startBtn = safeGetElement('#start-workout-btn');
        if (!startBtn) {
            console.warn('Start workout button not found');
            return;
        }

        startBtn.disabled = this.selectedMuscleGroups.length === 0;
    }

    /**
     * ワークアウトを開始
     */
    startWorkout() {
        if (this.selectedMuscleGroups.length === 0) {
            showNotification('筋肉部位を選択してください', 'warning');
            return;
        }

        this.currentWorkout = {
            id: `workout_${Date.now()}`,
            muscleGroups: [...this.selectedMuscleGroups],
            exercises: [],
            startTime: new Date(),
            endTime: null
        };

        this.startTime = new Date();
        this.startWorkoutTimer();

        // UIを更新
        const workoutSection = safeGetElement('#current-workout-section');
        if (workoutSection) {
            workoutSection.classList.remove('hidden');
        }

        showNotification(
            `${this.selectedMuscleGroups.length}部位のワークアウトを開始しました`,
            'success'
        );

        console.log('Workout started:', this.currentWorkout);
    }

    /**
     * ワークアウトタイマーを開始
     */
    startWorkoutTimer() {
        this.workoutTimer = setInterval(() => {
            this.updateTimerDisplay();
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
     * ワークアウトを停止
     */
    async stopWorkout() {
        if (!this.currentWorkout) {return;}

        // タイマーを停止
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }

        this.currentWorkout.endTime = new Date();
        const duration = Math.floor(
            (this.currentWorkout.endTime - this.currentWorkout.startTime) / 1000
        );

        const success = await safeAsync(
            async () => {
                await this.saveWorkoutData({
                    ...this.currentWorkout,
                    duration
                });
                return true;
            },
            'ワークアウトの保存',
            false
        );

        if (success) {
            showNotification('ワークアウトを完了しました', 'success');
        }

        // リセット
        this.resetWorkout();
    }

    /**
     * ワークアウトデータを保存
     * @param {Object} workoutData - ワークアウトデータ
     */
    async saveWorkoutData(workoutData) {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            // ローカルストレージに保存
            const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            history.unshift(workoutData);
            localStorage.setItem('workoutHistory', JSON.stringify(history.slice(0, 50)));
            return;
        }

        // Supabaseに保存
        await supabaseService.saveWorkout(workoutData);
    }

    /**
     * ワークアウトをリセット
     */
    resetWorkout() {
        this.currentWorkout = null;
        this.selectedMuscleGroups = [];
        this.exercises = [];
        this.startTime = null;

        // UI をリセット
        const workoutSection = safeGetElement('#current-workout-section');
        if (workoutSection) {
            workoutSection.classList.add('hidden');
        }

        safeGetElements('.muscle-group-card').forEach(card => {
            card.classList.remove('border-blue-500', 'bg-blue-50');
        });

        this.updateSelectedMusclesDisplay();
        this.updateStartButtonState();
    }

    /**
     * エクササイズ追加モーダルを表示
     */
    showAddExerciseModal() {
        const modalHtml = `
            <div id="add-exercise-modal" 
                 class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-plus-circle text-green-500 mr-2"></i>
                        エクササイズを追加
                    </h3>
                    <form id="add-exercise-form" class="space-y-4">
                        <div>
                            <label for="exercise-name" 
                                   class="block text-gray-700 font-medium mb-1">
                                エクササイズ名
                            </label>
                            <input id="exercise-name" name="exerciseName" type="text" required 
                                   class="w-full border border-gray-300 rounded px-3 py-2 
                                          focus:border-blue-500 focus:outline-none"
                                   placeholder="例: ベンチプレス">
                            <div id="exercise-name-error" 
                                 class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="exercise-weight" 
                                       class="block text-gray-700 font-medium mb-1">
                                    重量 (kg)
                                </label>
                                <input id="exercise-weight" name="weight" type="number" 
                                       min="0" max="1000" step="0.5" required
                                       class="w-full border border-gray-300 rounded px-3 py-2 
                                              focus:border-blue-500 focus:outline-none"
                                       placeholder="80">
                                <div id="exercise-weight-error" 
                                     class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label for="exercise-reps" 
                                       class="block text-gray-700 font-medium mb-1">
                                    回数
                                </label>
                                <input id="exercise-reps" name="reps" type="number" 
                                       min="1" max="100" required
                                       class="w-full border border-gray-300 rounded px-3 py-2 
                                              focus:border-blue-500 focus:outline-none"
                                       placeholder="10">
                                <div id="exercise-reps-error" 
                                     class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label for="exercise-sets" 
                                       class="block text-gray-700 font-medium mb-1">
                                    セット数
                                </label>
                                <input id="exercise-sets" name="sets" type="number" 
                                       min="1" max="20" required
                                       class="w-full border border-gray-300 rounded px-3 py-2 
                                              focus:border-blue-500 focus:outline-none"
                                       placeholder="3">
                                <div id="exercise-sets-error" 
                                     class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                        </div>
                        <div>
                            <label for="exercise-notes" 
                                   class="block text-gray-700 font-medium mb-1">
                                メモ（任意）
                            </label>
                            <textarea id="exercise-notes" name="notes" rows="3" 
                                      maxlength="1000"
                                      class="w-full border border-gray-300 rounded px-3 py-2 
                                             focus:border-blue-500 focus:outline-none"
                                      placeholder="フォームや感想など..."></textarea>
                            <div id="exercise-notes-error" 
                                 class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>
                        <div id="exercise-form-error" class="text-red-600 text-sm hidden"></div>
                        <div class="flex space-x-3">
                            <button type="submit" 
                                    class="flex-1 bg-green-500 hover:bg-green-600 
                                           text-white py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-check mr-2"></i>追加
                            </button>
                            <button type="button" id="cancel-exercise" 
                                    class="flex-1 bg-gray-500 hover:bg-gray-600 
                                           text-white py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-times mr-2"></i>キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // モーダルを追加
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // イベントリスナーを設定
        this.setupExerciseModalListeners();
    }

    /**
     * エクササイズモーダルのイベントリスナーを設定
     */
    setupExerciseModalListeners() {
        const modal = safeGetElement('#add-exercise-modal');
        const form = safeGetElement('#add-exercise-form');
        const cancelBtn = safeGetElement('#cancel-exercise');

        if (!modal || !form) {
            console.warn('Exercise modal elements not found');
            return;
        }

        // バリデーション設定
        globalRealtimeValidator.setupWorkoutFormValidation(form);

        // フォーム送信
        form.addEventListener('submit', (e) => this.handleAddExercise(e));

        // キャンセルボタン
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideExerciseModal());
        }

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideExerciseModal();
            }
        });

        // Escapeキーで閉じる
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideExerciseModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * エクササイズ追加処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleAddExercise(e) {
        e.preventDefault();

        const formData = {
            exerciseName: safeGetElement('#exercise-name')?.value,
            weight: safeGetElement('#exercise-weight')?.value,
            reps: safeGetElement('#exercise-reps')?.value,
            sets: safeGetElement('#exercise-sets')?.value,
            notes: safeGetElement('#exercise-notes')?.value
        };

        // バリデーション実行
        const sanitizedData = globalFormValidator.validateWorkoutForm(formData);

        if (!globalFormValidator.isValid()) {
            const errors = globalFormValidator.getAllErrors();
            const firstError = Object.values(errors).flat()[0];
            const errorDiv = safeGetElement('#exercise-form-error');
            if (errorDiv) {
                errorDiv.textContent = firstError;
                errorDiv.classList.remove('hidden');
            }
            return;
        }

        // エクササイズを追加
        const exercise = {
            id: `exercise_${Date.now()}`,
            name: sanitizedData.exerciseName,
            weight: sanitizedData.weight,
            reps: sanitizedData.reps,
            sets: sanitizedData.sets,
            notes: sanitizedData.notes,
            timestamp: new Date()
        };

        this.exercises.push(exercise);
        if (this.currentWorkout) {
            this.currentWorkout.exercises.push(exercise);
        }

        // UIを更新
        this.updateExercisesList();
        this.hideExerciseModal();

        showNotification(`${exercise.name}を追加しました`, 'success');
    }

    /**
     * エクササイズリストの表示を更新
     */
    updateExercisesList() {
        const container = safeGetElement('#exercises-list');
        if (!container) {
            console.warn('Exercises list container not found');
            return;
        }

        if (this.exercises.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-dumbbell text-3xl mb-2"></i>
                    <p>まだエクササイズが追加されていません</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.exercises.map(exercise => `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-800">${escapeHtml(exercise.name)}</h4>
                    <button class="text-red-500 hover:text-red-700 transition-colors" 
                            onclick="workoutPage.removeExercise('${escapeHtml(exercise.id)}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                    <div>
                        <span class="font-medium">重量:</span> 
                        ${escapeHtml(exercise.weight.toString())}kg
                    </div>
                    <div>
                        <span class="font-medium">回数:</span> 
                        ${escapeHtml(exercise.reps.toString())}回
                    </div>
                    <div>
                        <span class="font-medium">セット:</span> 
                        ${escapeHtml(exercise.sets.toString())}セット
                    </div>
                </div>
                ${exercise.notes ? `
                    <div class="text-sm text-gray-600 bg-white p-2 rounded border">
                        <i class="fas fa-sticky-note mr-1"></i>
                        ${escapeHtml(exercise.notes)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * エクササイズを削除
     * @param {string} exerciseId - エクササイズID
     */
    removeExercise(exerciseId) {
        const index = this.exercises.findIndex(ex => ex.id === exerciseId);
        if (index > -1) {
            const exercise = this.exercises[index];
            this.exercises.splice(index, 1);

            if (this.currentWorkout) {
                const workoutIndex = this.currentWorkout.exercises
                    .findIndex(ex => ex.id === exerciseId);
                if (workoutIndex > -1) {
                    this.currentWorkout.exercises.splice(workoutIndex, 1);
                }
            }

            this.updateExercisesList();
            showNotification(`${exercise.name}を削除しました`, 'info');
        }
    }

    /**
     * エクササイズモーダルを非表示
     */
    hideExerciseModal() {
        const modal = safeGetElement('#add-exercise-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 現在のワークアウトを取得
     * @returns {Object|null} 現在のワークアウト
     */
    getCurrentWorkout() {
        return this.currentWorkout;
    }
}

// デフォルトエクスポート
export default new WorkoutPage();
