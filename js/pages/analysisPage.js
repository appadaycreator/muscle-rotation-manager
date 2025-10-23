// analysisPage.js - 分析ページの機能

import { supabaseService } from '../services/supabaseService.js';
import { authManager } from '../modules/authManager.js';
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

        // 認証状態をチェック
        const isAuthenticated = await authManager.isAuthenticated();
        if (!isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

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
     * ログインプロンプトを表示
     */
    showLoginPrompt() {
        const mainContent = safeGetElement('#main-content');
        if (!mainContent) return;

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
