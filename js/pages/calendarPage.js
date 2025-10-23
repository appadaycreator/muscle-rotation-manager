// calendarPage.js - カレンダーページの機能

import { supabaseService } from '../services/supabaseService.js';
import { showNotification, formatDate, getWorkoutColor } from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';

class CalendarPage {
    constructor() {
        this.currentDate = new Date();
        this.workoutData = [];
        this.selectedDate = null;
    }

    /**
     * カレンダーページを初期化
     */
    async initialize() {
        console.log('Calendar page initialized');

        try {
            await this.loadWorkoutData();
            this.setupCalendarInterface();
            this.setupEventListeners();
            this.renderCalendar();
        } catch (error) {
            console.error('Error initializing calendar page:', error);
            showNotification('カレンダーページの初期化に失敗しました', 'error');
        }
    }

    /**
     * ワークアウトデータを読み込み
     */
    async loadWorkoutData() {
        try {
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                this.workoutData = await supabaseService.getWorkouts(100);
            } else {
                // ローカルストレージから読み込み
                this.workoutData = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            }
        } catch (error) {
            console.error('Error loading workout data:', error);
            this.workoutData = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        }
    }

    /**
     * カレンダーインターフェースを設定
     */
    setupCalendarInterface() {
        const container = document.getElementById('calendar-container');
        if (!container) {return;}

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
                            <span id="current-month" class="text-lg font-semibold min-w-[200px] text-center">
                            </span>
                            <button id="next-month" 
                                    class="p-2 text-gray-600 hover:text-gray-800 
                                           hover:bg-gray-100 rounded-lg transition-colors">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- カレンダーグリッド -->
                    <div class="calendar-grid">
                        <!-- 曜日ヘッダー -->
                        <div class="grid grid-cols-7 gap-1 mb-2">
                            <div class="text-center text-sm font-medium text-gray-600 py-2">日</div>
                            <div class="text-center text-sm font-medium text-gray-600 py-2">月</div>
                            <div class="text-center text-sm font-medium text-gray-600 py-2">火</div>
                            <div class="text-center text-sm font-medium text-gray-600 py-2">水</div>
                            <div class="text-center text-sm font-medium text-gray-600 py-2">木</div>
                            <div class="text-center text-sm font-medium text-gray-600 py-2">金</div>
                            <div class="text-center text-sm font-medium text-gray-600 py-2">土</div>
                        </div>
                        
                        <!-- 日付グリッド -->
                        <div id="calendar-dates" class="grid grid-cols-7 gap-1">
                        </div>
                    </div>
                </div>

                <!-- 選択された日の詳細 -->
                <div id="date-details" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-info-circle text-green-500 mr-2"></i>
                        <span id="selected-date-title"></span>
                    </h3>
                    <div id="date-workout-list" class="space-y-3">
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
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }
    }

    /**
     * カレンダーをレンダリング
     */
    renderCalendar() {
        this.updateMonthDisplay();
        this.renderCalendarDates();
        this.renderMonthlyStats();
        this.renderMuscleStats();
    }

    /**
     * 月表示を更新
     */
    updateMonthDisplay() {
        const monthElement = document.getElementById('current-month');
        if (!monthElement) {return;}

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        monthElement.textContent = `${year}年${month}月`;
    }

    /**
     * カレンダーの日付をレンダリング
     */
    renderCalendarDates() {
        const datesContainer = document.getElementById('calendar-dates');
        if (!datesContainer) {return;}

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 月の最初の日と最後の日
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

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
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isToday(currentDate);

                dates.push({
                    date: new Date(currentDate),
                    dateStr,
                    day: currentDate.getDate(),
                    workouts,
                    isCurrentMonth,
                    isToday
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // 日付セルをレンダリング
        datesContainer.innerHTML = dates.map(dateInfo => {
            const workoutDots = dateInfo.workouts.map(workout => {
                const color = getWorkoutColor(workout.name || workout.muscle_groups?.[0] || '');
                return `<div class="w-2 h-2 ${color} rounded-full"></div>`;
            }).join('');

            return `
                <div class="calendar-date-cell h-20 p-1 border border-gray-200 
                     ${dateInfo.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-100'} 
                     ${dateInfo.isToday ? 'bg-blue-50 border-blue-300' : ''} 
                     cursor-pointer transition-colors"
                     data-date="${dateInfo.dateStr}">
                    <div class="text-sm ${dateInfo.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'} 
                         ${dateInfo.isToday ? 'font-bold text-blue-600' : ''}">
                        ${dateInfo.day}
                    </div>
                    <div class="flex flex-wrap gap-1 mt-1">
                        ${workoutDots}
                    </div>
                </div>
            `;
        }).join('');

        // 日付セルのクリックイベント
        document.querySelectorAll('.calendar-date-cell').forEach(cell => {
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
        return this.workoutData.filter(workout => {
            const workoutDate = workout.date || workout.startTime;
            if (!workoutDate) {return false;}

            const date = new Date(workoutDate);
            return this.formatDateString(date) === dateStr;
        });
    }

    /**
     * 日付を選択
     * @param {string} dateStr - 日付文字列
     */
    selectDate(dateStr) {
        this.selectedDate = dateStr;
        const workouts = this.getWorkoutsForDate(dateStr);

        const detailsContainer = document.getElementById('date-details');
        const titleElement = document.getElementById('selected-date-title');
        const listElement = document.getElementById('date-workout-list');

        if (!detailsContainer || !titleElement || !listElement) {return;}

        // タイトルを更新
        titleElement.textContent = formatDate(dateStr);

        if (workouts.length === 0) {
            listElement.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-info-circle text-xl mb-2"></i>
                    <p>この日はトレーニングを行っていません</p>
                </div>
            `;
        } else {
            listElement.innerHTML = workouts.map(workout => `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-800">
                            ${workout.name || 'ワークアウト'}
                        </h4>
                        <span class="text-sm text-gray-500">
                            ${workout.duration ? `${Math.floor(workout.duration / 60)}分` : ''}
                        </span>
                    </div>
                    <div class="text-sm text-gray-600">
                        ${Array.isArray(workout.muscle_groups) ?
        workout.muscle_groups.join(', ') :
        workout.muscle_groups || '部位不明'}
                    </div>
                </div>
            `).join('');
        }

        detailsContainer.classList.remove('hidden');
    }

    /**
     * 月間統計をレンダリング
     */
    renderMonthlyStats() {
        const statsContainer = document.getElementById('monthly-stats');
        if (!statsContainer) {return;}

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthWorkouts = this.workoutData.filter(workout => {
            const workoutDate = new Date(workout.date || workout.startTime);
            return workoutDate.getFullYear() === year && workoutDate.getMonth() === month;
        });

        const totalWorkouts = monthWorkouts.length;
        const totalDuration = monthWorkouts.reduce((sum, workout) =>
            sum + (workout.duration || 0), 0);
        const avgDuration = totalWorkouts > 0 ? Math.floor(totalDuration / totalWorkouts / 60) : 0;
        const workoutDays = new Set(monthWorkouts.map(workout =>
            this.formatDateString(new Date(workout.date || workout.startTime)))).size;

        statsContainer.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">${totalWorkouts}</div>
                <div class="text-sm text-gray-600">総ワークアウト数</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-green-600">${workoutDays}</div>
                <div class="text-sm text-gray-600">トレーニング日数</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">${Math.floor(totalDuration / 3600)}</div>
                <div class="text-sm text-gray-600">総時間（時間）</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-orange-600">${avgDuration}</div>
                <div class="text-sm text-gray-600">平均時間（分）</div>
            </div>
        `;
    }

    /**
     * 部位別統計をレンダリング
     */
    renderMuscleStats() {
        const statsContainer = document.getElementById('muscle-stats');
        if (!statsContainer) {return;}

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthWorkouts = this.workoutData.filter(workout => {
            const workoutDate = new Date(workout.date || workout.startTime);
            return workoutDate.getFullYear() === year && workoutDate.getMonth() === month;
        });

        // 部位別カウント
        const muscleCount = {};
        MUSCLE_GROUPS.forEach(group => {
            muscleCount[group.id] = 0;
        });

        monthWorkouts.forEach(workout => {
            const muscles = workout.muscle_groups || [];
            muscles.forEach(muscle => {
                if (Object.prototype.hasOwnProperty.call(muscleCount, muscle)) {
                    muscleCount[muscle]++;
                }
            });
        });

        statsContainer.innerHTML = MUSCLE_GROUPS.map(group => `
            <div class="text-center p-3 ${group.bgColor} rounded-lg">
                <div class="text-xl font-bold ${group.textColor}">
                    ${muscleCount[group.id]}
                </div>
                <div class="text-sm ${group.textColor}">
                    ${group.name}
                </div>
            </div>
        `).join('');
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
}

// デフォルトエクスポート
export default new CalendarPage();
