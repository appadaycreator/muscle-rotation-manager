// tests/setup.js - Jest セットアップファイル

import '@testing-library/jest-dom';
import { setupJSDOMNavigationFix } from './utils/jsdom-navigation-fix.js';

// 基本的なDOM環境のモック
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  performance: {
    now: jest.fn(() => Date.now())
  },
  CustomEvent: class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }
};

// JSDOMのナビゲーション制限を回避するための設定
// テスト環境でのナビゲーションエラーを抑制
const originalConsoleError = console.error;
console.error = (...args) => {
  // JSDOMのナビゲーションエラーを抑制
  if (args[0] && args[0].includes && args[0].includes('Not implemented: navigation')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// コンソールログも抑制（テスト環境での不要なログを削減）
const originalConsoleLog = console.log;
console.log = (...args) => {
  // テスト環境でのナビゲーションログを抑制
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Navigation skipped in test environment')) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

// JSDOMのナビゲーション制限を回避
// 専用ユーティリティを使用してセットアップ
setupJSDOMNavigationFix();

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
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    innerHTML: '',
    textContent: ''
  })),
  createTextNode: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// グローバル変数の設定
global.alert = jest.fn();
global.confirm = jest.fn();
global.prompt = jest.fn();

// グローバル関数の設定
global.showNotification = jest.fn();
global.hideNotification = jest.fn();
global.showAuthModal = jest.fn();
global.hideAuthModal = jest.fn();

// localStorage のモック
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// sessionStorage のモック
global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// fetch のモック
global.fetch = jest.fn();

// コンソールのモック
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// URL のモック（ReportService用）
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn()
};

// Blob のモック
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || '';
  }
};