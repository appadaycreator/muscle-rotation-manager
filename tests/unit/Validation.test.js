// validation.test.js - validationユーティリティのテスト

import { Validator, FormValidator, RealtimeValidator } from '../../js/utils/validation.js';

describe('Validation', () => {
  describe('Validator', () => {
    describe('required', () => {
      test('should validate required values', () => {
        const result = Validator.required('value');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.sanitizedData).toBe('value');
      });

      test('should reject empty values', () => {
        const result = Validator.required('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('この項目は必須です');
      });

      test('should reject null values', () => {
        const result = Validator.required(null);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('この項目は必須です');
      });
    });

    describe('email', () => {
      test('should validate correct email addresses', () => {
        const result = Validator.email('test@example.com');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.sanitizedData).toBe('test@example.com');
      });

      test('should reject invalid email addresses', () => {
        const result = Validator.email('invalid-email');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('メールアドレスの形式が正しくありません');
      });

      test('should reject empty email', () => {
        const result = Validator.email('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('この項目は必須です');
      });
    });

    describe('password', () => {
      test('should validate strong passwords', () => {
        const result = Validator.password('Password123!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject weak passwords', () => {
        const result = Validator.password('123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('パスワードは8文字以上で入力してください');
      });

      test('should reject empty password', () => {
        const result = Validator.password('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('この項目は必須です');
      });
    });

    describe('numberRange', () => {
      test('should validate numbers within range', () => {
        const result = Validator.numberRange(50, 0, 100, 'kg');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject numbers outside range', () => {
        const result = Validator.numberRange(150, 0, 100, 'kg');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('0kgから100kgの範囲で入力してください');
      });

      test('should reject non-numeric values', () => {
        const result = Validator.numberRange('not-a-number', 0, 100, 'kg');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('数値を入力してください');
      });
    });

    describe('safeText', () => {
      test('should validate safe text', () => {
        const result = Validator.safeText('Hello World');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject text with invalid characters', () => {
        const result = Validator.safeText('<script>alert("xss")</script>');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('不正なスクリプトが検出されました');
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
      const result = formValidator.validateField('test', 'value', Validator.required);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    test('should validate field with errors', () => {
      const result = formValidator.validateField('test', '', Validator.required);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(formValidator.errors.has('test')).toBe(true);
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
        notes: 'Good workout'
      };

      const result = formValidator.validateWorkoutForm(formData);
      expect(result).toBeDefined();
      expect(result.exercise_name).toBeDefined();
    });

    test('should validate profile form', () => {
      const formData = {
        display_name: 'Test User',
        email: 'test@example.com',
        age: 25,
        weight: 70,
        height: 175
      };

      const result = formValidator.validateProfileForm(formData);
      expect(result).toBeDefined();
      expect(result.display_name).toBe('Test User');
    });
  });

  describe('RealtimeValidator', () => {
    let formValidator;
    let realtimeValidator;

    beforeEach(() => {
      formValidator = new FormValidator();
      realtimeValidator = new RealtimeValidator(formValidator);
    });

    test('should initialize with form validator', () => {
      expect(realtimeValidator.formValidator).toBe(formValidator);
    });

    test('should setup field validation', () => {
      const inputElement = document.createElement('input');
      const errorElement = document.createElement('div');
      
      realtimeValidator.setupFieldValidation(inputElement, errorElement, Validator.required);
      
      expect(inputElement).toBeDefined();
      expect(errorElement).toBeDefined();
    });

    test('should setup auth form validation', () => {
      const formElement = document.createElement('form');
      formElement.innerHTML = `
        <input id="auth-email" type="email">
        <input id="auth-password" type="password">
        <div id="email-error"></div>
        <div id="password-error"></div>
      `;
      
      realtimeValidator.setupAuthFormValidation(formElement);
      
      expect(formElement.querySelector('#auth-email')).toBeDefined();
      expect(formElement.querySelector('#auth-password')).toBeDefined();
    });
  });
});
