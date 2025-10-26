// app-refactored.js - メインアプリケーションエントリーポイント

import { MPAInitializer } from './js/core/MPAInitializer.js';

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 MuscleRotationManager アプリケーションを初期化中...');

        // MPA初期化
        const mpaInitializer = new MPAInitializer();
        await mpaInitializer.initialize();

        console.log('✅ アプリケーション初期化完了');
    } catch (error) {
        console.error('❌ アプリケーション初期化エラー:', error);
    }
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
});
