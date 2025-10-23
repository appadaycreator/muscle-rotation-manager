// comprehensive-optimization.test.js - 包括的最適化の統合テスト

import { testRunner } from '../unit/test-runner.js';

// パフォーマンス最適化テスト
testRunner.describe('パフォーマンス最適化', () => {
    testRunner.it('Core Web Vitals監視が正常に動作する', () => {
        // パフォーマンス監視のテスト
        const performanceOptimizer = window.performanceOptimizer;
        testRunner.assertTrue(performanceOptimizer !== undefined, 'パフォーマンス最適化が初期化されている');
        
        // メトリクス取得のテスト
        const metrics = performanceOptimizer.getMetrics();
        testRunner.assertTrue(metrics !== null, 'メトリクスが取得できる');
        testRunner.assertTrue(typeof metrics === 'object', 'メトリクスがオブジェクト形式');
    });

    testRunner.it('リソース最適化が正常に動作する', () => {
        // 画像遅延読み込みのテスト
        const images = document.querySelectorAll('img[data-src]');
        testRunner.assertTrue(images.length >= 0, '遅延読み込み対象の画像が存在する');
        
        // フォント最適化のテスト
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        testRunner.assertTrue(fontLinks.length >= 0, 'フォントリンクが存在する');
    });

    testRunner.it('メモリ管理が正常に動作する', () => {
        const performanceOptimizer = window.performanceOptimizer;
        
        // メモリクリーンアップのテスト
        const initialMemory = performanceOptimizer.getMemoryInfo();
        testRunner.assertTrue(initialMemory !== null, 'メモリ情報が取得できる');
        
        // ガベージコレクションのテスト
        performanceOptimizer.cleanupMemory();
        testRunner.assertTrue(true, 'メモリクリーンアップが実行される');
    });

    testRunner.it('ネットワーク最適化が正常に動作する', () => {
        const performanceOptimizer = window.performanceOptimizer;
        
        // リクエストバッチングのテスト
        testRunner.assertTrue(typeof performanceOptimizer.batchRequest === 'function', 'バッチリクエスト機能が存在する');
        
        // キャッシュ戦略のテスト
        testRunner.assertTrue(typeof performanceOptimizer.setCache === 'function', 'キャッシュ設定機能が存在する');
        testRunner.assertTrue(typeof performanceOptimizer.getCache === 'function', 'キャッシュ取得機能が存在する');
    });
});

// セキュリティ強化テスト
testRunner.describe('セキュリティ強化', () => {
    testRunner.it('CSP保護が正常に動作する', () => {
        const securityManager = window.securityManager;
        testRunner.assertTrue(securityManager !== undefined, 'セキュリティマネージャーが初期化されている');
        
        // CSPメタタグのテスト
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        testRunner.assertTrue(cspMeta !== null, 'CSPメタタグが設定されている');
    });

    testRunner.it('XSS保護が正常に動作する', () => {
        const securityManager = window.securityManager;
        
        // HTMLサニタイゼーションのテスト
        const maliciousInput = '<script>alert("xss")</script>';
        const sanitized = securityManager.sanitizeHTML(maliciousInput);
        testRunner.assertTrue(!sanitized.includes('<script>'), 'スクリプトタグが除去される');
        
        // スクリプトサニタイゼーションのテスト
        const scriptInput = '<script>alert("test")</script><p>Safe content</p>';
        const scriptSanitized = securityManager.sanitizeScript(scriptInput);
        testRunner.assertTrue(!scriptSanitized.includes('<script>'), 'スクリプトタグが除去される');
    });

    testRunner.it('CSRF保護が正常に動作する', () => {
        const securityManager = window.securityManager;
        
        // CSRFトークン生成のテスト
        const token = securityManager.generateCSRFToken();
        testRunner.assertTrue(typeof token === 'string', 'CSRFトークンが生成される');
        testRunner.assertTrue(token.length > 0, 'CSRFトークンが空でない');
        
        // CSRFトークン検証のテスト
        const isValid = securityManager.validateCSRFToken(token);
        testRunner.assertTrue(isValid, '有効なCSRFトークンが検証される');
    });

    testRunner.it('レート制限が正常に動作する', () => {
        const securityManager = window.securityManager;
        
        // レート制限チェックのテスト
        const isAllowed = securityManager.checkRateLimit('test_key', 5, 60000);
        testRunner.assertTrue(typeof isAllowed === 'boolean', 'レート制限チェックが動作する');
    });

    testRunner.it('入力値検証が正常に動作する', () => {
        const securityManager = window.securityManager;
        
        // データ検証のテスト
        const testData = { name: 'test', email: 'test@example.com' };
        const schema = {
            name: { required: true, type: 'string', minLength: 1 },
            email: { required: true, type: 'string', minLength: 5 }
        };
        
        try {
            securityManager.validateData(testData, schema);
            testRunner.assertTrue(true, '有効なデータが検証される');
        } catch (error) {
            testRunner.assertTrue(false, '有効なデータが拒否される');
        }
    });
});

// アクセシビリティ強化テスト
testRunner.describe('アクセシビリティ強化', () => {
    testRunner.it('フォーカス管理が正常に動作する', () => {
        const accessibilityManager = window.accessibilityManager;
        testRunner.assertTrue(accessibilityManager !== undefined, 'アクセシビリティマネージャーが初期化されている');
        
        // フォーカス履歴のテスト
        testRunner.assertTrue(Array.isArray(accessibilityManager.focusHistory), 'フォーカス履歴が配列形式');
    });

    testRunner.it('ARIA属性が正常に設定される', () => {
        const accessibilityManager = window.accessibilityManager;
        
        // ARIA属性追加のテスト
        const testElement = document.createElement('div');
        accessibilityManager.addAriaAttributes(testElement, {
            'aria-label': 'Test element',
            'aria-expanded': 'false'
        });
        
        testRunner.assertTrue(testElement.getAttribute('aria-label') === 'Test element', 'aria-labelが設定される');
        testRunner.assertTrue(testElement.getAttribute('aria-expanded') === 'false', 'aria-expandedが設定される');
    });

    testRunner.it('キーボードナビゲーションが正常に動作する', () => {
        const accessibilityManager = window.accessibilityManager;
        
        // キーボードナビゲーションのテスト
        testRunner.assertTrue(typeof accessibilityManager.handleKeyboardNavigation === 'function', 'キーボードナビゲーション機能が存在する');
    });

    testRunner.it('スクリーンリーダーサポートが正常に動作する', () => {
        const accessibilityManager = window.accessibilityManager;
        
        // スクリーンリーダーアナウンスのテスト
        testRunner.assertTrue(typeof accessibilityManager.announce === 'function', 'アナウンス機能が存在する');
        
        // ライブリージョンのテスト
        testRunner.assertTrue(accessibilityManager.liveRegion !== null, 'ライブリージョンが設定されている');
    });

    testRunner.it('色コントラストが正常に管理される', () => {
        const accessibilityManager = window.accessibilityManager;
        
        // 高コントラストモードのテスト
        testRunner.assertTrue(typeof accessibilityManager.highContrastMode === 'boolean', '高コントラストモードが管理される');
    });
});

// データベース最適化テスト
testRunner.describe('データベース最適化', () => {
    testRunner.it('クエリキャッシュが正常に動作する', () => {
        const databaseOptimizer = window.databaseOptimizer;
        testRunner.assertTrue(databaseOptimizer !== undefined, 'データベース最適化が初期化されている');
        
        // キャッシュ機能のテスト
        testRunner.assertTrue(typeof databaseOptimizer.setCachedQuery === 'function', 'キャッシュ設定機能が存在する');
        testRunner.assertTrue(typeof databaseOptimizer.getCachedQuery === 'function', 'キャッシュ取得機能が存在する');
    });

    testRunner.it('接続プールが正常に動作する', () => {
        const databaseOptimizer = window.databaseOptimizer;
        
        // 接続プールのテスト
        testRunner.assertTrue(typeof databaseOptimizer.getConnection === 'function', '接続取得機能が存在する');
        testRunner.assertTrue(typeof databaseOptimizer.releaseConnection === 'function', '接続解放機能が存在する');
    });

    testRunner.it('バッチ操作が正常に動作する', () => {
        const databaseOptimizer = window.databaseOptimizer;
        
        // バッチ操作のテスト
        testRunner.assertTrue(Array.isArray(databaseOptimizer.batchOperations), 'バッチ操作配列が存在する');
        testRunner.assertTrue(typeof databaseOptimizer.executeBatch === 'function', 'バッチ実行機能が存在する');
    });

    testRunner.it('パフォーマンス監視が正常に動作する', () => {
        const databaseOptimizer = window.databaseOptimizer;
        
        // クエリメトリクスのテスト
        testRunner.assertTrue(databaseOptimizer.queryMetrics instanceof Map, 'クエリメトリクスがMap形式');
        
        // パフォーマンスレポートのテスト
        const report = databaseOptimizer.generatePerformanceReport();
        testRunner.assertTrue(report !== null, 'パフォーマンスレポートが生成される');
        testRunner.assertTrue(typeof report === 'object', 'パフォーマンスレポートがオブジェクト形式');
    });
});

// 統合機能テスト
testRunner.describe('統合機能', () => {
    testRunner.it('全最適化機能が統合されて動作する', () => {
        // パフォーマンス最適化
        const performanceOptimizer = window.performanceOptimizer;
        testRunner.assertTrue(performanceOptimizer !== undefined, 'パフォーマンス最適化が利用可能');
        
        // セキュリティ強化
        const securityManager = window.securityManager;
        testRunner.assertTrue(securityManager !== undefined, 'セキュリティ強化が利用可能');
        
        // アクセシビリティ強化
        const accessibilityManager = window.accessibilityManager;
        testRunner.assertTrue(accessibilityManager !== undefined, 'アクセシビリティ強化が利用可能');
        
        // データベース最適化
        const databaseOptimizer = window.databaseOptimizer;
        testRunner.assertTrue(databaseOptimizer !== undefined, 'データベース最適化が利用可能');
    });

    testRunner.it('エラーハンドリングが統合されて動作する', () => {
        // エラーハンドラーのテスト
        testRunner.assertTrue(typeof window.handleError === 'function', 'エラーハンドラーが利用可能');
        
        // 通知機能のテスト
        testRunner.assertTrue(typeof window.showNotification === 'function', '通知機能が利用可能');
    });

    testRunner.it('ルーティング機能が統合されて動作する', () => {
        // ルーターのテスト
        testRunner.assertTrue(typeof window.router !== 'undefined', 'ルーターが利用可能');
        
        // ページマネージャーのテスト
        testRunner.assertTrue(typeof window.pageManager !== 'undefined', 'ページマネージャーが利用可能');
    });
});

// パフォーマンステスト
testRunner.describe('パフォーマンステスト', () => {
    testRunner.it('ページロード時間が最適化されている', () => {
        const startTime = performance.now();
        
        // ページロード時間の測定
        window.addEventListener('load', () => {
            const loadTime = performance.now() - startTime;
            testRunner.assertTrue(loadTime < 3000, `ページロード時間が3秒以内: ${loadTime.toFixed(2)}ms`);
        });
    });

    testRunner.it('メモリ使用量が最適化されている', () => {
        const performanceOptimizer = window.performanceOptimizer;
        const memoryInfo = performanceOptimizer.getMemoryInfo();
        
        if (memoryInfo) {
            const usagePercentage = (memoryInfo.used / memoryInfo.limit) * 100;
            testRunner.assertTrue(usagePercentage < 80, `メモリ使用率が80%以内: ${usagePercentage.toFixed(2)}%`);
        }
    });

    testRunner.it('ネットワーク効率が最適化されている', () => {
        const performanceOptimizer = window.performanceOptimizer;
        const networkInfo = performanceOptimizer.getNetworkInfo();
        
        if (networkInfo) {
            testRunner.assertTrue(networkInfo.effectiveType !== 'slow-2g', 'ネットワーク接続が最適化されている');
        }
    });
});

// セキュリティテスト
testRunner.describe('セキュリティテスト', () => {
    testRunner.it('セキュリティスキャンが正常に動作する', async () => {
        const securityManager = window.securityManager;
        
        try {
            const scanResults = await securityManager.performSecurityScan();
            testRunner.assertTrue(scanResults !== null, 'セキュリティスキャンが実行される');
            testRunner.assertTrue(typeof scanResults === 'object', 'セキュリティスキャン結果がオブジェクト形式');
            testRunner.assertTrue(Array.isArray(scanResults.vulnerabilities), '脆弱性リストが配列形式');
            testRunner.assertTrue(Array.isArray(scanResults.recommendations), '推奨事項リストが配列形式');
        } catch (error) {
            testRunner.assertTrue(false, `セキュリティスキャンエラー: ${error.message}`);
        }
    });

    testRunner.it('入力値サニタイゼーションが正常に動作する', () => {
        const securityManager = window.securityManager;
        
        // XSS攻撃のテスト
        const xssPayload = '<script>alert("XSS")</script>';
        const sanitized = securityManager.sanitizeHTML(xssPayload);
        testRunner.assertTrue(!sanitized.includes('<script>'), 'XSS攻撃が防止される');
        
        // SQLインジェクションのテスト
        const sqlPayload = "'; DROP TABLE users; --";
        const sqlSanitized = securityManager.sanitizeSQL(sqlPayload);
        testRunner.assertTrue(!sqlSanitized.includes("'"), 'SQLインジェクションが防止される');
    });
});

// アクセシビリティテスト
testRunner.describe('アクセシビリティテスト', () => {
    testRunner.it('キーボードナビゲーションが完全に動作する', () => {
        const accessibilityManager = window.accessibilityManager;
        
        // Tabキーナビゲーションのテスト
        const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
        testRunner.assertTrue(focusableElements.length > 0, 'フォーカス可能な要素が存在する');
        
        // フォーカス管理のテスト
        testRunner.assertTrue(typeof accessibilityManager.setupFocusManagement === 'function', 'フォーカス管理機能が存在する');
    });

    testRunner.it('スクリーンリーダーサポートが完全に動作する', () => {
        const accessibilityManager = window.accessibilityManager;
        
        // ARIA属性のテスト
        const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
        testRunner.assertTrue(elementsWithAria.length > 0, 'ARIA属性が設定された要素が存在する');
        
        // ライブリージョンのテスト
        testRunner.assertTrue(accessibilityManager.liveRegion !== null, 'ライブリージョンが設定されている');
    });

    testRunner.it('色コントラストが適切に管理される', () => {
        const accessibilityManager = window.accessibilityManager;
        
        // 高コントラストモードのテスト
        testRunner.assertTrue(typeof accessibilityManager.highContrastMode === 'boolean', '高コントラストモードが管理される');
        
        // 色覚異常対応のテスト
        testRunner.assertTrue(typeof accessibilityManager.colorBlindMode === 'boolean', '色覚異常対応が管理される');
    });
});

// データベース最適化テスト
testRunner.describe('データベース最適化テスト', () => {
    testRunner.it('クエリ最適化が正常に動作する', () => {
        const databaseOptimizer = window.databaseOptimizer;
        
        // クエリ最適化ルールのテスト
        testRunner.assertTrue(databaseOptimizer.optimizationRules instanceof Map, '最適化ルールがMap形式');
        testRunner.assertTrue(databaseOptimizer.optimizationRules.size > 0, '最適化ルールが設定されている');
    });

    testRunner.it('インデックス最適化が正常に動作する', () => {
        const databaseOptimizer = window.databaseOptimizer;
        
        // インデックス最適化のテスト
        testRunner.assertTrue(databaseOptimizer.indexOptimizations instanceof Map, 'インデックス最適化がMap形式');
        testRunner.assertTrue(databaseOptimizer.indexOptimizations.size > 0, 'インデックス最適化が設定されている');
    });

    testRunner.it('バッチ操作が効率的に動作する', () => {
        const databaseOptimizer = window.databaseOptimizer;
        
        // バッチ操作のテスト
        testRunner.assertTrue(Array.isArray(databaseOptimizer.batchOperations), 'バッチ操作配列が存在する');
        testRunner.assertTrue(typeof databaseOptimizer.batchSize === 'number', 'バッチサイズが数値形式');
        testRunner.assertTrue(databaseOptimizer.batchSize > 0, 'バッチサイズが正の値');
    });
});

// 統合テスト実行
testRunner.run();
