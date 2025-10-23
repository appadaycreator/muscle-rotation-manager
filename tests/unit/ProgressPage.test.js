// ProgressPage.test.js - プログレスページのテスト

import { progressPage } from '../../js/pages/progressPage.js';

describe('ProgressPage', () => {
  test('should export progressPage instance', () => {
    expect(progressPage).toBeDefined();
    expect(typeof progressPage).toBe('object');
  });

  test('should have init method', () => {
    expect(typeof progressPage.init).toBe('function');
  });

  test('should have render method', () => {
    expect(typeof progressPage.render).toBe('function');
  });

  test('should have bindEvents method', () => {
    expect(typeof progressPage.bindEvents).toBe('function');
  });

  test('should have loadExercises method', () => {
    expect(typeof progressPage.loadExercises).toBe('function');
  });

  test('should have loadProgressData method', () => {
    expect(typeof progressPage.loadProgressData).toBe('function');
  });

  test('should have setupTooltips method', () => {
    expect(typeof progressPage.setupTooltips).toBe('function');
  });
});