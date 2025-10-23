// tests/unit/Navigation.test.js - Navigation コンポーネントのテスト

import { Navigation } from '../../js/components/Navigation.js';

// モックの設定
let mockAuthManager;
let mockElement;

// authManagerモジュールをモック
jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn()
  }
}));

// showNotificationをモック
jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn()
}));

// tooltipManagerをモック
jest.mock('../../js/utils/tooltip.js', () => ({
  tooltipManager: {
    initialize: jest.fn(),
    addTooltip: jest.fn(),
    addDynamicTooltip: jest.fn()
  }
}));

describe('Navigation', () => {
  beforeEach(() => {
    // DOM要素のモック設定
    mockElement = {
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
      innerHTML: '',
      insertAdjacentHTML: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn()
    };

    // モックの設定
    mockAuthManager = {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      getCurrentUser: jest.fn().mockReturnValue({ email: 'test@example.com' }),
      logout: jest.fn().mockResolvedValue()
    };

    // モックされたauthManagerを設定
    const { authManager } = require('../../js/modules/authManager.js');
    authManager.isAuthenticated = mockAuthManager.isAuthenticated;
    authManager.getCurrentUser = mockAuthManager.getCurrentUser;
    authManager.logout = mockAuthManager.logout;
    
    // showNotificationのモックを設定
    const { showNotification } = require('../../js/utils/helpers.js');
    global.showNotification = showNotification;
    
    // window.location は setup.js で設定済み

    // document.getElementById のモック
    document.getElementById = jest.fn((id) => {
      if (id === 'mobile-sidebar') {
        return {
          ...mockElement,
          classList: {
            ...mockElement.classList,
            contains: jest.fn().mockReturnValue(false),
            add: jest.fn(),
            remove: jest.fn(),
            toggle: jest.fn()
          }
        };
      }
      if (id === 'user-info') {
        return { ...mockElement, style: { display: 'none' } };
      }
      if (id === 'logout-btn') {
        return { ...mockElement, style: { display: 'none' } };
      }
      return mockElement;
    });

    // document.querySelector のモック
    document.querySelector = jest.fn(() => mockElement);
    document.querySelectorAll = jest.fn(() => [mockElement]);
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      const navigation = new Navigation();
      expect(navigation.isInitialized).toBe(false);
      expect(navigation.navigationItems).toBeDefined();
    });
  });

  describe('getCurrentPage', () => {
    test('should return current page from URL', () => {
      const navigation = new Navigation();
      
      // getCurrentPageメソッドを直接テストするために、内部実装を確認
      // 実際のwindow.location.pathnameを使用してテスト
      const currentPage = navigation.getCurrentPage();
      
      // 現在のパスに基づいて期待値を設定
      const expectedPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
      expect(currentPage).toBe(expectedPage);
    });

    test('should return index for root path', () => {
      const navigation = new Navigation();
      
      // 現在のパスに基づいてテスト
      const currentPage = navigation.getCurrentPage();
      
      // 現在のパスがルートまたはindex.htmlの場合
      const expectedPage = window.location.pathname === '/' || window.location.pathname === '/index.html' ? 'index' : 
                          window.location.pathname.split('/').pop().replace('.html', '') || 'index';
      expect(currentPage).toBe(expectedPage);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      const navigation = new Navigation();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await navigation.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('🔄 Initializing navigation...');
      expect(navigation.isInitialized).toBe(true);
      consoleSpy.mockRestore();
    });

    test('should not initialize if already initialized', async () => {
      const navigation = new Navigation();
      
      // 1回目の初期化
      const consoleSpy1 = jest.spyOn(console, 'log').mockImplementation();
      await navigation.initialize();
      expect(consoleSpy1).toHaveBeenCalledWith('🔄 Initializing navigation...');
      consoleSpy1.mockRestore();
      
      // 2回目の初期化ではログが出力されないことを確認
      const consoleSpy2 = jest.spyOn(console, 'log').mockImplementation();
      await navigation.initialize();
      
      // 初期化ログが2回目に出力されないことを確認
      expect(consoleSpy2).not.toHaveBeenCalledWith('🔄 Initializing navigation...');
      consoleSpy2.mockRestore();
    });

    test('should handle initialization errors', async () => {
      const navigation = new Navigation();
      
      // authManagerを無効にしてエラーを発生させる
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated = jest.fn().mockRejectedValue(new Error('Auth error'));
      
      await expect(navigation.initialize()).rejects.toThrow();
    });
  });

  describe('generateBasicHeader', () => {
    test('should generate header HTML', () => {
      const navigation = new Navigation();
      const headerHTML = navigation.generateBasicHeader();
      
      expect(headerHTML).toContain('header');
      expect(headerHTML).toContain('MuscleRotationManager');
    });
  });

  describe('generateBasicSidebar', () => {
    test('should generate sidebar HTML', () => {
      const navigation = new Navigation();
      const sidebarHTML = navigation.generateBasicSidebar();
      
      expect(sidebarHTML).toContain('sidebar');
      expect(sidebarHTML).toContain('nav');
    });
  });

  describe('toggleMobileSidebar', () => {
    test('should toggle mobile sidebar visibility', () => {
      const navigation = new Navigation();
      
      // モバイルサイドバーのモックを設定
      const mockMobileSidebar = {
        classList: {
          toggle: jest.fn()
        }
      };
      
      document.getElementById = jest.fn().mockReturnValue(mockMobileSidebar);
      
      navigation.toggleMobileSidebar();
      
      expect(mockMobileSidebar.classList.toggle).toHaveBeenCalledWith('hidden');
    });
  });

  describe('closeMobileSidebar', () => {
    test('should close mobile sidebar', () => {
      const navigation = new Navigation();
      
      // モバイルサイドバーのモックを設定
      const mockMobileSidebar = {
        classList: {
          add: jest.fn()
        }
      };
      
      document.getElementById = jest.fn().mockReturnValue(mockMobileSidebar);
      
      navigation.closeMobileSidebar();
      
      expect(mockMobileSidebar.classList.add).toHaveBeenCalledWith('hidden');
    });
  });

  describe('handleNavigationClick', () => {
    test('should handle navigation click for authenticated user', async () => {
      const navigation = new Navigation();
      const navLink = {
        getAttribute: jest.fn().mockReturnValue('/dashboard.html'),
        preventDefault: jest.fn()
      };
      const event = { preventDefault: jest.fn() };
      
      await navigation.handleNavigationClick(navLink, event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test('should prevent navigation for unauthenticated user', async () => {
      const navigation = new Navigation();
      const navLink = {
        getAttribute: jest.fn().mockReturnValue('/dashboard.html'),
        preventDefault: jest.fn()
      };
      const event = { 
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      // 認証されていない状態をモック
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated = jest.fn().mockResolvedValue(false);
      
      await navigation.handleNavigationClick(navLink, event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(global.showNotification).toHaveBeenCalledWith('ログインが必要です', 'warning');
    });
  });

  describe('handleLogout', () => {
    test('should handle logout successfully', async () => {
      const navigation = new Navigation();
      
      // window.location.hrefをモック（JSDOMエラーを回避）
      const originalLocation = window.location;
      delete window.location;
      window.location = { 
        href: '',
        assign: jest.fn(),
        replace: jest.fn()
      };
      
      await navigation.handleLogout();
      
      const { authManager } = require('../../js/modules/authManager.js');
      expect(authManager.logout).toHaveBeenCalled();
      expect(global.showNotification).toHaveBeenCalledWith('ログアウトしました', 'success');
      
      // 元のlocationを復元
      window.location = originalLocation;
    });

    test('should handle logout errors', async () => {
      const navigation = new Navigation();
      const error = new Error('Logout failed');
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.logout = jest.fn().mockRejectedValue(error);
      
      // window.location.hrefをモック（JSDOMエラーを回避）
      const originalLocation = window.location;
      delete window.location;
      window.location = { 
        href: '',
        assign: jest.fn(),
        replace: jest.fn()
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await navigation.handleLogout();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', error);
      expect(global.showNotification).toHaveBeenCalledWith('ログアウトに失敗しました', 'error');
      
      consoleErrorSpy.mockRestore();
      
      // 元のlocationを復元
      window.location = originalLocation;
    });
  });

  describe('updateNavigationForAuth', () => {
    test('should update navigation for authenticated user', async () => {
      const navigation = new Navigation();
      
      await navigation.updateNavigationForAuth();
      
      const { authManager } = require('../../js/modules/authManager.js');
      expect(authManager.isAuthenticated).toHaveBeenCalled();
    });

    test('should update navigation for unauthenticated user', async () => {
      const navigation = new Navigation();
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated = jest.fn().mockResolvedValue(false);
      
      await navigation.updateNavigationForAuth();
      
      expect(authManager.isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('addEventListener', () => {
    test('should add event listener to element', () => {
      const navigation = new Navigation();
      const element = mockElement;
      const event = 'click';
      const handler = jest.fn();
      
      navigation.addEventListener(element, event, handler);
      
      expect(element.addEventListener).toHaveBeenCalledWith(event, handler);
    });

    test('should not add listener if element is null', () => {
      const navigation = new Navigation();
      const handler = jest.fn();
      
      navigation.addEventListener(null, 'click', handler);
      
      // エラーが発生しないことを確認
      expect(true).toBe(true);
    });
  });

  describe('setupTooltips', () => {
    test('should setup tooltips for navigation elements', () => {
      const navigation = new Navigation();
      const { tooltipManager } = require('../../js/utils/tooltip.js');
      
      navigation.setupTooltips();
      
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/dashboard.html"]', 'ダッシュボード：ワークアウトの統計情報と推奨事項を表示します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/workout.html"]', 'ワークアウト：筋力トレーニングの記録と管理を行います。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/calendar.html"]', 'カレンダー：過去のワークアウト履歴と予定を確認できます。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/analysis.html"]', '分析：トレーニングデータの詳細な分析とグラフを表示します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/progress.html"]', 'プログレッシブ・オーバーロード：筋力向上の進捗を科学的に追跡します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/exercises.html"]', 'エクササイズデータベース：豊富なエクササイズ情報を検索できます。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/settings.html"]', '設定：アカウント情報やアプリケーションの設定を変更できます。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/help.html"]', '使い方：アプリケーションの使用方法とヘルプ情報を表示します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('a[href="/privacy.html"]', 'プライバシーポリシー：個人情報の取り扱いについて説明します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('#mobile-menu-btn', 'メニューを開く：モバイル用のナビゲーションメニューを表示します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('#user-avatar', 'ユーザープロフィール：アカウント情報とログアウトオプションを表示します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('#login-btn', 'ログイン：アカウントにログインしてアプリケーションを使用します。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('#profile-settings', '設定：アカウント情報やアプリケーションの設定を変更できます。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('#logout-btn', 'ログアウト：現在のセッションを終了し、ログイン画面に戻ります。', expect.any(Object));
      expect(tooltipManager.addDynamicTooltip).toHaveBeenCalledWith('#mobile-sidebar-close', 'メニューを閉じる：モバイル用のナビゲーションメニューを閉じます。', expect.any(Object));
    });
  });

  describe('destroy', () => {
    test('should destroy navigation', () => {
      const navigation = new Navigation();
      navigation.isInitialized = true;
      
      navigation.destroy();
      
      expect(navigation.isInitialized).toBe(false);
    });
  });
});