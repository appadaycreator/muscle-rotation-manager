// authManager.js - 認証管理

import { supabaseService } from '../services/supabaseService.js';
import { showNotification } from '../utils/helpers.js';
import { pageManager } from './pageManager.js';
import { globalFormValidator, globalRealtimeValidator } from '../utils/validation.js';
import { handleError } from '../utils/errorHandler.js';

class AuthManager {
    constructor() {
        this.isInitialized = false;
        this.onlineStatusCleanup = null;
    }

    /**
     * 認証管理を初期化
     */
    async initialize() {
        if (this.isInitialized) {return;}

        // pageManagerの初期化を確認
        if (!pageManager.isInitialized) {
            await pageManager.initialize();
        }

        this.setupEventListeners();
        await this.checkCurrentSession();
        this.setupAuthStateListener();

        // 初期化後にUIを再確認
        setTimeout(() => {
            this.updateAuthUI();
        }, 1000);

        this.isInitialized = true;
        console.log('AuthManager initialized');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 既存のイベントリスナーを削除
        this.removeEventListeners();

        // グローバルなクリックイベントリスナーを設定
        document.addEventListener('click', (e) => {
            // ログインボタンのクリック（IDまたはdata-action属性）
            if (e.target.matches('#login-btn, [data-action="login"]')) {
                console.log('Login button clicked');
                e.preventDefault();
                e.stopPropagation();

                if (!supabaseService.isAvailable()) {
                    showNotification('Supabaseが設定されていません。設定を確認してください。', 'error');
                    return;
                }
                this.showAuthModal('login');
            }

            // ログアウトボタンのクリック
            if (e.target.matches('#logout-btn, [data-action="logout"]')) {
                console.log('Logout button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.handleLogout();
            }

            // アバター画像のクリック
            if (e.target.matches('#user-avatar')) {
                console.log('User avatar clicked');
                e.preventDefault();
                e.stopPropagation();
                this.toggleUserDropdown();
            }

            // プロフィール設定のクリック
            if (e.target.matches('#profile-settings')) {
                console.log('Profile settings clicked');
                e.preventDefault();
                e.stopPropagation();
                this.handleProfileSettings();
            }

            // ドロップダウンの外側をクリックした場合は閉じる
            if (!e.target.closest('#user-profile')) {
                this.closeUserDropdown();
            }
        });

        console.log('Auth event listeners setup complete');
    }

    /**
     * イベントリスナーを削除
     */
    removeEventListeners() {
        // グローバルイベントリスナーは削除しない
        // 必要に応じて個別の要素のイベントリスナーを削除
        console.log('Event listeners cleanup completed');
    }

    /**
     * 現在のセッションをチェック
     */
    async checkCurrentSession() {
        try {
            const { user } = await supabaseService.getAuthState();
            console.log('checkCurrentSession result:', { user: !!user, userId: user?.id });
            await this.updateAuthUI();
            return user;
        } catch (error) {
            console.error('Failed to check current session:', error);
            await this.updateAuthUI();
            return null;
        }
    }

    /**
     * 認証状態の変更を監視
     */
    setupAuthStateListener() {
        if (!supabaseService.isAvailable()) {
            console.log('Supabase is not available, cannot set up auth state listener');
            return;
        }

        supabaseService.onAuthStateChange(async (event, session) => {
            console.log('Auth state change detected:', { 
                event, 
                session: !!session, 
                user: !!session?.user,
                userId: session?.user?.id,
                userEmail: session?.user?.email
            });

            if (event === 'SIGNED_IN' && session) {
                showNotification('ログインしました', 'success');
                // ログイン後にページをリロードして認証状態を反映
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else if (event === 'SIGNED_OUT') {
                showNotification('ログアウトしました', 'success');
            }

            // UIを更新
            await this.updateAuthUI();
        });
    }

    /**
     * 認証UIを更新
     */
    async updateAuthUI() {
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');

        console.log('updateAuthUI called, elements found:', { 
            loginBtn: !!loginBtn, 
            userProfile: !!userProfile, 
            userAvatar: !!userAvatar 
        });

        try {
            const currentUser = await this.getCurrentUser();
            console.log('Updating auth UI, currentUser:', currentUser);

            if (currentUser) {
                console.log('User is logged in, showing user profile');
                
                // ログインボタンを非表示
                if (loginBtn) {
                    loginBtn.classList.add('hidden');
                    console.log('Login button hidden');
                }
                
                // ユーザープロフィールを表示
                if (userProfile) {
                    userProfile.classList.remove('hidden');
                    console.log('User profile shown');
                }
                
                // ユーザー情報を更新
                if (userAvatar) {
                    // アバター画像を設定（デフォルトまたはユーザーのアバター）
                    const avatarUrl = currentUser.user_metadata?.avatar_url || 'assets/default-avatar.png';
                    userAvatar.src = avatarUrl;
                    userAvatar.alt = `${currentUser.email}のアバター`;
                }
                
                if (userName) {
                    // ユーザー名を設定（display_nameまたはemail）
                    const displayName = currentUser.user_metadata?.display_name || 
                                     currentUser.user_metadata?.full_name || 
                                     currentUser.email?.split('@')[0] || 
                                     'ユーザー';
                    userName.textContent = displayName;
                }
                
                if (userEmail) {
                    userEmail.textContent = currentUser.email || '';
                }
                
            } else {
                console.log('User is not logged in, showing login button');
                
                // ログインボタンを表示
                if (loginBtn) {
                    loginBtn.classList.remove('hidden');
                    console.log('Login button shown');
                }
                
                // ユーザープロフィールを非表示
                if (userProfile) {
                    userProfile.classList.add('hidden');
                    console.log('User profile hidden');
                }
            }
        } catch (error) {
            console.error('Failed to update auth UI:', error);
            // エラーの場合は未認証状態として表示
            if (loginBtn) {
                loginBtn.classList.remove('hidden');
            }
            if (userProfile) {
                userProfile.classList.add('hidden');
            }
        }
    }

    /**
     * ログアウト処理
     */
    async handleLogout() {
        if (!supabaseService.isAvailable()) {
            showNotification('Supabaseが設定されていません。', 'error');
            return;
        }

        // ログアウト前にワークアウト履歴をlocalStorageに保存
        try {
            const history = await supabaseService.getWorkouts();
            localStorage.setItem('workoutHistory', JSON.stringify(history));
        } catch (e) {
            console.warn('ワークアウト履歴のlocalStorage保存に失敗:', e);
        }

        try {
            await supabaseService.signOut();
            console.log('Sign out completed, updating UI...');

            // UIを即座に更新
            await this.updateAuthUI();

            // 少し遅延して再度UIを更新（認証状態の変更が反映されるまで待つ）
            setTimeout(async () => {
                await this.updateAuthUI();
            }, 500);

            showNotification('ログアウトしました', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('ログアウトに失敗しました', 'error');
        }
    }

    /**
     * 認証モーダルを表示
     * @param {string} mode - モード ('login' または 'signup')
     */
    async showAuthModal(mode = 'login') {
        // 認証モーダルが既に存在するかチェック
        if (!document.getElementById('auth-modal')) {
            const content = await pageManager.loadPartial('auth-modal');
            document.body.insertAdjacentHTML('beforeend', content);
        }
        this.initializeAuthModal(mode);
    }

    /**
     * 認証モーダルを初期化
     * @param {string} mode - モード ('login' または 'signup')
     */
    initializeAuthModal(mode = 'login') {
        const authModal = document.getElementById('auth-modal');
        const authModalClose = document.getElementById('auth-modal-close');
        const authForm = document.getElementById('auth-form');
        const signupForm = document.getElementById('signup-form');
        const switchToSignup = document.getElementById('switch-to-signup');
        const switchToLogin = document.getElementById('switch-to-login');
        const authModalTitle = document.getElementById('auth-modal-title');

        if (!authModal) {return;}

        // モーダルを表示
        authModal.classList.remove('hidden');

        // モードを設定
        if (mode === 'login') {
            authForm?.classList.remove('hidden');
            signupForm?.classList.add('hidden');
            if (authModalTitle) {authModalTitle.textContent = 'ログイン';}
        } else {
            authForm?.classList.add('hidden');
            signupForm?.classList.remove('hidden');
            if (authModalTitle) {authModalTitle.textContent = '新規登録';}
        }

        // バリデーション設定
        this.setupFormValidation(authForm, signupForm);

        // イベントリスナー
        if (authModalClose) {
            authModalClose.addEventListener('click', this.hideAuthModal);
        }

        if (switchToSignup) {
            switchToSignup.addEventListener('click', () => this.showAuthModal('signup'));
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', () => this.showAuthModal('login'));
        }

        // フォーム送信
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Escapeキーで閉じる
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideAuthModal();
                window.removeEventListener('keydown', escapeHandler);
            }
        };
        window.addEventListener('keydown', escapeHandler);

        // 背景クリックで閉じる
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                this.hideAuthModal();
            }
        });
    }

    /**
     * フォームバリデーションを設定
     * @param {Element} authForm - ログインフォーム
     * @param {Element} signupForm - 新規登録フォーム
     */
    setupFormValidation(authForm, signupForm) {
        // ログインフォームのバリデーション設定
        if (authForm) {
            globalRealtimeValidator.setupAuthFormValidation(authForm);
        }

        // 新規登録フォームのバリデーション設定
        if (signupForm) {
            globalRealtimeValidator.setupAuthFormValidation(signupForm);
        }
    }

    /**
     * 認証モーダルを非表示
     */
    hideAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('hidden');
        }
    }

    /**
     * ログイン処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('auth-email')?.value;
        const password = document.getElementById('auth-password')?.value;
        const errorDiv = document.getElementById('auth-error');

        // バリデーション実行
        const sanitizedData = globalFormValidator.validateAuthForm({ email, password });

        if (!globalFormValidator.isValid()) {
            const errors = globalFormValidator.getAllErrors();
            const firstError = Object.values(errors).flat()[0];
            this.showAuthError(errorDiv, firstError);
            return;
        }

        try {
            console.log('Attempting login with email:', sanitizedData.email);
            await supabaseService.signIn(sanitizedData.email, sanitizedData.password);

            // エラーをクリア
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.classList.add('hidden');
            }

            // UIを更新してモーダルを閉じる
            await this.updateAuthUI();
            this.hideAuthModal();
            showNotification('ログインしました', 'success');

            // ログイン後にページを再読み込みしてダッシュボードを表示
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            const errorInfo = handleError(error, {
                context: 'ログイン',
                showNotification: false
            });
            this.showAuthError(errorDiv, errorInfo.message);
        }
    }

    /**
     * 新規登録処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleSignup(e) {
        e.preventDefault();

        const email = document.getElementById('signup-email')?.value;
        const password = document.getElementById('signup-password')?.value;
        const privacyAgreement = document.getElementById('privacy-agreement')?.checked;
        const errorDiv = document.getElementById('signup-error');

        // プライバシーポリシー同意チェック
        if (!privacyAgreement) {
            this.showAuthError(errorDiv, 'プライバシーポリシーへの同意が必要です');
            return;
        }

        // バリデーション実行
        const sanitizedData = globalFormValidator.validateAuthForm({ email, password });

        if (!globalFormValidator.isValid()) {
            const errors = globalFormValidator.getAllErrors();
            const firstError = Object.values(errors).flat()[0];
            this.showAuthError(errorDiv, firstError);
            return;
        }

        try {
            await supabaseService.signUp(sanitizedData.email, sanitizedData.password);

            this.hideAuthModal();
            showNotification('登録が完了しました。メールを確認してください。', 'success');

        } catch (error) {
            console.error('Signup error:', error);
            this.showAuthError(errorDiv, error.message || '新規登録に失敗しました');
        }
    }

    /**
     * 認証エラーを表示
     * @param {Element} errorDiv - エラー表示要素
     * @param {string} message - エラーメッセージ
     */
    showAuthError(errorDiv, message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    /**
     * 認証状態をチェック
     * @returns {boolean} 認証済みかどうか
     */
    async isAuthenticated() {
        try {
            // Supabaseが利用できない場合は認証失敗
            if (!supabaseService.isAvailable()) {
                console.log('Supabase not available, authentication failed');
                return false;
            }

            const { user } = await supabaseService.getAuthState();
            const isAuth = user !== null;
            console.log('Authentication check result:', { isAuth, userId: user?.id });
            return isAuth;
        } catch (error) {
            console.error('Authentication check failed:', error);
            return false;
        }
    }

    /**
     * 現在のユーザーを取得
     * @returns {Object|null} ユーザーオブジェクト
     */
    async getCurrentUser() {
        try {
            const { user } = await supabaseService.getAuthState();
            console.log('getCurrentUser result:', { user: !!user, userId: user?.id });
            return user;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }

    /**
     * ユーザードロップダウンを切り替え
     */
    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
            console.log('User dropdown toggled');
        }
    }

    /**
     * ユーザードロップダウンを閉じる
     */
    closeUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
            console.log('User dropdown closed');
        }
    }

    /**
     * プロフィール設定を処理
     */
    handleProfileSettings() {
        console.log('Opening profile settings');
        // 設定ページに遷移
        window.location.href = '/settings.html';
    }
}

// シングルトンインスタンスをエクスポート
export const authManager = new AuthManager();
