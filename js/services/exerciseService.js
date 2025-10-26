// exerciseService.js - エクササイズ管理サービス

import { supabaseService } from './supabaseService.js';
import { handleError, executeWithRetry } from '../utils/errorHandler.js';
import { showNotification } from '../utils/helpers.js';

/**
 * エクササイズ管理サービスクラス
 * エクササイズの取得、検索、フィルタリング、カスタムエクササイズの管理を行う
 */
class ExerciseService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5分間キャッシュ
        this.searchCache = new Map();
    }

    /**
   * 全エクササイズを取得
   * @param {Object} options - オプション
   * @param {boolean} options.includeCustom - カスタムエクササイズを含むか
   * @param {boolean} options.useCache - キャッシュを使用するか
   * @returns {Promise<Array>} エクササイズ配列
   */
    async getAllExercises(options = {}) {
        const { includeCustom = true, useCache = true } = options;
        const cacheKey = `all_exercises_${includeCustom}`;

        // キャッシュチェック
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        if (!supabaseService.isAvailable()) {
            console.warn('Supabase not available, returning empty array');
            return [];
        }

        try {
            let query = supabaseService.client
                .from('exercises')
                .select(
                    `
                    *,
                    muscle_groups (
                        id,
                        name,
                        name_ja,
                        color_code
                    )
                `
                )
                .order('name_ja', { ascending: true });

            // カスタムエクササイズの取得条件
            try {
                if (includeCustom && supabaseService.getCurrentUser()) {
                    // 公開エクササイズ + 自分のカスタムエクササイズ
                    query = query.or(
                        `is_custom.eq.false,and(is_custom.eq.true,created_by_user_id.eq.${supabaseService.getCurrentUser().id})`
                    );
                } else {
                    // 公開エクササイズのみ
                    query = query.eq('is_custom', false);
                }
            } catch (columnError) {
                // is_customカラムが存在しない場合は全てのエクササイズを取得
                console.warn(
                    'is_custom column not found, fetching all exercises:',
                    columnError
                );
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // キャッシュに保存
            this.cache.set(cacheKey, {
                data: data || [],
                timestamp: Date.now()
            });

            return data || [];
        } catch (error) {
            handleError(error, {
                context: 'エクササイズ取得',
                showNotification: true
            });
            return [];
        }
    }

    /**
   * 部位別エクササイズを取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @param {Object} options - オプション
   * @returns {Promise<Array>} エクササイズ配列
   */
    async getExercisesByMuscleGroup(muscleGroupId, options = {}) {
        if (!muscleGroupId) {
            return [];
        }

        const cacheKey = `muscle_group_${muscleGroupId}`;

        // キャッシュチェック
        if (options.useCache !== false && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        if (!supabaseService.isAvailable()) {
            console.warn('Supabase not available, returning empty array');
            return [];
        }

        try {
            let query = supabaseService.client
                .from('exercises')
                .select('*')
                .eq('muscle_group_id', muscleGroupId)
                .order('difficulty_level', { ascending: true })
                .order('name_ja', { ascending: true });

            // カスタムエクササイズの取得条件
            try {
                if (supabaseService.getCurrentUser()) {
                    query = query.or(
                        `is_custom.eq.false,and(is_custom.eq.true,created_by_user_id.eq.${supabaseService.getCurrentUser().id})`
                    );
                } else {
                    query = query.eq('is_custom', false);
                }
            } catch (columnError) {
                // is_customカラムが存在しない場合は全てのエクササイズを取得
                console.warn(
                    'is_custom column not found, fetching all exercises:',
                    columnError
                );
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            let result = data || [];

            // 筋肉部位の情報を取得して結合
            if (result.length > 0) {
                try {
                    const { data: muscleGroupData, error: muscleGroupError } =
            await supabaseService.client
                .from('muscle_groups')
                .select('id, name, name_ja, color_code')
                .eq('id', muscleGroupId)
                .single();

                    if (!muscleGroupError && muscleGroupData) {
                        result = result.map((exercise) => ({
                            ...exercise,
                            muscle_groups: muscleGroupData
                        }));
                    }
                } catch (muscleGroupError) {
                    console.warn('Failed to load muscle group:', muscleGroupError);
                }
            }

            // キャッシュに保存
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            handleError(error, {
                context: '部位別エクササイズ取得',
                showNotification: true
            });
            return [];
        }
    }

    /**
   * エクササイズを検索
   * @param {string} searchTerm - 検索語
   * @param {Object} filters - フィルター条件
   * @returns {Promise<Array>} 検索結果
   */
    async searchExercises(searchTerm, filters = {}) {
        const cacheKey = `search_${searchTerm}_${JSON.stringify(filters)}`;

        // 検索キャッシュチェック
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        if (!supabaseService.isAvailable()) {
            console.warn('Supabase not available, returning empty array');
            return [];
        }

        try {
            // 筋肉部位名でのフィルタリングの場合はJOINを使用
            let query;
            if (filters.muscleGroupName) {
                query = supabaseService.client
                    .from('exercises')
                    .select(
                        `
                        *,
                        muscle_groups!inner(name_ja, name_en)
                    `
                    )
                    .eq('muscle_groups.name_ja', filters.muscleGroupName);
            } else {
                query = supabaseService.client.from('exercises').select(`
                        *,
                        muscle_groups (
                            id,
                            name,
                            name_ja,
                            color_code
                        )
                    `);
            }

            // テキスト検索
            if (searchTerm && searchTerm.trim()) {
                const term = searchTerm.trim();
                query = query.or(
                    `name_ja.ilike.%${term}%,name_en.ilike.%${term}%,search_keywords.ilike.%${term}%,description.ilike.%${term}%`
                );
            }

            // フィルター適用
            if (filters.muscleGroupId) {
                query = query.eq('muscle_group_id', filters.muscleGroupId);
            }

            if (filters.difficulty) {
                query = query.eq('difficulty_level', filters.difficulty);
            }

            if (filters.equipment) {
                query = query.eq('equipment', filters.equipment);
            }

            if (filters.exerciseType) {
                query = query.eq('exercise_type', filters.exerciseType);
            }

            if (filters.isBodyweight !== undefined) {
                query = query.eq('is_bodyweight', filters.isBodyweight);
            }

            if (filters.isCompound !== undefined) {
                query = query.eq('is_compound', filters.isCompound);
            }

            if (filters.isBeginnerFriendly !== undefined) {
                query = query.eq('is_beginner_friendly', filters.isBeginnerFriendly);
            }

            // カスタムエクササイズの取得条件
            try {
                if (supabaseService.getCurrentUser()) {
                    query = query.or(
                        `is_custom.eq.false,and(is_custom.eq.true,created_by_user_id.eq.${supabaseService.getCurrentUser().id})`
                    );
                } else {
                    query = query.eq('is_custom', false);
                }
            } catch (columnError) {
                // is_customカラムが存在しない場合は全てのエクササイズを取得
                console.warn(
                    'is_custom column not found, fetching all exercises:',
                    columnError
                );
            }

            // ソート
            if (filters.sortBy === 'rating') {
                query = query.order('average_rating', { ascending: false });
            } else if (filters.sortBy === 'usage') {
                query = query.order('usage_count', { ascending: false });
            } else if (filters.sortBy === 'difficulty') {
                query = query.order('difficulty_level', { ascending: true });
            } else {
                query = query.order('name_ja', { ascending: true });
            }

            // 制限
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            const result = data || [];

            // 検索キャッシュに保存
            this.searchCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Exercise search error:', error);
            handleError(error, {
                context: 'エクササイズ検索',
                showNotification: true
            });
            return [];
        }
    }

    /**
   * エクササイズの詳細を取得
   * @param {string} exerciseId - エクササイズID
   * @returns {Promise<Object|null>} エクササイズ詳細
   */
    async getExerciseDetails(exerciseId) {
        if (!exerciseId || !supabaseService.isAvailable()) {
            return null;
        }

        try {
            const { data, error } = await supabaseService.client
                .from('exercises')
                .select(
                    `
                    *,
                    muscle_groups (
                        id,
                        name,
                        name_ja,
                        color_code,
                        recovery_hours
                    )
                `
                )
                .eq('id', exerciseId)
                .single();

            if (error) {
                throw error;
            }

            // 使用回数を増加
            if (data && !data.is_custom) {
                this.incrementUsageCount(exerciseId);
            }

            return data;
        } catch (error) {
            handleError(error, {
                context: 'エクササイズ詳細取得',
                showNotification: false
            });
            return null;
        }
    }

    /**
   * カスタムエクササイズを作成
   * @param {Object} exerciseData - エクササイズデータ
   * @returns {Promise<Object|null>} 作成されたエクササイズ
   */
    async createCustomExercise(exerciseData) {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            throw new Error('認証が必要です');
        }

        return executeWithRetry(
            async () => {
                const { data, error } = await supabaseService.client
                    .from('exercises')
                    .insert([
                        {
                            ...exerciseData,
                            is_custom: true,
                            created_by_user_id: supabaseService.getCurrentUser().id,
                            is_public: exerciseData.is_public || false
                        }
                    ])
                    .select(
                        `
                    *,
                    muscle_groups (
                        id,
                        name,
                        name_ja,
                        color_code
                    )
                `
                    )
                    .single();

                if (error) {
                    throw error;
                }

                // キャッシュをクリア
                this.clearCache();

                showNotification('カスタムエクササイズを作成しました', 'success');
                return data;
            },
            {
                maxRetries: 2,
                context: 'カスタムエクササイズ作成'
            }
        );
    }

    /**
   * カスタムエクササイズを更新
   * @param {string} exerciseId - エクササイズID
   * @param {Object} updateData - 更新データ
   * @returns {Promise<Object|null>} 更新されたエクササイズ
   */
    async updateCustomExercise(exerciseId, updateData) {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            throw new Error('認証が必要です');
        }

        return executeWithRetry(
            async () => {
                const { data, error } = await supabaseService.client
                    .from('exercises')
                    .update(updateData)
                    .eq('id', exerciseId)
                    .eq('created_by_user_id', supabaseService.getCurrentUser().id)
                    .select(
                        `
                    *,
                    muscle_groups (
                        id,
                        name,
                        name_ja,
                        color_code
                    )
                `
                    )
                    .single();

                if (error) {
                    throw error;
                }

                // キャッシュをクリア
                this.clearCache();

                showNotification('エクササイズを更新しました', 'success');
                return data;
            },
            {
                maxRetries: 2,
                context: 'カスタムエクササイズ更新'
            }
        );
    }

    /**
   * カスタムエクササイズを削除
   * @param {string} exerciseId - エクササイズID
   * @returns {Promise<boolean>} 削除成功かどうか
   */
    async deleteCustomExercise(exerciseId) {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            throw new Error('認証が必要です');
        }

        return executeWithRetry(
            async () => {
                const { error } = await supabaseService.client
                    .from('exercises')
                    .delete()
                    .eq('id', exerciseId)
                    .eq('created_by_user_id', supabaseService.getCurrentUser().id);

                if (error) {
                    throw error;
                }

                // キャッシュをクリア
                this.clearCache();

                showNotification('エクササイズを削除しました', 'success');
                return true;
            },
            {
                maxRetries: 2,
                context: 'カスタムエクササイズ削除'
            }
        );
    }

    /**
   * ユーザーのカスタムエクササイズを取得
   * @returns {Promise<Array>} カスタムエクササイズ配列
   */
    async getUserCustomExercises() {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            return [];
        }

        try {
            const { data, error } = await supabaseService.client
                .from('exercises')
                .select(
                    `
                    *,
                    muscle_groups (
                        id,
                        name,
                        name_ja,
                        color_code
                    )
                `
                )
                .eq('is_custom', true)
                .eq('created_by_user_id', supabaseService.getCurrentUser().id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            handleError(error, {
                context: 'カスタムエクササイズ取得',
                showNotification: true
            });
            return [];
        }
    }

    /**
   * エクササイズの使用回数を増加
   * @param {string} exerciseId - エクササイズID
   */
    async incrementUsageCount(exerciseId) {
        if (!supabaseService.isAvailable() || !exerciseId) {
            return;
        }

        try {
            // バックグラウンドで実行（エラーが発生しても無視）
            await supabaseService.client.rpc('increment_exercise_usage', {
                exercise_id: exerciseId
            });
        } catch (error) {
            // 使用回数の更新エラーは無視
            console.warn('Usage count increment failed:', error);
        }
    }

    /**
   * エクササイズを評価
   * @param {string} exerciseId - エクササイズID
   * @param {number} rating - 評価（1-5）
   * @returns {Promise<boolean>} 評価成功かどうか
   */
    async rateExercise(exerciseId, rating) {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            throw new Error('認証が必要です');
        }

        if (rating < 1 || rating > 5) {
            throw new Error('評価は1-5の範囲で入力してください');
        }

        try {
            // ユーザーの評価を保存/更新
            const { error } = await supabaseService.client
                .from('exercise_ratings')
                .upsert({
                    exercise_id: exerciseId,
                    user_id: supabaseService.getCurrentUser().id,
                    rating
                });

            if (error) {
                throw error;
            }

            showNotification('評価を保存しました', 'success');
            return true;
        } catch (error) {
            handleError(error, {
                context: 'エクササイズ評価',
                showNotification: true
            });
            return false;
        }
    }

    /**
   * 人気のエクササイズを取得
   * @param {number} limit - 取得件数
   * @returns {Promise<Array>} 人気エクササイズ配列
   */
    async getPopularExercises(limit = 10) {
        return this.searchExercises('', {
            sortBy: 'usage',
            limit
        });
    }

    /**
   * 高評価のエクササイズを取得
   * @param {number} limit - 取得件数
   * @returns {Promise<Array>} 高評価エクササイズ配列
   */
    async getTopRatedExercises(limit = 10) {
        return this.searchExercises('', {
            sortBy: 'rating',
            limit
        });
    }

    /**
   * 初心者向けエクササイズを取得
   * @param {string} muscleGroupId - 筋肉部位ID（オプション）
   * @returns {Promise<Array>} 初心者向けエクササイズ配列
   */
    async getBeginnerExercises(muscleGroupId = null) {
        const filters = {
            isBeginnerFriendly: true,
            sortBy: 'difficulty'
        };

        if (muscleGroupId) {
            filters.muscleGroupId = muscleGroupId;
        }

        return this.searchExercises('', filters);
    }

    /**
   * 自重エクササイズを取得
   * @param {string} muscleGroupId - 筋肉部位ID（オプション）
   * @returns {Promise<Array>} 自重エクササイズ配列
   */
    async getBodyweightExercises(muscleGroupId = null) {
        const filters = {
            isBodyweight: true,
            sortBy: 'difficulty'
        };

        if (muscleGroupId) {
            filters.muscleGroupId = muscleGroupId;
        }

        return this.searchExercises('', filters);
    }

    /**
   * キャッシュをクリア
   */
    clearCache() {
        this.cache.clear();
        this.searchCache.clear();
    }

    /**
   * 利用可能な器具一覧を取得
   * @returns {Promise<Array>} 器具一覧
   */
    async getAvailableEquipment() {
        if (!supabaseService.isAvailable()) {
            return ['bodyweight', 'dumbbell', 'barbell', 'machine'];
        }

        try {
            const { data, error } = await supabaseService.client
                .from('exercises')
                .select('equipment')
                .not('equipment', 'is', null);

            if (error) {
                throw error;
            }

            // 重複を除去してソート
            const equipment = [...new Set(data.map((item) => item.equipment))];
            return equipment.sort();
        } catch (error) {
            console.warn('Failed to get equipment list:', error);
            return ['bodyweight', 'dumbbell', 'barbell', 'machine'];
        }
    }

    /**
   * エクササイズ画像をアップロード
   * @param {File} file - 画像ファイル
   * @param {string} exerciseId - エクササイズID（オプション）
   * @returns {Promise<string>} 画像URL
   */
    async uploadExerciseImage(file, exerciseId = null) {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            throw new Error('認証が必要です');
        }

        // ファイル形式とサイズのバリデーション
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error(
                'サポートされていないファイル形式です。JPEG、PNG、WebPのみ対応しています。'
            );
        }

        if (file.size > 10 * 1024 * 1024) {
            // 10MB制限
            throw new Error('ファイルサイズは10MB以下にしてください');
        }

        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = exerciseId
            ? `${exerciseId}_${Date.now()}.${fileExt}`
            : `custom_${supabaseService.getCurrentUser().id}_${Date.now()}.${fileExt}`;

        try {
            const bucketName = exerciseId
                ? 'exercise-images'
                : 'custom-exercise-media';

            const { error } = await supabaseService.client.storage
                .from(bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (error) {
                console.error('Image upload error:', error);
                throw new Error(`画像アップロードに失敗しました: ${error.message}`);
            }

            // 公開URLを取得
            const { data: publicUrlData } = supabaseService.client.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            if (!publicUrlData?.publicUrl) {
                throw new Error('公開URLの取得に失敗しました');
            }

            console.log(
                'Exercise image uploaded successfully:',
                publicUrlData.publicUrl
            );
            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('Exercise image upload failed:', error);
            throw error;
        }
    }

    /**
   * エクササイズ動画をアップロード
   * @param {File} file - 動画ファイル
   * @param {string} exerciseId - エクササイズID（オプション）
   * @returns {Promise<string>} 動画URL
   */
    async uploadExerciseVideo(file, exerciseId = null) {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            throw new Error('認証が必要です');
        }

        // ファイル形式とサイズのバリデーション
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error(
                'サポートされていないファイル形式です。MP4、WebM、OGGのみ対応しています。'
            );
        }

        if (file.size > 100 * 1024 * 1024) {
            // 100MB制限
            throw new Error('ファイルサイズは100MB以下にしてください');
        }

        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = exerciseId
            ? `${exerciseId}_${Date.now()}.${fileExt}`
            : `custom_${supabaseService.getCurrentUser().id}_${Date.now()}.${fileExt}`;

        try {
            const bucketName = exerciseId
                ? 'exercise-videos'
                : 'custom-exercise-media';

            const { error } = await supabaseService.client.storage
                .from(bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (error) {
                console.error('Video upload error:', error);
                throw new Error(`動画アップロードに失敗しました: ${error.message}`);
            }

            // 公開URLを取得
            const { data: publicUrlData } = supabaseService.client.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            if (!publicUrlData?.publicUrl) {
                throw new Error('公開URLの取得に失敗しました');
            }

            console.log(
                'Exercise video uploaded successfully:',
                publicUrlData.publicUrl
            );
            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('Exercise video upload failed:', error);
            throw error;
        }
    }

    /**
   * メディアファイルを削除
   * @param {string} url - メディアファイルのURL
   * @returns {Promise<boolean>} 削除成功かどうか
   */
    async deleteExerciseMedia(url) {
        if (!supabaseService.isAvailable() || !url) {
            return false;
        }

        try {
            // URLからファイル名とバケット名を抽出
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];

            // バケット名を推定
            let bucketName = 'custom-exercise-media';
            if (url.includes('exercise-images')) {
                bucketName = 'exercise-images';
            } else if (url.includes('exercise-videos')) {
                bucketName = 'exercise-videos';
            }

            const { error } = await supabaseService.client.storage
                .from(bucketName)
                .remove([fileName]);

            if (error) {
                console.error('Media delete error:', error);
                return false;
            }

            console.log('Exercise media deleted successfully:', fileName);
            return true;
        } catch (error) {
            console.error('Exercise media delete failed:', error);
            return false;
        }
    }

    /**
   * 画像ファイルのプレビューを生成
   * @param {File} file - 画像ファイル
   * @returns {Promise<string>} プレビューURL
   */
    generateImagePreview(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('画像ファイルではありません'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () =>
                reject(new Error('ファイル読み込みに失敗しました'));
            reader.readAsDataURL(file);
        });
    }

    /**
   * 動画ファイルの情報を取得
   * @param {File} file - 動画ファイル
   * @returns {Promise<Object>} 動画情報（duration, width, height）
   */
    getVideoInfo(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('video/')) {
                reject(new Error('動画ファイルではありません'));
                return;
            }

            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                resolve({
                    duration: Math.round(video.duration),
                    width: video.videoWidth,
                    height: video.videoHeight
                });
                URL.revokeObjectURL(video.src);
            };

            video.onerror = () => {
                reject(new Error('動画ファイルの読み込みに失敗しました'));
                URL.revokeObjectURL(video.src);
            };

            video.src = URL.createObjectURL(file);
        });
    }

    /**
   * エクササイズを追加
   * @param {Object} exerciseData - エクササイズデータ
   * @returns {Promise<Object>} 追加されたエクササイズ
   */
    async addExercise(exerciseData) {
        try {
            if (!supabaseService.isAvailable()) {
                throw new Error('Supabase not available');
            }

            const result = await supabaseService.saveData('exercises', exerciseData);
            this.clearCache(); // キャッシュをクリア
            return result;
        } catch (error) {
            handleError(error, 'ExerciseService.addExercise');
            throw error;
        }
    }

    /**
   * エクササイズを更新
   * @param {number} id - エクササイズID
   * @param {Object} exerciseData - 更新データ
   * @returns {Promise<Object>} 更新されたエクササイズ
   */
    async updateExercise(id, exerciseData) {
        try {
            if (!supabaseService.isAvailable()) {
                throw new Error('Supabase not available');
            }

            const result = await supabaseService.saveData('exercises', {
                ...exerciseData,
                id
            });
            this.clearCache(); // キャッシュをクリア
            return result;
        } catch (error) {
            handleError(error, 'ExerciseService.updateExercise');
            throw error;
        }
    }

    /**
   * エクササイズを削除
   * @param {number} id - エクササイズID
   * @returns {Promise<void>}
   */
    async deleteExercise(id) {
        try {
            if (!supabaseService.isAvailable()) {
                throw new Error('Supabase not available');
            }

            await supabaseService.saveData('exercises', { id, deleted: true });
            this.clearCache(); // キャッシュをクリア
        } catch (error) {
            handleError(error, 'ExerciseService.deleteExercise');
            throw error;
        }
    }
}

// シングルトンインスタンスをエクスポート
export const exerciseService = new ExerciseService();
