// js/pages/WorkoutPage.js - ワークアウトページ（シンプル版）

import { BasePage } from '../core/BasePage.js';
import { Navigation } from '../components/Navigation.js';
import { supabaseService } from '../services/supabaseService.js';
import { authManager } from '../modules/authManager.js';
import { showNotification } from '../utils/helpers.js';

/**
 * ワークアウトページクラス（シンプル版）
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
        this.selectedMuscles = [];
        this.selectedExercises = [];
    }

    /**
   * 認証状態をチェック（オーバーライド）
   */
    async checkAuthentication() {
        const isAuthenticated = await authManager.isAuthenticated();

        if (!isAuthenticated) {
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
            return;
        }
        
        // ナビゲーションを初期化
        await this.navigation.initialize();

        // エクササイズデータを読み込み
        await this.loadExerciseData();

        // 筋肉部位ボタンを生成
        this.generateMuscleGroupButtons();

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
   * エクササイズデータを読み込み
   */
    async loadExerciseData() {
        try {
            if (supabaseService.isAvailable()) {
                this.exercises = await supabaseService.getExercises();
            } else {
                this.exercises = this.getDefaultExercises();
            }

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

        // 筋肉部位ボタンのクリック
        document.addEventListener('click', (e) => {
            if (e.target.closest('.muscle-group-btn')) {
                const button = e.target.closest('.muscle-group-btn');
                this.toggleMuscleGroup(button);
            }
        });

        // プリセットボタンのクリック
        document.addEventListener('click', (e) => {
            if (e.target.closest('.preset-btn')) {
                const button = e.target.closest('.preset-btn');
                const preset = button.dataset.preset;
                this.selectPreset(preset);
            }
        });

        // ステップ1の次へボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'step1-next') {
                e.preventDefault();
            this.nextStep(2);
            }
        });

        // ステップ2の次へボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'step2-next') {
                e.preventDefault();
            this.nextStep(3);
            }
        });

        // ステップ2の戻るボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'step2-back') {
                e.preventDefault();
            this.previousStep(1);
            }
        });

        // ステップ3の戻るボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'step3-back') {
                e.preventDefault();
            this.previousStep(2);
            }
        });

        // ワークアウト開始ボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'start-workout') {
                e.preventDefault();
            this.startWorkoutFromWizard();
            }
        });

        // カスタムエクササイズ追加
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-custom-exercise') {
                e.preventDefault();
            this.addCustomExercise();
            }
        });

        // エクササイズプリセットボタン
        document.addEventListener('click', (e) => {
            if (e.target.closest('.exercise-preset-btn')) {
                const button = e.target.closest('.exercise-preset-btn');
                const exerciseName = button.dataset.exercise;
                this.addExerciseToSelection(exerciseName);
            }
        });

        // エクササイズ削除ボタン
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-exercise-btn')) {
                const button = e.target.closest('.remove-exercise-btn');
                const exerciseElement = button.closest('[data-exercise]');
                if (exerciseElement) {
                    exerciseElement.remove();
                    this.updateStep2NextButton();
                }
            }
        });
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
            this.loadExercisePresets();
        } else if (stepNumber === 3) {
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
                btn.style.backgroundColor = '#3B82F6';
                btn.style.color = 'white';
                btn.style.borderColor = '#3B82F6';
            } else {
                btn.classList.remove('selected');
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }
        });

        this.updateStep1NextButton();
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
            const selected = muscleExercises.slice(0, 3);
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

        // 空の状態メッセージを削除
        const emptyMessage = container.querySelector('.text-center');
        if (emptyMessage) {
            emptyMessage.remove();
        }

        container.appendChild(exerciseElement);
        this.updateStep2NextButton();
        
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
     * ステップ2の次へボタンの状態を更新
     */
    updateStep2NextButton() {
        const selectedExercises = document.querySelectorAll('#selected-exercises-list [data-exercise]');
        const nextButton = document.getElementById('step2-next');
        
        if (nextButton) {
        if (selectedExercises.length > 0) {
            nextButton.disabled = false;
                nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
                nextButton.classList.add('hover:bg-blue-700');
        } else {
            nextButton.disabled = true;
                nextButton.classList.add('opacity-50', 'cursor-not-allowed');
                nextButton.classList.remove('hover:bg-blue-700');
            }
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

        this.addExerciseToSelection(exerciseName);
        input.value = '';
        input.focus();
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
        
        const timePerExercise = 15;
        const warmupTime = 5;
        const cooldownTime = 5;
        
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
     * ワークアウトタイマーを更新
     */
    updateWorkoutTimer() {
        if (!this.workoutStartTime) return;

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
     * ワークアウト履歴を更新
     */
    updateWorkoutHistory(workoutHistory) {
        const container = document.getElementById('workout-history');
        if (!container) return;

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
     * 日付をフォーマット
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP');
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
}

// ページが読み込まれた時に初期化
document.addEventListener('DOMContentLoaded', async () => {
    const workoutPage = new WorkoutPage();
    await workoutPage.initialize();
});