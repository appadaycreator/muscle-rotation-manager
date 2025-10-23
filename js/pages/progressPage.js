/**
 * プログレッシブ・オーバーロード追跡ページ
 * 進捗グラフ、1RM計算、目標設定・達成度表示を管理
 */

import { progressTrackingService } from '../services/progressTrackingService.js';
import { chartService } from '../services/chartService.js';
import { supabaseService } from '../services/supabaseService.js';
import { errorHandler } from '../utils/errorHandler.js';
import { safeGetElement, safeGetElements } from '../utils/helpers.js';

class ProgressPage {
    constructor() {
        this.currentUser = null;
        this.selectedExercise = null;
        this.progressData = [];
        this.goalsData = [];
        this.isInitialized = false;
    }

    /**
     * ページを初期化
     */
    async init() {
        try {
            this.currentUser = await supabaseService.getCurrentUser();
            if (!this.currentUser) {
                throw new Error('ユーザーが認証されていません');
            }

            await this.render();
            await this.bindEvents();
            await this.loadExercises();
            this.isInitialized = true;
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.init');
        }
    }

    /**
     * ページをレンダリング
     */
    async render() {
        const main = safeGetElement('main');
        if (!main) {return;}

        main.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <!-- ヘッダー -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">
                        <i class="fas fa-chart-line text-blue-500 mr-3"></i>
                        プログレッシブ・オーバーロード追跡
                    </h1>
                    <p class="text-gray-600">筋力向上を数値で追跡し、目標達成をサポートします</p>
                </div>

                <!-- エクササイズ選択 -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-dumbbell text-purple-500 mr-2"></i>
                        エクササイズ選択
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="muscle-group-select" class="block text-sm font-medium text-gray-700 mb-2">
                                筋肉部位
                            </label>
                            <select id="muscle-group-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">筋肉部位を選択</option>
                            </select>
                        </div>
                        <div>
                            <label for="exercise-select" class="block text-sm font-medium text-gray-700 mb-2">
                                エクササイズ
                            </label>
                            <select id="exercise-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled>
                                <option value="">エクササイズを選択</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 統計サマリー -->
                <div id="stats-summary" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" style="display: none;">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100 text-sm">現在の1RM</p>
                                <p id="current-1rm" class="text-2xl font-bold">0 kg</p>
                            </div>
                            <i class="fas fa-trophy text-3xl text-blue-200"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100 text-sm">最大重量</p>
                                <p id="max-weight" class="text-2xl font-bold">0 kg</p>
                            </div>
                            <i class="fas fa-weight-hanging text-3xl text-green-200"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100 text-sm">進歩率</p>
                                <p id="improvement-rate" class="text-2xl font-bold">0%</p>
                            </div>
                            <i class="fas fa-chart-line text-3xl text-purple-200"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-orange-100 text-sm">セッション数</p>
                                <p id="total-sessions" class="text-2xl font-bold">0</p>
                            </div>
                            <i class="fas fa-calendar-check text-3xl text-orange-200"></i>
                        </div>
                    </div>
                </div>

                <!-- メインコンテンツ -->
                <div id="main-content" style="display: none;">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <!-- 進捗グラフ -->
                        <div class="lg:col-span-2">
                            <div class="bg-white rounded-lg shadow-md p-6">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-semibold text-gray-800">進捗グラフ</h3>
                                    <div class="flex space-x-2">
                                        <button id="chart-1rm-btn" class="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                                            1RM
                                        </button>
                                        <button id="chart-weight-btn" class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                                            重量
                                        </button>
                                        <button id="chart-volume-btn" class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                                            ボリューム
                                        </button>
                                    </div>
                                </div>
                                <div class="h-80">
                                    <canvas id="progress-chart"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- 目標設定・達成度 -->
                        <div>
                            <div class="bg-white rounded-lg shadow-md p-6 mb-4">
                                <h3 class="text-lg font-semibold text-gray-800 mb-4">目標設定</h3>
                                <button id="add-goal-btn" class="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                                    <i class="fas fa-plus mr-2"></i>
                                    新しい目標を設定
                                </button>
                            </div>

                            <div class="bg-white rounded-lg shadow-md p-6">
                                <h3 class="text-lg font-semibold text-gray-800 mb-4">目標達成度</h3>
                                <div id="goals-list">
                                    <p class="text-gray-500 text-center py-4">目標が設定されていません</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 週間分析 -->
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">週間パフォーマンス分析</h3>
                        <div class="h-64">
                            <canvas id="weekly-chart"></canvas>
                        </div>
                    </div>

                    <!-- 詳細分析 -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">詳細分析レポート</h3>
                            <button id="export-report-btn" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                                <i class="fas fa-download mr-2"></i>
                                レポート出力
                            </button>
                        </div>
                        <div id="analysis-report" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- 分析データがここに表示される -->
                        </div>
                    </div>
                </div>

                <!-- データなしメッセージ -->
                <div id="no-data-message" class="bg-white rounded-lg shadow-md p-8 text-center" style="display: none;">
                    <i class="fas fa-chart-line text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">進捗データがありません</h3>
                    <p class="text-gray-500 mb-4">エクササイズを選択して、トレーニングデータを記録してください。</p>
                    <button id="start-workout-btn" class="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        <i class="fas fa-play mr-2"></i>
                        ワークアウトを開始
                    </button>
                </div>
            </div>

            <!-- 目標設定モーダル -->
            <div id="goal-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">新しい目標を設定</h3>
                            <button id="close-goal-modal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="goal-form">
                            <div class="mb-4">
                                <label for="goal-type" class="block text-sm font-medium text-gray-700 mb-2">
                                    目標タイプ
                                </label>
                                <select id="goal-type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                    <option value="weight">最大重量</option>
                                    <option value="reps">最大回数</option>
                                    <option value="one_rm">1RM</option>
                                </select>
                            </div>
                            <div class="mb-4">
                                <label for="target-value" class="block text-sm font-medium text-gray-700 mb-2">
                                    目標値
                                </label>
                                <input type="number" id="target-value" step="0.1" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            </div>
                            <div class="mb-4">
                                <label for="target-date" class="block text-sm font-medium text-gray-700 mb-2">
                                    目標達成日
                                </label>
                                <input type="date" id="target-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            </div>
                            <div class="mb-6">
                                <label for="goal-description" class="block text-sm font-medium text-gray-700 mb-2">
                                    説明（任意）
                                </label>
                                <textarea id="goal-description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="目標の詳細説明"></textarea>
                            </div>
                            <div class="flex space-x-3">
                                <button type="button" id="cancel-goal" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                                    キャンセル
                                </button>
                                <button type="submit" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                                    設定
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * イベントリスナーをバインド
     */
    async bindEvents() {
        try {
            // 筋肉部位選択
            const muscleGroupSelect = safeGetElement('muscle-group-select');
            if (muscleGroupSelect) {
                muscleGroupSelect.addEventListener('change', (e) => {
                    this.handleMuscleGroupChange(e.target.value);
                });
            }

            // エクササイズ選択
            const exerciseSelect = safeGetElement('exercise-select');
            if (exerciseSelect) {
                exerciseSelect.addEventListener('change', (e) => {
                    this.handleExerciseChange(e.target.value);
                });
            }

            // チャート切り替えボタン
            const chart1RMBtn = safeGetElement('chart-1rm-btn');
            const chartWeightBtn = safeGetElement('chart-weight-btn');
            const chartVolumeBtn = safeGetElement('chart-volume-btn');

            if (chart1RMBtn) {
                chart1RMBtn.addEventListener('click', () => this.switchChart('1rm'));
            }
            if (chartWeightBtn) {
                chartWeightBtn.addEventListener('click', () => this.switchChart('weight'));
            }
            if (chartVolumeBtn) {
                chartVolumeBtn.addEventListener('click', () => this.switchChart('volume'));
            }

            // 目標設定関連
            const addGoalBtn = safeGetElement('add-goal-btn');
            const closeGoalModal = safeGetElement('close-goal-modal');
            const cancelGoal = safeGetElement('cancel-goal');
            const goalForm = safeGetElement('goal-form');

            if (addGoalBtn) {
                addGoalBtn.addEventListener('click', () => this.showGoalModal());
            }
            if (closeGoalModal) {
                closeGoalModal.addEventListener('click', () => this.hideGoalModal());
            }
            if (cancelGoal) {
                cancelGoal.addEventListener('click', () => this.hideGoalModal());
            }
            if (goalForm) {
                goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
            }

            // レポート出力
            const exportReportBtn = safeGetElement('export-report-btn');
            if (exportReportBtn) {
                exportReportBtn.addEventListener('click', () => this.exportReport());
            }

            // ワークアウト開始
            const startWorkoutBtn = safeGetElement('start-workout-btn');
            if (startWorkoutBtn) {
                startWorkoutBtn.addEventListener('click', () => this.startWorkout());
            }
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.bindEvents');
        }
    }

    /**
     * エクササイズリストを読み込み
     */
    async loadExercises() {
        try {
            // 筋肉部位を読み込み
            const { data: muscleGroups, error } = await supabaseService.getClient()
                .from('muscle_groups')
                .select('id, name, name_ja')
                .eq('is_active', true)
                .order('display_order');

            if (error) {throw error;}

            const muscleGroupSelect = safeGetElement('muscle-group-select');
            if (muscleGroupSelect && muscleGroups) {
                muscleGroups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = group.name_ja;
                    muscleGroupSelect.appendChild(option);
                });
            }
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.loadExercises');
        }
    }

    /**
     * 筋肉部位変更ハンドラー
     */
    async handleMuscleGroupChange(muscleGroupId) {
        try {
            const exerciseSelect = safeGetElement('exercise-select');
            if (!exerciseSelect) {return;}

            // エクササイズ選択をリセット
            exerciseSelect.innerHTML = '<option value="">エクササイズを選択</option>';
            exerciseSelect.disabled = !muscleGroupId;

            if (!muscleGroupId) {
                this.hideMainContent();
                return;
            }

            // 選択された筋肉部位のエクササイズを読み込み
            const { data: exercises, error } = await supabaseService.getClient()
                .from('exercises')
                .select('id, name, name_ja')
                .eq('muscle_group_id', muscleGroupId)
                .order('name_ja');

            if (error) {throw error;}

            if (exercises && exercises.length > 0) {
                exercises.forEach(exercise => {
                    const option = document.createElement('option');
                    option.value = exercise.id;
                    option.textContent = exercise.name_ja;
                    exerciseSelect.appendChild(option);
                });
                exerciseSelect.disabled = false;
            }
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.handleMuscleGroupChange');
        }
    }

    /**
     * エクササイズ変更ハンドラー
     */
    async handleExerciseChange(exerciseId) {
        try {
            if (!exerciseId) {
                this.hideMainContent();
                return;
            }

            this.selectedExercise = exerciseId;
            await this.loadProgressData();
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.handleExerciseChange');
        }
    }

    /**
     * 進捗データを読み込み
     */
    async loadProgressData() {
        try {
            if (!this.selectedExercise || !this.currentUser) {return;}

            // 進捗履歴を取得
            this.progressData = await progressTrackingService.getProgressHistory(
                this.currentUser.id,
                this.selectedExercise,
                90
            );

            if (this.progressData.length === 0) {
                this.showNoDataMessage();
                return;
            }

            // 目標データを取得
            const goalProgress = await progressTrackingService.calculateGoalProgress(
                this.currentUser.id,
                this.selectedExercise
            );
            this.goalsData = goalProgress.progress || [];

            // 統計を更新
            await this.updateStatsSummary();

            // グラフを表示
            this.switchChart('1rm');

            // 目標達成度を表示
            this.updateGoalsDisplay();

            // 週間分析を表示
            await this.updateWeeklyAnalysis();

            // 詳細分析を表示
            await this.updateDetailedAnalysis();

            this.showMainContent();
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.loadProgressData');
        }
    }

    /**
     * 統計サマリーを更新
     */
    async updateStatsSummary() {
        try {
            if (this.progressData.length === 0) {return;}

            const latestRecord = this.progressData[this.progressData.length - 1];
            const stats = progressTrackingService.calculateStats(this.progressData);

            // 現在の1RM
            const current1RMEl = safeGetElement('current-1rm');
            if (current1RMEl) {
                current1RMEl.textContent = `${latestRecord.one_rm.toFixed(1)} kg`;
            }

            // 最大重量
            const maxWeightEl = safeGetElement('max-weight');
            if (maxWeightEl) {
                maxWeightEl.textContent = `${stats.maxWeight.toFixed(1)} kg`;
            }

            // 進歩率
            const improvementRateEl = safeGetElement('improvement-rate');
            if (improvementRateEl) {
                const rate = stats.improvement > 0 ? `+${stats.improvement.toFixed(1)}%` : `${stats.improvement.toFixed(1)}%`;
                improvementRateEl.textContent = rate;
            }

            // セッション数
            const totalSessionsEl = safeGetElement('total-sessions');
            if (totalSessionsEl) {
                totalSessionsEl.textContent = this.progressData.length.toString();
            }

            // サマリーを表示
            const statsSummary = safeGetElement('stats-summary');
            if (statsSummary) {
                statsSummary.style.display = 'grid';
            }
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.updateStatsSummary');
        }
    }

    /**
     * チャートを切り替え
     */
    switchChart(chartType) {
        try {
            if (this.progressData.length === 0) {return;}

            // ボタンのアクティブ状態を更新
            const buttons = safeGetElements('[id$="-btn"]');
            buttons.forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });

            const activeBtn = safeGetElement(`chart-${chartType}-btn`);
            if (activeBtn) {
                activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
                activeBtn.classList.add('bg-blue-500', 'text-white');
            }

            // チャートを作成
            switch (chartType) {
                case '1rm':
                    chartService.createOneRMChart('progress-chart', this.progressData);
                    break;
                case 'weight':
                    chartService.createWeightChart('progress-chart', this.progressData);
                    break;
                case 'volume':
                    chartService.createVolumeChart('progress-chart', this.progressData);
                    break;
            }
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.switchChart');
        }
    }

    /**
     * 目標達成度表示を更新
     */
    updateGoalsDisplay() {
        try {
            const goalsList = safeGetElement('goals-list');
            if (!goalsList) {return;}

            if (this.goalsData.length === 0) {
                goalsList.innerHTML = '<p class="text-gray-500 text-center py-4">目標が設定されていません</p>';
                return;
            }

            goalsList.innerHTML = this.goalsData.map(goal => `
                <div class="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-medium text-gray-800">${goal.description || `${goal.goal_type}目標`}</h4>
                        <span class="text-sm text-gray-500">${goal.progress_percentage.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div class="h-2 rounded-full ${goal.progress_percentage >= 100 ? 'bg-green-500' : goal.progress_percentage >= 75 ? 'bg-yellow-500' : 'bg-blue-500'}" 
                             style="width: ${Math.min(100, goal.progress_percentage)}%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>現在: ${goal.current_value.toFixed(1)}</span>
                        <span>目標: ${goal.target_value.toFixed(1)}</span>
                    </div>
                    ${goal.is_achieved ? '<span class="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">達成済み</span>' : ''}
                </div>
            `).join('');
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.updateGoalsDisplay');
        }
    }

    /**
     * 週間分析を更新
     */
    async updateWeeklyAnalysis() {
        try {
            const analysis = await progressTrackingService.generateMonthlyAnalysis(
                this.currentUser.id,
                this.selectedExercise
            );

            if (analysis.hasData && analysis.weeklyData.length > 0) {
                chartService.createWeeklyComparisonChart('weekly-chart', analysis.weeklyData);
            }
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.updateWeeklyAnalysis');
        }
    }

    /**
     * 詳細分析を更新
     */
    async updateDetailedAnalysis() {
        try {
            const analysis = await progressTrackingService.generateMonthlyAnalysis(
                this.currentUser.id,
                this.selectedExercise
            );

            const analysisReport = safeGetElement('analysis-report');
            if (!analysisReport || !analysis.hasData) {return;}

            analysisReport.innerHTML = `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-3">パフォーマンス統計</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">最大1RM:</span>
                            <span class="font-medium">${analysis.stats.maxOneRM.toFixed(1)} kg</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">平均1RM:</span>
                            <span class="font-medium">${analysis.stats.avgOneRM.toFixed(1)} kg</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">最大重量:</span>
                            <span class="font-medium">${analysis.stats.maxWeight.toFixed(1)} kg</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">平均重量:</span>
                            <span class="font-medium">${analysis.stats.avgWeight.toFixed(1)} kg</span>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-3">トレンド分析</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">傾向:</span>
                            <span class="font-medium ${analysis.trend.direction === 'improving' ? 'text-green-600' : analysis.trend.direction === 'declining' ? 'text-red-600' : 'text-gray-600'}">
                                ${analysis.trend.direction === 'improving' ? '向上中' : analysis.trend.direction === 'declining' ? '低下中' : '安定'}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">総セッション数:</span>
                            <span class="font-medium">${analysis.totalSessions}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">期間:</span>
                            <span class="font-medium">${analysis.dateRange.start} - ${analysis.dateRange.end}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">改善率:</span>
                            <span class="font-medium ${analysis.stats.improvement > 0 ? 'text-green-600' : 'text-red-600'}">
                                ${analysis.stats.improvement > 0 ? '+' : ''}${analysis.stats.improvement.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.updateDetailedAnalysis');
        }
    }

    /**
     * 目標設定モーダルを表示
     */
    showGoalModal() {
        const modal = safeGetElement('goal-modal');
        if (modal) {
            modal.classList.remove('hidden');

            // 目標達成日のデフォルト値を30日後に設定
            const targetDate = safeGetElement('target-date');
            if (targetDate) {
                const date = new Date();
                date.setDate(date.getDate() + 30);
                targetDate.value = date.toISOString().split('T')[0];
            }
        }
    }

    /**
     * 目標設定モーダルを非表示
     */
    hideGoalModal() {
        const modal = safeGetElement('goal-modal');
        if (modal) {
            modal.classList.add('hidden');

            // フォームをリセット
            const form = safeGetElement('goal-form');
            if (form) {
                form.reset();
            }
        }
    }

    /**
     * 目標設定フォーム送信ハンドラー
     */
    async handleGoalSubmit(event) {
        try {
            event.preventDefault();

            if (!this.selectedExercise || !this.currentUser) {return;}

            const goalType = safeGetElement('goal-type')?.value;
            const targetValue = parseFloat(safeGetElement('target-value')?.value || '0');
            const targetDate = safeGetElement('target-date')?.value;
            const description = safeGetElement('goal-description')?.value;

            if (!goalType || !targetValue || !targetDate) {
                throw new Error('必須項目を入力してください');
            }

            // 現在の値を取得
            let currentValue = 0;
            if (this.progressData.length > 0) {
                const latestRecord = this.progressData[this.progressData.length - 1];
                switch (goalType) {
                    case 'weight':
                        currentValue = Math.max(...latestRecord.weights);
                        break;
                    case 'reps':
                        currentValue = Math.max(...latestRecord.reps);
                        break;
                    case 'one_rm':
                        currentValue = latestRecord.one_rm;
                        break;
                }
            }

            const goalData = {
                userId: this.currentUser.id,
                exerciseId: this.selectedExercise,
                goalType,
                targetValue,
                currentValue,
                targetDate,
                description: description || `${goalType}目標`
            };

            const result = await progressTrackingService.setGoal(goalData);

            if (result.success) {
                this.hideGoalModal();
                await this.loadProgressData(); // データを再読み込み

                // 成功通知
                this.showNotification('目標が設定されました', 'success');
            } else {
                throw new Error(result.error || '目標設定に失敗しました');
            }
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.handleGoalSubmit');
            this.showNotification(error.message, 'error');
        }
    }

    /**
     * レポートを出力
     */
    async exportReport() {
        try {
            if (!this.selectedExercise || !this.currentUser || this.progressData.length === 0) {
                this.showNotification('出力するデータがありません', 'warning');
                return;
            }

            const analysis = await progressTrackingService.generateMonthlyAnalysis(
                this.currentUser.id,
                this.selectedExercise
            );

            // 簡易的なレポート生成（実際のPDF出力は別途実装）
            const reportData = {
                exercise: this.selectedExercise,
                dateRange: analysis.dateRange,
                stats: analysis.stats,
                trend: analysis.trend,
                goals: this.goalsData,
                progressData: this.progressData
            };

            // JSON形式でダウンロード
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `progress-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('レポートをダウンロードしました', 'success');
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.exportReport');
            this.showNotification('レポート出力に失敗しました', 'error');
        }
    }

    /**
     * ワークアウトを開始
     */
    startWorkout() {
        // ワークアウトページに遷移
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'workout' } }));
    }

    /**
     * メインコンテンツを表示
     */
    showMainContent() {
        const mainContent = safeGetElement('main-content');
        const noDataMessage = safeGetElement('no-data-message');

        if (mainContent) {mainContent.style.display = 'block';}
        if (noDataMessage) {noDataMessage.style.display = 'none';}
    }

    /**
     * メインコンテンツを非表示
     */
    hideMainContent() {
        const mainContent = safeGetElement('main-content');
        const statsSummary = safeGetElement('stats-summary');
        const noDataMessage = safeGetElement('no-data-message');

        if (mainContent) {mainContent.style.display = 'none';}
        if (statsSummary) {statsSummary.style.display = 'none';}
        if (noDataMessage) {noDataMessage.style.display = 'none';}
    }

    /**
     * データなしメッセージを表示
     */
    showNoDataMessage() {
        const mainContent = safeGetElement('main-content');
        const statsSummary = safeGetElement('stats-summary');
        const noDataMessage = safeGetElement('no-data-message');

        if (mainContent) {mainContent.style.display = 'none';}
        if (statsSummary) {statsSummary.style.display = 'none';}
        if (noDataMessage) {noDataMessage.style.display = 'block';}
    }

    /**
     * 通知を表示
     */
    showNotification(message, type = 'info') {
        // 通知システムの実装（既存の通知システムを使用）
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message, type }
        }));
    }

    /**
     * ページをクリーンアップ
     */
    cleanup() {
        try {
            // チャートを破棄
            chartService.destroyAllCharts();

            // データをリセット
            this.progressData = [];
            this.goalsData = [];
            this.selectedExercise = null;
            this.isInitialized = false;
        } catch (error) {
            errorHandler.handleError(error, 'ProgressPage.cleanup');
        }
    }
}

// シングルトンインスタンスをエクスポート
export const progressPage = new ProgressPage();
