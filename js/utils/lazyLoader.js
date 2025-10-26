// lazyLoader.js - 遅延ローディングマネージャー

class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.imageObserver = null;
    this.componentObserver = null;
    this.initializeImageLazyLoading();
    this.initializeComponentLazyLoading();
  }

  /**
   * ページモジュールを遅延ロード
   * @param {string} pageName - ページ名
   * @returns {Promise<Object>} ページモジュール
   */
  async loadPageModule(pageName) {
    const moduleKey = `page_${pageName}`;

    // 既に読み込み済みの場合はキャッシュから返す
    if (this.loadedModules.has(moduleKey)) {
      return this.loadedModules.get(moduleKey);
    }

    // 読み込み中の場合は既存のPromiseを返す
    if (this.loadingPromises.has(moduleKey)) {
      return this.loadingPromises.get(moduleKey);
    }

    // 新しい読み込みPromiseを作成
    const loadingPromise = this.createPageLoadPromise(pageName, moduleKey);
    this.loadingPromises.set(moduleKey, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleKey, module);
      this.loadingPromises.delete(moduleKey);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleKey);
      throw error;
    }
  }

  /**
   * ページ読み込みPromiseを作成
   * @param {string} pageName - ページ名
   * @param {string} moduleKey - モジュールキー
   * @returns {Promise<Object>}
   */
  // eslint-disable-next-line no-unused-vars
  async createPageLoadPromise(pageName, moduleKey) {
    console.log(`🔄 遅延ロード開始: ${pageName}`);
    const startTime = performance.now();

    try {
      let module;

      // ページ名に応じた動的インポート
      switch (pageName) {
        case 'dashboard':
          module = await import('../pages/dashboardPage.js');
          break;
        case 'workout':
          module = await import('../pages/workoutPageWizard.js');
          break;
        case 'calendar':
          module = await import('../pages/calendarPage.js');
          break;
        case 'analysis':
          module = await import('../pages/analysisPage.js');
          break;
        case 'progress':
          module = await import('../pages/progressPage.js');
          break;
        case 'exercises':
        case 'exercises-management':
          module = await import('../pages/exercisePage.js');
          break;
        case 'settings':
          module = await import('../pages/settingsPage.js');
          break;
        default:
          throw new Error(`Unknown page: ${pageName}`);
      }

      const loadTime = performance.now() - startTime;
      console.log(`✅ 遅延ロード完了: ${pageName} (${loadTime.toFixed(2)}ms)`);

      // パフォーマンスメトリクスを記録
      this.recordPerformanceMetric('page_load', pageName, loadTime);

      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      console.error(
        `❌ 遅延ロード失敗: ${pageName} (${loadTime.toFixed(2)}ms)`,
        error
      );
      throw error;
    }
  }

  /**
   * サービスモジュールを遅延ロード
   * @param {string} serviceName - サービス名
   * @returns {Promise<Object>} サービスモジュール
   */
  async loadServiceModule(serviceName) {
    const moduleKey = `service_${serviceName}`;

    if (this.loadedModules.has(moduleKey)) {
      return this.loadedModules.get(moduleKey);
    }

    if (this.loadingPromises.has(moduleKey)) {
      return this.loadingPromises.get(moduleKey);
    }

    const loadingPromise = this.createServiceLoadPromise(
      serviceName,
      moduleKey
    );
    this.loadingPromises.set(moduleKey, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleKey, module);
      this.loadingPromises.delete(moduleKey);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleKey);
      throw error;
    }
  }

  /**
   * サービス読み込みPromiseを作成
   * @param {string} serviceName - サービス名
   * @param {string} moduleKey - モジュールキー
   * @returns {Promise<Object>}
   */
  // eslint-disable-next-line no-unused-vars
  async createServiceLoadPromise(serviceName, moduleKey) {
    console.log(`🔄 サービス遅延ロード開始: ${serviceName}`);
    const startTime = performance.now();

    try {
      let module;

      switch (serviceName) {
        case 'chart':
          module = await import('../services/chartService.js');
          break;
        case 'exercise':
          module = await import('../services/exerciseService.js');
          break;
        case 'recommendation':
          module = await import('../services/recommendationService.js');
          break;
        case 'progressTracking':
          module = await import('../services/progressTrackingService.js');
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      const loadTime = performance.now() - startTime;
      console.log(
        `✅ サービス遅延ロード完了: ${serviceName} (${loadTime.toFixed(2)}ms)`
      );

      this.recordPerformanceMetric('service_load', serviceName, loadTime);
      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      console.error(
        `❌ サービス遅延ロード失敗: ${serviceName} (${loadTime.toFixed(2)}ms)`,
        error
      );
      throw error;
    }
  }

  /**
   * 画像の遅延ローディングを初期化
   */
  initializeImageLazyLoading() {
    // Intersection Observer API をサポートしているかチェック
    if (!('IntersectionObserver' in window)) {
      console.warn(
        'IntersectionObserver not supported, falling back to immediate loading'
      );
      this.loadAllImagesImmediately();
      return;
    }

    this.imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.imageObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px', // 50px手前で読み込み開始
        threshold: 0.01,
      }
    );

    // 既存の遅延ロード対象画像を監視
    this.observeExistingImages();
  }

  /**
   * 既存の画像を監視対象に追加
   */
  observeExistingImages() {
    const lazyImages = document.querySelectorAll(
      'img[data-src], img[loading="lazy"]'
    );
    lazyImages.forEach((img) => {
      this.imageObserver.observe(img);
    });
  }

  /**
   * 新しい画像を遅延ロード対象に追加
   * @param {HTMLImageElement} img - 画像要素
   */
  observeImage(img) {
    if (this.imageObserver && img) {
      this.imageObserver.observe(img);
    }
  }

  /**
   * 画像を読み込み
   * @param {HTMLImageElement} img - 画像要素
   */
  loadImage(img) {
    const startTime = performance.now();

    // data-src から src に移動
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }

    // 読み込み完了時の処理
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      img.classList.add('loaded');
      console.log(`📷 画像読み込み完了: ${img.src} (${loadTime.toFixed(2)}ms)`);
      this.recordPerformanceMetric('image_load', img.src, loadTime);
    };

    // 読み込み失敗時の処理
    img.onerror = () => {
      const loadTime = performance.now() - startTime;
      img.classList.add('error');
      console.error(
        `❌ 画像読み込み失敗: ${img.src} (${loadTime.toFixed(2)}ms)`
      );

      // フォールバック画像を設定
      if (!img.src.includes('default-avatar')) {
        img.src = '/assets/default-avatar.png';
      }
    };
  }

  /**
   * 全画像を即座に読み込み（フォールバック）
   */
  loadAllImagesImmediately() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => this.loadImage(img));
  }

  /**
   * コンポーネントの遅延ローディングを初期化
   */
  initializeComponentLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    this.componentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadComponent(entry.target);
            this.componentObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px 0px', // 100px手前で読み込み開始
        threshold: 0.01,
      }
    );
  }

  /**
   * コンポーネントを遅延ロード対象に追加
   * @param {HTMLElement} element - 要素
   * @param {string} componentType - コンポーネントタイプ
   */
  observeComponent(element, componentType) {
    if (this.componentObserver && element) {
      element.dataset.componentType = componentType;
      this.componentObserver.observe(element);
    }
  }

  /**
   * コンポーネントを読み込み
   * @param {HTMLElement} element - 要素
   */
  async loadComponent(element) {
    const componentType = element.dataset.componentType;
    if (!componentType) {
      return;
    }

    const startTime = performance.now();
    console.log(`🔄 コンポーネント遅延ロード開始: ${componentType}`);

    try {
      switch (componentType) {
        case 'chart':
          await this.loadChartComponent(element);
          break;
        case 'calendar':
          await this.loadCalendarComponent(element);
          break;
        case 'progress-chart':
          await this.loadProgressChartComponent(element);
          break;
        default:
          console.warn(`Unknown component type: ${componentType}`);
      }

      const loadTime = performance.now() - startTime;
      console.log(
        `✅ コンポーネント遅延ロード完了: ${componentType} (${loadTime.toFixed(2)}ms)`
      );
      this.recordPerformanceMetric('component_load', componentType, loadTime);
    } catch (error) {
      const loadTime = performance.now() - startTime;
      console.error(
        `❌ コンポーネント遅延ロード失敗: ${componentType} (${loadTime.toFixed(2)}ms)`,
        error
      );
    }
  }

  /**
   * チャートコンポーネントを読み込み
   * @param {HTMLElement} element - チャート要素
   */
  async loadChartComponent(element) {
    const chartService = await this.loadServiceModule('chart');
    const chartType = element.dataset.chartType || 'line';
    const chartData = JSON.parse(element.dataset.chartData || '{}');

    if (chartService.default) {
      chartService.default.createChart(element.id, chartType, chartData);
    }
  }

  /**
   * カレンダーコンポーネントを読み込み
   * @param {HTMLElement} element - カレンダー要素
   */
  async loadCalendarComponent(element) {
    const calendarPage = await this.loadPageModule('calendar');
    if (calendarPage.default && calendarPage.default.renderCalendar) {
      calendarPage.default.renderCalendar(element);
    }
  }

  /**
   * プログレスチャートコンポーネントを読み込み
   * @param {HTMLElement} element - プログレスチャート要素
   */
  async loadProgressChartComponent(element) {
    const progressService = await this.loadServiceModule('progressTracking');
    const chartData = JSON.parse(element.dataset.chartData || '{}');

    if (progressService.default) {
      progressService.default.renderProgressChart(element, chartData);
    }
  }

  /**
   * パフォーマンスメトリクスを記録
   * @param {string} type - メトリクスタイプ
   * @param {string} name - 名前
   * @param {number} duration - 実行時間
   */
  recordPerformanceMetric(type, name, duration) {
    const metric = {
      type,
      name,
      duration,
      timestamp: Date.now(),
    };

    // LocalStorageに保存（最新100件まで）
    try {
      const metrics = JSON.parse(
        localStorage.getItem('performanceMetrics') || '[]'
      );
      metrics.push(metric);

      // 最新100件のみ保持
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }

      localStorage.setItem('performanceMetrics', JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to save performance metric:', error);
    }

    // パフォーマンス閾値チェック
    this.checkPerformanceThreshold(type, duration);
  }

  /**
   * パフォーマンス閾値をチェック
   * @param {string} type - メトリクスタイプ
   * @param {number} duration - 実行時間
   */
  checkPerformanceThreshold(type, duration) {
    const thresholds = {
      page_load: 1000, // 1秒
      service_load: 500, // 0.5秒
      image_load: 3000, // 3秒
      component_load: 800, // 0.8秒
    };

    const threshold = thresholds[type];
    if (threshold && duration > threshold) {
      console.warn(
        `⚠️ パフォーマンス警告: ${type} が閾値(${threshold}ms)を超えました: ${duration.toFixed(2)}ms`
      );

      // カスタムイベントを発火してモニタリング
      window.dispatchEvent(
        new CustomEvent('performanceWarning', {
          detail: { type, duration, threshold },
        })
      );
    }
  }

  /**
   * パフォーマンスメトリクスを取得
   * @returns {Array} メトリクス配列
   */
  getPerformanceMetrics() {
    try {
      return JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
    } catch (error) {
      console.warn('Failed to load performance metrics:', error);
      return [];
    }
  }

  /**
   * パフォーマンス統計を取得
   * @returns {Object} 統計情報
   */
  getPerformanceStats() {
    const metrics = this.getPerformanceMetrics();
    const stats = {};

    // タイプ別に統計を計算
    ['page_load', 'service_load', 'image_load', 'component_load'].forEach(
      (type) => {
        const typeMetrics = metrics.filter((m) => m.type === type);
        if (typeMetrics.length > 0) {
          const durations = typeMetrics.map((m) => m.duration);
          stats[type] = {
            count: typeMetrics.length,
            avg: durations.reduce((a, b) => a + b, 0) / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            recent: typeMetrics.slice(-10).map((m) => m.duration),
          };
        }
      }
    );

    return stats;
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    console.log('🧹 遅延ローダーキャッシュをクリアしました');
  }

  /**
   * オブザーバーを破棄
   */
  destroy() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }

    if (this.componentObserver) {
      this.componentObserver.disconnect();
      this.componentObserver = null;
    }

    this.clearCache();
    console.log('🗑️ 遅延ローダーを破棄しました');
  }
}

// シングルトンインスタンスをエクスポート
export const lazyLoader = new LazyLoader();
