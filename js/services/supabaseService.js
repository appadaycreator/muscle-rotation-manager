// supabaseService.js - Supabase関連のサービス

import { SUPABASE_CONFIG } from '../utils/constants.js';
import { showNotification } from '../utils/helpers.js';

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
            console.error('Session check error:', error);
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
            throw new Error('Supabaseが設定されていません。設定を確認してください。');
        }

        console.log('Attempting login with email:', email);
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {throw error;}

        console.log('Login successful, user data:', data.user);
        this.currentUser = data.user;
        return data.user;
    }

    /**
     * 新規登録
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ユーザーデータ
     */
    async signUp(email, password) {
        if (!this.client) {
            throw new Error('Supabaseが設定されていません。設定を確認してください。');
        }

        const { data, error } = await this.client.auth.signUp({
            email,
            password
        });

        if (error) {throw error;}
        return data;
    }

    /**
     * ログアウト
     */
    async signOut() {
        if (!this.client) {
            throw new Error('Supabaseが設定されていません。');
        }

        const { error } = await this.client.auth.signOut();
        if (error) {throw error;}

        this.currentUser = null;
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
     * ワークアウト履歴を取得
     * @param {number} limit - 取得件数
     * @returns {Promise<Array>} ワークアウト配列
     */
    async getWorkouts(limit = 20) {
        if (!this.client || !this.currentUser) {
            return [];
        }

        try {
            const { data, error } = await this.client
                .from('workouts')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('date', { ascending: false })
                .limit(limit);

            if (error) {throw error;}
            return data || [];
        } catch (error) {
            console.error('Error fetching workouts:', error);
            showNotification('ワークアウト履歴の取得に失敗しました', 'error');
            return [];
        }
    }

    /**
     * ワークアウトを保存
     * @param {Object} workoutData - ワークアウトデータ
     * @returns {Promise<Object>} 保存されたデータ
     */
    async saveWorkout(workoutData) {
        if (!this.client || !this.currentUser) {
            throw new Error('認証情報がありません');
        }

        const { data, error } = await this.client
            .from('workouts')
            .insert([{
                ...workoutData,
                user_id: this.currentUser.id
            }]);

        if (error) {throw error;}
        return data;
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

        const fileExt = file.name.split('.').pop();
        const fileName = `${this.currentUser.id}_${Date.now()}.${fileExt}`;

        const { error } = await this.client.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (error) {throw error;}

        const { data: publicUrlData } = this.client.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
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
