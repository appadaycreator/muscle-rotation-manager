// js/pages/WorkoutPage.js - ワークアウトページ（シンプル版）

import { BasePage } from '../core/BasePage.js';
import { Navigation } from '../components/Navigation.js';
import { supabaseService } from '../services/supabaseService.js';
import { workoutDataService } from '../services/workoutDataService.js';
import { authManager } from '../modules/authManager.js';
import { showNotification } from '../utils/helpers.js';
import { tooltipManager } from '../utils/TooltipManager.js';

/**
 * ワークアウトページクラス（シンプル版）
 */
export class WorkoutPage extends BasePage {
  constructor() {
    super({ pageName: 'WorkoutPage' });
    this.navigation = new Navigation();
    this.currentWorkout = null;
    this.workoutTimer = null;
    this.workoutStartTime = null;
    this.exercises = [];
    this.isWorkoutActive = false;
    this.muscleGroups = ['胸', '背中', '肩', '腕', '脚', '腹筋'];
    this.selectedMuscles = [];
    this.selectedExercises = [];
    this.eventListenersSetup = false;
    this.muscleGroupCache = new Map(); // 筋肉グループ名からUUIDへのキャッシュ
    this.currentExercise = null; // 現在のエクササイズ
    this.currentSet = 0; // 現在のセット数
    this.setData = []; // セットデータ
    this.restTimer = null; // レストタイマー
    this.restStartTime = null; // レスト開始時間

    console.log('WorkoutPage constructor called');
    console.log('Muscle groups initialized:', this.muscleGroups);

    // 筋肉グループのキャッシュを初期化
    this.initializeMuscleGroupCache();
  }

  /**
   * 認証状態をチェック（オーバーライド）
   */
  async checkAuthentication() {
    // 認証チェックをスキップしてワークアウトページを表示
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

    // ツールチップ機能を初期化
    tooltipManager.initialize();

    // エクササイズデータを読み込み
    await this.loadExerciseData();

    // 筋肉グループボタンを生成
    this.loadMuscleGroups();

    // エクササイズプリセットを初期化
    this.clearExercisePresets();

    // DOM要素が読み込まれた後にイベントリスナーを設定
    setTimeout(() => {
      console.log('Setting up event listeners after DOM load...');

      // 筋肉部位ボタンの存在を確認
      const muscleButtons = document.querySelectorAll('.muscle-group-btn');
      console.log('Found muscle group buttons:', muscleButtons.length);
      muscleButtons.forEach((btn, index) => {
        console.log(`Button ${index}:`, btn.dataset.muscle, btn);
      });

      // イベントリスナーが既に設定されている場合はスキップ
      if (!this.eventListenersSetup) {
        this.setupEventListeners();
        this.setupTooltips();
        this.eventListenersSetup = true;
      }
      this.updateQuickStartButton();
      console.log('Event listeners setup complete');
    }, 100);
  }

  /**
   * ログインプロンプトを表示
   */
  showLoginPrompt() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      return;
    }

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
      console.log('Loading workout history...');

      // ワークアウトデータサービスから履歴を読み込み
      const workoutHistory = await workoutDataService.loadWorkouts({
        limit: 50,
      });

      console.log('Workout history loaded:', workoutHistory.length, 'workouts');
      this.updateWorkoutHistory(workoutHistory);
    } catch (error) {
      console.error('Failed to load workout history:', error);
      // エラーが発生した場合は空の履歴を表示
      this.updateWorkoutHistory([]);
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    console.log('Setting up event listeners...');

    // 既存のイベントリスナーを削除
    this.removeEventListeners();

    // 筋肉部位ボタンのクリック
    this.muscleGroupClickHandler = (e) => {
      console.log('Click event detected on:', e.target);
      console.log('Event target classList:', e.target.classList);
      console.log(
        'Closest muscle-group-btn:',
        e.target.closest('.muscle-group-btn')
      );

      if (e.target.closest('.muscle-group-btn')) {
        const button = e.target.closest('.muscle-group-btn');
        console.log('Muscle group button clicked:', button.dataset.muscle);
        this.toggleMuscleGroup(button);
      } else {
        console.log('Click was not on a muscle group button');
      }
    };

    // クイックスタートワークアウトボタン
    this.quickStartClickHandler = (e) => {
      if (e.target.id === 'quick-start-workout') {
        e.preventDefault();
        this.startQuickWorkout();
      }
    };

    // ワークアウト終了ボタン
    this.stopWorkoutClickHandler = async (e) => {
      if (e.target.id === 'stop-workout') {
        e.preventDefault();
        await this.stopWorkout();
      }
    };

    // エクササイズ追加ボタン
    this.addExerciseClickHandler = (e) => {
      if (e.target.id === 'add-exercise-btn') {
        e.preventDefault();
        this.addExercise();
      }
    };

    // イベントリスナーを追加
    document.addEventListener('click', this.muscleGroupClickHandler);
    document.addEventListener('click', this.quickStartClickHandler);
    document.addEventListener('click', this.stopWorkoutClickHandler);
    document.addEventListener('click', this.addExerciseClickHandler);
  }

  /**
   * イベントリスナーを削除
   */
  removeEventListeners() {
    if (this.muscleGroupClickHandler) {
      document.removeEventListener('click', this.muscleGroupClickHandler);
    }
    if (this.quickStartClickHandler) {
      document.removeEventListener('click', this.quickStartClickHandler);
    }
    if (this.stopWorkoutClickHandler) {
      document.removeEventListener('click', this.stopWorkoutClickHandler);
    }
    if (this.addExerciseClickHandler) {
      document.removeEventListener('click', this.addExerciseClickHandler);
    }
  }

  /**
   * クイックスタートワークアウトを開始
   */
  startQuickWorkout() {
    const selectedMuscles = Array.from(
      document.querySelectorAll('.muscle-group-btn.selected')
    ).map((btn) => btn.dataset.muscle);

    if (selectedMuscles.length === 0) {
      showNotification('筋肉部位を選択してください', 'warning');
      return;
    }

    // ワークアウトを開始
    this.currentWorkout = {
      muscleGroups: selectedMuscles,
      startTime: new Date(),
      sessionName: `${selectedMuscles.join(', ')}のワークアウト - ${new Date().toLocaleDateString('ja-JP')}`,
      exercises: [], // エクササイズデータ
      totalSets: 0, // 総セット数
      totalReps: 0, // 総レップ数
      totalWeight: 0, // 総重量
    };

    // クイックスタートセクションを非表示にして、現在のワークアウトセクションを表示
    const quickStartSection = document.querySelector('.muscle-card');
    if (quickStartSection) {
      quickStartSection.classList.add('hidden');
    }
    document.getElementById('current-workout').classList.remove('hidden');

    // タイマーを開始
    this.startWorkoutTimer();

    // エクササイズ選択セクションを表示
    this.renderExerciseSelection();

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
      console.log('Muscle group selected:', button.dataset.muscle);
    } else {
      button.style.backgroundColor = '';
      button.style.color = '';
      button.style.borderColor = '';
      console.log('Muscle group deselected:', button.dataset.muscle);
    }

    this.updateQuickStartButton();
    this.loadExercisesForSelectedMuscles();
  }

  /**
   * エクササイズ選択セクションをレンダリング
   */
  renderExerciseSelection() {
    const container = document.getElementById('current-workout');
    if (!container) return;

    container.innerHTML = `
      <!-- ワークアウトヘッダー -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-gray-800">${this.currentWorkout.sessionName}</h3>
            <p class="text-gray-600">開始時刻: ${this.currentWorkout.startTime.toLocaleTimeString('ja-JP')}</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600" id="workout-timer">00:00</div>
            <div class="text-sm text-gray-500">経過時間</div>
          </div>
        </div>
      </div>

      <!-- エクササイズ選択 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="fas fa-dumbbell text-blue-500 mr-2"></i>
          エクササイズを選択
        </h4>
        <div id="exercise-presets" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- エクササイズボタンがここに動的に追加される -->
        </div>
      </div>

      <!-- 現在のエクササイズ -->
      <div id="current-exercise-section" class="hidden">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-semibold text-gray-800" id="current-exercise-name">
              エクササイズ名
            </h4>
            <button id="finish-exercise-btn" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              <i class="fas fa-check mr-2"></i>エクササイズ完了
            </button>
          </div>
          
          <!-- セット記録 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">セット ${this.currentSet + 1}</span>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">レップ数:</span>
                <input type="number" id="reps-input" class="w-20 px-2 py-1 border border-gray-300 rounded text-center" min="1" max="100" value="10">
                <span class="text-sm text-gray-500">重量(kg):</span>
                <input type="number" id="weight-input" class="w-20 px-2 py-1 border border-gray-300 rounded text-center" min="0" step="0.5" value="0">
              </div>
            </div>
            <button id="add-set-btn" class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
              <i class="fas fa-plus mr-2"></i>セットを追加
            </button>
          </div>

          <!-- セット履歴 -->
          <div id="sets-history" class="space-y-2">
            <!-- セット履歴がここに動的に追加される -->
          </div>
        </div>
      </div>

      <!-- ワークアウト統計 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="fas fa-chart-bar text-green-500 mr-2"></i>
          ワークアウト統計
        </h4>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600" id="total-sets">0</div>
            <div class="text-sm text-gray-500">総セット数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600" id="total-reps">0</div>
            <div class="text-sm text-gray-500">総レップ数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-purple-600" id="total-weight">0</div>
            <div class="text-sm text-gray-500">総重量(kg)</div>
          </div>
        </div>
      </div>

      <!-- ワークアウト完了ボタン -->
      <div class="text-center">
        <button id="finish-workout-btn" class="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold">
          <i class="fas fa-stop mr-2"></i>ワークアウト完了
        </button>
      </div>
    `;

    // イベントリスナーを設定
    this.setupWorkoutEventListeners();
  }

  /**
   * ワークアウトイベントリスナーを設定
   */
  setupWorkoutEventListeners() {
    // エクササイズ完了ボタン
    const finishExerciseBtn = document.getElementById('finish-exercise-btn');
    if (finishExerciseBtn) {
      finishExerciseBtn.addEventListener('click', () => {
        this.finishCurrentExercise();
      });
    }

    // セット追加ボタン
    const addSetBtn = document.getElementById('add-set-btn');
    if (addSetBtn) {
      addSetBtn.addEventListener('click', () => {
        this.addSet();
      });
    }

    // ワークアウト完了ボタン
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');
    if (finishWorkoutBtn) {
      finishWorkoutBtn.addEventListener('click', () => {
        this.finishWorkout();
      });
    }
  }

  /**
   * エクササイズを開始
   */
  startExercise(exerciseName) {
    this.currentExercise = {
      name: exerciseName,
      sets: [],
      startTime: new Date(),
    };
    this.currentSet = 0;
    this.setData = [];

    // 現在のエクササイズセクションを表示
    const currentExerciseSection = document.getElementById(
      'current-exercise-section'
    );
    if (currentExerciseSection) {
      currentExerciseSection.classList.remove('hidden');
    }

    // エクササイズ名を更新
    const exerciseNameElement = document.getElementById(
      'current-exercise-name'
    );
    if (exerciseNameElement) {
      exerciseNameElement.textContent = exerciseName;
    }

    showNotification(`${exerciseName}を開始しました`, 'success');
  }

  /**
   * セットを追加
   */
  addSet() {
    const repsInput = document.getElementById('reps-input');
    const weightInput = document.getElementById('weight-input');

    if (!repsInput || !weightInput) return;

    const reps = parseInt(repsInput.value) || 0;
    const weight = parseFloat(weightInput.value) || 0;

    if (reps === 0) {
      showNotification('レップ数を入力してください', 'warning');
      return;
    }

    const setData = {
      setNumber: this.currentSet + 1,
      reps: reps,
      weight: weight,
      timestamp: new Date(),
    };

    this.setData.push(setData);
    this.currentSet++;

    // セット履歴を更新
    this.updateSetsHistory();

    // ワークアウト統計を更新
    this.updateWorkoutStats();

    // 入力フィールドをリセット
    repsInput.value = '10';
    weightInput.value = '0';

    showNotification(`セット${setData.setNumber}を記録しました`, 'success');
  }

  /**
   * セット履歴を更新
   */
  updateSetsHistory() {
    const setsHistory = document.getElementById('sets-history');
    if (!setsHistory) return;

    setsHistory.innerHTML = this.setData
      .map(
        (set) => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-4">
          <span class="text-sm font-medium text-gray-700">セット ${set.setNumber}</span>
          <span class="text-sm text-gray-600">${set.reps}回</span>
          <span class="text-sm text-gray-600">${set.weight}kg</span>
        </div>
        <div class="text-xs text-gray-500">
          ${set.timestamp.toLocaleTimeString('ja-JP')}
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * ワークアウト統計を更新
   */
  updateWorkoutStats() {
    const totalSets =
      this.currentWorkout.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0
      ) + this.setData.length;
    const totalReps =
      this.currentWorkout.exercises.reduce(
        (sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) => setSum + set.reps, 0),
        0
      ) + this.setData.reduce((sum, set) => sum + set.reps, 0);
    const totalWeight =
      this.currentWorkout.exercises.reduce(
        (sum, exercise) =>
          sum +
          exercise.sets.reduce(
            (setSum, set) => setSum + set.weight * set.reps,
            0
          ),
        0
      ) + this.setData.reduce((sum, set) => sum + set.weight * set.reps, 0);

    // 統計を更新
    const totalSetsElement = document.getElementById('total-sets');
    const totalRepsElement = document.getElementById('total-reps');
    const totalWeightElement = document.getElementById('total-weight');

    if (totalSetsElement) totalSetsElement.textContent = totalSets;
    if (totalRepsElement) totalRepsElement.textContent = totalReps;
    if (totalWeightElement) totalWeightElement.textContent = totalWeight;
  }

  /**
   * 現在のエクササイズを完了
   */
  finishCurrentExercise() {
    if (!this.currentExercise || this.setData.length === 0) {
      showNotification('セットを記録してください', 'warning');
      return;
    }

    // エクササイズデータを保存
    this.currentExercise.sets = [...this.setData];
    this.currentExercise.endTime = new Date();
    this.currentExercise.duration = Math.floor(
      (this.currentExercise.endTime - this.currentExercise.startTime) / 60000
    );

    this.currentWorkout.exercises.push({ ...this.currentExercise });

    // 現在のエクササイズセクションを非表示
    const currentExerciseSection = document.getElementById(
      'current-exercise-section'
    );
    if (currentExerciseSection) {
      currentExerciseSection.classList.add('hidden');
    }

    // 統計を更新
    this.updateWorkoutStats();

    showNotification(`${this.currentExercise.name}を完了しました`, 'success');

    // リセット
    this.currentExercise = null;
    this.currentSet = 0;
    this.setData = [];
  }

  /**
   * ワークアウトを完了
   */
  async finishWorkout() {
    if (this.currentWorkout.exercises.length === 0) {
      showNotification('エクササイズを記録してください', 'warning');
      return;
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime - this.currentWorkout.startTime) / 60000
    );

    this.currentWorkout.endTime = endTime;
    this.currentWorkout.duration = duration;

    // ワークアウトを保存
    await this.saveWorkoutToHistory();

    showNotification('ワークアウトを完了しました！', 'success');

    // ページをリセット
    this.resetWorkoutPage();
  }

  /**
   * ワークアウトページをリセット
   */
  resetWorkoutPage() {
    this.currentWorkout = null;
    this.currentExercise = null;
    this.currentSet = 0;
    this.setData = [];

    // タイマーを停止
    if (this.workoutTimer) {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;
    }

    // ページをリロード
    window.location.reload();
  }

  /**
   * ワークアウトを開始
   */
  startWorkout(muscleGroup) {
    console.log(`Starting workout for: ${muscleGroup}`);

    this.currentWorkout = {
      muscleGroup,
      startTime: new Date(),
      sessionName: `${muscleGroup}のワークアウト - ${new Date().toLocaleDateString('ja-JP')}`,
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
  async stopWorkout() {
    if (this.workoutTimer) {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;
    }

    if (this.currentWorkout) {
      const endTime = new Date();
      const duration = Math.floor(
        (endTime - this.currentWorkout.startTime) / 60000
      );

      showNotification(
        `ワークアウトを終了しました（${duration}分）`,
        'success'
      );

      // ワークアウト履歴に保存
      await this.saveWorkoutToHistory();
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
    const exerciseName = window.prompt('エクササイズ名を入力してください:');
    if (exerciseName && exerciseName.trim()) {
      this.addExerciseToWorkout(exerciseName.trim());
    }
  }

  /**
   * エクササイズを読み込み
   */
  async loadExercises() {
    try {
      const { exerciseService } = await import('../services/exerciseService.js');
      this.exercises = await exerciseService.getExercises();
      console.log('Exercises loaded:', this.exercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
      this.exercises = [];
    }
  }

  /**
   * ワークアウトにエクササイズを追加
   */
  addExerciseToWorkout(exercise) {
    // currentWorkoutを初期化
    if (!this.currentWorkout) {
      this.currentWorkout = { exercises: [] };
    }
    if (!this.currentWorkout.exercises) {
      this.currentWorkout.exercises = [];
    }

    // エクササイズを追加
    this.currentWorkout.exercises.push(exercise);

    // DOM要素も更新（存在する場合）
    const container = document.getElementById('workout-exercises');
    if (container) {
      const exerciseElement = document.createElement('div');
      exerciseElement.className =
        'flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg';
      exerciseElement.innerHTML = `
              <div class="flex items-center">
                  <i class="fas fa-dumbbell text-blue-500 mr-3"></i>
                  <span class="font-medium text-gray-900">${exercise.name || exercise}</span>
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
    }

    showNotification(`${exercise.name || exercise}を追加しました`, 'success');
  }

  /**
   * ワークアウトからエクササイズを削除
   */
  removeExerciseFromWorkout(exerciseId) {
    if (!this.currentWorkout) {
      this.currentWorkout = { exercises: [] };
    }
    this.currentWorkout.exercises = this.currentWorkout.exercises.filter(
      ex => ex.id !== exerciseId
    );
  }

  /**
   * エクササイズにセットを追加
   */
  addSetToExercise(exerciseId, setData) {
    if (!this.currentWorkout) {
      this.currentWorkout = { exercises: [] };
    }
    const exercise = this.currentWorkout.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      if (!exercise.sets) {
        exercise.sets = [];
      }
      exercise.sets.push(setData);
    }
  }

  /**
   * エクササイズからセットを削除
   */
  removeSetFromExercise(exerciseId, setIndex) {
    if (!this.currentWorkout) {
      return;
    }
    const exercise = this.currentWorkout.exercises.find(ex => ex.id === exerciseId);
    if (exercise && exercise.sets) {
      exercise.sets.splice(setIndex, 1);
    }
  }

  /**
   * エクササイズのセットを更新
   */
  updateSetInExercise(exerciseId, setIndex, setData) {
    if (!this.currentWorkout) {
      return;
    }
    const exercise = this.currentWorkout.exercises.find(ex => ex.id === exerciseId);
    if (exercise && exercise.sets && exercise.sets[setIndex]) {
      exercise.sets[setIndex] = setData;
    }
  }

  /**
   * ワークアウト統計を計算
   */
  calculateWorkoutStats() {
    if (!this.currentWorkout || !this.currentWorkout.exercises) {
      return { totalVolume: 0, totalSets: 0, totalReps: 0 };
    }

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    this.currentWorkout.exercises.forEach(exercise => {
      if (exercise.sets) {
        exercise.sets.forEach(set => {
          totalVolume += (set.weight || 0) * (set.reps || 0);
          totalSets += 1;
          totalReps += set.reps || 0;
        });
      }
    });

    return { totalVolume, totalSets, totalReps };
  }

  /**
   * エクササイズのボリュームを計算
   */
  calculateExerciseVolume(exerciseId) {
    if (!this.currentWorkout) {
      return 0;
    }
    const exercise = this.currentWorkout.exercises.find(ex => ex.id === exerciseId);
    if (!exercise || !exercise.sets) {
      return 0;
    }

    return exercise.sets.reduce((volume, set) => {
      return volume + (set.weight || 0) * (set.reps || 0);
    }, 0);
  }

  /**
   * ワークアウトインターフェースをレンダリング
   */
  renderWorkoutInterface() {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="workout-interface">
        <h1>ワークアウト</h1>
        <div id="workout-exercises"></div>
      </div>
    `;
  }

  /**
   * エクササイズリストをレンダリング
   */
  renderExerciseList() {
    const container = document.getElementById('exercise-list');
    if (!container) return;

    container.innerHTML = this.exercises.map(exercise => 
      `<div class="exercise-item">${exercise.name}</div>`
    ).join('');
  }

  /**
   * 現在のワークアウトをレンダリング
   */
  renderCurrentWorkout() {
    const container = document.getElementById('current-workout');
    if (!container || !this.currentWorkout || !this.currentWorkout.exercises) return;

    container.innerHTML = this.currentWorkout.exercises.map(exercise => 
      `<div class="workout-exercise">${exercise.name || exercise}</div>`
    ).join('');
  }

  /**
   * ワークアウトを保存
   */
  async saveWorkout() {
    try {
      const { supabaseService } = await import('../services/supabaseService.js');
      const { workoutDataService } = await import('../services/workoutDataService.js');
      
      // 認証チェック
      if (!supabaseService.isAuthenticated()) {
        console.error('User not authenticated');
        return;
      }

      if (!this.currentWorkout) {
        console.error('No workout to save');
        return;
      }

      // ワークアウトデータを保存
      await workoutDataService.saveWorkout(this.currentWorkout);
      showNotification('ワークアウトを保存しました', 'success');
      
    } catch (error) {
      console.error('Error saving workout:', error);
      showNotification('ワークアウトの保存に失敗しました', 'error');
    }
  }

  /**
   * 筋肉グループボタンを生成
   */
  loadMuscleGroups() {
    const container = document.getElementById('muscle-groups-grid');
    if (!container) {
      console.error('Muscle groups grid container not found');
      return;
    }

    // 筋肉グループのアイコンと色を定義
    const muscleGroupConfig = {
      胸: {
        icon: 'fas fa-heart',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        hoverColor: 'hover:bg-red-100',
      },
      背中: {
        icon: 'fas fa-user',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        hoverColor: 'hover:bg-blue-100',
      },
      肩: {
        icon: 'fas fa-arrow-up',
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        hoverColor: 'hover:bg-green-100',
      },
      腕: {
        icon: 'fas fa-hand-paper',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        hoverColor: 'hover:bg-purple-100',
      },
      脚: {
        icon: 'fas fa-running',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        hoverColor: 'hover:bg-orange-100',
      },
      腹筋: {
        icon: 'fas fa-dumbbell',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        hoverColor: 'hover:bg-yellow-100',
      },
    };

    container.innerHTML = this.muscleGroups
      .map((muscle) => {
        const config = muscleGroupConfig[muscle] || {
          icon: 'fas fa-dumbbell',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          hoverColor: 'hover:bg-gray-100',
        };

        return `
                <button class="muscle-group-btn ${config.bgColor} ${config.hoverColor} border-2 border-gray-200 rounded-lg p-4 text-center transition-all duration-200 hover:shadow-md" 
                        data-muscle="${muscle}">
                    <div class="flex flex-col items-center space-y-2">
                        <i class="${config.icon} ${config.color} text-2xl"></i>
                        <span class="font-medium text-gray-800">${muscle}</span>
                    </div>
                </button>
            `;
      })
      .join('');

    console.log('Muscle group buttons generated:', this.muscleGroups.length);
  }

  /**
   * 選択された筋肉グループに基づいてエクササイズを表示
   */
  loadExercisesForSelectedMuscles() {
    const selectedMuscles = Array.from(
      document.querySelectorAll('.muscle-group-btn.selected')
    ).map((btn) => btn.dataset.muscle);

    if (selectedMuscles.length === 0) {
      this.clearExercisePresets();
      return;
    }

    const container = document.getElementById('exercise-presets');
    if (!container) {
      console.error('Exercise presets container not found');
      return;
    }

    // 選択された筋肉グループのエクササイズを取得
    const relevantExercises = this.getDefaultExercises().filter((exercise) =>
      selectedMuscles.includes(exercise.muscle_group)
    );

    if (relevantExercises.length === 0) {
      container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-4">
                    <i class="fas fa-info-circle text-xl mb-2"></i>
                    <p>選択された部位のエクササイズが見つかりません</p>
                </div>
            `;
      return;
    }

    container.innerHTML = relevantExercises
      .map(
        (exercise) => `
            <button class="exercise-preset-btn bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 hover:border-blue-300 transition-all duration-200" 
                    data-exercise="${exercise.name}" data-muscle="${exercise.muscle_group}">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-medium text-gray-900">${exercise.name}</h4>
                        <p class="text-sm text-gray-500">${exercise.muscle_group} • ${exercise.equipment}</p>
                    </div>
                    <div class="flex items-center space-x-1">
                        ${'★'.repeat(exercise.difficulty)}
                        <span class="text-xs text-gray-400 ml-1">${exercise.difficulty}/5</span>
                    </div>
                </div>
            </button>
        `
      )
      .join('');

    // エクササイズボタンのイベントリスナーを設定
    container.querySelectorAll('.exercise-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const exerciseName = btn.dataset.exercise;
        this.startExercise(exerciseName);
      });
    });

    console.log(
      'Loaded exercises for selected muscles:',
      selectedMuscles,
      relevantExercises.length
    );
  }

  /**
   * エクササイズプリセットをクリア
   */
  clearExercisePresets() {
    const container = document.getElementById('exercise-presets');
    if (container) {
      container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-4">
                    <i class="fas fa-hand-pointer text-xl mb-2"></i>
                    <p>筋肉部位を選択してください</p>
                </div>
            `;
    }
  }

  /**
   * 筋肉グループのキャッシュを初期化
   */
  async initializeMuscleGroupCache() {
    try {
      if (!supabaseService.isAvailable()) {
        console.log(
          'Supabase not available, cannot initialize muscle group cache'
        );
        return;
      }

      const { data, error } = await supabaseService.client
        .from('muscle_groups')
        .select('id, name_ja');

      if (error) {
        console.error('Failed to load muscle groups:', error);
        return;
      }

      if (data) {
        data.forEach((muscle) => {
          this.muscleGroupCache.set(muscle.name_ja, muscle.id);
        });
        console.log('Muscle group cache initialized:', this.muscleGroupCache);
      }
    } catch (error) {
      console.error('Error initializing muscle group cache:', error);
    }
  }

  /**
   * 筋肉グループ名をUUIDに変換
   */
  async convertMuscleGroupsToUUIDs(muscleGroupNames) {
    try {
      if (!supabaseService.isAvailable()) {
        console.log(
          'Supabase not available, cannot convert muscle groups to UUIDs'
        );
        return [];
      }

      const muscleGroupUUIDs = [];

      for (const muscleName of muscleGroupNames) {
        // キャッシュから確認
        if (this.muscleGroupCache.has(muscleName)) {
          const uuid = this.muscleGroupCache.get(muscleName);
          muscleGroupUUIDs.push(uuid);
          console.log(`Using cached UUID for ${muscleName}: ${uuid}`);
          continue;
        }

        // データベースから取得
        const { data, error } = await supabaseService.client
          .from('muscle_groups')
          .select('id')
          .eq('name_ja', muscleName)
          .single();

        if (error) {
          console.error(
            `Failed to get UUID for muscle group ${muscleName}:`,
            error
          );
          continue;
        }

        if (data && data.id) {
          // キャッシュに保存
          this.muscleGroupCache.set(muscleName, data.id);
          muscleGroupUUIDs.push(data.id);
          console.log(`Converted ${muscleName} to UUID: ${data.id}`);
        }
      }

      return muscleGroupUUIDs;
    } catch (error) {
      console.error('Error converting muscle groups to UUIDs:', error);
      return [];
    }
  }

  /**
   * ワークアウト履歴に保存
   */
  async saveWorkoutToHistory() {
    if (!this.currentWorkout) {
      console.log('No current workout to save');
      return;
    }

    // 重複保存を防ぐためのチェック
    if (this.currentWorkout.saved) {
      console.log('Workout already saved, skipping duplicate save');
      return;
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime - this.currentWorkout.startTime) / 60000
    );

    // 筋肉グループ名をUUIDに変換
    const muscleGroupUUIDs = await this.convertMuscleGroupsToUUIDs(
      this.currentWorkout.muscleGroups
    );
    console.log('Converted muscle groups to UUIDs:', muscleGroupUUIDs);

    // 現在のユーザーIDを取得
    const currentUser = await authManager.getCurrentUser();
    if (!currentUser) {
      console.error('No authenticated user found');
      showNotification('ログインが必要です', 'error');
      return;
    }

    const workoutData = {
      user_id: currentUser.id,
      session_name: this.currentWorkout.sessionName,
      muscle_groups_trained: muscleGroupUUIDs,
      workout_date: this.currentWorkout.startTime.toISOString(),
      total_duration_minutes: duration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Saving workout data:', workoutData);

    try {
      // ワークアウトデータサービスを使用して保存
      const success = await workoutDataService.saveWorkout(workoutData);

      if (success) {
        this.currentWorkout.saved = true;
        showNotification('ワークアウトが保存されました', 'success');
        console.log('Workout saved successfully');

        // 履歴を再読み込み
        await this.loadWorkoutHistory();
      } else {
        throw new Error('Failed to save workout');
      }
    } catch (error) {
      console.error('Failed to save workout:', error);
      showNotification('ワークアウトの保存に失敗しました', 'error');
    }
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
    if (!this.workoutStartTime) {
      return;
    }

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
   * デフォルトエクササイズを取得
   */
  getDefaultExercises() {
    return [
      // 胸筋エクササイズ
      {
        name: 'ベンチプレス',
        muscle_group: '胸',
        difficulty: 3,
        equipment: 'バーベル',
      },
      {
        name: 'プッシュアップ',
        muscle_group: '胸',
        difficulty: 2,
        equipment: '自重',
      },
      {
        name: 'ダンベルフライ',
        muscle_group: '胸',
        difficulty: 2,
        equipment: 'ダンベル',
      },
      {
        name: 'インクラインプレス',
        muscle_group: '胸',
        difficulty: 3,
        equipment: 'バーベル',
      },
      {
        name: 'ディップス',
        muscle_group: '胸',
        difficulty: 3,
        equipment: '自重',
      },

      // 背筋エクササイズ
      {
        name: 'デッドリフト',
        muscle_group: '背中',
        difficulty: 4,
        equipment: 'バーベル',
      },
      {
        name: 'プルアップ',
        muscle_group: '背中',
        difficulty: 4,
        equipment: '自重',
      },
      {
        name: 'ベントオーバーロウ',
        muscle_group: '背中',
        difficulty: 3,
        equipment: 'バーベル',
      },
      {
        name: 'ラットプルダウン',
        muscle_group: '背中',
        difficulty: 2,
        equipment: 'マシン',
      },
      {
        name: 'ワンハンドダンベルロウ',
        muscle_group: '背中',
        difficulty: 3,
        equipment: 'ダンベル',
      },

      // 脚筋エクササイズ
      {
        name: 'スクワット',
        muscle_group: '脚',
        difficulty: 3,
        equipment: 'バーベル',
      },
      { name: 'ランジ', muscle_group: '脚', difficulty: 2, equipment: '自重' },
      {
        name: 'レッグプレス',
        muscle_group: '脚',
        difficulty: 2,
        equipment: 'マシン',
      },
      {
        name: 'ブルガリアンスクワット',
        muscle_group: '脚',
        difficulty: 3,
        equipment: '自重',
      },
      {
        name: 'カーフレイズ',
        muscle_group: '脚',
        difficulty: 1,
        equipment: '自重',
      },

      // 肩筋エクササイズ
      {
        name: 'オーバーヘッドプレス',
        muscle_group: '肩',
        difficulty: 3,
        equipment: 'バーベル',
      },
      {
        name: 'サイドレイズ',
        muscle_group: '肩',
        difficulty: 2,
        equipment: 'ダンベル',
      },
      {
        name: 'フロントレイズ',
        muscle_group: '肩',
        difficulty: 2,
        equipment: 'ダンベル',
      },
      {
        name: 'リアデルトフライ',
        muscle_group: '肩',
        difficulty: 2,
        equipment: 'ダンベル',
      },
      {
        name: 'アーノルドプレス',
        muscle_group: '肩',
        difficulty: 3,
        equipment: 'ダンベル',
      },

      // 腕筋エクササイズ
      {
        name: 'バーベルカール',
        muscle_group: '腕',
        difficulty: 2,
        equipment: 'バーベル',
      },
      {
        name: 'ダンベルカール',
        muscle_group: '腕',
        difficulty: 2,
        equipment: 'ダンベル',
      },
      {
        name: 'トライセップディップス',
        muscle_group: '腕',
        difficulty: 3,
        equipment: '自重',
      },
      {
        name: 'ハンマーカール',
        muscle_group: '腕',
        difficulty: 2,
        equipment: 'ダンベル',
      },
      {
        name: 'クローズグリッププッシュアップ',
        muscle_group: '腕',
        difficulty: 3,
        equipment: '自重',
      },

      // 腹筋エクササイズ
      {
        name: 'プランク',
        muscle_group: '腹筋',
        difficulty: 2,
        equipment: '自重',
      },
      {
        name: 'クランチ',
        muscle_group: '腹筋',
        difficulty: 1,
        equipment: '自重',
      },
      {
        name: 'サイドプランク',
        muscle_group: '腹筋',
        difficulty: 2,
        equipment: '自重',
      },
      {
        name: 'ロシアンツイスト',
        muscle_group: '腹筋',
        difficulty: 2,
        equipment: '自重',
      },
      {
        name: 'マウンテンクライマー',
        muscle_group: '腹筋',
        difficulty: 3,
        equipment: '自重',
      },
    ];
  }

  /**
   * ワークアウト履歴を更新
   */
  updateWorkoutHistory(workoutHistory) {
    const container = document.getElementById('workout-history');
    if (!container) {
      return;
    }

    console.log('Updating workout history with data:', workoutHistory);

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
      .sort((a, b) => {
        const dateA = a.workout_date || a.startTime || a.created_at;
        const dateB = b.workout_date || b.startTime || b.created_at;
        return new Date(dateB) - new Date(dateA);
      })
      .slice(0, 10);

    container.innerHTML = recentWorkouts
      .map((workout) => {
        // データベースの構造に応じて適切なフィールドを取得
        const sessionName =
          workout.session_name || workout.sessionName || 'ワークアウト';
        const muscleGroups =
          workout.muscle_groups_trained ||
          workout.muscleGroups ||
          workout.muscle_groups ||
          [];
        const duration =
          workout.total_duration_minutes ||
          workout.duration ||
          workout.total_duration ||
          0;
        const workoutDate =
          workout.workout_date ||
          workout.startTime ||
          workout.created_at ||
          workout.date;

        console.log('Processing workout:', {
          sessionName,
          muscleGroups,
          duration,
          workoutDate,
        });

        return `
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-dumbbell text-blue-600"></i>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${sessionName}</div>
            <div class="text-sm text-gray-500">${Array.isArray(muscleGroups) ? muscleGroups.join(', ') : muscleGroups || '部位不明'}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-900">${duration}分</div>
          <div class="text-sm text-gray-500">${this.formatDate(workoutDate)}</div>
        </div>
      </div>
    `;
      })
      .join('');
  }

  /**
   * 日付をフォーマット
   */
  formatDate(dateString) {
    if (!dateString) {
      return '日付不明';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '日付不明';
      }
      return date.toLocaleDateString('ja-JP');
    } catch (error) {
      console.error('Failed to format date:', dateString, error);
      return '日付不明';
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
   * ツールチップを設定
   */
  setupTooltips() {
    try {
      console.log('Setting up tooltips for workout page');

      // 筋肉部位ボタンのツールチップ
      tooltipManager.addTooltip(
        '.muscle-group-btn[data-muscle="胸"]',
        '胸筋（大胸筋）を鍛えるエクササイズ。ベンチプレス、プッシュアップなど。',
        {
          position: 'top',
          theme: 'primary',
          animation: 'bounce',
          arrow: true,
          delay: 200,
        }
      );

      tooltipManager.addTooltip(
        '.muscle-group-btn[data-muscle="背中"]',
        '背筋群を鍛えるエクササイズ。ラットプルダウン、ローイングなど。',
        {
          position: 'top',
          theme: 'success',
          animation: 'slide',
          arrow: true,
          delay: 200,
        }
      );

      tooltipManager.addTooltip(
        '.muscle-group-btn[data-muscle="肩"]',
        '肩（三角筋）を鍛えるエクササイズ。ショルダープレス、サイドレイズなど。',
        {
          position: 'top',
          theme: 'warning',
          animation: 'scale',
          arrow: true,
          delay: 200,
        }
      );

      tooltipManager.addTooltip(
        '.muscle-group-btn[data-muscle="腕"]',
        '上腕二頭筋・三頭筋を鍛えるエクササイズ。アームカール、トライセップスなど。',
        {
          position: 'top',
          theme: 'primary',
          animation: 'fadeIn',
          arrow: true,
          delay: 200,
        }
      );

      tooltipManager.addTooltip(
        '.muscle-group-btn[data-muscle="脚"]',
        '脚部（大腿四頭筋・ハムストリング）を鍛えるエクササイズ。スクワット、レッグプレスなど。',
        {
          position: 'top',
          theme: 'success',
          animation: 'bounce',
          arrow: true,
          delay: 200,
        }
      );

      tooltipManager.addTooltip(
        '.muscle-group-btn[data-muscle="腹筋"]',
        '腹筋群を鍛えるエクササイズ。クランチ、プランクなど。',
        {
          position: 'top',
          theme: 'warning',
          animation: 'slide',
          arrow: true,
          delay: 200,
        }
      );

      // クイックスタートボタンのツールチップ
      tooltipManager.addTooltip(
        '#quick-start-btn',
        '推奨される筋肉部位のエクササイズを自動選択してワークアウトを開始します。',
        {
          position: 'top',
          theme: 'primary',
          animation: 'bounce',
          arrow: true,
          delay: 300,
        }
      );

      // ワークアウト開始ボタンのツールチップ
      tooltipManager.addTooltip(
        '#start-workout-btn',
        '選択したエクササイズでワークアウトを開始します。タイマーが自動で開始されます。',
        {
          position: 'top',
          theme: 'success',
          animation: 'scale',
          arrow: true,
          delay: 300,
        }
      );

      // ワークアウト終了ボタンのツールチップ
      tooltipManager.addTooltip(
        '#end-workout-btn',
        '現在のワークアウトを終了し、結果を保存します。',
        {
          position: 'top',
          theme: 'error',
          animation: 'fadeIn',
          arrow: true,
          delay: 300,
        }
      );

      // エクササイズ追加ボタンのツールチップ
      tooltipManager.addTooltip(
        '#add-exercise-btn',
        '新しいエクササイズをワークアウトに追加します。',
        {
          position: 'top',
          theme: 'primary',
          animation: 'slide',
          arrow: true,
          delay: 200,
        }
      );

      // セット追加ボタンのツールチップ
      tooltipManager.addTooltip(
        '.add-set-btn',
        'このエクササイズに新しいセットを追加します。',
        {
          position: 'top',
          theme: 'success',
          animation: 'scale',
          arrow: true,
          delay: 200,
        }
      );

      // セット削除ボタンのツールチップ
      tooltipManager.addTooltip('.remove-set-btn', 'このセットを削除します。', {
        position: 'top',
        theme: 'error',
        animation: 'fadeIn',
        arrow: true,
        delay: 200,
      });

      // エクササイズ削除ボタンのツールチップ
      tooltipManager.addTooltip(
        '.remove-exercise-btn',
        'このエクササイズをワークアウトから削除します。',
        {
          position: 'top',
          theme: 'error',
          animation: 'slide',
          arrow: true,
          delay: 200,
        }
      );

      console.log('✅ Tooltips setup complete for workout page');
    } catch (error) {
      console.error('❌ Failed to setup tooltips:', error);
    }
  }
}

// MPAInitializer用のエクスポート
// ページが読み込まれた時に自動初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Workout page DOM loaded');
  const workoutPage = new WorkoutPage();
  await workoutPage.initialize();
  window.workoutPageInstance = workoutPage;
});

export default WorkoutPage;
