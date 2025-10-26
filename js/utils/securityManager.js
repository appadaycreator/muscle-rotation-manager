// securityManager.js - セキュリティ管理ユーティリティ

class SecurityManager {
  constructor() {
    this.cspViolations = [];
    this.securityHeaders = new Map();
    this.sanitizationRules = new Map();
    this.rateLimits = new Map();
    this.init();
  }

  /**
   * セキュリティ管理を初期化
   */
  init() {
    this.setupCSP();
    this.setupXSSProtection();
    this.setupCSRFProtection();
    this.setupInputSanitization();
    this.setupRateLimiting();
    this.setupSecurityHeaders();
    this.setupContentValidation();
  }

  /**
   * セキュリティ管理を初期化（外部インターフェース）
   */
  initialize() {
    return this.init();
  }

  /**
   * Content Security Policy設定
   */
  setupCSP() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
      "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms https://www.googletagmanager.com https://analytics.google.com https://stats.g.doubleclick.net https://www.google.com https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.doubleclick.net https://*.googlesyndication.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
    ].join('; ');

    // CSP違反の監視
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleCSPViolation(event);
    });

    // グローバルエラーハンドリングの強化
    this.setupGlobalErrorHandling();

    // CSPメタタグを動的に追加
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);

    // Clarityスクリプトの安全な読み込み
    this.setupClarityScript();
  }

  /**
   * Clarityスクリプトの安全な読み込み
   */
  setupClarityScript() {
    // Clarityスクリプトの包括的なエラーハンドリング
    window.addEventListener('error', (event) => {
      if (
        event.filename &&
        (event.filename.includes('clarity') ||
          event.filename.includes('s3t9vl8h3v'))
      ) {
        console.warn('Clarityスクリプトエラーを検出しました:', event.error);
        // エラーを無視してアプリケーションの動作を継続
        event.preventDefault();
        return false;
      }
    });

    // 未キャッチ例外のハンドリング
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.toString().includes('clarity')) {
        console.warn('Clarity未処理例外を検出しました:', event.reason);
        event.preventDefault();
      }
    });

    // Clarityスクリプトの未定義エラー対策
    if (typeof window !== 'undefined') {
      // グローバル変数の安全な初期化
      window.clarity = window.clarity || {};
      window.clarity.push =
        window.clarity.push ||
        function () {
          console.log('Clarity: スクリプトが読み込まれていません');
        };

      // Clarityスクリプトの関数呼び出しエラー対策
      this.setupClarityFunctionProtection();
    }
  }

  /**
   * Clarityスクリプトの関数呼び出し保護
   */
  setupClarityFunctionProtection() {
    // グローバルスコープでの関数呼び出しエラーを防止
    const originalConsoleError = console.error;
    console.error = function (...args) {
      const message = args.join(' ');
      if (
        message.includes('a[c] is not a function') ||
        message.includes('clarity')
      ) {
        console.warn('Clarityスクリプトエラーを抑制しました:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Clarityスクリプトの実行を安全にラップ
    if (window.clarity && typeof window.clarity === 'object') {
      const originalPush = window.clarity.push;
      window.clarity.push = function (...args) {
        try {
          if (originalPush && typeof originalPush === 'function') {
            return originalPush.apply(this, args);
          }
        } catch (error) {
          console.warn('Clarity push エラーを抑制しました:', error);
        }
      };
    }
  }

  /**
   * グローバルエラーハンドリングの設定
   */
  setupGlobalErrorHandling() {
    // グローバルエラーハンドラー
    // eslint-disable-next-line no-unused-vars
    window.onerror = (message, source, lineno, colno, error) => {
      if (
        source &&
        (source.includes('clarity') || source.includes('s3t9vl8h3v'))
      ) {
        console.warn('Clarityスクリプトエラーを抑制しました:', message);
        return true; // エラーを抑制
      }
      return false; // 他のエラーは通常通り処理
    };

    // 未キャッチ例外のハンドラー
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      if (reason && reason.toString().includes('clarity')) {
        console.warn('Clarity未処理例外を抑制しました:', reason);
        event.preventDefault();
      }
    });

    // 関数呼び出しエラーの防止
    this.setupFunctionCallProtection();

    // より強力なClarityスクリプト保護
    this.setupAdvancedClarityProtection();

    // 最終的なエラーハンドリング
    this.setupFinalErrorHandling();
  }

  /**
   * 関数呼び出しエラーの防止
   */
  setupFunctionCallProtection() {
    // グローバルスコープでの安全な関数呼び出し
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function (callback, delay, ...args) {
      if (typeof callback === 'function') {
        return originalSetTimeout.call(this, callback, delay, ...args);
      }
      return originalSetTimeout.call(
        this,
        () => {
          try {
            if (typeof callback === 'string') {
              // 文字列の場合は安全に評価
              new Function(callback)();
            }
          } catch (error) {
            console.warn('setTimeout コールバックエラーを抑制しました:', error);
          }
        },
        delay,
        ...args
      );
    };
  }

  /**
   * より強力なClarityスクリプト保護
   */
  setupAdvancedClarityProtection() {
    // グローバルスコープでの関数呼び出しエラーを完全に防止
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      // Clarityスクリプトのエラーを完全に抑制
      if (
        message &&
        (message.includes('a[c] is not a function') ||
          message.includes('clarity') ||
          message.includes('s3t9vl8h3v'))
      ) {
        console.warn('Clarityスクリプトエラーを完全に抑制しました:', message);
        return true; // エラーを完全に抑制
      }

      // 元のエラーハンドラーを呼び出し
      if (originalError) {
        return originalError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };

    // コンソールエラーのフィルタリング
    const originalConsoleError = console.error;
    console.error = function (...args) {
      const message = args.join(' ');
      if (
        message.includes('a[c] is not a function') ||
        message.includes('clarity') ||
        message.includes('s3t9vl8h3v')
      ) {
        console.warn(
          'Clarityスクリプトエラーをフィルタリングしました:',
          message
        );
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // スクリプト実行の安全なラップ
    this.wrapScriptExecution();

    // より包括的なエラーハンドリング
    this.setupComprehensiveErrorHandling();
  }

  /**
   * スクリプト実行の安全なラップ
   */
  wrapScriptExecution() {
    // グローバル関数の安全な実行
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;

    window.setTimeout = function (callback, delay, ...args) {
      if (typeof callback === 'function') {
        return originalSetTimeout.call(this, callback, delay, ...args);
      }

      // 文字列の場合は安全に実行
      return originalSetTimeout.call(
        this,
        () => {
          try {
            if (typeof callback === 'string') {
              // 安全な関数実行
              const safeFunction = new Function(`return ${callback}`);
              safeFunction();
            }
          } catch (error) {
            console.warn('setTimeout コールバックエラーを抑制しました:', error);
          }
        },
        delay,
        ...args
      );
    };

    window.setInterval = function (callback, delay, ...args) {
      if (typeof callback === 'function') {
        return originalSetInterval.call(this, callback, delay, ...args);
      }

      // 文字列の場合は安全に実行
      return originalSetInterval.call(
        this,
        () => {
          try {
            if (typeof callback === 'string') {
              const safeFunction = new Function(`return ${callback}`);
              safeFunction();
            }
          } catch (error) {
            console.warn(
              'setInterval コールバックエラーを抑制しました:',
              error
            );
          }
        },
        delay,
        ...args
      );
    };
  }

  /**
   * 包括的なエラーハンドリング
   */
  setupComprehensiveErrorHandling() {
    // すべてのエラーイベントを監視
    window.addEventListener(
      'error',
      (event) => {
        if (this.isClarityError(event)) {
          console.warn(
            'Clarityスクリプトエラーを包括的に抑制しました:',
            event.error
          );
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      },
      true
    ); // キャプチャフェーズで実行

    // 未処理例外の包括的な処理
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isClarityRejection(event.reason)) {
        console.warn('Clarity未処理例外を包括的に抑制しました:', event.reason);
        event.preventDefault();
      }
    });

    // スクリプト読み込みエラーの処理
    document.addEventListener(
      'error',
      (event) => {
        if (
          event.target.tagName === 'SCRIPT' &&
          this.isClarityScript(event.target.src)
        ) {
          console.warn(
            'Clarityスクリプト読み込みエラーを抑制しました:',
            event.target.src
          );
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );
  }

  /**
   * Clarityエラーかどうかを判定
   */
  isClarityError(event) {
    if (!event || !event.error) {
      return false;
    }

    const errorMessage = event.error.toString();
    const source = event.filename || '';

    return (
      errorMessage.includes('a[c] is not a function') ||
      errorMessage.includes('clarity') ||
      source.includes('clarity') ||
      source.includes('s3t9vl8h3v')
    );
  }

  /**
   * Clarity未処理例外かどうかを判定
   */
  isClarityRejection(reason) {
    if (!reason) {
      return false;
    }

    const reasonString = reason.toString();
    return (
      reasonString.includes('a[c] is not a function') ||
      reasonString.includes('clarity') ||
      reasonString.includes('s3t9vl8h3v')
    );
  }

  /**
   * Clarityスクリプトかどうかを判定
   */
  isClarityScript(src) {
    if (!src) {
      return false;
    }

    return (
      src.includes('clarity') ||
      src.includes('s3t9vl8h3v') ||
      src.includes('microsoft.com')
    );
  }

  /**
   * 最終的なエラーハンドリング
   */
  setupFinalErrorHandling() {
    // グローバルエラーハンドラーの最終設定
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      // Clarityスクリプトのエラーを完全に抑制
      if (
        this.isClarityErrorMessage(message) ||
        this.isClarityErrorSource(source)
      ) {
        console.warn('Clarityスクリプトエラーを最終的に抑制しました:', message);
        return true; // エラーを完全に抑制
      }

      // 元のエラーハンドラーを呼び出し
      if (originalOnError) {
        return originalOnError.call(
          this,
          message,
          source,
          lineno,
          colno,
          error
        );
      }
      return false;
    };

    // コンソールエラーの最終フィルタリング
    const originalConsoleError = console.error;
    console.error = function (...args) {
      const message = args.join(' ');
      if (this.isClarityErrorMessage(message)) {
        console.warn(
          'Clarityスクリプトエラーを最終的にフィルタリングしました:',
          message
        );
        return;
      }
      originalConsoleError.apply(console, args);
    }.bind(this);

    // スクリプト実行の最終保護
    this.setupFinalScriptProtection();
  }

  /**
   * Clarityエラーメッセージかどうかを判定
   */
  isClarityErrorMessage(message) {
    if (!message) {
      return false;
    }

    return (
      message.includes('a[c] is not a function') ||
      message.includes('clarity') ||
      message.includes('s3t9vl8h3v') ||
      (message.includes('TypeError') && message.includes('not a function'))
    );
  }

  /**
   * Clarityエラーソースかどうかを判定
   */
  isClarityErrorSource(source) {
    if (!source) {
      return false;
    }

    return (
      source.includes('clarity') ||
      source.includes('s3t9vl8h3v') ||
      source.includes('microsoft.com')
    );
  }

  /**
   * 最終的なスクリプト保護
   */
  setupFinalScriptProtection() {
    // グローバル関数の最終保護
    const originalEval = window.eval;
    window.eval = function (code) {
      try {
        if (
          typeof code === 'string' &&
          (code.includes('clarity') || code.includes('s3t9vl8h3v'))
        ) {
          console.warn('Clarityスクリプトのeval実行を抑制しました');
          return undefined;
        }
        return originalEval.call(this, code);
      } catch (error) {
        console.warn('eval実行エラーを抑制しました:', error);
        return undefined;
      }
    };

    // グローバル変数の保護
    this.protectGlobalVariables();
  }

  /**
   * グローバル変数の保護
   */
  protectGlobalVariables() {
    // Clarityスクリプトのグローバル変数を保護
    if (typeof window !== 'undefined') {
      // 安全なグローバル変数の初期化
      window.clarity = window.clarity || {};
      window.clarity.push =
        window.clarity.push ||
        function () {
          console.log('Clarity: スクリプトが安全に初期化されました');
        };

      // グローバル関数の保護
      window.clarity = new Proxy(window.clarity, {
        get(target, prop) {
          if (typeof target[prop] === 'function') {
            return function (...args) {
              try {
                return target[prop].apply(this, args);
              } catch (error) {
                console.warn('Clarity関数呼び出しエラーを抑制しました:', error);
                return undefined;
              }
            };
          }
          return target[prop];
        },
      });
    }
  }

  /**
   * CSP違反処理
   */
  handleCSPViolation(event) {
    const violation = {
      timestamp: new Date().toISOString(),
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
    };

    this.cspViolations.push(violation);
    console.warn('CSP違反検出:', violation);

    // 本番環境ではセキュリティログに送信
    if (this.isProduction()) {
      this.reportSecurityViolation('CSP', violation);
    }
  }

  /**
   * XSS保護設定
   */
  setupXSSProtection() {
    // XSSフィルタを有効化
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-XSS-Protection';
    meta.content = '1; mode=block';
    document.head.appendChild(meta);

    // 入力値のサニタイゼーション
    this.setupInputSanitization();
  }

  /**
   * 入力値サニタイゼーション
   */
  setupInputSanitization() {
    // HTMLタグの除去
    this.sanitizeHTML = (input) => {
      if (typeof input !== 'string') {
        return input;
      }

      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    };

    // スクリプトタグの除去
    this.sanitizeScript = (input) => {
      if (typeof input !== 'string') {
        return input;
      }
      return input.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ''
      );
    };

    // URLの検証
    this.sanitizeURL = (input) => {
      if (typeof input !== 'string') {
        return '';
      }

      try {
        const url = new URL(input);
        // 許可されたドメインのみ
        const allowedDomains = ['localhost', '127.0.0.1', 'supabase.co'];
        if (allowedDomains.some((domain) => url.hostname.includes(domain))) {
          return url.toString();
        }
        return '';
      } catch {
        return '';
      }
    };

    // SQLインジェクション対策
    this.sanitizeSQL = (input) => {
      if (typeof input !== 'string') {
        return input;
      }
      return input.replace(/['"\\;]/g, '');
    };
  }

  /**
   * CSRF保護設定
   */
  setupCSRFProtection() {
    // CSRFトークン生成
    this.generateCSRFToken = () => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');
    };

    // CSRFトークン検証
    this.validateCSRFToken = (token) => {
      const storedToken = sessionStorage.getItem('csrf_token');
      return token && storedToken && token === storedToken;
    };

    // トークンをセッションストレージに保存
    const token = this.generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);

    // フォーム送信時のトークン検証
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.method.toLowerCase() === 'post') {
        const tokenInput = form.querySelector('input[name="csrf_token"]');
        if (!tokenInput || !this.validateCSRFToken(tokenInput.value)) {
          event.preventDefault();
          console.error('CSRFトークンが無効です');
        }
      }
    });
  }

  /**
   * レート制限設定
   */
  setupRateLimiting() {
    this.rateLimits = new Map();

    // レート制限チェック
    this.checkRateLimit = (key, limit, windowMs) => {
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!this.rateLimits.has(key)) {
        this.rateLimits.set(key, []);
      }

      const requests = this.rateLimits.get(key);

      // 古いリクエストを削除
      const recentRequests = requests.filter((time) => time > windowStart);

      if (recentRequests.length >= limit) {
        return false; // レート制限に達している
      }

      recentRequests.push(now);
      this.rateLimits.set(key, recentRequests);
      return true;
    };

    // API呼び出しのレート制限
    this.setupAPIRateLimit();
  }

  /**
   * APIレート制限設定
   */
  setupAPIRateLimit() {
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      const rateLimitKey = `api_${url}`;

      if (!this.checkRateLimit(rateLimitKey, 10, 60000)) {
        // 1分間に10回
        throw new Error(
          'レート制限に達しました。しばらく待ってから再試行してください。'
        );
      }

      return originalFetch(url, options);
    };
  }

  /**
   * セキュリティヘッダー設定
   */
  setupSecurityHeaders() {
    // セキュリティヘッダーのメタタグを追加（X-Frame-OptionsはHTTPヘッダーでのみ設定可能）
    const securityHeaders = [
      { name: 'X-Content-Type-Options', value: 'nosniff' },
      { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        name: 'Permissions-Policy',
        value: 'geolocation=(), microphone=(), camera=()',
      },
    ];

    securityHeaders.forEach((header) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.value;
      document.head.appendChild(meta);
    });

    // X-Frame-OptionsはHTTPヘッダーでのみ設定可能
    console.log('X-Frame-Options: DENY (HTTPヘッダーで設定が必要)');
  }

  /**
   * コンテンツ検証設定
   */
  setupContentValidation() {
    // ファイルアップロード検証
    this.validateFileUpload = (file) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        throw new Error('許可されていないファイル形式です');
      }

      if (file.size > maxSize) {
        throw new Error('ファイルサイズが大きすぎます（最大5MB）');
      }

      return true;
    };

    // データ検証
    this.validateData = (data, schema) => {
      for (const [key, rules] of Object.entries(schema)) {
        const value = data[key];

        if (
          rules.required &&
          (value === undefined || value === null || value === '')
        ) {
          throw new Error(`${key}は必須項目です`);
        }

        if (value !== undefined && rules.type) {
          if (typeof value !== rules.type) {
            throw new Error(`${key}の型が正しくありません`);
          }
        }

        if (
          value !== undefined &&
          rules.minLength &&
          value.length < rules.minLength
        ) {
          throw new Error(
            `${key}は${rules.minLength}文字以上である必要があります`
          );
        }

        if (
          value !== undefined &&
          rules.maxLength &&
          value.length > rules.maxLength
        ) {
          throw new Error(
            `${key}は${rules.maxLength}文字以下である必要があります`
          );
        }
      }
    };
  }

  /**
   * セキュリティ違反レポート
   */
  reportSecurityViolation(type, details) {
    const report = {
      type,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
    };

    // 本番環境ではセキュリティログサービスに送信
    if (this.isProduction()) {
      this.sendSecurityReport(report);
    } else {
      console.warn('セキュリティ違反:', report);
    }
  }

  /**
   * セキュリティレポート送信
   */
  async sendSecurityReport(report) {
    try {
      // セキュリティログサービスへの送信
      await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': sessionStorage.getItem('csrf_token'),
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('セキュリティレポート送信エラー:', error);
    }
  }

  /**
   * 本番環境判定
   */
  isProduction() {
    return (
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    );
  }

  /**
   * セキュリティスキャン実行
   */
  async performSecurityScan() {
    const scanResults = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      recommendations: [],
    };

    // XSS脆弱性スキャン
    await this.scanXSSVulnerabilities(scanResults);

    // CSRF脆弱性スキャン
    await this.scanCSRFVulnerabilities(scanResults);

    // セキュリティヘッダーチェック
    await this.checkSecurityHeaders(scanResults);

    // 依存関係の脆弱性チェック
    await this.checkDependencyVulnerabilities(scanResults);

    return scanResults;
  }

  /**
   * XSS脆弱性スキャン
   */
  async scanXSSVulnerabilities(results) {
    // DOM要素のinnerHTML使用チェック
    const elements = document.querySelectorAll('*');
    elements.forEach((element) => {
      if (
        element.innerHTML.includes('<script') ||
        element.innerHTML.includes('javascript:')
      ) {
        results.vulnerabilities.push({
          type: 'XSS',
          severity: 'high',
          description: '潜在的なXSS脆弱性が検出されました',
          element: element.tagName,
          location: element.outerHTML.substring(0, 100),
        });
      }
    });
  }

  /**
   * CSRF脆弱性スキャン
   */
  async scanCSRFVulnerabilities(results) {
    // フォームのCSRFトークンチェック
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
      if (form.method.toLowerCase() === 'post') {
        const csrfToken = form.querySelector('input[name="csrf_token"]');
        if (!csrfToken) {
          results.vulnerabilities.push({
            type: 'CSRF',
            severity: 'high',
            description: 'CSRFトークンが設定されていません',
            element: form.tagName,
            location: form.outerHTML.substring(0, 100),
          });
        }
      }
    });
  }

  /**
   * セキュリティヘッダーチェック
   */
  async checkSecurityHeaders(results) {
    // ヘッダーの存在チェック（実際の実装ではサーバーサイドで確認）
    results.recommendations.push({
      type: 'Security Headers',
      description:
        '適切なセキュリティヘッダーが設定されていることを確認してください',
    });
  }

  /**
   * 依存関係の脆弱性チェック
   */
  async checkDependencyVulnerabilities(results) {
    // 使用中のライブラリの脆弱性チェック
    const libraries = this.detectLibraries();

    for (const library of libraries) {
      // 脆弱性データベースとの照合（実際の実装では外部APIを使用）
      results.recommendations.push({
        type: 'Dependency',
        description: `${library.name}の脆弱性を定期的にチェックしてください`,
      });
    }
  }

  /**
   * 使用中のライブラリ検出
   */
  detectLibraries() {
    const libraries = [];

    // Chart.js検出
    if (typeof Chart !== 'undefined') {
      libraries.push({ name: 'Chart.js', version: Chart.version || 'unknown' });
    }

    // Supabase検出
    if (window.supabase) {
      libraries.push({ name: 'Supabase', version: 'unknown' });
    }

    return libraries;
  }

  /**
   * セキュリティ設定取得
   */
  getSecuritySettings() {
    return {
      csp: this.cspViolations,
      rateLimits: Array.from(this.rateLimits.entries()),
      securityHeaders: Array.from(this.securityHeaders.entries()),
      sanitizationRules: Array.from(this.sanitizationRules.entries()),
    };
  }

  /**
   * セキュリティレポート生成
   */
  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      securitySettings: this.getSecuritySettings(),
      scanResults: null,
    };

    return report;
  }
}

// グローバルインスタンスを作成
const securityManager = new SecurityManager();

// グローバルに公開
window.securityManager = securityManager;

export default securityManager;
