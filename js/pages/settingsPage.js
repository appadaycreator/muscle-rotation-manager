// settingsPage.js - 設定ページの機能

import { supabaseService } from '../services/supabaseService.js';
import { authManager } from '../modules/authManager.js';
import {
    showNotification,
    safeAsync,
    safeGetElement
} from '../utils/helpers.js';
import { globalFormValidator } from '../utils/validation.js';
import { tooltipManager } from '../utils/TooltipManager.js';

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

        // 認証チェックをスキップして設定ページを表示
        await safeAsync(
            async () => {
                // ツールチップ機能を初期化
                tooltipManager.initialize();

                // 設定ページのコンテンツを表示
                this.renderSettingsPage();

                await this.loadUserProfile();
                this.setupSettingsInterface();
                this.setupEventListeners();
                this.setupTooltips();
            },
            '設定ページの初期化'
        );
    }

    /**
     * 認証状態の変更を監視
     */
    setupAuthStateListener() {
        // 認証状態が変更されたときにUIを更新
        supabaseService.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed in settings page:', { event, session: !!session, user: !!session?.user });

            // 認証UIを更新
            await authManager.updateAuthUI();

            // ログアウトされた場合はログインプロンプトを表示
            if (event === 'SIGNED_OUT') {
                console.log('User signed out, showing login prompt');
                this.showLoginPrompt();
            }
        });
    }

    /**
     * ログインプロンプトを表示
     */
    showLoginPrompt() {
        const mainContent = safeGetElement('#main-content');
        if (!mainContent) {return;}

        mainContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50">
                <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                    <div class="mb-6">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">ログインが必要です</h2>
                        <p class="text-gray-600 mb-6">設定機能を使用するにはログインしてください。</p>
                    </div>
                    <div class="space-y-3">
                        <button id="login-btn" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                            ログイン
                        </button>
                        <button onclick="window.location.href='/index.html'" class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        `;

        // ログインボタンのイベントリスナーを設定
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                authManager.showAuthModal('login');
            });
        }
    }

    /**
     * 設定ページのコンテンツを表示
     */
    renderSettingsPage() {
        const mainContent = safeGetElement('#main-content');
        if (!mainContent) {return;}

        mainContent.innerHTML = `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">設定</h1>
                <p class="mt-2 text-gray-600">アプリケーションの設定を管理しましょう</p>
            </div>

            <div id="settings-container">
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                    <p>設定を読み込み中...</p>
                </div>
            </div>
        `;
    }

    /**
     * ユーザープロフィールを読み込み
     */
    async loadUserProfile() {
        console.log('Loading user profile...');

        // ローカルストレージから読み込み（認証なしでも動作）
        this.userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // サンプルプロファイルを追加（デモ用）
        if (Object.keys(this.userProfile).length === 0) {
            this.userProfile = {
                name: 'ユーザー',
                email: 'user@example.com',
                age: 30,
                height: 170,
                weight: 70,
                fitness_level: 'intermediate',
                goals: ['muscle_gain', 'strength'],
                preferences: {
                    units: 'metric',
                    theme: 'light',
                    notifications: true
                }
            };
        }
        
        console.log('Profile loaded:', this.userProfile);
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

        // デフォルト値を設定
        const profile = {
            name: this.userProfile.name || 'ユーザー',
            email: this.userProfile.email || 'user@example.com',
            age: this.userProfile.age || 30,
            height: this.userProfile.height || 170,
            weight: this.userProfile.weight || 70,
            fitness_level: this.userProfile.fitness_level || 'intermediate',
            goals: this.userProfile.goals || ['muscle_gain', 'strength'],
            preferences: this.userProfile.preferences || {
                units: 'metric',
                theme: 'light',
                notifications: true
            }
        };

        container.innerHTML = `
            <div class="space-y-6">
                <!-- プロフィール設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user text-blue-500 mr-2"></i>
                        基本プロフィール
                    </h2>
                    
                    <form id="profile-form" class="space-y-4">
                        <!-- 名前 -->
                        <div>
                            <label for="name" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                名前 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" 
                                   id="name" 
                                   name="name"
                                   value="${profile.name}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="名前を入力"
                                   required>
                            <div id="name-error" class="text-red-600 text-sm mt-1 hidden"></div>
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
                                   value="${profile.email}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="メールアドレスを入力">
                            <div id="email-error" class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>

                        <!-- 基本情報 -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label for="age" class="block text-sm font-medium text-gray-700 mb-2">
                                    年齢 <span class="text-red-500">*</span>
                                </label>
                                <input type="number" 
                                       id="age" 
                                       name="age"
                                       value="${profile.age}"
                                       min="10" max="100"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="25"
                                       required>
                                <div id="age-error" class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                            
                            <div>
                                <label for="height" class="block text-sm font-medium text-gray-700 mb-2">
                                    身長 (cm)
                                </label>
                                <input type="number" 
                                       id="height" 
                                       name="height"
                                       value="${profile.height}"
                                       min="100" max="250"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="170">
                                <div id="height-error" class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                            
                            <div>
                                <label for="weight" class="block text-sm font-medium text-gray-700 mb-2">
                                    体重 (kg)
                                </label>
                                <input type="number" 
                                       id="weight" 
                                       name="weight"
                                       value="${profile.weight}"
                                       min="30" max="200"
                                       step="0.1"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="70">
                                <div id="weight-error" class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                        </div>

                        <!-- フィットネスレベル -->
                        <div>
                            <label for="fitness_level" class="block text-sm font-medium text-gray-700 mb-2">
                                フィットネスレベル
                            </label>
                            <select id="fitness_level" 
                                    name="fitness_level"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="beginner" ${profile.fitness_level === 'beginner' ? 'selected' : ''}>初心者</option>
                                <option value="intermediate" ${profile.fitness_level === 'intermediate' ? 'selected' : ''}>中級者</option>
                                <option value="advanced" ${profile.fitness_level === 'advanced' ? 'selected' : ''}>上級者</option>
                            </select>
                        </div>

                        <!-- 目標 -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                目標
                            </label>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <label class="flex items-center">
                                    <input type="checkbox" 
                                           name="goals" 
                                           value="muscle_gain" 
                                           ${profile.goals.includes('muscle_gain') ? 'checked' : ''}
                                           class="mr-2">
                                    筋力向上
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" 
                                           name="goals" 
                                           value="strength" 
                                           ${profile.goals.includes('strength') ? 'checked' : ''}
                                           class="mr-2">
                                    筋力向上
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" 
                                           name="goals" 
                                           value="endurance" 
                                           ${profile.goals.includes('endurance') ? 'checked' : ''}
                                           class="mr-2">
                                    持久力向上
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" 
                                           name="goals" 
                                           value="weight_loss" 
                                           ${profile.goals.includes('weight_loss') ? 'checked' : ''}
                                           class="mr-2">
                                    減量
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" 
                                           name="goals" 
                                           value="maintenance" 
                                           ${profile.goals.includes('maintenance') ? 'checked' : ''}
                                           class="mr-2">
                                    維持
                                </label>
                            </div>
                        </div>

                        <!-- 保存ボタン -->
                        <div class="flex justify-end">
                            <button type="submit" 
                                    class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                                           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <i class="fas fa-save mr-2"></i>
                                保存
                            </button>
                        </div>
                    </form>
                </div>

                <!-- データ管理 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-database text-green-500 mr-2"></i>
                        データ管理
                    </h2>
                    
                    <div class="space-y-4">
                        <!-- データエクスポート -->
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 class="font-medium text-gray-800">データエクスポート</h3>
                                <p class="text-sm text-gray-600">ワークアウトデータをJSONファイルでダウンロード</p>
                            </div>
                            <button id="export-data-btn" 
                                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                <i class="fas fa-download mr-2"></i>
                                エクスポート
                            </button>
                        </div>

                        <!-- データインポート -->
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 class="font-medium text-gray-800">データインポート</h3>
                                <p class="text-sm text-gray-600">JSONファイルからワークアウトデータを読み込み</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <input type="file" 
                                       id="import-file" 
                                       accept=".json" 
                                       class="hidden">
                                <button id="import-data-btn" 
                                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                    <i class="fas fa-upload mr-2"></i>
                                    インポート
                                </button>
                            </div>
                        </div>

                        <!-- データクリア -->
                        <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                            <div>
                                <h3 class="font-medium text-red-800">データクリア</h3>
                                <p class="text-sm text-red-600">すべてのワークアウトデータを削除（復元不可）</p>
                            </div>
                            <button id="clear-data-btn" 
                                    class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                <i class="fas fa-trash mr-2"></i>
                                クリア
                            </button>
                        </div>
                    </div>
                </div>

                <!-- アプリケーション設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-cog text-purple-500 mr-2"></i>
                        アプリケーション設定
                    </h2>
                    
                    <div class="space-y-4">
                        <!-- 単位設定 -->
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-medium text-gray-800">単位</h3>
                                <p class="text-sm text-gray-600">重量の表示単位</p>
                            </div>
                            <select id="units-select" 
                                    class="px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="metric" ${profile.preferences.units === 'metric' ? 'selected' : ''}>kg</option>
                                <option value="imperial" ${profile.preferences.units === 'imperial' ? 'selected' : ''}>lbs</option>
                            </select>
                        </div>

                        <!-- テーマ設定 -->
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-medium text-gray-800">テーマ</h3>
                                <p class="text-sm text-gray-600">アプリケーションの外観</p>
                            </div>
                            <select id="theme-select" 
                                    class="px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="light" ${profile.preferences.theme === 'light' ? 'selected' : ''}>ライト</option>
                                <option value="dark" ${profile.preferences.theme === 'dark' ? 'selected' : ''}>ダーク</option>
                                <option value="auto" ${profile.preferences.theme === 'auto' ? 'selected' : ''}>自動</option>
                            </select>
                        </div>

                        <!-- 通知設定 -->
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-medium text-gray-800">通知</h3>
                                <p class="text-sm text-gray-600">ワークアウトリマインダー</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" 
                                       id="notifications-toggle" 
                                       ${profile.preferences.notifications ? 'checked' : ''}
                                       class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                          peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full 
                                          peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                                          after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                                          after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
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
              alt="Avatar" class="w-full h-full object-cover"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
        `<img src="assets/default-avatar.png" 
              alt="Default Avatar" class="w-full h-full object-cover"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <i class="fas fa-user text-gray-400 text-xl" style="display:none;"></i>`
}
                                    <i class="fas fa-user text-gray-400 text-xl" style="display:none;"></i>
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

                    </form>
                </div>

                <!-- 体力レベル設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-dumbbell text-orange-500 mr-2"></i>
                        体力レベル設定
                    </h2>
                    
                    <form id="fitness-form" class="space-y-4">
                        <!-- 体力レベル -->
                        <div>
                            <label for="fitness-level" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                現在の体力レベル
                            </label>
                            <select id="fitness-level" 
                                    name="fitness_level"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="beginner" ${profile.fitness_level === 'beginner' ? 'selected' : ''}>
                                    初心者 - トレーニング経験が少ない
                                </option>
                                <option value="intermediate" ${profile.fitness_level === 'intermediate' ? 'selected' : ''}>
                                    中級者 - 基本的なトレーニング経験がある
                                </option>
                                <option value="advanced" ${profile.fitness_level === 'advanced' ? 'selected' : ''}>
                                    上級者 - 豊富なトレーニング経験がある
                                </option>
                            </select>
                        </div>


                    </form>
                </div>

                <!-- トレーニング目標設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-target text-red-500 mr-2"></i>
                        トレーニング目標設定
                    </h2>
                    
                    <form id="goals-form" class="space-y-4">
                        <!-- 主要目標 -->
                        <div>
                            <label for="primary-goal" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                主要目標
                            </label>
                            <select id="primary-goal" 
                                    name="primary_goal"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="strength" ${profile.primary_goal === 'strength' ? 'selected' : ''}>
                                    筋力向上 - 最大筋力を高める
                                </option>
                                <option value="muscle_gain" ${profile.primary_goal === 'muscle_gain' ? 'selected' : ''}>
                                    筋肥大 - 筋肉量を増やす
                                </option>
                                <option value="endurance" ${profile.primary_goal === 'endurance' ? 'selected' : ''}>
                                    持久力 - 筋持久力を向上させる
                                </option>
                                <option value="weight_loss" ${profile.primary_goal === 'weight_loss' ? 'selected' : ''}>
                                    減量 - 体脂肪を減らす
                                </option>
                                <option value="general_fitness" ${profile.primary_goal === 'general_fitness' ? 'selected' : ''}>
                                    健康維持 - 全般的な体力向上
                                </option>
                            </select>
                        </div>

                    </form>
                </div>

                <!-- 週間トレーニング頻度設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-calendar-alt text-purple-500 mr-2"></i>
                        週間トレーニング頻度設定
                    </h2>
                    
                    <form id="frequency-form" class="space-y-4">
                        <!-- トレーニング頻度 -->
                        <div>
                            <label for="workout-frequency" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                週間トレーニング回数
                            </label>
                            <select id="workout-frequency" 
                                    name="workout_frequency"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="1" ${profile.workout_frequency === 1 ? 'selected' : ''}>週1回</option>
                                <option value="2" ${profile.workout_frequency === 2 ? 'selected' : ''}>週2回</option>
                                <option value="3" ${profile.workout_frequency === 3 ? 'selected' : ''}>週3回</option>
                                <option value="4" ${profile.workout_frequency === 4 ? 'selected' : ''}>週4回</option>
                                <option value="5" ${profile.workout_frequency === 5 ? 'selected' : ''}>週5回</option>
                                <option value="6" ${profile.workout_frequency === 6 ? 'selected' : ''}>週6回</option>
                                <option value="7" ${profile.workout_frequency === 7 ? 'selected' : ''}>毎日</option>
                            </select>
                        </div>

                        <!-- 希望トレーニング時間 -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="preferred-time" 
                                       class="block text-sm font-medium text-gray-700 mb-2">
                                    希望トレーニング時間
                                </label>
                                <input type="time" 
                                       id="preferred-time" 
                                       name="preferred_workout_time"
                                       value="${profile.preferred_workout_time}"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                              focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="workout-duration" 
                                       class="block text-sm font-medium text-gray-700 mb-2">
                                    希望トレーニング時間（分）
                                </label>
                                <select id="workout-duration" 
                                        name="preferred_workout_duration"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                               focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="30" ${profile.preferred_workout_duration === 30 ? 'selected' : ''}>30分</option>
                                    <option value="45" ${profile.preferred_workout_duration === 45 ? 'selected' : ''}>45分</option>
                                    <option value="60" ${profile.preferred_workout_duration === 60 ? 'selected' : ''}>60分</option>
                                    <option value="90" ${profile.preferred_workout_duration === 90 ? 'selected' : ''}>90分</option>
                                    <option value="120" ${profile.preferred_workout_duration === 120 ? 'selected' : ''}>120分</option>
                                </select>
                            </div>
                        </div>

                    </form>
                </div>

                <!-- 回復時間のカスタマイズ -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-bed text-indigo-500 mr-2"></i>
                        回復時間のカスタマイズ
                    </h2>
                    
                    <form id="recovery-form" class="space-y-4">
                        <!-- 回復速度設定 -->
                        <div>
                            <label for="recovery-preference" 
                                   class="block text-sm font-medium text-gray-700 mb-2">
                                回復速度設定
                            </label>
                            <select id="recovery-preference" 
                                    name="recovery_preference"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="fast" ${profile.recovery_preference === 'fast' ? 'selected' : ''}>
                                    早い - 回復が早い体質
                                </option>
                                <option value="standard" ${profile.recovery_preference === 'standard' ? 'selected' : ''}>
                                    標準 - 一般的な回復速度
                                </option>
                                <option value="slow" ${profile.recovery_preference === 'slow' ? 'selected' : ''}>
                                    遅い - 回復に時間がかかる
                                </option>
                            </select>
                        </div>

                        <!-- ライフスタイル要因 -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="sleep-hours" 
                                       class="block text-sm font-medium text-gray-700 mb-2">
                                    平均睡眠時間（時間）
                                </label>
                                <input type="number" 
                                       id="sleep-hours" 
                                       name="sleep_hours_per_night"
                                       value="${profile.sleep_hours_per_night}"
                                       step="0.5" min="4" max="12"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="7.0">
                            </div>
                            <div>
                                <label for="stress-level" 
                                       class="block text-sm font-medium text-gray-700 mb-2">
                                    ストレスレベル（1-10）
                                </label>
                                <input type="range" 
                                       id="stress-level" 
                                       name="stress_level"
                                       value="${profile.stress_level}"
                                       min="1" max="10"
                                       class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                                <div class="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>低い</span>
                                    <span id="stress-value">${profile.stress_level}</span>
                                    <span>高い</span>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>


                <!-- データ管理 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-database text-gray-500 mr-2"></i>
                        データ管理
                    </h2>
                    
                    <div class="space-y-4">
                        <!-- データエクスポート -->
                        <button id="export-data-btn"
                                class="w-full bg-gray-500 hover:bg-gray-600 text-white 
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

                <!-- 統合保存ボタン -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-center">
                        <button type="button" 
                                id="save-all-settings-btn"
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white 
                                       font-semibold py-3 px-6 rounded-lg transition-colors
                                       disabled:bg-gray-300 disabled:cursor-not-allowed">
                            <i class="fas fa-save mr-2"></i>
                            すべての設定を保存
                        </button>
                        <p class="text-sm text-gray-500 mt-2">
                            すべての設定項目を一度に保存します
                        </p>
                    </div>
                </div>

                <!-- アカウント設定 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-user-circle text-red-500 mr-2"></i>
                        アカウント管理
                    </h2>
                    
                    <div class="space-y-4">
                        <!-- 現在のユーザー情報 -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">現在のアカウント情報</h3>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <i class="fas fa-envelope text-gray-500 w-5"></i>
                                    <span class="ml-2 text-gray-700">${this.userProfile?.email || '未設定'}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-user text-gray-500 w-5"></i>
                                    <span class="ml-2 text-gray-700">${this.userProfile?.nickname || '未設定'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- ログアウトボタン -->
                        <div class="border-t pt-4">
                            <button id="logout-btn" 
                                    class="w-full bg-red-600 text-white py-3 px-4 rounded-lg 
                                           hover:bg-red-700 focus:ring-2 focus:ring-red-500 
                                           focus:ring-offset-2 transition-colors">
                                <i class="fas fa-sign-out-alt mr-2"></i>
                                ログアウト
                            </button>
                            <p class="text-sm text-gray-500 mt-2">
                                現在のセッションを終了し、ログイン画面に戻ります
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ツールチップを設定
     */
    setupTooltips() {
        try {
            console.log('Setting up tooltips for settings page');

            // 基本プロフィールのツールチップ
            tooltipManager.addTooltip('#display_name', '他のユーザーに表示される名前です。本名ではなく、ニックネームを入力してください。', {
                position: 'right',
                theme: 'primary',
                animation: 'fadeIn',
                arrow: true,
                delay: 300
            });

            tooltipManager.addTooltip('#email', 'ログインに使用するメールアドレスです。変更する場合は、認証システムで更新してください。', {
                position: 'right',
                theme: 'warning',
                animation: 'slide',
                arrow: true,
                delay: 300
            });

            tooltipManager.addTooltip('#age', '年齢は適切なトレーニング強度を計算するために使用されます。', {
                position: 'right',
                theme: 'success',
                animation: 'scale',
                arrow: true,
                delay: 300
            });

            tooltipManager.addTooltip('#weight', '現在の体重を入力してください。カロリー計算やトレーニング強度の調整に使用されます。', {
                position: 'right',
                theme: 'primary',
                animation: 'bounce',
                arrow: true,
                delay: 300
            });

            tooltipManager.addTooltip('#height', '身長を入力してください。BMI計算や適切なトレーニング強度の算出に使用されます。', {
                position: 'right',
                theme: 'success',
                animation: 'fadeIn',
                arrow: true,
                delay: 300
            });

            // 体力レベルのツールチップ
            tooltipManager.addTooltip('#fitness-level-beginner', {
                content: '筋トレを始めたばかりの方。基本的なエクササイズから始めましょう。',
                position: 'top',
                theme: 'success',
                animation: 'bounce',
                arrow: true,
                delay: 200
            });

            tooltipManager.addTooltip('#fitness-level-intermediate', {
                content: '筋トレ経験が1年以上の方。中級レベルのエクササイズに挑戦できます。',
                position: 'top',
                theme: 'warning',
                animation: 'slide',
                arrow: true,
                delay: 200
            });

            tooltipManager.addTooltip('#fitness-level-advanced', {
                content: '筋トレ経験が豊富な方。高強度のエクササイズや上級テクニックに対応できます。',
                position: 'top',
                theme: 'error',
                animation: 'scale',
                arrow: true,
                delay: 200
            });

            // 目標設定のツールチップ
            tooltipManager.addTooltip('#primary-goal-muscle_gain', {
                content: '筋肉量を増やしたい方。高強度・低回数のトレーニングがおすすめです。',
                position: 'top'
            });

            tooltipManager.addTooltip('#primary-goal-strength', {
                content: '筋力を向上させたい方。最大筋力の向上に特化したトレーニングを行います。',
                position: 'top'
            });

            tooltipManager.addTooltip('#primary-goal-endurance', {
                content: '持久力を向上させたい方。中強度・高回数のトレーニングが効果的です。',
                position: 'top'
            });

            tooltipManager.addTooltip('#primary-goal-fat_loss', {
                content: '体脂肪を減らしたい方。有酸素運動と筋力トレーニングの組み合わせがおすすめです。',
                position: 'top'
            });

            // ワークアウト頻度のツールチップ
            tooltipManager.addTooltip('#workout-frequency-1', {
                content: '週1回：初心者向け。筋肉の回復に十分な時間を確保できます。',
                position: 'top'
            });

            tooltipManager.addTooltip('#workout-frequency-2', {
                content: '週2回：初心者〜中級者向け。バランスの良いトレーニング頻度です。',
                position: 'top'
            });

            tooltipManager.addTooltip('#workout-frequency-3', {
                content: '週3回：中級者向け。最も効果的なトレーニング頻度の一つです。',
                position: 'top'
            });

            tooltipManager.addTooltip('#workout-frequency-4', {
                content: '週4回：上級者向け。分割法を使用した高頻度トレーニングです。',
                position: 'top'
            });

            tooltipManager.addTooltip('#workout-frequency-5', {
                content: '週5回：上級者向け。高度な分割法と回復管理が必要です。',
                position: 'top'
            });

            tooltipManager.addTooltip('#workout-frequency-6', {
                content: '週6回：上級者向け。プロレベルのトレーニング頻度です。',
                position: 'top'
            });

            // 回復設定のツールチップ
            tooltipManager.addTooltip('#recovery-preference-conservative', {
                content: '保守的：十分な回復時間を確保。初心者や高齢者におすすめ。',
                position: 'top'
            });

            tooltipManager.addTooltip('#recovery-preference-standard', {
                content: '標準：一般的な回復時間。ほとんどの人に適した設定です。',
                position: 'top'
            });

            tooltipManager.addTooltip('#recovery-preference-aggressive', {
                content: '積極的：短い回復時間。上級者向けの高強度トレーニング。',
                position: 'top'
            });

            // ストレスレベルのツールチップ
            tooltipManager.addTooltip('#stress-level', {
                content: '現在のストレスレベル（1-10）。高いストレスは回復に影響するため、トレーニング強度を調整します。',
                position: 'top'
            });

            // アバターアップロードのツールチップ
            tooltipManager.addTooltip('#avatar-upload-btn', {
                content: 'プロフィール画像をアップロードできます。JPG、PNG形式に対応（最大5MB）。',
                position: 'top'
            });

            // データ管理のツールチップ
            tooltipManager.addTooltip('#export-data-btn', {
                content: 'すべてのトレーニングデータをJSON形式でエクスポートします。バックアップとして使用できます。',
                position: 'top'
            });

            tooltipManager.addTooltip('#delete-data-btn', {
                content: '⚠️ 注意：すべてのトレーニングデータが削除されます。この操作は取り消せません。',
                position: 'top'
            });

            // ログアウトボタンのツールチップ
            tooltipManager.addTooltip('#logout-btn', {
                content: '現在のセッションを終了し、ログイン画面に戻ります。',
                position: 'top'
            });

            console.log('✅ Tooltips setup complete for settings page');

        } catch (error) {
            console.error('❌ Failed to setup tooltips:', error);
        }
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

        // 体力レベルフォーム
        const fitnessForm = safeGetElement('#fitness-form');
        if (fitnessForm) {
            fitnessForm.addEventListener('submit', (e) => this.handleFitnessSave(e));
        }

        // 目標設定フォーム
        const goalsForm = safeGetElement('#goals-form');
        if (goalsForm) {
            goalsForm.addEventListener('submit', (e) => this.handleGoalsSave(e));
        }

        // 頻度設定フォーム
        const frequencyForm = safeGetElement('#frequency-form');
        if (frequencyForm) {
            frequencyForm.addEventListener('submit', (e) => this.handleFrequencySave(e));
        }

        // 回復設定フォーム
        const recoveryForm = safeGetElement('#recovery-form');
        if (recoveryForm) {
            recoveryForm.addEventListener('submit', (e) => this.handleRecoverySave(e));
        }


        // ストレスレベルスライダー
        const stressSlider = safeGetElement('#stress-level');
        if (stressSlider) {
            stressSlider.addEventListener('input', (e) => {
                const stressValue = safeGetElement('#stress-value');
                if (stressValue) {
                    stressValue.textContent = e.target.value;
                }
            });
        }

        // ログアウトボタン
        const logoutBtn = safeGetElement('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
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

        // 統合保存ボタン
        const saveAllBtn = safeGetElement('#save-all-settings-btn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', () => this.handleSaveAllSettings());
        }
    }

    /**
     * 統合保存処理
     */
    async handleSaveAllSettings() {
        console.log('統合保存処理を開始');

        if (this.isLoading) {
            console.log('既に保存処理中です');
            return;
        }

        this.isLoading = true;

        // 保存ボタンを無効化
        const saveBtn = safeGetElement('#save-all-settings-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
        }

        try {
            // すべてのフォームデータを収集
            const allSettings = this.collectAllSettings();
            console.log('収集した設定データ:', allSettings);

            // 設定を保存
            await this.saveProfile(allSettings);

            showNotification('すべての設定を保存しました', 'success');
            console.log('統合保存処理が完了しました');

        } catch (error) {
            console.error('統合保存処理でエラーが発生:', error);
            showNotification('設定の保存に失敗しました', 'error');
        } finally {
            this.isLoading = false;

            // 保存ボタンを有効化
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>すべての設定を保存';
            }
        }
    }

    /**
     * すべての設定データを収集
     * @returns {Object} 収集した設定データ
     */
    collectAllSettings() {
        const settings = {};
        console.log('設定データ収集を開始');

        // プロフィール設定
        const profileForm = safeGetElement('#profile-form');
        if (profileForm) {
            const formData = new FormData(profileForm);
            settings.display_name = formData.get('display_name');
            settings.email = formData.get('email');
            settings.age = parseInt(formData.get('age')) || null;
            settings.weight = parseFloat(formData.get('weight')) || null;
            settings.height = parseFloat(formData.get('height')) || null;
            console.log('プロフィール設定を収集:', { display_name: settings.display_name, email: settings.email });
        } else {
            console.warn('プロフィール設定フォームが見つかりません');
        }

        // 体力レベル設定
        const fitnessForm = safeGetElement('#fitness-form');
        if (fitnessForm) {
            const formData = new FormData(fitnessForm);
            settings.fitness_level = formData.get('fitness_level');
            console.log('体力レベル設定を収集:', settings.fitness_level);
        } else {
            console.warn('体力レベル設定フォームが見つかりません');
        }

        // 目標設定
        const goalsForm = safeGetElement('#goals-form');
        if (goalsForm) {
            const formData = new FormData(goalsForm);
            settings.primary_goal = formData.get('primary_goal');
        }

        // 頻度設定
        const frequencyForm = safeGetElement('#frequency-form');
        if (frequencyForm) {
            const formData = new FormData(frequencyForm);
            settings.workout_frequency = parseInt(formData.get('workout_frequency')) || 3;
            settings.preferred_workout_time = formData.get('preferred_workout_time');
            settings.preferred_workout_duration = parseInt(formData.get('preferred_workout_duration')) || 60;
        }

        // 回復設定
        const recoveryForm = safeGetElement('#recovery-form');
        if (recoveryForm) {
            const formData = new FormData(recoveryForm);
            settings.recovery_preference = formData.get('recovery_preference');
            settings.sleep_hours_per_night = parseFloat(formData.get('sleep_hours_per_night')) || 7.0;
            settings.stress_level = parseInt(formData.get('stress_level')) || 5;
        }

        return settings;
    }

    /**
     * プロフィール保存処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleProfileSave(e) {
        e.preventDefault();
        console.log('Profile save form submitted');

        if (this.isLoading) {return;}
        this.isLoading = true;

        const formData = new FormData(e.target);
        const profileData = {
            display_name: formData.get('display_name'),
            email: formData.get('email'),
            age: parseInt(formData.get('age')) || null,
            weight: parseFloat(formData.get('weight')) || null,
            height: parseFloat(formData.get('height')) || null
        };

        console.log('Profile data to save:', profileData);

        // バリデーション実行
        const sanitizedData = globalFormValidator.validateProfileForm(profileData);

        if (!globalFormValidator.isValid()) {
            const errors = globalFormValidator.getAllErrors();
            this.displayFieldErrors(errors);
            this.isLoading = false;
            return;
        }

        const success = await safeAsync(
            async () => {
                await this.saveProfile(sanitizedData);
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
     * 体力レベル保存処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleFitnessSave(e) {
        e.preventDefault();
        console.log('体力レベル保存フォームが送信されました');

        if (this.isLoading) {return;}
        this.isLoading = true;

        const formData = new FormData(e.target);
        const fitnessData = {
            fitness_level: formData.get('fitness_level')
        };

        console.log('体力レベルデータ:', fitnessData);

        const success = await safeAsync(
            async () => {
                await this.saveProfile(fitnessData);
                return true;
            },
            '体力レベル設定の保存',
            false
        );

        if (success) {
            showNotification('体力レベル設定を保存しました', 'success');
        }

        this.isLoading = false;
    }

    /**
     * 目標設定保存処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleGoalsSave(e) {
        e.preventDefault();

        if (this.isLoading) {return;}
        this.isLoading = true;

        const formData = new FormData(e.target);
        const goalsData = {
            primary_goal: formData.get('primary_goal')
        };

        const success = await safeAsync(
            async () => {
                await this.saveProfile(goalsData);
                return true;
            },
            '目標設定の保存',
            false
        );

        if (success) {
            showNotification('目標設定を保存しました', 'success');
        }

        this.isLoading = false;
    }

    /**
     * 頻度設定保存処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleFrequencySave(e) {
        e.preventDefault();

        if (this.isLoading) {return;}
        this.isLoading = true;

        const formData = new FormData(e.target);
        const frequencyData = {
            workout_frequency: parseInt(formData.get('workout_frequency')) || 3,
            preferred_workout_time: formData.get('preferred_workout_time'),
            preferred_workout_duration: parseInt(formData.get('preferred_workout_duration')) || 60
        };

        const success = await safeAsync(
            async () => {
                await this.saveProfile(frequencyData);
                return true;
            },
            '頻度設定の保存',
            false
        );

        if (success) {
            showNotification('頻度設定を保存しました', 'success');
        }

        this.isLoading = false;
    }

    /**
     * 回復設定保存処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleRecoverySave(e) {
        e.preventDefault();

        if (this.isLoading) {return;}
        this.isLoading = true;

        const formData = new FormData(e.target);
        const recoveryData = {
            recovery_preference: formData.get('recovery_preference'),
            sleep_hours_per_night: parseFloat(formData.get('sleep_hours_per_night')) || 7.0,
            stress_level: parseInt(formData.get('stress_level')) || 5
        };

        const success = await safeAsync(
            async () => {
                await this.saveProfile(recoveryData);
                return true;
            },
            '回復設定の保存',
            false
        );

        if (success) {
            showNotification('回復設定を保存しました', 'success');
        }

        this.isLoading = false;
    }


    /**
     * プロフィールを保存
     * @param {Object} profileData - プロフィールデータ
     */
    async saveProfile(profileData) {
        console.log('Saving profile data:', profileData);

        // ローカルプロフィールを更新
        this.userProfile = { ...this.userProfile, ...profileData };
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        console.log('Profile saved to localStorage:', this.userProfile);

        // Supabaseに保存（利用可能でユーザーが認証されている場合）
        if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
            try {
                const result = await supabaseService.saveUserProfile(profileData);
                if (result) {
                    console.log('Profile successfully saved to Supabase');
                    showNotification('設定をSupabaseに保存しました', 'success');
                } else {
                    console.warn('Supabase save returned false, but localStorage saved');
                    showNotification('設定をローカルに保存しました（Supabase同期に失敗）', 'warning');
                }
            } catch (error) {
                console.warn('Supabase profile save failed:', error);
                showNotification('設定をローカルに保存しました（Supabase同期に失敗）', 'warning');
            }
        } else {
            console.log('Supabase not available or user not authenticated, using localStorage only');
            showNotification('設定をローカルに保存しました', 'info');
        }
    }

    /**
     * アバターアップロード処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('Avatar upload started:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        // ファイルサイズチェック（5MB制限）
        if (file.size > 5 * 1024 * 1024) {
            showNotification('ファイルサイズは5MB以下にしてください', 'error');
            return;
        }

        // ファイル形式チェック
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('JPEG、PNG、GIF、WebP形式の画像ファイルを選択してください', 'error');
            return;
        }

        try {
            // プレビュー表示とローカルURL取得
            console.log('Reading file for preview...');
            const localUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    console.log('File read successfully, updating preview...');
                    const preview = safeGetElement('#avatar-preview');
                    if (preview) {
                        preview.innerHTML = `
                            <img src="${e.target.result}" 
                                 alt="Avatar Preview" 
                                 class="w-full h-full object-cover">
                        `;
                    }
                    resolve(e.target.result);
                };
                reader.onerror = (error) => {
                    console.error('FileReader error:', error);
                    reject(error);
                };
                reader.readAsDataURL(file);
            });

            console.log('Local URL generated:', `${localUrl.substring(0, 50)}...`);

            // Supabaseにアップロード（利用可能な場合）
            if (supabaseService.isAvailable()) {
                console.log('Supabase is available, attempting upload...');
                try {
                    const avatarUrl = await supabaseService.uploadAvatar(file);
                    console.log('Supabase upload successful:', avatarUrl);
                    await this.saveProfile({ avatar_url: avatarUrl });
                    showNotification('アバター画像をアップロードしました', 'success');
                } catch (uploadError) {
                    console.error('Supabase upload failed:', uploadError);
                    // Supabaseアップロードに失敗した場合は、ローカルに保存
                    console.log('Falling back to local storage...');
                    await this.saveProfile({ avatar_url: localUrl });
                    showNotification('アバター画像をローカルに保存しました', 'info');
                }
            } else {
                // Supabaseが利用できない場合は、ローカルに保存
                console.log('Supabase not available, saving to local storage...');
                await this.saveProfile({ avatar_url: localUrl });
                showNotification('アバター画像をローカルに保存しました', 'info');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            showNotification('アバター画像のアップロードに失敗しました', 'error');
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
     * フィールドエラーを表示
     * @param {Object} errors - エラーオブジェクト
     */
    displayFieldErrors(errors) {
        // エラー表示用のマッピング
        const fieldErrorMap = {
            display_name: 'display_name-error',
            email: 'email-error',
            age: 'age-error',
            weight: 'weight-error',
            height: 'height-error'
        };

        // 各フィールドのエラーを表示
        for (const [fieldName, errorMessages] of Object.entries(errors)) {
            const errorElementId = fieldErrorMap[fieldName];
            if (errorElementId) {
                const errorElement = safeGetElement(`#${errorElementId}`);
                if (errorElement && errorMessages.length > 0) {
                    // 具体的な項目名を含むエラーメッセージを作成
                    const fieldDisplayName = this.getFieldDisplayName(fieldName);
                    const errorMessage = `${fieldDisplayName}: ${errorMessages[0]}`;

                    errorElement.textContent = errorMessage;
                    errorElement.classList.remove('hidden');
                    errorElement.classList.add('text-red-600', 'text-sm', 'mt-1');
                }
            }
        }

        // エラーがある場合の通知
        const firstError = Object.values(errors).flat()[0];
        if (firstError) {
            const firstField = Object.keys(errors)[0];
            const fieldDisplayName = this.getFieldDisplayName(firstField);
            showNotification(`${fieldDisplayName}の入力に問題があります`, 'error');
        }
    }

    /**
     * フィールド名の表示名を取得
     * @param {string} fieldName - フィールド名
     * @returns {string} 表示名
     */
    getFieldDisplayName(fieldName) {
        const displayNames = {
            display_name: 'ニックネーム',
            age: '年齢',
            weight: '体重',
            height: '身長',
            email: 'メールアドレス'
        };
        return displayNames[fieldName] || fieldName;
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

    /**
     * ログアウト処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleLogout(e) {
        e.preventDefault();
        
        try {
            console.log('Logout button clicked in settings page');
            
            // 確認ダイアログを表示
            const confirmed = await this.showLogoutConfirmDialog();
            if (!confirmed) {
                return;
            }

            // ログアウト処理を実行
            await authManager.logout();
            
            showNotification('ログアウトしました', 'success');
            
            // ログイン画面にリダイレクト
            window.location.href = '/index.html';
            
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('ログアウトに失敗しました', 'error');
        }
    }

    /**
     * ログアウト確認ダイアログを表示
     * @returns {Promise<boolean>} ユーザーの確認結果
     */
    async showLogoutConfirmDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white p-6 rounded-lg max-w-md mx-4">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">ログアウトの確認</h3>
                    <p class="mb-6 text-gray-700">
                        本当にログアウトしますか？<br>
                        現在のセッションが終了し、ログイン画面に戻ります。
                    </p>
                    <div class="flex space-x-3 justify-end">
                        <button id="cancel-logout" 
                                class="px-4 py-2 bg-gray-300 text-gray-700 rounded 
                                       hover:bg-gray-400">
                            キャンセル
                        </button>
                        <button id="confirm-logout" 
                                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                            ログアウト
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#cancel-logout').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            modal.querySelector('#confirm-logout').addEventListener('click', () => {
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
}

// デフォルトエクスポート
export default new SettingsPage();
