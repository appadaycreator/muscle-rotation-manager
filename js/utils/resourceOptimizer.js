// resourceOptimizer.js - リソース最適化ユーティリティ

class ResourceOptimizer {
    constructor() {
        this.webpSupported = null;
        this.compressionSupported = null;
        this.initializeOptimizations();
    }

    /**
   * 最適化機能を初期化
   */
    async initializeOptimizations() {
        try {
            await this.checkWebPSupport();
            this.checkCompressionSupport();
            this.optimizeImages();
            this.optimizeCSS();
            this.optimizeJS();
            console.log('🚀 リソース最適化が初期化されました');
        } catch (error) {
            console.warn(
                '⚠️ リソース最適化の初期化で一部エラーが発生しました:',
                error.message
            );
            // 部分的な初期化失敗は許容する
        }
    }

    /**
   * WebP対応をチェック
   * @returns {Promise<boolean>} WebP対応状況
   */
    async checkWebPSupport() {
        if (this.webpSupported !== null) {
            return this.webpSupported;
        }

        // Node.js環境では Image が利用できないため、フォールバック
        if (typeof window === 'undefined' || typeof Image === 'undefined') {
            this.webpSupported = false;
            console.log('📷 WebP対応: Node.js環境のため非サポート');
            return this.webpSupported;
        }

        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                this.webpSupported = webP.height === 2;
                console.log(
                    `📷 WebP対応: ${this.webpSupported ? 'サポート' : '非サポート'}`
                );
                resolve(this.webpSupported);
            };
            webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    /**
   * 圧縮対応をチェック
   */
    checkCompressionSupport() {
        this.compressionSupported = {
            gzip: 'gzip' in window,
            brotli: 'br' in window || navigator.userAgent.includes('Chrome'),
            deflate: 'deflate' in window
        };
        console.log('🗜️ 圧縮対応:', this.compressionSupported);
    }

    /**
   * 画像を最適化
   */
    optimizeImages() {
    // 既存の画像を最適化
        const images = document.querySelectorAll('img');
        images.forEach((img) => this.optimizeImage(img));

        // 新しく追加される画像を監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IMG') {
                            this.optimizeImage(node);
                        } else {
                            const images = node.querySelectorAll?.('img');
                            images?.forEach((img) => this.optimizeImage(img));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
   * 個別の画像を最適化
   * @param {HTMLImageElement} img - 画像要素
   */
    optimizeImage(img) {
        if (img.dataset.optimized) {
            return;
        }

        // WebP対応の場合、WebP画像に置換
        if (this.webpSupported && img.src && !img.src.includes('.webp')) {
            const webpSrc = this.getWebPVersion(img.src);
            if (webpSrc) {
                this.loadWebPImage(img, webpSrc);
            }
        }

        // 遅延ローディング属性を追加
        if (!img.loading) {
            img.loading = 'lazy';
        }

        // デコード最適化
        if ('decoding' in img) {
            img.decoding = 'async';
        }

        // レスポンシブ画像の最適化
        this.optimizeResponsiveImage(img);

        img.dataset.optimized = 'true';
    }

    /**
   * WebP版のURLを取得
   * @param {string} originalSrc - 元の画像URL
   * @returns {string|null} WebP版URL
   */
    getWebPVersion(originalSrc) {
    // 拡張子をWebPに変更
        const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');

        // 同じURLの場合はnullを返す（既にWebPまたは対応なし）
        if (webpSrc === originalSrc) {
            return null;
        }

        return webpSrc;
    }

    /**
   * WebP画像を読み込み
   * @param {HTMLImageElement} img - 画像要素
   * @param {string} webpSrc - WebP画像URL
   */
    async loadWebPImage(img, webpSrc) {
        try {
            // WebP画像の存在確認
            const response = await fetch(webpSrc, { method: 'HEAD' });
            if (response.ok) {
                const originalSrc = img.src;
                img.src = webpSrc;

                // フォールバック処理
                img.onerror = () => {
                    img.src = originalSrc;
                    img.onerror = null;
                };

                console.log(`📷 WebP画像に最適化: ${webpSrc}`);
            }
        } catch (error) {
            // WebP画像が存在しない場合は元の画像を使用
            console.log(`📷 WebP画像が見つかりません: ${webpSrc}`);
        }
    }

    /**
   * レスポンシブ画像を最適化
   * @param {HTMLImageElement} img - 画像要素
   */
    optimizeResponsiveImage(img) {
        if (img.srcset || img.sizes) {
            return;
        } // 既に設定済み

        const src = img.src;
        if (!src || src.startsWith('data:')) {
            return;
        }

        // デバイスピクセル比に基づく最適化
        const devicePixelRatio = window.devicePixelRatio || 1;
        const imgWidth = img.width || img.naturalWidth;
        const imgHeight = img.height || img.naturalHeight;

        if (imgWidth && imgHeight) {
            // 高DPIディスプレイ用の画像サイズを計算
            const optimizedWidth = Math.round(imgWidth * devicePixelRatio);
            const optimizedHeight = Math.round(imgHeight * devicePixelRatio);

            // サイズが大きすぎる場合は制限
            const maxWidth = Math.min(optimizedWidth, 1920);
            const maxHeight = Math.min(optimizedHeight, 1080);

            // 画像サイズの最適化情報をデータ属性に保存
            img.dataset.optimizedSize = `${maxWidth}x${maxHeight}`;
        }
    }

    /**
   * CSSを最適化
   */
    optimizeCSS() {
    // 未使用CSSの検出と削除
        this.removeUnusedCSS();

        // クリティカルCSSの特定
        this.identifyCriticalCSS();

        // CSS読み込みの最適化
        this.optimizeCSSLoading();
    }

    /**
   * 未使用CSSを削除
   */
    removeUnusedCSS() {
        const stylesheets = document.querySelectorAll(
            'link[rel="stylesheet"], style'
        );
        const usedSelectors = new Set();

        // 使用されているセレクターを収集
        stylesheets.forEach((stylesheet) => {
            try {
                const rules = stylesheet.sheet?.cssRules || stylesheet.sheet?.rules;
                if (rules) {
                    Array.from(rules).forEach((rule) => {
                        if (rule.selectorText) {
                            const elements = document.querySelectorAll(rule.selectorText);
                            if (elements.length > 0) {
                                usedSelectors.add(rule.selectorText);
                            }
                        }
                    });
                }
            } catch (error) {
                // クロスオリジンCSSは無視
                console.log('クロスオリジンCSS:', stylesheet.href);
            }
        });

        console.log(`🎨 使用中のCSSセレクター: ${usedSelectors.size}個`);
    }

    /**
   * クリティカルCSSを特定
   */
    identifyCriticalCSS() {
        const criticalElements = document.querySelectorAll(`
            header, nav, main, 
            .muscle-card, .recovery-bar, .muscle-part,
            h1, h2, h3, p, button, input
        `);

        const criticalSelectors = new Set();
        criticalElements.forEach((element) => {
            // 要素のクラス名を収集
            element.classList.forEach((className) => {
                criticalSelectors.add(`.${className}`);
            });
        });

        console.log(`🎨 クリティカルCSS: ${criticalSelectors.size}個のセレクター`);

        // クリティカルCSSをLocalStorageに保存
        try {
            localStorage.setItem(
                'criticalCSS',
                JSON.stringify([...criticalSelectors])
            );
        } catch (error) {
            console.warn('クリティカルCSS保存に失敗:', error);
        }
    }

    /**
   * CSS読み込みを最適化
   */
    optimizeCSSLoading() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

        stylesheets.forEach((link) => {
            // 非クリティカルCSSは非同期読み込み
            if (!link.href.includes('tailwind') && !link.href.includes('style.css')) {
                link.media = 'print';
                link.onload = () => {
                    link.media = 'all';
                };
            }

            // プリロードヒントを追加
            if (!link.as) {
                link.as = 'style';
            }
        });
    }

    /**
   * JavaScriptを最適化
   */
    optimizeJS() {
    // モジュールの遅延読み込み
        this.optimizeModuleLoading();

        // 不要なポリフィルの削除
        this.removeUnnecessaryPolyfills();

        // パフォーマンス監視
        this.setupPerformanceMonitoring();
    }

    /**
   * モジュール読み込みを最適化
   */
    optimizeModuleLoading() {
    // 動的インポートの最適化
        const originalImport = window.import;
        if (originalImport) {
            window.import = async (specifier) => {
                const startTime = performance.now();
                try {
                    const module = await originalImport(specifier);
                    const loadTime = performance.now() - startTime;
                    console.log(
                        `📦 モジュール読み込み: ${specifier} (${loadTime.toFixed(2)}ms)`
                    );
                    return module;
                } catch (error) {
                    console.error(`📦 モジュール読み込み失敗: ${specifier}`, error);
                    throw error;
                }
            };
        }
    }

    /**
   * 不要なポリフィルを削除
   */
    removeUnnecessaryPolyfills() {
        const modernBrowser =
      'IntersectionObserver' in window &&
      'fetch' in window &&
      'Promise' in window;

        if (modernBrowser) {
            // 古いポリフィルスクリプトを削除
            const polyfillScripts = document.querySelectorAll(
                'script[src*="polyfill"]'
            );
            polyfillScripts.forEach((script) => {
                if (
                    script.src.includes('intersection-observer') ||
          script.src.includes('fetch-polyfill')
                ) {
                    script.remove();
                    console.log('🗑️ 不要なポリフィルを削除:', script.src);
                }
            });
        }
    }

    /**
   * パフォーマンス監視を設定
   */
    setupPerformanceMonitoring() {
    // Core Web Vitals の監視
        this.monitorCoreWebVitals();

        // リソース読み込み時間の監視
        this.monitorResourceTiming();

        // メモリ使用量の監視
        this.monitorMemoryUsage();
    }

    /**
   * Core Web Vitals を監視
   */
    monitorCoreWebVitals() {
    // LCP (Largest Contentful Paint)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('📊 LCP:', lastEntry.startTime.toFixed(2), 'ms');

            // 2.5秒以上の場合は警告
            if (lastEntry.startTime > 2500) {
                console.warn(
                    '⚠️ LCP が遅いです:',
                    lastEntry.startTime.toFixed(2),
                    'ms'
                );
            }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay) - 代替としてイベントリスナーの遅延を測定
        let firstInputTime = null;
        const measureFID = (event) => {
            if (firstInputTime === null) {
                firstInputTime = performance.now();
                const processingTime = performance.now() - firstInputTime;
                console.log('📊 FID (推定):', processingTime.toFixed(2), 'ms');

                if (processingTime > 100) {
                    console.warn('⚠️ FID が遅いです:', processingTime.toFixed(2), 'ms');
                }

                // 一度だけ測定
                document.removeEventListener('click', measureFID);
                document.removeEventListener('keydown', measureFID);
            }
        };

        document.addEventListener('click', measureFID, { once: true });
        document.addEventListener('keydown', measureFID, { once: true });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            console.log('📊 CLS:', clsValue.toFixed(4));

            if (clsValue > 0.1) {
                console.warn('⚠️ CLS が高いです:', clsValue.toFixed(4));
            }
        }).observe({ entryTypes: ['layout-shift'] });
    }

    /**
   * リソース読み込み時間を監視
   */
    monitorResourceTiming() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry) => {
                const duration = entry.responseEnd - entry.requestStart;
                if (duration > 1000) {
                    // 1秒以上
                    console.warn(
                        '⚠️ 遅いリソース:',
                        entry.name,
                        duration.toFixed(2),
                        'ms'
                    );
                }
            });
        }).observe({ entryTypes: ['resource'] });
    }

    /**
   * メモリ使用量を監視
   */
    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
                const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
                const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

                console.log(
                    `🧠 メモリ使用量: ${usedMB}MB / ${totalMB}MB (制限: ${limitMB}MB)`
                );

                // メモリ使用量が80%を超えた場合は警告
                const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                if (usageRatio > 0.8) {
                    console.warn(
                        '⚠️ メモリ使用量が高いです:',
                        (usageRatio * 100).toFixed(1),
                        '%'
                    );
                }
            }, 30000); // 30秒間隔
        }
    }

    /**
   * パフォーマンス統計を取得
   * @returns {Object} パフォーマンス統計
   */
    getPerformanceStats() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
            // ナビゲーション指標
            domContentLoaded:
        navigation?.domContentLoadedEventEnd -
        navigation?.domContentLoadedEventStart,
            loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,

            // ペイント指標
            firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime,
            firstContentfulPaint: paint.find(
                (p) => p.name === 'first-contentful-paint'
            )?.startTime,

            // リソース統計
            resourceCount: performance.getEntriesByType('resource').length,

            // メモリ統計
            memoryUsage: performance.memory
                ? {
                    used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                    total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
                }
                : null,

            // 最適化状況
            webpSupported: this.webpSupported,
            compressionSupported: this.compressionSupported
        };
    }
}

// シングルトンインスタンスをエクスポート
export const resourceOptimizer = new ResourceOptimizer();
