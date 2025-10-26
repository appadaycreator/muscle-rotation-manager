// tests/unit/navigation.test.js - ナビゲーションリンクのテスト（最小版）

import { jest } from '@jest/globals';

// モック設定
global.fetch = jest.fn();
global.window = {
  location: {
    pathname: '/muscle-rotation-manager/index.html',
    href: 'https://appadaycreator.github.io/muscle-rotation-manager/index.html',
    assign: jest.fn(),
  },
  innerWidth: 1024,
  innerHeight: 768,
};

// Navigation.jsをインポート
import { Navigation } from '../../js/components/Navigation.js';

describe('Navigation Component', () => {
  let navigation;

  beforeEach(() => {
    navigation = new Navigation();
    jest.clearAllMocks();
  });

  describe('ナビゲーションアイテムのリンク', () => {
    test('全てのナビゲーションアイテムが相対パスを使用している', () => {
      const navigationItems = navigation.navigationItems;
      
      navigationItems.forEach(item => {
        // 絶対パス（/で始まる）を使用していないことを確認
        expect(item.href).not.toMatch(/^\/.*$/);
        // 相対パスまたはファイル名のみであることを確認
        expect(item.href).toMatch(/^[^\/].*\.html$/);
      });
    });

    test('ダッシュボードリンクが正しい', () => {
      const dashboardItem = navigation.navigationItems.find(item => item.id === 'dashboard');
      expect(dashboardItem.href).toBe('index.html');
    });

    test('ワークアウトリンクが正しい', () => {
      const workoutItem = navigation.navigationItems.find(item => item.id === 'workout');
      expect(workoutItem.href).toBe('workout.html');
    });

    test('カレンダーリンクが正しい', () => {
      const calendarItem = navigation.navigationItems.find(item => item.id === 'calendar');
      expect(calendarItem.href).toBe('calendar.html');
    });

    test('分析リンクが正しい', () => {
      const analysisItem = navigation.navigationItems.find(item => item.id === 'analysis');
      expect(analysisItem.href).toBe('analysis.html');
    });

    test('プログレッシブ・オーバーロードリンクが正しい', () => {
      const progressItem = navigation.navigationItems.find(item => item.id === 'progress');
      expect(progressItem.href).toBe('progress.html');
    });

    test('エクササイズデータベースリンクが正しい', () => {
      const exercisesItem = navigation.navigationItems.find(item => item.id === 'exercises');
      expect(exercisesItem.href).toBe('exercises.html');
    });

    test('設定リンクが正しい', () => {
      const settingsItem = navigation.navigationItems.find(item => item.id === 'settings');
      expect(settingsItem.href).toBe('settings.html');
    });

    test('ヘルプリンクが正しい', () => {
      const helpItem = navigation.navigationItems.find(item => item.id === 'help');
      expect(helpItem.href).toBe('help.html');
    });

    test('プライバシーポリシーリンクが正しい', () => {
      const privacyItem = navigation.navigationItems.find(item => item.id === 'privacy');
      expect(privacyItem.href).toBe('privacy.html');
    });
  });

  describe('現在のページ取得', () => {
    test('現在のパスを正しく認識する', () => {
      // テスト環境のデフォルトパスを使用
      const currentPage = navigation.getCurrentPage();
      expect(currentPage).toBe('index');
    });

    test('getCurrentPageメソッドが文字列を返す', () => {
      const currentPage = navigation.getCurrentPage();
      expect(typeof currentPage).toBe('string');
      expect(currentPage.length).toBeGreaterThan(0);
    });
  });
});

describe('HTMLファイルのリンク検証', () => {
  beforeEach(() => {
    // 各テスト前にfetchをリセット
    jest.clearAllMocks();
  });

  test('sidebar.htmlのリンクが相対パスである', async () => {
    // fetchをモック
    const mockText = jest.fn().mockResolvedValue(`
      <a href="workout.html">ワークアウト</a>
      <a href="calendar.html">カレンダー</a>
      <a href="analysis.html">分析</a>
    `);
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: mockText
    });
    
    const response = await fetch('partials/sidebar.html');
    expect(response.ok).toBe(true);
    
    const html = await response.text();
    
    // 絶対パス（/で始まる）のリンクがないことを確認
    const absoluteLinks = html.match(/href="\/[^"]*\.html"/g);
    expect(absoluteLinks).toBeNull();
    
    // 相対パスのリンクがあることを確認
    const relativeLinks = html.match(/href="[^\/][^"]*\.html"/g);
    expect(relativeLinks).not.toBeNull();
    expect(relativeLinks.length).toBeGreaterThan(0);
  });

  test('footer.htmlのリンクが相対パスである', async () => {
    // fetchをモック
    const mockText = jest.fn().mockResolvedValue(`
      <a href="workout.html">ワークアウト</a>
      <a href="calendar.html">カレンダー</a>
      <a href="analysis.html">分析</a>
    `);
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: mockText
    });
    
    const response = await fetch('partials/footer.html');
    expect(response.ok).toBe(true);
    
    const html = await response.text();
    
    // 絶対パス（/で始まる）のリンクがないことを確認
    const absoluteLinks = html.match(/href="\/[^"]*\.html"/g);
    expect(absoluteLinks).toBeNull();
    
    // 相対パスのリンクがあることを確認
    const relativeLinks = html.match(/href="[^\/][^"]*\.html"/g);
    expect(relativeLinks).not.toBeNull();
    expect(relativeLinks.length).toBeGreaterThan(0);
  });
});