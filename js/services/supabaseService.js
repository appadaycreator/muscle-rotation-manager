// js/services/SupabaseService.js - Supabase統合サービス

import { SUPABASE_CONFIG } from '../utils/constants.js';
import { handleError } from '../utils/errorHandler.js';

/**
 * Supabase統合サービス
 * データベース操作と認証を管理
 *
 * @class SupabaseService
 * @version 2.0.0
 * @since 1.0.0
 */
export class SupabaseService {
    /**
     * Supabaseサービスのコンストラクタ
     * @param {Object} options - 初期化オプション
     * @param {boolean} options.autoInitialize - 自動初期化（デフォルト: true）
     * @param {boolean} options.enableRetry - リトライ機能（デフォルト: true）
     * @param {number} options.maxRetries - 最大リトライ回数（デフォルト: 3）
     */
    constructor(options = {}) {
        this.client = null;
        this.isConnected = false;
        this.autoInitialize = options.autoInitialize !== false;
        this.enableRetry = options.enableRetry !== false;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = 1000; // 1秒
        this.connectionAttempts = 0;
        this.lastConnectionAttempt = null;
        this.healthCheckInterval = null;
        this.performanceMetrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0
        };

        if (this.autoInitialize) {
            this.initialize();
        }
    }

    /**
     * Supabaseクライアントを初期化
     * @param {Object} options - 初期化オプション
     * @param {boolean} options.force - 強制初期化（デフォルト: false）
     * @returns {Promise<boolean>} 初期化成功かどうか
     */
    async initialize(options = {}) {
        if (this.isConnected && !options.force) {
            console.log('⚠️ Supabase already initialized');
            return true;
        }

        this.connectionAttempts++;
        this.lastConnectionAttempt = new Date();

        try {
            console.log(`🔄 Initializing Supabase client (attempt ${this.connectionAttempts})...`);

            if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
                throw new Error('Supabase configuration not found');
            }

            // CDNから読み込まれたSupabaseライブラリを使用
            if (!window.supabase || !window.supabase.createClient) {
                throw new Error('Supabase library not loaded from CDN');
            }

            const { createClient } = window.supabase;
            this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

            // 接続テスト
            await this.testConnection();

            this.isConnected = true;
            console.log('✅ Supabase client initialized successfully');

            // ヘルスチェックの開始
            this.startHealthCheck();

            return true;

        } catch (error) {
            console.error(`❌ Failed to initialize Supabase client (attempt ${this.connectionAttempts}):`, error);
            this.isConnected = false;

            // リトライロジック
            if (this.enableRetry && this.connectionAttempts < this.maxRetries) {
                console.log(`🔄 Retrying Supabase initialization in ${this.retryDelay}ms...`);
                await this.delay(this.retryDelay);
                return await this.initialize({ ...options, force: true });
            }

            handleError(error, {
                context: 'SupabaseService.initialize',
                showNotification: true,
                severity: 'error'
            });

            return false;
        }
    }

    /**
     * Supabaseが利用可能かチェック
     * @returns {boolean} 利用可能かどうか
     */
    isAvailable() {
        return this.isConnected && this.client !== null;
    }

    /**
     * 接続テストを実行
     * @returns {Promise<boolean>} 接続成功かどうか
     */
    async testConnection() {
        try {
            // 実際に存在するテーブルを使用して接続テスト
            const { error } = await this.client
                .from('exercises')
                .select('count')
                .limit(1);

            if (error) {
                throw new Error(`Connection test failed: ${error.message}`);
            }

            console.log('✅ Supabase connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Supabase connection test failed:', error);
            throw error;
        }
    }

    /**
     * ヘルスチェックを開始
     */
    startHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.testConnection();
            } catch (error) {
                console.warn('⚠️ Supabase health check failed:', error);
                this.isConnected = false;
            }
        }, 60000); // 1分ごと
    }

    /**
     * ヘルスチェックを停止
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * 遅延実行
     * @param {number} ms - 遅延時間（ミリ秒）
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * パフォーマンスメトリクスを更新
     * @param {number} responseTime - レスポンス時間
     * @param {boolean} success - 成功かどうか
     */
    updatePerformanceMetrics(responseTime, success) {
        this.performanceMetrics.totalRequests++;

        if (success) {
            this.performanceMetrics.successfulRequests++;
        } else {
            this.performanceMetrics.failedRequests++;
        }

        // 平均レスポンス時間を更新
        const total = this.performanceMetrics.totalRequests;
        const current = this.performanceMetrics.averageResponseTime;
        this.performanceMetrics.averageResponseTime =
            (current * (total - 1) + responseTime) / total;
    }

    /**
     * パフォーマンスメトリクスを取得
     * @returns {Object} パフォーマンスメトリクス
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            successRate: this.performanceMetrics.totalRequests > 0
                ? (this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests) * 100
                : 0
        };
    }

    /**
     * サービスの健全性チェック
     * @returns {Object} 健全性チェック結果
     */
    healthCheck() {
        const issues = [];

        if (!this.isConnected) {
            issues.push('Not connected');
        }

        if (this.connectionAttempts > this.maxRetries) {
            issues.push('Too many connection attempts');
        }

        if (this.performanceMetrics.failedRequests > this.performanceMetrics.successfulRequests) {
            issues.push('High failure rate');
        }

        return {
            isHealthy: issues.length === 0,
            issues,
            score: Math.max(0, 100 - (issues.length * 25)),
            metrics: {
                isConnected: this.isConnected,
                connectionAttempts: this.connectionAttempts,
                performance: this.getPerformanceMetrics()
            }
        };
    }

    /**
   * 認証状態を取得
   */
    async getAuthState() {
        if (!this.isAvailable()) {
            console.log('Supabase not available for auth state check');
            return { user: null, session: null };
        }

        try {
            const { data: { session }, error } = await this.client.auth.getSession();
            if (error) {
                console.error('Auth state error:', error);
                return { user: null, session: null };
            }

            const user = session?.user || null;
            console.log('Auth state retrieved:', {
                hasSession: !!session,
                hasUser: !!user,
                userId: user?.id,
                userEmail: user?.email
            });

            return { user, session };
        } catch (error) {
            console.error('Failed to get auth state:', error);
            return { user: null, session: null };
        }
    }

    /**
   * 現在のユーザーを取得（同期版）
   */
    getCurrentUser() {
        if (!this.isAvailable()) {
            return null;
        }

        try {
            // Supabaseのセッション情報をローカルストレージから取得
            const sessionData = localStorage.getItem('sb-mwwlqpokfgduxyjbqoff-auth-token');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                return session?.user || null;
            }

            // 別のキーでも試行
            const altSessionData = localStorage.getItem('supabase.auth.token');
            if (altSessionData) {
                const session = JSON.parse(altSessionData);
                return session?.user || null;
            }

            return null;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }

    /**
   * ユーザー登録
   */
    async signUp(email, password, userData = {}) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    /**
   * ユーザーログイン
   */
    async signIn(email, password) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    /**
   * ユーザーログアウト
   */
    async signOut() {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { error } = await this.client.auth.signOut();
            if (error) {
                throw new Error(error.message);
            }
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * ワークアウト履歴を取得
     */
    async getWorkoutHistory(limit = 50) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('workout_sessions')
                .select('*')
                .order('workout_date', { ascending: false })
                .limit(limit);

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        } catch (error) {
            console.error('Failed to get workout history:', error);
            throw error;
        }
    }

    /**
     * ワークアウトを取得（getWorkoutHistoryのエイリアス）
     */
    async getWorkouts(limit = 50) {
        return this.getWorkoutHistory(limit);
    }

    /**
   * ワークアウトを保存
   */
    async saveWorkout(workoutData) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('workout_sessions')
                .insert([workoutData])
                .select();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Failed to save workout:', error);
            throw error;
        }
    }

    /**
   * トレーニングログを保存
   */
    async saveTrainingLogs(trainingLogs) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('training_logs')
                .insert(trainingLogs)
                .select();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Failed to save training logs:', error);
            throw error;
        }
    }

    /**
   * エクササイズ一覧を取得
   */
    async getExercises() {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('exercises')
                .select('*')
                .order('name');

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        } catch (error) {
            console.error('Failed to get exercises:', error);
            throw error;
        }
    }

    /**
   * 筋肉部位一覧を取得
   */
    async getMuscleGroups() {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('muscle_groups')
                .select('*')
                .order('name');

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        } catch (error) {
            console.error('Failed to get muscle groups:', error);
            throw error;
        }
    }

    /**
   * 筋肉回復データを取得
   */
    async getMuscleRecoveryData() {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('muscle_recovery')
                .select('*')
                .order('last_trained', { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        } catch (error) {
            console.error('Failed to get muscle recovery data:', error);
            throw error;
        }
    }

    /**
   * 推奨事項を取得
   */
    async getRecommendations() {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('recommendations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            throw error;
        }
    }

    /**
   * ユーザープロフィールを取得
   */
    async getUserProfile() {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .select('*')
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Failed to get user profile:', error);
            throw error;
        }
    }

    /**
   * ユーザープロフィールを更新
   */
    async updateUserProfile(profileData) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .upsert([profileData])
                .select();

            if (error) {
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Failed to update user profile:', error);
            throw error;
        }
    }

    /**
   * データを保存（汎用）
   */
    async saveData(tableName, data) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data: result, error } = await this.client
                .from(tableName)
                .insert([data])
                .select();

            if (error) {
                throw new Error(error.message);
            }

            return result;
        } catch (error) {
            console.error(`Failed to save data to ${tableName}:`, error);
            throw error;
        }
    }

    /**
   * データを読み込み（汎用）
   */
    async loadData(tableName, filters = {}) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            let query = this.client.from(tableName).select('*');

            // フィルターを適用
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const { data, error } = await query;

            if (error) {
                throw new Error(error.message);
            }

            return data || [];
        } catch (error) {
            console.error(`Failed to load data from ${tableName}:`, error);
            throw error;
        }
    }

    /**
   * リアルタイム購読を設定
   */
    subscribeToTable(tableName, callback) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            return this.client
                .channel(`${tableName}_changes`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: tableName
                }, callback)
                .subscribe();
        } catch (error) {
            console.error(`Failed to subscribe to ${tableName}:`, error);
            throw error;
        }
    }

    /**
   * 接続状態をチェック
   */
    async checkConnection() {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const { error } = await this.client
                .from('workout_sessions')
                .select('count')
                .limit(1);

            return !error;
        } catch (error) {
            console.error('Connection check failed:', error);
            return false;
        }
    }

    /**
   * オフライン同期キューを処理
   */
    async processOfflineQueue() {
        try {
            const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');

            if (offlineQueue.length === 0) {
                return { synced: 0, failed: 0 };
            }

            let synced = 0;
            let failed = 0;

            for (const item of offlineQueue) {
                try {
                    await this.saveWorkout(item.data);
                    this.removeFromOfflineQueue(item.id);
                    synced++;
                } catch (error) {
                    console.error(`Failed to sync ${item.id}:`, error);
                    failed++;
                }
            }

            return { synced, failed };
        } catch (error) {
            console.error('Failed to process offline queue:', error);
            throw error;
        }
    }

    /**
   * オフラインキューからアイテムを削除
   */
    removeFromOfflineQueue(id) {
        try {
            const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
            const filteredQueue = offlineQueue.filter(item => item.id !== id);
            localStorage.setItem('offlineWorkoutQueue', JSON.stringify(filteredQueue));
        } catch (error) {
            console.error('Failed to remove from offline queue:', error);
        }
    }

    /**
   * オフラインキューにアイテムを追加
   */
    addToOfflineQueue(data) {
        try {
            const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
            const item = {
                id: data.id || `offline_${Date.now()}`,
                data,
                timestamp: new Date().toISOString(),
                retryCount: 0
            };

            offlineQueue.push(item);
            localStorage.setItem('offlineWorkoutQueue', JSON.stringify(offlineQueue));
        } catch (error) {
            console.error('Failed to add to offline queue:', error);
        }
    }

    /**
   * 認証状態の変更を監視
   */
    onAuthStateChange(callback) {
        if (!this.isAvailable()) {
            console.warn('Supabase is not available, cannot set up auth state listener');
            return;
        }

        try {
            return this.client.auth.onAuthStateChange(callback);
        } catch (error) {
            console.error('Failed to set up auth state listener:', error);
        }
    }

    /**
     * ユーザーの統計情報を取得
     */
    async getUserStats() {
        if (!this.isAvailable()) {
            console.warn('Supabase is not available, cannot get user stats');
            return {
                totalWorkouts: 0,
                currentStreak: 0,
                weeklyProgress: 0,
                lastWorkout: null
            };
        }

        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) {
                console.warn('No authenticated user found');
                return {
                    totalWorkouts: 0,
                    currentStreak: 0,
                    weeklyProgress: 0,
                    lastWorkout: null
                };
            }

            // ワークアウト履歴を取得して統計を計算
            const { data: workouts, error: workoutsError } = await this.client
                .from('workout_sessions')
                .select('*')
                .order('workout_date', { ascending: false });

            if (workoutsError) {
                console.error('Error fetching workouts for stats:', workoutsError);
                return {
                    totalWorkouts: 0,
                    currentStreak: 0,
                    weeklyProgress: 0,
                    lastWorkout: null
                };
            }

            const totalWorkouts = workouts ? workouts.length : 0;

            // ストリーク計算
            let currentStreak = 0;
            if (workouts && workouts.length > 0) {
                const today = new Date();
                const sortedWorkouts = workouts.sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date));

                for (let i = 0; i < sortedWorkouts.length; i++) {
                    const workoutDate = new Date(sortedWorkouts[i].workout_date);
                    const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));

                    if (i === 0 && daysDiff <= 1) {
                        currentStreak = 1;
                    } else if (i > 0) {
                        const prevWorkoutDate = new Date(sortedWorkouts[i-1].workout_date);
                        const daysBetween = Math.floor((prevWorkoutDate - workoutDate) / (1000 * 60 * 60 * 24));
                        if (daysBetween <= 1) {
                            currentStreak++;
                        } else {
                            break;
                        }
                    }
                }
            }

            // 週間進捗計算
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weeklyWorkouts = workouts ? workouts.filter(w =>
                new Date(w.workout_date) >= oneWeekAgo
            ).length : 0;

            const lastWorkout = workouts && workouts.length > 0 ? workouts[0] : null;

            return {
                totalWorkouts,
                currentStreak,
                weeklyProgress: weeklyWorkouts,
                lastWorkout: lastWorkout ? {
                    date: lastWorkout.workout_date,
                    name: lastWorkout.session_name || 'ワークアウト'
                } : null
            };
        } catch (error) {
            console.error('Failed to get user stats:', error);
            return {
                totalWorkouts: 0,
                currentStreak: 0,
                weeklyProgress: 0,
                lastWorkout: null
            };
        }
    }

    /**
   * ユーザープロフィールを保存
   */
    async saveUserProfile(profileData) {
        if (!this.isAvailable()) {
            console.warn('Supabase is not available, cannot save user profile');
            return false;
        }

        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) {
                console.warn('No authenticated user found');
                return false;
            }

            // user_profilesテーブルに存在するカラムのみをフィルタリング
            const allowedColumns = [
                'display_name', 'email', 'avatar_url', 'bio', 'fitness_level',
                'primary_goals', 'preferred_language', 'timezone', 'weight', 'height',
                'age', 'gender', 'activity_level', 'workout_frequency',
                'preferred_workout_duration', 'notifications_enabled',
                'email_notifications', 'push_notifications', 'theme_preference',
                'font_size'
            ];

            const filteredProfileData = {};
            Object.keys(profileData).forEach(key => {
                if (allowedColumns.includes(key)) {
                    filteredProfileData[key] = profileData[key];
                }
            });

            // プロフィールデータにユーザーIDを追加
            const profileWithUserId = {
                ...filteredProfileData,
                id: user.id,  // user_profilesテーブルのidフィールドはauth.users.idと一致
                updated_at: new Date().toISOString()
            };

            // 制約に合致するデフォルト値を設定
            const defaults = {
                font_size: 'md',
                fitness_level: 'beginner',
                activity_level: 'moderate',
                theme_preference: 'auto',
                preferred_language: 'ja',
                workout_frequency: 3
            };

            // 各フィールドにデフォルト値を設定
            Object.keys(defaults).forEach(key => {
                if (!profileWithUserId[key]) {
                    profileWithUserId[key] = defaults[key];
                }
            });

            // Supabaseデータベースに保存
            const { data, error } = await this.client
                .from('user_profiles')
                .upsert([profileWithUserId])
                .select();

            if (error) {
                console.error('Database save error:', error);
                throw new Error(error.message);
            }

            console.log('User profile saved to Supabase:', data);

            // ローカルストレージにもバックアップ保存
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            console.log('User profile also saved to localStorage as backup');

            return true;
        } catch (error) {
            console.error('Failed to save user profile:', error);
            // エラーが発生した場合はローカルストレージに保存
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            console.log('Fallback: User profile saved to localStorage only');
            return false;
        }
    }

    /**
     * ユーザープロフィールを取得（重複メソッド名を修正）
     */
    async getUserProfileData() {
        if (!this.isAvailable()) {
            console.warn('Supabase is not available, cannot get user profile');
            return null;
        }

        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) {
                console.warn('No authenticated user found');
                return null;
            }

            // Supabaseデータベースからプロフィールを取得
            const { data, error } = await this.client
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.warn('Failed to get profile from database:', error);
                // データベースから取得できない場合はローカルストレージから取得
                const profileData = localStorage.getItem('userProfile');
                return profileData ? JSON.parse(profileData) : {};
            }

            console.log('User profile loaded from Supabase:', data);
            return data || {};
        } catch (error) {
            console.error('Failed to get user profile:', error);
            // エラーが発生した場合はローカルストレージから取得
            const profileData = localStorage.getItem('userProfile');
            return profileData ? JSON.parse(profileData) : {};
        }
    }

    /**
     * アバター画像をアップロード
     * @param {File} file - アップロードするファイル
     * @returns {Promise<string>} アップロードされた画像のURL
     */
    async uploadAvatar(file) {
        if (!this.isAvailable()) {
            throw new Error('Supabase is not available');
        }

        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }

            // ファイル名を生成（ユーザーIDをフォルダ名として使用）
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

            // アバター用のバケットにアップロード
            const { error } = await this.client.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (error) {
                console.error('Avatar upload error:', error);
                throw new Error(`アバター画像のアップロードに失敗しました: ${error.message}`);
            }

            // 公開URLを取得
            const { data: publicUrlData } = this.client.storage
                .from('avatars')
                .getPublicUrl(fileName);

            if (!publicUrlData?.publicUrl) {
                throw new Error('アバター画像のURL取得に失敗しました');
            }

            console.log('Avatar uploaded successfully:', publicUrlData.publicUrl);
            return publicUrlData.publicUrl;

        } catch (error) {
            console.error('Avatar upload failed:', error);
            throw error;
        }
    }
}

// シングルトンインスタンスをエクスポート
export const supabaseService = new SupabaseService();