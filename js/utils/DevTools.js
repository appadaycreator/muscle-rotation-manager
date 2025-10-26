/**
 * Chrome DevTools統合ユーティリティ
 * デバッグとパフォーマンス監視を提供
 */
export class DevTools {
    constructor() {
        this.isInitialized = false;
        this.isDevToolsOpen = false;
        this.performanceObserver = null;
        this.errorObserver = null;
        this.memoryObserver = null;
    }

    /**
     * DevToolsを初期化
     */
    initialize() {
        if (this.isInitialized) {
            return false;
        }

        if (typeof window === 'undefined') {
            return false;
        }

        // DevToolsの開閉を検出
        this.detectDevToolsOpen();

        // パフォーマンス監視を開始
        this.setupPerformanceMonitoring();

        // エラー監視を開始
        this.setupErrorTracking();

        // ネットワーク監視を開始
        this.setupNetworkMonitoring();

        // メモリ監視を開始
        this.setupMemoryMonitoring();

        // コンソールログの拡張
        this.enhanceConsoleLogging();

        this.isInitialized = true;
        console.log('🔧 DevTools integration initialized');
        return true;
    }

    /**
     * DevToolsの開閉を検出
     */
    detectDevToolsOpen() {
        const devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold ||
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.onDevToolsOpen();
                }
            } else {
                if (devtools.open) {
                    devtools.open = false;
                    this.onDevToolsClose();
                }
            }
        }, 500);
    }

    /**
     * DevToolsが開いた時の処理
     */
    onDevToolsOpen() {
        this.isDevToolsOpen = true;
        console.log('🔧 DevTools opened');
    }

    /**
     * DevToolsが閉じた時の処理
     */
    onDevToolsClose() {
        this.isDevToolsOpen = false;
        console.log('🔧 DevTools closed');
    }

    /**
     * パフォーマンス監視をセットアップ
     */
    setupPerformanceMonitoring() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }

        try {
            // Long Task の監視
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 50) {
                        console.warn(`⚠️ Long Task detected: ${entry.duration.toFixed(2)}ms`);
                        this.recordPerformanceIssue('long_task', entry.duration);
                    }
                });
            });

            this.performanceObserver.observe({ entryTypes: ['longtask'] });

            // Navigation Timing の監視
            this.navigationObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.analyzeNavigationTiming(entry);
                });
            });

            this.navigationObserver.observe({ entryTypes: ['navigation'] });

        } catch (error) {
            console.error('Failed to setup performance monitoring:', error);
        }
    }

    /**
     * エラー監視をセットアップ
     */
    setupErrorTracking() {
        // グローバルエラーハンドラー
        window.addEventListener('error', (event) => {
            this.logError({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Promise rejection ハンドラー
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                message: 'Unhandled Promise Rejection',
                reason: event.reason
            });
        });
    }

    /**
     * ネットワーク監視をセットアップ
     */
    setupNetworkMonitoring() {
        if (!('PerformanceObserver' in window)) {
            return;
        }

        try {
            const networkObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.logNetwork({
                            url: entry.name,
                            duration: entry.duration,
                            size: entry.transferSize,
                            type: entry.initiatorType
                        });
                    }
                });
            });

            networkObserver.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.error('Failed to setup network monitoring:', error);
        }
    }

    /**
     * メモリ監視をセットアップ
     */
    setupMemoryMonitoring() {
        if (!('memory' in performance)) {
            console.warn('Memory API not supported');
            return;
        }

        setInterval(() => {
            const memory = performance.memory;
            this.logMemory({
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
            });
        }, 5000);
    }

    /**
     * パフォーマンスデータをログ
     */
    logPerformance(performanceData) {
        const logEntry = {
            type: 'performance',
            timestamp: Date.now(),
            data: performanceData
        };

        console.log('📊 Performance:', performanceData);
        this.storeLogEntry(logEntry);
    }

    /**
     * エラーデータをログ
     */
    logError(errorData) {
        const logEntry = {
            type: 'error',
            timestamp: Date.now(),
            data: errorData
        };

        console.error('❌ Error:', errorData);
        this.storeLogEntry(logEntry);
    }

    /**
     * ネットワークデータをログ
     */
    logNetwork(networkData) {
        const logEntry = {
            type: 'network',
            timestamp: Date.now(),
            data: networkData
        };

        console.log('🌐 Network:', networkData);
        this.storeLogEntry(logEntry);
    }

    /**
     * メモリデータをログ
     */
    logMemory(memoryData) {
        const logEntry = {
            type: 'memory',
            timestamp: Date.now(),
            data: memoryData
        };

        console.log('💾 Memory:', memoryData);
        this.storeLogEntry(logEntry);
    }

    /**
     * コンソールログの拡張
     */
    enhanceConsoleLogging() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            this.logWithTimestamp('log', args);
            originalLog.apply(console, args);
        };

        console.error = (...args) => {
            this.logWithTimestamp('error', args);
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            this.logWithTimestamp('warn', args);
            originalWarn.apply(console, args);
        };
    }

    /**
     * タイムスタンプ付きログ
     */
    logWithTimestamp(level, args) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            level,
            timestamp,
            message: args.join(' ')
        };

        this.storeLogEntry(logEntry);
    }

    /**
     * パフォーマンス問題を記録
     */
    recordPerformanceIssue(type, duration) {
        const issue = {
            type,
            duration,
            timestamp: Date.now()
        };

        this.storePerformanceIssue(issue);
    }

    /**
     * ナビゲーションタイミングを分析
     */
    analyzeNavigationTiming(entry) {
        const timing = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
            loadComplete: entry.loadEventEnd - entry.navigationStart,
            firstPaint: entry.responseStart - entry.navigationStart
        };

        this.logPerformance({
            name: 'navigation',
            timing
        });
    }

    /**
     * ログエントリを保存
     */
    storeLogEntry(logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('devtools_logs') || '[]');
            logs.push(logEntry);

            // 最新1000件のみ保持
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }

            localStorage.setItem('devtools_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to store log entry:', error);
        }
    }

    /**
     * パフォーマンス問題を保存
     */
    storePerformanceIssue(issue) {
        try {
            const issues = JSON.parse(localStorage.getItem('devtools_performance_issues') || '[]');
            issues.push(issue);

            // 最新100件のみ保持
            if (issues.length > 100) {
                issues.splice(0, issues.length - 100);
            }

            localStorage.setItem('devtools_performance_issues', JSON.stringify(issues));
        } catch (error) {
            console.error('Failed to store performance issue:', error);
        }
    }

    /**
     * デバッグ情報を表示
     */
    showDebugInfo() {
        console.group('🔧 DevTools Debug Info');
        console.log('Initialized:', this.isInitialized);
        console.log('DevTools Open:', this.isDevToolsOpen);
        console.log('Performance Observer:', !!this.performanceObserver);
        console.log('Error Observer:', !!this.errorObserver);
        console.log('Memory Observer:', !!this.memoryObserver);
        console.groupEnd();
    }

    /**
     * パフォーマンス統計を表示
     */
    showPerformanceStats() {
        if (!('memory' in performance)) {
            return;
        }

        const memory = performance.memory;
        const memoryUsage = {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        };

        console.group('📊 Performance Statistics');
        console.log('Memory Usage:', `${memoryUsage.used}MB / ${memoryUsage.limit}MB`);
        console.log('Memory Percentage:', `${Math.round((memoryUsage.used / memoryUsage.limit) * 100)}%`);

        // パフォーマンスエントリを表示
        const entries = performance.getEntriesByType('navigation');
        if (entries.length > 0) {
            const entry = entries[0];
            console.log('Page Load Time:', `${entry.loadEventEnd - entry.navigationStart}ms`);
            console.log('DOM Content Loaded:', `${entry.domContentLoadedEventEnd - entry.navigationStart}ms`);
        }

        console.groupEnd();
    }

    /**
     * デバッグデータを取得
     */
    getDebugData() {
        return {
            isInitialized: this.isInitialized,
            isDevToolsOpen: this.isDevToolsOpen,
            logs: JSON.parse(localStorage.getItem('devtools_logs') || '[]'),
            performanceIssues: JSON.parse(localStorage.getItem('devtools_performance_issues') || '[]')
        };
    }

    /**
     * デバッグデータをクリア
     */
    clearDebugData() {
        localStorage.removeItem('devtools_logs');
        localStorage.removeItem('devtools_performance_issues');
        console.log('🗑️ Debug data cleared');
    }

    /**
     * パフォーマンスレポートを生成
     */
    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            navigation: performance.getEntriesByType('navigation'),
            resources: performance.getEntriesByType('resource')
        };

        console.log('📊 Performance Report:', report);
        return report;
    }

    /**
     * DevToolsを破棄
     */
    destroy() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }

        if (this.navigationObserver) {
            this.navigationObserver.disconnect();
            this.navigationObserver = null;
        }

        this.isInitialized = false;
        console.log('🗑️ DevTools destroyed');
    }
}

// シングルトンインスタンスをエクスポート
export const devTools = new DevTools();