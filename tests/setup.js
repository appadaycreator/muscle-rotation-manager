// tests/setup.js - Jest セットアップファイル

import '@testing-library/jest-dom';

// 基本的なDOM環境のモック
global.window = {
  location: { href: 'http://localhost:8000', pathname: '/' },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  performance: {
    now: jest.fn(() => Date.now())
  }
};

global.document = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    click: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    textContent: '',
    innerHTML: ''
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.navigator = {
  userAgent: 'test',
  onLine: true,
  language: 'ja'
};

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.fetch = jest.fn();
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// グローバル変数の設定
global.alert = jest.fn();
global.confirm = jest.fn();
global.prompt = jest.fn();

// タイマーの設定
jest.useFakeTimers();

// テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// テスト前のセットアップ
beforeEach(() => {
  // グローバル変数のリセット
  delete global.router;
  delete global.app;
  delete global.MuscleRotationApp;
});

// 非同期テストのタイムアウト設定
jest.setTimeout(10000);

// モックの設定
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn()
          }))
        }))
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }))
  }))
}));

console.log('🧪 Jest setup completed');