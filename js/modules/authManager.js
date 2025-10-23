// authManager.js - 認証管理

import { supabaseService } from '../services/supabaseService.js';
import { showNotification } from '../utils/helpers.js';
import { pageManager } from './pageManager.js';

class AuthManager {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * 認証管理を初期化
     */
    async initialize() {
        if (this.isInitialized) {return;}

        this.setupEventListeners();
        await this.checkCurrentSession();
        this.setupAuthStateListener();

        this.isInitialized = true;
        console.log('AuthManager initialized');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (!supabaseService.isAvailable()) {
                    showNotification('Supabaseが設定されていません。設定を確認してください。', 'error');
                    return;
                }
                this.showAuthModal('login');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.handleLogout();
            });
        }
    }

    /**
     * 現在のセッションをチェック
     */
    async checkCurrentSession() {
        const user = await supabaseService.checkCurrentSession();
        this.updateAuthUI();
        return user;
    }

    /**
     * 認証状態の変更を監視
     */
    setupAuthStateListener() {
        supabaseService.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                showNotification('ログインしました', 'success');
            } else if (event === 'SIGNED_OUT') {
                showNotification('ログアウトしました', 'success');
            }
            this.updateAuthUI();
        });
    }

    /**
     * 認証UIを更新
     */
    updateAuthUI() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const currentUser = supabaseService.getCurrentUser();

        console.log('Updating auth UI, currentUser:', currentUser);

        if (currentUser) {
            console.log('User is logged in, hiding login button, showing logout button');
            if (loginBtn) {
                loginBtn.classList.add('hidden');
                console.log('Login button hidden');
            }
            if (logoutBtn) {
                logoutBtn.classList.remove('hidden');
                console.log('Logout button shown');
            }
        } else {
            console.log('User is not logged in, showing login button, hiding logout button');
            if (loginBtn) {
                loginBtn.classList.remove('hidden');
                console.log('Login button shown');
            }
            if (logoutBtn) {
                logoutBtn.classList.add('hidden');
                console.log('Logout button hidden');
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
            this.updateAuthUI();
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

        if (!email || !password) {
            this.showAuthError(errorDiv, 'メールアドレスとパスワードを入力してください');
            return;
        }

        try {
            console.log('Attempting login with email:', email);
            await supabaseService.signIn(email, password);

            // エラーをクリア
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.classList.add('hidden');
            }

            // UIを更新してモーダルを閉じる
            this.updateAuthUI();
            this.hideAuthModal();
            showNotification('ログインしました', 'success');

        } catch (error) {
            console.error('Login error:', error);
            this.showAuthError(errorDiv, error.message || 'ログインに失敗しました');
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
        const errorDiv = document.getElementById('signup-error');

        if (!email || !password) {
            this.showAuthError(errorDiv, 'メールアドレスとパスワードを入力してください');
            return;
        }

        try {
            await supabaseService.signUp(email, password);

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
     * 現在のユーザーを取得
     * @returns {Object|null} ユーザーオブジェクト
     */
    getCurrentUser() {
        return supabaseService.getCurrentUser();
    }
}

// シングルトンインスタンスをエクスポート
export const authManager = new AuthManager();
