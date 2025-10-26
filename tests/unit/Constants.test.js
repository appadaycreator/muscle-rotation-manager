/**
 * Constants テストスイート
 */

import {
  SUPABASE_CONFIG,
  MUSCLE_GROUPS,
  STORAGE_KEYS,
} from '../../js/utils/constants.js';

describe('Constants', () => {
  describe('SUPABASE_CONFIG', () => {
    it('should have required Supabase configuration', () => {
      expect(SUPABASE_CONFIG).toBeDefined();
      expect(typeof SUPABASE_CONFIG).toBe('object');
      expect(SUPABASE_CONFIG).toHaveProperty('url');
      expect(SUPABASE_CONFIG).toHaveProperty('key');
    });
  });

  describe('MUSCLE_GROUPS', () => {
    it('should have required muscle groups', () => {
      expect(MUSCLE_GROUPS).toBeDefined();
      expect(Array.isArray(MUSCLE_GROUPS)).toBe(true);
      expect(MUSCLE_GROUPS.length).toBeGreaterThan(0);
    });

    it('should have muscle groups with required properties', () => {
      MUSCLE_GROUPS.forEach((group) => {
        expect(group).toHaveProperty('id');
        expect(group).toHaveProperty('name');
        expect(group).toHaveProperty('color');
        expect(group).toHaveProperty('recoveryHours');
      });
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have required storage keys', () => {
      expect(STORAGE_KEYS).toBeDefined();
      expect(typeof STORAGE_KEYS).toBe('object');
    });

    it('should have common storage keys', () => {
      expect(STORAGE_KEYS).toHaveProperty('USER_SETTINGS');
      expect(STORAGE_KEYS).toHaveProperty('WORKOUT_HISTORY');
      expect(STORAGE_KEYS).toHaveProperty('DARK_MODE');
    });
  });

  describe('integration', () => {
    it('should have consistent data structures', () => {
      // すべての定数が定義されていることを確認
      expect(SUPABASE_CONFIG).toBeDefined();
      expect(MUSCLE_GROUPS).toBeDefined();
      expect(STORAGE_KEYS).toBeDefined();
    });
  });
});
