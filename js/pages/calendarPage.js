// calendarPage.js - カレンダーページの機能

import { BasePage } from '../core/BasePage.js';
import { workoutDataService } from '../services/workoutDataService.js';
import {
  showNotification,
  getMuscleColor,
  isFutureDate,
  isPastDate,
  createCalendarModalHTML,
  safeGetElement,
  showInputDialog,
} from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';
import { authManager } from '../modules/authManager.js';

class CalendarPage extends BasePage {
  constructor() {
    super();
    this.currentDate = new Date();
    this.workoutData = [];
    this.plannedWorkouts = [];
    this.selectedDate = null;
    this.isLoading = false;
  }

  /**
   * カレンダーページの初期化（MPAInitializerから呼ばれる）
   */
  async initialize() {
    // 認証チェックをスキップしてカレンダーを表示
    console.log('Calendar page initializing without auth check');

    // DOMの読み込みを待つ
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // カレンダーインターフェースを設定
    this.setupCalendarInterface();

    // データを読み込み
    await this.loadWorkoutData();

    // イベントリスナーを設定
    this.setupEventListeners();

    // カレンダーをレンダリング
    await this.renderCalendar();
  }

  /**
   * カレンダーページ固有の初期化処理
   * BasePageの認証チェック後に実行される
   */
  async onInitialize() {
    console.log('Calendar page initialized - User authenticated');

    // DOMの読み込みを待つ
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // 少し遅延してからカレンダーインターフェースを設定
    setTimeout(async () => {
      this.setupCalendarInterface();

      // データを読み込み
      await this.loadWorkoutData();

      // イベントリスナーを設定
      this.setupEventListeners();
      this.setupAuthButton();

      // カレンダーをレンダリング
      await this.renderCalendar();
    }, 100);
  }

  /**
   * ワークアウトデータを読み込み
   */
  async loadWorkoutData() {
    try {
      this.isLoading = true;

      // ワークアウトデータサービスから読み込み
      this.workoutData = await workoutDataService.loadWorkouts({ limit: 1000 });

      // 予定されたワークアウトを読み込み
      this.plannedWorkouts = JSON.parse(
        localStorage.getItem('plannedWorkouts') || '[]'
      );

      // データが無い場合はサンプルデータを生成
      if (this.workoutData.length === 0) {
        console.log('No workout data found, generating sample data...');
        this.workoutData = this.generateSampleWorkoutData();

        // サンプルデータを保存
        for (const workout of this.workoutData) {
          await workoutDataService.saveWorkout(workout);
        }
      }

      console.log(
        `Loaded ${this.workoutData.length} workouts and ${this.plannedWorkouts.length} planned workouts`
      );
    } catch (error) {
      console.error('Error loading workout data:', error);
      this.workoutData = this.generateSampleWorkoutData();
      this.plannedWorkouts = [];
      showNotification('ワークアウトデータの読み込みに失敗しました', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * サンプルワークアウトデータを生成
   * @returns {Array} サンプルワークアウトデータ配列
   */
  generateSampleWorkoutData() {
    const today = new Date();
    const sampleData = [];

    // 過去30日分のサンプルデータを生成
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // 3日に1回の頻度でワークアウトを生成
      if (i % 3 === 0) {
        const muscleGroups = ['胸', '背中', '肩', '腕', '脚', '腹筋'];
        const randomMuscles = muscleGroups
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);

        sampleData.push({
          id: `sample-${i}`,
          date: date.toISOString().split('T')[0],
          muscle_groups: randomMuscles,
          exercises: [
            { name: 'ベンチプレス', sets: 2, reps: 8, weight: 50 }, // セット数と重量を減らす
            { name: 'プッシュアップ', sets: 2, reps: 10, weight: 0 }, // 回数を減らす
          ],
          duration: 45,
          notes: 'サンプルワークアウト',
        });
      }
    }

    return sampleData;
  }

  /**
   * 予定されたワークアウトを読み込み（将来の機能拡張用）
   * @returns {Array} 予定されたワークアウト配列
   */
  async loadPlannedWorkouts() {
    try {
      // 将来的にはSupabaseから予定データを取得
      // 現在はローカルストレージから取得
      return JSON.parse(localStorage.getItem('plannedWorkouts') || '[]');
    } catch (error) {
      console.error('Error loading planned workouts:', error);
      return [];
    }
  }

  /**
   * ログインプロンプトを表示
   */
  showLoginPrompt() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">ログインが必要です</h2>
                    <p class="text-gray-600 mb-6">カレンダーを表示するにはログインしてください</p>
                    <button id="login-btn" data-action="login" class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
                        ログイン
                    </button>
                </div>
            `;

      document.getElementById('login-btn')?.addEventListener('click', () => {
        authManager.showAuthModal('login');
      });
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

  /**
   * カレンダーインターフェースを設定
   */
  setupCalendarInterface() {
    const container = document.getElementById('calendar-container');
    if (!container) {
      console.error('Calendar container not found');
      // 少し遅延してから再試行
      setTimeout(() => {
        const retryContainer = document.getElementById('calendar-container');
        if (retryContainer) {
          console.log('Calendar container found on retry');
          this.setupCalendarInterface();
        } else {
          console.error('Calendar container still not found after retry');
        }
      }, 200);
      return;
    }

    container.innerHTML = `
            <div class="space-y-6">
                <!-- カレンダーヘッダー -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-calendar text-blue-500 mr-2"></i>
                            トレーニングカレンダー
                        </h2>
                        <div class="flex items-center space-x-2">
                            <button id="prev-month" 
                                    class="p-2 text-gray-600 hover:text-gray-800 
                                           hover:bg-gray-100 rounded-lg transition-colors">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span id="current-month" 
                                  class="text-lg font-semibold min-w-[200px] text-center">
                            </span>
                            <button id="next-month" 
                                    class="p-2 text-gray-600 hover:text-gray-800 
                                           hover:bg-gray-100 rounded-lg transition-colors">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- カレンダーグリッド -->
                    <div class="calendar-wrapper">
                        <!-- 曜日ヘッダー -->
                        <div class="calendar-weekday-header">
                            <div class="calendar-weekday sunday">日</div>
                            <div class="calendar-weekday">月</div>
                            <div class="calendar-weekday">火</div>
                            <div class="calendar-weekday">水</div>
                            <div class="calendar-weekday">木</div>
                            <div class="calendar-weekday">金</div>
                            <div class="calendar-weekday saturday">土</div>
                        </div>
                        
                        <!-- 日付グリッド -->
                        <div class="calendar-grid">
                            <div id="calendar-dates" class="calendar-dates-container">
                                <!-- ローディング表示 -->
                                <div id="calendar-loading" class="col-span-7 text-center py-8 hidden">
                                    <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
                                    <p class="text-gray-500">カレンダーを読み込み中...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- カレンダー凡例 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-palette text-purple-500 mr-2"></i>
                        部位別色分け
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        ${MUSCLE_GROUPS.map(
                          (group) => `
                            <div class="flex items-center space-x-2 p-2 rounded-lg ${group.bgColor}">
                                <div class="w-4 h-4 ${group.color} rounded-full"></div>
                                <span class="text-sm font-medium ${group.textColor}">${group.name}</span>
                            </div>
                        `
                        ).join('')}
                    </div>
                    <div class="mt-4 text-sm text-gray-600">
                        <p><i class="fas fa-info-circle mr-1"></i>各日付の色付きドットは、その日に行ったトレーニング部位を表します</p>
                    </div>
                </div>

                <!-- 月間統計 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-bar text-purple-500 mr-2"></i>
                        月間統計
                    </h3>
                    <div id="monthly-stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    </div>
                </div>

                <!-- 部位別統計 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-dumbbell text-orange-500 mr-2"></i>
                        部位別トレーニング回数
                    </h3>
                    <div id="muscle-stats" class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // 月移動ボタン
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', async () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        console.log('Previous month clicked');
        await this.renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        console.log('Next month clicked');
        await this.renderCalendar();
      });
    }
  }

  /**
   * カレンダーをレンダリング
   */
  async renderCalendar() {
    console.log('Rendering calendar...');
    this.updateMonthDisplay();
    this.renderCalendarDates();

    // 統計の表示を少し遅延させて確実に実行
    setTimeout(async () => {
      await this.renderMonthlyStats();
      await this.renderMuscleStats();
    }, 100);
  }

  /**
   * 月表示を更新
   */
  updateMonthDisplay() {
    const monthElement = document.getElementById('current-month');
    if (!monthElement) {
      return;
    }

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    monthElement.textContent = `${year}年${month}月`;
  }

  /**
   * カレンダーの日付をレンダリング
   */
  renderCalendarDates() {
    const datesContainer = safeGetElement('#calendar-dates');
    const loadingElement = safeGetElement('#calendar-loading');

    if (!datesContainer) {
      console.error('Calendar dates container not found');
      // 少し遅延してから再試行
      setTimeout(() => {
        const retryContainer = safeGetElement('#calendar-dates');
        if (retryContainer) {
          console.log('Calendar dates container found on retry');
          this.renderCalendarDates();
        } else {
          console.error('Calendar dates container still not found after retry');
        }
      }, 200);
      return;
    }

    // ローディング表示
    if (this.isLoading && loadingElement) {
      loadingElement.classList.remove('hidden');
      return;
    } else if (loadingElement) {
      loadingElement.classList.add('hidden');
    }

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // 月の最初の日
    const firstDay = new Date(year, month, 1);

    // 最初の週の開始日（日曜日から）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const currentDate = new Date(startDate);

    // 6週間分の日付を生成
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = this.formatDateString(currentDate);
        const workouts = this.getWorkoutsForDate(dateStr);
        const plannedWorkouts = this.getPlannedWorkoutsForDate(dateStr);
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = this.isToday(currentDate);
        const isFuture = isFutureDate(dateStr);
        const isPast = isPastDate(dateStr);
        const isSunday = currentDate.getDay() === 0;
        const isSaturday = currentDate.getDay() === 6;

        dates.push({
          date: new Date(currentDate),
          dateStr,
          day: currentDate.getDate(),
          workouts,
          plannedWorkouts,
          isCurrentMonth,
          isToday,
          isFuture,
          isPast,
          isSunday,
          isSaturday,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // 日付セルをレンダリング
    datesContainer.innerHTML = dates
      .map((dateInfo) => {
        // 実際のワークアウトドット
        const workoutDots = dateInfo.workouts
          .map((workout) => {
            const muscles = Array.isArray(workout.muscle_groups)
              ? workout.muscle_groups
              : [workout.muscle_groups || 'chest'];
            return muscles
              .map((muscle) => {
                const color = getMuscleColor(muscle);
                return `<div class="workout-dot ${color}" title="${muscle} - ${workout.exercises?.length || 0}種目"></div>`;
              })
              .join('');
          })
          .join('');

        // 予定されたワークアウトドット
        const plannedDots = dateInfo.plannedWorkouts
          .map((workout) => {
            const muscles = Array.isArray(workout.muscle_groups)
              ? workout.muscle_groups
              : [workout.muscle_groups || 'chest'];
            return muscles
              .map((muscle) => {
                const color = getMuscleColor(muscle);
                return `<div class="workout-dot ${color} opacity-50" title="予定: ${muscle}"></div>`;
              })
              .join('');
          })
          .join('');

        // セルの背景色とスタイル
        let cellClasses = 'calendar-date-cell';

        if (!dateInfo.isCurrentMonth) {
          cellClasses += ' other-month';
        } else if (dateInfo.isToday) {
          cellClasses += ' today';
        }

        // 日曜日と土曜日の色分け
        let dayTextColor = dateInfo.isCurrentMonth
          ? 'text-gray-800'
          : 'text-gray-400';
        if (dateInfo.isToday) {
          dayTextColor = 'text-blue-600 font-bold';
        } else if (dateInfo.isSunday && dateInfo.isCurrentMonth) {
          dayTextColor = 'text-red-500';
        } else if (dateInfo.isSaturday && dateInfo.isCurrentMonth) {
          dayTextColor = 'text-blue-500';
        }

        return `
                <div class="${cellClasses}" data-date="${dateInfo.dateStr}">
                    <div class="date-number ${dayTextColor}">
                        ${dateInfo.day}
                    </div>
                    <div class="workout-dots">
                        ${workoutDots}
                        ${plannedDots}
                    </div>
                    ${
                      dateInfo.workouts.length > 0 ||
                      dateInfo.plannedWorkouts.length > 0
                        ? `
                        <div class="text-xs text-gray-500 mt-1 truncate">
                            ${dateInfo.workouts.length > 0 ? `${dateInfo.workouts.length}件` : ''}
                            ${dateInfo.plannedWorkouts.length > 0 ? ` 予${dateInfo.plannedWorkouts.length}件` : ''}
                        </div>
                    `
                        : ''
                    }
                    ${
                      dateInfo.workouts.length > 0
                        ? `
                        <div class="text-xs text-gray-400 mt-1">
                            ${Math.floor(dateInfo.workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60)}分
                        </div>
                    `
                        : ''
                    }
                </div>
            `;
      })
      .join('');

    // 日付セルのクリックイベント
    document.querySelectorAll('.calendar-date-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        const dateStr = cell.dataset.date;
        this.selectDate(dateStr);
      });
    });
  }

  /**
   * 指定日のワークアウトを取得
   * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
   * @returns {Array} ワークアウト配列
   */
  getWorkoutsForDate(dateStr) {
    return this.workoutData.filter((workout) => {
      const workoutDate =
        workout.date || workout.startTime || workout.workout_date;
      if (!workoutDate) {
        return false;
      }

      const date = new Date(workoutDate);
      return this.formatDateString(date) === dateStr;
    });
  }

  /**
   * 指定日の予定されたワークアウトを取得
   * @param {string} dateStr - 日付文字列 (YYYY-MM-DD)
   * @returns {Array} 予定されたワークアウト配列
   */
  getPlannedWorkoutsForDate(dateStr) {
    return this.plannedWorkouts.filter((workout) => {
      const plannedDate = workout.planned_date || workout.date;
      if (!plannedDate) {
        return false;
      }

      const date = new Date(plannedDate);
      return this.formatDateString(date) === dateStr;
    });
  }

  /**
   * 日付を選択してモーダルを表示
   * @param {string} dateStr - 日付文字列
   */
  selectDate(dateStr) {
    this.selectedDate = dateStr;
    const workouts = this.getWorkoutsForDate(dateStr);
    const plannedWorkouts = this.getPlannedWorkoutsForDate(dateStr);

    // 既存のモーダルを削除
    const existingModal = document.getElementById('calendar-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 新しいモーダルを作成
    const modalHTML = createCalendarModalHTML(
      dateStr,
      workouts,
      plannedWorkouts
    );
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // モーダルのクリックイベント（背景クリックで閉じる）
    const modal = document.getElementById('calendar-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      // ESCキーで閉じる
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          modal.remove();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    }
  }

  /**
   * 部位別統計を計算
   * @param {Object} muscleGroups - 筋肉部位別カウント
   * @param {Object} muscleGroupDuration - 部位別時間データ
   * @param {Object} muscleGroupSets - 部位別セット数データ
   * @returns {Object} 部位別統計データ
   */
  calculateMuscleGroupStats(muscleGroups, muscleGroupDuration = {}, muscleGroupSets = {}) {
    const muscleGroupNames = {
      chest: '胸',
      back: '背中',
      shoulders: '肩',
      arms: '腕',
      legs: '脚',
      core: '腹筋',
    };

    const stats = {};
    Object.entries(muscleGroups).forEach(([muscleGroup, count]) => {
      const displayName = muscleGroupNames[muscleGroup] || muscleGroup;
      const duration = Math.round(muscleGroupDuration[muscleGroup] || 0);
      const sets = muscleGroupSets[muscleGroup] || 0;
      
      stats[muscleGroup] = {
        name: displayName,
        count: count,
        duration: duration,
        sets: sets,
        percentage: 0, // 後で計算
      };
    });

    // パーセンテージを計算
    const totalCount = Object.values(stats).reduce(
      (sum, stat) => sum + stat.count,
      0
    );
    Object.values(stats).forEach((stat) => {
      stat.percentage =
        totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
    });

    return stats;
  }

  /**
   * 部位別統計をレンダリング
   * @param {Object} muscleGroupStats - 部位別統計データ
   */
  async renderMuscleGroupStats(muscleGroupStats) {
    const muscleStatsContainer = document.getElementById('muscle-stats');
    if (!muscleStatsContainer) {
      console.log('Muscle stats container not found');
      return;
    }

    if (Object.keys(muscleGroupStats).length === 0) {
      muscleStatsContainer.innerHTML = `
        <div class="text-center col-span-6">
          <div class="text-gray-500">
            <i class="fas fa-info-circle mr-2"></i>
            部位別統計データがありません
          </div>
        </div>
      `;
      return;
    }

    const muscleGroupColors = {
      chest: 'bg-red-50 text-red-600',
      back: 'bg-blue-50 text-blue-600',
      shoulders: 'bg-green-50 text-green-600',
      arms: 'bg-yellow-50 text-yellow-600',
      legs: 'bg-purple-50 text-purple-600',
      core: 'bg-pink-50 text-pink-600',
    };

    muscleStatsContainer.innerHTML = Object.entries(muscleGroupStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([muscleGroup, stat]) => {
        const colorClass =
          muscleGroupColors[muscleGroup] || 'bg-gray-50 text-gray-600';
        return `
          <div class="text-center p-3 ${colorClass} rounded-lg relative group">
            <div class="text-xl font-bold">
              ${stat.count}
            </div>
            <div class="text-sm">
              ${stat.name}
            </div>
            <div class="text-xs mt-1 opacity-75">
              ${stat.percentage}%
            </div>
            <div class="text-xs mt-1 opacity-60">
              ${stat.duration}分
            </div>
            <div class="text-xs mt-1 opacity-60">
              ${stat.sets}セット
            </div>
            <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <i class="fas fa-info-circle text-xs cursor-help" 
                 title="回数: ${stat.count}回, 時間: ${stat.duration}分, セット数: ${stat.sets}セット"></i>
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * 月間統計をレンダリング
   */
  async renderMonthlyStats() {
    const statsContainer = document.getElementById('monthly-stats');
    if (!statsContainer) {
      console.log('Monthly stats container not found');
      return;
    }

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    try {
      console.log(`Calculating stats for ${year}-${month + 1}`);

      // ワークアウトデータサービスから統計を取得
      const stats = await workoutDataService.getMonthlyStats(year, month);

      console.log('Monthly stats:', stats);

      // データが無い場合の表示
      if (stats.totalWorkouts === 0) {
        statsContainer.innerHTML = `
            <div class="text-center col-span-4">
                <div class="text-gray-500">
                    <i class="fas fa-info-circle mr-2"></i>
                    この月のワークアウトデータがありません
                </div>
            </div>
        `;
        return;
      }

      // 部位別統計を計算（時間とセット数も含む）
      const muscleGroupStats = this.calculateMuscleGroupStats(
        stats.muscleGroups,
        stats.muscleGroupDuration,
        stats.muscleGroupSets
      );

      statsContainer.innerHTML = `
            <div class="text-center p-4 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">${stats.totalWorkouts}</div>
                <div class="text-sm text-gray-600">総ワークアウト数</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">${stats.workoutDaysCount}</div>
                <div class="text-sm text-gray-600">トレーニング日数</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">
                    ${Math.floor(stats.totalDuration / 3600)}h ${Math.floor((stats.totalDuration % 3600) / 60)}m
                </div>
                <div class="text-sm text-gray-600">総時間</div>
            </div>
            <div class="text-center p-4 bg-orange-50 rounded-lg">
                <div class="text-2xl font-bold text-orange-600">${Math.floor(stats.averageDuration / 60)}分</div>
                <div class="text-sm text-gray-600">平均時間</div>
            </div>
        `;

      // 部位別統計を表示
      await this.renderMuscleGroupStats(muscleGroupStats);
    } catch (error) {
      console.error('Error rendering monthly stats:', error);
      statsContainer.innerHTML = `
            <div class="text-center col-span-4">
                <div class="text-red-500">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    統計データの読み込みに失敗しました
                </div>
            </div>
        `;
    }
  }

  /**
   * 部位別統計をレンダリング
   */
  async renderMuscleStats() {
    const statsContainer = document.getElementById('muscle-stats');
    if (!statsContainer) {
      console.log('Muscle stats container not found');
      return;
    }

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    try {
      console.log(`Calculating muscle stats for ${year}-${month + 1}`);

      // ワークアウトデータサービスから部位別統計を取得
      const muscleStats = await workoutDataService.getMuscleGroupStats(
        year,
        month
      );

      console.log('Muscle stats:', muscleStats);

      // MUSCLE_GROUPSの順序で表示
      statsContainer.innerHTML = MUSCLE_GROUPS.map((group) => {
        const stats = muscleStats[group.id] || {
          count: 0,
          totalDuration: 0,
          exercises: [],
        };
        return `
            <div class="text-center p-3 ${group.bgColor} rounded-lg hover:shadow-md transition-shadow">
                <div class="text-xl font-bold ${group.textColor}">
                    ${stats.count}
                </div>
                <div class="text-sm ${group.textColor} font-medium">
                    ${group.name}
                </div>
                ${
                  stats.count > 0
                    ? `
                    <div class="text-xs ${group.textColor} opacity-75 mt-1">
                        ${Math.floor(stats.totalDuration / 60)}分
                    </div>
                `
                    : `
                    <div class="text-xs ${group.textColor} opacity-50 mt-1">
                        未実施
                    </div>
                `
                }
            </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error rendering muscle stats:', error);
      statsContainer.innerHTML = `
            <div class="text-center col-span-6">
                <div class="text-red-500">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    部位別統計の読み込みに失敗しました
                </div>
            </div>
        `;
    }
  }

  /**
   * 日付を文字列にフォーマット
   * @param {Date} date - 日付オブジェクト
   * @returns {string} YYYY-MM-DD形式の文字列
   */
  formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 今日かどうかチェック
   * @param {Date} date - チェックする日付
   * @returns {boolean} 今日かどうか
   */
  isToday(date) {
    const today = new Date();
    return this.formatDateString(date) === this.formatDateString(today);
  }

  /**
   * 予定されたワークアウトを追加
   * @param {string} dateStr - 日付文字列
   * @param {Object} workoutData - ワークアウトデータ
   */
  async addPlannedWorkout(dateStr, workoutData) {
    try {
      const plannedWorkout = {
        id: `planned_${Date.now()}`,
        planned_date: dateStr,
        name: workoutData.name || 'トレーニング予定',
        muscle_groups: workoutData.muscle_groups || ['chest'],
        created_at: new Date().toISOString(),
      };

      this.plannedWorkouts.push(plannedWorkout);

      // ローカルストレージに保存
      localStorage.setItem(
        'plannedWorkouts',
        JSON.stringify(this.plannedWorkouts)
      );

      // カレンダーを再描画
      this.renderCalendar();

      showNotification('トレーニング予定を追加しました', 'success');
    } catch (error) {
      console.error('Error adding planned workout:', error);
      showNotification('予定の追加に失敗しました', 'error');
    }
  }

  /**
   * 予定されたワークアウトを削除
   * @param {string} plannedWorkoutId - 予定ID
   */
  async removePlannedWorkout(plannedWorkoutId) {
    try {
      this.plannedWorkouts = this.plannedWorkouts.filter(
        (workout) => workout.id !== plannedWorkoutId
      );

      // ローカルストレージを更新
      localStorage.setItem(
        'plannedWorkouts',
        JSON.stringify(this.plannedWorkouts)
      );

      // カレンダーを再描画
      this.renderCalendar();

      showNotification('予定を削除しました', 'success');
    } catch (error) {
      console.error('Error removing planned workout:', error);
      showNotification('予定の削除に失敗しました', 'error');
    }
  }
}

// グローバル関数として予定追加機能を公開
window.addPlannedWorkout = async function (dateStr) {
  // カスタム入力ダイアログを使用
  const workoutName = await showInputDialog(
    'トレーニング名を入力してください:',
    'トレーニング'
  );
  if (!workoutName) {
    return;
  }

  const muscleGroups = await showInputDialog(
    '対象部位を入力してください (例: chest,back):',
    'chest'
  );
  const muscles = muscleGroups
    ? muscleGroups.split(',').map((m) => m.trim())
    : ['chest'];

  const calendarPage = window.calendarPageInstance;
  if (calendarPage) {
    calendarPage.addPlannedWorkout(dateStr, {
      name: workoutName,
      muscle_groups: muscles,
    });

    // モーダルを閉じる
    const modal = document.getElementById('calendar-modal');
    if (modal) {
      modal.remove();
    }
  }
};

// ページが読み込まれた時に自動初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Calendar page DOM loaded');
  const calendarPage = new CalendarPage();
  await calendarPage.initialize();
  window.calendarPageInstance = calendarPage;
});

export default new CalendarPage();
