// calendarPage.js - カレンダーページの機能

import { supabaseService } from '../services/supabaseService.js';
import {
    showNotification,
    getMuscleColor,
    isFutureDate,
    isPastDate,
    createCalendarModalHTML,
    safeGetElement,
    showInputDialog
} from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';

class CalendarPage {
    constructor() {
        this.currentDate = new Date();
        this.workoutData = [];
        this.plannedWorkouts = [];
        this.selectedDate = null;
        this.isLoading = false;
    }

    /**
     * カレンダーページを初期化
     */
    async initialize() {
        console.log('Calendar page initialized');

        try {
            // まずカレンダーインターフェースを設定
            this.setupCalendarInterface();

            // データを読み込み
            await this.loadWorkoutData();

            // イベントリスナーを設定
            this.setupEventListeners();

            // カレンダーをレンダリング
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
            this.isLoading = true;

            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                // Supabaseからデータを取得
                this.workoutData = await supabaseService.getWorkouts(200);

                // 予定されたワークアウトも取得（将来の機能拡張用）
                this.plannedWorkouts = await this.loadPlannedWorkouts();
            } else {
                // ローカルストレージから読み込み
                this.workoutData = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
                this.plannedWorkouts = JSON.parse(localStorage.getItem('plannedWorkouts') || '[]');
            }

            console.log(`Loaded ${this.workoutData.length} workouts and ${this.plannedWorkouts.length} planned workouts`);
        } catch (error) {
            console.error('Error loading workout data:', error);
            this.workoutData = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            this.plannedWorkouts = JSON.parse(localStorage.getItem('plannedWorkouts') || '[]');
            showNotification('ワークアウトデータの読み込みに失敗しました', 'error');
        } finally {
            this.isLoading = false;
        }
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
     * カレンダーインターフェースを設定
     */
    setupCalendarInterface() {
        const container = document.getElementById('calendar-container');
        if (!container) {
            console.error('Calendar container not found');
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
                        ${MUSCLE_GROUPS.map(group => `
                            <div class="flex items-center space-x-2 p-2 rounded-lg ${group.bgColor}">
                                <div class="w-4 h-4 ${group.color} rounded-full"></div>
                                <span class="text-sm font-medium ${group.textColor}">${group.name}</span>
                            </div>
                        `).join('')}
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
        const datesContainer = safeGetElement('#calendar-dates');
        const loadingElement = safeGetElement('#calendar-loading');

        if (!datesContainer) {
            console.error('Calendar dates container not found');
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
                    isSaturday
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // 日付セルをレンダリング
        datesContainer.innerHTML = dates.map(dateInfo => {
            // 実際のワークアウトドット
            const workoutDots = dateInfo.workouts.map(workout => {
                const muscles = Array.isArray(workout.muscle_groups) ?
                    workout.muscle_groups : [workout.muscle_groups || 'chest'];
                return muscles.map(muscle => {
                    const color = getMuscleColor(muscle);
                    return `<div class="workout-dot ${color}" title="${muscle}"></div>`;
                }).join('');
            }).join('');

            // 予定されたワークアウトドット
            const plannedDots = dateInfo.plannedWorkouts.map(workout => {
                const muscles = Array.isArray(workout.muscle_groups) ?
                    workout.muscle_groups : [workout.muscle_groups || 'chest'];
                return muscles.map(muscle => {
                    const color = getMuscleColor(muscle);
                    return `<div class="workout-dot ${color} opacity-50" title="予定: ${muscle}"></div>`;
                }).join('');
            }).join('');

            // セルの背景色とスタイル
            let cellClasses = 'calendar-date-cell';

            if (!dateInfo.isCurrentMonth) {
                cellClasses += ' other-month';
            } else if (dateInfo.isToday) {
                cellClasses += ' today';
            }

            // 日曜日と土曜日の色分け
            let dayTextColor = dateInfo.isCurrentMonth ? 'text-gray-800' : 'text-gray-400';
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
                    ${dateInfo.workouts.length > 0 || dateInfo.plannedWorkouts.length > 0 ? `
                        <div class="text-xs text-gray-500 mt-1 truncate">
                            ${dateInfo.workouts.length > 0 ? `${dateInfo.workouts.length}件` : ''}
                            ${dateInfo.plannedWorkouts.length > 0 ? ` 予${dateInfo.plannedWorkouts.length}件` : ''}
                        </div>
                    ` : ''}
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
            const workoutDate = workout.date || workout.startTime || workout.workout_date;
            if (!workoutDate) {return false;}

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
        return this.plannedWorkouts.filter(workout => {
            const plannedDate = workout.planned_date || workout.date;
            if (!plannedDate) {return false;}

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
        const modalHTML = createCalendarModalHTML(dateStr, workouts, plannedWorkouts);
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
                <div class="text-2xl font-bold text-purple-600">
                    ${Math.floor(totalDuration / 3600)}
                </div>
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
                created_at: new Date().toISOString()
            };

            this.plannedWorkouts.push(plannedWorkout);

            // ローカルストレージに保存
            localStorage.setItem('plannedWorkouts', JSON.stringify(this.plannedWorkouts));

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
                workout => workout.id !== plannedWorkoutId
            );

            // ローカルストレージを更新
            localStorage.setItem('plannedWorkouts', JSON.stringify(this.plannedWorkouts));

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
window.addPlannedWorkout = async function(dateStr) {
    // カスタム入力ダイアログを使用
    const workoutName = await showInputDialog('トレーニング名を入力してください:', 'トレーニング');
    if (!workoutName) {return;}

    const muscleGroups = await showInputDialog('対象部位を入力してください (例: chest,back):', 'chest');
    const muscles = muscleGroups ? muscleGroups.split(',').map(m => m.trim()) : ['chest'];

    const calendarPage = window.calendarPageInstance;
    if (calendarPage) {
        calendarPage.addPlannedWorkout(dateStr, {
            name: workoutName,
            muscle_groups: muscles
        });

        // モーダルを閉じる
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.remove();
        }
    }
};

// デフォルトエクスポート
const calendarPage = new CalendarPage();
window.calendarPageInstance = calendarPage;
export default calendarPage;
