// supabaseService.js - Supabase関連のサービス

import { SUPABASE_CONFIG } from '../utils/constants.js';
import { showNotification } from '../utils/helpers.js';
import { handleError, executeWithRetry } from '../utils/errorHandler.js';

class SupabaseService {
    constructor() {
        this.client = null;
        this.currentUser = null;
        this.isOnline = true;
        this.connectionMonitorInterval = null;
        this.offlineQueue = [];
        this.initialize();
        this.restoreOfflineQueue();
        this.startConnectionMonitoring();
    }

    /**
     * Supabaseクライアントを初期化
     */
    initialize() {
        if (typeof window !== 'undefined' && window.supabase) {
            this.client = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.key
            );
            console.log('✅ Supabase client initialized');
        } else {
            console.warn('⚠️ Supabase client not available');
        }
    }

    /**
     * 現在のセッションをチェック
     */
    async checkCurrentSession() {
        if (!this.client) {
            console.log('Supabase not configured, skipping session check');
            return null;
        }

        try {
            console.log('Checking current session...');
            const { data: { session }, error } = await this.client.auth.getSession();
            if (error) {throw error;}

            if (session) {
                console.log('Session found, user:', session.user);
                this.currentUser = session.user;
                showNotification('ログイン済みです', 'success');
                return session.user;
            } else {
                console.log('No active session found');
                this.currentUser = null;
                return null;
            }
        } catch (error) {
            handleError(error, {
                context: 'セッション確認',
                showNotification: false,
                logToConsole: true
            });
            this.currentUser = null;
            return null;
        }
    }

    /**
     * ログイン
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ユーザーデータ
     */
    async signIn(email, password) {
        if (!this.client) {
            const error = new Error('Supabaseが設定されていません。設定を確認してください。');
            throw handleError(error, {
                context: 'ログイン',
                showNotification: true
            }).originalError;
        }

        return executeWithRetry(async () => {
            console.log('Attempting login with email:', email);
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw handleError(error, {
                    context: 'ログイン',
                    showNotification: true
                }).originalError;
            }

            console.log('Login successful, user data:', data.user);
            this.currentUser = data.user;
            return data.user;
        }, {
            maxRetries: 2,
            context: 'ログイン'
        });
    }

    /**
     * 新規登録
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ユーザーデータ
     */
    async signUp(email, password) {
        if (!this.client) {
            const error = new Error('Supabaseが設定されていません。設定を確認してください。');
            throw handleError(error, {
                context: '新規登録',
                showNotification: true
            }).originalError;
        }

        return executeWithRetry(async () => {
            const { data, error } = await this.client.auth.signUp({
                email,
                password
            });

            if (error) {
                throw handleError(error, {
                    context: '新規登録',
                    showNotification: true
                }).originalError;
            }
            return data;
        }, {
            maxRetries: 2,
            context: '新規登録'
        });
    }

    /**
     * ログアウト
     */
    async signOut() {
        if (!this.client) {
            const error = new Error('Supabaseが設定されていません。');
            throw handleError(error, {
                context: 'ログアウト',
                showNotification: true
            }).originalError;
        }

        try {
            const { error } = await this.client.auth.signOut();
            if (error) {
                throw handleError(error, {
                    context: 'ログアウト',
                    showNotification: true
                }).originalError;
            }

            this.currentUser = null;
        } catch (error) {
            handleError(error, {
                context: 'ログアウト',
                showNotification: true
            });
            throw error;
        }
    }

    /**
     * 認証状態の変更を監視
     * @param {Function} callback - コールバック関数
     */
    onAuthStateChange(callback) {
        if (!this.client) {return;}

        return this.client.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
            }
            callback(event, session);
        });
    }

    /**
     * ワークアウトセッション履歴を取得（最適化版）
     * @param {Object} options - 取得オプション
     * @returns {Promise<Object>} ページネーション付きワークアウトセッション
     */
    async getWorkouts(options = {}) {
        if (!this.client || !this.currentUser) {
            return { data: [], pagination: null };
        }

        const {
            page = 1,
            limit = 20,
            sortBy = 'workout_date',
            sortOrder = 'desc',
            dateRange = null,
            muscleGroups = null
        } = options;

        try {
            const offset = (page - 1) * limit;
            let query = this.client
                .from('workout_sessions')
                .select(`
                    id,
                    session_name,
                    workout_date,
                    start_time,
                    end_time,
                    total_duration_minutes,
                    muscle_groups_trained,
                    is_completed,
                    training_logs (
                        id,
                        exercise_name,
                        sets,
                        reps,
                        weights,
                        muscle_group_id
                    )
                `, { count: 'exact' })
                .eq('user_id', this.currentUser.id);

            // 日付範囲フィルター
            if (dateRange) {
                if (dateRange.start) {
                    query = query.gte('workout_date', dateRange.start);
                }
                if (dateRange.end) {
                    query = query.lte('workout_date', dateRange.end);
                }
            }

            // 筋肉部位フィルター
            if (muscleGroups && muscleGroups.length > 0) {
                query = query.overlaps('muscle_groups_trained', muscleGroups);
            }

            // ソートと制限
            query = query
                .order(sortBy, { ascending: sortOrder === 'asc' })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                throw handleError(error, {
                    context: 'ワークアウト履歴取得',
                    showNotification: true
                }).originalError;
            }

            return {
                data: data || [],
                totalCount: count || 0,
                hasMore: (offset + limit) < (count || 0)
            };
        } catch (error) {
            handleError(error, {
                context: 'ワークアウト履歴取得',
                showNotification: true
            });
            return { data: [], totalCount: 0, hasMore: false };
        }
    }

    /**
     * ワークアウトセッションを保存
     * @param {Object} sessionData - ワークアウトセッションデータ
     * @returns {Promise<Object>} 保存されたデータ
     */
    async saveWorkout(sessionData) {
        if (!this.currentUser) {
            const error = new Error('認証情報がありません');
            throw handleError(error, {
                context: 'ワークアウト保存',
                showNotification: true
            }).originalError;
        }

        const dataWithUserId = {
            ...sessionData,
            user_id: this.currentUser.id
        };

        // オフライン時はキューに追加
        if (!this.isOnline || !this.client) {
            this.addToOfflineQueue('INSERT', 'workout_sessions', dataWithUserId);
            showNotification('オフラインモードでデータを保存しました。オンライン復帰時に同期されます。', 'info');
            return { id: `offline_${Date.now()}`, ...dataWithUserId };
        }

        try {
            return await this.retryWithExponentialBackoff(async () => {
                const { data, error } = await this.client
                    .from('workout_sessions')
                    .insert([dataWithUserId])
                    .select();

                if (error) {
                    throw handleError(error, {
                        context: 'ワークアウト保存',
                        showNotification: true
                    }).originalError;
                }
                return data;
            }, 3);
        } catch (error) {
            // オンライン保存に失敗した場合はオフラインキューに追加
            console.warn('⚠️ オンライン保存に失敗、オフラインキューに追加:', error);
            this.addToOfflineQueue('INSERT', 'workout_sessions', dataWithUserId);
            showNotification('データ保存に失敗しました。オフラインキューに保存しました。', 'warning');
            return { id: `offline_${Date.now()}`, ...dataWithUserId };
        }
    }

    /**
     * トレーニングログを保存
     * @param {Object} trainingLogData - トレーニングログデータ
     * @returns {Promise<Object>} 保存されたデータ
     */
    async saveTrainingLog(trainingLogData) {
        if (!this.currentUser) {
            const error = new Error('認証情報がありません');
            throw handleError(error, {
                context: 'トレーニングログ保存',
                showNotification: true
            }).originalError;
        }

        const dataWithUserId = {
            ...trainingLogData,
            user_id: this.currentUser.id
        };

        // オフライン時はキューに追加
        if (!this.isOnline || !this.client) {
            this.addToOfflineQueue('INSERT', 'training_logs', dataWithUserId);
            showNotification('オフラインモードでデータを保存しました。オンライン復帰時に同期されます。', 'info');
            return { id: `offline_${Date.now()}`, ...dataWithUserId };
        }

        try {
            return await this.retryWithExponentialBackoff(async () => {
                const { data, error } = await this.client
                    .from('training_logs')
                    .insert([dataWithUserId])
                    .select();

                if (error) {
                    throw handleError(error, {
                        context: 'トレーニングログ保存',
                        showNotification: true
                    }).originalError;
                }
                return data;
            }, 3);
        } catch (error) {
            // オンライン保存に失敗した場合はオフラインキューに追加
            console.warn('⚠️ オンライン保存に失敗、オフラインキューに追加:', error);
            this.addToOfflineQueue('INSERT', 'training_logs', dataWithUserId);
            showNotification('データ保存に失敗しました。オフラインキューに保存しました。', 'warning');
            return { id: `offline_${Date.now()}`, ...dataWithUserId };
        }
    }

    /**
     * 複数のトレーニングログを一括保存
     * @param {Array} trainingLogs - トレーニングログ配列
     * @returns {Promise<Array>} 保存されたデータ配列
     */
    async saveTrainingLogs(trainingLogs) {
        if (!this.client || !this.currentUser) {
            const error = new Error('認証情報がありません');
            throw handleError(error, {
                context: 'トレーニングログ一括保存',
                showNotification: true
            }).originalError;
        }

        return executeWithRetry(async () => {
            const logsWithUserId = trainingLogs.map(log => ({
                ...log,
                user_id: this.currentUser.id
            }));

            const { data, error } = await this.client
                .from('training_logs')
                .insert(logsWithUserId)
                .select();

            if (error) {
                throw handleError(error, {
                    context: 'トレーニングログ一括保存',
                    showNotification: true
                }).originalError;
            }
            return data;
        }, {
            maxRetries: 3,
            context: 'トレーニングログ一括保存'
        });
    }

    /**
     * トランザクション処理でワークアウトデータを保存
     * @param {Object} workoutData - ワークアウトデータ
     * @returns {Promise<Object>} 保存結果
     */
    async saveWorkoutWithTransaction(workoutData) {
        if (!this.client || !this.currentUser) {
            const error = new Error('認証情報がありません');
            throw handleError(error, {
                context: 'ワークアウトトランザクション保存',
                showNotification: true
            }).originalError;
        }

        return executeWithRetry(async () => {
            // PostgreSQLトランザクション開始（Supabaseクライアント側でのトランザクション管理）
            const sessionData = {
                session_name: `ワークアウト ${new Date(workoutData.startTime).toLocaleDateString()}`,
                workout_date: new Date(workoutData.startTime).toISOString().split('T')[0],
                start_time: new Date(workoutData.startTime).toISOString(),
                end_time: workoutData.endTime ? new Date(workoutData.endTime).toISOString() : null,
                total_duration_minutes: workoutData.duration || 0,
                muscle_groups_trained: workoutData.muscleGroups || [],
                session_type: 'strength',
                is_completed: !!workoutData.endTime,
                notes: `${workoutData.exercises?.length || 0}種目のワークアウト`,
                user_id: this.currentUser.id
            };

            // 重複チェック
            const duplicateCheck = await this.checkDuplicateWorkout(sessionData);
            if (duplicateCheck.isDuplicate) {
                throw new Error(`重複するワークアウトが検出されました: ${duplicateCheck.reason}`);
            }

            // セッション保存
            const { data: sessionResult, error: sessionError } = await this.client
                .from('workout_sessions')
                .insert([sessionData])
                .select();

            if (sessionError) {
                throw handleError(sessionError, {
                    context: 'ワークアウトセッション保存',
                    showNotification: true
                }).originalError;
            }

            const sessionId = sessionResult[0]?.id;
            if (!sessionId) {
                throw new Error('セッションIDの取得に失敗しました');
            }

            // トレーニングログ保存
            if (workoutData.exercises && workoutData.exercises.length > 0) {
                const trainingLogs = workoutData.exercises.map(exercise => ({
                    workout_session_id: sessionId,
                    muscle_group_id: this.getMuscleGroupId(workoutData.muscleGroups?.[0]),
                    exercise_name: exercise.name,
                    sets: exercise.sets,
                    reps: Array.isArray(exercise.reps) ? exercise.reps : [exercise.reps],
                    weights: Array.isArray(exercise.weight) ? exercise.weight : [exercise.weight],
                    workout_date: new Date(workoutData.startTime).toISOString().split('T')[0],
                    notes: exercise.notes || null,
                    user_id: this.currentUser.id
                }));

                const { error: logsError } = await this.client
                    .from('training_logs')
                    .insert(trainingLogs);

                if (logsError) {
                    // ログ保存失敗時はセッションも削除（手動ロールバック）
                    await this.client
                        .from('workout_sessions')
                        .delete()
                        .eq('id', sessionId);

                    throw handleError(logsError, {
                        context: 'トレーニングログ保存',
                        showNotification: true
                    }).originalError;
                }
            }

            // 統計情報更新
            try {
                await this.updateUserStatistics(workoutData, sessionId);
            } catch (statsError) {
                console.warn('統計情報更新に失敗しましたが、ワークアウト保存は完了しました:', statsError);
                // 統計更新失敗はワークアウト保存をロールバックしない
            }

            return {
                sessionId,
                sessionData: sessionResult[0],
                success: true,
                message: 'ワークアウトが正常に保存されました'
            };

        }, {
            maxRetries: 2,
            context: 'ワークアウトトランザクション保存'
        });
    }

    /**
     * 重複ワークアウトチェック
     * @param {Object} sessionData - セッションデータ
     * @returns {Promise<Object>} 重複チェック結果
     */
    async checkDuplicateWorkout(sessionData) {
        try {
            const { data, error } = await this.client
                .from('workout_sessions')
                .select('id, start_time, session_name')
                .eq('user_id', this.currentUser.id)
                .eq('workout_date', sessionData.workout_date)
                .gte('start_time', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5分以内
                .limit(5);

            if (error) {
                console.warn('重複チェックでエラーが発生しました:', error);
                return { isDuplicate: false };
            }

            if (data && data.length > 0) {
                // 同じ開始時間（1分以内）のセッションがあるかチェック
                const startTime = new Date(sessionData.start_time);
                const duplicates = data.filter(session => {
                    const sessionStartTime = new Date(session.start_time);
                    const timeDiff = Math.abs(startTime - sessionStartTime);
                    return timeDiff < 60000; // 1分以内
                });

                if (duplicates.length > 0) {
                    return {
                        isDuplicate: true,
                        reason: `同じ時間帯（1分以内）に既存のワークアウトがあります: ${duplicates[0].session_name}`,
                        existingSessions: duplicates
                    };
                }
            }

            return { isDuplicate: false };
        } catch (error) {
            console.warn('重複チェック中にエラーが発生しました:', error);
            return { isDuplicate: false };
        }
    }

    /**
     * ユーザー統計情報を更新
     * @param {Object} workoutData - ワークアウトデータ
     * @param {string} sessionId - セッションID
     * @returns {Promise<void>}
     */
    async updateUserStatistics(workoutData, sessionId) {
        try {
            const statsData = {
                user_id: this.currentUser.id,
                workout_session_id: sessionId,
                workout_date: new Date(workoutData.startTime).toISOString().split('T')[0],
                total_exercises: workoutData.exercises?.length || 0,
                total_sets: workoutData.exercises?.reduce((sum, ex) => sum + (ex.sets || 0), 0) || 0,
                total_duration_minutes: workoutData.duration || 0,
                muscle_groups_count: workoutData.muscleGroups?.length || 0,
                max_weight: Math.max(...(workoutData.exercises?.map(ex => ex.weight || 0) || [0])),
                created_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('workout_statistics')
                .upsert(statsData, {
                    onConflict: 'user_id,workout_date'
                });

            if (error) {
                throw error;
            }

            console.log('✅ ユーザー統計情報を更新しました');
        } catch (error) {
            console.error('統計情報更新エラー:', error);
            throw error;
        }
    }

    /**
     * 筋肉部位名からIDを取得
     * @param {string} muscleName - 筋肉部位名
     * @returns {string} 筋肉部位ID
     */
    getMuscleGroupId(muscleName) {
        const muscleMap = {
            chest: 'chest',
            back: 'back',
            shoulders: 'shoulders',
            arms: 'arms',
            legs: 'legs',
            abs: 'abs'
        };
        return muscleMap[muscleName] || muscleName;
    }

    /**
     * プロフィール情報を取得
     * @returns {Promise<Object|null>} プロフィールデータ
     */
    async getUserProfile() {
        if (!this.client || !this.currentUser) {
            console.warn('⚠️ SupabaseまたはcurrentUserが設定されていません');
            return null;
        }

        console.log('🔍 プロフィール情報取得開始:', this.currentUser.id);

        const { data, error } = await this.client
            .from('user_profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .maybeSingle();

        if (error) {
            console.error('❌ プロフィール取得エラー:', error);
            return null;
        }

        if (!data) {
            console.log('📝 プロフィールデータが存在しません（初回ユーザー）');
            return null;
        }

        console.log('✅ プロフィール情報取得成功:', data);
        return data;
    }

    /**
     * プロフィール情報を保存
     * @param {Object} profileData - プロフィールデータ
     * @returns {Promise<Object>} 保存されたデータ
     */
    async saveUserProfile(profileData) {
        if (!this.client || !this.currentUser) {
            throw new Error('認証情報がありません');
        }

        console.log('🔍 プロフィール保存開始:', {
            userId: this.currentUser.id,
            ...profileData
        });

        const { error } = await this.client
            .from('user_profiles')
            .upsert({
                id: this.currentUser.id,
                ...profileData,
                font_size: profileData.font_size || 'md'
            });

        if (error) {
            console.error('❌ プロフィール保存エラー:', error);
            throw new Error(`プロフィール保存に失敗しました: ${error.message}`);
        }

        console.log('✅ プロフィール保存成功');

        // メールアドレス変更がある場合はAuthにも反映
        if (profileData.email && profileData.email !== this.currentUser.email) {
            console.log('📧 メールアドレス更新中...', {
                currentEmail: this.currentUser.email,
                newEmail: profileData.email
            });

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(profileData.email)) {
                throw new Error(`無効なメールアドレス形式です: ${profileData.email}`);
            }

            const { error: authError } = await this.client.auth.updateUser({
                email: profileData.email
            });

            if (authError) {
                console.error('❌ Auth更新エラー:', authError);
                console.log('⚠️ メールアドレス更新は失敗しましたが、プロフィール保存は完了しました');
            } else {
                console.log('✅ メールアドレス更新成功');
            }
        }

        return true;
    }

    /**
     * アバター画像をアップロード
     * @param {File} file - 画像ファイル
     * @returns {Promise<string>} 公開URL
     */
    async uploadAvatar(file) {
        if (!this.client || !this.currentUser) {
            throw new Error('認証情報がありません');
        }

        // ファイル形式とサイズのバリデーション
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('サポートされていないファイル形式です。JPEG、PNG、WebPのみ対応しています。');
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB制限
            throw new Error('ファイルサイズは5MB以下にしてください');
        }

        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `${this.currentUser.id}_${Date.now()}.${fileExt}`;

        try {
            // 既存のアバターを削除（オプション）
            const existingAvatars = await this.client.storage
                .from('avatars')
                .list('', {
                    search: this.currentUser.id
                });

            if (existingAvatars.data && existingAvatars.data.length > 0) {
                const filesToDelete = existingAvatars.data.map(file => file.name);
                await this.client.storage
                    .from('avatars')
                    .remove(filesToDelete);
            }

            // 新しいアバターをアップロード
            const { error } = await this.client.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (error) {
                console.error('Avatar upload error:', error);
                throw new Error(`アップロードに失敗しました: ${error.message}`);
            }

            // 公開URLを取得
            const { data: publicUrlData } = this.client.storage
                .from('avatars')
                .getPublicUrl(fileName);

            if (!publicUrlData?.publicUrl) {
                throw new Error('公開URLの取得に失敗しました');
            }

            console.log('Avatar uploaded successfully:', publicUrlData.publicUrl);
            return publicUrlData.publicUrl;

        } catch (error) {
            console.error('Avatar upload failed:', error);
            throw error;
        }
    }

    /**
     * 現在のユーザーを取得
     * @returns {Object|null} ユーザーオブジェクト
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Supabaseクライアントが利用可能かチェック
     * @returns {boolean} 利用可能かどうか
     */
    isAvailable() {
        return !!this.client;
    }

    /**
     * データベース接続状態をチェック
     * @returns {Promise<boolean>} 接続状態
     */
    async checkConnection() {
        if (!this.client) {
            return false;
        }

        try {
            // 軽量なクエリで接続状態を確認
            const { error } = await this.client
                .from('muscle_groups')
                .select('id')
                .limit(1);

            return !error;
        } catch (error) {
            console.warn('⚠️ 接続チェックエラー:', error);
            return false;
        }
    }

    /**
     * 接続監視を開始
     * 30秒間隔で接続状態をチェック
     */
    startConnectionMonitoring() {
        if (this.connectionMonitorInterval) {
            clearInterval(this.connectionMonitorInterval);
        }

        this.connectionMonitorInterval = setInterval(async () => {
            const isConnected = await this.checkConnection();
            const wasOnline = this.isOnline;
            this.isOnline = isConnected;

            if (wasOnline && !isConnected) {
                // オンライン → オフライン
                console.warn('🔴 オフラインモードに切り替えました');
                showNotification('インターネット接続が不安定です。オフラインモードで動作します。', 'warning');
                this.enableOfflineMode();
            } else if (!wasOnline && isConnected) {
                // オフライン → オンライン
                console.log('🟢 オンラインモードに復帰しました');
                showNotification('インターネット接続が復旧しました。データを同期中...', 'success');
                await this.syncOfflineData();
            }
        }, 30000); // 30秒間隔
    }

    /**
     * 接続監視を停止
     */
    stopConnectionMonitoring() {
        if (this.connectionMonitorInterval) {
            clearInterval(this.connectionMonitorInterval);
            this.connectionMonitorInterval = null;
        }
    }

    /**
     * オフラインモードを有効化
     */
    enableOfflineMode() {
        this.isOnline = false;
        // オフラインモード用のUIフィードバック
        document.body.classList.add('offline-mode');

        // カスタムイベントを発火してUIに通知
        window.dispatchEvent(new CustomEvent('connectionStatusChanged', {
            detail: { isOnline: false }
        }));
    }

    /**
     * オフラインデータを同期
     * @returns {Promise<void>}
     */
    async syncOfflineData() {
        if (!this.isOnline || this.offlineQueue.length === 0) {
            return;
        }

        const syncResults = {
            success: 0,
            failed: 0,
            total: this.offlineQueue.length
        };

        console.log(`📤 ${syncResults.total}件のオフラインデータを同期開始`);

        // 同期処理を並列実行（最大3件まで）
        const syncPromises = this.offlineQueue.splice(0, 3).map(async (queueItem, index) => {
            try {
                await this.retryWithExponentialBackoff(async () => {
                    await this.executeSyncOperation(queueItem);
                }, 3);

                syncResults.success++;
                console.log(`✅ 同期成功 (${index + 1}/${syncResults.total}):`, queueItem.operation);
            } catch (error) {
                syncResults.failed++;
                console.error(`❌ 同期失敗 (${index + 1}/${syncResults.total}):`, error);

                // 失敗したアイテムをキューに戻す
                this.offlineQueue.push({
                    ...queueItem,
                    retryCount: (queueItem.retryCount || 0) + 1,
                    lastError: error.message
                });
            }
        });

        await Promise.allSettled(syncPromises);

        // 同期結果を通知
        if (syncResults.success > 0) {
            showNotification(`${syncResults.success}件のデータを同期しました`, 'success');
        }
        if (syncResults.failed > 0) {
            showNotification(`${syncResults.failed}件のデータ同期に失敗しました`, 'error');
        }

        // オフラインモードUIを解除
        document.body.classList.remove('offline-mode');

        // カスタムイベントを発火してUIに通知
        window.dispatchEvent(new CustomEvent('connectionStatusChanged', {
            detail: { isOnline: true }
        }));

        // 残りのデータがある場合は再帰的に同期
        if (this.offlineQueue.length > 0) {
            setTimeout(() => this.syncOfflineData(), 5000); // 5秒後に再試行
        }
    }

    /**
     * 指数バックオフによるリトライ処理
     * @param {Function} operation - 実行する操作
     * @param {number} maxRetries - 最大リトライ回数
     * @returns {Promise<any>}
     */
    async retryWithExponentialBackoff(operation, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    throw error;
                }

                // 指数バックオフ: 2^attempt * 1000ms (1秒, 2秒, 4秒...)
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`🔄 リトライ ${attempt + 1}/${maxRetries} (${delay}ms後)`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * 同期操作を実行
     * @param {Object} queueItem - キューアイテム
     * @returns {Promise<void>}
     */
    async executeSyncOperation(queueItem) {
        const { operation, table, data, id } = queueItem;

        switch (operation) {
            case 'INSERT':
                await this.client.from(table).insert(data);
                break;
            case 'UPDATE':
                await this.client.from(table).update(data).eq('id', id);
                break;
            case 'DELETE':
                await this.client.from(table).delete().eq('id', id);
                break;
            default:
                throw new Error(`未対応の操作: ${operation}`);
        }
    }

    /**
     * オフラインキューにデータを追加
     * @param {string} operation - 操作タイプ (INSERT, UPDATE, DELETE)
     * @param {string} table - テーブル名
     * @param {Object} data - データ
     * @param {string} id - レコードID (UPDATE, DELETE時)
     */
    addToOfflineQueue(operation, table, data, id = null) {
        const queueItem = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            operation,
            table,
            data,
            recordId: id,
            timestamp: new Date().toISOString(),
            retryCount: 0
        };

        this.offlineQueue.push(queueItem);

        // LocalStorageに永続化
        this.persistOfflineQueue();

        console.log(`📝 オフラインキューに追加: ${operation} ${table}`, queueItem);
    }

    /**
     * オフラインキューをLocalStorageに永続化
     */
    persistOfflineQueue() {
        try {
            localStorage.setItem('offlineWorkoutQueue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.error('❌ オフラインキューの永続化に失敗:', error);
        }
    }

    /**
     * LocalStorageからオフラインキューを復元
     */
    restoreOfflineQueue() {
        try {
            const stored = localStorage.getItem('offlineWorkoutQueue');
            if (stored) {
                this.offlineQueue = JSON.parse(stored);
                console.log(`📥 ${this.offlineQueue.length}件のオフラインデータを復元しました`);
            }
        } catch (error) {
            console.error('❌ オフラインキューの復元に失敗:', error);
            this.offlineQueue = [];
        }
    }

    /**
     * 接続状態を取得
     * @returns {boolean} オンライン状態
     */
    getConnectionStatus() {
        return this.isOnline;
    }
}

// シングルトンインスタンスをエクスポート
export const supabaseService = new SupabaseService();
