// performanceOptimizer.js - パフォーマンス最適化ユーティリティ

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      pageLoadTimes: new Map(),
      resourceLoadTimes: new Map(),
      userInteractions: new Map(),
    };
    this.observers = new Map();
    this.debounceTimers = new Map();
    this.init();
  }

  /**
   * パフォーマンス最適化を初期化
   */
  init() {
    this.setupPerformanceMonitoring();
    this.setupResourceOptimization();
    this.setupMemoryManagement();
    this.setupNetworkOptimization();
  }

  /**
   * パフォーマンス最適化を初期化（外部インターフェース）
   */
  initialize() {
    return this.init();
  }

  /**
   * パフォーマンス監視を設定
   */
  setupPerformanceMonitoring() {
    // Core Web Vitals監視
    if ('PerformanceObserver' in window) {
      this.observeCoreWebVitals();
      this.observeResourceTiming();
      this.observeNavigationTiming();
    }

    // カスタムメトリクス監視
    this.observeCustomMetrics();
  }

  /**
   * Core Web Vitals監視
   */
  observeCoreWebVitals() {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.pageLoadTimes.set('LCP', lastEntry.startTime);
      console.log('📊 LCP:', lastEntry.startTime.toFixed(2), 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.userInteractions.set(
          'FID',
          entry.processingStart - entry.startTime
        );
        console.log(
          '📊 FID:',
          (entry.processingStart - entry.startTime).toFixed(2),
          'ms'
        );
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.pageLoadTimes.set('CLS', clsValue);
      console.log('📊 CLS:', clsValue.toFixed(4));
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * リソースタイミング監視
   */
  observeResourceTiming() {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const loadTime = entry.responseEnd - entry.startTime;
        this.metrics.resourceLoadTimes.set(entry.name, loadTime);

        // 遅いリソースを警告
        if (loadTime > 1000) {
          console.warn(
            '⚠️ 遅いリソース:',
            entry.name,
            loadTime.toFixed(2),
            'ms'
          );
        }
      });
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  /**
   * ナビゲーションタイミング監視
   */
  observeNavigationTiming() {
    const navObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const loadTime = entry.loadEventEnd - entry.navigationStart;
        this.metrics.pageLoadTimes.set('PageLoad', loadTime);
        console.log('📊 ページロード時間:', loadTime.toFixed(2), 'ms');
      });
    });
    navObserver.observe({ entryTypes: ['navigation'] });
  }

  /**
   * カスタムメトリクス監視
   */
  observeCustomMetrics() {
    // メモリ使用量監視
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.userInteractions.set('Memory', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }, 5000);
    }

    // フレームレート監視
    this.monitorFrameRate();
  }

  /**
   * フレームレート監視
   */
  monitorFrameRate() {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = (currentTime) => {
      frameCount++;
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.userInteractions.set('FPS', fps);
        frameCount = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }

  /**
   * リソース最適化を設定
   */
  setupResourceOptimization() {
    // 画像遅延読み込み
    this.setupImageLazyLoading();

    // フォント最適化
    this.setupFontOptimization();

    // CSS最適化
    this.setupCSSOptimization();

    // JavaScript最適化
    this.setupJavaScriptOptimization();
  }

  /**
   * 画像遅延読み込み
   */
  setupImageLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * フォント最適化
   */
  setupFontOptimization() {
    // フォントプリロード
    const fontLinks = document.querySelectorAll(
      'link[href*="fonts.googleapis.com"]'
    );
    fontLinks.forEach((link) => {
      link.rel = 'preload';
      link.as = 'style';
      link.onload = () => {
        link.rel = 'stylesheet';
      };
    });

    // フォント表示最適化
    const style = document.createElement('style');
    style.textContent = `
            @font-face {
                font-family: 'Noto Sans JP';
                font-display: swap;
            }
            @font-face {
                font-family: 'Inter';
                font-display: swap;
            }
        `;
    document.head.appendChild(style);
  }

  /**
   * CSS最適化
   */
  setupCSSOptimization() {
    // クリティカルCSSのインライン化
    const criticalCSS = `
            .muscle-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .btn-primary { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 4px; }
            .nav-item { padding: 12px; border-radius: 8px; transition: background-color 0.2s; }
        `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  /**
   * JavaScript最適化
   */
  setupJavaScriptOptimization() {
    // デバウンス関数
    this.debounce = (func, wait) => {
      return (...args) => {
        const key = func.name || 'anonymous';
        clearTimeout(this.debounceTimers.get(key));
        this.debounceTimers.set(
          key,
          setTimeout(() => func.apply(this, args), wait)
        );
      };
    };

    // スロットル関数
    this.throttle = (func, limit) => {
      let inThrottle;
      return (...args) => {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    };
  }

  /**
   * メモリ管理を設定
   */
  setupMemoryManagement() {
    // メモリリーク防止
    this.setupMemoryLeakPrevention();

    // ガベージコレクション最適化
    this.setupGarbageCollectionOptimization();

    // イベントリスナー管理
    this.setupEventListenerManagement();
  }

  /**
   * メモリリーク防止
   */
  setupMemoryLeakPrevention() {
    // 定期的なメモリクリーンアップ
    setInterval(() => {
      this.cleanupMemory();
    }, 30000); // 30秒ごと

    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', () => {
      this.cleanupAllResources();
    });
  }

  /**
   * メモリクリーンアップ
   */
  cleanupMemory() {
    // 未使用のオブザーバーを削除
    this.observers.forEach((observer) => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // デバウンスタイマーをクリア
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // ガベージコレクションを強制実行（可能な場合）
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }

  /**
   * 全リソースクリーンアップ
   */
  cleanupAllResources() {
    this.cleanupMemory();

    // イベントリスナーを削除
    if (this.cleanupEventListeners) {
      this.cleanupEventListeners();
    }

    // その他のイベントリスナーを削除
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.handleClick);
      document.removeEventListener('scroll', this.handleScroll);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  /**
   * ガベージコレクション最適化
   */
  setupGarbageCollectionOptimization() {
    // 大きなオブジェクトの適切な管理
    this.setupObjectPooling();

    // 循環参照の防止
    this.setupCircularReferencePrevention();
  }

  /**
   * オブジェクトプーリング
   */
  setupObjectPooling() {
    this.objectPools = new Map();

    this.getFromPool = (type, createFn) => {
      if (!this.objectPools.has(type)) {
        this.objectPools.set(type, []);
      }
      const pool = this.objectPools.get(type);
      return pool.length > 0 ? pool.pop() : createFn();
    };

    this.returnToPool = (type, obj) => {
      if (this.objectPools.has(type)) {
        this.objectPools.get(type).push(obj);
      }
    };
  }

  /**
   * 循環参照防止
   */
  setupCircularReferencePrevention() {
    // 弱参照の使用
    this.weakRefs = new WeakMap();

    // 適切なイベントリスナー削除
    this.setupProperEventListenerCleanup();
  }

  /**
   * 適切なイベントリスナー削除設定
   */
  setupProperEventListenerCleanup() {
    // イベントリスナーの適切な削除を保証
    this.cleanupEventListeners = () => {
      if (this.eventListeners) {
        for (const [, listeners] of this.eventListeners) {
          listeners.forEach(({ element, event, handler }) => {
            if (element && typeof element.removeEventListener === 'function') {
              element.removeEventListener(event, handler);
            }
          });
        }
        this.eventListeners.clear();
      }
    };

    // ページ離脱時のクリーンアップ
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.cleanupEventListeners);

      // 定期的なクリーンアップ
      setInterval(() => {
        this.cleanupEventListeners();
      }, 60000); // 1分ごと
    }
  }

  /**
   * イベントリスナー管理
   */
  setupEventListenerManagement() {
    this.eventListeners = new Map();

    this.addEventListener = (element, event, handler, options) => {
      const key = `${element.constructor.name}_${event}`;
      if (!this.eventListeners.has(key)) {
        this.eventListeners.set(key, []);
      }
      this.eventListeners.get(key).push({ element, event, handler, options });
      element.addEventListener(event, handler, options);
    };

    this.removeEventListener = (element, event, handler) => {
      const key = `${element.constructor.name}_${event}`;
      if (this.eventListeners.has(key)) {
        const listeners = this.eventListeners.get(key);
        const index = listeners.findIndex(
          (l) => l.element === element && l.handler === handler
        );
        if (index > -1) {
          listeners.splice(index, 1);
          element.removeEventListener(event, handler);
        }
      }
    };
  }

  /**
   * ネットワーク最適化を設定
   */
  setupNetworkOptimization() {
    // リクエストバッチング
    this.setupRequestBatching();

    // キャッシュ戦略
    this.setupCacheStrategy();

    // オフライン対応
    this.setupOfflineSupport();
  }

  /**
   * リクエストバッチング
   */
  setupRequestBatching() {
    this.requestQueue = [];
    this.batchTimeout = null;

    this.batchRequest = (request) => {
      this.requestQueue.push(request);

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.processBatchRequests();
      }, 100); // 100ms後にバッチ処理
    };
  }

  /**
   * バッチリクエスト処理
   */
  processBatchRequests() {
    if (this.requestQueue.length === 0) {
      return;
    }

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    // バッチリクエストを実行
    this.executeBatchRequests(requests);
  }

  /**
   * バッチリクエスト実行
   */
  async executeBatchRequests(requests) {
    try {
      const promises = requests.map((request) => this.executeRequest(request));
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('バッチリクエストエラー:', error);
    }
  }

  /**
   * 個別リクエスト実行
   */
  async executeRequest(request) {
    // リクエスト実行ロジック
    return fetch(request.url, request.options);
  }

  /**
   * キャッシュ戦略設定
   */
  setupCacheStrategy() {
    this.cache = new Map();
    this.cacheExpiry = new Map();

    this.setCache = (key, value, ttl = 300000) => {
      // 5分デフォルト
      this.cache.set(key, value);
      this.cacheExpiry.set(key, Date.now() + ttl);
    };

    this.getCache = (key) => {
      if (this.cacheExpiry.has(key) && Date.now() > this.cacheExpiry.get(key)) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
        return null;
      }
      return this.cache.get(key);
    };
  }

  /**
   * オフライン対応設定
   */
  setupOfflineSupport() {
    // Service Worker登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker登録成功:', registration);
        })
        .catch((error) => {
          console.error('Service Worker登録失敗:', error);
        });
    }

    // オフライン検出
    this.setupOfflineDetection();
  }

  /**
   * オフライン検出
   */
  setupOfflineDetection() {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      document.body.classList.toggle('offline', !isOnline);

      if (isOnline) {
        this.syncOfflineData();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  /**
   * オフラインデータ同期
   */
  async syncOfflineData() {
    try {
      const offlineData = JSON.parse(
        localStorage.getItem('offlineData') || '[]'
      );
      if (offlineData.length > 0) {
        console.log('オフラインデータを同期中...', offlineData.length, '件');
        // 同期ロジックを実装
        localStorage.removeItem('offlineData');
      }
    } catch (error) {
      console.error('オフラインデータ同期エラー:', error);
    }
  }

  /**
   * パフォーマンスメトリクス取得
   */
  getMetrics() {
    return {
      pageLoad: this.metrics.pageLoadTimes,
      resources: this.metrics.resourceLoadTimes,
      interactions: this.metrics.userInteractions,
      memory: this.getMemoryInfo(),
      network: this.getNetworkInfo(),
    };
  }

  /**
   * メモリ情報取得
   */
  getMemoryInfo() {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`,
      };
    }
    return null;
  }

  /**
   * ネットワーク情報取得
   */
  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  }

  /**
   * パフォーマンスレポート生成
   */
  generatePerformanceReport() {
    const metrics = this.getMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metrics,
      recommendations: this.generateRecommendations(metrics),
    };

    return report;
  }

  /**
   * 推奨事項生成
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    // LCP推奨事項
    const lcp = metrics.pageLoad.get('LCP');
    if (lcp && lcp > 2500) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message:
          'LCPが2.5秒を超えています。画像最適化やクリティカルCSSの改善を検討してください。',
      });
    }

    // FID推奨事項
    const fid = metrics.interactions.get('FID');
    if (fid && fid > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message:
          'FIDが100msを超えています。JavaScriptの最適化を検討してください。',
      });
    }

    // メモリ推奨事項
    const memory = metrics.memory;
    if (memory && memory.usage > 80) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message:
          'メモリ使用率が80%を超えています。メモリリークの確認を推奨します。',
      });
    }

    return recommendations;
  }
}

// グローバルインスタンスを作成
const performanceOptimizer = new PerformanceOptimizer();

// グローバルに公開
window.performanceOptimizer = performanceOptimizer;

export default performanceOptimizer;
