// supabaseService.js - Supabase関連のサービス

import { SUPABASE_CONFIG } from '../utils/constants.js';
import { showNotification } from '../utils/helpers.js';
import { handleError, executeWithRetry } from '../utils/errorHandler.js';

class SupabaseService {
    constructor() {
        this.client = null;
        this.currentUser = null;
        this.initialize();
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
     * ワークアウトセッション履歴を取得
     * @param {number} limit - 取得件数
     * @returns {Promise<Array>} ワークアウトセッション配列
     */
    async getWorkouts(limit = 20) {
        if (!this.client || !this.currentUser) {
            return [];
        }

        try {
            const { data, error } = await this.client
                .from('workout_sessions')
                .select(`
                    *,
                    training_logs (
                        id,
                        exercise_name,
                        sets,
                        reps,
                        weights,
                        muscle_group_id,
                        muscle_groups (
                            name,
                            name_ja,
                            color_code
                        )
                    )
                `)
                .eq('user_id', this.currentUser.id)
                .order('workout_date', { ascending: false })
                .limit(limit);

            if (error) {throw error;}
            return data || [];
        } catch (error) {
            handleError(error, {
                context: 'ワークアウト履歴取得',
                showNotification: true
            });
            return [];
        }
    }

    /**
     * ワークアウトセッションを保存
     * @param {Object} sessionData - ワークアウトセッションデータ
     * @returns {Promise<Object>} 保存されたデータ
     */
    async saveWorkout(sessionData) {
        if (!this.client || !this.currentUser) {
            const error = new Error('認証情報がありません');
            throw handleError(error, {
                context: 'ワークアウト保存',
                showNotification: true
            }).originalError;
        }

        return executeWithRetry(async () => {
            const { data, error } = await this.client
                .from('workout_sessions')
                .insert([{
                    ...sessionData,
                    user_id: this.currentUser.id
                }])
                .select();

            if (error) {
                throw handleError(error, {
                    context: 'ワークアウト保存',
                    showNotification: true
                }).originalError;
            }
            return data;
        }, {
            maxRetries: 3,
            context: 'ワークアウト保存'
        });
    }

    /**
     * トレーニングログを保存
     * @param {Object} trainingLogData - トレーニングログデータ
     * @returns {Promise<Object>} 保存されたデータ
     */
    async saveTrainingLog(trainingLogData) {
        if (!this.client || !this.currentUser) {
            const error = new Error('認証情報がありません');
            throw handleError(error, {
                context: 'トレーニングログ保存',
                showNotification: true
            }).originalError;
        }

        return executeWithRetry(async () => {
            const { data, error } = await this.client
                .from('training_logs')
                .insert([{
                    ...trainingLogData,
                    user_id: this.currentUser.id
                }])
                .select();

            if (error) {
                throw handleError(error, {
                    context: 'トレーニングログ保存',
                    showNotification: true
                }).originalError;
            }
            return data;
        }, {
            maxRetries: 3,
            context: 'トレーニングログ保存'
        });
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
}

// シングルトンインスタンスをエクスポート
export const supabaseService = new SupabaseService();
