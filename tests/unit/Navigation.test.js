// tests/unit/Navigation.test.js - Navigation コンポーネントのテスト

import { Navigation } from '../../js/components/Navigation.js';

// モックの設定
let mockAuthManager;
let mockElement;

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

    // グローバルモックの設定
    global.authManager = mockAuthManager;
    global.showNotification = jest.fn();
    
    // window.location のモック設定
    delete window.location;
    window.location = {
      pathname: '/',
      href: 'http://localhost:8000/',
      search: '',
      hash: ''
    };

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
      
      // window.location.pathnameのモック
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard.html' },
        writable: true,
        configurable: true
      });

      const currentPage = navigation.getCurrentPage();
      expect(currentPage).toBe('dashboard');
    });

    test('should return index for root path', () => {
      const navigation = new Navigation();
      
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
        configurable: true
      });

      const currentPage = navigation.getCurrentPage();
      expect(currentPage).toBe('index');
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
      await navigation.initialize();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await navigation.initialize();
      
      expect(consoleSpy).not.toHaveBeenCalledWith('🔄 Initializing navigation...');
      consoleSpy.mockRestore();
    });

    test('should handle initialization errors', async () => {
      const navigation = new Navigation();
      
      // authManagerを無効にしてエラーを発生させる
      global.authManager = null;
      
      await expect(navigation.initialize()).rejects.toThrow();
    });
  });

  describe('generateBasicHeader', () => {
    test('should generate header HTML', () => {
      const navigation = new Navigation();
      const headerHTML = navigation.generateBasicHeader();
      
      expect(headerHTML).toContain('header');
      expect(headerHTML).toContain('nav');
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
      const mobileSidebar = document.getElementById('mobile-sidebar');
      
      navigation.toggleMobileSidebar();
      
      expect(mobileSidebar.classList.toggle).toHaveBeenCalledWith('hidden');
    });
  });

  describe('closeMobileSidebar', () => {
    test('should close mobile sidebar', () => {
      const navigation = new Navigation();
      const mobileSidebar = document.getElementById('mobile-sidebar');
      
      navigation.closeMobileSidebar();
      
      expect(mobileSidebar.classList.contains).toHaveBeenCalledWith('hidden');
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
      const event = { preventDefault: jest.fn() };
      
      // 認証されていない状態をモック
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      
      await navigation.handleNavigationClick(navLink, event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(global.showNotification).toHaveBeenCalledWith('ログインが必要です', 'warning');
    });
  });

  describe('handleLogout', () => {
    test('should handle logout successfully', async () => {
      const navigation = new Navigation();
      
      await navigation.handleLogout();
      
      expect(mockAuthManager.logout).toHaveBeenCalled();
      expect(global.showNotification).toHaveBeenCalledWith('ログアウトしました', 'success');
    });

    test('should handle logout errors', async () => {
      const navigation = new Navigation();
      const error = new Error('Logout failed');
      mockAuthManager.logout.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await navigation.handleLogout();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', error);
      expect(global.showNotification).toHaveBeenCalledWith('ログアウトに失敗しました', 'error');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateNavigationForAuth', () => {
    test('should update navigation for authenticated user', async () => {
      const navigation = new Navigation();
      
      await navigation.updateNavigationForAuth();
      
      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
    });

    test('should update navigation for unauthenticated user', async () => {
      const navigation = new Navigation();
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      
      await navigation.updateNavigationForAuth();
      
      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
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

  describe('destroy', () => {
    test('should destroy navigation', () => {
      const navigation = new Navigation();
      navigation.isInitialized = true;
      
      navigation.destroy();
      
      expect(navigation.isInitialized).toBe(false);
    });
  });
});