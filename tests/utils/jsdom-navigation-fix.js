// JSDOMナビゲーション制限を回避するためのユーティリティ
// CI/CDパイプラインでのテスト安定性を向上させる

/**
 * JSDOMのナビゲーション制限を回避するためのセットアップ
 */
export function setupJSDOMNavigationFix() {
  if (typeof window === 'undefined') {
    return;
  }

  // コンソールエラーを抑制（JSDOMのナビゲーションエラーを無視）
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // JSDOMのナビゲーションエラーを抑制
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: navigation')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // コンソールログも抑制（テスト環境での不要なログを削減）
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // テスト環境でのナビゲーションログを抑制
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('Navigation skipped in test environment')
    ) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };

  // 既存のlocationが存在する場合は、そのメソッドをモック
  if (window.location) {
    // 既存のlocationオブジェクトのメソッドをモック
    if (typeof window.location.assign !== 'function') {
      window.location.assign = jest.fn();
    }
    if (typeof window.location.replace !== 'function') {
      window.location.replace = jest.fn();
    }
    if (typeof window.location.reload !== 'function') {
      window.location.reload = jest.fn();
    }
  }

  // テスト環境フラグを設定
  if (typeof process !== 'undefined') {
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
  }
}

/**
 * テスト用のナビゲーション関数
 */
export function mockNavigation(url) {
  if (typeof window !== 'undefined' && window.location) {
    try {
      window.location.href = url;
    } catch (error) {
      // JSDOMの制限により失敗した場合はassignメソッドを使用
      if (window.location.assign) {
        window.location.assign(url);
      }
    }
  }
}

/**
 * テスト用のリダイレクト関数
 */
export function mockRedirect(url) {
  if (typeof window !== 'undefined') {
    try {
      window.location.href = url;
    } catch (error) {
      // JSDOMの制限により失敗した場合はreplaceメソッドを使用
      if (window.location.replace) {
        window.location.replace(url);
      }
    }
  }
}
