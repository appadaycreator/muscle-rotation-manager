const puppeteer = require('puppeteer');
const fs = require('fs');

async function runDetailedTests() {
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
        tests: [],
        errors: {
            console: [],
            javascript: []
        }
    };
    
    try {
        console.log('=== Detailed Test Suite Starting ===');
        
        // 1. メインページの読み込み確認
        console.log('1. Testing main page load...');
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'detailed-screenshot-main.png' });
        
        const mainPageTitle = await page.title();
        results.tests.push({
            test: '1. Main page load',
            status: mainPageTitle.includes('筋トレ') ? 'PASS' : 'FAIL',
            details: { title: mainPageTitle, url: page.url() }
        });
        
        // 2. プライバシーポリシーページの読み込み確認
        console.log('2. Testing privacy policy page...');
        await page.goto('http://localhost:8000/partials/privacy.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'detailed-screenshot-privacy.png' });
        
        const privacyContent = await page.content();
        results.tests.push({
            test: '2. Privacy policy page load',
            status: privacyContent.includes('プライバシーポリシー') ? 'PASS' : 'FAIL',
            details: { 
                hasContent: privacyContent.length > 100,
                containsPrivacyText: privacyContent.includes('プライバシーポリシー')
            }
        });
        
        // 3. メインページに戻ってサイドバーリンクのテスト
        console.log('3. Testing sidebar privacy link...');
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
        
        // サイドバーにプライバシーリンクがあるかチェック
        const privacyButton = await page.$('button[data-page="privacy"]');
        if (privacyButton) {
            // プライバシーボタンをクリック
            await privacyButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000)); // ページ切り替えを待つ
            await page.screenshot({ path: 'detailed-screenshot-privacy-via-sidebar.png' });
            
            // プライバシーページが表示されているかチェック
            const currentContent = await page.content();
            results.tests.push({
                test: '3. Sidebar privacy link functionality',
                status: currentContent.includes('プライバシーポリシー') ? 'PASS' : 'FAIL',
                details: {
                    buttonFound: true,
                    linkWorking: currentContent.includes('プライバシーポリシー')
                }
            });
        } else {
            results.tests.push({
                test: '3. Sidebar privacy link functionality',
                status: 'FAIL',
                details: { buttonFound: false, error: 'Privacy button not found in sidebar' }
            });
        }
        
        // 4. 新規登録モーダルのテスト
        console.log('4. Testing signup modal...');
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
        
        // ログインボタンを探してクリック
        const loginButton = await page.$('button[onclick*="showAuthModal"], .login-btn, #login-btn');
        if (loginButton) {
            await loginButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 新規登録に切り替え
            const switchToSignup = await page.$('#switch-to-signup');
            if (switchToSignup) {
                await switchToSignup.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.screenshot({ path: 'detailed-screenshot-signup-modal.png' });
                
                // プライバシー同意チェックボックスを確認
                const privacyCheckbox = await page.$('#privacy-agreement');
                const privacyLink = await page.$('button[onclick*="navigateToPage(\'privacy\')"]');
                
                results.tests.push({
                    test: '4. Signup modal privacy checkbox',
                    status: (privacyCheckbox && privacyLink) ? 'PASS' : 'FAIL',
                    details: {
                        checkboxFound: !!privacyCheckbox,
                        privacyLinkFound: !!privacyLink,
                        modalVisible: true
                    }
                });
            } else {
                results.tests.push({
                    test: '4. Signup modal privacy checkbox',
                    status: 'FAIL',
                    details: { error: 'Could not switch to signup form' }
                });
            }
        } else {
            results.tests.push({
                test: '4. Signup modal privacy checkbox',
                status: 'FAIL',
                details: { error: 'Login button not found' }
            });
        }
        
        // 5. JavaScriptエラーのチェック
        console.log('5. Checking for JavaScript errors...');
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
        
        // いくつかのページを巡回してエラーをチェック
        const pages = ['dashboard', 'workout', 'calendar', 'exercises'];
        for (const pageName of pages) {
            const pageButton = await page.$(`button[data-page="${pageName}"]`);
            if (pageButton) {
                await pageButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        results.tests.push({
            test: '5. JavaScript error check',
            status: (consoleErrors.length === 0 && jsErrors.length === 0) ? 'PASS' : 'FAIL',
            details: {
                consoleErrorCount: consoleErrors.length,
                jsErrorCount: jsErrors.length
            }
        });
        
        // エラー情報を保存
        results.errors.console = consoleErrors;
        results.errors.javascript = jsErrors;
        
    } catch (error) {
        console.error('Test execution error:', error);
        results.error = error.message;
    }
    
    await browser.close();
    
    // 結果をファイルに保存
    fs.writeFileSync('detailed-test-results.json', JSON.stringify(results, null, 2));
    
    // 結果を表示
    console.log('\\n=== Test Results Summary ===');
    results.tests.forEach((test, index) => {
        const status = test.status === 'PASS' ? '✅' : '❌';
        console.log(`${status} ${test.test}: ${test.status}`);
        if (test.status === 'FAIL' && test.details.error) {
            console.log(`   Error: ${test.details.error}`);
        }
    });
    
    console.log('\\n=== Error Summary ===');
    console.log(`Console Errors: ${results.errors.console.length}`);
    console.log(`JavaScript Errors: ${results.errors.javascript.length}`);
    
    if (results.errors.console.length > 0) {
        console.log('\\nConsole Errors:');
        results.errors.console.forEach((error, index) => {
            console.log(`${index + 1}. ${error.text}`);
        });
    }
    
    if (results.errors.javascript.length > 0) {
        console.log('\\nJavaScript Errors:');
        results.errors.javascript.forEach((error, index) => {
            console.log(`${index + 1}. ${error.message}`);
        });
    }
    
    return results;
}

runDetailedTests().catch(console.error);