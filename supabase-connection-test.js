/**
 * Supabase接続テストスクリプト
 * 
 * このスクリプトはSupabaseの接続と設定をテストします。
 * 使用方法: node supabase-connection-test.js
 */

// Supabase設定を読み込み
import { SUPABASE_CONFIG } from './js/utils/constants.js';

// Supabaseクライアントの初期化
let supabase;

async function initializeSupabase() {
    try {
        // 設定の検証
        if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url.includes('your-project-id')) {
            console.error('❌ Supabase URLが設定されていません');
            console.log('📝 解決方法: js/utils/constants.jsで正しいURLを設定してください');
            return false;
        }
        
        if (!SUPABASE_CONFIG.key || SUPABASE_CONFIG.key.includes('your-anon-key')) {
            console.error('❌ Supabase API Keyが設定されていません');
            console.log('📝 解決方法: js/utils/constants.jsで正しいAPI Keyを設定してください');
            return false;
        }
        
        // ブラウザ環境でのSupabaseクライアント初期化
        if (typeof window !== 'undefined' && window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            console.log('✅ Supabaseクライアントが初期化されました');
            return true;
        } else {
            console.error('❌ Supabaseクライアントが利用できません');
            console.log('📝 解決方法: Supabaseライブラリが読み込まれているか確認してください');
            return false;
        }
    } catch (error) {
        console.error('❌ Supabaseクライアントの初期化に失敗:', error);
        return false;
    }
}

async function testConnection() {
    console.log('\n🔍 Supabase接続テストを開始...');
    
    try {
        // 基本的な接続テスト
        const { data, error } = await supabase
            .from('muscle_groups')
            .select('id, name')
            .limit(1);
            
        if (error) {
            console.error('❌ データベース接続エラー:', error);
            return false;
        }
        
        console.log('✅ データベース接続成功');
        console.log('📊 テストデータ:', data);
        return true;
    } catch (error) {
        console.error('❌ 接続テストエラー:', error);
        return false;
    }
}

async function testAuthentication() {
    console.log('\n🔐 認証機能テストを開始...');
    
    try {
        // 認証状態の確認
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ 認証状態取得エラー:', error);
            return false;
        }
        
        if (session) {
            console.log('✅ アクティブなセッションが見つかりました');
            console.log('👤 ユーザー:', session.user.email);
        } else {
            console.log('ℹ️ アクティブなセッションはありません（正常）');
        }
        
        return true;
    } catch (error) {
        console.error('❌ 認証テストエラー:', error);
        return false;
    }
}

async function testStorage() {
    console.log('\n📁 ストレージ機能テストを開始...');
    
    try {
        // ストレージバケットの確認
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.error('❌ ストレージバケット取得エラー:', error);
            return false;
        }
        
        console.log('✅ ストレージバケット取得成功');
        console.log('📦 利用可能なバケット:', buckets.map(b => b.name));
        
        // 必要なバケットの確認
        const requiredBuckets = ['avatars', 'exercise-images', 'user-uploads'];
        const existingBuckets = buckets.map(b => b.name);
        
        for (const bucket of requiredBuckets) {
            if (existingBuckets.includes(bucket)) {
                console.log(`✅ バケット "${bucket}" が存在します`);
            } else {
                console.log(`⚠️ バケット "${bucket}" が見つかりません`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ ストレージテストエラー:', error);
        return false;
    }
}

async function testDatabaseSchema() {
    console.log('\n🗄️ データベーススキーマテストを開始...');
    
    const requiredTables = [
        'user_profiles',
        'workout_sessions', 
        'training_logs',
        'workout_statistics',
        'muscle_groups'
    ];
    
    let allTablesExist = true;
    
    for (const table of requiredTables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`❌ テーブル "${table}" が存在しません:`, error.message);
                allTablesExist = false;
            } else {
                console.log(`✅ テーブル "${table}" が存在します`);
            }
        } catch (error) {
            console.log(`❌ テーブル "${table}" の確認に失敗:`, error.message);
            allTablesExist = false;
        }
    }
    
    return allTablesExist;
}

async function runAllTests() {
    console.log('🚀 Supabase接続テストを開始します...\n');
    
    // 設定の確認
    console.log('📋 現在の設定:');
    console.log(`   URL: ${SUPABASE_CONFIG.url}`);
    console.log(`   Key: ${SUPABASE_CONFIG.key.substring(0, 20)}...`);
    
    // Supabaseクライアントの初期化
    const initialized = await initializeSupabase();
    if (!initialized) {
        console.log('\n❌ テストを中止します');
        return;
    }
    
    // 各テストの実行
    const results = {
        connection: await testConnection(),
        authentication: await testAuthentication(),
        storage: await testStorage(),
        schema: await testDatabaseSchema()
    };
    
    // 結果の表示
    console.log('\n📊 テスト結果サマリー:');
    console.log(`   データベース接続: ${results.connection ? '✅' : '❌'}`);
    console.log(`   認証機能: ${results.authentication ? '✅' : '❌'}`);
    console.log(`   ストレージ機能: ${results.storage ? '✅' : '❌'}`);
    console.log(`   データベーススキーマ: ${results.schema ? '✅' : '❌'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
        console.log('\n🎉 すべてのテストが成功しました！');
        console.log('✅ Supabaseの設定は正常に動作しています');
    } else {
        console.log('\n⚠️ 一部のテストが失敗しました');
        console.log('📖 詳細な設定手順は SUPABASE_SETUP.md を参照してください');
    }
    
    return allPassed;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    // ブラウザ環境では手動でテストを実行
    window.runSupabaseTests = runAllTests;
    console.log('🔧 ブラウザ環境でテストを実行するには、コンソールで runSupabaseTests() を実行してください');
} else {
    // Node.js環境での実行
    runAllTests().catch(console.error);
}
