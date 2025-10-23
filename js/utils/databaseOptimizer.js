// databaseOptimizer.js - データベースクエリ最適化とページネーション

class DatabaseOptimizer {
    constructor() {
        this.queryCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分
        this.maxCacheSize = 100;
        this.queryStats = {
            totalQueries: 0,
            cacheHits: 0,
            averageResponseTime: 0,
            slowQueries: []
        };
    }

    /**
     * 最適化されたクエリを実行
     * @param {Function} queryFunction - クエリ実行関数
     * @param {string} cacheKey - キャッシュキー
     * @param {Object} options - オプション
     * @returns {Promise<any>} クエリ結果
     */
    async executeOptimizedQuery(queryFunction, cacheKey, options = {}) {
        const startTime = performance.now();
        this.queryStats.totalQueries++;

        // キャッシュチェック
        if (options.useCache !== false) {
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                this.queryStats.cacheHits++;
                console.log(`🎯 キャッシュヒット: ${cacheKey}`);
                return cachedResult;
            }
        }

        try {
            // クエリ実行
            const result = await queryFunction();
            const duration = performance.now() - startTime;

            // パフォーマンス統計更新
            this.updateQueryStats(duration, cacheKey);

            // 結果をキャッシュ
            if (options.useCache !== false && result) {
                this.setCachedResult(cacheKey, result, options.cacheTTL);
            }

            console.log(`📊 クエリ実行: ${cacheKey} (${duration.toFixed(2)}ms)`);
            return result;

        } catch (error) {
            const duration = performance.now() - startTime;
            console.error(`❌ クエリエラー: ${cacheKey} (${duration.toFixed(2)}ms)`, error);
            throw error;
        }
    }

    /**
     * ページネーション付きクエリを実行
     * @param {Function} queryFunction - クエリ実行関数
     * @param {Object} paginationOptions - ページネーションオプション
     * @returns {Promise<Object>} ページネーション結果
     */
    async executePaginatedQuery(queryFunction, paginationOptions = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'created_at',
            sortOrder = 'desc',
            cacheKey,
            useCache = true
        } = paginationOptions;

        const offset = (page - 1) * limit;
        const fullCacheKey = `${cacheKey}_page_${page}_limit_${limit}_sort_${sortBy}_${sortOrder}`;

        return this.executeOptimizedQuery(
            async () => {
                // ページネーション付きクエリを実行
                const result = await queryFunction({
                    offset,
                    limit,
                    sortBy,
                    sortOrder
                });

                // 総件数を取得（別途カウントクエリが必要な場合）
                let totalCount = result.totalCount;
                if (!totalCount && result.data) {
                    totalCount = result.data.length;
                }

                return {
                    data: result.data || result,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        hasNext: page * limit < totalCount,
                        hasPrev: page > 1
                    },
                    sortBy,
                    sortOrder
                };
            },
            fullCacheKey,
            { useCache, cacheTTL: 2 * 60 * 1000 } // 2分キャッシュ
        );
    }

    /**
     * バッチクエリを実行（複数のクエリを効率的に処理）
     * @param {Array} queries - クエリ配列
     * @param {Object} options - オプション
     * @returns {Promise<Array>} 結果配列
     */
    async executeBatchQueries(queries, options = {}) {
        const { concurrency = 3, failFast = false } = options;

        console.log(`📦 バッチクエリ実行: ${queries.length}件 (並行度: ${concurrency})`);

        const results = [];
        const errors = [];

        // 並行度を制限してクエリを実行
        for (let i = 0; i < queries.length; i += concurrency) {
            const batch = queries.slice(i, i + concurrency);

            const batchPromises = batch.map(async (query, index) => {
                try {
                    const result = await this.executeOptimizedQuery(
                        query.queryFunction,
                        query.cacheKey,
                        query.options
                    );
                    return { index: i + index, result, success: true };
                } catch (error) {
                    const errorResult = { index: i + index, error, success: false };
                    if (failFast) {
                        throw errorResult;
                    }
                    return errorResult;
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);

            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value.success) {
                        results[result.value.index] = result.value.result;
                    } else {
                        errors.push(result.value);
                    }
                } else {
                    errors.push({ error: result.reason });
                }
            });
        }

        if (errors.length > 0 && failFast) {
            throw new Error(`バッチクエリで${errors.length}件のエラーが発生しました`);
        }

        console.log(`✅ バッチクエリ完了: 成功 ${results.length}件, エラー ${errors.length}件`);
        return { results, errors };
    }

    /**
     * インデックス最適化のための分析を実行
     * @param {Array} queries - 分析対象のクエリ
     * @returns {Object} 最適化提案
     */
    analyzeQueryPerformance(queries) {
        const analysis = {
            slowQueries: [],
            frequentQueries: new Map(),
            indexSuggestions: [],
            cacheOptimizations: []
        };

        // 遅いクエリを特定
        this.queryStats.slowQueries.forEach(query => {
            if (query.duration > 1000) { // 1秒以上
                analysis.slowQueries.push(query);
            }
        });

        // 頻繁に実行されるクエリを特定
        queries.forEach(query => {
            const count = analysis.frequentQueries.get(query.pattern) || 0;
            analysis.frequentQueries.set(query.pattern, count + 1);
        });

        // インデックス提案を生成
        analysis.slowQueries.forEach(query => {
            if (query.cacheKey.includes('workout_sessions')) {
                analysis.indexSuggestions.push({
                    table: 'workout_sessions',
                    columns: ['user_id', 'workout_date'],
                    reason: '頻繁なユーザー別日付検索のため'
                });
            }

            if (query.cacheKey.includes('training_logs')) {
                analysis.indexSuggestions.push({
                    table: 'training_logs',
                    columns: ['workout_session_id', 'muscle_group_id'],
                    reason: 'セッション別筋肉部位検索のため'
                });
            }
        });

        // キャッシュ最適化提案
        analysis.frequentQueries.forEach((count, pattern) => {
            if (count > 10) {
                analysis.cacheOptimizations.push({
                    pattern,
                    frequency: count,
                    suggestion: 'より長いキャッシュTTLを設定'
                });
            }
        });

        return analysis;
    }

    /**
     * クエリ結果をキャッシュに保存
     * @param {string} key - キャッシュキー
     * @param {any} result - 結果
     * @param {number} ttl - 生存時間（ミリ秒）
     */
    setCachedResult(key, result, ttl = this.cacheTimeout) {
        // キャッシュサイズ制限
        if (this.queryCache.size >= this.maxCacheSize) {
            const firstKey = this.queryCache.keys().next().value;
            this.queryCache.delete(firstKey);
        }

        const cacheEntry = {
            result,
            timestamp: Date.now(),
            ttl
        };

        this.queryCache.set(key, cacheEntry);
    }

    /**
     * キャッシュから結果を取得
     * @param {string} key - キャッシュキー
     * @returns {any|null} キャッシュされた結果
     */
    getCachedResult(key) {
        const entry = this.queryCache.get(key);
        if (!entry) {return null;}

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.queryCache.delete(key);
            return null;
        }

        return entry.result;
    }

    /**
     * クエリ統計を更新
     * @param {number} duration - 実行時間
     * @param {string} cacheKey - キャッシュキー
     */
    updateQueryStats(duration, cacheKey) {
        // 平均レスポンス時間を更新
        const currentAvg = this.queryStats.averageResponseTime;
        const totalQueries = this.queryStats.totalQueries;
        this.queryStats.averageResponseTime =
            (currentAvg * (totalQueries - 1) + duration) / totalQueries;

        // 遅いクエリを記録
        if (duration > 500) { // 500ms以上
            this.queryStats.slowQueries.push({
                cacheKey,
                duration,
                timestamp: Date.now()
            });

            // 最新100件のみ保持
            if (this.queryStats.slowQueries.length > 100) {
                this.queryStats.slowQueries.shift();
            }
        }
    }

    /**
     * データベース接続プールを最適化
     * @param {Object} poolConfig - プール設定
     * @returns {Object} 最適化されたプール設定
     */
    optimizeConnectionPool(poolConfig = {}) {
        const optimized = {
            // 基本設定
            min: poolConfig.min || 2,
            max: poolConfig.max || 10,

            // 接続タイムアウト
            acquireTimeoutMillis: poolConfig.acquireTimeoutMillis || 30000,
            createTimeoutMillis: poolConfig.createTimeoutMillis || 30000,
            destroyTimeoutMillis: poolConfig.destroyTimeoutMillis || 5000,
            idleTimeoutMillis: poolConfig.idleTimeoutMillis || 30000,

            // 再試行設定
            reapIntervalMillis: poolConfig.reapIntervalMillis || 1000,
            createRetryIntervalMillis: poolConfig.createRetryIntervalMillis || 200,

            // パフォーマンス最適化
            propagateCreateError: false,

            // ログ設定
            log: (message, logLevel) => {
                if (logLevel === 'error') {
                    console.error('🔗 DB Pool Error:', message);
                } else if (logLevel === 'warn') {
                    console.warn('🔗 DB Pool Warning:', message);
                }
            }
        };

        console.log('🔗 データベース接続プールを最適化しました:', optimized);
        return optimized;
    }

    /**
     * クエリビルダーを最適化
     * @param {Object} baseQuery - ベースクエリ
     * @param {Object} filters - フィルター
     * @returns {Object} 最適化されたクエリ
     */
    buildOptimizedQuery(baseQuery, filters = {}) {
        const query = { ...baseQuery };

        // インデックスを活用するためのクエリ最適化
        if (filters.userId) {
            // user_id は最初にフィルタリング（インデックスが効く）
            query.where = query.where || [];
            query.where.unshift(['user_id', '=', filters.userId]);
        }

        if (filters.dateRange) {
            // 日付範囲フィルタ（インデックスが効く）
            query.where = query.where || [];
            if (filters.dateRange.start) {
                query.where.push(['workout_date', '>=', filters.dateRange.start]);
            }
            if (filters.dateRange.end) {
                query.where.push(['workout_date', '<=', filters.dateRange.end]);
            }
        }

        // LIMIT を適切に設定
        if (!query.limit || query.limit > 100) {
            query.limit = 50; // デフォルト制限
        }

        // 必要な列のみ選択
        if (!query.select || query.select.includes('*')) {
            query.select = this.getOptimalColumns(query.table);
        }

        // ソート最適化
        if (query.orderBy && !this.hasIndexForSort(query.table, query.orderBy)) {
            console.warn(`⚠️ ソート列にインデックスがありません: ${query.table}.${query.orderBy}`);
        }

        return query;
    }

    /**
     * テーブルの最適な列を取得
     * @param {string} tableName - テーブル名
     * @returns {Array} 列名配列
     */
    getOptimalColumns(tableName) {
        const columnMap = {
            workout_sessions: [
                'id', 'session_name', 'workout_date', 'start_time', 'end_time',
                'total_duration_minutes', 'muscle_groups_trained', 'is_completed'
            ],
            training_logs: [
                'id', 'workout_session_id', 'exercise_name', 'sets', 'reps',
                'weights', 'muscle_group_id', 'workout_date'
            ],
            user_profiles: [
                'id', 'display_name', 'avatar_url', 'font_size', 'theme_preference'
            ]
        };

        return columnMap[tableName] || ['*'];
    }

    /**
     * ソート用インデックスの存在チェック
     * @param {string} tableName - テーブル名
     * @param {string} column - 列名
     * @returns {boolean} インデックス存在フラグ
     */
    hasIndexForSort(tableName, column) {
        const indexedColumns = {
            workout_sessions: ['workout_date', 'user_id', 'created_at'],
            training_logs: ['workout_date', 'workout_session_id', 'created_at'],
            user_profiles: ['id', 'created_at']
        };

        return indexedColumns[tableName]?.includes(column) || false;
    }

    /**
     * キャッシュを最適化
     */
    optimizeCache() {
        const now = Date.now();
        let removedCount = 0;

        // 期限切れエントリを削除
        for (const [key, entry] of this.queryCache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.queryCache.delete(key);
                removedCount++;
            }
        }

        console.log(`🧹 キャッシュ最適化: ${removedCount}件の期限切れエントリを削除`);
    }

    /**
     * パフォーマンス統計を取得
     * @returns {Object} 統計情報
     */
    getPerformanceStats() {
        const cacheHitRate = this.queryStats.totalQueries > 0
            ? (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2)
            : 0;

        return {
            totalQueries: this.queryStats.totalQueries,
            cacheHits: this.queryStats.cacheHits,
            cacheHitRate: `${cacheHitRate}%`,
            averageResponseTime: `${this.queryStats.averageResponseTime.toFixed(2)}ms`,
            slowQueriesCount: this.queryStats.slowQueries.length,
            cacheSize: this.queryCache.size,
            recentSlowQueries: this.queryStats.slowQueries.slice(-5)
        };
    }

    /**
     * キャッシュをクリア
     */
    clearCache() {
        this.queryCache.clear();
        console.log('🧹 クエリキャッシュをクリアしました');
    }

    /**
     * 統計をリセット
     */
    resetStats() {
        this.queryStats = {
            totalQueries: 0,
            cacheHits: 0,
            averageResponseTime: 0,
            slowQueries: []
        };
        console.log('📊 クエリ統計をリセットしました');
    }
}

// シングルトンインスタンスをエクスポート
export const databaseOptimizer = new DatabaseOptimizer();
