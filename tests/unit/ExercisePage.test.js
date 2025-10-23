// ExercisePage.test.js - エクササイズページのテスト

import { exercisePage } from '../../js/pages/exercisePage.js';

describe('ExercisePage', () => {
  test('should export exercisePage instance', () => {
    expect(exercisePage).toBeDefined();
    expect(typeof exercisePage).toBe('object');
  });

  test('should have init method', () => {
    expect(typeof exercisePage.init).toBe('function');
  });

  test('should have setupEventListeners method', () => {
    expect(typeof exercisePage.setupEventListeners).toBe('function');
  });

  test('should have loadExercises method', () => {
    expect(typeof exercisePage.loadExercises).toBe('function');
  });

  test('should have renderExercises method', () => {
    expect(typeof exercisePage.renderExercises).toBe('function');
  });

  test('should have setupTooltips method', () => {
    expect(typeof exercisePage.setupTooltips).toBe('function');
  });
});