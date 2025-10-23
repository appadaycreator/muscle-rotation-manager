// tests/unit/Navigation.test.js - Navigationコンポーネントのテスト

import { Navigation } from '../../js/components/Navigation.js';

describe('Navigation', () => {
  let navigation;
  let mockAuthManager;

  beforeEach(() => {
    // DOM要素の設定
    document.body.innerHTML = `
      <div id="header-container"></div>
      <div id="sidebar-container"></div>
      <div id="mobile-menu-btn"></div>
      <div id="mobile-sidebar-close"></div>
      <div id="mobile-sidebar"></div>
      <div id="logout-btn"></div>
      <div id="user-info"></div>
    `;

    // モックの設定
    mockAuthManager = {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      getCurrentUser: jest.fn().mockReturnValue({ email: 'test@example.com' }),
      logout: jest.fn().mockResolvedValue()
    };

    // グローバルモックの設定
    global.authManager = mockAuthManager;
    global.showNotification = jest.fn();
    
    // DOM要素のモック設定
    const mockElement = {
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
      removeChild: jest.fn()
    };

    document.getElementById = jest.fn((id) => {
      if (id === 'mobile-sidebar') {
        return { ...mockElement, classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } };
      }
      return mockElement;
    });

    navigation = new Navigation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (navigation) {
      navigation.destroy();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(navigation.isInitialized).toBe(false);
      expect(navigation.currentPage).toBe('');
      expect(navigation.navigationItems).toHaveLength(8);
    });
  });

  describe('getCurrentPage', () => {
    test('should return current page from URL', () => {
      // window.location.pathnameのモック
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard.html' },
        writable: true
      });

      const page = navigation.getCurrentPage();
      expect(page).toBe('dashboard');
    });

    test('should return index for root path', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true
      });

      const page = navigation.getCurrentPage();
      expect(page).toBe('index');
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      // fetchのモック
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<div>Header content</div>')
      });

      const setupEventListenersSpy = jest.spyOn(navigation, 'setupEventListeners');
      const updateNavigationForAuthSpy = jest.spyOn(navigation, 'updateNavigationForAuth');

      await navigation.initialize();

      expect(navigation.isInitialized).toBe(true);
      expect(setupEventListenersSpy).toHaveBeenCalled();
      expect(updateNavigationForAuthSpy).toHaveBeenCalled();
    });

    test('should not initialize if already initialized', async () => {
      navigation.isInitialized = true;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await navigation.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('🔄 Initializing navigation...');
      consoleSpy.mockRestore();
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      global.fetch = jest.fn().mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(navigation.initialize()).rejects.toThrow('Initialization failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to initialize navigation:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('generateBasicHeader', () => {
    test('should generate header HTML', () => {
      const headerHTML = navigation.generateBasicHeader();
      
      expect(headerHTML).toContain('MuscleRotationManager');
      expect(headerHTML).toContain('header');
      expect(headerHTML).toContain('mobile-menu-btn');
      expect(headerHTML).toContain('logout-btn');
    });
  });

  describe('generateBasicSidebar', () => {
    test('should generate sidebar HTML', () => {
      navigation.currentPage = 'dashboard';
      const sidebarHTML = navigation.generateBasicSidebar();
      
      expect(sidebarHTML).toContain('MuscleRotationManager');
      expect(sidebarHTML).toContain('nav');
      expect(sidebarHTML).toContain('dashboard');
    });
  });

  describe('toggleMobileSidebar', () => {
    test('should toggle mobile sidebar visibility', () => {
      const mobileSidebar = document.getElementById('mobile-sidebar');
      mobileSidebar.classList.add('hidden');
      
      navigation.toggleMobileSidebar();
      expect(mobileSidebar.classList.contains('hidden')).toBe(false);
      
      navigation.toggleMobileSidebar();
      expect(mobileSidebar.classList.contains('hidden')).toBe(true);
    });
  });

  describe('closeMobileSidebar', () => {
    test('should close mobile sidebar', () => {
      const mobileSidebar = document.getElementById('mobile-sidebar');
      mobileSidebar.classList.remove('hidden');
      
      navigation.closeMobileSidebar();
      expect(mobileSidebar.classList.contains('hidden')).toBe(true);
    });
  });

  describe('handleNavigationClick', () => {
    test('should handle navigation click for authenticated user', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(true);
      
      const mockNavLink = {
        getAttribute: jest.fn().mockReturnValue('/dashboard.html'),
        closest: jest.fn().mockReturnValue(mockNavLink)
      };
      
      const closeMobileSidebarSpy = jest.spyOn(navigation, 'closeMobileSidebar');
      
      await navigation.handleNavigationClick(mockNavLink);
      
      expect(closeMobileSidebarSpy).toHaveBeenCalled();
    });

    test('should prevent navigation for unauthenticated user', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      
      const mockNavLink = {
        getAttribute: jest.fn().mockReturnValue('/dashboard.html'),
        closest: jest.fn().mockReturnValue(mockNavLink)
      };
      
      const mockEvent = { preventDefault: jest.fn() };
      mockNavLink.closest.mockReturnValue(mockNavLink);
      
      await navigation.handleNavigationClick(mockNavLink);
      
      expect(global.showNotification).toHaveBeenCalledWith('ログインが必要です', 'warning');
    });
  });

  describe('handleLogout', () => {
    test('should handle logout successfully', async () => {
      await navigation.handleLogout();
      
      expect(mockAuthManager.logout).toHaveBeenCalled();
      expect(global.showNotification).toHaveBeenCalledWith('ログアウトしました', 'success');
    });

    test('should handle logout errors', async () => {
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
      const user = { email: 'test@example.com' };
      mockAuthManager.isAuthenticated.mockResolvedValue(true);
      mockAuthManager.getCurrentUser.mockReturnValue(user);
      
      await navigation.updateNavigationForAuth();
      
      const userInfo = document.getElementById('user-info');
      const logoutBtn = document.getElementById('logout-btn');
      
      expect(userInfo.textContent).toBe('こんにちは、test@example.comさん');
      expect(logoutBtn.style.display).toBe('block');
    });

    test('should update navigation for unauthenticated user', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValue(false);
      
      await navigation.updateNavigationForAuth();
      
      const userInfo = document.getElementById('user-info');
      const logoutBtn = document.getElementById('logout-btn');
      
      expect(userInfo.textContent).toBe('');
      expect(logoutBtn.style.display).toBe('none');
    });
  });

  describe('addEventListener', () => {
    test('should add event listener to element', () => {
      const element = document.createElement('button');
      const handler = jest.fn();
      
      navigation.addEventListener(element, 'click', handler);
      
      // イベントリスナーが追加されたかテスト
      element.click();
      expect(handler).toHaveBeenCalled();
    });

    test('should not add listener if element is null', () => {
      const handler = jest.fn();
      
      navigation.addEventListener(null, 'click', handler);
      
      // エラーが発生しないことを確認
      expect(true).toBe(true);
    });
  });

  describe('destroy', () => {
    test('should destroy navigation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      navigation.destroy();
      
      expect(navigation.isInitialized).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('🗑️ Navigation destroyed');
      
      consoleSpy.mockRestore();
    });
  });
});
