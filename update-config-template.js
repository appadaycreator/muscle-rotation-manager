#!/usr/bin/env node

/**
 * Supabase設定更新テンプレート
 * ダッシュボードから取得した正しい情報でapp.jsを更新します
 */

const fs = require('fs');
const path = require('path');

// ダッシュボードから取得した正しい情報をここに入力してください
const CORRECT_CONFIG = {
    // ダッシュボードの Settings → API から取得
    PROJECT_URL: 'https://rtdbgxanjfvdkzrnxqjz.supabase.co',
    ANON_KEY: '[ダッシュボードから取得したAnon Keyをここに貼り付け]',
    SERVICE_ROLE_KEY: '[ダッシュボードから取得したService Role Keyをここに貼り付け]'
};

const APP_JS_PATH = './app.js';

console.log('🔧 Supabase設定更新スクリプト');
console.log('================================');

/**
 * 設定を更新する関数
 */
function updateSupabaseConfig() {
    console.log('\n📝 app.js の設定を更新中...');
    
    try {
        // 現在のapp.jsを読み込み
        let appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');
        
        // バックアップを作成
        const backupPath = `${APP_JS_PATH}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, appJsContent);
        console.log(`   📁 バックアップ作成: ${backupPath}`);
        
        // 設定を更新
        console.log('   🔄 URL更新中...');
        appJsContent = appJsContent.replace(
            /const supabaseUrl = '[^']+'/,
            `const supabaseUrl = '${CORRECT_CONFIG.PROJECT_URL}'`
        );
        
        console.log('   🔑 APIキー更新中...');
        appJsContent = appJsContent.replace(
            /const supabaseKey = '[^']+'/,
            `const supabaseKey = '${CORRECT_CONFIG.ANON_KEY}'`
        );
        
        // ファイルに書き込み
        fs.writeFileSync(APP_JS_PATH, appJsContent);
        console.log('   ✅ app.js が更新されました');
        
        return true;
    } catch (error) {
        console.log(`   ❌ 更新エラー: ${error.message}`);
        return false;
    }
}

/**
 * 更新後の接続テスト
 */
function runConnectionTest() {
    console.log('\n🧪 更新後の接続テスト実行...');
    
    try {
        const { execSync } = require('child_process');
        const output = execSync('node supabase-connection-test.js', { encoding: 'utf8' });
        
        if (output.includes('🎉 すべてのテストが通過しました')) {
            console.log('✅ 接続テスト成功！');
            return true;
        } else {
            console.log('⚠️  一部のテストが失敗しました');
            console.log(output);
            return false;
        }
    } catch (error) {
        console.log(`❌ 接続テストエラー: ${error.message}`);
        return false;
    }
}

/**
 * GitHub Secrets更新の案内
 */
function showGitHubSecretsInstructions() {
    console.log('\n📋 GitHub Secrets更新手順:');
    console.log('================================');
    console.log('1. GitHubリポジトリの Settings → Secrets and variables → Actions');
    console.log('2. 以下のシークレットを更新:');
    console.log(`   SUPABASE_URL = ${CORRECT_CONFIG.PROJECT_URL}`);
    console.log(`   SUPABASE_ANON_KEY = ${CORRECT_CONFIG.ANON_KEY}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY = ${CORRECT_CONFIG.SERVICE_ROLE_KEY}`);
}

/**
 * 使用方法の表示
 */
function showUsage() {
    console.log('\n📖 使用方法:');
    console.log('1. ダッシュボードの Settings → API から情報を取得');
    console.log('2. このファイルの CORRECT_CONFIG を更新');
    console.log('3. node update-config-template.js を実行');
    console.log('\n⚠️  注意: 実際のAPIキーを入力してから実行してください');
}

/**
 * メイン実行関数
 */
function main() {
    // APIキーが設定されているかチェック
    if (CORRECT_CONFIG.ANON_KEY.includes('[ダッシュボード')) {
        console.log('⚠️  APIキーが設定されていません');
        showUsage();
        return;
    }
    
    // 設定更新
    const updateSuccess = updateSupabaseConfig();
    
    if (updateSuccess) {
        // 接続テスト
        const testSuccess = runConnectionTest();
        
        if (testSuccess) {
            console.log('\n🎉 設定更新完了！');
            showGitHubSecretsInstructions();
        }
    }
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = {
    updateSupabaseConfig,
    runConnectionTest,
    CORRECT_CONFIG
};
