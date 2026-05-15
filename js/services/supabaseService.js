// js/services/supabaseService.js - localStorage移行版
// Supabaseを除去し、localStorage（muscle_progress, muscle_logs）で管理

// localStorage ヘルパー
function lsGet(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; } }
function lsSet(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {} }
function lsGenId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

/**
 * localStorage専用サービス（Supabase除去版）
 */
export class SupabaseService {
  constructor(_options = {}) {
    this.client = null;
    this.isConnected = false;
  }

  async initialize(_options = {}) {
    console.log('Supabase removed: using localStorage (muscle_progress, muscle_logs)');
    this.isConnected = false;
    return false;
  }

  isAvailable() { return false; }

  async testConnection() { return false; }

  startHealthCheck() {}
  stopHealthCheck() {}

  delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  updatePerformanceMetrics() {}
  getPerformanceMetrics() { return { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageResponseTime: 0, successRate: 0 }; }
  healthCheck() { return { isHealthy: true, issues: [], score: 100, metrics: { isConnected: false } }; }

  async getAuthState() { return { user: null, session: null }; }
  getCurrentUser() { return null; }

  async signUp(_email, _password, _userData = {}) { throw new Error('Auth disabled: no Supabase'); }
  async signIn(_email, _password) { throw new Error('Auth disabled: no Supabase'); }
  async signOut() {}

  // ワークアウト履歴 → muscle_logs
  async getWorkoutHistory(limit = 50) {
    const data = lsGet('muscle_logs');
    return data.slice(-limit).reverse();
  }

  async getWorkouts(limit = 50) { return this.getWorkoutHistory(limit); }

  async saveWorkout(workoutData) {
    const items = lsGet('muscle_logs');
    const newItem = { ...workoutData, id: lsGenId(), created_at: new Date().toISOString() };
    items.push(newItem);
    lsSet('muscle_logs', items);
    return [newItem];
  }

  async saveTrainingLogs(trainingLogs) {
    const items = lsGet('muscle_logs');
    const newItems = trainingLogs.map(log => ({ ...log, id: lsGenId(), created_at: new Date().toISOString() }));
    newItems.forEach(item => items.push(item));
    lsSet('muscle_logs', items);
    return newItems;
  }

  // exercises はlocalのconstantsから提供
  async getExercises() { return []; }
  async getMuscleGroups() { return []; }

  // 筋肉回復データ → muscle_progress
  async getMuscleRecoveryData() {
    return lsGet('muscle_progress');
  }

  async getRecommendations() { return []; }

  async getUserProfile() {
    const data = localStorage.getItem('userProfile');
    return data ? JSON.parse(data) : {};
  }

  async updateUserProfile(profileData) {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    return [profileData];
  }

  async saveData(tableName, data) {
    const key = tableName === 'training_logs' ? 'muscle_logs' :
                tableName === 'progress_stats' ? 'muscle_progress' : tableName;
    const items = lsGet(key);
    const newItem = { ...data, id: lsGenId(), created_at: new Date().toISOString() };
    items.push(newItem);
    lsSet(key, items);
    return [newItem];
  }

  async loadData(tableName, filters = {}) {
    const key = tableName === 'training_logs' ? 'muscle_logs' :
                tableName === 'progress_stats' ? 'muscle_progress' : tableName;
    let items = lsGet(key);
    Object.entries(filters).forEach(([k, v]) => {
      items = items.filter(item => item[k] === v);
    });
    return items;
  }

  subscribeToTable(_tableName, _callback) {
    console.warn('Real-time subscriptions not available (Supabase removed)');
    return null;
  }

  async checkConnection() { return false; }

  async processOfflineQueue() {
    const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
    if (offlineQueue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    for (const item of offlineQueue) {
      await this.saveWorkout(item.data);
      synced++;
    }
    localStorage.removeItem('offlineWorkoutQueue');
    return { synced, failed: 0 };
  }

  removeFromOfflineQueue(id) {
    const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
    const filteredQueue = offlineQueue.filter(item => item.id !== id);
    localStorage.setItem('offlineWorkoutQueue', JSON.stringify(filteredQueue));
  }

  addToOfflineQueue(data) {
    const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
    offlineQueue.push({
      id: data.id || `offline_${Date.now()}`,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });
    localStorage.setItem('offlineWorkoutQueue', JSON.stringify(offlineQueue));
  }

  onAuthStateChange(_callback) {
    console.warn('Auth state change not available (Supabase removed)');
    return null;
  }

  async getUserStats() {
    const workouts = lsGet('muscle_logs');
    const totalWorkouts = workouts.length;

    let currentStreak = 0;
    if (workouts.length > 0) {
      const today = new Date();
      const sorted = workouts.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      for (let i = 0; i < sorted.length; i++) {
        const d = new Date(sorted[i].created_at);
        const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
        if (i === 0 && diff <= 1) { currentStreak = 1; }
        else if (i > 0) {
          const prev = new Date(sorted[i - 1].created_at);
          const between = Math.floor((prev - d) / (1000 * 60 * 60 * 24));
          if (between <= 1) currentStreak++;
          else break;
        }
      }
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyProgress = workouts.filter(w => new Date(w.created_at) >= oneWeekAgo).length;
    const lastWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;

    return {
      totalWorkouts,
      currentStreak,
      weeklyProgress,
      lastWorkout: lastWorkout ? { date: lastWorkout.created_at, name: lastWorkout.session_name || 'ワークアウト' } : null,
    };
  }

  async saveUserProfile(profileData) {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    return true;
  }

  async getUserProfileData() {
    const data = localStorage.getItem('userProfile');
    return data ? JSON.parse(data) : {};
  }

  async uploadAvatar(_file) {
    throw new Error('Avatar upload not available (Supabase removed)');
  }
}

// シングルトンインスタンス
export const supabaseService = new SupabaseService();
