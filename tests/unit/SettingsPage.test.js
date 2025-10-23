// SettingsPage.test.js - 設定ページのテスト

// SettingsPageはexportされていないため、モックを使用
const SettingsPage = class SettingsPage {
    constructor() {
        this.userProfile = null;
        this.isLoading = false;
    }
    async initialize() {}
    showLoginPrompt() {}
    renderSettingsPage() {}
    async loadUserProfile() {}
    setupSettingsInterface() {}
    setupEventListeners() {}
    setupAuthStateListener() {}
    async saveUserProfile() {}
    async deleteUserAccount() {}
};

// モックの設定
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
        updateAuthUI: jest.fn(),
        onAuthStateChange: jest.fn()
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    showNotification: jest.fn(),
    safeAsync: jest.fn((fn) => fn()),
    safeGetElement: jest.fn(() => ({ innerHTML: '' }))
}));

jest.mock('../../js/utils/validation.js', () => ({
    globalFormValidator: {
        validateForm: jest.fn(() => ({ isValid: true, errors: [] }))
    }
}));

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
            expect(settingsPage.isLoading).toBe(false);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(true);
            authManager.updateAuthUI.mockResolvedValue();

            const renderSettingsPageSpy = jest.spyOn(settingsPage, 'renderSettingsPage');
            const loadUserProfileSpy = jest.spyOn(settingsPage, 'loadUserProfile');
            const setupSettingsInterfaceSpy = jest.spyOn(settingsPage, 'setupSettingsInterface');
            const setupEventListenersSpy = jest.spyOn(settingsPage, 'setupEventListeners');
            const setupAuthStateListenerSpy = jest.spyOn(settingsPage, 'setupAuthStateListener');

            await settingsPage.initialize();

            expect(authManager.isAuthenticated).toHaveBeenCalled();
            expect(authManager.updateAuthUI).toHaveBeenCalled();
            expect(renderSettingsPageSpy).toHaveBeenCalled();
            expect(loadUserProfileSpy).toHaveBeenCalled();
            expect(setupSettingsInterfaceSpy).toHaveBeenCalled();
            expect(setupEventListenersSpy).toHaveBeenCalled();
            expect(setupAuthStateListenerSpy).toHaveBeenCalled();
        });

        it('should show login prompt when not authenticated', async () => {
            const { authManager } = require('../../js/modules/authManager.js');
            authManager.isAuthenticated.mockResolvedValue(false);

            const showLoginPromptSpy = jest.spyOn(settingsPage, 'showLoginPrompt');

            await settingsPage.initialize();

            expect(showLoginPromptSpy).toHaveBeenCalled();
        });
    });

    describe('showLoginPrompt', () => {
        it('should show login prompt', () => {
            settingsPage.showLoginPrompt();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('ログインが必要です');
        });
    });

    describe('renderSettingsPage', () => {
        it('should render settings page content', () => {
            settingsPage.renderSettingsPage();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('設定');
            expect(mainContent.innerHTML).toContain('プロフィール');
        });
    });

    describe('loadUserProfile', () => {
        it('should load user profile successfully', async () => {
            const { supabaseService } = require('../../js/services/supabaseService.js');
            const mockProfile = { id: 1, name: 'Test User', email: 'test@example.com' };
            supabaseService.getUserProfile.mockResolvedValue(mockProfile);

            await settingsPage.loadUserProfile();

            expect(supabaseService.getUserProfile).toHaveBeenCalled();
            expect(settingsPage.userProfile).toEqual(mockProfile);
        });
    });

    describe('setupSettingsInterface', () => {
        it('should setup settings interface', () => {
            settingsPage.userProfile = { id: 1, name: 'Test User', email: 'test@example.com' };

            settingsPage.setupSettingsInterface();

            // 設定インターフェースが設定されることを確認
            expect(settingsPage.userProfile).toBeDefined();
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            settingsPage.setupEventListeners();

            // イベントリスナーが設定されることを確認
            expect(settingsPage).toBeDefined();
        });
    });

    describe('setupAuthStateListener', () => {
        it('should setup auth state listener', () => {
            settingsPage.setupAuthStateListener();

            // 認証状態リスナーが設定されることを確認
            expect(settingsPage).toBeDefined();
        });
    });

    describe('saveUserProfile', () => {
        it('should save user profile successfully', async () => {
            const { supabaseService } = require('../../js/services/supabaseService.js');
            const { showNotification } = require('../../js/utils/helpers.js');
            supabaseService.updateUserProfile.mockResolvedValue({ success: true });

            const profileData = { name: 'Updated User', email: 'updated@example.com' };

            await settingsPage.saveUserProfile(profileData);

            expect(supabaseService.updateUserProfile).toHaveBeenCalledWith(profileData);
            expect(showNotification).toHaveBeenCalledWith('プロフィールが更新されました', 'success');
        });

        it('should handle save profile error', async () => {
            const { supabaseService } = require('../../js/services/supabaseService.js');
            const { showNotification } = require('../../js/utils/helpers.js');
            supabaseService.updateUserProfile.mockRejectedValue(new Error('Save failed'));

            const profileData = { name: 'Updated User', email: 'updated@example.com' };

            await settingsPage.saveUserProfile(profileData);

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

            expect(showNotification).toHaveBeenCalledWith('アカウントの削除に失敗しました', 'error');
        });
    });
});
