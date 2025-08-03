const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runTests() {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // コンソールエラーをキャプチャ
    const consoleErrors = [];
    const jsErrors = [];
    
    page.on('console', (message) => {
        if (message.type() === 'error') {
            consoleErrors.push({
                type: 'console',
                text: message.text(),
                location: message.location()
            });
        }
    });
    
    page.on('pageerror', (error) => {
        jsErrors.push({
            type: 'javascript',
            message: error.message,
            stack: error.stack
        });
    });
    
    const results = {
        mainPage: null,
        privacyPage: null,
        sidebarLinks: null,
        signupModal: null,
        errors: {
            console: [],
            javascript: []
        }
    };
    
    try {
        console.log('Testing main page...');
        // 1. メインページのテスト
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'screenshot-main.png' });
        
        const mainPageTitle = await page.title();
        results.mainPage = {
            status: 'success',
            title: mainPageTitle,
            url: page.url()
        };
        
        console.log('Testing privacy policy page...');
        // 2. プライバシーポリシーページのテスト
        await page.goto('http://localhost:8000/partials/privacy.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'screenshot-privacy.png' });
        
        const privacyPageContent = await page.content();
        results.privacyPage = {
            status: privacyPageContent.includes('プライバシーポリシー') ? 'success' : 'warning',
            hasContent: privacyPageContent.length > 100,
            url: page.url()
        };
        
        console.log('Testing main page interactions...');
        // 3. メインページに戻ってサイドバーとモーダルのテスト
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
        
        // サイドバーのプライバシーポリシーリンクをチェック
        const privacyLinks = await page.$$('a[href*="privacy"]');
        results.sidebarLinks = {
            status: privacyLinks.length > 0 ? 'success' : 'warning',
            linkCount: privacyLinks.length
        };
        
        // 新規登録モーダルのテスト（モーダルを開くボタンがある場合）
        const signupButtons = await page.$$('button[data-modal="signup"], .signup-btn, #signup-btn');
        if (signupButtons.length > 0) {
            console.log('Testing signup modal...');
            await signupButtons[0].click();
            await page.waitForTimeout(1000); // モーダルが開くのを待つ
            await page.screenshot({ path: 'screenshot-signup-modal.png' });
            
            const privacyCheckbox = await page.$('input[type="checkbox"][name*="privacy"], input[type="checkbox"][id*="privacy"]');
            results.signupModal = {
                status: privacyCheckbox ? 'success' : 'warning',
                hasPrivacyCheckbox: !!privacyCheckbox
            };
        } else {
            results.signupModal = {
                status: 'not_found',
                message: 'Signup button not found'
            };
        }
        
        // 各種エラーを収集
        results.errors.console = consoleErrors;
        results.errors.javascript = jsErrors;
        
    } catch (error) {
        console.error('Test execution error:', error);
        results.error = error.message;
    }
    
    await browser.close();
    
    // 結果をファイルに保存
    fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
    
    console.log('Test Results:');
    console.log('============');
    console.log(`Main Page: ${results.mainPage?.status || 'failed'}`);
    console.log(`Privacy Page: ${results.privacyPage?.status || 'failed'}`);
    console.log(`Sidebar Links: ${results.sidebarLinks?.status || 'failed'}`);
    console.log(`Signup Modal: ${results.signupModal?.status || 'failed'}`);
    console.log(`Console Errors: ${results.errors.console.length}`);
    console.log(`JavaScript Errors: ${results.errors.javascript.length}`);
    
    if (results.errors.console.length > 0) {
        console.log('\nConsole Errors:');
        results.errors.console.forEach((error, index) => {
            console.log(`${index + 1}. ${error.text}`);
        });
    }
    
    if (results.errors.javascript.length > 0) {
        console.log('\nJavaScript Errors:');
        results.errors.javascript.forEach((error, index) => {
            console.log(`${index + 1}. ${error.message}`);
            if (error.stack) {
                console.log(`   Stack: ${error.stack.substring(0, 200)}...`);
            }
        });
    }
    
    return results;
}

runTests().catch(console.error);