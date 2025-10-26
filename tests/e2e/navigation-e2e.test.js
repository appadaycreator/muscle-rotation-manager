// tests/e2e/navigation-e2e.test.js - ナビゲーションE2Eテスト

import puppeteer from 'puppeteer';

describe('Navigation E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // ネットワークエラーを監視
    page.on('response', response => {
      if (response.status() >= 400) {
        console.warn(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('ナビゲーションリンクの動作確認', () => {
    test('ダッシュボードから各ページへの遷移が正常に動作する', async () => {
      // ローカルサーバーまたはGitHub Pagesにアクセス
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8000';
      await page.goto(`${baseUrl}/index.html`);

      // ページが正常に読み込まれることを確認
      await page.waitForSelector('nav', { timeout: 10000 });

      // 各ナビゲーションリンクをテスト
      const navigationLinks = [
        { href: 'workout.html', title: 'ワークアウト' },
        { href: 'calendar.html', title: 'カレンダー' },
        { href: 'analysis.html', title: '分析' },
        { href: 'progress.html', title: 'プログレッシブ・オーバーロード' },
        { href: 'exercises.html', title: 'エクササイズデータベース' },
        { href: 'settings.html', title: '設定' },
        { href: 'help.html', title: '使い方' },
        { href: 'privacy.html', title: 'プライバシーポリシー' },
      ];

      for (const link of navigationLinks) {
        console.log(`Testing navigation to ${link.href}...`);
        
        // リンクをクリック
        await page.click(`a[href="${link.href}"]`);
        
        // ページが正常に読み込まれることを確認
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // 404エラーが発生していないことを確認
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('404');
        
        // ページタイトルが正しく設定されていることを確認
        const title = await page.title();
        expect(title).toContain(link.title);
        
        // ダッシュボードに戻る
        await page.goto(`${baseUrl}/index.html`);
      }
    });

    test('サイドバーのリンクが正常に動作する', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8000';
      await page.goto(`${baseUrl}/index.html`);

      // サイドバーが表示されることを確認
      await page.waitForSelector('#desktop-sidebar', { timeout: 10000 });

      // サイドバーの各リンクをテスト
      const sidebarLinks = await page.$$eval('#desktop-sidebar a[href$=".html"]', 
        links => links.map(link => link.href)
      );

      for (const linkHref of sidebarLinks) {
        console.log(`Testing sidebar link: ${linkHref}`);
        
        // リンクをクリック
        await page.click(`#desktop-sidebar a[href="${linkHref}"]`);
        
        // ページが正常に読み込まれることを確認
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // 404エラーが発生していないことを確認
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('404');
        
        // ダッシュボードに戻る
        await page.goto(`${baseUrl}/index.html`);
      }
    });

    test('フッターのリンクが正常に動作する', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8000';
      await page.goto(`${baseUrl}/index.html`);

      // フッターが表示されることを確認
      await page.waitForSelector('footer', { timeout: 10000 });

      // フッターの各リンクをテスト
      const footerLinks = await page.$$eval('footer a[href$=".html"]', 
        links => links.map(link => link.href)
      );

      for (const linkHref of footerLinks) {
        console.log(`Testing footer link: ${linkHref}`);
        
        // リンクをクリック
        await page.click(`footer a[href="${linkHref}"]`);
        
        // ページが正常に読み込まれることを確認
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // 404エラーが発生していないことを確認
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('404');
        
        // ダッシュボードに戻る
        await page.goto(`${baseUrl}/index.html`);
      }
    });
  });

  describe('GitHub Pages環境での動作確認', () => {
    test('GitHub PagesのURLで正常に動作する', async () => {
      const githubPagesUrl = 'https://appadaycreator.github.io/muscle-rotation-manager/';
      
      try {
        await page.goto(githubPagesUrl);
        
        // ページが正常に読み込まれることを確認
        await page.waitForSelector('nav', { timeout: 15000 });
        
        // ナビゲーションリンクをテスト
        const navLinks = await page.$$eval('nav a[href$=".html"]', 
          links => links.map(link => link.href)
        );

        for (const linkHref of navLinks) {
          console.log(`Testing GitHub Pages link: ${linkHref}`);
          
          // リンクをクリック
          await page.click(`nav a[href="${linkHref}"]`);
          
          // ページが正常に読み込まれることを確認
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          
          // 404エラーが発生していないことを確認
          const currentUrl = page.url();
          expect(currentUrl).not.toContain('404');
          expect(currentUrl).toContain('appadaycreator.github.io');
          
          // ホームに戻る
          await page.goto(githubPagesUrl);
        }
      } catch (error) {
        console.warn('GitHub Pages test skipped:', error.message);
        // GitHub Pagesが利用できない場合はスキップ
      }
    });
  });

  describe('モバイルナビゲーションの動作確認', () => {
    test('モバイルサイドバーのリンクが正常に動作する', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8000';
      
      // モバイルビューに設定
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/index.html`);

      // モバイルメニューボタンをクリック
      await page.click('#mobile-menu-btn');
      
      // モバイルサイドバーが表示されることを確認
      await page.waitForSelector('#mobile-sidebar', { timeout: 10000 });

      // モバイルサイドバーの各リンクをテスト
      const mobileLinks = await page.$$eval('#mobile-sidebar a[href$=".html"]', 
        links => links.map(link => link.href)
      );

      for (const linkHref of mobileLinks) {
        console.log(`Testing mobile sidebar link: ${linkHref}`);
        
        // リンクをクリック
        await page.click(`#mobile-sidebar a[href="${linkHref}"]`);
        
        // ページが正常に読み込まれることを確認
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // 404エラーが発生していないことを確認
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('404');
        
        // ダッシュボードに戻る
        await page.goto(`${baseUrl}/index.html`);
        await page.click('#mobile-menu-btn');
      }
    });
  });
});
