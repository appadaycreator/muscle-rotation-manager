#!/usr/bin/env node

/**
 * Supabase接続テストスクリプト
 * 現在の設定でSupabaseへの接続が正しく行えるかを検証します
 */

const https = require('https');
const { URL } = require('url');

// 正しいプロジェクト設定（ダッシュボードで確認済み）
const SUPABASE_URL = 'https://mwwlqpokfgduxyjbqoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d2xxcG9rZmdkdXh5amJxb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU3MTIsImV4cCI6MjA2ODA5MTcxMn0.0vyxxQ7zBfRKrH-JhpHMor_UvuBbQu3wE9HStGjsfGQ';

console.log('🔍 Supabase接続テストを開始します...\n');

// テスト結果を格納するオブジェクト
const testResults = {
    connectionTest: false,
    authTest: false,
    databaseTest: false,
    tablesExist: false,
    rlsEnabled: false,
    storageTest: false
};

/**
 * HTTPSリクエストを送信するヘルパー関数
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

/**
 * 1. 基本的な接続テスト
 */
async function testConnection() {
    console.log('1️⃣ 基本接続テスト...');
    try {
        const response = await makeRequest(`${SUPABASE_URL}/rest/v1/`);
        if (response.statusCode === 200 || response.statusCode === 404) {
            console.log('✅ Supabaseサーバーに接続できました');
            testResults.connectionTest = true;
            return true;
        } else {
            console.log(`❌ 接続失敗: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ 接続エラー: ${error.message}`);
        return false;
    }
}

/**
 * 2. 認証設定テスト
 */
async function testAuth() {
    console.log('\n2️⃣ 認証設定テスト...');
    try {
        const response = await makeRequest(`${SUPABASE_URL}/auth/v1/settings`);
        if (response.statusCode === 200) {
            console.log('✅ 認証エンドポイントにアクセスできました');
            console.log(`   - 外部プロバイダー: ${JSON.stringify(response.data.external || {})}`);
            testResults.authTest = true;
            return true;
        } else {
            console.log(`❌ 認証テスト失敗: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ 認証テストエラー: ${error.message}`);
        return false;
    }
}

/**
 * 3. データベーステーブル存在確認
 */
async function testDatabase() {
    console.log('\n3️⃣ データベーステーブル確認...');
    
    const expectedTables = [
        'muscle_groups',
        'exercises', 
        'user_profiles',
        'training_logs',
        'workout_sessions',
        'muscle_recovery'
    ];

    let tablesFound = 0;
    
    for (const table of expectedTables) {
        try {
            const response = await makeRequest(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`);
            if (response.statusCode === 200) {
                console.log(`✅ テーブル '${table}' が存在します`);
                tablesFound++;
            } else if (response.statusCode === 401 || response.statusCode === 403) {
                console.log(`🔒 テーブル '${table}' は存在しますが、RLSにより保護されています`);
                tablesFound++;
            } else {
                console.log(`❌ テーブル '${table}' が見つかりません (HTTP ${response.statusCode})`);
            }
        } catch (error) {
            console.log(`❌ テーブル '${table}' の確認でエラー: ${error.message}`);
        }
    }

    if (tablesFound >= expectedTables.length * 0.8) {
        console.log(`✅ 主要テーブルの ${tablesFound}/${expectedTables.length} が確認できました`);
        testResults.databaseTest = true;
        testResults.tablesExist = true;
        return true;
    } else {
        console.log(`❌ 必要なテーブルが不足しています (${tablesFound}/${expectedTables.length})`);
        return false;
    }
}

/**
 * 4. パブリックテーブル（muscle_groups）の詳細確認
 */
async function testPublicTables() {
    console.log('\n4️⃣ パブリックテーブル確認...');
    try {
        const response = await makeRequest(`${SUPABASE_URL}/rest/v1/muscle_groups?select=*`);
        if (response.statusCode === 200) {
            const data = response.data;
            console.log(`✅ muscle_groupsテーブル: ${data.length}件のレコード`);
            if (data.length > 0) {
                console.log(`   - サンプル: ${data[0].name || data[0].id}`);
            }
            return true;
        } else {
            console.log(`❌ muscle_groupsテーブルアクセス失敗: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ パブリックテーブルテストエラー: ${error.message}`);
        return false;
    }
}

/**
 * 5. RLS (Row Level Security) 設定確認
 */
async function testRLS() {
    console.log('\n5️⃣ RLS (Row Level Security) 設定確認...');
    try {
        // 認証が必要なテーブルにアクセスしてRLSの動作を確認
        const response = await makeRequest(`${SUPABASE_URL}/rest/v1/user_profiles?select=*&limit=1`);
        
        if (response.statusCode === 401 || response.statusCode === 403) {
            console.log('✅ RLSが正しく設定されています（未認証ユーザーはアクセス拒否）');
            testResults.rlsEnabled = true;
            return true;
        } else if (response.statusCode === 200) {
            console.log('⚠️  RLSが設定されていない可能性があります（要確認）');
            return false;
        } else {
            console.log(`❓ RLS確認結果が不明: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ RLSテストエラー: ${error.message}`);
        return false;
    }
}

/**
 * 6. ストレージバケット確認
 */
async function testStorage() {
    console.log('\n6️⃣ ストレージバケット確認...');
    try {
        const response = await makeRequest(`${SUPABASE_URL}/storage/v1/bucket`);
        if (response.statusCode === 200) {
            const buckets = response.data;
            console.log(`✅ ストレージにアクセスできました: ${buckets.length}個のバケット`);
            
            const expectedBuckets = ['avatars', 'exercise-images', 'user-uploads'];
            const foundBuckets = buckets.map(b => b.name);
            
            expectedBuckets.forEach(bucket => {
                if (foundBuckets.includes(bucket)) {
                    console.log(`   ✅ バケット '${bucket}' が存在します`);
                } else {
                    console.log(`   ❌ バケット '${bucket}' が見つかりません`);
                }
            });
            
            testResults.storageTest = true;
            return true;
        } else {
            console.log(`❌ ストレージアクセス失敗: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ストレージテストエラー: ${error.message}`);
        return false;
    }
}

/**
 * 7. 設定情報の表示
 */
function displayConfiguration() {
    console.log('\n📋 現在の設定情報:');
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`   Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    
    // JWTトークンのデコード（簡易版）
    try {
        const payload = SUPABASE_ANON_KEY.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        console.log(`   プロジェクトRef: ${decoded.ref}`);
        console.log(`   ロール: ${decoded.role}`);
        console.log(`   発行日時: ${new Date(decoded.iat * 1000).toLocaleString()}`);
        console.log(`   有効期限: ${new Date(decoded.exp * 1000).toLocaleString()}`);
    } catch (error) {
        console.log('   JWTデコードに失敗しました');
    }
}

/**
 * 結果サマリーの表示
 */
function displaySummary() {
    console.log('\n📊 テスト結果サマリー:');
    console.log('='.repeat(50));
    
    const tests = [
        { name: '基本接続', result: testResults.connectionTest },
        { name: '認証設定', result: testResults.authTest },
        { name: 'データベース', result: testResults.databaseTest },
        { name: 'テーブル存在', result: testResults.tablesExist },
        { name: 'RLS設定', result: testResults.rlsEnabled },
        { name: 'ストレージ', result: testResults.storageTest }
    ];
    
    tests.forEach(test => {
        const status = test.result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test.name}`);
    });
    
    const passCount = tests.filter(t => t.result).length;
    const totalCount = tests.length;
    
    console.log('='.repeat(50));
    console.log(`総合結果: ${passCount}/${totalCount} テスト通過`);
    
    if (passCount === totalCount) {
        console.log('🎉 すべてのテストが通過しました！Supabase設定は正常です。');
    } else if (passCount >= totalCount * 0.8) {
        console.log('⚠️  一部のテストが失敗しましたが、基本的な機能は動作します。');
    } else {
        console.log('❌ 多くのテストが失敗しました。Supabase設定を確認してください。');
    }
}

/**
 * メイン実行関数
 */
async function main() {
    displayConfiguration();
    
    await testConnection();
    await testAuth();
    await testDatabase();
    await testPublicTables();
    await testRLS();
    await testStorage();
    
    displaySummary();
    
    console.log('\n🔗 詳細な設定確認は以下で行えます:');
    console.log(`   Supabaseダッシュボード: https://supabase.com/dashboard/project/${SUPABASE_URL.split('.')[0].split('//')[1]}`);
    console.log(`   API設定: ${SUPABASE_URL}/rest/v1/`);
    console.log(`   認証設定: ${SUPABASE_URL}/auth/v1/settings`);
}

// スクリプト実行
if (require.main === module) {
    main().catch(error => {
        console.error('\n💥 テスト実行中にエラーが発生しました:', error);
        process.exit(1);
    });
}

module.exports = {
    testConnection,
    testAuth,
    testDatabase,
    testPublicTables,
    testRLS,
    testStorage,
    testResults
};
