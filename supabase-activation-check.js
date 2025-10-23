#!/usr/bin/env node

/**
 * Supabaseプロジェクトアクティベーション確認スクリプト
 * プロジェクトが正常にアクティベートされているかを詳細に確認します
 */

const https = require('https');
const { URL } = require('url');
const dns = require('dns').promises;

console.log('🔍 Supabaseプロジェクトアクティベーション確認');
console.log('='.repeat(50));

const PROJECT_REF = 'rtdbgxanjfvdkzrnxqjz';
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;

/**
 * DNS解決テスト
 */
async function testDNSResolution() {
    console.log('\n1️⃣ DNS解決テスト...');
    
    try {
        const addresses = await dns.lookup(`${PROJECT_REF}.supabase.co`);
        console.log(`✅ DNS解決成功: ${addresses.address}`);
        return true;
    } catch (error) {
        console.log(`❌ DNS解決失敗: ${error.code}`);
        
        // 代替DNSサーバーでテスト
        try {
            console.log('   代替DNS (8.8.8.8) でテスト中...');
            const { spawn } = require('child_process');
            return new Promise((resolve) => {
                const nslookup = spawn('nslookup', [`${PROJECT_REF}.supabase.co`, '8.8.8.8']);
                let output = '';
                
                nslookup.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                nslookup.on('close', (code) => {
                    if (output.includes('Address:') && !output.includes('NXDOMAIN')) {
                        console.log('✅ 代替DNSで解決成功');
                        resolve(true);
                    } else {
                        console.log('❌ 代替DNSでも解決失敗');
                        resolve(false);
                    }
                });
            });
        } catch (altError) {
            console.log('❌ 代替DNSテストも失敗');
            return false;
        }
    }
}

/**
 * HTTPSリクエストテスト
 */
async function testHTTPSConnection() {
    console.log('\n2️⃣ HTTPS接続テスト...');
    
    return new Promise((resolve) => {
        const url = new URL(`${PROJECT_URL}/rest/v1/`);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Supabase-Connection-Test/1.0'
            }
        };
        
        const req = https.request(options, (res) => {
            console.log(`✅ HTTPS接続成功: HTTP ${res.statusCode}`);
            console.log(`   サーバー: ${res.headers.server || 'Unknown'}`);
            console.log(`   Content-Type: ${res.headers['content-type'] || 'Unknown'}`);
            resolve(true);
        });
        
        req.on('error', (error) => {
            console.log(`❌ HTTPS接続失敗: ${error.code} - ${error.message}`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ HTTPS接続タイムアウト');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

/**
 * Supabase特有のエンドポイントテスト
 */
async function testSupabaseEndpoints() {
    console.log('\n3️⃣ Supabaseエンドポイントテスト...');
    
    const endpoints = [
        { name: 'REST API', path: '/rest/v1/' },
        { name: 'Auth API', path: '/auth/v1/settings' },
        { name: 'Storage API', path: '/storage/v1/bucket' },
        { name: 'Realtime', path: '/realtime/v1/' }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        try {
            const result = await testEndpoint(endpoint.name, `${PROJECT_URL}${endpoint.path}`);
            results.push({ ...endpoint, success: result });
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
            results.push({ ...endpoint, success: false });
        }
    }
    
    return results;
}

/**
 * 個別エンドポイントテスト
 */
function testEndpoint(name, url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'GET',
            timeout: 5000,
            headers: {
                'User-Agent': 'Supabase-Connection-Test/1.0'
            }
        };
        
        const req = https.request(options, (res) => {
            if (res.statusCode < 500) {
                console.log(`✅ ${name}: HTTP ${res.statusCode}`);
                resolve(true);
            } else {
                console.log(`❌ ${name}: HTTP ${res.statusCode} (サーバーエラー)`);
                resolve(false);
            }
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${name}: ${error.code}`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log(`❌ ${name}: タイムアウト`);
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

/**
 * プロジェクト状態の推定
 */
function analyzeProjectStatus(dnsOk, httpsOk, endpoints) {
    console.log('\n📊 プロジェクト状態分析...');
    
    if (!dnsOk) {
        console.log('🔴 プロジェクト状態: DNS未解決');
        console.log('   - プロジェクトがまだアクティベート中の可能性');
        console.log('   - DNS伝播待ち（最大48時間）');
        console.log('   - プロジェクトが削除されている可能性');
        return 'dns_unresolved';
    }
    
    if (!httpsOk) {
        console.log('🟡 プロジェクト状態: 接続不可');
        console.log('   - サーバーが起動中の可能性');
        console.log('   - ファイアウォールまたはネットワーク問題');
        return 'connection_failed';
    }
    
    const successfulEndpoints = endpoints.filter(e => e.success).length;
    const totalEndpoints = endpoints.length;
    
    if (successfulEndpoints === totalEndpoints) {
        console.log('🟢 プロジェクト状態: 完全にアクティブ');
        console.log('   - すべてのエンドポイントが応答');
        console.log('   - プロジェクトは正常に動作中');
        return 'fully_active';
    } else if (successfulEndpoints > 0) {
        console.log('🟡 プロジェクト状態: 部分的にアクティブ');
        console.log(`   - ${successfulEndpoints}/${totalEndpoints} エンドポイントが応答`);
        console.log('   - アクティベーション進行中の可能性');
        return 'partially_active';
    } else {
        console.log('🔴 プロジェクト状態: 非アクティブ');
        console.log('   - エンドポイントが応答しない');
        console.log('   - まだ一時停止中の可能性');
        return 'inactive';
    }
}

/**
 * 推奨アクション
 */
function suggestActions(status) {
    console.log('\n💡 推奨アクション:');
    
    switch (status) {
        case 'dns_unresolved':
            console.log('1. Supabaseダッシュボードでプロジェクト状態を再確認');
            console.log('2. DNS伝播を待つ（数分〜数時間）');
            console.log('3. 別のネットワークから接続テスト');
            break;
            
        case 'connection_failed':
            console.log('1. ファイアウォール設定を確認');
            console.log('2. VPN接続を確認');
            console.log('3. 別のネットワークから接続テスト');
            break;
            
        case 'partially_active':
            console.log('1. 数分待ってから再テスト');
            console.log('2. アクティベーション完了まで待機');
            break;
            
        case 'inactive':
            console.log('1. Supabaseダッシュボードで再度アクティベート');
            console.log('2. 課金設定を確認');
            console.log('3. Supabaseサポートに問い合わせ');
            break;
            
        case 'fully_active':
            console.log('1. アプリケーション設定を更新');
            console.log('2. 新しいAPIキーを取得');
            console.log('3. 接続テストを実行');
            break;
    }
}

/**
 * メイン実行関数
 */
async function main() {
    console.log(`プロジェクト: ${PROJECT_REF}`);
    console.log(`URL: ${PROJECT_URL}`);
    
    // DNS解決テスト
    const dnsOk = await testDNSResolution();
    
    // HTTPS接続テスト
    const httpsOk = dnsOk ? await testHTTPSConnection() : false;
    
    // エンドポイントテスト
    const endpoints = httpsOk ? await testSupabaseEndpoints() : [];
    
    // 状態分析
    const status = analyzeProjectStatus(dnsOk, httpsOk, endpoints);
    
    // 推奨アクション
    suggestActions(status);
    
    console.log('\n🔗 参考リンク:');
    console.log(`   ダッシュボード: https://supabase.com/dashboard/project/${PROJECT_REF}`);
    console.log('   ステータスページ: https://status.supabase.com/');
    
    return status;
}

// スクリプト実行
if (require.main === module) {
    main().catch(error => {
        console.error('\n💥 テスト実行中にエラーが発生しました:', error);
        process.exit(1);
    });
}

module.exports = { main };
