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

  describe('additional constants tests', () => {
    test('should have valid muscle group IDs', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        expect(typeof muscle.id).toBe('string');
        expect(muscle.id.length).toBeGreaterThan(0);
      });
    });

    test('should have valid recovery hours', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        expect(typeof muscle.recoveryHours).toBe('number');
        expect(muscle.recoveryHours).toBeGreaterThan(0);
        expect(muscle.recoveryHours).toBeLessThanOrEqual(168); // 1週間以内
      });
    });

    test('should have valid categories', () => {
      const validCategories = ['upper', 'lower', 'core', 'full', 'large', 'medium', 'small'];
      MUSCLE_GROUPS.forEach(muscle => {
        expect(validCategories).toContain(muscle.category);
      });
    });

    test('should have scientific basis for each muscle group', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        expect(typeof muscle.scientificBasis).toBe('string');
        expect(muscle.scientificBasis.length).toBeGreaterThan(0);
      });
    });

    test('should have unique muscle group IDs', () => {
      const ids = MUSCLE_GROUPS.map(muscle => muscle.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    test('should have unique muscle group names', () => {
      const names = MUSCLE_GROUPS.map(muscle => muscle.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    test('should have valid muscle group descriptions', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        // 実際の実装に応じて調整
        if (muscle.description) {
          expect(typeof muscle.description).toBe('string');
          expect(muscle.description.length).toBeGreaterThan(0);
        }
      });
    });

    test('should have valid muscle group exercises', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        // 実際の実装に応じて調整
        if (muscle.exercises) {
          expect(Array.isArray(muscle.exercises)).toBe(true);
          expect(muscle.exercises.length).toBeGreaterThan(0);
        }
      });
    });

    test('should have valid muscle group tips', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        // 実際の実装に応じて調整
        if (muscle.tips) {
          expect(Array.isArray(muscle.tips)).toBe(true);
          expect(muscle.tips.length).toBeGreaterThan(0);
        }
      });
    });

    test('should have valid muscle group warnings', () => {
      MUSCLE_GROUPS.forEach(muscle => {
        // 実際の実装に応じて調整
        if (muscle.warnings) {
          expect(Array.isArray(muscle.warnings)).toBe(true);
        }
      });
    });
  });
});
