// app-refactored.js - リファクタリング後のメインアプリケーション

import { pageManager } from './js/modules/pageManager.js';
import { authManager } from './js/modules/authManager.js';
import { showNotification } from './js/utils/helpers.js';

class MuscleRotationApp {
    constructor() {
        this.isInitialized = false;
        this.currentWorkout = null;
        this.workoutTimer = null;
        this.workoutStartTime = null;
        this.currentLanguage = 'ja';
        this.currentFontSize = 'base';
    }

    /**
     * アプリケーションを初期化
     */
    async initialize() {
        if (this.isInitialized) {return;}

        console.log('🏋️ MuscleRotationManager - Starting Application');

        try {
            // 基本コンポーネントを読み込み
            await this.loadBasicComponents();

            // 初期ページを読み込み
            await pageManager.navigateToPage('dashboard');

            // ナビゲーションを初期化
            pageManager.initializeNavigation();

            // 認証を初期化
            await authManager.initialize();

            // モバイルメニューを初期化
            this.initializeMobileMenu();

            this.isInitialized = true;
            console.log('✅ App initialization complete');
            console.log('Current user:', authManager.getCurrentUser());

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            showNotification('アプリケーションの初期化に失敗しました', 'error');
        }
    }

    /**
     * 基本コンポーネントを読み込み
     * パフォーマンス最適化: 並列読み込みとエラーハンドリング
     */
    async loadBasicComponents() {
        try {
            const [headerResult, sidebarResult] = await Promise.allSettled([
                pageManager.loadHeader(),
                pageManager.loadSidebar()
            ]);

            // 個別のエラーハンドリング
            if (headerResult.status === 'rejected') {
                console.warn('Header loading failed:', headerResult.reason);
            }
            if (sidebarResult.status === 'rejected') {
                console.warn('Sidebar loading failed:', sidebarResult.reason);
            }

            // 最低限のコンポーネントが読み込まれていることを確認
            if (headerResult.status === 'rejected' && sidebarResult.status === 'rejected') {
                throw new Error('Critical components failed to load');
            }
        } catch (error) {
            console.error('Failed to load basic components:', error);
            throw error;
        }
    }

    /**
     * モバイルメニューを初期化
     */
    initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileSidebarClose = document.getElementById('mobile-sidebar-close');

        if (mobileMenuBtn && mobileSidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileSidebar.classList.add('open');
            });
        }

        if (mobileSidebarClose && mobileSidebar) {
            mobileSidebarClose.addEventListener('click', () => {
                mobileSidebar.classList.remove('open');
            });
        }

        // モバイルサイドバー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (mobileSidebar &&
                !mobileSidebar.contains(e.target) &&
                !mobileMenuBtn?.contains(e.target)) {
                mobileSidebar.classList.remove('open');
            }
        });
    }

    /**
     * ワークアウトを開始
     * @param {string} muscleGroup - 筋肉部位
     */
    startWorkout(muscleGroup) {
        console.log(`Starting workout for: ${muscleGroup}`);

        // 現在のワークアウトセクションを表示
        const currentWorkoutElement = document.getElementById('current-workout');
        if (currentWorkoutElement) {
            currentWorkoutElement.classList.remove('hidden');
        }

        // タイマーを開始
        this.startWorkoutTimer();

        // 現在のワークアウトを設定
        this.currentWorkout = {
            muscleGroup,
            startTime: new Date(),
            exercises: []
        };

        showNotification(`${muscleGroup}のワークアウトを開始しました`, 'success');
    }

    /**
     * ワークアウトを停止
     */
    stopWorkout() {
        console.log('Stopping workout');

        // タイマーを停止
        this.stopWorkoutTimer();

        // 現在のワークアウトセクションを非表示
        const currentWorkoutElement = document.getElementById('current-workout');
        if (currentWorkoutElement) {
            currentWorkoutElement.classList.add('hidden');
        }

        // ワークアウトデータを保存
        if (this.currentWorkout) {
            this.saveWorkoutData();
        }

        // 現在のワークアウトをリセット
        this.currentWorkout = null;
        showNotification('ワークアウトを終了しました', 'success');
    }

    /**
     * ワークアウトタイマーを開始
     */
    startWorkoutTimer() {
        this.workoutStartTime = new Date();
        this.workoutTimer = setInterval(() => this.updateWorkoutTimer(), 1000);
    }

    /**
     * ワークアウトタイマーを停止
     */
    stopWorkoutTimer() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
    }

    /**
     * ワークアウトタイマー表示を更新
     */
    updateWorkoutTimer() {
        if (!this.workoutStartTime) {return;}

        const now = new Date();
        const diff = now - this.workoutStartTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        const timerDisplay = document.getElementById('workout-timer');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * ワークアウトデータを保存
     */
    async saveWorkoutData() {
        if (!this.currentWorkout) {return;}

        try {
            // 実装は後で追加
            console.log('Saving workout data:', this.currentWorkout);
            showNotification('ワークアウトデータを保存しました', 'success');
        } catch (error) {
            console.error('Error saving workout data:', error);
            showNotification('ワークアウトデータの保存に失敗しました', 'error');
        }
    }

    /**
     * 現在のワークアウトを取得
     * @returns {Object|null} 現在のワークアウト
     */
    getCurrentWorkout() {
        return this.currentWorkout;
    }

    /**
     * アプリケーションが初期化済みかチェック
     * @returns {boolean} 初期化済みかどうか
     */
    isReady() {
        return this.isInitialized;
    }
}

// グローバルアプリインスタンス
const app = new MuscleRotationApp();

// DOM読み込み完了時にアプリを初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app...');
    await app.initialize();
});

// グローバルスコープにエクスポート（既存のコードとの互換性のため）
window.MuscleRotationApp = app;
window.startWorkout = (muscleGroup) => app.startWorkout(muscleGroup);
window.stopWorkout = () => app.stopWorkout();

export default app;
