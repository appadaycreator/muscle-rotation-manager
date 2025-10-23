// supabase-connection-test.js - Supabase接続テスト

// Supabase設定
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

// CDNから読み込まれたSupabaseライブラリを使用
let supabase = null;

// Supabaseライブラリが読み込まれるのを待つ
if (window.supabase && window.supabase.createClient) {
    const { createClient } = window.supabase;
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.error('Supabase library not loaded from CDN');
}

console.log('🔍 Supabase接続テストを開始...');

// 接続テスト
async function testSupabaseConnection() {
    try {
        console.log('🔄 Supabase接続をテスト中...');
        
        // 基本的な接続テスト
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase接続エラー:', error.message);
            return false;
        }
        
        console.log('✅ Supabase接続成功');
        return true;
        
    } catch (error) {
        console.error('❌ Supabase接続テスト失敗:', error.message);
        return false;
    }
}

// 認証テスト
async function testSupabaseAuth() {
    try {
        console.log('🔄 Supabase認証をテスト中...');
        
        // 現在のセッションを取得
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ 認証エラー:', error.message);
            return false;
        }
        
        if (session) {
            console.log('✅ 認証済みユーザー:', session.user.email);
        } else {
            console.log('ℹ️ 未認証状態');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ 認証テスト失敗:', error.message);
        return false;
    }
}

// データベーステスト
async function testSupabaseDatabase() {
    try {
        console.log('🔄 Supabaseデータベースをテスト中...');
        
        // ワークアウトセッションテーブルのテスト
        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ データベースエラー:', error.message);
            return false;
        }
        
        console.log('✅ データベース接続成功');
        return true;
        
    } catch (error) {
        console.error('❌ データベーステスト失敗:', error.message);
        return false;
    }
}

// 全テストを実行
async function runAllTests() {
    console.log('🚀 Supabase動作確認テストを開始...');
    
    const results = {
        connection: await testSupabaseConnection(),
        auth: await testSupabaseAuth(),
        database: await testSupabaseDatabase()
    };
    
    console.log('📊 テスト結果:', results);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`✅ 成功: ${successCount}/${totalCount}`);
    
    if (successCount === totalCount) {
        console.log('🎉 すべてのテストが成功しました！');
    } else {
        console.log('⚠️ 一部のテストが失敗しました。設定を確認してください。');
    }
    
    return results;
}

// テスト実行
runAllTests().catch(console.error);

export { testSupabaseConnection, testSupabaseAuth, testSupabaseDatabase };
