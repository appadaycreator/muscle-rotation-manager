// js/pages/WorkoutPage.js - ワークアウトページ

import { BasePage } from '../core/BasePage.js';
import { Navigation } from '../components/Navigation.js';
import { supabaseService } from '../services/supabaseService.js';
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
   * ページ固有の初期化処理
   */
  async onInitialize() {
    // ナビゲーションを初期化
    await this.navigation.initialize();
    
    // ワークアウトコンテンツを生成
    this.generateWorkoutContent();
    
    // エクササイズデータを読み込み
    await this.loadExerciseData();
  }

  /**
   * ワークアウトコンテンツを生成
   */
  generateWorkoutContent() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- ページヘッダー -->
        <div class="bg-white rounded-lg shadow p-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">ワークアウト</h1>
          <p class="text-gray-600">今日のトレーニングを記録しましょう</p>
        </div>

        <!-- ワークアウト開始セクション -->
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

        <!-- 現在のワークアウトセクション（初期は非表示） -->
        <div id="current-workout-section" class="bg-white rounded-lg shadow p-6 hidden">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">現在のワークアウト</h2>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-600">
                <i class="fas fa-clock mr-1"></i>
                <span id="workout-timer">00:00</span>
              </div>
              <button id="stop-workout-btn" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                <i class="fas fa-stop mr-2"></i>終了
              </button>
            </div>
          </div>
          
          <div id="workout-details">
            <!-- ワークアウト詳細がここに動的に生成されます -->
          </div>
        </div>

        <!-- エクササイズ追加セクション -->
        <div id="add-exercise-section" class="bg-white rounded-lg shadow p-6 hidden">
          <h3 class="text-lg font-bold text-gray-900 mb-4">エクササイズを追加</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">エクササイズ名</label>
              <input 
                type="text" 
                id="exercise-name" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: ベンチプレス"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">セット数</label>
              <input 
                type="number" 
                id="exercise-sets" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value="3"
                min="1"
                max="10"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">重量 (kg)</label>
              <input 
                type="number" 
                id="exercise-weight" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 60"
                step="0.5"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">回数</label>
              <input 
                type="number" 
                id="exercise-reps" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 10"
                min="1"
                max="100"
              >
            </div>
          </div>
          <div class="mt-4">
            <button id="add-exercise-btn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              <i class="fas fa-plus mr-2"></i>エクササイズを追加
            </button>
          </div>
        </div>

        <!-- エクササイズ一覧 -->
        <div id="exercises-list" class="bg-white rounded-lg shadow p-6 hidden">
          <h3 class="text-lg font-bold text-gray-900 mb-4">エクササイズ一覧</h3>
          <div id="exercises-container">
            <!-- エクササイズがここに動的に生成されます -->
          </div>
        </div>

        <!-- ワークアウト履歴 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">最近のワークアウト</h2>
          <div id="workout-history">
            <!-- ワークアウト履歴がここに動的に生成されます -->
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
    if (!this.currentWorkout) return;

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
    if (!container) return;

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
   * ワークアウトを保存
   */
  async saveWorkout() {
    if (!this.currentWorkout) return;

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
      '胸': '💪',
      '背中': '🏋️',
      '肩': '🤸',
      '腕': '💪',
      '脚': '🏃',
      '腹筋': '🔥'
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
}

// ページが読み込まれた時に初期化
document.addEventListener('DOMContentLoaded', async () => {
  const workoutPage = new WorkoutPage();
  await workoutPage.initialize();
});