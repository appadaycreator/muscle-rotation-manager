// workoutPage.js - ワークアウトページの機能

import { supabaseService } from '../services/supabaseService.js';
import { showNotification } from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';

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

        try {
            await this.setupWorkoutInterface();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing workout page:', error);
            showNotification('ワークアウトページの初期化に失敗しました', 'error');
        }
    }

    /**
     * ワークアウトインターフェースを設定
     */
    async setupWorkoutInterface() {
        const container = document.getElementById('workout-container');
        if (!container) {return;}

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
        // 筋肉部位選択
        document.querySelectorAll('.muscle-group-card').forEach(card => {
            card.addEventListener('click', () => {
                const muscleId = card.dataset.muscle;
                this.toggleMuscleGroup(muscleId, card);
            });
        });

        // ワークアウト開始
        const startBtn = document.getElementById('start-workout-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startWorkout());
        }

        // ワークアウト終了
        const stopBtn = document.getElementById('stop-workout-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopWorkout());
        }

        // エクササイズ追加
        const addExerciseBtn = document.getElementById('add-exercise-btn');
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
        const container = document.getElementById('selected-muscles');
        const listContainer = document.getElementById('selected-muscles-list');

        if (!container || !listContainer) {return;}

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
        const startBtn = document.getElementById('start-workout-btn');
        if (!startBtn) {return;}

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
        document.getElementById('current-workout-section').classList.remove('hidden');

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

        const timerElement = document.getElementById('workout-timer');
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

        try {
            // ワークアウトデータを保存
            await this.saveWorkoutData({
                ...this.currentWorkout,
                duration
            });

            showNotification('ワークアウトを完了しました', 'success');
        } catch (error) {
            console.error('Error saving workout:', error);
            showNotification('ワークアウトの保存に失敗しました', 'error');
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
        document.getElementById('current-workout-section').classList.add('hidden');
        document.querySelectorAll('.muscle-group-card').forEach(card => {
            card.classList.remove('border-blue-500', 'bg-blue-50');
        });

        this.updateSelectedMusclesDisplay();
        this.updateStartButtonState();
    }

    /**
     * エクササイズ追加モーダルを表示
     */
    showAddExerciseModal() {
        // 実装予定: エクササイズ追加のモーダル
        showNotification('エクササイズ追加機能は実装予定です', 'info');
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
