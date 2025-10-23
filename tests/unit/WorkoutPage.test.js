// WorkoutPage.test.js - ワークアウトページのテスト

import WorkoutPageModule from '../../js/pages/workoutPage.js';

describe('WorkoutPage', () => {
  test('should export initialize function', () => {
    expect(WorkoutPageModule).toBeDefined();
    expect(typeof WorkoutPageModule.initialize).toBe('function');
  });

  test('should have initialize method', async () => {
    await expect(WorkoutPageModule.initialize()).resolves.not.toThrow();
  });
});
