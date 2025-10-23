// Constants.test.js - constantsのテスト

import { MUSCLE_GROUPS, SUPABASE_CONFIG } from '../../js/utils/constants.js';

describe('Constants', () => {
  describe('MUSCLE_GROUPS', () => {
    test('should contain expected muscle groups', () => {
      const muscleNames = MUSCLE_GROUPS.map(muscle => muscle.name);
      expect(muscleNames).toContain('胸筋');
      expect(muscleNames).toContain('背筋');
      expect(muscleNames).toContain('肩');
      expect(muscleNames).toContain('腕');
      expect(muscleNames).toContain('脚');
      expect(muscleNames).toContain('体幹');
    });

    test('should be an array', () => {
      expect(Array.isArray(MUSCLE_GROUPS)).toBe(true);
    });

    test('should have correct length', () => {
      expect(MUSCLE_GROUPS).toHaveLength(6);
    });

    test('should have required properties for each muscle group', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        expect(muscle).toHaveProperty('id');
        expect(muscle).toHaveProperty('name');
        expect(muscle).toHaveProperty('recoveryHours');
        expect(muscle).toHaveProperty('category');
        expect(muscle).toHaveProperty('scientificBasis');
      });
    });
  });

  describe('SUPABASE_CONFIG', () => {
    test('should have required configuration properties', () => {
      expect(SUPABASE_CONFIG).toHaveProperty('url');
      expect(SUPABASE_CONFIG).toHaveProperty('key');
      expect(typeof SUPABASE_CONFIG.url).toBe('string');
      expect(typeof SUPABASE_CONFIG.key).toBe('string');
    });
  });
});
