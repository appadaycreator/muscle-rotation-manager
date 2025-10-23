// js/utils/DevTools.js - Chrome DevTools統合

/**
 * Chrome DevTools統合ユーティリティ
 * デバッグとパフォーマンス監視を提供
 */
export class DevTools {
    constructor() {
        this.isDevToolsOpen = false;
        this.performanceObserver = null;
        this.memoryObserver = null;
        this.initialize();
    }

    /**
   * DevToolsを初期化
   */
    initialize() {
        if (typeof window === 'undefined') {return;}

        // DevToolsの開閉を検出
        this.detectDevToolsOpen();

        // パフォーマンス監視を開始
        this.startPerformanceMonitoring();

        // メモリ使用量監視を開始
        this.startMemoryMonitoring();

        // コンソールログの拡張
        this.enhanceConsoleLogging();

        console.log('🔧 DevTools integration initialized');
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
                    devtools.orientation = window.outerHeight - window.innerHeight > threshold ? 'horizontal' : 'vertical';
                    this.onDevToolsOpen();
                }
            } else {
                if (devtools.open) {
                    devtools.open = false;
                    devtools.orientation = null;
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

        // デバッグ情報を表示
        this.showDebugInfo();

        // パフォーマンス統計を表示
        this.showPerformanceStats();
    }

    /**
   * DevToolsが閉じた時の処理
   */
    onDevToolsClose() {
        this.isDevToolsOpen = false;
        console.log('🔧 DevTools closed');
    }

    /**
   * パフォーマンス監視を開始
   */
    startPerformanceMonitoring() {
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
            console.error('Failed to start performance monitoring:', error);
        }
    }

    /**
   * メモリ使用量監視を開始
   */
    startMemoryMonitoring() {
        if (!('memory' in performance)) {
            console.warn('Memory API not supported');
            return;
        }

        setInterval(() => {
            const memory = performance.memory;
            const memoryUsage = {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
            };

            // メモリ使用量が80%を超えた場合に警告
            if (memoryUsage.used / memoryUsage.limit > 0.8) {
                console.warn(`⚠️ High memory usage: ${memoryUsage.used}MB / ${memoryUsage.limit}MB`);
                this.recordPerformanceIssue('high_memory', memoryUsage.used);
            }
        }, 10000); // 10秒ごとにチェック
    }

    /**
   * コンソールログを拡張
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
            this.recordError(args);
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            this.logWithTimestamp('warn', args);
            this.recordWarning(args);
            originalWarn.apply(console, args);
        };
    }

    /**
   * タイムスタンプ付きログ
   */
    logWithTimestamp(level, args) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message: args.join(' '),
            stack: new Error().stack
        };

        this.storeLogEntry(logEntry);
    }

    /**
   * エラーを記録
   */
    recordError(args) {
        const error = {
            type: 'error',
            message: args.join(' '),
            timestamp: new Date().toISOString(),
            stack: new Error().stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.storeError(error);
    }

    /**
   * 警告を記録
   */
    recordWarning(args) {
        const warning = {
            type: 'warning',
            message: args.join(' '),
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        };

        this.storeWarning(warning);
    }

    /**
   * パフォーマンス問題を記録
   */
    recordPerformanceIssue(type, value) {
        const issue = {
            type,
            value,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        this.storePerformanceIssue(issue);
    }

    /**
   * ナビゲーションタイミングを分析
   */
    analyzeNavigationTiming(entry) {
        const timing = {
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            dom: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            load: entry.loadEventEnd - entry.loadEventStart,
            total: entry.loadEventEnd - entry.navigationStart
        };

        // パフォーマンス閾値をチェック
        if (timing.total > 3000) {
            console.warn(`⚠️ Slow page load: ${timing.total.toFixed(2)}ms`);
            this.recordPerformanceIssue('slow_page_load', timing.total);
        }

        if (timing.dom > 1000) {
            console.warn(`⚠️ Slow DOM processing: ${timing.dom.toFixed(2)}ms`);
            this.recordPerformanceIssue('slow_dom', timing.dom);
        }
    }

    /**
   * デバッグ情報を表示
   */
    showDebugInfo() {
        console.group('🔧 Debug Information');
        console.log('User Agent:', navigator.userAgent);
        console.log('URL:', window.location.href);
        console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
        console.log('Screen:', `${window.screen.width}x${window.screen.height}`);
        console.log('Device Pixel Ratio:', window.devicePixelRatio);
        console.log('Online:', navigator.onLine);
        console.log('Language:', navigator.language);
        console.log('Platform:', navigator.platform);
        console.groupEnd();
    }

    /**
   * パフォーマンス統計を表示
   */
    showPerformanceStats() {
        if (!('memory' in performance)) {return;}

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
   * エラーを保存
   */
    storeError(error) {
        try {
            const errors = JSON.parse(localStorage.getItem('devtools_errors') || '[]');
            errors.push(error);

            // 最新100件のみ保持
            if (errors.length > 100) {
                errors.splice(0, errors.length - 100);
            }

            localStorage.setItem('devtools_errors', JSON.stringify(errors));
        } catch (err) {
            console.error('Failed to store error:', err);
        }
    }

    /**
   * 警告を保存
   */
    storeWarning(warning) {
        try {
            const warnings = JSON.parse(localStorage.getItem('devtools_warnings') || '[]');
            warnings.push(warning);

            // 最新100件のみ保持
            if (warnings.length > 100) {
                warnings.splice(0, warnings.length - 100);
            }

            localStorage.setItem('devtools_warnings', JSON.stringify(warnings));
        } catch (error) {
            console.error('Failed to store warning:', error);
        }
    }

    /**
   * パフォーマンス問題を保存
   */
    storePerformanceIssue(issue) {
        try {
            const issues = JSON.parse(localStorage.getItem('devtools_performance_issues') || '[]');
            issues.push(issue);

            // 最新50件のみ保持
            if (issues.length > 50) {
                issues.splice(0, issues.length - 50);
            }

            localStorage.setItem('devtools_performance_issues', JSON.stringify(issues));
        } catch (error) {
            console.error('Failed to store performance issue:', error);
        }
    }

    /**
   * デバッグデータを取得
   */
    getDebugData() {
        return {
            logs: JSON.parse(localStorage.getItem('devtools_logs') || '[]'),
            errors: JSON.parse(localStorage.getItem('devtools_errors') || '[]'),
            warnings: JSON.parse(localStorage.getItem('devtools_warnings') || '[]'),
            performanceIssues: JSON.parse(localStorage.getItem('devtools_performance_issues') || '[]'),
            isDevToolsOpen: this.isDevToolsOpen
        };
    }

    /**
   * デバッグデータをクリア
   */
    clearDebugData() {
        localStorage.removeItem('devtools_logs');
        localStorage.removeItem('devtools_errors');
        localStorage.removeItem('devtools_warnings');
        localStorage.removeItem('devtools_performance_issues');
        console.log('🧹 Debug data cleared');
    }

    /**
   * パフォーマンスレポートを生成
   */
    generatePerformanceReport() {
        const data = this.getDebugData();
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            summary: {
                totalLogs: data.logs.length,
                totalErrors: data.errors.length,
                totalWarnings: data.warnings.length,
                totalPerformanceIssues: data.performanceIssues.length
            },
            errors: data.errors,
            warnings: data.warnings,
            performanceIssues: data.performanceIssues
        };

        return report;
    }

    /**
   * DevToolsを破棄
   */
    destroy() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }

        if (this.navigationObserver) {
            this.navigationObserver.disconnect();
        }

        console.log('🗑️ DevTools destroyed');
    }
}

// シングルトンインスタンスをエクスポート
export const devTools = new DevTools();
