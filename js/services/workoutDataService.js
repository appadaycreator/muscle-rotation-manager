// js/services/workoutDataService.js - ワークアウトデータ管理サービス

import { supabaseService } from './supabaseService.js';
import { showNotification } from '../utils/helpers.js';

/**
 * ワークアウトデータ管理サービス
 * ローカルストレージとSupabaseの両方に対応
 */
export class WorkoutDataService {
  constructor() {
    this.localStorageKey = 'workoutHistory';
    this.plannedWorkoutsKey = 'plannedWorkouts';
    this.userSettingsKey = 'userSettings';
  }

  /**
   * ワークアウトデータを保存
   * @param {Object} workoutData - ワークアウトデータ
   * @returns {Promise<boolean>} 保存成功かどうか
   */
  async saveWorkout(workoutData) {
    try {
      // データの検証
      if (!this.validateWorkoutData(workoutData)) {
        throw new Error('Invalid workout data');
      }

      // ローカルストレージに保存
      const success = await this.saveToLocalStorage(workoutData);
      
      // Supabaseが利用可能な場合はクラウドにも保存
      if (supabaseService.isAvailable()) {
        try {
          await this.saveToSupabase(workoutData);
        } catch (error) {
          console.warn('Failed to save to Supabase:', error);
          // ローカルストレージへの保存は成功しているので、エラーを無視
        }
      }

      return success;
    } catch (error) {
      console.error('Error saving workout:', error);
      showNotification('ワークアウトの保存に失敗しました', 'error');
      return false;
    }
  }

  /**
   * ワークアウトデータを検証
   * @param {Object} workoutData - ワークアウトデータ
   * @returns {boolean} 有効かどうか
   */
  validateWorkoutData(workoutData) {
    if (!workoutData) return false;
    if (!workoutData.date && !workoutData.startTime) return false;
    if (!workoutData.muscle_groups || !Array.isArray(workoutData.muscle_groups)) return false;
    if (!workoutData.exercises || !Array.isArray(workoutData.exercises)) return false;
    
    return true;
  }

  /**
   * ローカルストレージに保存
   * @param {Object} workoutData - ワークアウトデータ
   * @returns {Promise<boolean>} 保存成功かどうか
   */
  async saveToLocalStorage(workoutData) {
    try {
      // 既存のデータを取得
      const existingData = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      
      // 新しいデータにIDを追加
      const newWorkout = {
        ...workoutData,
        id: workoutData.id || `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        saved_at: new Date().toISOString(),
        source: 'local'
      };

      // 既存のデータに追加
      existingData.push(newWorkout);

      // 日付順でソート（新しい順）
      existingData.sort((a, b) => {
        const dateA = new Date(a.date || a.startTime);
        const dateB = new Date(b.date || b.startTime);
        return dateB - dateA;
      });

      // ローカルストレージに保存
      localStorage.setItem(this.localStorageKey, JSON.stringify(existingData));

      console.log('Workout saved to localStorage:', newWorkout);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Supabaseに保存
   * @param {Object} workoutData - ワークアウトデータ
   * @returns {Promise<boolean>} 保存成功かどうか
   */
  async saveToSupabase(workoutData) {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const workoutRecord = {
        user_id: user.id,
        workout_date: workoutData.date || workoutData.startTime,
        muscle_groups: workoutData.muscle_groups,
        exercises: workoutData.exercises,
        duration: workoutData.duration || 0,
        notes: workoutData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await supabaseService.saveWorkout(workoutRecord);
      
      if (result.success) {
        console.log('Workout saved to Supabase:', result.data);
        return true;
      } else {
        throw new Error(result.error || 'Failed to save to Supabase');
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
  }

  /**
   * ワークアウトデータを読み込み
   * @param {Object} options - 読み込みオプション
   * @param {number} options.limit - 取得件数制限
   * @param {string} options.startDate - 開始日
   * @param {string} options.endDate - 終了日
   * @returns {Promise<Array>} ワークアウトデータ配列
   */
  async loadWorkouts(options = {}) {
    try {
      const { limit = 100, startDate, endDate } = options;

      // ローカルストレージから読み込み
      const localData = await this.loadFromLocalStorage();
      
      // Supabaseが利用可能な場合はクラウドからも読み込み
      let cloudData = [];
      if (supabaseService.isAvailable()) {
        try {
          cloudData = await this.loadFromSupabase(options);
        } catch (error) {
          console.warn('Failed to load from Supabase:', error);
        }
      }

      // データをマージ（重複を除去）
      const mergedData = this.mergeWorkoutData(localData, cloudData);

      // フィルタリング
      let filteredData = mergedData;
      
      if (startDate) {
        filteredData = filteredData.filter(workout => {
          const workoutDate = new Date(workout.date || workout.startTime);
          return workoutDate >= new Date(startDate);
        });
      }
      
      if (endDate) {
        filteredData = filteredData.filter(workout => {
          const workoutDate = new Date(workout.date || workout.startTime);
          return workoutDate <= new Date(endDate);
        });
      }

      // 件数制限
      if (limit > 0) {
        filteredData = filteredData.slice(0, limit);
      }

      console.log(`Loaded ${filteredData.length} workouts`);
      return filteredData;
    } catch (error) {
      console.error('Error loading workouts:', error);
      showNotification('ワークアウトデータの読み込みに失敗しました', 'error');
      return [];
    }
  }

  /**
   * ローカルストレージから読み込み
   * @returns {Promise<Array>} ワークアウトデータ配列
   */
  async loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  /**
   * Supabaseから読み込み
   * @param {Object} options - 読み込みオプション
   * @returns {Promise<Array>} ワークアウトデータ配列
   */
  async loadFromSupabase(options = {}) {
    try {
      const { limit = 100, startDate, endDate } = options;
      
      const result = await supabaseService.getWorkouts(limit, startDate, endDate);
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to load from Supabase');
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      throw error;
    }
  }

  /**
   * ワークアウトデータをマージ（重複除去）
   * @param {Array} localData - ローカルデータ
   * @param {Array} cloudData - クラウドデータ
   * @returns {Array} マージされたデータ
   */
  mergeWorkoutData(localData, cloudData) {
    const mergedData = [...localData];
    const localIds = new Set(localData.map(item => item.id));

    // クラウドデータでローカルにないものを追加
    cloudData.forEach(cloudItem => {
      if (!localIds.has(cloudItem.id)) {
        mergedData.push({
          ...cloudItem,
          source: 'cloud'
        });
      }
    });

    // 日付順でソート（新しい順）
    mergedData.sort((a, b) => {
      const dateA = new Date(a.date || a.startTime || a.workout_date);
      const dateB = new Date(b.date || b.startTime || b.workout_date);
      return dateB - dateA;
    });

    return mergedData;
  }

  /**
   * 月間統計を計算
   * @param {number} year - 年
   * @param {number} month - 月（0-11）
   * @returns {Promise<Object>} 月間統計データ
   */
  async getMonthlyStats(year, month) {
    try {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const workouts = await this.loadWorkouts({
        startDate,
        endDate
      });

      const stats = {
        totalWorkouts: workouts.length,
        totalDuration: 0,
        workoutDays: new Set(),
        muscleGroups: {},
        exercises: {}
      };

      workouts.forEach(workout => {
        // 総時間
        stats.totalDuration += workout.duration || 0;
        
        // トレーニング日数
        const workoutDate = workout.date || workout.startTime || workout.workout_date;
        stats.workoutDays.add(workoutDate);
        
        // 部位別カウント
        if (workout.muscle_groups) {
          workout.muscle_groups.forEach(muscle => {
            stats.muscleGroups[muscle] = (stats.muscleGroups[muscle] || 0) + 1;
          });
        }
        
        // エクササイズ別カウント
        if (workout.exercises) {
          workout.exercises.forEach(exercise => {
            const exerciseName = exercise.name || exercise.exercise_name;
            if (exerciseName) {
              stats.exercises[exerciseName] = (stats.exercises[exerciseName] || 0) + 1;
            }
          });
        }
      });

      // 平均時間を計算
      stats.averageDuration = stats.totalWorkouts > 0 
        ? Math.round(stats.totalDuration / stats.totalWorkouts) 
        : 0;

      // トレーニング日数を数値に変換
      stats.workoutDaysCount = stats.workoutDays.size;

      return stats;
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      return {
        totalWorkouts: 0,
        totalDuration: 0,
        workoutDaysCount: 0,
        averageDuration: 0,
        muscleGroups: {},
        exercises: {}
      };
    }
  }

  /**
   * 部位別統計を計算
   * @param {number} year - 年
   * @param {number} month - 月（0-11）
   * @returns {Promise<Object>} 部位別統計データ
   */
  async getMuscleGroupStats(year, month) {
    try {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const workouts = await this.loadWorkouts({
        startDate,
        endDate
      });

      const muscleStats = {};

      workouts.forEach(workout => {
        if (workout.muscle_groups) {
          workout.muscle_groups.forEach(muscle => {
            if (!muscleStats[muscle]) {
              muscleStats[muscle] = {
                count: 0,
                totalDuration: 0,
                exercises: new Set()
              };
            }
            
            muscleStats[muscle].count++;
            muscleStats[muscle].totalDuration += workout.duration || 0;
            
            // エクササイズを記録
            if (workout.exercises) {
              workout.exercises.forEach(exercise => {
                const exerciseName = exercise.name || exercise.exercise_name;
                if (exerciseName) {
                  muscleStats[muscle].exercises.add(exerciseName);
                }
              });
            }
          });
        }
      });

      // Setを配列に変換
      Object.keys(muscleStats).forEach(muscle => {
        muscleStats[muscle].exercises = Array.from(muscleStats[muscle].exercises);
      });

      return muscleStats;
    } catch (error) {
      console.error('Error calculating muscle group stats:', error);
      return {};
    }
  }

  /**
   * ワークアウトデータを削除
   * @param {string} workoutId - ワークアウトID
   * @returns {Promise<boolean>} 削除成功かどうか
   */
  async deleteWorkout(workoutId) {
    try {
      // ローカルストレージから削除
      const success = await this.deleteFromLocalStorage(workoutId);
      
      // Supabaseが利用可能な場合はクラウドからも削除
      if (supabaseService.isAvailable()) {
        try {
          await this.deleteFromSupabase(workoutId);
        } catch (error) {
          console.warn('Failed to delete from Supabase:', error);
        }
      }

      return success;
    } catch (error) {
      console.error('Error deleting workout:', error);
      showNotification('ワークアウトの削除に失敗しました', 'error');
      return false;
    }
  }

  /**
   * ローカルストレージから削除
   * @param {string} workoutId - ワークアウトID
   * @returns {Promise<boolean>} 削除成功かどうか
   */
  async deleteFromLocalStorage(workoutId) {
    try {
      const existingData = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      const filteredData = existingData.filter(workout => workout.id !== workoutId);
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(filteredData));
      
      console.log('Workout deleted from localStorage:', workoutId);
      return true;
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      return false;
    }
  }

  /**
   * Supabaseから削除
   * @param {string} workoutId - ワークアウトID
   * @returns {Promise<boolean>} 削除成功かどうか
   */
  async deleteFromSupabase(workoutId) {
    try {
      const result = await supabaseService.deleteWorkout(workoutId);
      
      if (result.success) {
        console.log('Workout deleted from Supabase:', workoutId);
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete from Supabase');
      }
    } catch (error) {
      console.error('Error deleting from Supabase:', error);
      throw error;
    }
  }

  /**
   * データをエクスポート
   * @returns {Promise<string>} エクスポートされたJSON文字列
   */
  async exportData() {
    try {
      const workouts = await this.loadWorkouts({ limit: 1000 });
      const plannedWorkouts = JSON.parse(localStorage.getItem(this.plannedWorkoutsKey) || '[]');
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        workouts,
        plannedWorkouts,
        metadata: {
          totalWorkouts: workouts.length,
          totalPlannedWorkouts: plannedWorkouts.length
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * データをインポート
   * @param {string} jsonData - インポートするJSON文字列
   * @returns {Promise<boolean>} インポート成功かどうか
   */
  async importData(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.workouts || !Array.isArray(importData.workouts)) {
        throw new Error('Invalid import data format');
      }

      // 既存のデータをバックアップ
      const existingData = await this.loadFromLocalStorage();
      localStorage.setItem(`${this.localStorageKey}_backup`, JSON.stringify(existingData));

      // 新しいデータを保存
      localStorage.setItem(this.localStorageKey, JSON.stringify(importData.workouts));
      
      if (importData.plannedWorkouts) {
        localStorage.setItem(this.plannedWorkoutsKey, JSON.stringify(importData.plannedWorkouts));
      }

      console.log('Data imported successfully:', importData.metadata);
      showNotification('データのインポートが完了しました', 'success');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      showNotification('データのインポートに失敗しました', 'error');
      return false;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const workoutDataService = new WorkoutDataService();
