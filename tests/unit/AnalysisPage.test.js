// AnalysisPage.test.js - 分析ページのテスト

import AnalysisPage from '../../js/pages/analysisPage.js';

describe('AnalysisPage', () => {
  test('should export AnalysisPage instance', () => {
    expect(AnalysisPage).toBeDefined();
    expect(typeof AnalysisPage).toBe('object');
  });

  test('should have initialize method', () => {
    expect(typeof AnalysisPage.initialize).toBe('function');
  });

  test('should have loadWorkoutData method', () => {
    expect(typeof AnalysisPage.loadWorkoutData).toBe('function');
  });

  test('should have renderCharts method', () => {
    expect(typeof AnalysisPage.renderCharts).toBe('function');
  });
});
