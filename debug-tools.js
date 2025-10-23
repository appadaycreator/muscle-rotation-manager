// debug-tools.js - デバッグツール（Chrome DevTools MCPの代替）

class DebugTools {
    constructor() {
        this.logs = [];
        this.errors = [];
        this.warnings = [];
        this.performance = [];
        this.network = [];
    }

    // ログ収集
    collectLogs() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };

        // コンソールログをインターセプト
        console.log = (...args) => {
            this.logs.push({
                type: 'log',
                message: args.join(' '),
                timestamp: new Date().toISOString()
            });
            originalConsole.log(...args);
        };

        console.error = (...args) => {
            this.errors.push({
                type: 'error',
                message: args.join(' '),
                timestamp: new Date().toISOString()
            });
            originalConsole.error(...args);
        };

        console.warn = (...args) => {
            this.warnings.push({
                type: 'warn',
                message: args.join(' '),
                timestamp: new Date().toISOString()
            });
            originalConsole.warn(...args);
        };

        console.info = (...args) => {
            this.logs.push({
                type: 'info',
                message: args.join(' '),
                timestamp: new Date().toISOString()
            });
            originalConsole.info(...args);
        };
    }

    // パフォーマンス監視
    monitorPerformance() {
        if ('performance' in window) {
            // ページ読み込み時間
            window.addEventListener('load', () => {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                this.performance.push({
                    metric: 'pageLoadTime',
                    value: loadTime,
                    timestamp: new Date().toISOString()
                });
            });

            // リソース読み込み時間
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.performance.push({
                        metric: 'resourceLoad',
                        name: entry.name,
                        duration: entry.duration,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            observer.observe({ entryTypes: ['resource'] });

            // 長時間タスクの監視
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.performance.push({
                        metric: 'longTask',
                        duration: entry.duration,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
    }

    // ネットワーク監視
    monitorNetwork() {
        if ('fetch' in window) {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const startTime = performance.now();
                try {
                    const response = await originalFetch(...args);
                    const endTime = performance.now();
                    
                    this.network.push({
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        status: response.status,
                        duration: endTime - startTime,
                        timestamp: new Date().toISOString()
                    });
                    
                    return response;
                } catch (error) {
                    const endTime = performance.now();
                    
                    this.network.push({
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        status: 'error',
                        duration: endTime - startTime,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    throw error;
                }
            };
        }
    }

    // DOM変更監視
    monitorDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                this.logs.push({
                    type: 'dom',
                    message: `DOM changed: ${mutation.type}`,
                    target: mutation.target.tagName,
                    timestamp: new Date().toISOString()
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    // エラー監視
    monitorErrors() {
        window.addEventListener('error', (event) => {
            this.errors.push({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: new Date().toISOString()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.errors.push({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                timestamp: new Date().toISOString()
            });
        });
    }

    // デバッグ情報を取得
    getDebugInfo() {
        return {
            logs: this.logs,
            errors: this.errors,
            warnings: this.warnings,
            performance: this.performance,
            network: this.network,
            summary: {
                totalLogs: this.logs.length,
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                performanceMetrics: this.performance.length,
                networkRequests: this.network.length
            }
        };
    }

    // デバッグ情報を表示
    displayDebugInfo() {
        const info = this.getDebugInfo();
        
        console.group('🔍 デバッグ情報');
        console.log('📊 サマリー:', info.summary);
        
        if (info.errors.length > 0) {
            console.group('❌ エラー');
            info.errors.forEach(error => console.error(error));
            console.groupEnd();
        }
        
        if (info.warnings.length > 0) {
            console.group('⚠️ 警告');
            info.warnings.forEach(warning => console.warn(warning));
            console.groupEnd();
        }
        
        if (info.performance.length > 0) {
            console.group('⚡ パフォーマンス');
            info.performance.forEach(perf => console.log(perf));
            console.groupEnd();
        }
        
        if (info.network.length > 0) {
            console.group('🌐 ネットワーク');
            info.network.forEach(req => console.log(req));
            console.groupEnd();
        }
        
        console.groupEnd();
    }

    // デバッグ情報をファイルに保存
    saveDebugInfo() {
        const info = this.getDebugInfo();
        const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-info-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 初期化
    initialize() {
        console.log('🔧 デバッグツールを初期化中...');
        
        this.collectLogs();
        this.monitorPerformance();
        this.monitorNetwork();
        this.monitorDOMChanges();
        this.monitorErrors();
        
        // デバッグ情報を定期的に表示
        setInterval(() => {
            this.displayDebugInfo();
        }, 30000); // 30秒ごと
        
        console.log('✅ デバッグツール初期化完了');
    }
}

// グローバルデバッグツールインスタンス
const debugTools = new DebugTools();

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    debugTools.initialize();
});

// グローバルアクセス用
window.debugTools = debugTools;

export default debugTools;
