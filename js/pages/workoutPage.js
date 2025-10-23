// js/pages/WorkoutPage.js - ワークアウトページ

import { BasePage } from '../core/BasePage.js';
import { Navigation } from '../components/Navigation.js';
import { supabaseService } from '../services/supabaseService.js';
import { authManager } from '../modules/authManager.js';
import { showNotification } from '../utils/helpers.js';

/**
 * ワークアウトページクラス
 */
export class WorkoutPage extends BasePage {
    constructor() {
        super();
        this.navigation = new Navigation();
        this.currentWorkout = null;
        this.workoutTimer = null;
        this.workoutStartTime = null;
        this.exercises = [];
        this.muscleGroups = ['胸', '背中', '肩', '腕', '脚', '腹筋'];
    }

    /**
   * 認証状態をチェック（オーバーライド）
   */
    async checkAuthentication() {
        const isAuthenticated = await authManager.isAuthenticated();

        if (!isAuthenticated) {
            // ログインプロンプトを表示
            this.showLoginPrompt();
            return false;
        }

        return true;
    }

    /**
     * ページ固有の初期化処理
     */
    async onInitialize() {
        // 認証状態をチェック
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            return; // 認証されていない場合は処理を停止
        }
        
        // ナビゲーションを初期化
        await this.navigation.initialize();

        // ワークアウトコンテンツを生成
        await this.generateWorkoutContent();

        // エクササイズデータを読み込み
        await this.loadExerciseData();

        // イベントリスナーを設定
        this.setupEventListeners();
    }

    /**
   * ログインプロンプトを表示
   */
    showLoginPrompt() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50">
                <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                    <div class="mb-6">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">ログインが必要です</h2>
                        <p class="text-gray-600 mb-6">ワークアウト機能を使用するにはログインしてください。</p>
                    </div>
                    <div class="space-y-3">
                        <button id="login-btn" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                            ログイン
                        </button>
                        <button onclick="window.location.href='/index.html'" class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        `;

        // ログインボタンのイベントリスナーを設定
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                authManager.showAuthModal('login');
            });
        }
    }

    /**
     * ワークアウトコンテンツを生成
     */
    async generateWorkoutContent() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {return;}

        try {
            // partials/workout.htmlの内容を読み込み
            const response = await fetch('partials/workout.html');
            const htmlContent = await response.text();
            
            mainContent.innerHTML = htmlContent;
            
            // 筋肉部位ボタンを動的に生成
            this.generateMuscleGroupButtons();
            
        } catch (error) {
            console.error('Failed to load workout partial:', error);
            // フォールバック: 基本的なHTMLを生成
            this.generateFallbackContent();
        }
    }

    /**
     * 筋肉部位ボタンを動的に生成
     */
    generateMuscleGroupButtons() {
        const container = document.getElementById('muscle-groups-grid');
        if (!container) return;

        container.innerHTML = this.muscleGroups.map(muscle => `
            <button 
                class="muscle-group-btn p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                data-muscle="${muscle}"
            >
                <div class="text-center">
                    <div class="text-2xl mb-2">${this.getMuscleIcon(muscle)}</div>
                    <div class="font-medium text-gray-900">${muscle}</div>
                </div>
            </button>
        `).join('');
    }

    /**
     * フォールバックコンテンツを生成
     */
    generateFallbackContent() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">ワークアウト</h1>
                    <p class="text-gray-600">今日のトレーニングを記録しましょう</p>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">新しいワークアウト</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.muscleGroups.map(muscle => `
                            <button 
                                class="muscle-group-btn p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                data-muscle="${muscle}"
                            >
                                <div class="text-center">
                                    <div class="text-2xl mb-2">${this.getMuscleIcon(muscle)}</div>
                                    <div class="font-medium text-gray-900">${muscle}</div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
   * エクササイズデータを読み込み
   */
    async loadExerciseData() {
        try {
            if (supabaseService.isAvailable()) {
                this.exercises = await supabaseService.getExercises();
            } else {
                this.exercises = this.getDefaultExercises();
            }

            // ワークアウト履歴を読み込み
            await this.loadWorkoutHistory();

        } catch (error) {
            console.error('Failed to load exercise data:', error);
            showNotification('エクササイズデータの読み込みに失敗しました', 'error');
        }
    }

    /**
   * ワークアウト履歴を読み込み
   */
    async loadWorkoutHistory() {
        try {
            let workoutHistory = [];

            if (supabaseService.isAvailable()) {
                workoutHistory = await supabaseService.getWorkoutHistory();
            } else {
                workoutHistory = this.loadFromLocalStorage('workoutHistory');
            }

            this.updateWorkoutHistory(workoutHistory);

        } catch (error) {
            console.error('Failed to load workout history:', error);
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 筋肉部位ボタンのクリック
        document.querySelectorAll('.muscle-group-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const muscle = e.currentTarget.dataset.muscle;
                this.startWorkout(muscle);
            });
        });

        // ワークアウト終了ボタン
        this.addEventListener(document.getElementById('stop-workout-btn'), 'click', () => {
            this.stopWorkout();
        });

        // エクササイズ追加ボタン
        this.addEventListener(document.getElementById('add-exercise-btn'), 'click', () => {
            this.addExercise();
        });

        // ワークアウトウィザードの「次へ」ボタン
        this.addEventListener(document.getElementById('step1-next'), 'click', () => {
            this.nextStep(2);
        });

        this.addEventListener(document.getElementById('step2-next'), 'click', () => {
            this.nextStep(3);
        });

        // ワークアウトウィザードの「戻る」ボタン
        this.addEventListener(document.getElementById('step2-back'), 'click', () => {
            this.previousStep(1);
        });

        this.addEventListener(document.getElementById('step3-back'), 'click', () => {
            this.previousStep(2);
        });

        // ワークアウト開始ボタン
        this.addEventListener(document.getElementById('start-workout'), 'click', () => {
            this.startWorkoutFromWizard();
        });

        // プリセットボタン
        document.querySelectorAll('.preset-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.selectPreset(preset);
            });
        });

        // 筋肉部位選択ボタン
        document.querySelectorAll('.muscle-group-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                this.toggleMuscleGroup(e.currentTarget);
            });
        });

        // カスタムエクササイズ追加
        this.addEventListener(document.getElementById('add-custom-exercise'), 'click', () => {
            this.addCustomExercise();
        });
    }

    /**
   * ワークアウトを開始
   */
    startWorkout(muscleGroup) {
        console.log(`Starting workout for: ${muscleGroup}`);

        this.currentWorkout = {
            muscleGroup,
            startTime: new Date(),
            exercises: [],
            sessionName: `${muscleGroup}のワークアウト - ${new Date().toLocaleDateString('ja-JP')}`
        };

        // タイマーを開始
        this.startWorkoutTimer();

        // UIを更新
        this.updateWorkoutUI();

        showNotification(`${muscleGroup}のワークアウトを開始しました`, 'success');
    }

    /**
   * ワークアウトを停止
   */
    async stopWorkout() {
        if (!this.currentWorkout) {return;}

        console.log('Stopping workout');

        // タイマーを停止
        this.stopWorkoutTimer();

        // ワークアウトデータを保存
        try {
            await this.saveWorkout();
            showNotification('ワークアウトを保存しました', 'success');
        } catch (error) {
            console.error('Failed to save workout:', error);
            showNotification('ワークアウトの保存に失敗しました', 'error');
        }

        // UIをリセット
        this.resetWorkoutUI();
    }

    /**
   * ワークアウトタイマーを開始
   */
    startWorkoutTimer() {
        this.workoutStartTime = new Date();
        this.workoutTimer = setInterval(() => {
            this.updateWorkoutTimer();
        }, 1000);
    }

    /**
   * ワークアウトタイマーを停止
   */
    stopWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
    }

    /**
   * ワークアウトタイマーを更新
   */
    updateWorkoutTimer() {
        if (!this.workoutStartTime) {return;}

        const now = new Date();
        const diff = now - this.workoutStartTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        const timerDisplay = document.getElementById('workout-timer');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
   * エクササイズを追加
   */
    addExercise() {
        const name = document.getElementById('exercise-name').value.trim();
        const sets = parseInt(document.getElementById('exercise-sets').value);
        const weight = parseFloat(document.getElementById('exercise-weight').value);
        const reps = parseInt(document.getElementById('exercise-reps').value);

        if (!name || !sets || !weight || !reps) {
            showNotification('すべてのフィールドを入力してください', 'warning');
            return;
        }

        const exercise = {
            name,
            sets,
            weight,
            reps,
            timestamp: new Date().toISOString()
        };

        this.currentWorkout.exercises.push(exercise);
        this.updateExercisesList();
        this.clearExerciseForm();

        showNotification('エクササイズを追加しました', 'success');
    }

    /**
   * ワークアウトUIを更新
   */
    updateWorkoutUI() {
    // 現在のワークアウトセクションを表示
        document.getElementById('current-workout-section').classList.remove('hidden');
        document.getElementById('add-exercise-section').classList.remove('hidden');
        document.getElementById('exercises-list').classList.remove('hidden');

        // ワークアウト詳細を更新
        const workoutDetails = document.getElementById('workout-details');
        if (workoutDetails) {
            workoutDetails.innerHTML = `
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-bold text-blue-900">${this.currentWorkout.muscleGroup}のワークアウト</h3>
          <p class="text-blue-700">開始時刻: ${this.currentWorkout.startTime.toLocaleTimeString('ja-JP')}</p>
        </div>
      `;
        }
    }

    /**
   * エクササイズ一覧を更新
   */
    updateExercisesList() {
        const container = document.getElementById('exercises-container');
        if (!container) {return;}

        if (this.currentWorkout.exercises.length === 0) {
            container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-dumbbell text-4xl mb-4"></i>
          <p>まだエクササイズが追加されていません</p>
        </div>
      `;
            return;
        }

        container.innerHTML = this.currentWorkout.exercises.map((exercise, index) => `
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-dumbbell text-blue-600"></i>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${exercise.name}</div>
            <div class="text-sm text-gray-500">${exercise.sets}セット × ${exercise.reps}回</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-900">${exercise.weight}kg</div>
          <button 
            class="text-red-600 hover:text-red-800 text-sm"
            onclick="this.removeExercise(${index})"
          >
            削除
          </button>
        </div>
      </div>
    `).join('');
    }

    /**
   * ワークアウト履歴を更新
   */
    updateWorkoutHistory(workoutHistory) {
        const container = document.getElementById('workout-history');
        if (!container) {return;}

        if (workoutHistory.length === 0) {
            container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-history text-4xl mb-4"></i>
          <p>まだワークアウトが記録されていません</p>
        </div>
      `;
            return;
        }

        const recentWorkouts = workoutHistory
            .sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date))
            .slice(0, 10);

        container.innerHTML = recentWorkouts.map(workout => `
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-dumbbell text-blue-600"></i>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${workout.session_name}</div>
            <div class="text-sm text-gray-500">${workout.muscle_groups_trained?.join(', ') || '部位不明'}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-900">${workout.total_duration_minutes}分</div>
          <div class="text-sm text-gray-500">${this.formatDate(workout.workout_date)}</div>
        </div>
      </div>
    `).join('');
    }

    /**
   * ワークアウトを保存
   */
    async saveWorkout() {
        if (!this.currentWorkout) {return;}

        const endTime = new Date();
        const duration = Math.floor((endTime - this.currentWorkout.startTime) / 60000);

        const workoutData = {
            session_name: this.currentWorkout.sessionName,
            workout_date: new Date().toISOString().split('T')[0],
            start_time: this.currentWorkout.startTime.toISOString(),
            end_time: endTime.toISOString(),
            total_duration_minutes: Math.max(1, duration),
            muscle_groups_trained: [this.currentWorkout.muscleGroup],
            session_type: 'strength',
            is_completed: true,
            exercises: this.currentWorkout.exercises,
            notes: '',
            created_at: new Date().toISOString()
        };

        if (supabaseService.isAvailable()) {
            await supabaseService.saveWorkout(workoutData);
        } else {
            await this.saveToLocalStorage('workoutHistory', workoutData);
        }
    }

    /**
   * ワークアウトUIをリセット
   */
    resetWorkoutUI() {
        this.currentWorkout = null;
        this.workoutStartTime = null;

        document.getElementById('current-workout-section').classList.add('hidden');
        document.getElementById('add-exercise-section').classList.add('hidden');
        document.getElementById('exercises-list').classList.add('hidden');

        this.clearExerciseForm();
    }

    /**
   * エクササイズフォームをクリア
   */
    clearExerciseForm() {
        document.getElementById('exercise-name').value = '';
        document.getElementById('exercise-sets').value = '3';
        document.getElementById('exercise-weight').value = '';
        document.getElementById('exercise-reps').value = '';
    }

    /**
   * 筋肉部位のアイコンを取得
   */
    getMuscleIcon(muscle) {
        const icons = {
            胸: '💪',
            背中: '🏋️',
            肩: '🤸',
            腕: '💪',
            脚: '🏃',
            腹筋: '🔥'
        };
        return icons[muscle] || '💪';
    }

    /**
   * デフォルトエクササイズを取得
   */
    getDefaultExercises() {
        return [
            { name: 'ベンチプレス', muscle_group: '胸' },
            { name: 'スクワット', muscle_group: '脚' },
            { name: 'デッドリフト', muscle_group: '背中' },
            { name: 'オーバーヘッドプレス', muscle_group: '肩' },
            { name: 'バーベルカール', muscle_group: '腕' },
            { name: 'プランク', muscle_group: '腹筋' }
        ];
    }

    /**
   * ローカルストレージに保存
   */
    async saveToLocalStorage(key, data) {
        try {
            const existingData = JSON.parse(localStorage.getItem(key) || '[]');
            existingData.unshift(data);
            localStorage.setItem(key, JSON.stringify(existingData));
        } catch (error) {
            console.error(`Failed to save to localStorage (${key}):`, error);
            throw error;
        }
    }

    /**
   * ローカルストレージから読み込み
   */
    loadFromLocalStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (error) {
            console.error(`Failed to load from localStorage (${key}):`, error);
            return [];
        }
    }

    /**
     * 日付をフォーマット
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP');
    }

    /**
     * ワークアウトウィザードの次のステップに進む
     */
    nextStep(stepNumber) {
        // ステップ2（エクササイズ選択）の場合は、エクササイズページに遷移
        if (stepNumber === 2) {
            // 選択された筋肉部位を保存
            const selectedMuscles = Array.from(document.querySelectorAll('.muscle-group-btn.selected'))
                .map(btn => btn.dataset.muscle);
            
            if (selectedMuscles.length === 0) {
                showNotification('筋肉部位を選択してください', 'warning');
                return;
            }

            // 選択された筋肉部位をセッションストレージに保存
            sessionStorage.setItem('selectedMuscleGroups', JSON.stringify(selectedMuscles));
            
            // エクササイズページに遷移
            window.location.href = '/exercises.html';
            return;
        }

        // 現在のステップを非表示
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.remove('active');
        });

        // ステップインジケーターを更新
        for (let i = 1; i <= 3; i++) {
            const stepIndicator = document.getElementById(`step-${i}`);
            if (i <= stepNumber) {
                stepIndicator.classList.add('active');
            } else {
                stepIndicator.classList.remove('active');
            }
        }

        // 次のステップを表示
        const nextStepElement = document.getElementById(`wizard-step-${stepNumber}`);
        if (nextStepElement) {
            nextStepElement.classList.add('active');
        }

        // ステップ固有の処理
        if (stepNumber === 3) {
            this.updateWorkoutSummary();
        }
    }

    /**
     * ワークアウトウィザードの前のステップに戻る
     */
    previousStep(stepNumber) {
        this.nextStep(stepNumber);
    }

    /**
     * プリセットを選択
     */
    selectPreset(preset) {
        const muscleGroups = {
            'upper': ['胸', '背中', '肩', '腕'],
            'lower': ['脚', '腹筋'],
            'push': ['胸', '肩', '腕'],
            'pull': ['背中', '腕']
        };

        const selectedMuscles = muscleGroups[preset] || [];
        
        // 筋肉部位ボタンの選択状態を更新
        document.querySelectorAll('.muscle-group-btn').forEach(btn => {
            const muscle = btn.dataset.muscle;
            if (selectedMuscles.includes(muscle)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        // 次へボタンを有効化
        this.updateStep1NextButton();
    }

    /**
     * 筋肉部位の選択状態を切り替え
     */
    toggleMuscleGroup(button) {
        button.classList.toggle('selected');
        this.updateStep1NextButton();
    }

    /**
     * ステップ1の次へボタンの状態を更新
     */
    updateStep1NextButton() {
        const selectedMuscles = document.querySelectorAll('.muscle-group-btn.selected');
        const nextButton = document.getElementById('step1-next');
        
        if (selectedMuscles.length > 0) {
            nextButton.disabled = false;
        } else {
            nextButton.disabled = true;
        }
    }

    /**
     * エクササイズプリセットを読み込み
     */
    loadExercisePresets() {
        // エクササイズページから選択されたエクササイズをチェック
        this.checkSelectedExercises();

        const selectedMuscles = Array.from(document.querySelectorAll('.muscle-group-btn.selected'))
            .map(btn => btn.dataset.muscle);

        const exercisePresets = this.getExercisePresetsForMuscles(selectedMuscles);
        const container = document.getElementById('exercise-presets');
        
        if (container) {
            container.innerHTML = exercisePresets.map(exercise => `
                <button class="exercise-preset-btn" data-exercise="${exercise.name}">
                    <i class="fas fa-dumbbell text-blue-500 mb-1"></i>
                    <span>${exercise.name}</span>
                </button>
            `).join('');

            // エクササイズプリセットボタンのイベントリスナーを設定
            document.querySelectorAll('.exercise-preset-btn').forEach(btn => {
                this.addEventListener(btn, 'click', (e) => {
                    this.addExerciseToSelection(e.currentTarget.dataset.exercise);
                });
            });
        }
    }

    /**
     * エクササイズページから選択されたエクササイズをチェック
     */
    checkSelectedExercises() {
        try {
            const selectedExercises = sessionStorage.getItem('selectedExercises');
            if (selectedExercises) {
                const exercises = JSON.parse(selectedExercises);
                
                // 選択されたエクササイズを自動的に追加
                exercises.forEach(exercise => {
                    this.addExerciseToSelection(exercise.name);
                });

                // 通知を表示
                if (exercises.length > 0) {
                    showNotification(`${exercises.length}個のエクササイズを追加しました`, 'success');
                }

                // セッションストレージから削除
                sessionStorage.removeItem('selectedExercises');
            }
        } catch (error) {
            console.error('Failed to check selected exercises:', error);
        }
    }

    /**
     * 選択された筋肉部位に対応するエクササイズプリセットを取得
     */
    getExercisePresetsForMuscles(muscles) {
        const allExercises = this.getDefaultExercises();
        return allExercises.filter(exercise => 
            muscles.includes(exercise.muscle_group)
        );
    }

    /**
     * エクササイズを選択リストに追加
     */
    addExerciseToSelection(exerciseName) {
        const container = document.getElementById('selected-exercises-list');
        if (!container) return;

        // 既に選択されているかチェック
        const existing = container.querySelector(`[data-exercise="${exerciseName}"]`);
        if (existing) return;

        const exerciseElement = document.createElement('div');
        exerciseElement.className = 'flex items-center justify-between p-3 bg-blue-50 rounded-lg';
        exerciseElement.dataset.exercise = exerciseName;
        exerciseElement.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-dumbbell text-blue-500 mr-2"></i>
                <span>${exerciseName}</span>
            </div>
            <button class="remove-exercise-btn text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        `;

        // 削除ボタンのイベントリスナー
        const removeBtn = exerciseElement.querySelector('.remove-exercise-btn');
        this.addEventListener(removeBtn, 'click', () => {
            exerciseElement.remove();
            this.updateStep2NextButton();
        });

        container.appendChild(exerciseElement);
        this.updateStep2NextButton();
    }

    /**
     * カスタムエクササイズを追加
     */
    addCustomExercise() {
        const input = document.getElementById('custom-exercise-input');
        const exerciseName = input.value.trim();
        
        if (exerciseName) {
            this.addExerciseToSelection(exerciseName);
            input.value = '';
        }
    }

    /**
     * ステップ2の次へボタンの状態を更新
     */
    updateStep2NextButton() {
        const selectedExercises = document.querySelectorAll('#selected-exercises-list [data-exercise]');
        const nextButton = document.getElementById('step2-next');
        
        if (selectedExercises.length > 0) {
            nextButton.disabled = false;
        } else {
            nextButton.disabled = true;
        }
    }

    /**
     * ワークアウトサマリーを更新
     */
    updateWorkoutSummary() {
        const selectedMuscles = Array.from(document.querySelectorAll('.muscle-group-btn.selected'))
            .map(btn => btn.dataset.muscle);
        
        const selectedExercises = Array.from(document.querySelectorAll('#selected-exercises-list [data-exercise]'))
            .map(el => el.dataset.exercise);

        const summaryContainer = document.getElementById('workout-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="space-y-2">
                    <div><strong>対象部位:</strong> ${selectedMuscles.join(', ')}</div>
                    <div><strong>エクササイズ:</strong> ${selectedExercises.join(', ')}</div>
                    <div><strong>予想時間:</strong> ${selectedExercises.length * 15}分</div>
                </div>
            `;
        }
    }

    /**
     * ウィザードからワークアウトを開始
     */
    startWorkoutFromWizard() {
        const selectedMuscles = Array.from(document.querySelectorAll('.muscle-group-btn.selected'))
            .map(btn => btn.dataset.muscle);
        
        const selectedExercises = Array.from(document.querySelectorAll('#selected-exercises-list [data-exercise]'))
            .map(el => el.dataset.exercise);

        if (selectedMuscles.length === 0 || selectedExercises.length === 0) {
            showNotification('筋肉部位とエクササイズを選択してください', 'warning');
            return;
        }

        // ワークアウトを開始
        this.currentWorkout = {
            muscleGroups: selectedMuscles,
            exercises: selectedExercises,
            startTime: new Date(),
            sessionName: `${selectedMuscles.join(', ')}のワークアウト - ${new Date().toLocaleDateString('ja-JP')}`
        };

        // ウィザードを非表示にして、現在のワークアウトセクションを表示
        document.getElementById('workout-wizard').classList.add('hidden');
        document.getElementById('current-workout').classList.remove('hidden');

        // タイマーを開始
        this.startWorkoutTimer();

        showNotification('ワークアウトを開始しました', 'success');
    }
}

// ページが読み込まれた時に初期化
document.addEventListener('DOMContentLoaded', async () => {
    const workoutPage = new WorkoutPage();
    await workoutPage.initialize();
});