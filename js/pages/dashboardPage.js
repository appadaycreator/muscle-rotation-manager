// dashboardPage.js - ダッシュボードページの機能

import { supabaseService } from '../services/supabaseService.js';
import { showNotification, createErrorHTML, formatWorkoutDate, getDaysAgo, getWorkoutColor, parseExercises } from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';

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
            // データを並行して読み込み
            await Promise.all([
                this.loadRecommendations(),
                this.loadMuscleRecoveryData(),
                this.loadRecentWorkouts()
            ]);

            // 筋肉部位クリックハンドラーを設定
            this.setupMusclePartHandlers();

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
     * 筋肉部位クリック処理
     * @param {string} muscle - 筋肉部位ID
     */
    handleMusclePartClick(muscle) {
        const muscleGroup = MUSCLE_GROUPS.find(group => group.id === muscle);
        if (muscleGroup) {
            showNotification(`${muscleGroup.name}の詳細を表示します`, 'info');
            // 将来的にはワークアウトページに遷移するなどの処理を追加
        }
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

            container.innerHTML = this.recommendations.map(rec => `
                <div class="flex items-center space-x-3 p-3 ${rec.bgColor} rounded-lg">
                    <div class="w-3 h-3 ${rec.dotColor} rounded-full"></div>
                    <span class="${rec.textColor}">${rec.message}</span>
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
                            <span class="font-semibold ${muscle.recoveryColor}">${muscle.recovery}%</span>
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
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex items-center space-x-3 flex-1">
                        <div class="workout-dot ${workout.color}"></div>
                        <div class="flex-1">
                            <div class="font-medium text-gray-800">${workout.name}</div>
                            <div class="text-sm text-gray-500 mb-1">${workout.exercises}</div>
                            <div class="flex items-center space-x-4 text-xs
                                      text-gray-400">
                                <span><i class="fas fa-clock mr-1"></i>${workout.duration}</span>
                                <span><i class="fas fa-dumbbell mr-1"></i>${workout.totalSets}セット</span>
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
     * 推奨事項を取得（モック）
     * @returns {Promise<Array>} 推奨事項配列
     */
    async getRecommendations() {
        // 実際のAPIコールに置き換える
        await new Promise(resolve => setTimeout(resolve, 500));

        // モックデータ
        return [
            {
                message: '今日は胸筋のトレーニングがおすすめです',
                bgColor: 'bg-blue-50',
                dotColor: 'bg-blue-500',
                textColor: 'text-blue-700'
            },
            {
                message: '前回から48時間経過しています',
                bgColor: 'bg-green-50',
                dotColor: 'bg-green-500',
                textColor: 'text-green-700'
            }
        ];
    }

    /**
     * 筋肉回復データを取得（モック）
     * @returns {Promise<Array>} 筋肉回復データ配列
     */
    async getMuscleRecoveryData() {
        // 実際のAPIコールに置き換える
        await new Promise(resolve => setTimeout(resolve, 500));

        // モックデータ
        return MUSCLE_GROUPS.map((muscle, index) => ({
            ...muscle,
            lastTrained: `${index + 1}日前`,
            recovery: Math.floor(Math.random() * 100),
            recoveryColor: 'text-green-600',
            recoveryClass: 'bg-green-500',
            nextRecommended: '明日'
        }));
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

            return data.map(workout => {
                const exercises = parseExercises(workout.exercises);
                const color = getWorkoutColor(workout.name);

                return {
                    id: workout.id,
                    name: workout.name,
                    exercises: Array.isArray(exercises) ? exercises.join(', ') : exercises,
                    date: workout.date,
                    color,
                    duration: workout.duration || '0分',
                    totalSets: workout.total_sets || 0,
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
export default new DashboardPage();
