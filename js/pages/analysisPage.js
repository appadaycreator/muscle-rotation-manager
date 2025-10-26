// analysisPage.js - 分析ページの機能

import { authManager } from '../modules/authManager.js';
import { workoutDataService } from '../services/workoutDataService.js';
import { progressiveOverloadService } from '../services/progressiveOverloadService.js';
import {
  showNotification,
  safeAsync,
  safeGetElement,
} from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';

class AnalysisPage {
  constructor() {
    this.workoutData = [];
    this.charts = {};
    this.isLoading = false;
    this.progressiveOverloadData = null;
    this.selectedExercise = null;
    this.selectedMuscleGroup = null;
    this.analysisPeriod = 90; // デフォルト90日
  }

  /**
   * 分析ページを初期化
   */
  async initialize() {
    console.log('Analysis page initialized');

    // 認証チェックをスキップして分析ページを表示
    await safeAsync(
      async () => {
        // 分析ページのコンテンツを表示
        this.renderAnalysisPage();

        await this.loadWorkoutData();
        await this.loadProgressiveOverloadData();
        this.renderStatistics();
        this.renderProgressiveOverloadSection();
        this.renderCharts();
        this.generateAnalysisReport();
        this.setupEventListeners();
      },
      '分析ページの初期化',
      (error) => {
        handleError(error, {
          context: '分析ページ初期化',
          showNotification: true,
        });
      }
    );
  }

  /**
   * ログインプロンプトを表示
   */
  showLoginPrompt() {
    const mainContent = safeGetElement('#main-content');
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
                        <p class="text-gray-600 mb-6">分析機能を使用するにはログインしてください。</p>
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
   * 分析ページのコンテンツを表示
   */
  renderAnalysisPage() {
    const mainContent = safeGetElement('#main-content');
    if (!mainContent) {
      return;
    }

    mainContent.innerHTML = `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">分析</h1>
                <p class="mt-2 text-gray-600">トレーニングデータを分析し、進捗を可視化しましょう</p>
            </div>

            <!-- 総合統計 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-dumbbell text-2xl text-blue-600"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">総ワークアウト数</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="total-workouts">0</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-clock text-2xl text-green-600"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">総トレーニング時間</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="total-hours">0時間</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-chart-line text-2xl text-purple-600"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">平均セッション時間</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="avg-session-time">0時間</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 筋肉部位別統計 -->
            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">筋肉部位別統計</h3>
                    <div id="muscle-group-stats">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p>統計データを読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- プログレッシブ・オーバーロード分析 -->
            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900">プログレッシブ・オーバーロード分析</h3>
                        <div class="flex items-center space-x-2">
                            <label class="text-sm text-gray-600">期間:</label>
                            <select id="analysis-period" class="border border-gray-300 rounded-md px-2 py-1 text-sm">
                                <option value="30">30日</option>
                                <option value="60">60日</option>
                                <option value="90" selected>90日</option>
                                <option value="180">180日</option>
                            </select>
                        </div>
                    </div>
                    <div id="progressive-overload-content">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p>プログレッシブ・オーバーロード分析を読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 進歩統計 -->
            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">進歩統計</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600" id="strength-progress">-</div>
                            <div class="text-sm text-gray-500">筋力向上率</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600" id="endurance-progress">-</div>
                            <div class="text-sm text-gray-500">持久力向上率</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600" id="overall-score">-</div>
                            <div class="text-sm text-gray-500">総合スコア</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 進捗グラフ -->
            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">進捗グラフ</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- トレーニング頻度グラフ -->
                        <div>
                            <h4 class="text-md font-medium text-gray-700 mb-3">トレーニング頻度</h4>
                            <div class="h-64">
                                <canvas id="frequency-chart"></canvas>
                            </div>
                        </div>
                        
                        <!-- 部位別グラフ -->
                        <div>
                            <h4 class="text-md font-medium text-gray-700 mb-3">部位別分布</h4>
                            <div class="h-64">
                                <canvas id="muscle-group-chart"></canvas>
                            </div>
                        </div>
                        
                        <!-- 重量進歩グラフ -->
                        <div>
                            <h4 class="text-md font-medium text-gray-700 mb-3">重量進歩</h4>
                            <div class="h-64">
                                <canvas id="weight-progress-chart"></canvas>
                            </div>
                        </div>
                        
                        <!-- セット数進歩グラフ -->
                        <div>
                            <h4 class="text-md font-medium text-gray-700 mb-3">セット数進歩</h4>
                            <div class="h-64">
                                <canvas id="sets-progress-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 詳細統計 -->
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">詳細統計</h3>
                    <div id="detailed-stats">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p>詳細データを読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 分析レポート -->
            <div class="bg-white shadow rounded-lg mt-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">分析レポート</h3>
                    <div id="analysis-report">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p>レポートを生成中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * ワークアウトデータを読み込み
   */
  async loadWorkoutData() {
    try {
      this.isLoading = true;

      // ワークアウトデータサービスから読み込み
      this.workoutData = await workoutDataService.loadWorkouts({ limit: 1000 });

      // サンプルデータを追加（デモ用）
      if (this.workoutData.length === 0) {
        this.workoutData = this.generateSampleWorkoutData();
        
        // サンプルデータを保存
        for (const workout of this.workoutData) {
          await workoutDataService.saveWorkout(workout);
        }
      }

      console.log(`Loaded ${this.workoutData.length} workouts for analysis`);
    } catch (error) {
      console.error('Error loading workout data:', error);
      this.workoutData = this.generateSampleWorkoutData();
      showNotification('ワークアウトデータの読み込みに失敗しました', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * プログレッシブ・オーバーロードデータを読み込み
   */
  async loadProgressiveOverloadData() {
    try {
      console.log('Loading progressive overload data...');
      this.progressiveOverloadData = await progressiveOverloadService.getOverallProgress(this.analysisPeriod);
      console.log('Progressive overload data loaded:', this.progressiveOverloadData);
    } catch (error) {
      console.error('Error loading progressive overload data:', error);
      showNotification('プログレッシブ・オーバーロードデータの読み込みに失敗しました', 'error');
    }
  }

  /**
   * サンプルワークアウトデータを生成
   * @returns {Array} サンプルワークアウトデータ配列
   */
  generateSampleWorkoutData() {
    const today = new Date();
    const sampleData = [];

    // 過去90日分のサンプルデータを生成
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // 2-3日に1回の頻度でワークアウトを生成
      if (i % 2 === 0 || i % 3 === 0) {
        const muscleGroups = ['胸', '背中', '肩', '腕', '脚', '腹筋'];
        const randomMuscles = muscleGroups
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);

        // 重量の進歩をシミュレート
        const baseWeight = 80;
        const progressFactor = Math.max(0, (90 - i) / 90); // 時間とともに重量が増加
        const weight = Math.floor(baseWeight + progressFactor * 20);

        sampleData.push({
          id: `sample-${i}`,
          date: date.toISOString().split('T')[0],
          muscle_groups: randomMuscles,
          exercises: [
            { name: 'ベンチプレス', sets: 3, reps: 10, weight },
            { name: 'プッシュアップ', sets: 3, reps: 15, weight: 0 },
          ],
          duration: 45 + Math.floor(Math.random() * 30), // 45-75分
          notes: 'サンプルワークアウト',
        });
      }
    }

    return sampleData;
  }

  /**
   * 統計情報をレンダリング
   */
  renderStatistics() {
    this.renderOverallStats();
    this.renderMuscleGroupStats();
    this.renderProgressStats();
  }

  /**
   * プログレッシブ・オーバーロードセクションをレンダリング
   */
  renderProgressiveOverloadSection() {
    const container = safeGetElement('#progressive-overload-content');
    if (!container) {
      console.warn('Progressive overload container not found');
      return;
    }

    if (!this.progressiveOverloadData) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-4">
          <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
          <p>プログレッシブ・オーバーロードデータがありません</p>
        </div>
      `;
      return;
    }

    const data = this.progressiveOverloadData;
    
    container.innerHTML = `
      <!-- 総合メトリクス -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">${data.totalWorkouts}</div>
          <div class="text-sm text-gray-600">総ワークアウト数</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">${data.overallMetrics.totalVolume}</div>
          <div class="text-sm text-gray-600">総ボリューム</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">${data.consistencyScore}</div>
          <div class="text-sm text-gray-600">一貫性スコア</div>
        </div>
        <div class="text-center p-4 bg-orange-50 rounded-lg">
          <div class="text-2xl font-bold text-orange-600">${data.overallMetrics.averageVolumePerWorkout}</div>
          <div class="text-sm text-gray-600">平均ボリューム</div>
        </div>
      </div>

      <!-- 筋肉部位別進歩 -->
      <div class="mb-6">
        <h4 class="text-md font-medium text-gray-700 mb-3">筋肉部位別進歩</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${Object.entries(data.muscleGroupProgress).map(([muscle, progress]) => {
            if (!progress) return '';
            return `
              <div class="border border-gray-200 rounded-lg p-4">
                <h5 class="font-medium text-gray-800 mb-2">${this.getMuscleGroupName(muscle)}</h5>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">セッション数:</span>
                    <span class="font-medium">${progress.totalSessions}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">頻度スコア:</span>
                    <span class="font-medium">${progress.frequencyAnalysis.frequencyScore}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">平均間隔:</span>
                    <span class="font-medium">${progress.frequencyAnalysis.averageDaysBetween}日</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 推奨事項 -->
      <div class="mb-6">
        <h4 class="text-md font-medium text-gray-700 mb-3">推奨事項</h4>
        <div class="space-y-3">
          ${data.recommendations.map(rec => `
            <div class="p-4 rounded-lg ${
              rec.priority === 'high' ? 'bg-red-50 border-l-4 border-red-400' :
              rec.priority === 'medium' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
              'bg-green-50 border-l-4 border-green-400'
            }">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <i class="fas ${
                    rec.priority === 'high' ? 'fa-exclamation-triangle text-red-400' :
                    rec.priority === 'medium' ? 'fa-info-circle text-yellow-400' :
                    'fa-check-circle text-green-400'
                  }"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium ${
                    rec.priority === 'high' ? 'text-red-800' :
                    rec.priority === 'medium' ? 'text-yellow-800' :
                    'text-green-800'
                  }">
                    ${rec.message}
                  </p>
                  <p class="text-sm ${
                    rec.priority === 'high' ? 'text-red-700' :
                    rec.priority === 'medium' ? 'text-yellow-700' :
                    'text-green-700'
                  } mt-1">
                    <strong>推奨アクション:</strong> ${rec.action}
                  </p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- エクササイズ別進歩 -->
      <div>
        <h4 class="text-md font-medium text-gray-700 mb-3">エクササイズ別進歩</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${Object.entries(data.exerciseProgress).slice(0, 6).map(([exercise, progress]) => {
            if (!progress) return '';
            return `
              <div class="border border-gray-200 rounded-lg p-4">
                <h5 class="font-medium text-gray-800 mb-2">${exercise}</h5>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">セッション数:</span>
                    <span class="font-medium">${progress.totalSessions}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">ボリューム進歩:</span>
                    <span class="font-medium ${progress.progressMetrics.volumeProgression > 0 ? 'text-green-600' : 'text-red-600'}">
                      ${progress.progressMetrics.volumeProgression > 0 ? '+' : ''}${progress.progressMetrics.volumeProgression}%
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">強度進歩:</span>
                    <span class="font-medium ${progress.progressMetrics.intensityProgression > 0 ? 'text-green-600' : 'text-red-600'}">
                      ${progress.progressMetrics.intensityProgression > 0 ? '+' : ''}${progress.progressMetrics.intensityProgression}%
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">平均重量:</span>
                    <span class="font-medium">${progress.progressMetrics.averageWeight}kg</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 総合統計をレンダリング
   */
  renderOverallStats() {
    const totalWorkouts = this.workoutData.length;
    const totalHours =
      this.workoutData.reduce(
        (sum, workout) => sum + (workout.duration || 0),
        0
      ) / 3600;
    const avgSessionTime = totalWorkouts > 0 ? totalHours / totalWorkouts : 0;

    // 要素の存在確認を追加
    const totalWorkoutsEl = safeGetElement('#total-workouts');
    const totalHoursEl = safeGetElement('#total-hours');
    const avgSessionTimeEl = safeGetElement('#avg-session-time');

    if (totalWorkoutsEl) {
      totalWorkoutsEl.textContent = totalWorkouts;
    }
    if (totalHoursEl) {
      totalHoursEl.textContent = `${totalHours.toFixed(1)}時間`;
    }
    if (avgSessionTimeEl) {
      avgSessionTimeEl.textContent = `${avgSessionTime.toFixed(1)}時間`;
    }
  }

  /**
   * 部位別統計をレンダリング
   */
  renderMuscleGroupStats() {
    const muscleGroupCounts = {};

    this.workoutData.forEach((workout) => {
      const muscleGroups = workout.muscle_groups || workout.muscleGroups || [];
      muscleGroups.forEach((muscle) => {
        muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
      });
    });

    const container = safeGetElement('#muscle-group-stats');
    if (!container) {
      return;
    }

    container.innerHTML = Object.entries(muscleGroupCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(
        ([muscle, count]) => `
                <div class="flex justify-between">
                    <span class="text-gray-600">${this.getMuscleGroupName(muscle)}</span>
                    <span class="font-bold text-blue-600">${count}回</span>
                </div>
            `
      )
      .join('');
  }

  /**
   * 筋肉部位名を取得
   */
  getMuscleGroupName(muscleId) {
    // 筋肉部位名のマッピング
    const muscleGroupNames = {
      chest: '胸',
      back: '背中',
      shoulders: '肩',
      arms: '腕',
      legs: '脚',
      core: '腹筋',
      胸: '胸',
      背中: '背中',
      肩: '肩',
      腕: '腕',
      脚: '脚',
      腹筋: '腹筋',
    };

    return muscleGroupNames[muscleId] || muscleId;
  }

  /**
   * 進歩統計をレンダリング
   */
  renderProgressStats() {
    // 簡易的な進歩率計算
    const recentWorkouts = this.workoutData.slice(-10);
    const olderWorkouts = this.workoutData.slice(-20, -10);

    const recentAvgWeight = this.calculateAverageWeight(recentWorkouts);
    const olderAvgWeight = this.calculateAverageWeight(olderWorkouts);

    const strengthProgress =
      olderAvgWeight > 0
        ? (((recentAvgWeight - olderAvgWeight) / olderAvgWeight) * 100).toFixed(
            1
          )
        : 0;

    // 要素の存在確認を追加
    const strengthProgressEl = safeGetElement('#strength-progress');
    const enduranceProgressEl = safeGetElement('#endurance-progress');
    const overallScoreEl = safeGetElement('#overall-score');

    if (strengthProgressEl) {
      strengthProgressEl.textContent = `${strengthProgress}%`;
    }
    if (enduranceProgressEl) {
      enduranceProgressEl.textContent = '計算中...';
    }
    if (overallScoreEl) {
      overallScoreEl.textContent = this.calculateOverallScore();
    }
  }

  /**
   * 平均重量を計算
   */
  calculateAverageWeight(workouts) {
    if (workouts.length === 0) {
      return 0;
    }

    let totalWeight = 0;
    let count = 0;

    workouts.forEach((workout) => {
      if (workout.exercises || workout.training_logs) {
        const exercises = workout.exercises || workout.training_logs || [];
        exercises.forEach((exercise) => {
          if (exercise.weights && Array.isArray(exercise.weights)) {
            exercise.weights.forEach((weight) => {
              if (weight > 0) {
                totalWeight += weight;
                count++;
              }
            });
          }
        });
      }
    });

    return count > 0 ? totalWeight / count : 0;
  }

  /**
   * 総合スコアを計算
   */
  calculateOverallScore() {
    const totalWorkouts = this.workoutData.length;
    const consistency = Math.min(totalWorkouts / 30, 1) * 100; // 30日で正規化
    const frequency = Math.min(totalWorkouts / 10, 1) * 100; // 10回で正規化

    return Math.round((consistency + frequency) / 2);
  }

  /**
   * チャートをレンダリング
   */
  async renderCharts() {
    try {
      // Chart.jsが読み込まれているかチェック
      if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        showNotification('グラフライブラリの読み込みに失敗しました', 'error');
        return;
      }

      // チャートの描画を順次実行
      await this.renderFrequencyChart();
      await this.renderMuscleGroupChart();
      await this.renderWeightProgressChart();
      await this.renderSetsProgressChart();

      console.log('All charts rendered successfully');
    } catch (error) {
      console.error('Error rendering charts:', error);
      handleError(error, {
        context: 'チャート描画',
        showNotification: true,
      });
    }
  }

  /**
   * トレーニング頻度チャートをレンダリング
   */
  async renderFrequencyChart() {
    try {
      const canvas = safeGetElement('#frequency-chart');
      if (!canvas) {
        console.warn('Frequency chart canvas not found');
        return;
      }

      const frequencyData = this.calculateFrequencyData();

      this.charts.frequency = new Chart(canvas, {
        type: 'line',
        data: {
          labels: frequencyData.labels,
          datasets: [
            {
              label: 'トレーニング回数',
              data: frequencyData.data,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
        },
      });
      console.log('Frequency chart rendered successfully');
    } catch (error) {
      console.error('Error rendering frequency chart:', error);
    }
  }

  /**
   * 部位別チャートをレンダリング
   */
  async renderMuscleGroupChart() {
    try {
      const canvas = safeGetElement('#muscle-group-chart');
      if (!canvas) {
        console.warn('Muscle group chart canvas not found');
        return;
      }

      const muscleGroupData = this.calculateMuscleGroupData();

      this.charts.muscleGroup = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: muscleGroupData.labels,
          datasets: [
            {
              data: muscleGroupData.data,
              backgroundColor: [
                '#ef4444',
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#8b5cf6',
                '#ec4899',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
        },
      });
      console.log('Muscle group chart rendered successfully');
    } catch (error) {
      console.error('Error rendering muscle group chart:', error);
    }
  }

  /**
   * 重量推移チャートをレンダリング
   */
  async renderWeightProgressChart() {
    try {
      const canvas = safeGetElement('#weight-progress-chart');
      if (!canvas) {
        console.warn('Weight progress chart canvas not found');
        return;
      }

      const weightData = this.calculateWeightProgressData();

      this.charts.weightProgress = new Chart(canvas, {
        type: 'line',
        data: {
          labels: weightData.labels,
          datasets: [
            {
              label: '平均重量 (kg)',
              data: weightData.data,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
      console.log('Weight progress chart rendered successfully');
    } catch (error) {
      console.error('Error rendering weight progress chart:', error);
    }
  }

  /**
   * セット数推移チャートをレンダリング
   */
  async renderSetsProgressChart() {
    try {
      const canvas = safeGetElement('#sets-progress-chart');
      if (!canvas) {
        console.warn('Sets progress chart canvas not found');
        return;
      }

      const setsData = this.calculateSetsProgressData();

      this.charts.setsProgress = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: setsData.labels,
          datasets: [
            {
              label: 'セット数',
              data: setsData.data,
              backgroundColor: '#8b5cf6',
              borderColor: '#7c3aed',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
        },
      });
      console.log('Sets progress chart rendered successfully');
    } catch (error) {
      console.error('Error rendering sets progress chart:', error);
    }
  }

  /**
   * 頻度データを計算
   */
  calculateFrequencyData() {
    const last30Days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    const frequencyMap = {};
    last30Days.forEach((date) => {
      frequencyMap[date] = 0;
    });

    this.workoutData.forEach((workout) => {
      const workoutDate = new Date(workout.date || workout.startTime)
        .toISOString()
        .split('T')[0];
      if (Object.prototype.hasOwnProperty.call(frequencyMap, workoutDate)) {
        frequencyMap[workoutDate]++;
      }
    });

    return {
      labels: last30Days.map((date) =>
        new Date(date).toLocaleDateString('ja-JP', {
          month: 'short',
          day: 'numeric',
        })
      ),
      data: Object.values(frequencyMap),
    };
  }

  /**
   * 部位別データを計算
   */
  calculateMuscleGroupData() {
    const muscleGroupCounts = {};

    this.workoutData.forEach((workout) => {
      const muscleGroups = workout.muscle_groups || workout.muscleGroups || [];
      muscleGroups.forEach((muscle) => {
        muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
      });
    });

    const sorted = Object.entries(muscleGroupCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    return {
      labels: sorted.map(([muscle]) => this.getMuscleGroupName(muscle)),
      data: sorted.map(([, count]) => count),
    };
  }

  /**
   * 重量進歩データを計算
   */
  calculateWeightProgressData() {
    // 簡易的な重量進歩データ
    const last10Workouts = this.workoutData.slice(-10);
    const labels = last10Workouts.map((_, index) => `セッション${index + 1}`);
    const data = last10Workouts.map((workout) =>
      this.calculateAverageWeight([workout])
    );

    return { labels, data };
  }

  /**
   * セット数進歩データを計算
   */
  calculateSetsProgressData() {
    const last10Workouts = this.workoutData.slice(-10);
    const labels = last10Workouts.map((_, index) => `セッション${index + 1}`);
    const data = last10Workouts.map((workout) => {
      if (workout.exercises || workout.training_logs) {
        const exercises = workout.exercises || workout.training_logs || [];
        return exercises.reduce(
          (sum, exercise) => sum + (exercise.sets || 0),
          0
        );
      }
      return 0;
    });

    return { labels, data };
  }

  /**
   * 分析レポートを生成
   */
  generateAnalysisReport() {
    const container = safeGetElement('#analysis-report');
    if (!container) {
      return;
    }

    const report = this.generateReport();
    container.innerHTML = report;
  }

  /**
   * レポートを生成
   */
  generateReport() {
    const totalWorkouts = this.workoutData.length;
    const totalHours =
      this.workoutData.reduce(
        (sum, workout) => sum + (workout.duration || 0),
        0
      ) / 3600;

    const muscleGroupCounts = {};
    this.workoutData.forEach((workout) => {
      const muscleGroups = workout.muscle_groups || workout.muscleGroups || [];
      muscleGroups.forEach((muscle) => {
        muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
      });
    });

    const mostTrainedMuscle = Object.entries(muscleGroupCounts).sort(
      ([, a], [, b]) => b - a
    )[0];

    return `
            <div class="space-y-4">
                <div class="p-4 bg-blue-50 rounded-lg">
                    <h4 class="font-semibold text-blue-800 mb-2">総合評価</h4>
                    <p class="text-blue-700">
                        これまでに${totalWorkouts}回のトレーニングを実施し、
                        合計${totalHours.toFixed(1)}時間のトレーニングを行いました。
                    </p>
                </div>
                
                <div class="p-4 bg-green-50 rounded-lg">
                    <h4 class="font-semibold text-green-800 mb-2">最も鍛えている部位</h4>
                    <p class="text-green-700">
                        ${
                          mostTrainedMuscle
                            ? `${this.getMuscleGroupName(mostTrainedMuscle[0])}（${mostTrainedMuscle[1]}回）`
                            : 'データが不足しています'
                        }
                    </p>
                </div>
                
                <div class="p-4 bg-yellow-50 rounded-lg">
                    <h4 class="font-semibold text-yellow-800 mb-2">推奨事項</h4>
                    <p class="text-yellow-700">
                        継続的なトレーニングを続けることで、さらなる進歩が期待できます。
                        バランスの取れたトレーニングを心がけましょう。
                    </p>
                </div>
            </div>
        `;
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // 分析期間の変更
    const periodSelect = safeGetElement('#analysis-period');
    if (periodSelect) {
      periodSelect.addEventListener('change', async (event) => {
        this.analysisPeriod = parseInt(event.target.value);
        console.log('Analysis period changed to:', this.analysisPeriod);
        
        // プログレッシブ・オーバーロードデータを再読み込み
        await this.loadProgressiveOverloadData();
        this.renderProgressiveOverloadSection();
      });
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // 分析ページのイベントリスナーを設定
    console.log('Setting up analysis page event listeners');
  }

  /**
   * チャートを破棄
   */
  destroy() {
    Object.values(this.charts).forEach((chart) => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}

// デフォルトエクスポート
const analysisPage = new AnalysisPage();
export default analysisPage;
export { AnalysisPage };
