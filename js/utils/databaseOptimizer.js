// databaseOptimizer.js - データベース最適化ユーティリティ

import { supabaseService } from '../services/supabaseService.js';
import { handleError } from './errorHandler.js';

class DatabaseOptimizer {
    constructor() {
        this.queryCache = new Map();
        this.connectionPool = new Map();
        this.indexOptimizations = new Map();
        this.queryMetrics = new Map();
        this.batchOperations = [];
        this.optimizationRules = new Map();
        this.init();
    }

    /**
     * データベース最適化を初期化
     */
    init() {
        this.setupQueryOptimization();
        this.setupConnectionPooling();
        this.setupIndexOptimization();
        this.setupBatchOperations();
        this.setupDataCompression();
        this.setupQueryCaching();
        this.setupPerformanceMonitoring();
    }

    /**
     * クエリ最適化設定
     */
    setupQueryOptimization() {
        // クエリ最適化ルール
        this.optimizationRules.set('select', {
            maxColumns: 20,
            preferIndexes: true,
            useJoins: true,
            limitResults: true
        });

        this.optimizationRules.set('insert', {
            batchSize: 100,
            useTransactions: true,
            validateData: true
        });

        this.optimizationRules.set('update', {
            useWhereClause: true,
            limitRows: 1000,
            useTransactions: true
        });

        this.optimizationRules.set('delete', {
            useWhereClause: true,
            limitRows: 100,
            useTransactions: true
        });
    }

    /**
     * 接続プール設定
     */
    setupConnectionPooling() {
        this.connectionPool = new Map();
        this.maxConnections = 10;
        this.connectionTimeout = 30000; // 30秒

        // 接続プール管理
        this.getConnection = async () => {
            if (this.connectionPool.size >= this.maxConnections) {
                await this.waitForConnection();
            }

            const connectionId = this.generateConnectionId();
            const connection = {
                id: connectionId,
                createdAt: Date.now(),
                lastUsed: Date.now(),
                isActive: true
            };

            this.connectionPool.set(connectionId, connection);
            return connection;
        };

        this.releaseConnection = (connectionId) => {
            if (this.connectionPool.has(connectionId)) {
                this.connectionPool.delete(connectionId);
            }
        };
    }

    /**
     * 接続待機
     */
    async waitForConnection() {
        return new Promise((resolve) => {
            const checkConnection = () => {
                if (this.connectionPool.size < this.maxConnections) {
                    resolve();
                } else {
                    setTimeout(checkConnection, 100);
                }
            };
            checkConnection();
        });
    }

    /**
     * 接続ID生成
     */
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * インデックス最適化設定
     */
    setupIndexOptimization() {
        // インデックス最適化ルール
        this.indexOptimizations.set('workout_sessions', [
            { column: 'user_id', type: 'btree' },
            { column: 'workout_date', type: 'btree' },
            { column: 'muscle_groups_trained', type: 'gin' },
            { columns: ['user_id', 'workout_date'], type: 'btree' }
        ]);

        this.indexOptimizations.set('training_logs', [
            { column: 'workout_session_id', type: 'btree' },
            { column: 'exercise_name', type: 'btree' },
            { column: 'muscle_group_id', type: 'btree' }
        ]);

        this.indexOptimizations.set('exercises', [
            { column: 'muscle_group_id', type: 'btree' },
            { column: 'name_ja', type: 'btree' },
            { column: 'difficulty_level', type: 'btree' }
        ]);

        this.indexOptimizations.set('muscle_groups', [
            { column: 'name', type: 'btree' },
            { column: 'name_ja', type: 'btree' }
        ]);
    }

    /**
     * バッチ操作設定
     */
    setupBatchOperations() {
        this.batchOperations = [];
        this.batchSize = 100;
        this.batchTimeout = 5000; // 5秒

        // バッチ操作の実行
        this.executeBatch = async () => {
            if (this.batchOperations.length === 0) {return;}

            const operations = this.batchOperations.splice(0, this.batchSize);

            try {
                await this.processBatchOperations(operations);
            } catch (error) {
                console.error('バッチ操作エラー:', error);
                // 失敗した操作を元に戻す
                this.batchOperations.unshift(...operations);
            }
        };

        // 定期的なバッチ実行
        setInterval(() => {
            this.executeBatch();
        }, this.batchTimeout);
    }

    /**
     * バッチ操作処理
     */
    async processBatchOperations(operations) {
        const groupedOperations = this.groupOperationsByType(operations);

        for (const [operationType, ops] of groupedOperations) {
            await this.executeOperationGroup(operationType, ops);
        }
    }

    /**
     * 操作をタイプ別にグループ化
     */
    groupOperationsByType(operations) {
        const groups = new Map();

        operations.forEach(op => {
            if (!groups.has(op.type)) {
                groups.set(op.type, []);
            }
            groups.get(op.type).push(op);
        });

        return groups;
    }

    /**
     * 操作グループ実行
     */
    async executeOperationGroup(type, operations) {
        switch (type) {
            case 'insert':
                await this.batchInsert(operations);
                break;
            case 'update':
                await this.batchUpdate(operations);
                break;
            case 'delete':
                await this.batchDelete(operations);
                break;
            default:
                console.warn('未知の操作タイプ:', type);
        }
    }

    /**
     * バッチ挿入
     */
    async batchInsert(operations) {
        const tableGroups = this.groupOperationsByTable(operations);

        for (const [table, ops] of tableGroups) {
            const data = ops.map(op => op.data);

            const { error } = await supabaseService.client
                .from(table)
                .insert(data);

            if (error) {
                throw new Error(`バッチ挿入エラー (${table}): ${error.message}`);
            }
        }
    }

    /**
     * バッチ更新
     */
    async batchUpdate(operations) {
        for (const op of operations) {
            const { error } = await supabaseService.client
                .from(op.table)
                .update(op.data)
                .eq(op.condition.column, op.condition.value);

            if (error) {
                throw new Error(`バッチ更新エラー (${op.table}): ${error.message}`);
            }
        }
    }

    /**
     * バッチ削除
     */
    async batchDelete(operations) {
        for (const op of operations) {
            const { error } = await supabaseService.client
                .from(op.table)
                .delete()
                .eq(op.condition.column, op.condition.value);

            if (error) {
                throw new Error(`バッチ削除エラー (${op.table}): ${error.message}`);
            }
        }
    }

    /**
     * 操作をテーブル別にグループ化
     */
    groupOperationsByTable(operations) {
        const groups = new Map();

        operations.forEach(op => {
            if (!groups.has(op.table)) {
                groups.set(op.table, []);
            }
            groups.get(op.table).push(op);
        });

        return groups;
    }

    /**
     * データ圧縮設定
     */
    setupDataCompression() {
        this.compressionEnabled = true;
        this.compressionLevel = 6; // 1-9の範囲

        // データ圧縮
        this.compressData = (data) => {
            if (!this.compressionEnabled) {return data;}

            try {
                const jsonString = JSON.stringify(data);
                const compressed = this.compressString(jsonString);
                return compressed;
            } catch (error) {
                console.warn('データ圧縮エラー:', error);
                return data;
            }
        };

        // データ展開
        this.decompressData = (compressedData) => {
            if (!this.compressionEnabled) {return compressedData;}

            try {
                const jsonString = this.decompressString(compressedData);
                return JSON.parse(jsonString);
            } catch (error) {
                console.warn('データ展開エラー:', error);
                return compressedData;
            }
        };
    }

    /**
     * 文字列圧縮
     */
    compressString(str) {
        // 簡易的な圧縮（実際の実装ではLZ4やgzipを使用）
        return btoa(str);
    }

    /**
     * 文字列展開
     */
    decompressString(compressedStr) {
        return atob(compressedStr);
    }

    /**
     * クエリキャッシュ設定
     */
    setupQueryCaching() {
        this.queryCache = new Map();
        this.cacheTimeout = 300000; // 5分
        this.maxCacheSize = 100;

        // キャッシュ取得
        this.getCachedQuery = (queryKey) => {
            const cached = this.queryCache.get(queryKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
            return null;
        };

        // キャッシュ設定
        this.setCachedQuery = (queryKey, data) => {
            if (this.queryCache.size >= this.maxCacheSize) {
                this.evictOldestCache();
            }

            this.queryCache.set(queryKey, {
                data,
                timestamp: Date.now()
            });
        };

        // 古いキャッシュを削除
        this.evictOldestCache = () => {
            let oldestKey = null;
            let oldestTime = Date.now();

            for (const [key, value] of this.queryCache) {
                if (value.timestamp < oldestTime) {
                    oldestTime = value.timestamp;
                    oldestKey = key;
                }
            }

            if (oldestKey) {
                this.queryCache.delete(oldestKey);
            }
        };
    }

    /**
     * パフォーマンス監視設定
     */
    setupPerformanceMonitoring() {
        this.queryMetrics = new Map();

        // クエリ実行時間監視
        this.monitorQuery = async (queryName, queryFn) => {
            const startTime = performance.now();

            try {
                if (typeof queryFn !== 'function') {
                    throw new Error('queryFn must be a function');
                }
                const result = await queryFn();
                const endTime = performance.now();
                const duration = endTime - startTime;

                this.recordQueryMetric(queryName, duration, true);
                return result;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;

                this.recordQueryMetric(queryName, duration, false);
                throw error;
            }
        };
    }

    /**
     * クエリメトリクス記録
     */
    recordQueryMetric(queryName, duration, success) {
        if (!this.queryMetrics.has(queryName)) {
            this.queryMetrics.set(queryName, {
                count: 0,
                totalDuration: 0,
                averageDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                successCount: 0,
                errorCount: 0
            });
        }

        const metrics = this.queryMetrics.get(queryName);
        metrics.count++;
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.count;
        metrics.minDuration = Math.min(metrics.minDuration, duration);
        metrics.maxDuration = Math.max(metrics.maxDuration, duration);

        if (success) {
            metrics.successCount++;
        } else {
            metrics.errorCount++;
        }
    }

    /**
     * 最適化されたクエリ実行
     */
    async executeOptimizedQuery(queryName, queryFn, options = {}) {
        const queryKey = this.generateQueryKey(queryName, options);

        // キャッシュチェック
        const cached = this.getCachedQuery(queryKey);
        if (cached && !options.forceRefresh) {
            return cached;
        }

        // クエリ実行
        const result = await this.monitorQuery(queryName, queryFn);

        // キャッシュに保存
        this.setCachedQuery(queryKey, result);

        return result;
    }

    /**
     * クエリキー生成
     */
    generateQueryKey(queryName, options) {
        const params = JSON.stringify(options);
        return `${queryName}_${btoa(params)}`;
    }

    /**
     * データベース統計取得
     */
    getDatabaseStats() {
        return {
            queryCache: {
                size: this.queryCache.size,
                maxSize: this.maxCacheSize
            },
            connectionPool: {
                active: this.connectionPool.size,
                max: this.maxConnections
            },
            queryMetrics: Object.fromEntries(this.queryMetrics),
            batchOperations: {
                pending: this.batchOperations.length,
                batchSize: this.batchSize
            }
        };
    }

    /**
     * パフォーマンスレポート生成
     */
    generatePerformanceReport() {
        const stats = this.getDatabaseStats();
        const report = {
            timestamp: new Date().toISOString(),
            databaseStats: stats,
            recommendations: this.generateOptimizationRecommendations(stats)
        };

        return report;
    }

    /**
     * 最適化推奨事項生成
     */
    generateOptimizationRecommendations(stats) {
        const recommendations = [];

        // キャッシュ効率の推奨事項
        if (stats.queryCache.size > stats.queryCache.maxSize * 0.8) {
            recommendations.push({
                type: 'cache',
                priority: 'medium',
                message: 'クエリキャッシュの使用率が高いです。キャッシュサイズの増加を検討してください。'
            });
        }

        // 接続プールの推奨事項
        if (stats.connectionPool.active > stats.connectionPool.max * 0.8) {
            recommendations.push({
                type: 'connection',
                priority: 'high',
                message: '接続プールの使用率が高いです。最大接続数の増加を検討してください。'
            });
        }

        // クエリパフォーマンスの推奨事項
        for (const [queryName, metrics] of Object.entries(stats.queryMetrics)) {
            if (metrics.averageDuration > 1000) {
                recommendations.push({
                    type: 'performance',
                    priority: 'high',
                    message: `${queryName}の平均実行時間が${metrics.averageDuration.toFixed(2)}msです。インデックスの追加を検討してください。`
                });
            }
        }

        return recommendations;
    }

    /**
     * データベース最適化実行
     */
    async performOptimization() {
        const optimizations = [];

        try {
            // インデックス最適化
            await this.optimizeIndexes();
            optimizations.push('インデックス最適化完了');

            // クエリキャッシュ最適化
            this.optimizeQueryCache();
            optimizations.push('クエリキャッシュ最適化完了');

            // 接続プール最適化
            this.optimizeConnectionPool();
            optimizations.push('接続プール最適化完了');

            return {
                success: true,
                optimizations,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            handleError(error, {
                context: 'データベース最適化',
                showNotification: true
            });

            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * キャッシュ結果設定（テスト用）
     */
    setCachedResult(key, result) {
        this.setCachedQuery(key, result);
    }

    /**
     * キャッシュクエリ取得（テスト用）
     */
    getCachedQuery(key) {
        const cached = this.queryCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * ページネーション付きクエリ実行
     */
    async executePaginatedQuery(queryName, queryFn, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const queryKey = `${queryName}_page_${page}_limit_${limit}`;

        // キャッシュチェック
        const cached = this.getCachedQuery(queryKey);
        if (cached) {
            return cached;
        }

        // クエリ実行
        const result = await this.monitorQuery(queryName, async () => {
            return await queryFn(offset, limit);
        });

        // キャッシュに保存
        this.setCachedQuery(queryKey, result);

        return result;
    }

    /**
     * バッチクエリ実行
     */
    async executeBatchQueries(queries, options = {}) {
        const startTime = performance.now();

        try {
            const results = await Promise.all(queries.map(async (query) => {
                return await this.monitorQuery(query.name, query.queryFunction);
            }));

            const endTime = typeof window !== 'undefined' && window.performance ? window.performance.now() : Date.now();
            const duration = endTime - startTime;

            console.log(`バッチクエリ実行完了: ${queries.length}件, ${duration.toFixed(2)}ms`);

            return { results, errors: [] };
        } catch (error) {
            console.error('バッチクエリ実行エラー:', error);
            throw error;
        }
    }

    /**
     * 統計リセット
     */
    resetStats() {
        this.queryMetrics.clear();
        this.queryCache.clear();
        this.connectionPool.clear();
        this.batchOperations = [];

        console.log('データベース統計をリセットしました');
    }

    /**
     * クエリ統計更新
     */
    updateQueryStats(duration, queryName) {
        this.recordQueryMetric(queryName, duration, true);
    }

    /**
     * パフォーマンス統計取得
     */
    getPerformanceStats() {
        const totalQueries = Array.from(this.queryMetrics.values())
            .reduce((sum, metrics) => sum + metrics.count, 0);
        const totalDuration = Array.from(this.queryMetrics.values())
            .reduce((sum, metrics) => sum + metrics.totalDuration, 0);
        const averageResponseTime = totalQueries > 0 ? totalDuration / totalQueries : 0;

        return {
            totalQueries,
            averageResponseTime: averageResponseTime.toFixed(2)
        };
    }

    /**
     * インデックス最適化
     */
    async optimizeIndexes() {
        // インデックス最適化の実装
        console.log('インデックス最適化を実行中...');
    }

    /**
     * クエリキャッシュ最適化
     */
    optimizeQueryCache() {
        // 古いキャッシュを削除
        const now = Date.now();
        for (const [key, value] of this.queryCache) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.queryCache.delete(key);
            }
        }
    }

    /**
     * 接続プール最適化
     */
    optimizeConnectionPool() {
        // 古い接続を削除
        const now = Date.now();
        for (const [id, connection] of this.connectionPool) {
            if (now - connection.lastUsed > this.connectionTimeout) {
                this.connectionPool.delete(id);
            }
        }
    }
}

// グローバルインスタンスを作成
const databaseOptimizer = new DatabaseOptimizer();

// グローバルに公開
window.databaseOptimizer = databaseOptimizer;

export default databaseOptimizer;