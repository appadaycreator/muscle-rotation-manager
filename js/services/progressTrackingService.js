/**
 * プログレッシブ・オーバーロード追跡サービス
 * 重量・回数の推移、1RM計算、目標設定・達成度管理を行う
 */

import { supabaseService } from './supabaseService.js';
import { errorHandler } from '../utils/errorHandler.js';

class ProgressTrackingService {
    constructor() {
        this.supabase = supabaseService.getClient();
    }

    /**
     * 1RM（最大挙上重量）を計算する
     * Brzycki式を使用: 1RM = weight × (36 / (37 - reps))
     * @param {number} weight - 重量（kg）
     * @param {number} reps - 回数
     * @returns {number} 1RM値
     */
    calculateOneRM(weight, reps) {
        try {
            if (!weight || !reps || weight <= 0 || reps <= 0) {
                throw new Error('重量と回数は正の数である必要があります');
            }

            if (reps === 1) {
                return weight;
            }

            if (reps > 36) {
                throw new Error('36回を超える回数では1RM計算が不正確になります');
            }

            // Brzycki式による1RM計算
            const oneRM = weight * (36 / (37 - reps));
            return Math.round(oneRM * 10) / 10; // 小数点第1位まで
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.calculateOneRM');
            return 0;
        }
    }

    /**
     * エクササイズの進捗データを保存
     * @param {Object} progressData - 進捗データ
     * @returns {Promise<Object>} 保存結果
     */
    async saveProgressData(progressData) {
        try {
            const { data, error } = await this.supabase
                .from('training_logs')
                .insert({
                    user_id: progressData.userId,
                    exercise_id: progressData.exerciseId,
                    exercise_name: progressData.exerciseName,
                    muscle_group_id: progressData.muscleGroupId,
                    workout_date: progressData.workoutDate,
                    sets: progressData.sets,
                    reps: progressData.reps,
                    weights: progressData.weights,
                    workout_session_id: progressData.workoutSessionId,
                    // 1RM計算結果を保存
                    one_rm: this.calculateBestOneRM(progressData.reps, progressData.weights),
                    notes: progressData.notes
                });

            if (error) {throw error;}

            // 進捗統計を更新
            await this.updateProgressStats(progressData.userId, progressData.exerciseId);

            return { success: true, data };
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.saveProgressData');
            return { success: false, error: error.message };
        }
    }

    /**
     * セット内で最高の1RMを計算
     * @param {Array} repsArray - 回数の配列
     * @param {Array} weightsArray - 重量の配列
     * @returns {number} 最高1RM値
     */
    calculateBestOneRM(repsArray, weightsArray) {
        try {
            let bestOneRM = 0;

            for (let i = 0; i < repsArray.length && i < weightsArray.length; i++) {
                const oneRM = this.calculateOneRM(weightsArray[i], repsArray[i]);
                if (oneRM > bestOneRM) {
                    bestOneRM = oneRM;
                }
            }

            return bestOneRM;
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.calculateBestOneRM');
            return 0;
        }
    }

    /**
     * エクササイズの進捗履歴を取得
     * @param {string} userId - ユーザーID
     * @param {string} exerciseId - エクササイズID
     * @param {number} days - 取得する日数（デフォルト: 90日）
     * @returns {Promise<Array>} 進捗履歴
     */
    async getProgressHistory(userId, exerciseId, days = 90) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data, error } = await this.supabase
                .from('training_logs')
                .select(`
                    id,
                    workout_date,
                    sets,
                    reps,
                    weights,
                    one_rm,
                    exercise_name,
                    notes
                `)
                .eq('user_id', userId)
                .eq('exercise_id', exerciseId)
                .gte('workout_date', startDate.toISOString().split('T')[0])
                .order('workout_date', { ascending: true });

            if (error) {throw error;}

            // 各記録の1RMを再計算（データベースに保存されていない場合）
            return data.map(record => ({
                ...record,
                one_rm: record.one_rm || this.calculateBestOneRM(record.reps, record.weights)
            }));
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.getProgressHistory');
            return [];
        }
    }

    /**
     * 進捗統計を更新
     * @param {string} userId - ユーザーID
     * @param {string} exerciseId - エクササイズID
     */
    async updateProgressStats(userId, exerciseId) {
        try {
            // 最新30日の進捗データを取得
            const history = await this.getProgressHistory(userId, exerciseId, 30);

            if (history.length === 0) {return;}

            // 統計計算
            const oneRMValues = history.map(h => h.one_rm).filter(rm => rm > 0);
            const maxOneRM = Math.max(...oneRMValues);
            const avgOneRM = oneRMValues.reduce((sum, rm) => sum + rm, 0) / oneRMValues.length;

            // 進捗率計算（最初と最後の1RMを比較）
            const firstOneRM = oneRMValues[0] || 0;
            const lastOneRM = oneRMValues[oneRMValues.length - 1] || 0;
            const progressRate = firstOneRM > 0 ? ((lastOneRM - firstOneRM) / firstOneRM) * 100 : 0;

            // 統計データを保存/更新
            const { error } = await this.supabase
                .from('progress_stats')
                .upsert({
                    user_id: userId,
                    exercise_id: exerciseId,
                    max_one_rm: maxOneRM,
                    avg_one_rm: Math.round(avgOneRM * 10) / 10,
                    progress_rate: Math.round(progressRate * 10) / 10,
                    total_sessions: history.length,
                    last_updated: new Date().toISOString()
                });

            if (error) {throw error;}
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.updateProgressStats');
        }
    }

    /**
     * 目標を設定
     * @param {Object} goalData - 目標データ
     * @returns {Promise<Object>} 設定結果
     */
    async setGoal(goalData) {
        try {
            const { data, error } = await this.supabase
                .from('user_goals')
                .upsert({
                    user_id: goalData.userId,
                    exercise_id: goalData.exerciseId,
                    goal_type: goalData.goalType, // 'weight', 'reps', 'one_rm'
                    target_value: goalData.targetValue,
                    current_value: goalData.currentValue,
                    target_date: goalData.targetDate,
                    description: goalData.description,
                    is_active: true,
                    created_at: new Date().toISOString()
                });

            if (error) {throw error;}

            return { success: true, data };
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.setGoal');
            return { success: false, error: error.message };
        }
    }

    /**
     * 目標の達成度を計算
     * @param {string} userId - ユーザーID
     * @param {string} exerciseId - エクササイズID
     * @returns {Promise<Object>} 達成度データ
     */
    async calculateGoalProgress(userId, exerciseId) {
        try {
            // アクティブな目標を取得
            const { data: goals, error: goalError } = await this.supabase
                .from('user_goals')
                .select('*')
                .eq('user_id', userId)
                .eq('exercise_id', exerciseId)
                .eq('is_active', true);

            if (goalError) {throw goalError;}

            if (!goals || goals.length === 0) {
                return { hasGoals: false };
            }

            // 最新の進捗データを取得
            const history = await this.getProgressHistory(userId, exerciseId, 7);

            if (history.length === 0) {
                return { hasGoals: true, goals, progress: [] };
            }

            const latestRecord = history[history.length - 1];

            // 各目標の達成度を計算
            const progressData = goals.map(goal => {
                let currentValue = 0;

                switch (goal.goal_type) {
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

                const progressPercentage = goal.target_value > 0
                    ? Math.min(100, (currentValue / goal.target_value) * 100)
                    : 0;

                return {
                    ...goal,
                    current_value: currentValue,
                    progress_percentage: Math.round(progressPercentage * 10) / 10,
                    is_achieved: progressPercentage >= 100
                };
            });

            return { hasGoals: true, goals, progress: progressData };
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.calculateGoalProgress');
            return { hasGoals: false, error: error.message };
        }
    }

    /**
     * 月間パフォーマンス分析を生成
     * @param {string} userId - ユーザーID
     * @param {string} exerciseId - エクササイズID
     * @returns {Promise<Object>} 分析データ
     */
    async generateMonthlyAnalysis(userId, exerciseId) {
        try {
            const history = await this.getProgressHistory(userId, exerciseId, 30);

            if (history.length === 0) {
                return { hasData: false };
            }

            // 週別データを集計
            const weeklyData = this.groupByWeek(history);

            // トレンド分析
            const trend = this.analyzeTrend(history);

            // 統計計算
            const stats = this.calculateStats(history);

            return {
                hasData: true,
                weeklyData,
                trend,
                stats,
                totalSessions: history.length,
                dateRange: {
                    start: history[0].workout_date,
                    end: history[history.length - 1].workout_date
                }
            };
        } catch (error) {
            errorHandler.handleError(error, 'ProgressTrackingService.generateMonthlyAnalysis');
            return { hasData: false, error: error.message };
        }
    }

    /**
     * データを週別にグループ化
     * @param {Array} history - 履歴データ
     * @returns {Array} 週別データ
     */
    groupByWeek(history) {
        const weeks = {};

        history.forEach(record => {
            const date = new Date(record.workout_date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // 週の開始を日曜日に設定
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    weekStart: weekKey,
                    sessions: [],
                    maxWeight: 0,
                    maxOneRM: 0,
                    totalVolume: 0
                };
            }

            weeks[weekKey].sessions.push(record);
            weeks[weekKey].maxWeight = Math.max(weeks[weekKey].maxWeight, Math.max(...record.weights));
            weeks[weekKey].maxOneRM = Math.max(weeks[weekKey].maxOneRM, record.one_rm);

            // ボリューム計算（重量 × 回数 × セット数）
            const sessionVolume = record.weights.reduce((sum, weight, index) => {
                return sum + (weight * record.reps[index]);
            }, 0);
            weeks[weekKey].totalVolume += sessionVolume;
        });

        return Object.values(weeks).sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
    }

    /**
     * トレンド分析を実行
     * @param {Array} history - 履歴データ
     * @returns {Object} トレンド分析結果
     */
    analyzeTrend(history) {
        if (history.length < 2) {
            return { direction: 'insufficient_data', strength: 0 };
        }

        const oneRMValues = history.map(h => h.one_rm).filter(rm => rm > 0);

        if (oneRMValues.length < 2) {
            return { direction: 'insufficient_data', strength: 0 };
        }

        // 線形回帰による傾向分析
        const n = oneRMValues.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = oneRMValues;

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

        let direction = 'stable';
        const strength = Math.abs(slope);

        if (slope > 0.1) {
            direction = 'improving';
        } else if (slope < -0.1) {
            direction = 'declining';
        }

        return { direction, strength: Math.round(strength * 100) / 100 };
    }

    /**
     * 統計データを計算
     * @param {Array} history - 履歴データ
     * @returns {Object} 統計データ
     */
    calculateStats(history) {
        const oneRMValues = history.map(h => h.one_rm).filter(rm => rm > 0);
        const weights = history.flatMap(h => h.weights);
        const reps = history.flatMap(h => h.reps);

        return {
            maxOneRM: Math.max(...oneRMValues),
            avgOneRM: Math.round((oneRMValues.reduce((sum, rm) => sum + rm, 0) / oneRMValues.length) * 10) / 10,
            maxWeight: Math.max(...weights),
            avgWeight: Math.round((weights.reduce((sum, w) => sum + w, 0) / weights.length) * 10) / 10,
            maxReps: Math.max(...reps),
            avgReps: Math.round((reps.reduce((sum, r) => sum + r, 0) / reps.length) * 10) / 10,
            improvement: oneRMValues.length > 1
                ? Math.round(((oneRMValues[oneRMValues.length - 1] - oneRMValues[0]) / oneRMValues[0]) * 100 * 10) / 10
                : 0
        };
    }
}

// シングルトンインスタンスをエクスポート
export const progressTrackingService = new ProgressTrackingService();
