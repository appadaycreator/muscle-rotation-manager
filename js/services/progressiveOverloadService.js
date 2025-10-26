// js/services/progressiveOverloadService.js - プログレッシブ・オーバーロード分析サービス

import { workoutDataService } from './workoutDataService.js';

/**
 * プログレッシブ・オーバーロード分析サービス
 * トレーニングの進歩を定量的に分析し、最適化提案を行う
 */
export class ProgressiveOverloadService {
  constructor() {
    this.analysisCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分間キャッシュ
  }

  /**
   * エクササイズ別の進歩分析を取得
   * @param {string} exerciseName - エクササイズ名
   * @param {number} days - 分析期間（日数）
   * @returns {Promise<Object>} 進歩分析データ
   */
  async getExerciseProgress(exerciseName, days = 90) {
    const cacheKey = `exercise_${exerciseName}_${days}`;
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) return cached;

    try {
      const workouts = await workoutDataService.loadWorkouts({ limit: 1000 });
      const exerciseData = this.filterExerciseData(workouts, exerciseName, days);
      
      const analysis = {
        exerciseName,
        period: days,
        totalSessions: exerciseData.length,
        progressMetrics: this.calculateProgressMetrics(exerciseData),
        volumeProgression: this.calculateVolumeProgression(exerciseData),
        intensityProgression: this.calculateIntensityProgression(exerciseData),
        recommendations: this.generateRecommendations(exerciseData),
        trends: this.analyzeTrends(exerciseData),
        lastUpdated: new Date().toISOString()
      };

      this.setCachedAnalysis(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing exercise progress:', error);
      throw error;
    }
  }

  /**
   * 部位別の進歩分析を取得
   * @param {string} muscleGroup - 筋肉部位
   * @param {number} days - 分析期間（日数）
   * @returns {Promise<Object>} 部位別進歩分析データ
   */
  async getMuscleGroupProgress(muscleGroup, days = 90) {
    const cacheKey = `muscle_${muscleGroup}_${days}`;
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) return cached;

    try {
      const workouts = await workoutDataService.loadWorkouts({ limit: 1000 });
      const muscleData = this.filterMuscleGroupData(workouts, muscleGroup, days);
      
      const analysis = {
        muscleGroup,
        period: days,
        totalSessions: muscleData.length,
        exercises: this.analyzeMuscleGroupExercises(muscleData),
        volumeProgression: this.calculateMuscleGroupVolumeProgression(muscleData),
        frequencyAnalysis: this.analyzeMuscleGroupFrequency(muscleData),
        recommendations: this.generateMuscleGroupRecommendations(muscleData),
        lastUpdated: new Date().toISOString()
      };

      this.setCachedAnalysis(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing muscle group progress:', error);
      throw error;
    }
  }

  /**
   * 総合的な進歩分析を取得
   * @param {number} days - 分析期間（日数）
   * @returns {Promise<Object>} 総合進歩分析データ
   */
  async getOverallProgress(days = 90) {
    const cacheKey = `overall_${days}`;
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) return cached;

    try {
      const workouts = await workoutDataService.loadWorkouts({ limit: 1000 });
      const recentWorkouts = this.filterRecentWorkouts(workouts, days);
      
      const analysis = {
        period: days,
        totalWorkouts: recentWorkouts.length,
        overallMetrics: this.calculateOverallMetrics(recentWorkouts),
        muscleGroupProgress: await this.calculateAllMuscleGroupProgress(recentWorkouts),
        exerciseProgress: await this.calculateAllExerciseProgress(recentWorkouts),
        consistencyScore: this.calculateConsistencyScore(recentWorkouts),
        recommendations: this.generateOverallRecommendations(recentWorkouts),
        lastUpdated: new Date().toISOString()
      };

      this.setCachedAnalysis(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing overall progress:', error);
      throw error;
    }
  }

  /**
   * エクササイズデータをフィルタリング
   * @param {Array} workouts - ワークアウトデータ
   * @param {string} exerciseName - エクササイズ名
   * @param {number} days - 期間
   * @returns {Array} フィルタされたデータ
   */
  filterExerciseData(workouts, exerciseName, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return workouts
      .filter(workout => {
        const workoutDate = new Date(workout.date || workout.startTime);
        return workoutDate >= cutoffDate;
      })
      .map(workout => ({
        ...workout,
        exerciseData: (workout.exercises || []).filter(exercise => 
          exercise.name && exercise.name.toLowerCase().includes(exerciseName.toLowerCase())
        )
      }))
      .filter(workout => workout.exerciseData.length > 0);
  }

  /**
   * 筋肉部位データをフィルタリング
   * @param {Array} workouts - ワークアウトデータ
   * @param {string} muscleGroup - 筋肉部位
   * @param {number} days - 期間
   * @returns {Array} フィルタされたデータ
   */
  filterMuscleGroupData(workouts, muscleGroup, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return workouts
      .filter(workout => {
        const workoutDate = new Date(workout.date || workout.startTime);
        return workoutDate >= cutoffDate;
      })
      .filter(workout => {
        const muscleGroups = workout.muscle_groups || [];
        return muscleGroups.some(muscle => 
          muscle.toLowerCase().includes(muscleGroup.toLowerCase())
        );
      });
  }

  /**
   * 最近のワークアウトをフィルタリング
   * @param {Array} workouts - ワークアウトデータ
   * @param {number} days - 期間
   * @returns {Array} フィルタされたデータ
   */
  filterRecentWorkouts(workouts, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date || workout.startTime);
      return workoutDate >= cutoffDate;
    });
  }

  /**
   * 進歩メトリクスを計算
   * @param {Array} exerciseData - エクササイズデータ
   * @returns {Object} 進歩メトリクス
   */
  calculateProgressMetrics(exerciseData) {
    if (exerciseData.length === 0) {
      return {
        volumeProgression: 0,
        intensityProgression: 0,
        consistencyScore: 0,
        averageWeight: 0,
        averageReps: 0,
        averageSets: 0
      };
    }

    const sessions = exerciseData.map(workout => {
      const exercise = workout.exerciseData[0];
      return {
        date: new Date(workout.date || workout.startTime),
        weight: exercise.weight || 0,
        reps: exercise.reps || 0,
        sets: exercise.sets || 0,
        volume: (exercise.weight || 0) * (exercise.reps || 0) * (exercise.sets || 0)
      };
    }).sort((a, b) => a.date - b.date);

    const firstHalf = sessions.slice(0, Math.ceil(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));

    const firstHalfAvgVolume = this.calculateAverageVolume(firstHalf);
    const secondHalfAvgVolume = this.calculateAverageVolume(secondHalf);
    const volumeProgression = firstHalfAvgVolume > 0 
      ? ((secondHalfAvgVolume - firstHalfAvgVolume) / firstHalfAvgVolume) * 100 
      : 0;

    const firstHalfAvgWeight = this.calculateAverageWeight(firstHalf);
    const secondHalfAvgWeight = this.calculateAverageWeight(secondHalf);
    const intensityProgression = firstHalfAvgWeight > 0 
      ? ((secondHalfAvgWeight - firstHalfAvgWeight) / firstHalfAvgWeight) * 100 
      : 0;

    return {
      volumeProgression: Math.round(volumeProgression * 10) / 10,
      intensityProgression: Math.round(intensityProgression * 10) / 10,
      consistencyScore: this.calculateConsistencyScore(exerciseData),
      averageWeight: Math.round(this.calculateAverageWeight(sessions) * 10) / 10,
      averageReps: Math.round(this.calculateAverageReps(sessions) * 10) / 10,
      averageSets: Math.round(this.calculateAverageSets(sessions) * 10) / 10,
      totalSessions: sessions.length
    };
  }

  /**
   * ボリューム進歩を計算
   * @param {Array} exerciseData - エクササイズデータ
   * @returns {Array} ボリューム進歩データ
   */
  calculateVolumeProgression(exerciseData) {
    return exerciseData.map(workout => {
      const exercise = workout.exerciseData[0];
      const volume = (exercise.weight || 0) * (exercise.reps || 0) * (exercise.sets || 0);
      return {
        date: new Date(workout.date || workout.startTime),
        volume,
        weight: exercise.weight || 0,
        reps: exercise.reps || 0,
        sets: exercise.sets || 0
      };
    }).sort((a, b) => a.date - b.date);
  }

  /**
   * 強度進歩を計算
   * @param {Array} exerciseData - エクササイズデータ
   * @returns {Array} 強度進歩データ
   */
  calculateIntensityProgression(exerciseData) {
    return exerciseData.map(workout => {
      const exercise = workout.exerciseData[0];
      return {
        date: new Date(workout.date || workout.startTime),
        weight: exercise.weight || 0,
        reps: exercise.reps || 0,
        sets: exercise.sets || 0,
        intensity: exercise.weight || 0
      };
    }).sort((a, b) => a.date - b.date);
  }

  /**
   * 筋肉部位のエクササイズ分析
   * @param {Array} muscleData - 筋肉部位データ
   * @returns {Object} エクササイズ分析
   */
  analyzeMuscleGroupExercises(muscleData) {
    const exerciseCounts = {};
    const exerciseProgress = {};

    muscleData.forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        const exerciseName = exercise.name;
        if (!exerciseCounts[exerciseName]) {
          exerciseCounts[exerciseName] = 0;
          exerciseProgress[exerciseName] = [];
        }
        exerciseCounts[exerciseName]++;
        exerciseProgress[exerciseName].push({
          date: new Date(workout.date || workout.startTime),
          weight: exercise.weight || 0,
          reps: exercise.reps || 0,
          sets: exercise.sets || 0
        });
      });
    });

    // 各エクササイズの進歩を計算
    Object.keys(exerciseProgress).forEach(exerciseName => {
      const sessions = exerciseProgress[exerciseName].sort((a, b) => a.date - b.date);
      if (sessions.length >= 2) {
        const firstSession = sessions[0];
        const lastSession = sessions[sessions.length - 1];
        const weightProgress = firstSession.weight > 0 
          ? ((lastSession.weight - firstSession.weight) / firstSession.weight) * 100 
          : 0;
        
        exerciseProgress[exerciseName] = {
          sessions: sessions,
          weightProgress: Math.round(weightProgress * 10) / 10,
          totalSessions: sessions.length
        };
      }
    });

    return {
      exerciseCounts,
      exerciseProgress
    };
  }

  /**
   * 筋肉部位のボリューム進歩を計算
   * @param {Array} muscleData - 筋肉部位データ
   * @returns {Array} ボリューム進歩データ
   */
  calculateMuscleGroupVolumeProgression(muscleData) {
    return muscleData.map(workout => {
      const totalVolume = (workout.exercises || []).reduce((sum, exercise) => {
        return sum + ((exercise.weight || 0) * (exercise.reps || 0) * (exercise.sets || 0));
      }, 0);

      return {
        date: new Date(workout.date || workout.startTime),
        volume: totalVolume,
        exerciseCount: (workout.exercises || []).length,
        duration: workout.duration || 0
      };
    }).sort((a, b) => a.date - b.date);
  }

  /**
   * 筋肉部位の頻度分析
   * @param {Array} muscleData - 筋肉部位データ
   * @returns {Object} 頻度分析データ
   */
  analyzeMuscleGroupFrequency(muscleData) {
    const sessions = muscleData.map(workout => ({
      date: new Date(workout.date || workout.startTime)
    })).sort((a, b) => a.date - b.date);

    if (sessions.length === 0) {
      return {
        averageDaysBetween: 0,
        frequencyScore: 0,
        lastWorkout: null,
        nextRecommended: null
      };
    }

    // セッション間隔を計算
    const intervals = [];
    for (let i = 1; i < sessions.length; i++) {
      const interval = (sessions[i].date - sessions[i-1].date) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }

    const averageDaysBetween = intervals.length > 0 
      ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length 
      : 0;

    const lastWorkout = sessions[sessions.length - 1].date;
    const daysSinceLastWorkout = (new Date() - lastWorkout) / (1000 * 60 * 60 * 24);
    
    // 頻度スコア（理想的には2-3日間隔）
    const idealInterval = 2.5;
    const frequencyScore = averageDaysBetween > 0 
      ? Math.max(0, 100 - Math.abs(averageDaysBetween - idealInterval) * 20)
      : 0;

    const nextRecommended = new Date(lastWorkout);
    nextRecommended.setDate(nextRecommended.getDate() + Math.round(averageDaysBetween));

    return {
      averageDaysBetween: Math.round(averageDaysBetween * 10) / 10,
      frequencyScore: Math.round(frequencyScore),
      lastWorkout,
      nextRecommended,
      totalSessions: sessions.length
    };
  }

  /**
   * 総合メトリクスを計算
   * @param {Array} workouts - ワークアウトデータ
   * @returns {Object} 総合メトリクス
   */
  calculateOverallMetrics(workouts) {
    const totalVolume = workouts.reduce((sum, workout) => {
      return sum + (workout.exercises || []).reduce((exerciseSum, exercise) => {
        return exerciseSum + ((exercise.weight || 0) * (exercise.reps || 0) * (exercise.sets || 0));
      }, 0);
    }, 0);

    const totalDuration = workouts.reduce((sum, workout) => sum + (workout.duration || 0), 0);
    const averageDuration = workouts.length > 0 ? totalDuration / workouts.length : 0;

    const muscleGroupCounts = {};
    workouts.forEach(workout => {
      (workout.muscle_groups || []).forEach(muscle => {
        muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
      });
    });

    return {
      totalVolume: Math.round(totalVolume),
      totalDuration: Math.round(totalDuration / 60), // 分単位
      averageDuration: Math.round(averageDuration / 60), // 分単位
      muscleGroupDistribution: muscleGroupCounts,
      totalWorkouts: workouts.length,
      averageVolumePerWorkout: workouts.length > 0 ? Math.round(totalVolume / workouts.length) : 0
    };
  }

  /**
   * 全筋肉部位の進歩を計算
   * @param {Array} workouts - ワークアウトデータ
   * @returns {Promise<Object>} 全筋肉部位進歩データ
   */
  async calculateAllMuscleGroupProgress(workouts) {
    const muscleGroups = new Set();
    workouts.forEach(workout => {
      (workout.muscle_groups || []).forEach(muscle => muscleGroups.add(muscle));
    });

    const progress = {};
    for (const muscleGroup of muscleGroups) {
      try {
        progress[muscleGroup] = await this.getMuscleGroupProgress(muscleGroup, 90);
      } catch (error) {
        console.warn(`Error calculating progress for muscle group ${muscleGroup}:`, error);
        progress[muscleGroup] = null;
      }
    }

    return progress;
  }

  /**
   * 全エクササイズの進歩を計算
   * @param {Array} workouts - ワークアウトデータ
   * @returns {Promise<Object>} 全エクササイズ進歩データ
   */
  async calculateAllExerciseProgress(workouts) {
    const exercises = new Set();
    workouts.forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        if (exercise.name) exercises.add(exercise.name);
      });
    });

    const progress = {};
    for (const exerciseName of exercises) {
      try {
        progress[exerciseName] = await this.getExerciseProgress(exerciseName, 90);
      } catch (error) {
        console.warn(`Error calculating progress for exercise ${exerciseName}:`, error);
        progress[exerciseName] = null;
      }
    }

    return progress;
  }

  /**
   * 一貫性スコアを計算
   * @param {Array} workouts - ワークアウトデータ
   * @returns {number} 一貫性スコア（0-100）
   */
  calculateConsistencyScore(workouts) {
    if (workouts.length < 2) return 0;

    const sessions = workouts.map(workout => ({
      date: new Date(workout.date || workout.startTime)
    })).sort((a, b) => a.date - b.date);

    // セッション間隔の一貫性を計算
    const intervals = [];
    for (let i = 1; i < sessions.length; i++) {
      const interval = (sessions[i].date - sessions[i-1].date) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }

    if (intervals.length === 0) return 0;

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - averageInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);

    // 標準偏差が小さいほど一貫性が高い
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 10));
    return Math.round(consistencyScore);
  }

  /**
   * 推奨事項を生成
   * @param {Array} exerciseData - エクササイズデータ
   * @returns {Array} 推奨事項配列
   */
  generateRecommendations(exerciseData) {
    const recommendations = [];
    const metrics = this.calculateProgressMetrics(exerciseData);

    if (metrics.volumeProgression < 5) {
      recommendations.push({
        type: 'volume',
        priority: 'high',
        message: 'ボリュームの増加が停滞しています。セット数やレップ数を増やすことを検討してください。',
        action: 'セット数を1-2セット増やすか、レップ数を2-3回増やす'
      });
    }

    if (metrics.intensityProgression < 2) {
      recommendations.push({
        type: 'intensity',
        priority: 'medium',
        message: '重量の増加が緩やかです。より重い重量にチャレンジしてみてください。',
        action: '重量を2.5-5kg増やすか、より重い重量でレップ数を減らす'
      });
    }

    if (metrics.consistencyScore < 70) {
      recommendations.push({
        type: 'consistency',
        priority: 'high',
        message: 'トレーニングの一貫性を改善する必要があります。',
        action: '定期的なスケジュールを設定し、週2-3回の頻度を維持する'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'positive',
        priority: 'low',
        message: '素晴らしい進歩です！現在のトレーニングを継続してください。',
        action: '現在のプログラムを維持し、必要に応じて微調整する'
      });
    }

    return recommendations;
  }

  /**
   * 筋肉部位の推奨事項を生成
   * @param {Array} muscleData - 筋肉部位データ
   * @returns {Array} 推奨事項配列
   */
  generateMuscleGroupRecommendations(muscleData) {
    const recommendations = [];
    const frequencyAnalysis = this.analyzeMuscleGroupFrequency(muscleData);

    if (frequencyAnalysis.frequencyScore < 60) {
      recommendations.push({
        type: 'frequency',
        priority: 'high',
        message: 'この部位のトレーニング頻度が低すぎます。',
        action: '週1-2回の頻度でトレーニングを増やす'
      });
    }

    if (frequencyAnalysis.averageDaysBetween > 7) {
      recommendations.push({
        type: 'recovery',
        priority: 'medium',
        message: 'トレーニング間隔が長すぎる可能性があります。',
        action: 'より頻繁にトレーニングするか、他の部位との組み合わせを検討する'
      });
    }

    return recommendations;
  }

  /**
   * 総合推奨事項を生成
   * @param {Array} workouts - ワークアウトデータ
   * @returns {Array} 推奨事項配列
   */
  generateOverallRecommendations(workouts) {
    const recommendations = [];
    const metrics = this.calculateOverallMetrics(workouts);
    const consistencyScore = this.calculateConsistencyScore(workouts);

    if (consistencyScore < 60) {
      recommendations.push({
        type: 'consistency',
        priority: 'high',
        message: 'トレーニングの一貫性を改善しましょう。',
        action: '定期的なスケジュールを設定し、週3-4回の頻度を目標にする'
      });
    }

    if (metrics.averageVolumePerWorkout < 1000) {
      recommendations.push({
        type: 'volume',
        priority: 'medium',
        message: 'セッションあたりのボリュームを増やすことを検討してください。',
        action: 'エクササイズ数やセット数を増やす'
      });
    }

    const muscleGroups = Object.keys(metrics.muscleGroupDistribution);
    if (muscleGroups.length < 4) {
      recommendations.push({
        type: 'balance',
        priority: 'medium',
        message: 'より多くの筋肉部位をトレーニングしましょう。',
        action: '新しいエクササイズや筋肉部位を追加する'
      });
    }

    return recommendations;
  }

  /**
   * トレンドを分析
   * @param {Array} exerciseData - エクササイズデータ
   * @returns {Object} トレンド分析データ
   */
  analyzeTrends(exerciseData) {
    const sessions = exerciseData.map(workout => {
      const exercise = workout.exerciseData[0];
      return {
        date: new Date(workout.date || workout.startTime),
        weight: exercise.weight || 0,
        reps: exercise.reps || 0,
        sets: exercise.sets || 0,
        volume: (exercise.weight || 0) * (exercise.reps || 0) * (exercise.sets || 0)
      };
    }).sort((a, b) => a.date - b.date);

    if (sessions.length < 3) {
      return {
        weightTrend: 'insufficient_data',
        volumeTrend: 'insufficient_data',
        consistencyTrend: 'insufficient_data'
      };
    }

    // 線形回帰でトレンドを計算
    const weightTrend = this.calculateLinearTrend(sessions.map(s => s.weight));
    const volumeTrend = this.calculateLinearTrend(sessions.map(s => s.volume));

    return {
      weightTrend: weightTrend > 0.1 ? 'increasing' : weightTrend < -0.1 ? 'decreasing' : 'stable',
      volumeTrend: volumeTrend > 0.1 ? 'increasing' : volumeTrend < -0.1 ? 'decreasing' : 'stable',
      consistencyTrend: this.calculateConsistencyScore(exerciseData) > 70 ? 'good' : 'needs_improvement'
    };
  }

  /**
   * 線形トレンドを計算
   * @param {Array} values - 値の配列
   * @returns {number} トレンド係数
   */
  calculateLinearTrend(values) {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  // ヘルパーメソッド
  calculateAverageVolume(sessions) {
    return sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.volume, 0) / sessions.length 
      : 0;
  }

  calculateAverageWeight(sessions) {
    return sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.weight, 0) / sessions.length 
      : 0;
  }

  calculateAverageReps(sessions) {
    return sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.reps, 0) / sessions.length 
      : 0;
  }

  calculateAverageSets(sessions) {
    return sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.sets, 0) / sessions.length 
      : 0;
  }

  // キャッシュ管理
  getCachedAnalysis(key) {
    const cached = this.analysisCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCachedAnalysis(key, data) {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

// シングルトンインスタンスをエクスポート
export const progressiveOverloadService = new ProgressiveOverloadService();
