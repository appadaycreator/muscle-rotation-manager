/**
 * Supabase設定検証ユーティリティ
 *
 * このモジュールはSupabaseの設定が正しく行われているかを検証します。
 */

import { SUPABASE_CONFIG } from './constants.js';

/**
 * Supabase設定の検証結果
 */
export class SupabaseConfigValidation {
    constructor() {
        this.isValid = false;
        this.errors = [];
        this.warnings = [];
        this.suggestions = [];
    }

    addError(message) {
        this.errors.push(message);
        this.isValid = false;
    }

    addWarning(message) {
        this.warnings.push(message);
    }

    addSuggestion(message) {
        this.suggestions.push(message);
    }
}

/**
 * Supabase設定を検証
 * @returns {SupabaseConfigValidation} 検証結果
 */
export function validateSupabaseConfig() {
    const validation = new SupabaseConfigValidation();

    // URLの検証
    if (!SUPABASE_CONFIG.url) {
        validation.addError('Supabase URLが設定されていません');
    } else if (SUPABASE_CONFIG.url.includes('your-project-id')) {
        validation.addError('Supabase URLがプレースホルダーのままです');
        validation.addSuggestion('js/utils/constants.jsで実際のプロジェクトURLを設定してください');
    } else if (!SUPABASE_CONFIG.url.startsWith('https://')) {
        validation.addError('Supabase URLはhttps://で始まる必要があります');
    } else if (!SUPABASE_CONFIG.url.endsWith('.supabase.co')) {
        validation.addError('Supabase URLは.supabase.coで終わる必要があります');
    } else {
        // URLの形式は正しい
        validation.isValid = true;
    }

    // API Keyの検証
    if (!SUPABASE_CONFIG.key) {
        validation.addError('Supabase API Keyが設定されていません');
        validation.isValid = false;
    } else if (SUPABASE_CONFIG.key.includes('your-anon-key')) {
        validation.addError('Supabase API Keyがプレースホルダーのままです');
        validation.addSuggestion('js/utils/constants.jsで実際のAPI Keyを設定してください');
        validation.isValid = false;
    } else if (!SUPABASE_CONFIG.key.startsWith('eyJ')) {
        validation.addError('Supabase API KeyはJWTトークンである必要があります（eyJで始まる）');
        validation.isValid = false;
    }

    // 設定が正しい場合の追加チェック
    if (validation.isValid) {
        validation.addSuggestion('設定は正しく見えます。接続テストを実行してください');
    }

    return validation;
}

/**
 * 設定の検証結果をコンソールに表示
 * @param {SupabaseConfigValidation} validation 検証結果
 */
export function displayValidationResults(validation) {
    console.log('\n🔍 Supabase設定検証結果:');

    if (validation.isValid) {
        console.log('✅ 設定は正常です');
    } else {
        console.log('❌ 設定に問題があります');
    }

    if (validation.errors.length > 0) {
        console.log('\n🚨 エラー:');
        validation.errors.forEach(error => {
            console.log(`   • ${error}`);
        });
    }

    if (validation.warnings.length > 0) {
        console.log('\n⚠️ 警告:');
        validation.warnings.forEach(warning => {
            console.log(`   • ${warning}`);
        });
    }

    if (validation.suggestions.length > 0) {
        console.log('\n💡 提案:');
        validation.suggestions.forEach(suggestion => {
            console.log(`   • ${suggestion}`);
        });
    }
}

/**
 * 設定の詳細情報を表示
 */
export function displayConfigInfo() {
    console.log('\n📋 現在のSupabase設定:');
    console.log(`   URL: ${SUPABASE_CONFIG.url || '未設定'}`);
    console.log(`   Key: ${SUPABASE_CONFIG.key ? `${SUPABASE_CONFIG.key.substring(0, 20)}...` : '未設定'}`);

    // 設定ファイルの場所を表示
    console.log('\n📁 設定ファイル:');
    console.log('   • js/utils/constants.js - フロントエンド設定');
    console.log('   • mcp-config.json - MCP設定（オプション）');

    // 設定手順を表示
    console.log('\n📖 設定手順:');
    console.log('   1. Supabaseダッシュボードでプロジェクトを作成');
    console.log('   2. Settings → API からURLとAPI Keyを取得');
    console.log('   3. js/utils/constants.jsで設定を更新');
    console.log('   4. ブラウザでアプリケーションをテスト');
}

/**
 * 設定の検証と表示を実行
 */
export function validateAndDisplay() {
    const validation = validateSupabaseConfig();
    displayConfigInfo();
    displayValidationResults(validation);
    return validation;
}

// ブラウザ環境での自動実行
if (typeof window !== 'undefined') {
    // グローバル関数として公開
    window.validateSupabaseConfig = validateAndDisplay;
    console.log('🔧 設定検証を実行するには、コンソールで validateSupabaseConfig() を実行してください');
}
