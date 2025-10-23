// DashboardPage.test.js - ダッシュボードページのテスト

import dashboardPage from '../../js/pages/dashboardPage.js';

describe('DashboardPage', () => {
  test('should export dashboardPage instance', () => {
    expect(dashboardPage).toBeDefined();
    expect(typeof dashboardPage).toBe('object');
  });

  test('should have initialize method', () => {
    expect(typeof dashboardPage.initialize).toBe('function');
  });

  test('should have renderDashboard method', () => {
    expect(typeof dashboardPage.renderDashboard).toBe('function');
  });

  test('should have loadStats method', () => {
    expect(typeof dashboardPage.loadStats).toBe('function');
  });

  test('should have loadRecommendations method', () => {
    expect(typeof dashboardPage.loadRecommendations).toBe('function');
  });

  test('should have setupTooltips method', () => {
    expect(typeof dashboardPage.setupTooltips).toBe('function');
  });
});