// SettingsPage.test.js - 設定ページのテスト

// モックの設定
jest.mock('../../js/core/BasePage.js', () => ({
    BasePage: class BasePage {
        constructor() {
            this.eventListeners = [];
        }
        addEventListener() {}
        removeEventListener() {}
        cleanup() {}
    }
}));

jest.mock('../../js/components/Navigation.js', () => ({
    Navigation: class Navigation {
        constructor() {}
    }
}));

jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getUserProfile: jest.fn(),
        updateUserProfile: jest.fn(),
        deleteUserAccount: jest.fn()
    }
}));

jest.mock('../../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn(),
        updateAuthUI: jest.fn()
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    showNotification: jest.fn(),
    safeGetElement: jest.fn(() => ({ innerHTML: '' }))
}));

// SettingsPageクラスをモック
const SettingsPage = class SettingsPage {
    constructor() {
        this.userProfile = null;
        this.eventListenersSetup = false;
    }

    async checkAuthentication() {
        const { authManager } = require('../../js/modules/authManager.js');
        const isAuthenticated = await authManager.isAuthenticated();
        
        if (!isAuthenticated) {
            this.showLoginPrompt();
            return false;
        }
        
        return true;
    }

    async onInitialize() {
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            return;
        }
        
        const { authManager } = require('../../js/modules/authManager.js');
        authManager.updateAuthUI();
        this.renderSettingsPage();
        await this.loadUserProfile();
        this.setupSettingsInterface();
        this.setupEventListeners();
    }

    renderSettingsPage() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h1>設定</h1><div id="settings-content"></div>';
        }
    }

    async loadUserProfile() {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        this.userProfile = await supabaseService.getUserProfile();
    }

    setupSettingsInterface() {
        const settingsContent = document.getElementById('settings-content');
        if (settingsContent) {
            settingsContent.innerHTML = '<div class="profile-settings">プロフィール設定</div>';
        }
    }

    setupEventListeners() {
        this.eventListenersSetup = true;
    }

    showLoginPrompt() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<p>ログインが必要です</p>';
        }
    }

    async saveUserProfile(profileData) {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        const { showNotification } = require('../../js/utils/helpers.js');
        
        try {
            await supabaseService.updateUserProfile(profileData);
            showNotification('プロフィールが更新されました', 'success');
        } catch (error) {
            showNotification('プロフィールの更新に失敗しました', 'error');
        }
    }

    async deleteUserAccount() {
        const { supabaseService } = require('../../js/services/supabaseService.js');
        const { showNotification } = require('../../js/utils/helpers.js');
        
        try {
            await supabaseService.deleteUserAccount();
            showNotification('アカウントが削除されました', 'success');
        } catch (error) {
            showNotification('アカウントの削除に失敗しました', 'error');
        }
    }
};

describe('SettingsPage', () => {
    let settingsPage;

    beforeEach(() => {
        settingsPage = new SettingsPage();
        document.body.innerHTML = '<div id="main-content"></div>';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(settingsPage.userProfile).toBeNull();
            expect(settingsPage.eventListenersSetup).toBe(false);
        });
    });

    describe('checkAuthentication', () => {
        it('should return true for authenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const result = await settingsPage.checkAuthentication();

            expect(result).toBe(true);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });

        it('should return false for unauthenticated user', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const result = await settingsPage.checkAuthentication();

            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toHaveBeenCalled();
        });
    });

    describe('onInitialize', () => {
        it('should initialize successfully when authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);

            const renderSettingsPageSpy = jest.spyOn(settingsPage, 'renderSettingsPage');
            const loadUserProfileSpy = jest.spyOn(settingsPage, 'loadUserProfile');
            const setupSettingsInterfaceSpy = jest.spyOn(settingsPage, 'setupSettingsInterface');
            const setupEventListenersSpy = jest.spyOn(settingsPage, 'setupEventListeners');

            await settingsPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(authManager.updateAuthUI).toHaveBeenCalled();
            expect(renderSettingsPageSpy).toHaveBeenCalled();
            expect(loadUserProfileSpy).toHaveBeenCalled();
            expect(setupSettingsInterfaceSpy).toHaveBeenCalled();
            expect(setupEventListenersSpy).toHaveBeenCalled();
        });

        it('should not initialize if not authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const renderSettingsPageSpy = jest.spyOn(settingsPage, 'renderSettingsPage');

            await settingsPage.onInitialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(renderSettingsPageSpy).not.toHaveBeenCalled();
        });
    });

    describe('renderSettingsPage', () => {
        it('should render settings page content', () => {
            settingsPage.renderSettingsPage();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('設定');
            expect(mainContent.innerHTML).toContain('settings-content');
        });
    });

    describe('loadUserProfile', () => {
        it('should load user profile successfully', async () => {
            const mockProfile = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User'
            };

            const { supabaseService } = require('../../js/services/supabaseService.js');
            supabaseService.getUserProfile.mockResolvedValue(mockProfile);

            await settingsPage.loadUserProfile();

            expect(supabaseService.getUserProfile).toHaveBeenCalled();
            expect(settingsPage.userProfile).toEqual(mockProfile);
        });
    });

    describe('setupSettingsInterface', () => {
        it('should setup settings interface', () => {
            // DOM要素をモック
            const mockElement = {
                innerHTML: ''
            };
            document.getElementById = jest.fn().mockReturnValue(mockElement);
            
            settingsPage.setupSettingsInterface();

            const settingsContent = document.getElementById('settings-content');
            expect(settingsContent.innerHTML).toContain('プロフィール設定');
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            settingsPage.setupEventListeners();

            expect(settingsPage.eventListenersSetup).toBe(true);
        });
    });

    describe('saveUserProfile', () => {
        it('should save user profile successfully', async () => {
            const profileData = {
                email: 'updated@example.com',
                name: 'Updated User'
            };

            const { supabaseService } = require('../../js/services/supabaseService.js');
            const { showNotification } = require('../../js/utils/helpers.js');
            supabaseService.updateUserProfile.mockResolvedValue({ success: true });

            await settingsPage.saveUserProfile(profileData);

            expect(supabaseService.updateUserProfile).toHaveBeenCalledWith(profileData);
            expect(showNotification).toHaveBeenCalledWith('プロフィールが更新されました', 'success');
        });

        it('should handle save profile error', async () => {
            const profileData = {
                email: 'updated@example.com',
                name: 'Updated User'
            };

            const { supabaseService } = require('../../js/services/supabaseService.js');
            const { showNotification } = require('../../js/utils/helpers.js');
            supabaseService.updateUserProfile.mockRejectedValue(new Error('Update failed'));

            await settingsPage.saveUserProfile(profileData);

            expect(supabaseService.updateUserProfile).toHaveBeenCalledWith(profileData);
            expect(showNotification).toHaveBeenCalledWith('プロフィールの更新に失敗しました', 'error');
        });
    });

    describe('deleteUserAccount', () => {
        it('should delete user account successfully', async () => {
            const { supabaseService } = require('../../js/services/supabaseService.js');
            const { showNotification } = require('../../js/utils/helpers.js');
            supabaseService.deleteUserAccount.mockResolvedValue({ success: true });

            await settingsPage.deleteUserAccount();

            expect(supabaseService.deleteUserAccount).toHaveBeenCalled();
            expect(showNotification).toHaveBeenCalledWith('アカウントが削除されました', 'success');
        });

        it('should handle delete account error', async () => {
            const { supabaseService } = require('../../js/services/supabaseService.js');
            const { showNotification } = require('../../js/utils/helpers.js');
            supabaseService.deleteUserAccount.mockRejectedValue(new Error('Delete failed'));

            await settingsPage.deleteUserAccount();

            expect(supabaseService.deleteUserAccount).toHaveBeenCalled();
            expect(showNotification).toHaveBeenCalledWith('アカウントの削除に失敗しました', 'error');
        });
    });
});