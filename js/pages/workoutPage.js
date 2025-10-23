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

        // DOM要素が生成された後にイベントリスナーを設定
        setTimeout(() => {
            this.setupEventListeners();
            // 初期状態でステップ1の次へボタンを無効化
            this.updateStep1NextButton();
        }, 100);
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
        console.log('Setting up event listeners...');
        
        // ワークアウトウィザードの「次へ」ボタン
        const step1NextBtn = document.getElementById('step1-next');
        console.log('step1-next button:', step1NextBtn);
        if (step1NextBtn) {
            console.log('Adding event listener to step1-next button');
            // 直接addEventListenerを使用
            step1NextBtn.addEventListener('click', (e) => {
                console.log('Step1 next button clicked');
                e.preventDefault();
                this.nextStep(2);
            });
        } else {
            console.warn('step1-next button not found');
        }

        const step2NextBtn = document.getElementById('step2-next');
        console.log('step2-next button:', step2NextBtn);
        if (step2NextBtn) {
            console.log('Adding event listener to step2-next button');
            // 直接addEventListenerを使用
            step2NextBtn.addEventListener('click', (e) => {
                console.log('Step2 next button clicked');
                e.preventDefault();
                this.nextStep(3);
            });
        } else {
            console.warn('step2-next button not found');
        }

        // ワークアウトウィザードの「戻る」ボタン
        const step2BackBtn = document.getElementById('step2-back');
        if (step2BackBtn) {
            this.addEventListener(step2BackBtn, 'click', () => {
                this.previousStep(1);
            });
        }

        const step3BackBtn = document.getElementById('step3-back');
        if (step3BackBtn) {
            this.addEventListener(step3BackBtn, 'click', () => {
                this.previousStep(2);
            });
        }

        // ワークアウト開始ボタン
        const startWorkoutBtn = document.getElementById('start-workout');
        if (startWorkoutBtn) {
            this.addEventListener(startWorkoutBtn, 'click', () => {
                this.startWorkoutFromWizard();
            });
        }

        // プリセットボタン
        document.querySelectorAll('.preset-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.selectPreset(preset);
            });
        });

        // 筋肉部位選択ボタン
        document.querySelectorAll('.muscle-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Muscle group button clicked:', e.currentTarget.dataset.muscle);
                this.toggleMuscleGroup(e.currentTarget);
            });
        });

        // カスタムエクササイズ追加
        const addCustomExerciseBtn = document.getElementById('add-custom-exercise');
        if (addCustomExerciseBtn) {
            this.addEventListener(addCustomExerciseBtn, 'click', () => {
                this.addCustomExercise();
            });
        }

        // 筋肉部位ボタンのクリック（従来のワークアウト開始用）
        document.querySelectorAll('.muscle-group-btn').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const muscle = e.currentTarget.dataset.muscle;
                this.startWorkout(muscle);
            });
        });

        // ワークアウト終了ボタン
        const stopWorkoutBtn = document.getElementById('stop-workout-btn');
        if (stopWorkoutBtn) {
            this.addEventListener(stopWorkoutBtn, 'click', () => {
                this.stopWorkout();
            });
        }

        // エクササイズ追加ボタン
        const addExerciseBtn = document.getElementById('add-exercise-btn');
        if (addExerciseBtn) {
            this.addEventListener(addExerciseBtn, 'click', () => {
                this.addExercise();
            });
        }
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
            // 胸筋エクササイズ
            { name: 'ベンチプレス', muscle_group: '胸', difficulty: 3, equipment: 'バーベル' },
            { name: 'プッシュアップ', muscle_group: '胸', difficulty: 2, equipment: '自重' },
            { name: 'ダンベルフライ', muscle_group: '胸', difficulty: 2, equipment: 'ダンベル' },
            { name: 'インクラインプレス', muscle_group: '胸', difficulty: 3, equipment: 'バーベル' },
            { name: 'ディップス', muscle_group: '胸', difficulty: 3, equipment: '自重' },
            
            // 背筋エクササイズ
            { name: 'デッドリフト', muscle_group: '背中', difficulty: 4, equipment: 'バーベル' },
            { name: 'プルアップ', muscle_group: '背中', difficulty: 4, equipment: '自重' },
            { name: 'ベントオーバーロウ', muscle_group: '背中', difficulty: 3, equipment: 'バーベル' },
            { name: 'ラットプルダウン', muscle_group: '背中', difficulty: 2, equipment: 'マシン' },
            { name: 'ワンハンドダンベルロウ', muscle_group: '背中', difficulty: 3, equipment: 'ダンベル' },
            
            // 脚筋エクササイズ
            { name: 'スクワット', muscle_group: '脚', difficulty: 3, equipment: 'バーベル' },
            { name: 'ランジ', muscle_group: '脚', difficulty: 2, equipment: '自重' },
            { name: 'レッグプレス', muscle_group: '脚', difficulty: 2, equipment: 'マシン' },
            { name: 'ブルガリアンスクワット', muscle_group: '脚', difficulty: 3, equipment: '自重' },
            { name: 'カーフレイズ', muscle_group: '脚', difficulty: 1, equipment: '自重' },
            
            // 肩筋エクササイズ
            { name: 'オーバーヘッドプレス', muscle_group: '肩', difficulty: 3, equipment: 'バーベル' },
            { name: 'サイドレイズ', muscle_group: '肩', difficulty: 2, equipment: 'ダンベル' },
            { name: 'フロントレイズ', muscle_group: '肩', difficulty: 2, equipment: 'ダンベル' },
            { name: 'リアデルトフライ', muscle_group: '肩', difficulty: 2, equipment: 'ダンベル' },
            { name: 'アーノルドプレス', muscle_group: '肩', difficulty: 3, equipment: 'ダンベル' },
            
            // 腕筋エクササイズ
            { name: 'バーベルカール', muscle_group: '腕', difficulty: 2, equipment: 'バーベル' },
            { name: 'ダンベルカール', muscle_group: '腕', difficulty: 2, equipment: 'ダンベル' },
            { name: 'トライセップディップス', muscle_group: '腕', difficulty: 3, equipment: '自重' },
            { name: 'ハンマーカール', muscle_group: '腕', difficulty: 2, equipment: 'ダンベル' },
            { name: 'クローズグリッププッシュアップ', muscle_group: '腕', difficulty: 3, equipment: '自重' },
            
            // 腹筋エクササイズ
            { name: 'プランク', muscle_group: '腹筋', difficulty: 2, equipment: '自重' },
            { name: 'クランチ', muscle_group: '腹筋', difficulty: 1, equipment: '自重' },
            { name: 'サイドプランク', muscle_group: '腹筋', difficulty: 2, equipment: '自重' },
            { name: 'ロシアンツイスト', muscle_group: '腹筋', difficulty: 2, equipment: '自重' },
            { name: 'マウンテンクライマー', muscle_group: '腹筋', difficulty: 3, equipment: '自重' }
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
        console.log(`Moving to step ${stepNumber}`);
        
        // 現在のステップを非表示
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.remove('active');
        });

        // ステップインジケーターを更新
        for (let i = 1; i <= 3; i++) {
            const stepIndicator = document.getElementById(`step-${i}`);
            if (stepIndicator) {
                if (i <= stepNumber) {
                    stepIndicator.classList.add('active');
                } else {
                    stepIndicator.classList.remove('active');
                }
            }
        }

        // 次のステップを表示
        const nextStepElement = document.getElementById(`wizard-step-${stepNumber}`);
        if (nextStepElement) {
            nextStepElement.classList.add('active');
            console.log(`Step ${stepNumber} is now active`);
        } else {
            console.error(`Step ${stepNumber} element not found`);
        }

        // ステップ固有の処理
        if (stepNumber === 2) {
            console.log('Loading exercise presets...');
            this.loadExercisePresets();
        } else if (stepNumber === 3) {
            console.log('Updating workout summary...');
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
        console.log('Toggling muscle group:', button.dataset.muscle);
        button.classList.toggle('selected');
        
        // 選択状態の視覚的フィードバック
        if (button.classList.contains('selected')) {
            button.style.backgroundColor = '#3B82F6';
            button.style.color = 'white';
            button.style.borderColor = '#3B82F6';
        } else {
            button.style.backgroundColor = '';
            button.style.color = '';
            button.style.borderColor = '';
        }
        
        this.updateStep1NextButton();
    }

    /**
     * ステップ1の次へボタンの状態を更新
     */
    updateStep1NextButton() {
        const selectedMuscles = document.querySelectorAll('.muscle-group-btn.selected');
        const nextButton = document.getElementById('step1-next');
        
        console.log('Selected muscles count:', selectedMuscles.length);
        console.log('Next button:', nextButton);
        
        if (nextButton) {
            if (selectedMuscles.length > 0) {
                nextButton.disabled = false;
                nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
                nextButton.classList.add('hover:bg-blue-700');
                console.log('Step1 next button enabled');
            } else {
                nextButton.disabled = true;
                nextButton.classList.add('opacity-50', 'cursor-not-allowed');
                nextButton.classList.remove('hover:bg-blue-700');
                console.log('Step1 next button disabled');
            }
        }
    }

    /**
     * エクササイズプリセットを読み込み
     */
    loadExercisePresets() {
        const selectedMuscles = Array.from(document.querySelectorAll('.muscle-group-btn.selected'))
            .map(btn => btn.dataset.muscle);

        if (selectedMuscles.length === 0) {
            showNotification('筋肉部位を選択してください', 'warning');
            return;
        }

        const exercisePresets = this.getExercisePresetsForMuscles(selectedMuscles);
        const container = document.getElementById('exercise-presets');
        
        if (container) {
            if (exercisePresets.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-8 text-gray-500">
                        <i class="fas fa-dumbbell text-4xl mb-4 opacity-50"></i>
                        <p>選択された筋肉部位に対応するエクササイズが見つかりませんでした</p>
                    </div>
                `;
            } else {
                container.innerHTML = exercisePresets.map(exercise => `
                    <button class="exercise-preset-btn bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left" data-exercise="${exercise.name}">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-dumbbell text-blue-500 mr-2"></i>
                            <span class="font-medium text-gray-900">${exercise.name}</span>
                        </div>
                        <div class="text-sm text-gray-600">
                            <div class="flex items-center mb-1">
                                <i class="fas fa-tag text-xs mr-1"></i>
                                <span>${exercise.muscle_group}</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-star text-xs mr-1"></i>
                                <span>難易度: ${'★'.repeat(exercise.difficulty)}${'☆'.repeat(5 - exercise.difficulty)}</span>
                            </div>
                        </div>
                    </button>
                `).join('');
            }

            // エクササイズプリセットボタンのイベントリスナーを設定
            document.querySelectorAll('.exercise-preset-btn').forEach(btn => {
                this.addEventListener(btn, 'click', (e) => {
                    this.addExerciseToSelection(e.currentTarget.dataset.exercise);
                });
            });
        }
    }


    /**
     * 選択された筋肉部位に対応するエクササイズプリセットを取得
     */
    getExercisePresetsForMuscles(muscles) {
        const allExercises = this.getDefaultExercises();
        const filteredExercises = allExercises.filter(exercise => 
            muscles.includes(exercise.muscle_group)
        );
        
        // 筋肉部位ごとにエクササイズをグループ化
        const exerciseGroups = {};
        muscles.forEach(muscle => {
            exerciseGroups[muscle] = filteredExercises.filter(ex => ex.muscle_group === muscle);
        });
        
        // 各筋肉部位から代表的なエクササイズを選択（最大3個ずつ）
        const selectedExercises = [];
        muscles.forEach(muscle => {
            const muscleExercises = exerciseGroups[muscle];
            const selected = muscleExercises.slice(0, 3); // 各筋肉部位から最大3個
            selectedExercises.push(...selected);
        });
        
        return selectedExercises;
    }

    /**
     * エクササイズを選択リストに追加
     */
    addExerciseToSelection(exerciseName) {
        const container = document.getElementById('selected-exercises-list');
        if (!container) return;

        // 既に選択されているかチェック
        const existing = container.querySelector(`[data-exercise="${exerciseName}"]`);
        if (existing) {
            showNotification('このエクササイズは既に選択されています', 'info');
            return;
        }

        // エクササイズの詳細情報を取得
        const exerciseInfo = this.getExerciseInfo(exerciseName);
        
        const exerciseElement = document.createElement('div');
        exerciseElement.className = 'flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-2';
        exerciseElement.dataset.exercise = exerciseName;
        exerciseElement.innerHTML = `
            <div class="flex items-center flex-1">
                <div class="flex-shrink-0">
                    <i class="fas fa-dumbbell text-blue-500 text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <div class="font-medium text-gray-900">${exerciseName}</div>
                    <div class="text-sm text-gray-600">
                        <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">${exerciseInfo.muscle_group}</span>
                        <span class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2">${exerciseInfo.equipment}</span>
                        <span class="text-yellow-600">${'★'.repeat(exerciseInfo.difficulty)}${'☆'.repeat(5 - exerciseInfo.difficulty)}</span>
                    </div>
                </div>
            </div>
            <button class="remove-exercise-btn text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                <i class="fas fa-times"></i>
            </button>
        `;

        // 削除ボタンのイベントリスナー
        const removeBtn = exerciseElement.querySelector('.remove-exercise-btn');
        this.addEventListener(removeBtn, 'click', () => {
            exerciseElement.remove();
            this.updateStep2NextButton();
            this.updateSelectedExercisesDisplay();
        });

        // 空の状態メッセージを削除
        const emptyMessage = container.querySelector('.text-center');
        if (emptyMessage) {
            emptyMessage.remove();
        }

        container.appendChild(exerciseElement);
        this.updateStep2NextButton();
        this.updateSelectedExercisesDisplay();
        
        showNotification(`${exerciseName}を追加しました`, 'success');
    }

    /**
     * エクササイズ情報を取得
     */
    getExerciseInfo(exerciseName) {
        const allExercises = this.getDefaultExercises();
        return allExercises.find(ex => ex.name === exerciseName) || {
            muscle_group: '未設定',
            equipment: '未設定',
            difficulty: 1
        };
    }

    /**
     * 選択されたエクササイズの表示を更新
     */
    updateSelectedExercisesDisplay() {
        const container = document.getElementById('selected-exercises-list');
        if (!container) return;

        const selectedExercises = container.querySelectorAll('[data-exercise]');
        
        if (selectedExercises.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-dumbbell text-2xl mb-2 opacity-50"></i>
                    <p>エクササイズを選択してください</p>
                </div>
            `;
        }
    }

    /**
     * カスタムエクササイズを追加
     */
    addCustomExercise() {
        const input = document.getElementById('custom-exercise-input');
        const exerciseName = input.value.trim();
        
        if (!exerciseName) {
            showNotification('エクササイズ名を入力してください', 'warning');
            return;
        }

        if (exerciseName.length < 2) {
            showNotification('エクササイズ名は2文字以上で入力してください', 'warning');
            return;
        }

        // カスタムエクササイズとして追加
        const customExercise = {
            name: exerciseName,
            muscle_group: 'カスタム',
            equipment: '未設定',
            difficulty: 2
        };

        this.addExerciseToSelection(exerciseName);
        input.value = '';
        
        // 入力フィールドをクリア
        input.focus();
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
            const estimatedTime = this.calculateEstimatedTime(selectedExercises);
            const muscleGroupCount = selectedMuscles.length;
            const exerciseCount = selectedExercises.length;
            
            summaryContainer.innerHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <div class="text-sm text-blue-600 font-medium">対象部位</div>
                            <div class="text-lg font-bold text-blue-900">${muscleGroupCount}部位</div>
                            <div class="text-xs text-blue-700">${selectedMuscles.join(', ')}</div>
                        </div>
                        <div class="bg-green-50 p-3 rounded-lg">
                            <div class="text-sm text-green-600 font-medium">エクササイズ</div>
                            <div class="text-lg font-bold text-green-900">${exerciseCount}種目</div>
                            <div class="text-xs text-green-700">${selectedExercises.slice(0, 3).join(', ')}${selectedExercises.length > 3 ? '...' : ''}</div>
                        </div>
                        <div class="bg-orange-50 p-3 rounded-lg">
                            <div class="text-sm text-orange-600 font-medium">予想時間</div>
                            <div class="text-lg font-bold text-orange-900">${estimatedTime}分</div>
                            <div class="text-xs text-orange-700">セット間休憩含む</div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">選択されたエクササイズ</h4>
                        <div class="space-y-1">
                            ${selectedExercises.map(exercise => `
                                <div class="flex items-center text-sm">
                                    <i class="fas fa-dumbbell text-blue-500 mr-2"></i>
                                    <span>${exercise}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 予想時間を計算
     */
    calculateEstimatedTime(exercises) {
        if (exercises.length === 0) return 0;
        
        // 各エクササイズあたりの時間（分）
        const timePerExercise = 15; // セット間休憩含む
        const warmupTime = 5; // ウォームアップ時間
        const cooldownTime = 5; // クールダウン時間
        
        return warmupTime + (exercises.length * timePerExercise) + cooldownTime;
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