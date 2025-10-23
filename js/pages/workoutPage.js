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

        // クイックスタートワークアウトボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'quick-start-workout') {
                e.preventDefault();
                this.startQuickWorkout();
            }
        });

        // ワークアウト終了ボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'stop-workout') {
                e.preventDefault();
                this.stopWorkout();
            }
        });

        // エクササイズ追加ボタン
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-exercise-btn') {
                e.preventDefault();
                this.addExercise();
            }
        });
    }

    /**
     * クイックスタートワークアウトを開始
     */
    startQuickWorkout() {
        const selectedMuscles = Array.from(document.querySelectorAll('.muscle-group-btn.selected'))
            .map(btn => btn.dataset.muscle);

        if (selectedMuscles.length === 0) {
            showNotification('筋肉部位を選択してください', 'warning');
            return;
        }

        // ワークアウトを開始
        this.currentWorkout = {
            muscleGroups: selectedMuscles,
            startTime: new Date(),
            sessionName: `${selectedMuscles.join(', ')}のワークアウト - ${new Date().toLocaleDateString('ja-JP')}`
        };

        // クイックスタートセクションを非表示にして、現在のワークアウトセクションを表示
        const quickStartSection = document.querySelector('.muscle-card');
        if (quickStartSection) {
            quickStartSection.classList.add('hidden');
        }
        document.getElementById('current-workout').classList.remove('hidden');

        // タイマーを開始
        this.startWorkoutTimer();

        showNotification('ワークアウトを開始しました', 'success');
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
        
        this.updateQuickStartButton();
    }

    /**
     * クイックスタートボタンの状態を更新
     */
    updateQuickStartButton() {
        const selectedMuscles = document.querySelectorAll('.muscle-group-btn.selected');
        const quickStartButton = document.getElementById('quick-start-workout');
        
        console.log('Selected muscles count:', selectedMuscles.length);
        
        if (quickStartButton) {
            if (selectedMuscles.length > 0) {
                quickStartButton.disabled = false;
                quickStartButton.classList.remove('opacity-50', 'cursor-not-allowed');
                quickStartButton.classList.add('hover:bg-blue-700');
                console.log('Quick start button enabled');
            } else {
                quickStartButton.disabled = true;
                quickStartButton.classList.add('opacity-50', 'cursor-not-allowed');
                quickStartButton.classList.remove('hover:bg-blue-700');
                console.log('Quick start button disabled');
            }
        }
    }

    /**
     * ワークアウトを開始
     */
    startWorkout(muscleGroup) {
        console.log(`Starting workout for: ${muscleGroup}`);
        
        this.currentWorkout = {
            muscleGroup: muscleGroup,
            startTime: new Date(),
            sessionName: `${muscleGroup}のワークアウト - ${new Date().toLocaleDateString('ja-JP')}`
        };

        // クイックスタートセクションを非表示にして、現在のワークアウトセクションを表示
        const quickStartSection = document.querySelector('.muscle-card');
        if (quickStartSection) {
            quickStartSection.classList.add('hidden');
        }
        document.getElementById('current-workout').classList.remove('hidden');

        // タイマーを開始
        this.startWorkoutTimer();

        showNotification(`${muscleGroup}のワークアウトを開始しました`, 'success');
    }

    /**
     * ワークアウトを停止
     */
    stopWorkout() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }

        if (this.currentWorkout) {
            const endTime = new Date();
            const duration = Math.floor((endTime - this.currentWorkout.startTime) / 60000);
            
            showNotification(`ワークアウトを終了しました（${duration}分）`, 'success');
            
            // ワークアウト履歴に保存
            this.saveWorkoutToHistory();
        }

        // 現在のワークアウトセクションを非表示にして、クイックスタートセクションを表示
        document.getElementById('current-workout').classList.add('hidden');
        const quickStartSection = document.querySelector('.muscle-card');
        if (quickStartSection) {
            quickStartSection.classList.remove('hidden');
        }

        this.currentWorkout = null;
    }

    /**
     * エクササイズを追加
     */
    addExercise() {
        const exerciseName = prompt('エクササイズ名を入力してください:');
        if (exerciseName && exerciseName.trim()) {
            this.addExerciseToWorkout(exerciseName.trim());
        }
    }

    /**
     * ワークアウトにエクササイズを追加
     */
    addExerciseToWorkout(exerciseName) {
        const container = document.getElementById('workout-exercises');
        if (!container) return;

        const exerciseElement = document.createElement('div');
        exerciseElement.className = 'flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg';
        exerciseElement.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-dumbbell text-blue-500 mr-3"></i>
                <span class="font-medium text-gray-900">${exerciseName}</span>
            </div>
            <div class="flex items-center space-x-2">
                <button class="btn-secondary text-sm px-3 py-1">
                    <i class="fas fa-plus mr-1"></i>セット追加
                </button>
                <button class="btn-danger text-sm px-3 py-1">
                    <i class="fas fa-trash mr-1"></i>削除
                </button>
            </div>
        `;

        container.appendChild(exerciseElement);
        showNotification(`${exerciseName}を追加しました`, 'success');
    }

    /**
     * ワークアウト履歴に保存
     */
    saveWorkoutToHistory() {
        if (!this.currentWorkout) return;

        const workoutData = {
            ...this.currentWorkout,
            endTime: new Date(),
            duration: Math.floor((new Date() - this.currentWorkout.startTime) / 60000)
        };

        // ローカルストレージに保存
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        history.push(workoutData);
        localStorage.setItem('workoutHistory', JSON.stringify(history));

        // 履歴を更新
        this.updateWorkoutHistory(history);
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