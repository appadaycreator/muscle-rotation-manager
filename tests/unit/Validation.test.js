// Validation.test.js - validationユーティリティのテスト

import { VALIDATION_RULES, ERROR_MESSAGES } from '../../js/utils/validation.js';

describe('Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('VALIDATION_RULES', () => {
    test('should have required validation rules', () => {
      expect(VALIDATION_RULES).toHaveProperty('WEIGHT');
      expect(VALIDATION_RULES).toHaveProperty('REPS');
      expect(VALIDATION_RULES).toHaveProperty('SETS');
      expect(VALIDATION_RULES).toHaveProperty('EMAIL_PATTERN');
      expect(VALIDATION_RULES).toHaveProperty('PASSWORD_PATTERN');
    });

    test('should have correct weight range', () => {
      expect(VALIDATION_RULES.WEIGHT.min).toBe(0.1);
      expect(VALIDATION_RULES.WEIGHT.max).toBe(500);
      expect(VALIDATION_RULES.WEIGHT.unit).toBe('kg');
    });

    test('should have correct reps range', () => {
      expect(VALIDATION_RULES.REPS.min).toBe(1);
      expect(VALIDATION_RULES.REPS.max).toBe(100);
      expect(VALIDATION_RULES.REPS.unit).toBe('回');
    });
  });

  describe('ERROR_MESSAGES', () => {
    test('should have required error messages', () => {
      expect(ERROR_MESSAGES).toHaveProperty('REQUIRED');
      expect(ERROR_MESSAGES).toHaveProperty('INVALID_EMAIL');
      expect(ERROR_MESSAGES).toHaveProperty('INVALID_PASSWORD');
      expect(ERROR_MESSAGES).toHaveProperty('INVALID_NUMBER');
    });
  });

  describe('validation functions', () => {
    test('should have validation rules defined', () => {
      expect(VALIDATION_RULES).toBeDefined();
      expect(ERROR_MESSAGES).toBeDefined();
    });
  });
});
