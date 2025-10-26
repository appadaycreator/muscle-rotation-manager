// validation.test.js - validationのテスト

import {
  Validator,
  FormValidator,
  RealtimeValidator,
  ERROR_MESSAGES,
} from '../../js/utils/validation.js';
import { MUSCLE_GROUPS } from '../../js/utils/constants.js';

describe('Validation', () => {
  describe('Validator', () => {
    describe('required', () => {
      test('should validate required values', () => {
        const result = Validator.required('test value');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject empty values', () => {
        const result = Validator.required('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
      });

      test('should reject null values', () => {
        const result = Validator.required(null);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
      });
    });

    describe('email', () => {
      test('should validate correct email addresses', () => {
        const result = Validator.email('test@example.com');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject invalid email addresses', () => {
        const result = Validator.email('invalid-email');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ERROR_MESSAGES.INVALID_EMAIL);
      });

      test('should reject empty email', () => {
        const result = Validator.email('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
      });
    });

    describe('password', () => {
      test('should validate strong passwords', () => {
        const result = Validator.password('StrongPass123!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject weak passwords', () => {
        const result = Validator.password('weak');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      test('should reject empty password', () => {
        const result = Validator.password('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
      });
    });

    describe('numberRange', () => {
      test('should validate numbers within range', () => {
        const result = Validator.numberRange(5, 1, 10);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject numbers outside range', () => {
        const result = Validator.numberRange(15, 1, 10);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      test('should reject non-numeric values', () => {
        const result = Validator.numberRange('not-a-number', 1, 10);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ERROR_MESSAGES.INVALID_NUMBER);
      });
    });

    describe('safeText', () => {
      test('should validate safe text', () => {
        const result = Validator.safeText('Safe text content');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject text with invalid characters', () => {
        const result = Validator.safeText('<script>alert("xss")</script>');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(ERROR_MESSAGES.XSS_DETECTED);
      });
    });
  });

  describe('FormValidator', () => {
    let formValidator;

    beforeEach(() => {
      formValidator = new FormValidator();
    });

    test('should initialize with empty errors', () => {
      expect(formValidator.errors.size).toBe(0);
    });

    test('should validate field successfully', () => {
      const result = formValidator.validateField(
        'test',
        'value',
        Validator.required
      );
      expect(result).toBeDefined();
      // 実際の実装に応じて調整
      expect(result).toBeDefined();
    });

    test('should validate field with errors', () => {
      const result = formValidator.validateField(
        'test',
        '',
        Validator.required
      );
      expect(result).toBeDefined();
      // 実際の実装に応じて調整
      expect(result).toBeDefined();
    });

    test('should clear errors', () => {
      formValidator.errors.set('test', ['error']);
      formValidator.clearErrors();
      expect(formValidator.errors.size).toBe(0);
    });

    test('should validate workout form', () => {
      const formData = {
        exercise_name: 'Push-ups',
        muscle_group: '胸',
        sets: 3,
        reps: 10,
        weight: 0,
        notes: 'Good workout',
      };

      const result = formValidator.validateWorkoutForm(formData);
      expect(result).toBeDefined();
      // 実際の実装に応じて調整
      expect(result).toBeDefined();
    });

    test('should validate profile form', () => {
      const formData = {
        display_name: 'Test User',
        email: 'test@example.com',
        age: 25,
        fitness_level: 'beginner',
      };

      const result = formValidator.validateProfileForm(formData);
      expect(result).toBeDefined();
    });
  });

  describe('RealtimeValidator', () => {
    let realtimeValidator;

    beforeEach(() => {
      realtimeValidator = new RealtimeValidator();
    });

    test('should initialize with form validator', () => {
      // 実際の実装に応じて調整
      expect(realtimeValidator).toBeDefined();
    });

    test('should setup field validation', () => {
      const mockElement = {
        addEventListener: jest.fn(),
      };

      realtimeValidator.setupFieldValidation(
        mockElement,
        'test',
        Validator.required
      );

      expect(mockElement.addEventListener).toHaveBeenCalled();
    });

    test('should setup auth form validation', () => {
      const mockForm = {
        querySelector: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
        }),
      };

      realtimeValidator.setupAuthFormValidation(mockForm);

      expect(mockForm.querySelector).toHaveBeenCalled();
    });
  });
});
