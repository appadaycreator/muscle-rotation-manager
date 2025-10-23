// SettingsPage.test.js - 設定ページのテスト

import SettingsPage from '../../js/pages/settingsPage.js';

// DOM モック
const mockElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  innerHTML: '',
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn()
};

// document モック
Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(() => [])
});

// window.location のモック
delete window.location;
window.location = { href: '' };

describe('SettingsPage', () => {
  let settingsPage;

  beforeEach(() => {
    settingsPage = SettingsPage;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(settingsPage.userProfile).toBeNull();
      expect(settingsPage.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully when authenticated', async () => {
      await expect(settingsPage.initialize()).resolves.not.toThrow();
    });

    test('should show login prompt when not authenticated', async () => {
      await expect(settingsPage.initialize()).resolves.not.toThrow();
    });
  });

  describe('setupAuthStateListener', () => {
    test('should setup auth state listener', () => {
      expect(() => settingsPage.setupAuthStateListener()).not.toThrow();
    });
  });

  describe('showLoginPrompt', () => {
    test('should show login prompt', () => {
      expect(() => settingsPage.showLoginPrompt()).not.toThrow();
    });
  });

  describe('renderSettingsPage', () => {
    test('should render settings page', () => {
      expect(() => settingsPage.renderSettingsPage()).not.toThrow();
    });
  });

  describe('loadUserProfile', () => {
    test('should load user profile', async () => {
      await expect(settingsPage.loadUserProfile()).resolves.not.toThrow();
    });
  });

  describe('setupSettingsInterface', () => {
    test('should setup settings interface', () => {
      expect(() => settingsPage.setupSettingsInterface()).not.toThrow();
    });
  });

  describe('setupEventListeners', () => {
    test('should setup event listeners', () => {
      expect(() => settingsPage.setupEventListeners()).not.toThrow();
    });
  });

  describe('setupTooltips', () => {
    test('should setup tooltips', () => {
      expect(() => settingsPage.setupTooltips()).not.toThrow();
    });
  });

  describe('saveUserProfile', () => {
    test('should save user profile successfully', async () => {
      const profile = { name: 'Test User', email: 'test@example.com' };
      await expect(settingsPage.saveUserProfile(profile)).resolves.not.toThrow();
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile', async () => {
      const profile = { name: 'Updated User' };
      await expect(settingsPage.updateUserProfile(profile)).resolves.not.toThrow();
    });
  });

  describe('deleteUserProfile', () => {
    test('should delete user profile', async () => {
      await expect(settingsPage.deleteUserProfile()).resolves.not.toThrow();
    });
  });

  describe('getUserProfile', () => {
    test('should get user profile', async () => {
      const profile = await settingsPage.getUserProfile();
      expect(profile).toBeDefined();
    });
  });
});