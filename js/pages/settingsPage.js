// settingsPage.js - 設定ページの機能

import { supabaseService } from '../services/supabaseService.js';
import {
    showNotification,
    safeAsync,
    safeGetElement
} from '../utils/helpers.js';

class SettingsPage {
    constructor() {
        this.userProfile = null;
        this.isLoading = false;
    }

    /**
     * 設定ページを初期化
     */
    async initialize() {
        console.log('Settings page initialized');

        await safeAsync(
            async () => {
                await this.loadUserProfile();
                this.setupSettingsInterface();
                this.setupEventListeners();
            },
            '設定ページの初期化'
        );
    }

    /**
     * ユーザープロフィールを読み込み
     */
    async loadUserProfile() {
        if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
            // ローカルストレージからプロフィールを読み込み
            this.userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            return;
        }

        try {
            this.userProfile = await supabaseService.getUserProfile() || {};
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        }
    }

    /**
     * 設定インターフェースを設定
     */
    setupSettingsInterface() {
        const container = safeGetElement('#settings-container');
        if (!container) {
            console.warn('Settings container not found');
            return;
        }

        const currentUser = supabaseService.getCurrentUser();
        const userEmail = currentUser?.email || this.userProfile.email || '';
        const userNickname = this.userProfile.nickname || '';
        const fontSize = this.userProfile.font_size || 'md';

        container.innerHTML = `
            <div class="space-y-6">
                <!-- プロフィール設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user text-blue-500 mr-2"></i>
                        プロフィール設定
                    </h2>
                    
                    <form id="profile-form" class="space-y-4">
                        <!-- ニックネーム -->
                        <div>
                            <label for="nickname" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                ニックネーム
                            </label>
                            <input type="text" 
                                   id="nickname" 
                                   name="nickname"
                                   value="${userNickname}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="ニックネームを入力">
                        </div>

                        <!-- メールアドレス -->
                        <div>
                            <label for="email" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                メールアドレス
                            </label>
                            <input type="email" 
                                   id="email" 
                                   name="email"
                                   value="${userEmail}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="メールアドレスを入力">
                        </div>

                        <!-- アバター画像 -->
                        <div>
                            <label for="avatar" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                アバター画像
                            </label>
                            <div class="flex items-center space-x-4">
                                <div id="avatar-preview" 
                                     class="w-16 h-16 bg-gray-200 rounded-full 
                                            flex items-center justify-center overflow-hidden">
                                    ${this.userProfile.avatar_url ?
        `<img src="${this.userProfile.avatar_url}" 
              alt="Avatar" class="w-full h-full object-cover">` :
        `<img src="assets/default-avatar.png" 
              alt="Default Avatar" class="w-full h-full object-cover"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <i class="fas fa-user text-gray-400 text-xl" style="display:none;"></i>`
}
                                </div>
                                <input type="file" 
                                       id="avatar" 
                                       name="avatar"
                                       accept="image/*"
                                       class="hidden">
                                <button type="button" 
                                        id="avatar-upload-btn"
                                        class="bg-gray-500 hover:bg-gray-600 text-white 
                                               px-4 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-upload mr-2"></i>
                                    画像を選択
                                </button>
                            </div>
                        </div>

                        <!-- 保存ボタン -->
                        <button type="submit" 
                                id="save-profile-btn"
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white 
                                       font-semibold py-2 px-4 rounded-lg transition-colors
                                       disabled:bg-gray-300 disabled:cursor-not-allowed">
                            <i class="fas fa-save mr-2"></i>
                            プロフィールを保存
                        </button>
                    </form>
                </div>

                <!-- 表示設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-cog text-green-500 mr-2"></i>
                        表示設定
                    </h2>
                    
                    <form id="display-form" class="space-y-4">
                        <!-- フォントサイズ -->
                        <div>
                            <label for="font-size" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                フォントサイズ
                            </label>
                            <select id="font-size" 
                                    name="font_size"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 
                                           focus:border-transparent">
                                <option value="sm" ${fontSize === 'sm' ? 'selected' : ''}>小</option>
                                <option value="md" ${fontSize === 'md' ? 'selected' : ''}>中</option>
                                <option value="lg" ${fontSize === 'lg' ? 'selected' : ''}>大</option>
                            </select>
                        </div>

                        <!-- 言語設定 -->
                        <div>
                            <label for="language" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                言語
                            </label>
                            <select id="language" 
                                    name="language"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 
                                           focus:border-transparent">
                                <option value="ja" selected>日本語</option>
                                <option value="en" disabled>English (準備中)</option>
                            </select>
                        </div>

                        <!-- 保存ボタン -->
                        <button type="submit" 
                                id="save-display-btn"
                                class="w-full bg-green-500 hover:bg-green-600 text-white 
                                       font-semibold py-2 px-4 rounded-lg transition-colors">
                            <i class="fas fa-save mr-2"></i>
                            表示設定を保存
                        </button>
                    </form>
                </div>

                <!-- データ管理 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-database text-purple-500 mr-2"></i>
                        データ管理
                    </h2>
                    
                    <div class="space-y-4">
                        <!-- データエクスポート -->
                        <button id="export-data-btn"
                                class="w-full bg-purple-500 hover:bg-purple-600 text-white 
                                       font-semibold py-2 px-4 rounded-lg transition-colors">
                            <i class="fas fa-download mr-2"></i>
                            データをエクスポート
                        </button>

                        <!-- データ削除 -->
                        <button id="delete-data-btn"
                                class="w-full bg-red-500 hover:bg-red-600 text-white 
                                       font-semibold py-2 px-4 rounded-lg transition-colors">
                            <i class="fas fa-trash mr-2"></i>
                            全データを削除
                        </button>
                    </div>
                </div>

                <!-- プライバシーポリシー -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-shield-alt text-indigo-500 mr-2"></i>
                        プライバシー
                    </h2>
                    
                    <a href="#" 
                       data-page="privacy"
                       class="inline-flex items-center text-blue-500 hover:text-blue-600 
                              transition-colors">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        プライバシーポリシーを確認
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // プロフィールフォーム
        const profileForm = safeGetElement('#profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSave(e));
        }

        // 表示設定フォーム
        const displayForm = safeGetElement('#display-form');
        if (displayForm) {
            displayForm.addEventListener('submit', (e) => this.handleDisplaySave(e));
        }

        // アバターアップロード
        const avatarUploadBtn = safeGetElement('#avatar-upload-btn');
        const avatarInput = safeGetElement('#avatar');
        if (avatarUploadBtn && avatarInput) {
            avatarUploadBtn.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // データエクスポート
        const exportBtn = safeGetElement('#export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // データ削除
        const deleteBtn = safeGetElement('#delete-data-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteAllData());
        }
    }

    /**
     * プロフィール保存処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleProfileSave(e) {
        e.preventDefault();

        if (this.isLoading) {return;}
        this.isLoading = true;

        const formData = new FormData(e.target);
        const profileData = {
            nickname: formData.get('nickname'),
            email: formData.get('email')
        };

        const success = await safeAsync(
            async () => {
                await this.saveProfile(profileData);
                return true;
            },
            'プロフィールの保存',
            false
        );

        if (success) {
            showNotification('プロフィールを保存しました', 'success');
        }

        this.isLoading = false;
    }

    /**
     * 表示設定保存処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleDisplaySave(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const displaySettings = {
            font_size: formData.get('font_size'),
            language: formData.get('language')
        };

        const success = await safeAsync(
            async () => {
                await this.saveProfile(displaySettings);
                this.applyDisplaySettings(displaySettings);
                return true;
            },
            '表示設定の保存',
            false
        );

        if (success) {
            showNotification('表示設定を保存しました', 'success');
        }
    }

    /**
     * プロフィールを保存
     * @param {Object} profileData - プロフィールデータ
     */
    async saveProfile(profileData) {
        // ローカルプロフィールを更新
        this.userProfile = { ...this.userProfile, ...profileData };
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));

        // Supabaseに保存（利用可能な場合）
        if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
            try {
                await supabaseService.saveUserProfile(profileData);
            } catch (error) {
                console.warn('Supabase profile save failed, using localStorage:', error);
            }
        }
    }

    /**
     * アバターアップロード処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) {return;}

        // ファイルサイズチェック（5MB制限）
        if (file.size > 5 * 1024 * 1024) {
            showNotification('ファイルサイズは5MB以下にしてください', 'error');
            return;
        }

        try {
            // プレビュー表示
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = safeGetElement('#avatar-preview');
                if (preview) {
                    preview.innerHTML = `
                        <img src="${e.target.result}" 
                             alt="Avatar Preview" 
                             class="w-full h-full object-cover">
                    `;
                }
            };
            reader.readAsDataURL(file);

            // Supabaseにアップロード（利用可能な場合）
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                const avatarUrl = await supabaseService.uploadAvatar(file);
                await this.saveProfile({ avatar_url: avatarUrl });
                showNotification('アバター画像をアップロードしました', 'success');
            } else {
                showNotification('アバター画像のプレビューを更新しました', 'info');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            showNotification('アバター画像のアップロードに失敗しました', 'error');
        }
    }

    /**
     * 表示設定を適用
     * @param {Object} settings - 表示設定
     */
    applyDisplaySettings(settings) {
        // フォントサイズを適用
        if (settings.font_size) {
            document.documentElement.className =
                document.documentElement.className.replace(/font-size-\w+/g, '');
            document.documentElement.classList.add(`font-size-${settings.font_size}`);
        }
    }

    /**
     * データをエクスポート
     */
    async exportData() {
        try {
            const data = {
                profile: this.userProfile,
                workoutHistory: JSON.parse(localStorage.getItem('workoutHistory') || '[]'),
                settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)],
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `muscle-rotation-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification('データをエクスポートしました', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showNotification('データのエクスポートに失敗しました', 'error');
        }
    }

    /**
     * 削除確認ダイアログを表示
     * @returns {Promise<boolean>} ユーザーの確認結果
     */
    async showDeleteConfirmDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white p-6 rounded-lg max-w-md mx-4">
                    <h3 class="text-lg font-semibold mb-4 text-red-600">データ削除の確認</h3>
                    <p class="mb-6 text-gray-700">
                        本当に全てのデータを削除しますか？<br>
                        この操作は取り消すことができません。
                    </p>
                    <div class="flex space-x-3 justify-end">
                        <button id="cancel-delete" 
                                class="px-4 py-2 bg-gray-300 text-gray-700 rounded 
                                       hover:bg-gray-400">
                            キャンセル
                        </button>
                        <button id="confirm-delete" 
                                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                            削除する
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#cancel-delete').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            modal.querySelector('#confirm-delete').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });
        });
    }

    /**
     * 全データを削除
     */
    async deleteAllData() {
        // ユーザー確認ダイアログを表示
        const confirmed = await this.showDeleteConfirmDialog();

        if (!confirmed) {return;}

        try {
            // ローカルストレージをクリア
            localStorage.removeItem('userProfile');
            localStorage.removeItem('workoutHistory');
            localStorage.removeItem('userSettings');

            // Supabaseからも削除（実装予定）
            showNotification('全てのデータを削除しました', 'success');

            // ページをリロード
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('データの削除に失敗しました', 'error');
        }
    }
}

// デフォルトエクスポート
export default new SettingsPage();
