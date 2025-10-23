#!/usr/bin/env node

/**
 * 直接Supabase API修正スクリプト
 * Supabase REST APIを直接呼び出してセキュリティ修正を実行
 */

const https = require('https');
const { URL } = require('url');

console.log('🔧 直接Supabase API修正スクリプト');
console.log('================================\n');

// 設定
const SUPABASE_URL = 'https://mwwlqpokfgduxyjbqoff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d2xxcG9rZmdkdXh5amJxb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU3MTIsImV4cCI6MjA2ODA5MTcxMn0.0vyxxQ7zBfRKrH-JhpHMor_UvuBbQu3wE9HStGjsfGQ';

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
                'User-Agent': 'Supabase-Direct-Fix/1.0',
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
 * RLS状態の確認
 */
async function checkRLSStatus() {
    console.log('🔍 RLS状態の確認...');
    
    try {
        // PostgreSQLのシステムテーブルを直接クエリ
        const response = await makeRequest(`${SUPABASE_URL}/rest/v1/rpc/check_rls_status`, {
            method: 'POST',
            body: {}
        });
        
        if (response.statusCode === 200) {
            console.log('✅ RLS状態確認成功');
            return response.data;
        } else {
            console.log(`❌ RLS状態確認失敗: HTTP ${response.statusCode}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ RLS状態確認エラー: ${error.message}`);
        return null;
    }
}

/**
 * ストレージバケットの作成
 */
async function createStorageBucket(bucketName, isPublic = false) {
    console.log(`📦 ストレージバケット作成: ${bucketName} (${isPublic ? 'Public' : 'Private'})`);
    
    try {
        const response = await makeRequest(`${SUPABASE_URL}/storage/v1/bucket`, {
            method: 'POST',
            body: {
                id: bucketName,
                name: bucketName,
                public: isPublic,
                file_size_limit: 52428800, // 50MB
                allowed_mime_types: ['image/*', 'application/pdf']
            }
        });
        
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log(`   ✅ バケット '${bucketName}' 作成成功`);
            return true;
        } else if (response.statusCode === 409) {
            console.log(`   ℹ️  バケット '${bucketName}' は既に存在します`);
            return true;
        } else {
            console.log(`   ❌ バケット '${bucketName}' 作成失敗: HTTP ${response.statusCode}`);
            console.log(`   詳細: ${JSON.stringify(response.data)}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ バケット '${bucketName}' 作成エラー: ${error.message}`);
        return false;
    }
}

/**
 * ストレージバケット一覧の取得
 */
async function listStorageBuckets() {
    console.log('📋 ストレージバケット一覧取得...');
    
    try {
        const response = await makeRequest(`${SUPABASE_URL}/storage/v1/bucket`);
        
        if (response.statusCode === 200) {
            const buckets = response.data;
            console.log(`✅ バケット一覧取得成功: ${buckets.length}個のバケット`);
            
            buckets.forEach(bucket => {
                console.log(`   - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
            });
            
            return buckets;
        } else {
            console.log(`❌ バケット一覧取得失敗: HTTP ${response.statusCode}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ バケット一覧取得エラー: ${error.message}`);
        return [];
    }
}

/**
 * テーブル情報の取得
 */
async function getTableInfo() {
    console.log('📊 テーブル情報取得...');
    
    const tables = ['muscle_groups', 'exercises', 'workouts', 'user_profiles'];
    const results = {};
    
    for (const table of tables) {
        try {
            const response = await makeRequest(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`);
            
            if (response.statusCode === 200) {
                console.log(`   ✅ ${table}: アクセス可能`);
                results[table] = { accessible: true, data: response.data };
            } else {
                console.log(`   ⚠️  ${table}: HTTP ${response.statusCode} (RLS保護の可能性)`);
                results[table] = { accessible: false, status: response.statusCode };
            }
        } catch (error) {
            console.log(`   ❌ ${table}: エラー - ${error.message}`);
            results[table] = { accessible: false, error: error.message };
        }
    }
    
    return results;
}

/**
 * 設定状況の詳細レポート
 */
function generateDetailedReport(rlsStatus, buckets, tableInfo) {
    console.log('\n📊 詳細設定レポート');
    console.log('='.repeat(50));
    
    console.log('\n🔒 セキュリティ状況:');
    if (rlsStatus) {
        console.log('   ✅ RLS状態確認済み');
    } else {
        console.log('   ⚠️  RLS状態の詳細確認が必要');
    }
    
    console.log('\n📦 ストレージ状況:');
    if (buckets.length > 0) {
        buckets.forEach(bucket => {
            console.log(`   ✅ ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
        });
    } else {
        console.log('   ❌ ストレージバケットが見つかりません');
    }
    
    console.log('\n📋 テーブルアクセス状況:');
    Object.entries(tableInfo).forEach(([table, info]) => {
        const status = info.accessible ? '✅ アクセス可能' : '🔒 制限あり';
        console.log(`   ${status} ${table}`);
    });
}

/**
 * 推奨アクション
 */
function suggestActions(buckets, tableInfo) {
    console.log('\n💡 推奨アクション:');
    
    const requiredBuckets = ['avatars', 'exercise-images', 'user-uploads'];
    const missingBuckets = requiredBuckets.filter(
        required => !buckets.some(bucket => bucket.name === required)
    );
    
    if (missingBuckets.length > 0) {
        console.log('📦 ストレージバケット作成:');
        console.log('   Supabaseダッシュボード → Storage → Create bucket');
        missingBuckets.forEach(bucket => {
            const isPublic = bucket !== 'user-uploads';
            console.log(`   - ${bucket} (${isPublic ? 'Public' : 'Private'})`);
        });
    }
    
    const restrictedTables = Object.entries(tableInfo)
        .filter(([table, info]) => !info.accessible && info.status === 401);
    
    if (restrictedTables.length > 0) {
        console.log('\n🔒 RLS設定確認:');
        console.log('   Supabaseダッシュボード → Authentication → Policies');
        restrictedTables.forEach(([table]) => {
            console.log(`   - ${table}テーブルのポリシー設定`);
        });
    }
    
    console.log('\n🔗 参考リンク:');
    console.log(`   ダッシュボード: https://supabase.com/dashboard/project/mwwlqpokfgduxyjbqoff`);
    console.log('   ストレージ設定: Storage → Settings');
    console.log('   RLS設定: Authentication → Policies');
}

/**
 * メイン実行関数
 */
async function main() {
    console.log('🚀 直接API修正を開始します...\n');
    
    // 1. RLS状態確認
    const rlsStatus = await checkRLSStatus();
    
    // 2. 現在のストレージバケット確認
    const currentBuckets = await listStorageBuckets();
    
    // 3. 必要なバケットを作成
    console.log('\n📦 必要なストレージバケットを作成中...');
    const bucketsToCreate = [
        { name: 'avatars', public: true },
        { name: 'exercise-images', public: true },
        { name: 'user-uploads', public: false }
    ];
    
    for (const bucket of bucketsToCreate) {
        await createStorageBucket(bucket.name, bucket.public);
    }
    
    // 4. 更新後のバケット一覧取得
    const updatedBuckets = await listStorageBuckets();
    
    // 5. テーブル情報取得
    const tableInfo = await getTableInfo();
    
    // 6. 詳細レポート生成
    generateDetailedReport(rlsStatus, updatedBuckets, tableInfo);
    
    // 7. 推奨アクション
    suggestActions(updatedBuckets, tableInfo);
    
    console.log('\n🔄 次のステップ:');
    console.log('1. node supabase-connection-test.js で最終確認');
    console.log('2. 必要に応じてダッシュボードで手動設定');
    console.log('3. アプリケーションの動作テスト');
}

// スクリプト実行
if (require.main === module) {
    main().catch(error => {
        console.error('\n💥 実行中にエラーが発生しました:', error);
        process.exit(1);
    });
}

module.exports = {
    checkRLSStatus,
    createStorageBucket,
    listStorageBuckets,
    getTableInfo
};
