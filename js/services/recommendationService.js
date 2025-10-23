// recommendationService.js - 科学的根拠に基づく推奨アルゴリズム

import { supabaseService } from './supabaseService.js';
import {
    MUSCLE_GROUPS,
    RECOVERY_SCIENCE,
    INTENSITY_MULTIPLIERS,
    FITNESS_LEVEL_MULTIPLIERS
} from '../utils/constants.js';

/**
 * 推奨アルゴリズムサービス
 * 科学的根拠に基づいた筋肉部位推奨システム
 */
class RecommendationService {
    constructor() {
        this.userSettings = this.loadUserSettings();
    }

    /**
     * ユーザー設定を読み込み
     * @returns {Object} ユーザー設定
     */
    loadUserSettings() {
        const defaultSettings = {
            // 基本設定
            fitnessLevel: 'beginner',
            primaryGoal: 'muscle_gain',
            workoutFrequency: 3,

            // 詳細設定
            experienceMonths: 0,
            recoveryPreference: 'standard',
            sleepHoursPerNight: 7.0,
            stressLevel: 5,
            preferredWorkoutTime: '18:00',
            preferredWorkoutDuration: 60,

            // 旧設定（互換性のため）
            preferredIntensity: 'moderate',
            trainingFrequency: 3,
            restDayPreference: 'sunday'
        };

        try {
            // 新しい設定を優先的に読み込み
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const legacySettings = JSON.parse(localStorage.getItem('userFitnessSettings') || '{}');

            // 新しい設定項目をマッピング
            const mappedSettings = {
                ...defaultSettings,
                ...legacySettings,

                // 新しい設定項目
                fitnessLevel: userProfile.fitness_level || defaultSettings.fitnessLevel,
                primaryGoal: userProfile.primary_goal || defaultSettings.primaryGoal,
                workoutFrequency: userProfile.workout_frequency || defaultSettings.workoutFrequency,
                experienceMonths: userProfile.experience_months || defaultSettings.experienceMonths,
                recoveryPreference: userProfile.recovery_preference || defaultSettings.recoveryPreference,
                sleepHoursPerNight: userProfile.sleep_hours_per_night || defaultSettings.sleepHoursPerNight,
                stressLevel: userProfile.stress_level || defaultSettings.stressLevel,
                preferredWorkoutTime: userProfile.preferred_workout_time || defaultSettings.preferredWorkoutTime,
                preferredWorkoutDuration: userProfile.preferred_workout_duration || defaultSettings.preferredWorkoutDuration
            };

            return mappedSettings;
        } catch (error) {
            console.warn('ユーザー設定の読み込みに失敗:', error);
            return defaultSettings;
        }
    }

    /**
     * 筋肉回復度を計算
     * @param {Date} lastWorkoutDate - 最後のワークアウト日
     * @param {string} muscleGroupId - 筋肉部位ID
     * @param {string} lastIntensity - 前回の強度
     * @returns {Object} 回復度情報
     */
    calculateRecoveryPercentage(lastWorkoutDate, muscleGroupId, lastIntensity = 'moderate') {
        if (!lastWorkoutDate) {
            return {
                percentage: 100,
                status: 'fully_recovered',
                hoursUntilRecovery: 0,
                isReady: true
            };
        }

        const muscleGroup = MUSCLE_GROUPS.find(mg => mg.id === muscleGroupId);
        if (!muscleGroup) {
            throw new Error(`筋肉部位が見つかりません: ${muscleGroupId}`);
        }

        // 基本回復時間を取得
        const baseRecoveryHours = muscleGroup.recoveryHours;

        // 強度による調整
        const intensityMultiplier = INTENSITY_MULTIPLIERS[lastIntensity] || 1.0;

        // 体力レベルによる調整
        const fitnessMultiplier = FITNESS_LEVEL_MULTIPLIERS[this.userSettings.fitnessLevel] || 1.0;

        // 回復設定による調整
        const recoveryMultiplier = this.getRecoveryMultiplier();

        // ライフスタイル要因による調整
        const lifestyleMultiplier = this.getLifestyleMultiplier();

        // 調整後の回復時間
        const adjustedRecoveryHours = baseRecoveryHours * intensityMultiplier * fitnessMultiplier * recoveryMultiplier * lifestyleMultiplier;

        // 経過時間を計算
        const now = new Date();
        const timeDiff = now - new Date(lastWorkoutDate);
        const hoursElapsed = timeDiff / (1000 * 60 * 60);

        // 回復度を計算
        const recoveryPercentage = Math.min(100, Math.round((hoursElapsed / adjustedRecoveryHours) * 100));
        const hoursUntilRecovery = Math.max(0, adjustedRecoveryHours - hoursElapsed);

        let status;
        if (recoveryPercentage >= 100) {
            status = 'fully_recovered';
        } else if (recoveryPercentage >= 80) {
            status = 'mostly_recovered';
        } else if (recoveryPercentage >= 50) {
            status = 'partially_recovered';
        } else {
            status = 'still_recovering';
        }

        return {
            percentage: recoveryPercentage,
            status,
            hoursUntilRecovery: Math.round(hoursUntilRecovery * 10) / 10,
            isReady: recoveryPercentage >= 80, // 80%以上で推奨対象
            adjustedRecoveryHours: Math.round(adjustedRecoveryHours * 10) / 10,
            factors: {
                baseHours: baseRecoveryHours,
                intensityMultiplier,
                fitnessMultiplier,
                lastIntensity
            }
        };
    }

    /**
     * 筋肉回復データを取得
     * @returns {Promise<Array>} 筋肉回復データ配列
     */
    async getMuscleRecoveryData() {
        try {
            // Supabaseからワークアウト履歴を取得
            let workoutHistory = [];
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                workoutHistory = await supabaseService.getWorkouts(30); // 過去30件
            } else {
                // オフライン時はローカルストレージから取得
                const localHistory = localStorage.getItem('workoutHistory');
                workoutHistory = localHistory ? JSON.parse(localHistory) : [];
            }

            // 各筋肉部位の回復データを計算
            const recoveryData = MUSCLE_GROUPS.map(muscle => {
                // 該当部位の最新ワークアウトを検索
                const lastWorkout = this.findLastWorkoutForMuscle(workoutHistory, muscle.id);

                let recoveryInfo = {
                    percentage: 100,
                    status: 'fully_recovered',
                    hoursUntilRecovery: 0,
                    isReady: true
                };

                let lastTrained = 'なし';
                let nextRecommended = '今すぐ';

                if (lastWorkout) {
                    recoveryInfo = this.calculateRecoveryPercentage(
                        lastWorkout.date,
                        muscle.id,
                        lastWorkout.intensity || 'moderate'
                    );

                    lastTrained = this.formatLastTrainedDate(lastWorkout.date);
                    nextRecommended = this.formatNextRecommendedTime(recoveryInfo.hoursUntilRecovery);
                }

                return {
                    ...muscle,
                    lastTrained,
                    recovery: recoveryInfo.percentage,
                    recoveryStatus: recoveryInfo.status,
                    hoursUntilRecovery: recoveryInfo.hoursUntilRecovery,
                    nextRecommended,
                    isReady: recoveryInfo.isReady,
                    recoveryColor: this.getRecoveryColor(recoveryInfo.percentage),
                    recoveryClass: this.getRecoveryClass(recoveryInfo.percentage),
                    lastWorkout,
                    recoveryFactors: recoveryInfo.factors
                };
            });

            return recoveryData;

        } catch (error) {
            console.error('筋肉回復データの取得に失敗:', error);
            throw error;
        }
    }

    /**
     * 特定筋肉部位の最新ワークアウトを検索
     * @param {Array} workoutHistory - ワークアウト履歴
     * @param {string} muscleId - 筋肉部位ID
     * @returns {Object|null} 最新ワークアウト
     */
    findLastWorkoutForMuscle(workoutHistory, muscleId) {
        // ワークアウト履歴を日付順にソート（新しい順）
        const sortedHistory = workoutHistory
            .filter(workout => workout.muscle_groups_trained && workout.muscle_groups_trained.includes(muscleId))
            .sort((a, b) => new Date(b.date || b.workout_date) - new Date(a.date || a.workout_date));

        return sortedHistory.length > 0 ? {
            ...sortedHistory[0],
            date: sortedHistory[0].date || sortedHistory[0].workout_date
        } : null;
    }

    /**
     * 推奨部位を取得
     * @returns {Promise<Array>} 推奨事項配列
     */
    async getRecommendations() {
        try {
            const recoveryData = await this.getMuscleRecoveryData();

            // 推奨対象の部位を抽出（回復度80%以上）
            const readyMuscles = recoveryData.filter(muscle => muscle.isReady);

            // 優先度でソート
            const prioritizedMuscles = this.prioritizeMuscles(readyMuscles, recoveryData);

            // 推奨メッセージを生成
            const recommendations = this.generateRecommendationMessages(prioritizedMuscles, recoveryData);

            return recommendations;

        } catch (error) {
            console.error('推奨事項の取得に失敗:', error);
            return this.getFallbackRecommendations();
        }
    }

    /**
     * 筋肉部位の優先度付け
     * @param {Array} readyMuscles - 回復済み筋肉部位
     * @param {Array} allMuscles - 全筋肉部位データ
     * @returns {Array} 優先度付きリスト
     */
    prioritizeMuscles(readyMuscles) {
        return readyMuscles.map(muscle => {
            let priority = 0;

            // 回復度による優先度（100%回復は高優先度）
            priority += muscle.recovery;

            // 最後のトレーニングからの経過時間による優先度
            if (muscle.lastWorkout) {
                const daysSinceLastWorkout = this.getDaysSinceLastWorkout(muscle.lastWorkout.date);
                priority += Math.min(daysSinceLastWorkout * 10, 50); // 最大50ポイント
            } else {
                priority += 100; // 未トレーニング部位は最高優先度
            }

            // 大筋群は優先度を上げる
            if (muscle.category === 'large') {
                priority += 20;
            }

            return {
                ...muscle,
                priority: Math.round(priority)
            };
        }).sort((a, b) => b.priority - a.priority);
    }

    /**
     * 推奨メッセージを生成
     * @param {Array} prioritizedMuscles - 優先度付き筋肉部位
     * @param {Array} allMuscles - 全筋肉部位データ
     * @returns {Array} 推奨メッセージ配列
     */
    generateRecommendationMessages(prioritizedMuscles) {
        const recommendations = [];

        if (prioritizedMuscles.length === 0) {
            recommendations.push({
                message: '全ての部位が回復中です。休息日をお勧めします',
                bgColor: 'bg-gray-50',
                dotColor: 'bg-gray-500',
                textColor: 'text-gray-700',
                type: 'rest',
                scientificBasis: '筋肉の成長には適切な休息が必要です'
            });
            return recommendations;
        }

        // トップ推奨部位
        const topMuscle = prioritizedMuscles[0];
        recommendations.push({
            message: `今日は${topMuscle.name}のトレーニングが最適です`,
            bgColor: topMuscle.bgColor,
            dotColor: topMuscle.iconColor.replace('text-', 'bg-'),
            textColor: topMuscle.textColor,
            type: 'primary',
            muscleId: topMuscle.id,
            scientificBasis: topMuscle.scientificBasis,
            priority: topMuscle.priority,
            recoveryPercentage: topMuscle.recovery
        });

        // 回復度情報
        if (topMuscle.recovery === 100) {
            recommendations.push({
                message: `${topMuscle.name}は完全回復済み（${topMuscle.recovery}%）`,
                bgColor: 'bg-green-50',
                dotColor: 'bg-green-500',
                textColor: 'text-green-700',
                type: 'recovery_status',
                scientificBasis: '完全回復により最大のトレーニング効果が期待できます'
            });
        } else if (topMuscle.recovery >= 80) {
            recommendations.push({
                message: `${topMuscle.name}は十分回復済み（${topMuscle.recovery}%）`,
                bgColor: 'bg-blue-50',
                dotColor: 'bg-blue-500',
                textColor: 'text-blue-700',
                type: 'recovery_status',
                scientificBasis: '80%以上の回復で効果的なトレーニングが可能です'
            });
        }

        // セカンダリ推奨（複数部位トレーニングの提案）
        if (prioritizedMuscles.length > 1) {
            const secondaryMuscle = prioritizedMuscles[1];
            recommendations.push({
                message: `${secondaryMuscle.name}も併せてトレーニング可能です`,
                bgColor: 'bg-purple-50',
                dotColor: 'bg-purple-500',
                textColor: 'text-purple-700',
                type: 'secondary',
                muscleId: secondaryMuscle.id,
                scientificBasis: '複数部位の同時トレーニングで効率性向上'
            });
        }

        // 体力レベルに応じたアドバイス
        const fitnessAdvice = this.getFitnessLevelAdvice();
        if (fitnessAdvice) {
            recommendations.push(fitnessAdvice);
        }

        // 目標に基づくアドバイス
        const goalAdvice = this.getGoalBasedAdvice();
        if (goalAdvice) {
            recommendations.push(goalAdvice);
        }

        // 頻度に基づくアドバイス
        const frequencyAdvice = this.getFrequencyAdvice();
        if (frequencyAdvice) {
            recommendations.push(frequencyAdvice);
        }

        return recommendations;
    }

    /**
     * 体力レベルに応じたアドバイスを取得
     * @returns {Object|null} アドバイス
     */
    getFitnessLevelAdvice() {
        const level = this.userSettings.fitnessLevel;

        const adviceMap = {
            beginner: {
                message: '初心者の方は週2-3回のトレーニングから始めましょう',
                bgColor: 'bg-yellow-50',
                dotColor: 'bg-yellow-500',
                textColor: 'text-yellow-700',
                type: 'fitness_advice',
                scientificBasis: '初心者は神経系の適応と基礎体力向上が優先されます'
            },
            intermediate: {
                message: '中級者は週3-4回のバランス良いトレーニングが効果的です',
                bgColor: 'bg-indigo-50',
                dotColor: 'bg-indigo-500',
                textColor: 'text-indigo-700',
                type: 'fitness_advice',
                scientificBasis: '中級者は筋肥大と筋力向上のバランスが重要です'
            },
            advanced: {
                message: '上級者は高強度トレーニングと適切な回復のバランスを重視しましょう',
                bgColor: 'bg-red-50',
                dotColor: 'bg-red-500',
                textColor: 'text-red-700',
                type: 'fitness_advice',
                scientificBasis: '上級者は高強度刺激と十分な回復時間が成長の鍵です'
            }
        };

        return adviceMap[level] || null;
    }

    /**
     * 目標に基づくアドバイスを取得
     * @returns {Object|null} アドバイス
     */
    getGoalBasedAdvice() {
        const goal = this.userSettings.primaryGoal;
        const recommendedIntensity = this.getRecommendedIntensity();

        const adviceMap = {
            strength: {
                message: `筋力向上が目標です。${recommendedIntensity === 'high' ? '高強度' : '中強度'}トレーニングを心がけましょう`,
                bgColor: 'bg-red-50',
                dotColor: 'bg-red-500',
                textColor: 'text-red-700',
                type: 'goal_advice',
                scientificBasis: '筋力向上には高負荷・低回数のトレーニングが効果的です'
            },
            muscle_gain: {
                message: '筋肥大が目標です。中強度で適切なボリュームを確保しましょう',
                bgColor: 'bg-blue-50',
                dotColor: 'bg-blue-500',
                textColor: 'text-blue-700',
                type: 'goal_advice',
                scientificBasis: '筋肥大には中負荷・中回数でのボリューム確保が重要です'
            },
            endurance: {
                message: '持久力向上が目標です。低強度・高回数を意識しましょう',
                bgColor: 'bg-green-50',
                dotColor: 'bg-green-500',
                textColor: 'text-green-700',
                type: 'goal_advice',
                scientificBasis: '筋持久力向上には低負荷・高回数のトレーニングが適しています'
            },
            weight_loss: {
                message: '減量が目標です。中強度で代謝を高めるトレーニングを行いましょう',
                bgColor: 'bg-orange-50',
                dotColor: 'bg-orange-500',
                textColor: 'text-orange-700',
                type: 'goal_advice',
                scientificBasis: '減量には筋トレと有酸素運動の組み合わせが効果的です'
            },
            general_fitness: {
                message: '健康維持が目標です。無理のない範囲で継続しましょう',
                bgColor: 'bg-teal-50',
                dotColor: 'bg-teal-500',
                textColor: 'text-teal-700',
                type: 'goal_advice',
                scientificBasis: '健康維持には継続性が最も重要な要素です'
            }
        };

        return adviceMap[goal] || null;
    }

    /**
     * 頻度に基づくアドバイスを取得
     * @returns {Object|null} アドバイス
     */
    getFrequencyAdvice() {
        const currentFrequency = this.userSettings.workoutFrequency;
        const recommendedFrequency = this.getRecommendedFrequency();

        if (currentFrequency < recommendedFrequency) {
            return {
                message: `現在の頻度（週${currentFrequency}回）より、週${recommendedFrequency}回がおすすめです`,
                bgColor: 'bg-amber-50',
                dotColor: 'bg-amber-500',
                textColor: 'text-amber-700',
                type: 'frequency_advice',
                scientificBasis: '適切な頻度でのトレーニングが効果を最大化します'
            };
        } else if (currentFrequency > recommendedFrequency + 1) {
            return {
                message: `現在の頻度（週${currentFrequency}回）は高めです。回復に注意しましょう`,
                bgColor: 'bg-rose-50',
                dotColor: 'bg-rose-500',
                textColor: 'text-rose-700',
                type: 'frequency_advice',
                scientificBasis: '過度な頻度はオーバートレーニングのリスクがあります'
            };
        }

        return null;
    }

    /**
     * フォールバック推奨事項
     * @returns {Array} デフォルト推奨事項
     */
    getFallbackRecommendations() {
        return [
            {
                message: '今日は胸筋のトレーニングがおすすめです',
                bgColor: 'bg-blue-50',
                dotColor: 'bg-blue-500',
                textColor: 'text-blue-700',
                type: 'fallback',
                scientificBasis: '大筋群から始めることで全身の成長を促進できます'
            }
        ];
    }

    /**
     * 最後のトレーニング日をフォーマット
     * @param {string|Date} date - 日付
     * @returns {string} フォーマット済み文字列
     */
    formatLastTrainedDate(date) {
        if (!date) {return 'なし';}

        const workoutDate = new Date(date);
        const now = new Date();
        const diffTime = now - workoutDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {return '今日';}
        if (diffDays === 1) {return '昨日';}
        if (diffDays < 7) {return `${diffDays}日前`;}
        if (diffDays < 30) {return `${Math.floor(diffDays / 7)}週間前`;}
        return `${Math.floor(diffDays / 30)}ヶ月前`;
    }

    /**
     * 次回推奨時間をフォーマット
     * @param {number} hoursUntilRecovery - 回復までの時間
     * @returns {string} フォーマット済み文字列
     */
    formatNextRecommendedTime(hoursUntilRecovery) {
        if (hoursUntilRecovery <= 0) {return '今すぐ';}
        if (hoursUntilRecovery < 24) {return `${Math.round(hoursUntilRecovery)}時間後`;}

        const days = Math.floor(hoursUntilRecovery / 24);
        const hours = Math.round(hoursUntilRecovery % 24);

        if (hours === 0) {return `${days}日後`;}
        return `${days}日${hours}時間後`;
    }

    /**
     * 最後のワークアウトからの経過日数を取得
     * @param {string|Date} date - 日付
     * @returns {number} 経過日数
     */
    getDaysSinceLastWorkout(date) {
        if (!date) {return 999;}

        const workoutDate = new Date(date);
        const now = new Date();
        const diffTime = now - workoutDate;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * 回復度に応じた色を取得
     * @param {number} percentage - 回復度
     * @returns {string} CSSクラス
     */
    getRecoveryColor(percentage) {
        if (percentage >= 100) {return 'text-green-600';}
        if (percentage >= 80) {return 'text-blue-600';}
        if (percentage >= 50) {return 'text-yellow-600';}
        return 'text-red-600';
    }

    /**
     * 回復度に応じたバークラスを取得
     * @param {number} percentage - 回復度
     * @returns {string} CSSクラス
     */
    getRecoveryClass(percentage) {
        if (percentage >= 100) {return 'bg-green-500';}
        if (percentage >= 80) {return 'bg-blue-500';}
        if (percentage >= 50) {return 'bg-yellow-500';}
        return 'bg-red-500';
    }

    /**
     * 回復設定による倍率を取得
     * @returns {number} 回復倍率
     */
    getRecoveryMultiplier() {
        const recoveryMultipliers = {
            fast: 0.8,    // 20%短縮
            standard: 1.0, // 標準
            slow: 1.3     // 30%延長
        };

        return recoveryMultipliers[this.userSettings.recoveryPreference] || 1.0;
    }

    /**
     * ライフスタイル要因による倍率を取得
     * @returns {number} ライフスタイル倍率
     */
    getLifestyleMultiplier() {
        let multiplier = 1.0;

        // 睡眠時間による調整
        const sleepHours = this.userSettings.sleepHoursPerNight;
        if (sleepHours < 6) {
            multiplier *= 1.2; // 睡眠不足は回復を遅らせる
        } else if (sleepHours >= 8) {
            multiplier *= 0.9; // 十分な睡眠は回復を促進
        }

        // ストレスレベルによる調整
        const stressLevel = this.userSettings.stressLevel;
        if (stressLevel >= 8) {
            multiplier *= 1.15; // 高ストレスは回復を遅らせる
        } else if (stressLevel <= 3) {
            multiplier *= 0.95; // 低ストレスは回復を促進
        }

        return multiplier;
    }

    /**
     * 目標に基づく推奨強度を取得
     * @returns {string} 推奨強度
     */
    getRecommendedIntensity() {
        const intensityMap = {
            strength: 'high',      // 筋力向上は高強度
            muscle_gain: 'moderate', // 筋肥大は中強度
            endurance: 'low',      // 持久力は低強度
            weight_loss: 'moderate', // 減量は中強度
            general_fitness: 'low'  // 健康維持は低強度
        };

        return intensityMap[this.userSettings.primaryGoal] || 'moderate';
    }

    /**
     * 体力レベルに基づく推奨頻度を取得
     * @returns {number} 推奨週間頻度
     */
    getRecommendedFrequency() {
        const frequencyMap = {
            beginner: 2,     // 初心者は週2回
            intermediate: 3, // 中級者は週3回
            advanced: 4      // 上級者は週4回
        };

        return frequencyMap[this.userSettings.fitnessLevel] || 3;
    }

    /**
     * ユーザー設定を更新
     * @param {Object} newSettings - 新しい設定
     */
    updateUserSettings(newSettings) {
        this.userSettings = { ...this.userSettings, ...newSettings };

        // 新しい設定形式で保存
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const updatedProfile = {
            ...userProfile,
            fitness_level: newSettings.fitnessLevel || this.userSettings.fitnessLevel,
            primary_goal: newSettings.primaryGoal || this.userSettings.primaryGoal,
            workout_frequency: newSettings.workoutFrequency || this.userSettings.workoutFrequency,
            recovery_preference: newSettings.recoveryPreference || this.userSettings.recoveryPreference,
            sleep_hours_per_night: newSettings.sleepHoursPerNight || this.userSettings.sleepHoursPerNight,
            stress_level: newSettings.stressLevel || this.userSettings.stressLevel
        };

        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        // 互換性のため旧形式も保存
        localStorage.setItem('userFitnessSettings', JSON.stringify(this.userSettings));
    }

    /**
     * 推奨理由の詳細を取得
     * @param {string} muscleId - 筋肉部位ID
     * @returns {Object} 詳細情報
     */
    getRecommendationDetails(muscleId) {
        const muscle = MUSCLE_GROUPS.find(mg => mg.id === muscleId);
        if (!muscle) {return null;}

        const recoveryScience = RECOVERY_SCIENCE[muscle.category];

        return {
            muscleName: muscle.name,
            category: muscle.category,
            recoveryHours: muscle.recoveryHours,
            scientificBasis: muscle.scientificBasis,
            recoveryScience: recoveryScience.reason,
            fitnessLevelAdjustment: FITNESS_LEVEL_MULTIPLIERS[this.userSettings.fitnessLevel],
            userFitnessLevel: this.userSettings.fitnessLevel
        };
    }
}

// シングルトンインスタンスをエクスポート
export default new RecommendationService();
