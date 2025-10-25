/**
 * プログレッシブ・オーバーロード追跡ページ
 * 進捗グラフ、1RM計算、目標設定・達成度表示を管理
 */

import { progressTrackingService } from '../services/progressTrackingService.js';
import { chartService } from '../services/chartService.js';
import { supabaseService } from '../services/supabaseService.js';
import { reportService } from '../services/reportService.js';
import { handleError } from '../utils/errorHandler.js';
import { safeGetElement, safeGetElements } from '../utils/helpers.js';
import { tooltipManager } from '../utils/TooltipManager.js';

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

            // ツールチップ機能を初期化
            tooltipManager.initialize();

            await this.render();
            await this.bindEvents();
            await this.loadExercises();
            this.setupTooltips();
            this.isInitialized = true;
        } catch (error) {
            handleError(error, 'ProgressPage.init');
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
                            <label for="muscle-group-select" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                筋肉部位
                            </label>
                            <select id="muscle-group-select" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                           focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">筋肉部位を選択</option>
                            </select>
                        </div>
                        <div>
                            <label for="exercise-select" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                エクササイズ
                            </label>
                            <select id="exercise-select" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                           focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    disabled>
                                <option value="">エクササイズを選択</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 統計サマリー -->
                <div id="stats-summary" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" style="display: none;">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 
                                rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100 text-sm">現在の1RM</p>
                                <p id="current-1rm" class="text-2xl font-bold">0 kg</p>
                            </div>
                            <i class="fas fa-trophy text-3xl text-blue-200"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-green-500 to-green-600 
                                rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100 text-sm">最大重量</p>
                                <p id="max-weight" class="text-2xl font-bold">0 kg</p>
                            </div>
                            <i class="fas fa-weight-hanging text-3xl text-green-200"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 
                                rounded-lg p-6 text-white">
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

                <!-- プログレッシブ・オーバーロード分析 -->
                <div id="progressive-overload-analysis" class="bg-white rounded-lg shadow-md p-6 mb-6" style="display: none;">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-trending-up text-green-500 mr-2"></i>
                        プログレッシブ・オーバーロード分析
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-green-100 text-sm">オーバーロード率</p>
                                    <p id="overload-rate" class="text-2xl font-bold">0%</p>
                                </div>
                                <i class="fas fa-chart-line text-3xl text-green-200"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-blue-100 text-sm">トレンド</p>
                                    <p id="trend-status" class="text-lg font-bold">分析中</p>
                                </div>
                                <i class="fas fa-arrow-up text-3xl text-blue-200"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-purple-100 text-sm">改善幅</p>
                                    <p id="improvement-amount" class="text-2xl font-bold">0 kg</p>
                                </div>
                                <i class="fas fa-trophy text-3xl text-purple-200"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 推奨事項 -->
                    <div class="mt-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">推奨事項</h3>
                        <div id="recommendations-list" class="space-y-2">
                            <!-- 推奨事項が動的に追加される -->
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
                                        <button id="chart-1rm-btn" 
                                                class="px-3 py-1 text-sm bg-blue-500 text-white 
                                                       rounded-md hover:bg-blue-600 transition-colors">
                                            1RM
                                        </button>
                                        <button id="chart-weight-btn" 
                                                class="px-3 py-1 text-sm bg-gray-200 text-gray-700 
                                                       rounded-md hover:bg-gray-300 transition-colors">
                                            重量
                                        </button>
                                        <button id="chart-volume-btn" 
                                                class="px-3 py-1 text-sm bg-gray-200 text-gray-700 
                                                       rounded-md hover:bg-gray-300 transition-colors">
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
                            <div class="flex space-x-2">
                                <button id="export-pdf-btn" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                                    <i class="fas fa-file-pdf mr-2"></i>
                                    PDF出力
                                </button>
                                <button id="export-csv-btn" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                                    <i class="fas fa-file-csv mr-2"></i>
                                    CSV出力
                                </button>
                                <button id="export-report-btn" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                                    <i class="fas fa-download mr-2"></i>
                                    JSON出力
                                </button>
                            </div>
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
                            <!-- SMART目標設定の説明 -->
                            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                                <h4 class="text-sm font-semibold text-blue-800 mb-2">SMART目標設定</h4>
                                <p class="text-xs text-blue-600">
                                    <strong>S</strong>pecific（具体的）、<strong>M</strong>easurable（測定可能）、
                                    <strong>A</strong>chievable（達成可能）、<strong>R</strong>elevant（関連性）、
                                    <strong>T</strong>ime-bound（期限付き）な目標を設定しましょう
                                </p>
                            </div>

                            <div class="mb-4">
                                <label for="goal-type" class="block text-sm font-medium text-gray-700 mb-2">
                                    目標タイプ <span class="text-red-500">*</span>
                                </label>
                                <select id="goal-type" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                               focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        required>
                                    <option value="">目標タイプを選択</option>
                                    <option value="weight">最大重量（kg）</option>
                                    <option value="reps">最大回数（回）</option>
                                    <option value="one_rm">1RM（kg）</option>
                                </select>
                                <p class="text-xs text-gray-500 mt-1">測定可能な指標を選択してください</p>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="current-value" class="block text-sm font-medium text-gray-700 mb-2">
                                        現在の値
                                    </label>
                                    <input type="number" id="current-value" step="0.1" min="0" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                                  focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" 
                                           readonly>
                                    <p class="text-xs text-gray-500 mt-1">最新の記録から自動設定</p>
                                </div>
                                <div>
                                    <label for="target-value" class="block text-sm font-medium text-gray-700 mb-2">
                                        目標値 <span class="text-red-500">*</span>
                                    </label>
                                    <input type="number" id="target-value" step="0.1" min="0" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                                  focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                           required>
                                    <p class="text-xs text-gray-500 mt-1">達成可能な目標を設定</p>
                                </div>
                            </div>

                            <div class="mb-4">
                                <label for="target-date" class="block text-sm font-medium text-gray-700 mb-2">
                                    目標達成日 <span class="text-red-500">*</span>
                                </label>
                                <input type="date" id="target-date" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                              focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                       required>
                                <p class="text-xs text-gray-500 mt-1">現実的な期限を設定してください（推奨：4-12週間）</p>
                            </div>

                            <div class="mb-4">
                                <label for="goal-priority" class="block text-sm font-medium text-gray-700 mb-2">
                                    優先度
                                </label>
                                <select id="goal-priority" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                               focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="medium">中（標準）</option>
                                    <option value="high">高（重要）</option>
                                    <option value="low">低（参考）</option>
                                </select>
                            </div>

                            <div class="mb-4">
                                <label for="goal-strategy" class="block text-sm font-medium text-gray-700 mb-2">
                                    達成戦略（任意）
                                </label>
                                <textarea id="goal-strategy" rows="2" 
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                                 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                          placeholder="例：週3回のトレーニング、プログレッシブオーバーロード適用"></textarea>
                                <p class="text-xs text-gray-500 mt-1">目標達成のための具体的な方法を記載</p>
                            </div>

                            <div class="mb-6">
                                <label for="goal-description" class="block text-sm font-medium text-gray-700 mb-2">
                                    目標の説明（任意）
                                </label>
                                <textarea id="goal-description" rows="2" 
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md 
                                                 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                          placeholder="この目標を達成する理由や意義を記載"></textarea>
                            </div>

                            <!-- 通知設定 -->
                            <div class="mb-6 p-3 bg-gray-50 rounded-lg">
                                <h4 class="text-sm font-semibold text-gray-700 mb-3">通知設定</h4>
                                <div class="space-y-2">
                                    <label class="flex items-center">
                                        <input type="checkbox" id="notify-progress" class="mr-2" checked>
                                        <span class="text-sm text-gray-600">進捗更新時に通知</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" id="notify-milestone" class="mr-2" checked>
                                        <span class="text-sm text-gray-600">マイルストーン達成時に通知</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" id="notify-deadline" class="mr-2" checked>
                                        <span class="text-sm text-gray-600">期限前のリマインダー</span>
                                    </label>
                                </div>
                            </div>

                            <div class="flex space-x-3">
                                <button type="button" id="cancel-goal" 
                                        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 
                                               rounded-md hover:bg-gray-50 transition-colors">
                                    キャンセル
                                </button>
                                <button type="submit" 
                                        class="flex-1 px-4 py-2 bg-blue-500 text-white 
                                               rounded-md hover:bg-blue-600 transition-colors">
                                    目標を設定
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
            const exportPdfBtn = safeGetElement('export-pdf-btn');
            const exportCsvBtn = safeGetElement('export-csv-btn');

            if (exportReportBtn) {
                exportReportBtn.addEventListener('click', () => this.exportReport());
            }
            if (exportPdfBtn) {
                exportPdfBtn.addEventListener('click', () => this.exportToPDF());
            }
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', () => this.exportToCSV());
            }

            // ワークアウト開始
            const startWorkoutBtn = safeGetElement('start-workout-btn');
            if (startWorkoutBtn) {
                startWorkoutBtn.addEventListener('click', () => this.startWorkout());
            }
        } catch (error) {
            handleError(error, 'ProgressPage.bindEvents');
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
            handleError(error, 'ProgressPage.loadExercises');
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
            handleError(error, 'ProgressPage.handleMuscleGroupChange');
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
            
            // プログレッシブ・オーバーロード分析を表示
            await this.displayProgressiveOverloadAnalysis(exerciseId);
        } catch (error) {
            handleError(error, 'ProgressPage.handleExerciseChange');
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
            handleError(error, 'ProgressPage.loadProgressData');
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
            handleError(error, 'ProgressPage.updateStatsSummary');
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
            handleError(error, 'ProgressPage.switchChart');
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
            handleError(error, 'ProgressPage.updateGoalsDisplay');
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
            handleError(error, 'ProgressPage.updateWeeklyAnalysis');
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
            handleError(error, 'ProgressPage.updateDetailedAnalysis');
        }
    }

    /**
     * 目標設定モーダルを表示
     */
    showGoalModal() {
        const modal = safeGetElement('goal-modal');
        if (modal) {
            modal.classList.remove('hidden');

            // 目標達成日のデフォルト値を8週間後に設定
            const targetDate = safeGetElement('target-date');
            if (targetDate) {
                const date = new Date();
                date.setDate(date.getDate() + 56); // 8週間
                targetDate.value = date.toISOString().split('T')[0];
            }

            // 目標タイプ変更時の現在値自動設定
            const goalType = safeGetElement('goal-type');
            const currentValue = safeGetElement('current-value');
            const targetValue = safeGetElement('target-value');

            if (goalType && currentValue && targetValue) {
                goalType.addEventListener('change', () => {
                    this.updateCurrentValue(goalType.value, currentValue, targetValue);
                });
            }
        }
    }

    /**
     * 現在の値を更新
     * @param {string} goalType - 目標タイプ
     * @param {HTMLElement} currentValueEl - 現在値要素
     * @param {HTMLElement} targetValueEl - 目標値要素
     */
    updateCurrentValue(goalType, currentValueEl, targetValueEl) {
        try {
            if (!goalType || this.progressData.length === 0) {
                currentValueEl.value = '';
                targetValueEl.value = '';
                return;
            }

            const latestRecord = this.progressData[this.progressData.length - 1];
            let currentVal = 0;

            switch (goalType) {
                case 'weight':
                    currentVal = Math.max(...latestRecord.weights);
                    break;
                case 'reps':
                    currentVal = Math.max(...latestRecord.reps);
                    break;
                case 'one_rm':
                    currentVal = latestRecord.one_rm;
                    break;
            }

            currentValueEl.value = currentVal.toFixed(1);

            // 推奨目標値を設定（現在値の5-15%増加）
            const recommendedIncrease = currentVal * 0.1; // 10%増加
            const suggestedTarget = currentVal + recommendedIncrease;
            targetValueEl.value = suggestedTarget.toFixed(1);
            targetValueEl.placeholder = `推奨: ${suggestedTarget.toFixed(1)}`;

        } catch (error) {
            handleError(error, 'ProgressPage.updateCurrentValue');
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
            const currentValue = parseFloat(safeGetElement('current-value')?.value || '0');
            const targetDate = safeGetElement('target-date')?.value;
            const priority = safeGetElement('goal-priority')?.value || 'medium';
            const strategy = safeGetElement('goal-strategy')?.value;
            const description = safeGetElement('goal-description')?.value;

            // 通知設定
            const notifyProgress = safeGetElement('notify-progress')?.checked || false;
            const notifyMilestone = safeGetElement('notify-milestone')?.checked || false;
            const notifyDeadline = safeGetElement('notify-deadline')?.checked || false;

            // バリデーション
            const errors = [];
            if (!goalType) {errors.push('目標タイプ');}
            if (!targetValue) {errors.push('目標値');}
            if (!targetDate) {errors.push('目標達成日');}

            if (errors.length > 0) {
                throw new Error(`以下の項目を入力してください: ${errors.join(', ')}`);
            }

            if (targetValue <= currentValue) {
                throw new Error('目標値は現在の値より大きく設定してください');
            }

            const targetDateObj = new Date(targetDate);
            const today = new Date();
            if (targetDateObj <= today) {
                throw new Error('目標達成日は今日より後の日付を設定してください');
            }

            // 達成可能性チェック（現在値の50%以上の増加は警告）
            const increasePercentage = ((targetValue - currentValue) / currentValue) * 100;
            if (increasePercentage > 50) {
                const confirmMessage = `目標値が現在値より${increasePercentage.toFixed(1)}%高く設定されています。達成可能な目標ですか？`;
                // eslint-disable-next-line no-alert
                if (!window.confirm(confirmMessage)) {
                    return;
                }
            }

            const goalData = {
                userId: this.currentUser.id,
                exerciseId: this.selectedExercise,
                goalType,
                targetValue,
                currentValue,
                targetDate,
                priority,
                strategy,
                description: description || this.generateGoalDescription(goalType, targetValue, targetDate),
                notifications: {
                    progress: notifyProgress,
                    milestone: notifyMilestone,
                    deadline: notifyDeadline
                }
            };

            const result = await progressTrackingService.setGoal(goalData);

            if (result.success) {
                this.hideGoalModal();
                await this.loadProgressData(); // データを再読み込み

                // 成功通知
                this.showNotification('SMART目標が設定されました！', 'success');

                // 目標達成のヒントを表示
                this.showGoalTips(goalType, increasePercentage);
            } else {
                throw new Error(result.error || '目標設定に失敗しました');
            }
        } catch (error) {
            handleError(error, 'ProgressPage.handleGoalSubmit');
            this.showNotification(error.message, 'error');
        }
    }

    /**
     * 目標の説明文を自動生成
     * @param {string} goalType - 目標タイプ
     * @param {number} targetValue - 目標値
     * @param {string} targetDate - 目標日
     * @returns {string} 説明文
     */
    generateGoalDescription(goalType, targetValue, targetDate) {
        const typeNames = {
            weight: '最大重量',
            reps: '最大回数',
            one_rm: '1RM'
        };

        const units = {
            weight: 'kg',
            reps: '回',
            one_rm: 'kg'
        };

        const typeName = typeNames[goalType] || goalType;
        const unit = units[goalType] || '';
        const date = new Date(targetDate).toLocaleDateString('ja-JP');

        return `${date}までに${typeName}${targetValue}${unit}を達成する`;
    }

    /**
     * 目標達成のヒントを表示
     * @param {string} goalType - 目標タイプ
     * @param {number} increasePercentage - 増加率
     */
    showGoalTips(goalType, increasePercentage) {
        const tips = [];

        if (increasePercentage > 25) {
            tips.push('大きな目標です！段階的な中間目標を設定することをお勧めします');
        }

        switch (goalType) {
            case 'weight':
                tips.push('重量増加には適切なフォームの維持が重要です');
                tips.push('週2-3回の頻度でプログレッシブオーバーロードを適用しましょう');
                break;
            case 'reps':
                tips.push('回数増加には筋持久力の向上が必要です');
                tips.push('セット間の休息時間を調整してみてください');
                break;
            case 'one_rm':
                tips.push('1RM向上には重量とフォームのバランスが重要です');
                tips.push('定期的な1RMテストで進捗を確認しましょう');
                break;
        }

        if (tips.length > 0) {
            const tipMessage = tips.join('\n• ');
            setTimeout(() => {
                this.showNotification(`💡 目標達成のヒント:\n• ${tipMessage}`, 'info');
            }, 2000);
        }
    }

    /**
     * JSONレポートを出力
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
            const filename = `progress-report-${new Date().toISOString().split('T')[0]}.json`;
            reportService.downloadFile(blob, filename);

            this.showNotification('JSONレポートをダウンロードしました', 'success');
        } catch (error) {
            handleError(error, 'ProgressPage.exportReport');
            this.showNotification('レポート出力に失敗しました', 'error');
        }
    }

    /**
     * PDFレポートを出力
     */
    async exportToPDF() {
        try {
            if (!this.selectedExercise || !this.currentUser || this.progressData.length === 0) {
                this.showNotification('出力するデータがありません', 'warning');
                return;
            }

            // ローディング表示
            this.showNotification('PDFを生成中...', 'info');

            const analysis = await progressTrackingService.generateMonthlyAnalysis(
                this.currentUser.id,
                this.selectedExercise
            );

            // エクササイズ名を取得
            const exerciseName = await this.getExerciseName(this.selectedExercise);

            const reportData = {
                dateRange: analysis.dateRange,
                stats: analysis.stats,
                trend: analysis.trend,
                goals: this.goalsData,
                progressData: this.progressData
            };

            const pdfBlob = await reportService.generateProgressReportPDF(reportData, exerciseName);
            const filename = `progress-report-${exerciseName}-${new Date().toISOString().split('T')[0]}.pdf`;
            reportService.downloadFile(pdfBlob, filename);

            this.showNotification('PDFレポートをダウンロードしました', 'success');
        } catch (error) {
            handleError(error, 'ProgressPage.exportToPDF');
            this.showNotification('PDF出力に失敗しました', 'error');
        }
    }

    /**
     * CSVデータを出力
     */
    async exportToCSV() {
        try {
            if (!this.selectedExercise || !this.currentUser || this.progressData.length === 0) {
                this.showNotification('出力するデータがありません', 'warning');
                return;
            }

            // エクササイズ名を取得
            const exerciseName = await this.getExerciseName(this.selectedExercise);

            const csvBlob = reportService.exportToCSV(this.progressData, exerciseName);
            const filename = `progress-data-${exerciseName}-${new Date().toISOString().split('T')[0]}.csv`;
            reportService.downloadFile(csvBlob, filename);

            this.showNotification('CSVデータをダウンロードしました', 'success');
        } catch (error) {
            handleError(error, 'ProgressPage.exportToCSV');
            this.showNotification('CSV出力に失敗しました', 'error');
        }
    }

    /**
     * エクササイズ名を取得
     * @param {string} exerciseId - エクササイズID
     * @returns {Promise<string>} エクササイズ名
     */
    async getExerciseName(exerciseId) {
        try {
            const { data, error } = await supabaseService.getClient()
                .from('exercises')
                .select('name_ja')
                .eq('id', exerciseId)
                .single();

            if (error) {throw error;}
            return data?.name_ja || 'Unknown Exercise';
        } catch (error) {
            handleError(error, 'ProgressPage.getExerciseName');
            return 'Unknown Exercise';
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
     * プログレッシブ・オーバーロードの計算
     * @param {Array} progressData - 進捗データ
     * @param {string} exerciseId - エクササイズID
     * @returns {Object} プログレッシブ・オーバーロード分析結果
     */
    calculateProgressiveOverload(progressData, exerciseId) {
        try {
            if (!progressData || progressData.length < 2) {
                return {
                    isProgressive: false,
                    overloadRate: 0,
                    trend: 'insufficient_data',
                    recommendations: ['より多くのデータが必要です']
                };
            }

            // エクササイズ別のデータをフィルタリング
            const exerciseData = progressData.filter(item => item.exercise_id === exerciseId);
            
            if (exerciseData.length < 2) {
                return {
                    isProgressive: false,
                    overloadRate: 0,
                    trend: 'insufficient_data',
                    recommendations: ['このエクササイズのデータが不足しています']
                };
            }

            // 日付順にソート
            exerciseData.sort((a, b) => new Date(a.workout_date) - new Date(b.workout_date));

            // 1RMの推移を計算
            const oneRMHistory = exerciseData.map(item => this.calculateOneRM(item.weight, item.reps));
            
            // プログレッシブ・オーバーロード率を計算
            const overloadRate = this.calculateOverloadRate(oneRMHistory);
            
            // トレンドを分析
            const trend = this.analyzeTrend(oneRMHistory);
            
            // 推奨事項を生成
            const recommendations = this.generateRecommendations(overloadRate, trend, oneRMHistory);

            return {
                isProgressive: overloadRate > 0,
                overloadRate: overloadRate,
                trend: trend,
                recommendations: recommendations,
                oneRMHistory: oneRMHistory,
                lastOneRM: oneRMHistory[oneRMHistory.length - 1],
                firstOneRM: oneRMHistory[0],
                improvement: oneRMHistory[oneRMHistory.length - 1] - oneRMHistory[0]
            };

        } catch (error) {
            handleError(error, 'ProgressPage.calculateProgressiveOverload');
            return {
                isProgressive: false,
                overloadRate: 0,
                trend: 'error',
                recommendations: ['計算中にエラーが発生しました']
            };
        }
    }

    /**
     * 1RMを計算（Epley公式）
     * @param {number} weight - 重量
     * @param {number} reps - 回数
     * @returns {number} 推定1RM
     */
    calculateOneRM(weight, reps) {
        if (reps <= 0 || weight <= 0) return 0;
        if (reps === 1) return weight;
        
        // Epley公式: 1RM = weight * (1 + reps / 30)
        return Math.round(weight * (1 + reps / 30) * 100) / 100;
    }

    /**
     * プログレッシブ・オーバーロード率を計算
     * @param {Array} oneRMHistory - 1RM履歴
     * @returns {number} オーバーロード率（%）
     */
    calculateOverloadRate(oneRMHistory) {
        if (oneRMHistory.length < 2) return 0;

        const firstRM = oneRMHistory[0];
        const lastRM = oneRMHistory[oneRMHistory.length - 1];
        
        if (firstRM === 0) return 0;
        
        return Math.round(((lastRM - firstRM) / firstRM) * 100 * 100) / 100;
    }

    /**
     * トレンドを分析
     * @param {Array} oneRMHistory - 1RM履歴
     * @returns {string} トレンド（'improving', 'plateau', 'declining'）
     */
    analyzeTrend(oneRMHistory) {
        if (oneRMHistory.length < 3) return 'insufficient_data';

        // 最近の3回のデータでトレンドを判断
        const recent = oneRMHistory.slice(-3);
        const first = recent[0];
        const last = recent[recent.length - 1];
        
        const change = ((last - first) / first) * 100;
        
        if (change > 5) return 'improving';
        if (change < -5) return 'declining';
        return 'plateau';
    }

    /**
     * 推奨事項を生成
     * @param {number} overloadRate - オーバーロード率
     * @param {string} trend - トレンド
     * @param {Array} oneRMHistory - 1RM履歴
     * @returns {Array} 推奨事項の配列
     */
    generateRecommendations(overloadRate, trend, oneRMHistory) {
        const recommendations = [];

        if (overloadRate > 10) {
            recommendations.push('素晴らしい進歩です！現在のトレーニングを継続してください。');
        } else if (overloadRate > 0) {
            recommendations.push('着実に進歩しています。もう少し強度を上げてみてください。');
        } else if (overloadRate === 0) {
            recommendations.push('プラトー状態です。トレーニング方法を見直してみてください。');
        } else {
            recommendations.push('パフォーマンスが低下しています。休息を取るか、トレーニング強度を調整してください。');
        }

        if (trend === 'plateau') {
            recommendations.push('プラトーを打破するために、新しいエクササイズやトレーニング方法を試してみてください。');
        } else if (trend === 'declining') {
            recommendations.push('オーバートレーニングの可能性があります。休息日を増やしてください。');
        }

        // 具体的な数値目標を提案
        const lastOneRM = oneRMHistory[oneRMHistory.length - 1];
        if (lastOneRM > 0) {
            const nextTarget = Math.round(lastOneRM * 1.05 * 100) / 100;
            recommendations.push(`次の目標: ${nextTarget}kg（現在の1RMの5%増）`);
        }

        return recommendations;
    }

    /**
     * プログレッシブ・オーバーロード分析を表示
     * @param {string} exerciseId - エクササイズID
     */
    async displayProgressiveOverloadAnalysis(exerciseId) {
        try {
            if (!exerciseId || !this.progressData.length) {
                return;
            }

            // プログレッシブ・オーバーロードを計算
            const analysis = this.calculateProgressiveOverload(this.progressData, exerciseId);
            
            // 分析結果を表示
            const analysisSection = safeGetElement('#progressive-overload-analysis');
            if (analysisSection) {
                analysisSection.style.display = 'block';
            }

            // オーバーロード率を表示
            const overloadRateElement = safeGetElement('#overload-rate');
            if (overloadRateElement) {
                const rate = analysis.overloadRate;
                overloadRateElement.textContent = `${rate > 0 ? '+' : ''}${rate}%`;
                overloadRateElement.className = `text-2xl font-bold ${rate > 0 ? 'text-green-300' : rate < 0 ? 'text-red-300' : 'text-yellow-300'}`;
            }

            // トレンドを表示
            const trendElement = safeGetElement('#trend-status');
            if (trendElement) {
                const trendText = this.getTrendText(analysis.trend);
                const trendIcon = this.getTrendIcon(analysis.trend);
                trendElement.innerHTML = `${trendIcon} ${trendText}`;
            }

            // 改善幅を表示
            const improvementElement = safeGetElement('#improvement-amount');
            if (improvementElement) {
                const improvement = analysis.improvement || 0;
                improvementElement.textContent = `${improvement > 0 ? '+' : ''}${improvement} kg`;
                improvementElement.className = `text-2xl font-bold ${improvement > 0 ? 'text-purple-300' : improvement < 0 ? 'text-red-300' : 'text-yellow-300'}`;
            }

            // 推奨事項を表示
            this.displayRecommendations(analysis.recommendations);

        } catch (error) {
            handleError(error, 'ProgressPage.displayProgressiveOverloadAnalysis');
        }
    }

    /**
     * トレンドテキストを取得
     * @param {string} trend - トレンド
     * @returns {string} トレンドテキスト
     */
    getTrendText(trend) {
        const trendMap = {
            'improving': '改善中',
            'plateau': 'プラトー',
            'declining': '低下中',
            'insufficient_data': 'データ不足',
            'error': 'エラー'
        };
        return trendMap[trend] || '不明';
    }

    /**
     * トレンドアイコンを取得
     * @param {string} trend - トレンド
     * @returns {string} トレンドアイコン
     */
    getTrendIcon(trend) {
        const iconMap = {
            'improving': '<i class="fas fa-arrow-up text-green-300"></i>',
            'plateau': '<i class="fas fa-minus text-yellow-300"></i>',
            'declining': '<i class="fas fa-arrow-down text-red-300"></i>',
            'insufficient_data': '<i class="fas fa-question text-gray-300"></i>',
            'error': '<i class="fas fa-exclamation-triangle text-red-300"></i>'
        };
        return iconMap[trend] || '<i class="fas fa-question text-gray-300"></i>';
    }

    /**
     * 推奨事項を表示
     * @param {Array} recommendations - 推奨事項の配列
     */
    displayRecommendations(recommendations) {
        const recommendationsList = safeGetElement('#recommendations-list');
        if (!recommendationsList) return;

        recommendationsList.innerHTML = '';

        if (!recommendations || recommendations.length === 0) {
            recommendationsList.innerHTML = '<p class="text-gray-500">推奨事項はありません。</p>';
            return;
        }

        recommendations.forEach((recommendation, index) => {
            const recommendationElement = document.createElement('div');
            recommendationElement.className = 'flex items-start space-x-3 p-3 bg-gray-50 rounded-lg';
            recommendationElement.innerHTML = `
                <div class="flex-shrink-0">
                    <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm text-gray-700">${recommendation}</p>
                </div>
            `;
            recommendationsList.appendChild(recommendationElement);
        });
    }

    /**
     * ツールチップを設定
     */
    setupTooltips() {
        try {
            console.log('Setting up tooltips for progress page');

            // 1RM計算のツールチップ
            tooltipManager.addTooltip('#one-rm-calculator', {
                content: 'Epley公式を使用して1RM（1回最大重量）を計算します。重量と回数を入力してください。',
                position: 'top'
            });

            // プログレッシブ・オーバーロードのツールチップ
            tooltipManager.addTooltip('#progressive-overload-card', {
                content: 'プログレッシブ・オーバーロードは、時間の経過とともにトレーニング強度を徐々に増加させる原則です。',
                position: 'top'
            });

            // 進捗グラフのツールチップ
            tooltipManager.addTooltip('#progress-chart', {
                content: '選択したエクササイズの1RM推移を表示します。上昇トレンドが理想です。',
                position: 'top'
            });

            // 目標設定のツールチップ
            tooltipManager.addTooltip('#goal-setting', {
                content: '具体的な数値目標を設定して、モチベーションを維持しましょう。',
                position: 'top'
            });

            // 推奨事項のツールチップ
            tooltipManager.addTooltip('#recommendations', {
                content: 'あなたの進捗データに基づいた個別の推奨事項です。',
                position: 'top'
            });

            console.log('✅ Tooltips setup complete for progress page');

        } catch (error) {
            console.error('❌ Failed to setup tooltips:', error);
        }
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
            handleError(error, 'ProgressPage.cleanup');
        }
    }
}

// シングルトンインスタンスをエクスポート
export const progressPage = new ProgressPage();
