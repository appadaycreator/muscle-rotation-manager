// dashboardPage.js - ダッシュボードページの機能

import { supabaseService } from '../services/supabaseService.js';
import recommendationService from '../services/recommendationService.js';
import { showNotification, createErrorHTML, formatWorkoutDate, getDaysAgo, getWorkoutColor, parseExercises } from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';
import { authManager } from '../modules/authManager.js';

class DashboardPage {
    constructor() {
        this.muscleRecoveryData = [];
        this.recommendations = [];
    }

    /**
     * ダッシュボードページを初期化
     */
    async initialize() {
        console.log('Dashboard page initialized');

        try {
            // 認証状態を確認
            const isAuthenticated = await authManager.isAuthenticated();
            if (!isAuthenticated) {
                this.showLoginPrompt();
                return;
            }

            // データを並行して読み込み
            try {
                await Promise.all([
                    this.loadRecommendations(),
                    this.loadMuscleRecoveryData(),
                    this.loadRecentWorkouts(),
                    this.loadStats()
                ]);
            } catch (error) {
                console.error('Dashboard data loading failed:', error);
                // エラーが発生してもダッシュボードを表示
            }

            // ダッシュボードコンテンツを表示
            this.renderDashboard();

            // 筋肉部位クリックハンドラーを設定
            this.setupMusclePartHandlers();

            // 認証ボタンの設定
            this.setupAuthButton();

        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showNotification('ダッシュボードの初期化に失敗しました', 'error');
        }
    }

    /**
     * 筋肉部位クリックハンドラーを設定
     */
    setupMusclePartHandlers() {
        document.querySelectorAll('.muscle-part').forEach(part => {
            part.addEventListener('click', () => {
                const muscle = part.dataset.muscle;
                console.log(`Clicked muscle part: ${muscle}`);
                this.handleMusclePartClick(muscle);
            });
        });
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
                    <p class="text-gray-600 mb-6">ダッシュボードを表示するにはログインしてください</p>
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
     * ダッシュボードコンテンツを表示
     */
    renderDashboard() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">ダッシュボード</h1>
                <p class="mt-2 text-gray-600">今日のトレーニング状況と推奨事項を確認しましょう</p>
            </div>

            <!-- 統計カード -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-dumbbell text-2xl text-blue-600"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">総ワークアウト</dt>
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
                                <i class="fas fa-fire text-2xl text-orange-600"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">現在のストリーク</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="current-streak">0</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-calendar-week text-2xl text-green-600"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">週間進捗</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="weekly-progress">0/3</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-clock text-2xl text-purple-600"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">最後のワークアウト</dt>
                                    <dd class="text-lg font-medium text-gray-900" id="last-workout">なし</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 今日の推奨事項 -->
            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">今日の推奨事項</h3>
                    <div id="today-recommendations">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-info-circle text-xl mb-2"></i>
                            <p>推奨事項を読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 筋肉回復状況 -->
            <div class="bg-white shadow rounded-lg mb-8">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">筋肉回復状況</h3>
                    <div id="muscle-recovery-grid">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p>回復データを読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 最近のワークアウト -->
            <div class="bg-white shadow rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">最近のワークアウト</h3>
                    <div id="recent-workouts">
                        <div class="text-center text-gray-500 py-4">
                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p>ワークアウト履歴を読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
     * 統計データを読み込み
     */
    async loadStats() {
        try {
            const stats = await supabaseService.getUserStats();
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    /**
     * 統計表示を更新
     */
    updateStatsDisplay(stats) {
        const weeklyWorkouts = document.getElementById('weekly-workouts');
        const totalTime = document.getElementById('total-time');
        const streakDays = document.getElementById('streak-days');
        const goalsAchieved = document.getElementById('goals-achieved');

        if (weeklyWorkouts) {weeklyWorkouts.textContent = stats.weeklyWorkouts || 0;}
        if (totalTime) {totalTime.textContent = `${stats.totalMinutes || 0}分`;}
        if (streakDays) {streakDays.textContent = `${stats.streakDays || 0}日`;}
        if (goalsAchieved) {goalsAchieved.textContent = `${stats.goalsAchieved || 0}/5`;}
    }

    /**
     * 筋肉部位クリック処理
     * @param {string} muscle - 筋肉部位ID
     */
    handleMusclePartClick(muscle) {
        const muscleGroup = MUSCLE_GROUPS.find(group => group.id === muscle);
        if (muscleGroup) {
            this.showMuscleDetails(muscle);
        }
    }

    /**
     * 推奨詳細を表示
     * @param {number} index - 推奨事項のインデックス
     */
    showRecommendationDetails(index) {
        const recommendation = this.recommendations[index];
        if (!recommendation || !recommendation.muscleId) {return;}

        const details = recommendationService.getRecommendationDetails(recommendation.muscleId);
        if (!details) {return;}

        const modalContent = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
                 onclick="this.remove()">
                <div class="bg-white rounded-lg p-6 max-w-md mx-4" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">
                            ${details.muscleName}の推奨理由
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">科学的根拠</h4>
                            <p class="text-sm text-gray-600">${details.scientificBasis}</p>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">回復メカニズム</h4>
                            <p class="text-sm text-gray-600">${details.recoveryScience}</p>
                        </div>
                        
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="font-medium text-gray-700 mb-2">詳細情報</h4>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• 筋肉カテゴリ: ${details.category === 'large' ? '大筋群' : details.category === 'medium' ? '中筋群' : '小筋群'}</li>
                                <li>• 標準回復時間: ${details.recoveryHours}時間</li>
                                <li>• あなたの体力レベル: ${this.getFitnessLevelName(details.userFitnessLevel)}</li>
                                <li>• 回復時間調整: ${Math.round((details.fitnessLevelAdjustment - 1) * 100)}%</li>
                            </ul>
                        </div>
                        
                        <div class="flex space-x-2">
                            <button onclick="this.closest('.fixed').remove(); window.pageManager?.showPage('workout')" 
                                    class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                                ワークアウト開始
                            </button>
                            <button onclick="this.closest('.fixed').remove()" 
                                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalContent);
    }

    /**
     * 筋肉詳細を表示
     * @param {string} muscleId - 筋肉部位ID
     */
    showMuscleDetails(muscleId) {
        const muscleData = this.muscleRecoveryData.find(m => m.id === muscleId);
        if (!muscleData) {return;}

        const modalContent = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
                 onclick="this.remove()">
                <div class="bg-white rounded-lg p-6 max-w-md mx-4" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-male ${muscleData.iconColor} mr-2"></i>
                            ${muscleData.name}の状態
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="text-center">
                            <div class="text-3xl font-bold ${muscleData.recoveryColor} mb-2">
                                ${muscleData.recovery}%
                            </div>
                            <div class="text-sm text-gray-600">回復度</div>
                            <div class="w-full bg-gray-200 rounded-full h-3 mt-2">
                                <div class="recovery-bar ${muscleData.recoveryClass} rounded-full h-3" 
                                     style="width: ${muscleData.recovery}%;"></div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="text-gray-500">最終トレーニング</div>
                                <div class="font-medium">${muscleData.lastTrained}</div>
                            </div>
                            <div>
                                <div class="text-gray-500">次回推奨</div>
                                <div class="font-medium">${muscleData.nextRecommended}</div>
                            </div>
                        </div>
                        
                        ${muscleData.recoveryFactors ? `
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <h4 class="font-medium text-gray-700 mb-2">回復計算詳細</h4>
                                <ul class="text-xs text-gray-600 space-y-1">
                                    <li>• 基本回復時間: ${muscleData.recoveryFactors.baseHours}時間</li>
                                    <li>• 前回強度: ${muscleData.recoveryFactors.lastIntensity}</li>
                                    <li>• 強度調整: ×${muscleData.recoveryFactors.intensityMultiplier}</li>
                                    <li>• 体力レベル調整: ×${muscleData.recoveryFactors.fitnessMultiplier}</li>
                                </ul>
                            </div>
                        ` : ''}
                        
                        <div class="flex space-x-2">
                            ${muscleData.isReady ? `
                                <button onclick="this.closest('.fixed').remove(); window.pageManager?.showPage('workout')" 
                                        class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                    トレーニング開始
                                </button>
                            ` : `
                                <button disabled 
                                        class="flex-1 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">
                                    回復中（${muscleData.hoursUntilRecovery}時間後）
                                </button>
                            `}
                            <button onclick="this.closest('.fixed').remove()" 
                                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalContent);
    }

    /**
     * 体力レベル名を取得
     * @param {string} level - 体力レベル
     * @returns {string} 日本語名
     */
    getFitnessLevelName(level) {
        const levelNames = {
            beginner: '初心者',
            intermediate: '中級者',
            advanced: '上級者',
            expert: 'エキスパート'
        };
        return levelNames[level] || '中級者';
    }

    /**
     * 推奨事項を読み込み
     */
    async loadRecommendations() {
        const container = document.getElementById('today-recommendations');
        if (!container) {return;}

        try {
            this.recommendations = await this.getRecommendations();

            if (this.recommendations.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        <i class="fas fa-info-circle text-xl mb-2"></i>
                        <p>今日の推奨事項はありません</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.recommendations.map((rec, index) => `
                <div class="flex items-center space-x-3 p-3 ${rec.bgColor} rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                     onclick="dashboardPage.showRecommendationDetails(${index})">
                    <div class="w-3 h-3 ${rec.dotColor} rounded-full"></div>
                    <div class="flex-1">
                        <span class="${rec.textColor}">${rec.message}</span>
                        ${rec.scientificBasis ? `
                            <div class="text-xs ${rec.textColor} opacity-75 mt-1">
                                <i class="fas fa-info-circle mr-1"></i>
                                科学的根拠: ${rec.scientificBasis}
                            </div>
                        ` : ''}
                    </div>
                    ${rec.type === 'primary' || rec.type === 'secondary' ? `
                        <i class="fas fa-chevron-right ${rec.textColor} opacity-50"></i>
                    ` : ''}
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading recommendations:', error);
            container.innerHTML = createErrorHTML('おすすめの読み込みに失敗しました');
        }
    }

    /**
     * 筋肉回復データを読み込み
     */
    async loadMuscleRecoveryData() {
        const container = document.getElementById('muscle-recovery-grid');
        if (!container) {return;}

        try {
            this.muscleRecoveryData = await this.getMuscleRecoveryData();

            if (this.muscleRecoveryData.length === 0) {
                container.innerHTML = createErrorHTML(
                    '回復度データがありません',
                    'fas fa-info-circle'
                );
                return;
            }

            container.innerHTML = this.muscleRecoveryData.map(muscle => `
                <div class="muscle-card muscle-part rounded-lg p-6" data-muscle="${muscle.id}">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-male ${muscle.iconColor} mr-2"></i>
                            <span data-i18n="muscle.${muscle.id}">${muscle.name}</span>
                        </h3>
                        <span class="text-sm text-gray-500">最終: ${muscle.lastTrained}</span>
                    </div>
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span data-i18n="dashboard.recovery">回復度</span>
                            <span class="font-semibold ${muscle.recoveryColor}">
                                ${muscle.recovery}%
                            </span>
                        </div>
                        <div class="recovery-bar ${muscle.recoveryClass} rounded-full"
                             style="width: ${muscle.recovery}%;"></div>
                    </div>
                    <div class="text-sm text-gray-600">
                        次回推奨: ${muscle.nextRecommended}
                    </div>
                </div>
            `).join('');

            // 再度筋肉部位ハンドラーを設定
            this.setupMusclePartHandlers();

        } catch (error) {
            console.error('Error loading muscle recovery data:', error);
            container.innerHTML = createErrorHTML('回復度データの読み込みに失敗しました');
        }
    }

    /**
     * 最近のワークアウトを読み込み
     */
    async loadRecentWorkouts() {
        const container = document.getElementById('recent-workouts');
        if (!container) {return;}

        try {
            const workouts = await this.getRecentWorkouts();

            if (workouts.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        <i class="fas fa-info-circle text-xl mb-2"></i>
                        <p>まだワークアウトが記録されていません</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = workouts.map(workout => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg 
                     hover:bg-gray-100 transition-colors">
                    <div class="flex items-center space-x-3 flex-1">
                        <div class="workout-dot ${workout.color}"></div>
                        <div class="flex-1">
                            <div class="font-medium text-gray-800">${workout.name}</div>
                            <div class="text-sm text-gray-500 mb-1">${workout.exercises}</div>
                            <div class="flex items-center space-x-4 text-xs text-gray-400">
                                <span><i class="fas fa-clock mr-1"></i>${workout.duration}</span>
                                <span>
                                    <i class="fas fa-dumbbell mr-1"></i>${workout.totalSets}セット
                                </span>
                                <span>
                                    <i class="fas fa-weight-hanging mr-1"></i>
                                    最大${workout.maxWeight}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium text-gray-700">
                            ${formatWorkoutDate(workout.date)}
                        </div>
                        <div class="text-xs text-gray-400">${getDaysAgo(workout.date)}</div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading recent workouts:', error);
            container.innerHTML = createErrorHTML('最近のワークアウトの読み込みに失敗しました');
        }
    }

    /**
     * 推奨事項を取得（科学的根拠に基づく）
     * @returns {Promise<Array>} 推奨事項配列
     */
    async getRecommendations() {
        try {
            return await recommendationService.getRecommendations();
        } catch (error) {
            console.error('推奨事項の取得に失敗:', error);
            return recommendationService.getFallbackRecommendations();
        }
    }

    /**
     * 筋肉回復データを取得（科学的根拠に基づく）
     * @returns {Promise<Array>} 筋肉回復データ配列
     */
    async getMuscleRecoveryData() {
        try {
            return await recommendationService.getMuscleRecoveryData();
        } catch (error) {
            console.error('筋肉回復データの取得に失敗:', error);
            // フォールバック: 基本的なモックデータを返す
            return MUSCLE_GROUPS.map((muscle, index) => ({
                ...muscle,
                lastTrained: `${index + 1}日前`,
                recovery: Math.floor(Math.random() * 100),
                recoveryColor: 'text-green-600',
                recoveryClass: 'bg-green-500',
                nextRecommended: '明日'
            }));
        }
    }

    /**
     * 最近のワークアウトを取得
     * @returns {Promise<Array>} ワークアウト配列
     */
    async getRecentWorkouts() {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            return [];
        }

        try {
            const data = await supabaseService.getWorkouts(5);

            // データが配列でない場合は空配列を返す
            if (!Array.isArray(data)) {
                console.warn('getWorkouts returned non-array data:', data);
                return [];
            }

            return data.map(workout => {
                const exercises = parseExercises(workout.exercises || workout.training_logs);
                const color = getWorkoutColor(workout.name || workout.session_name);

                return {
                    id: workout.id,
                    name: workout.name || workout.session_name,
                    exercises: Array.isArray(exercises) ? exercises.join(', ') : exercises,
                    date: workout.date || workout.workout_date,
                    color,
                    duration: workout.duration || workout.total_duration_minutes || '0分',
                    totalSets: workout.total_sets || (workout.training_logs ? workout.training_logs.length : 0),
                    maxWeight: workout.max_weight || '0kg'
                };
            });
        } catch (error) {
            console.error('Error fetching recent workouts:', error);
            showNotification('最近のワークアウトの取得に失敗しました', 'error');
            return [];
        }
    }
}

// デフォルトエクスポート
// ページが読み込まれた時に自動初期化
document.addEventListener('DOMContentLoaded', async () => {
    const dashboardPage = new DashboardPage();
    await dashboardPage.initialize();
});

export default new DashboardPage();
