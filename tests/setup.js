// tests/setup.js - Jest セットアップファイル

import '@testing-library/jest-dom';

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

// window.locationのモック設定（JSDOMの制限を回避）
// JSDOMではlocationの直接設定が制限されているため、テストファイル内で個別にモック

// window.location のモック設定（Jest環境では既に設定されている可能性があるため削除）

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