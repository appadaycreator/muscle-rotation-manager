#!/usr/bin/env node

/**
 * Supabase復旧支援スクリプト
 * プロジェクトの復旧作業を自動化・支援します
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Supabase復旧支援スクリプト');
console.log('================================\n');

// 設定
const CORRECT_PROJECT_REF = 'rtdbgxanjfvdkzrnxqjz';
const INCORRECT_PROJECT_REF = 'mwwlqpokfgduxyjbqoff';
const APP_JS_PATH = './app.js';

/**
 * 現在の設定を確認
 */
function checkCurrentConfig() {
    console.log('📋 現在の設定確認...');
    
    try {
        const appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');
        
        // 現在のURL設定を抽出
        const urlMatch = appJsContent.match(/const supabaseUrl = '([^']+)'/);
        const keyMatch = appJsContent.match(/const supabaseKey = '([^']+)'/);
        
        if (urlMatch) {
            const currentUrl = urlMatch[1];
            console.log(`   現在のURL: ${currentUrl}`);
            
            if (currentUrl.includes(INCORRECT_PROJECT_REF)) {
                console.log('   ❌ 間違ったプロジェクトIDが設定されています');
                return false;
            } else if (currentUrl.includes(CORRECT_PROJECT_REF)) {
                console.log('   ✅ 正しいプロジェクトIDが設定されています');
                return true;
            }
        }
        
        if (keyMatch) {
            const currentKey = keyMatch[1];
            console.log(`   現在のキー: ${currentKey.substring(0, 20)}...`);
        }
        
    } catch (error) {
        console.log(`   ❌ 設定ファイル読み込みエラー: ${error.message}`);
        return false;
    }
    
    return false;
}

/**
 * Supabaseプロジェクトの状態確認
 */
function checkProjectStatus() {
    console.log('\n🔍 Supabaseプロジェクト状態確認...');
    
    try {
        // プロジェクト一覧を取得
        const output = execSync('supabase projects list', { encoding: 'utf8' });
        console.log('   プロジェクト一覧:');
        console.log(output);
        
        // 正しいプロジェクトが存在するかチェック
        if (output.includes(CORRECT_PROJECT_REF)) {
            console.log(`   ✅ プロジェクト ${CORRECT_PROJECT_REF} が見つかりました`);
            
            // プロジェクトのリンクを試行
            try {
                execSync(`supabase link --project-ref ${CORRECT_PROJECT_REF}`, { encoding: 'utf8' });
                console.log('   ✅ プロジェクトリンクが成功しました');
                return 'active';
            } catch (linkError) {
                if (linkError.message.includes('paused')) {
                    console.log('   ⏸️  プロジェクトが一時停止中です');
                    return 'paused';
                } else {
                    console.log(`   ❌ プロジェクトリンクエラー: ${linkError.message}`);
                    return 'error';
                }
            }
        } else {
            console.log(`   ❌ プロジェクト ${CORRECT_PROJECT_REF} が見つかりません`);
            return 'not_found';
        }
        
    } catch (error) {
        console.log(`   ❌ プロジェクト状態確認エラー: ${error.message}`);
        return 'error';
    }
}

/**
 * 設定ファイルの更新
 */
function updateConfig(newUrl, newKey) {
    console.log('\n📝 設定ファイル更新...');
    
    try {
        let appJsContent = fs.readFileSync(APP_JS_PATH, 'utf8');
        
        // バックアップを作成
        const backupPath = `${APP_JS_PATH}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, appJsContent);
        console.log(`   📁 バックアップ作成: ${backupPath}`);
        
        // URL を更新
        appJsContent = appJsContent.replace(
            /const supabaseUrl = '[^']+'/,
            `const supabaseUrl = '${newUrl}'`
        );
        
        // キーを更新（提供された場合）
        if (newKey) {
            appJsContent = appJsContent.replace(
                /const supabaseKey = '[^']+'/,
                `const supabaseKey = '${newKey}'`
            );
        }
        
        // ファイルに書き込み
        fs.writeFileSync(APP_JS_PATH, appJsContent);
        console.log('   ✅ 設定ファイルが更新されました');
        
        return true;
    } catch (error) {
        console.log(`   ❌ 設定ファイル更新エラー: ${error.message}`);
        return false;
    }
}

/**
 * APIキーの取得
 */
function getApiKeys() {
    console.log('\n🔑 APIキー取得...');
    
    try {
        const output = execSync('supabase projects api-keys', { encoding: 'utf8' });
        console.log('   取得されたAPIキー:');
        console.log(output);
        return output;
    } catch (error) {
        console.log(`   ❌ APIキー取得エラー: ${error.message}`);
        return null;
    }
}

/**
 * 接続テストの実行
 */
function runConnectionTest() {
    console.log('\n🧪 接続テスト実行...');
    
    try {
        const output = execSync('node supabase-connection-test.js', { encoding: 'utf8' });
        console.log(output);
        
        if (output.includes('🎉 すべてのテストが通過しました')) {
            console.log('   ✅ 接続テストが成功しました！');
            return true;
        } else {
            console.log('   ⚠️  一部のテストが失敗しました');
            return false;
        }
    } catch (error) {
        console.log(`   ❌ 接続テストエラー: ${error.message}`);
        return false;
    }
}

/**
 * 復旧手順の提案
 */
function suggestRecoverySteps(projectStatus) {
    console.log('\n💡 推奨される復旧手順:');
    console.log('========================');
    
    switch (projectStatus) {
        case 'paused':
            console.log('1. Supabaseダッシュボードでプロジェクトの一時停止を解除');
            console.log(`   URL: https://supabase.com/dashboard/project/${CORRECT_PROJECT_REF}`);
            console.log('2. 課金情報を確認・更新');
            console.log('3. このスクリプトを再実行');
            break;
            
        case 'active':
            console.log('1. 正しいプロジェクト設定に更新');
            console.log('2. 新しいAPIキーを取得');
            console.log('3. 接続テストを実行');
            break;
            
        case 'not_found':
            console.log('1. Supabaseダッシュボードでプロジェクト状態を確認');
            console.log('2. 必要に応じて新しいプロジェクトを作成');
            console.log('3. データベーススキーマを適用');
            break;
            
        default:
            console.log('1. Supabase CLIの認証状態を確認');
            console.log('2. ネットワーク接続を確認');
            console.log('3. Supabaseサポートに問い合わせ');
    }
}

/**
 * メイン実行関数
 */
function main() {
    console.log('復旧作業を開始します...\n');
    
    // 1. 現在の設定確認
    const configOk = checkCurrentConfig();
    
    // 2. プロジェクト状態確認
    const projectStatus = checkProjectStatus();
    
    // 3. 状態に応じた処理
    if (projectStatus === 'active') {
        console.log('\n✅ プロジェクトはアクティブです');
        
        if (!configOk) {
            // 設定を更新
            const newUrl = `https://${CORRECT_PROJECT_REF}.supabase.co`;
            if (updateConfig(newUrl)) {
                console.log('   設定が更新されました');
            }
        }
        
        // APIキーを取得
        getApiKeys();
        
        // 接続テストを実行
        runConnectionTest();
        
    } else {
        // 復旧手順を提案
        suggestRecoverySteps(projectStatus);
    }
    
    console.log('\n📚 詳細な手順は supabase-recovery-guide.md を参照してください');
    console.log('🔗 ダッシュボード: https://supabase.com/dashboard');
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = {
    checkCurrentConfig,
    checkProjectStatus,
    updateConfig,
    getApiKeys,
    runConnectionTest
};
