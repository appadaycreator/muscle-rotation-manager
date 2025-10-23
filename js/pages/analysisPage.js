// analysisPage.js - 分析ページの機能

import { supabaseService } from '../services/supabaseService.js';
// import { chartService } from '../services/chartService.js';
import {
    showNotification,
    safeAsync,
    safeGetElement
    // safeGetElements
} from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';

class AnalysisPage {
    constructor() {
        this.workoutData = [];
        this.charts = {};
        this.isLoading = false;
    }

    /**
     * 分析ページを初期化
     */
    async initialize() {
        console.log('Analysis page initialized');

        await safeAsync(
            async () => {
                // 分析ページのコンテンツを表示
                this.renderAnalysisPage();
                
                await this.loadWorkoutData();
                this.renderStatistics();
                this.renderCharts();
                this.generateAnalysisReport();
            },
            '分析ページの初期化',
            (error) => {
                handleError(error, {
                    context: '分析ページ初期化',
                    showNotification: true
                });
            }
        );
    }

    /**
     * 分析ページのコンテンツを表示
     */
    renderAnalysisPage() {
        const mainContent = safeGetElement('#main-content');
        if (!mainContent) return;

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

            <!-- 進捗グラフ -->
            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">進捗グラフ</h3>
                    <div id="progress-charts">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p>グラフを読み込み中...</p>
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
        `;
    }

    /**
     * ワークアウトデータを読み込み
     */
    async loadWorkoutData() {
        try {
            this.isLoading = true;

            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                // Supabaseからデータを取得
                this.workoutData = await supabaseService.getWorkouts(1000);
            } else {
                // ローカルストレージから読み込み
                this.workoutData = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            }

            console.log(`Loaded ${this.workoutData.length} workouts for analysis`);
        } catch (error) {
            console.error('Error loading workout data:', error);
            this.workoutData = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            showNotification('ワークアウトデータの読み込みに失敗しました', 'error');
        } finally {
            this.isLoading = false;
        }
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
     * 総合統計をレンダリング
     */
    renderOverallStats() {
        const totalWorkouts = this.workoutData.length;
        const totalHours = this.workoutData.reduce((sum, workout) =>
            sum + (workout.duration || 0), 0) / 3600;
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

        this.workoutData.forEach(workout => {
            const muscleGroups = workout.muscle_groups || workout.muscleGroups || [];
            muscleGroups.forEach(muscle => {
                muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
            });
        });

        const container = safeGetElement('#muscle-group-stats');
        if (!container) {return;}

        container.innerHTML = Object.entries(muscleGroupCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([muscle, count]) => `
                <div class="flex justify-between">
                    <span class="text-gray-600">${this.getMuscleGroupName(muscle)}</span>
                    <span class="font-bold text-blue-600">${count}回</span>
                </div>
            `).join('');
    }

    /**
     * 筋肉部位名を取得
     */
    getMuscleGroupName(muscleId) {
        const names = {
            chest: '胸筋',
            back: '背筋',
            shoulder: '肩',
            arm: '腕',
            leg: '脚',
            abs: '体幹'
        };
        return names[muscleId] || muscleId;
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

        const strengthProgress = olderAvgWeight > 0 ?
            ((recentAvgWeight - olderAvgWeight) / olderAvgWeight * 100).toFixed(1) : 0;

        safeGetElement('#strength-progress').textContent = `${strengthProgress}%`;
        safeGetElement('#endurance-progress').textContent = '計算中...';
        safeGetElement('#overall-score').textContent = this.calculateOverallScore();
    }

    /**
     * 平均重量を計算
     */
    calculateAverageWeight(workouts) {
        if (workouts.length === 0) {return 0;}

        let totalWeight = 0;
        let count = 0;

        workouts.forEach(workout => {
            if (workout.exercises || workout.training_logs) {
                const exercises = workout.exercises || workout.training_logs || [];
                exercises.forEach(exercise => {
                    if (exercise.weights && Array.isArray(exercise.weights)) {
                        exercise.weights.forEach(weight => {
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
            await this.renderFrequencyChart();
            await this.renderMuscleGroupChart();
            await this.renderWeightProgressChart();
            await this.renderSetsProgressChart();
        } catch (error) {
            console.error('Error rendering charts:', error);
            handleError(error, {
                context: 'チャート描画',
                showNotification: true
            });
        }
    }

    /**
     * トレーニング頻度チャートをレンダリング
     */
    async renderFrequencyChart() {
        const canvas = safeGetElement('#frequency-chart');
        if (!canvas) {return;}

        const frequencyData = this.calculateFrequencyData();

        this.charts.frequency = new Chart(canvas, {
            type: 'line',
            data: {
                labels: frequencyData.labels,
                datasets: [{
                    label: 'トレーニング回数',
                    data: frequencyData.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * 部位別チャートをレンダリング
     */
    async renderMuscleGroupChart() {
        const canvas = safeGetElement('#muscle-group-chart');
        if (!canvas) {return;}

        const muscleGroupData = this.calculateMuscleGroupData();

        this.charts.muscleGroup = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: muscleGroupData.labels,
                datasets: [{
                    data: muscleGroupData.data,
                    backgroundColor: [
                        '#ef4444', '#3b82f6', '#10b981',
                        '#f59e0b', '#8b5cf6', '#ec4899'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * 重量推移チャートをレンダリング
     */
    async renderWeightProgressChart() {
        const canvas = safeGetElement('#weight-progress-chart');
        if (!canvas) {return;}

        const weightData = this.calculateWeightProgressData();

        this.charts.weightProgress = new Chart(canvas, {
            type: 'line',
            data: {
                labels: weightData.labels,
                datasets: [{
                    label: '平均重量 (kg)',
                    data: weightData.data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * セット数推移チャートをレンダリング
     */
    async renderSetsProgressChart() {
        const canvas = safeGetElement('#sets-progress-chart');
        if (!canvas) {return;}

        const setsData = this.calculateSetsProgressData();

        this.charts.setsProgress = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: setsData.labels,
                datasets: [{
                    label: 'セット数',
                    data: setsData.data,
                    backgroundColor: '#8b5cf6',
                    borderColor: '#7c3aed',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
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
        last30Days.forEach(date => {
            frequencyMap[date] = 0;
        });

        this.workoutData.forEach(workout => {
            const workoutDate = new Date(workout.date || workout.startTime).toISOString().split('T')[0];
            if (Object.prototype.hasOwnProperty.call(frequencyMap, workoutDate)) {
                frequencyMap[workoutDate]++;
            }
        });

        return {
            labels: last30Days.map(date => new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })),
            data: Object.values(frequencyMap)
        };
    }

    /**
     * 部位別データを計算
     */
    calculateMuscleGroupData() {
        const muscleGroupCounts = {};

        this.workoutData.forEach(workout => {
            const muscleGroups = workout.muscle_groups || workout.muscleGroups || [];
            muscleGroups.forEach(muscle => {
                muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
            });
        });

        const sorted = Object.entries(muscleGroupCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);

        return {
            labels: sorted.map(([muscle]) => this.getMuscleGroupName(muscle)),
            data: sorted.map(([,count]) => count)
        };
    }

    /**
     * 重量進歩データを計算
     */
    calculateWeightProgressData() {
        // 簡易的な重量進歩データ
        const last10Workouts = this.workoutData.slice(-10);
        const labels = last10Workouts.map((_, index) => `セッション${index + 1}`);
        const data = last10Workouts.map(workout => this.calculateAverageWeight([workout]));

        return { labels, data };
    }

    /**
     * セット数進歩データを計算
     */
    calculateSetsProgressData() {
        const last10Workouts = this.workoutData.slice(-10);
        const labels = last10Workouts.map((_, index) => `セッション${index + 1}`);
        const data = last10Workouts.map(workout => {
            if (workout.exercises || workout.training_logs) {
                const exercises = workout.exercises || workout.training_logs || [];
                return exercises.reduce((sum, exercise) => sum + (exercise.sets || 0), 0);
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
        if (!container) {return;}

        const report = this.generateReport();
        container.innerHTML = report;
    }

    /**
     * レポートを生成
     */
    generateReport() {
        const totalWorkouts = this.workoutData.length;
        const totalHours = this.workoutData.reduce((sum, workout) =>
            sum + (workout.duration || 0), 0) / 3600;

        const muscleGroupCounts = {};
        this.workoutData.forEach(workout => {
            const muscleGroups = workout.muscle_groups || workout.muscleGroups || [];
            muscleGroups.forEach(muscle => {
                muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
            });
        });

        const mostTrainedMuscle = Object.entries(muscleGroupCounts)
            .sort(([,a], [,b]) => b - a)[0];

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
                        ${mostTrainedMuscle ?
        `${this.getMuscleGroupName(mostTrainedMuscle[0])}（${mostTrainedMuscle[1]}回）` :
        'データが不足しています'
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
     * チャートを破棄
     */
    destroy() {
        Object.values(this.charts).forEach(chart => {
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
