// SettingsPage.test.js - 設定ページのテスト

import SettingsPage from '../../js/pages/settingsPage.js';

describe('SettingsPage', () => {
  test('should export SettingsPage instance', () => {
    expect(SettingsPage).toBeDefined();
    expect(typeof SettingsPage).toBe('object');
  });

  test('should have initialize method', () => {
    expect(typeof SettingsPage.initialize).toBe('function');
  });

  test('should have setupAuthStateListener method', () => {
    expect(typeof SettingsPage.setupAuthStateListener).toBe('function');
  });

  test('should have renderSettingsPage method', () => {
    expect(typeof SettingsPage.renderSettingsPage).toBe('function');
  });

  test('should have setupTooltips method', () => {
    expect(typeof SettingsPage.setupTooltips).toBe('function');
  });
});
