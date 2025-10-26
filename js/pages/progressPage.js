// progressPage.js - プログレッシブ・オーバーロードページの機能

import { BasePage } from '../core/BasePage.js';
import { workoutDataService } from '../services/workoutDataService.js';
import { progressiveOverloadService } from '../services/progressiveOverloadService.js';
import {
  showNotification,
  safeGetElement,
  safeAsync,
} from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';

class ProgressPage extends BasePage {
  constructor() {
    super();
    this.workoutData = [];
    this.progressiveOverloadData = null;
    this.selectedExercise = null;
    this.selectedMuscleGroup = null;
    this.analysisPeriod = 90;
    this.isLoading = false;
  }

  /**
   * プログレッシブ・オーバーロードページの初期化
   */
  async initialize() {
    console.log('Progress page initializing without auth check');

    // DOMの読み込みを待つ
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // プログレッシブ・オーバーロードページのコンテンツを表示
    this.renderProgressPage();

    // データを読み込み
    await this.loadWorkoutData();
    await this.loadProgressiveOverloadData();

    // レンダリング
    this.renderProgressiveOverloadAnalysis();
    this.renderExerciseSelector();
    this.renderMuscleGroupSelector();

    // イベントリスナーを設定
    this.setupEventListeners();
  }

  /**
   * プログレッシブ・オーバーロードページ固有の初期化処理
   */
  async onInitialize() {
    console.log('Progress page initialized - User authenticated');

    // DOMの読み込みを待つ
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // 少し遅延してからページを設定
    setTimeout(async () => {
      this.renderProgressPage();
      await this.loadWorkoutData();
      await this.loadProgressiveOverloadData();
      this.renderProgressiveOverloadAnalysis();
      this.renderExerciseSelector();
      this.renderMuscleGroupSelector();
      this.setupEventListeners();
      this.setupAuthButton();
    }, 100);
  }

  /**
   * プログレッシブ・オーバーロードページのコンテンツを表示
   */
  renderProgressPage() {
    const mainContent = safeGetElement('#main-content');
    if (!mainContent) {
      return;
    }

    mainContent.innerHTML = `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">プログレッシブ・オーバーロード</h1>
        <p class="mt-2 text-gray-600">
          トレーニングの進歩を定量的に分析し、最適なローテーションを計画しましょう
        </p>
      </div>

      <!-- 分析期間選択 -->
      <div class="bg-white shadow rounded-lg mb-8">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">分析設定</h3>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <label class="text-sm text-gray-600">分析期間:</label>
                <select id="analysis-period" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="30">30日</option>
                  <option value="60">60日</option>
                  <option value="90" selected>90日</option>
                  <option value="180">180日</option>
                </select>
              </div>
              <button id="refresh-analysis" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                <i class="fas fa-sync-alt mr-2"></i>分析を更新
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 総合分析 -->
      <div class="bg-white shadow rounded-lg mb-8">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">総合分析</h3>
          <div id="overall-analysis">
            <div class="text-center text-gray-500 py-4">
              <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
              <p>分析データを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- エクササイズ別分析 -->
      <div class="bg-white shadow rounded-lg mb-8">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">エクササイズ別分析</h3>
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-600">エクササイズ:</label>
              <select id="exercise-selector" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">エクササイズを選択</option>
              </select>
            </div>
          </div>
          <div id="exercise-analysis">
            <div class="text-center text-gray-500 py-8">
              <i class="fas fa-dumbbell text-4xl text-gray-300 mb-4"></i>
              <p>エクササイズを選択して詳細分析を表示</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 筋肉部位別分析 -->
      <div class="bg-white shadow rounded-lg mb-8">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">筋肉部位別分析</h3>
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-600">筋肉部位:</label>
              <select id="muscle-group-selector" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">筋肉部位を選択</option>
              </select>
            </div>
          </div>
          <div id="muscle-group-analysis">
            <div class="text-center text-gray-500 py-8">
              <i class="fas fa-muscle text-4xl text-gray-300 mb-4"></i>
              <p>筋肉部位を選択して詳細分析を表示</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 推奨事項 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">推奨事項</h3>
          <div id="recommendations">
            <div class="text-center text-gray-500 py-4">
              <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
              <p>推奨事項を生成中...</p>
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
      console.log('Loading workout data...');

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

      console.log(`Loaded ${this.workoutData.length} workouts for progress analysis`);
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
        const progressFactor = Math.max(0, (90 - i) / 90);
        const weight = Math.floor(baseWeight + progressFactor * 20);

        sampleData.push({
          id: `sample-${i}`,
          date: date.toISOString().split('T')[0],
          muscle_groups: randomMuscles,
          exercises: [
            { name: 'ベンチプレス', sets: 3, reps: 10, weight },
            { name: 'プッシュアップ', sets: 3, reps: 15, weight: 0 },
            { name: 'スクワット', sets: 3, reps: 12, weight: Math.floor(weight * 0.8) },
          ],
          duration: 45 + Math.floor(Math.random() * 30),
          notes: 'サンプルワークアウト',
        });
      }
    }

    return sampleData;
  }

  /**
   * 総合分析をレンダリング
   */
  renderProgressiveOverloadAnalysis() {
    const container = safeGetElement('#overall-analysis');
    if (!container) {
      console.warn('Overall analysis container not found');
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
      <div>
        <h4 class="text-md font-medium text-gray-700 mb-3">総合推奨事項</h4>
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
    `;
  }

  /**
   * エクササイズセレクターをレンダリング
   */
  renderExerciseSelector() {
    const selector = safeGetElement('#exercise-selector');
    if (!selector) return;

    // エクササイズ一覧を取得
    const exercises = new Set();
    this.workoutData.forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        if (exercise.name) exercises.add(exercise.name);
      });
    });

    selector.innerHTML = `
      <option value="">エクササイズを選択</option>
      ${Array.from(exercises).map(exercise => `
        <option value="${exercise}">${exercise}</option>
      `).join('')}
    `;
  }

  /**
   * 筋肉部位セレクターをレンダリング
   */
  renderMuscleGroupSelector() {
    const selector = safeGetElement('#muscle-group-selector');
    if (!selector) return;

    // 筋肉部位一覧を取得
    const muscleGroups = new Set();
    this.workoutData.forEach(workout => {
      (workout.muscle_groups || []).forEach(muscle => {
        muscleGroups.add(muscle);
      });
    });

    selector.innerHTML = `
      <option value="">筋肉部位を選択</option>
      ${Array.from(muscleGroups).map(muscle => `
        <option value="${muscle}">${this.getMuscleGroupName(muscle)}</option>
      `).join('')}
    `;
  }

  /**
   * 筋肉部位名を取得
   */
  getMuscleGroupName(muscleId) {
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
        this.renderProgressiveOverloadAnalysis();
      });
    }

    // 分析更新ボタン
    const refreshBtn = safeGetElement('#refresh-analysis');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.loadProgressiveOverloadData();
        this.renderProgressiveOverloadAnalysis();
        showNotification('分析を更新しました', 'success');
      });
    }

    // エクササイズ選択
    const exerciseSelector = safeGetElement('#exercise-selector');
    if (exerciseSelector) {
      exerciseSelector.addEventListener('change', async (event) => {
        this.selectedExercise = event.target.value;
        if (this.selectedExercise) {
          await this.renderExerciseAnalysis(this.selectedExercise);
        }
      });
    }

    // 筋肉部位選択
    const muscleGroupSelector = safeGetElement('#muscle-group-selector');
    if (muscleGroupSelector) {
      muscleGroupSelector.addEventListener('change', async (event) => {
        this.selectedMuscleGroup = event.target.value;
        if (this.selectedMuscleGroup) {
          await this.renderMuscleGroupAnalysis(this.selectedMuscleGroup);
        }
      });
    }
  }

  /**
   * エクササイズ分析をレンダリング
   */
  async renderExerciseAnalysis(exerciseName) {
    const container = safeGetElement('#exercise-analysis');
    if (!container) return;

    try {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-4">
          <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
          <p>${exerciseName}の分析を読み込み中...</p>
        </div>
      `;

      const analysis = await progressiveOverloadService.getExerciseProgress(exerciseName, this.analysisPeriod);
      
      container.innerHTML = `
        <div class="space-y-6">
          <!-- 進歩メトリクス -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">${analysis.progressMetrics.volumeProgression}%</div>
              <div class="text-sm text-gray-600">ボリューム進歩</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">${analysis.progressMetrics.intensityProgression}%</div>
              <div class="text-sm text-gray-600">強度進歩</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">${analysis.progressMetrics.consistencyScore}</div>
              <div class="text-sm text-gray-600">一貫性スコア</div>
            </div>
          </div>

          <!-- 詳細統計 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 border border-gray-200 rounded-lg">
              <div class="text-xl font-bold text-gray-800">${analysis.progressMetrics.averageWeight}kg</div>
              <div class="text-sm text-gray-600">平均重量</div>
            </div>
            <div class="text-center p-4 border border-gray-200 rounded-lg">
              <div class="text-xl font-bold text-gray-800">${analysis.progressMetrics.averageReps}</div>
              <div class="text-sm text-gray-600">平均レップ数</div>
            </div>
            <div class="text-center p-4 border border-gray-200 rounded-lg">
              <div class="text-xl font-bold text-gray-800">${analysis.progressMetrics.averageSets}</div>
              <div class="text-sm text-gray-600">平均セット数</div>
            </div>
          </div>

          <!-- 推奨事項 -->
          <div>
            <h4 class="text-md font-medium text-gray-700 mb-3">推奨事項</h4>
            <div class="space-y-3">
              ${analysis.recommendations.map(rec => `
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
        </div>
      `;
    } catch (error) {
      console.error('Error rendering exercise analysis:', error);
      container.innerHTML = `
        <div class="text-center text-red-500 py-4">
          <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
          <p>エクササイズ分析の読み込みに失敗しました</p>
        </div>
      `;
    }
  }

  /**
   * 筋肉部位分析をレンダリング
   */
  async renderMuscleGroupAnalysis(muscleGroup) {
    const container = safeGetElement('#muscle-group-analysis');
    if (!container) return;

    try {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-4">
          <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
          <p>${this.getMuscleGroupName(muscleGroup)}の分析を読み込み中...</p>
        </div>
      `;

      const analysis = await progressiveOverloadService.getMuscleGroupProgress(muscleGroup, this.analysisPeriod);
      
      container.innerHTML = `
        <div class="space-y-6">
          <!-- 基本統計 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">${analysis.totalSessions}</div>
              <div class="text-sm text-gray-600">総セッション数</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">${analysis.frequencyAnalysis.frequencyScore}</div>
              <div class="text-sm text-gray-600">頻度スコア</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">${analysis.frequencyAnalysis.averageDaysBetween}日</div>
              <div class="text-sm text-gray-600">平均間隔</div>
            </div>
          </div>

          <!-- エクササイズ一覧 -->
          <div>
            <h4 class="text-md font-medium text-gray-700 mb-3">エクササイズ一覧</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${Object.entries(analysis.exercises.exerciseCounts).map(([exercise, count]) => `
                <div class="border border-gray-200 rounded-lg p-4">
                  <h5 class="font-medium text-gray-800 mb-2">${exercise}</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">実施回数:</span>
                      <span class="font-medium">${count}回</span>
                    </div>
                    ${analysis.exercises.exerciseProgress[exercise] ? `
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">重量進歩:</span>
                        <span class="font-medium ${analysis.exercises.exerciseProgress[exercise].weightProgress > 0 ? 'text-green-600' : 'text-red-600'}">
                          ${analysis.exercises.exerciseProgress[exercise].weightProgress > 0 ? '+' : ''}${analysis.exercises.exerciseProgress[exercise].weightProgress}%
                        </span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 推奨事項 -->
          <div>
            <h4 class="text-md font-medium text-gray-700 mb-3">推奨事項</h4>
            <div class="space-y-3">
              ${analysis.recommendations.map(rec => `
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
        </div>
      `;
    } catch (error) {
      console.error('Error rendering muscle group analysis:', error);
      container.innerHTML = `
        <div class="text-center text-red-500 py-4">
          <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
          <p>筋肉部位分析の読み込みに失敗しました</p>
        </div>
      `;
    }
  }

  /**
   * 認証ボタンを設定
   */
  setupAuthButton() {
    const authButton = document.getElementById('auth-button');
    if (authButton) {
      authButton.addEventListener('click', () => {
        authManager.showAuthModal('login');
      });
    }
  }
}

// ページが読み込まれた時に自動初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Progress page DOM loaded');
  const progressPage = new ProgressPage();
  await progressPage.initialize();
  window.progressPageInstance = progressPage;
});

export default new ProgressPage();