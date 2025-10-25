/**
 * SettingsPage テストスイート
 */

import settingsPage from '../../js/pages/settingsPage.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { authManager } from '../../js/modules/authManager.js';
import { safeAsync, safeGetElement } from '../../js/utils/helpers.js';
import { globalFormValidator } from '../../js/utils/validation.js';
import { tooltipManager } from '../../js/utils/TooltipManager.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        onAuthStateChange: jest.fn(),
        getCurrentUser: jest.fn(),
        isAvailable: jest.fn(),
        getUserProfile: jest.fn()
    }
}));

jest.mock('../../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn(),
        updateAuthUI: jest.fn()
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    safeAsync: jest.fn(),
    safeGetElement: jest.fn()
}));

jest.mock('../../js/utils/validation.js', () => ({
    globalFormValidator: {
        validateField: jest.fn(),
        clearErrors: jest.fn()
    }
}));

jest.mock('../../js/utils/TooltipManager.js', () => ({
    tooltipManager: {
        initialize: jest.fn(),
        addTooltip: jest.fn()
    }
}));

describe('SettingsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="main-content"></div>';
        safeGetElement.mockReturnValue(document.querySelector('#main-content'));
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(settingsPage.userProfile).toBe(null);
            expect(settingsPage.isLoading).toBe(false);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully when authenticated', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            authManager.isAuthenticated.mockResolvedValue(true);
            authManager.updateAuthUI.mockResolvedValue();
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await settingsPage.initialize();
            
            expect(consoleSpy).toHaveBeenCalledWith('Settings page initialized');
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(authManager.updateAuthUI).toHaveBeenCalled();
            expect(supabaseService.onAuthStateChange).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it('should show login prompt when not authenticated', async () => {
            authManager.isAuthenticated.mockResolvedValue(false);
            
            await settingsPage.initialize();
            
            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(authManager.updateAuthUI).not.toHaveBeenCalled();
        });

        it('should setup auth state listener', async () => {
            authManager.isAuthenticated.mockResolvedValue(true);
            authManager.updateAuthUI.mockResolvedValue();
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await settingsPage.initialize();
            
            expect(supabaseService.onAuthStateChange).toHaveBeenCalled();
        });
    });

    describe('setupAuthStateListener', () => {
        it('should setup auth state change listener', () => {
            const mockCallback = jest.fn();
            supabaseService.onAuthStateChange.mockImplementation((callback) => {
                mockCallback.mockImplementation(callback);
            });
            
            settingsPage.setupAuthStateListener();
            
            expect(supabaseService.onAuthStateChange).toHaveBeenCalled();
        });

        it('should handle sign out event', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockCallback = jest.fn();
            
            supabaseService.onAuthStateChange.mockImplementation((callback) => {
                mockCallback.mockImplementation(callback);
            });
            
            settingsPage.setupAuthStateListener();
            
            // シミュレート: ユーザーがサインアウト
            await mockCallback('SIGNED_OUT', null);
            
            expect(consoleSpy).toHaveBeenCalledWith('User signed out, showing login prompt');
            
            consoleSpy.mockRestore();
        });
    });

    describe('showLoginPrompt', () => {
        it('should render login prompt', () => {
            settingsPage.showLoginPrompt();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('ログインが必要です');
            expect(mainContent.innerHTML).toContain('ログイン');
            expect(mainContent.innerHTML).toContain('ホームに戻る');
        });

        it('should return early if main content is not found', () => {
            safeGetElement.mockReturnValue(null);
            
            expect(() => settingsPage.showLoginPrompt()).not.toThrow();
        });
    });

    describe('renderSettingsPage', () => {
        it('should render settings page content', () => {
            settingsPage.renderSettingsPage();
            
            const mainContent = document.querySelector('#main-content');
            expect(mainContent.innerHTML).toContain('設定');
        });
    });

    describe('setupTooltips', () => {
        it('should setup tooltips for settings page', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            settingsPage.setupTooltips();
            
            expect(tooltipManager.addTooltip).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Setting up tooltips for settings page');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Tooltips setup complete for settings page');
            
            consoleSpy.mockRestore();
        });

        it('should handle tooltip setup errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            tooltipManager.addTooltip.mockImplementation(() => {
                throw new Error('Tooltip setup failed');
            });
            
            settingsPage.setupTooltips();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '❌ Failed to setup tooltips:', 
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow when authenticated', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            authManager.isAuthenticated.mockResolvedValue(true);
            authManager.updateAuthUI.mockResolvedValue();
            safeAsync.mockImplementation(async (fn) => await fn());
            
            await settingsPage.initialize();
            
            expect(consoleSpy).toHaveBeenCalledWith('Settings page initialized');
            expect(tooltipManager.initialize).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it('should handle initialization errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            authManager.isAuthenticated.mockRejectedValue(new Error('Auth check failed'));
            
            try {
                await settingsPage.initialize();
            } catch (error) {
                // エラーが発生することを確認
                expect(error.message).toBe('Auth check failed');
            }
            
            consoleSpy.mockRestore();
        });
    });
});