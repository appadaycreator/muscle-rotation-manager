// validation.js - 包括的なバリデーションシステム

/**
 * バリデーション結果オブジェクト
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - バリデーション結果
 * @property {string[]} errors - エラーメッセージ配列
 * @property {Object} sanitizedData - サニタイズされたデータ
 */

/**
 * バリデーションルール定義
 */
export const VALIDATION_RULES = {
  // 数値範囲
  WEIGHT: { min: 0.1, max: 500, unit: 'kg' },
  REPS: { min: 1, max: 100, unit: '回' },
  SETS: { min: 1, max: 10, unit: 'セット' },

  // 文字列長
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NICKNAME_MAX_LENGTH: 50,
  EXERCISE_NAME_MAX_LENGTH: 100,
  NOTES_MAX_LENGTH: 1000,

  // 正規表現パターン
  // eslint-disable-next-line max-len
  EMAIL_PATTERN:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
  PASSWORD_PATTERN: /^[a-zA-Z\d@$!%*?&]{8,}$/,
  SAFE_TEXT_PATTERN:
    /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_.()（）、。！？]*$/,
};

/**
 * エラーメッセージ定義
 */
export const ERROR_MESSAGES = {
  REQUIRED: 'この項目は必須です',
  INVALID_EMAIL: 'メールアドレスの形式が正しくありません',
  INVALID_PASSWORD: 'パスワードは8文字以上で入力してください',
  INVALID_NUMBER: '数値を入力してください',
  OUT_OF_RANGE: (min, max, unit) =>
    `${min}${unit}から${max}${unit}の範囲で入力してください`,
  TOO_LONG: (max) => `${max}文字以内で入力してください`,
  INVALID_CHARACTERS: '使用できない文字が含まれています',
  XSS_DETECTED: '不正なスクリプトが検出されました',
};

/**
 * HTMLエスケープ処理
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return String(str);
  }

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (match) => escapeMap[match]);
}

/**
 * XSS攻撃パターンの検出
 * @param {string} input - 検査する文字列
 * @returns {boolean} XSS攻撃パターンが検出されたかどうか
 */
export function detectXSS(input) {
  if (typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<link\b/gi,
    /<meta\b/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * 基本バリデーター
 */
export class Validator {
  /**
   * 必須チェック
   * @param {*} value - チェックする値
   * @returns {ValidationResult} バリデーション結果
   */
  static required(value) {
    const isValid =
      value !== null && value !== undefined && String(value).trim() !== '';
    return {
      isValid,
      errors: isValid ? [] : [ERROR_MESSAGES.REQUIRED],
      sanitizedData: isValid ? String(value).trim() : '',
    };
  }

  /**
   * メールアドレスバリデーション
   * @param {string} email - メールアドレス
   * @returns {ValidationResult} バリデーション結果
   */
  static email(email) {
    const errors = [];
    let sanitizedEmail = '';

    if (!email || typeof email !== 'string') {
      errors.push(ERROR_MESSAGES.REQUIRED);
    } else {
      sanitizedEmail = email.trim().toLowerCase();

      if (sanitizedEmail.length > VALIDATION_RULES.EMAIL_MAX_LENGTH) {
        errors.push(ERROR_MESSAGES.TOO_LONG(VALIDATION_RULES.EMAIL_MAX_LENGTH));
      }

      if (!VALIDATION_RULES.EMAIL_PATTERN.test(sanitizedEmail)) {
        errors.push(ERROR_MESSAGES.INVALID_EMAIL);
      }

      if (detectXSS(sanitizedEmail)) {
        errors.push(ERROR_MESSAGES.XSS_DETECTED);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedEmail,
    };
  }

  /**
   * パスワードバリデーション
   * @param {string} password - パスワード
   * @returns {ValidationResult} バリデーション結果
   */
  static password(password) {
    const errors = [];
    let sanitizedPassword = '';

    if (!password || typeof password !== 'string') {
      errors.push(ERROR_MESSAGES.REQUIRED);
    } else {
      sanitizedPassword = password.trim();

      if (sanitizedPassword.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        errors.push(ERROR_MESSAGES.INVALID_PASSWORD);
      } else if (
        sanitizedPassword.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH
      ) {
        errors.push(
          ERROR_MESSAGES.TOO_LONG(VALIDATION_RULES.PASSWORD_MAX_LENGTH)
        );
      } else if (!VALIDATION_RULES.PASSWORD_PATTERN.test(sanitizedPassword)) {
        errors.push(ERROR_MESSAGES.INVALID_PASSWORD);
      }

      if (detectXSS(sanitizedPassword)) {
        errors.push(ERROR_MESSAGES.XSS_DETECTED);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedPassword,
    };
  }

  /**
   * 数値範囲バリデーション
   * @param {*} value - チェックする値
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @param {string} unit - 単位
   * @returns {ValidationResult} バリデーション結果
   */
  static numberRange(value, min, max, unit = '') {
    const errors = [];
    let sanitizedValue = 0;

    if (value === null || value === undefined || value === '') {
      errors.push(ERROR_MESSAGES.REQUIRED);
    } else {
      const numValue = Number(value);

      if (isNaN(numValue)) {
        errors.push(ERROR_MESSAGES.INVALID_NUMBER);
      } else {
        sanitizedValue = numValue;

        if (numValue < min || numValue > max) {
          errors.push(ERROR_MESSAGES.OUT_OF_RANGE(min, max, unit));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedValue,
    };
  }

  /**
   * 重量バリデーション
   * @param {*} weight - 重量
   * @returns {ValidationResult} バリデーション結果
   */
  static weight(weight) {
    return Validator.numberRange(
      weight,
      VALIDATION_RULES.WEIGHT.min,
      VALIDATION_RULES.WEIGHT.max,
      VALIDATION_RULES.WEIGHT.unit
    );
  }

  /**
   * 回数バリデーション
   * @param {*} reps - 回数
   * @returns {ValidationResult} バリデーション結果
   */
  static reps(reps) {
    return Validator.numberRange(
      reps,
      VALIDATION_RULES.REPS.min,
      VALIDATION_RULES.REPS.max,
      VALIDATION_RULES.REPS.unit
    );
  }

  /**
   * セット数バリデーション
   * @param {*} sets - セット数
   * @returns {ValidationResult} バリデーション結果
   */
  static sets(sets) {
    return Validator.numberRange(
      sets,
      VALIDATION_RULES.SETS.min,
      VALIDATION_RULES.SETS.max,
      VALIDATION_RULES.SETS.unit
    );
  }

  /**
   * 安全なテキストバリデーション
   * @param {string} text - テキスト
   * @param {number} maxLength - 最大文字数
   * @returns {ValidationResult} バリデーション結果
   */
  static safeText(text, maxLength = VALIDATION_RULES.NOTES_MAX_LENGTH) {
    const errors = [];
    let sanitizedText = '';

    if (text && typeof text === 'string') {
      sanitizedText = escapeHtml(text.trim());

      if (sanitizedText.length > maxLength) {
        errors.push(ERROR_MESSAGES.TOO_LONG(maxLength));
      }

      if (detectXSS(text)) {
        errors.push(ERROR_MESSAGES.XSS_DETECTED);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedText,
    };
  }

  /**
   * ニックネームバリデーション
   * @param {string} nickname - ニックネーム
   * @returns {ValidationResult} バリデーション結果
   */
  static nickname(nickname) {
    return Validator.safeText(nickname, VALIDATION_RULES.NICKNAME_MAX_LENGTH);
  }

  /**
   * エクササイズ名バリデーション
   * @param {string} exerciseName - エクササイズ名
   * @returns {ValidationResult} バリデーション結果
   */
  static exerciseName(exerciseName) {
    const result = Validator.safeText(
      exerciseName,
      VALIDATION_RULES.EXERCISE_NAME_MAX_LENGTH
    );

    if (!exerciseName || exerciseName.trim() === '') {
      result.errors.unshift(ERROR_MESSAGES.REQUIRED);
      result.isValid = false;
    }

    return result;
  }
}

/**
 * フォームバリデーター
 */
export class FormValidator {
  constructor() {
    this.errors = new Map();
  }

  /**
   * エラーをクリア
   */
  clearErrors() {
    this.errors.clear();
  }

  /**
   * フィールドのエラーを設定
   * @param {string} fieldName - フィールド名
   * @param {string[]} errors - エラーメッセージ配列
   */
  setFieldErrors(fieldName, errors) {
    if (errors.length > 0) {
      this.errors.set(fieldName, errors);
    } else {
      this.errors.delete(fieldName);
    }
  }

  /**
   * フィールドのエラーを取得
   * @param {string} fieldName - フィールド名
   * @returns {string[]} エラーメッセージ配列
   */
  getFieldErrors(fieldName) {
    return this.errors.get(fieldName) || [];
  }

  /**
   * 全エラーを取得
   * @returns {Object} エラーオブジェクト
   */
  getAllErrors() {
    const errorObj = {};
    for (const [field, errors] of this.errors) {
      errorObj[field] = errors;
    }
    return errorObj;
  }

  /**
   * バリデーションが成功したかチェック
   * @returns {boolean} 成功したかどうか
   */
  isValid() {
    return this.errors.size === 0;
  }

  /**
   * フィールドをバリデーション
   * @param {string} fieldName - フィールド名
   * @param {*} value - 値
   * @param {Function} validator - バリデーター関数
   * @returns {*} サニタイズされた値
   */
  validateField(fieldName, value, validator) {
    const result = validator(value);
    this.setFieldErrors(fieldName, result.errors);
    return result.sanitizedData;
  }

  /**
   * 認証フォームをバリデーション
   * @param {Object} formData - フォームデータ
   * @returns {Object} サニタイズされたデータ
   */
  validateAuthForm(formData) {
    this.clearErrors();

    const sanitizedData = {
      email: this.validateField('email', formData.email, Validator.email),
      password: this.validateField(
        'password',
        formData.password,
        Validator.password
      ),
    };

    return sanitizedData;
  }

  /**
   * ワークアウトフォームをバリデーション
   * @param {Object} formData - フォームデータ
   * @returns {Object} サニタイズされたデータ
   */
  validateWorkoutForm(formData) {
    this.clearErrors();

    const sanitizedData = {
      exerciseName: this.validateField(
        'exerciseName',
        formData.exerciseName,
        Validator.exerciseName
      ),
      weight: this.validateField('weight', formData.weight, Validator.weight),
      reps: this.validateField('reps', formData.reps, Validator.reps),
      sets: this.validateField('sets', formData.sets, Validator.sets),
      notes: this.validateField('notes', formData.notes, (value) =>
        Validator.safeText(value)
      ),
    };

    return sanitizedData;
  }

  /**
   * プロフィールフォームをバリデーション
   * @param {Object} formData - フォームデータ
   * @returns {Object} サニタイズされたデータ
   */
  validateProfileForm(formData) {
    this.clearErrors();

    const sanitizedData = {
      display_name: this.validateField(
        'display_name',
        formData.display_name,
        Validator.nickname
      ),
      email: this.validateField('email', formData.email, (value) => {
        // メールアドレスは空の場合はスキップ、入力がある場合はバリデーション
        if (!value || value.trim() === '') {
          return { isValid: true, errors: [], sanitizedData: '' };
        }
        return Validator.email(value);
      }),
      age: this.validateField('age', formData.age, (value) =>
        Validator.numberRange(value, 10, 100, '歳')
      ),
      weight: this.validateField('weight', formData.weight, Validator.weight),
      height: this.validateField('height', formData.height, (value) =>
        Validator.numberRange(value, 100, 250, 'cm')
      ),
    };

    return sanitizedData;
  }

  /**
   * エラーメッセージをDOMに表示
   * @param {string} fieldName - フィールド名
   * @param {Element} errorElement - エラー表示要素
   */
  displayFieldError(fieldName, errorElement) {
    const errors = this.getFieldErrors(fieldName);

    if (errorElement) {
      if (errors.length > 0) {
        errorElement.textContent = errors[0]; // 最初のエラーのみ表示
        errorElement.classList.remove('hidden');
        errorElement.classList.add('text-red-600', 'text-sm', 'mt-1');
      } else {
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
      }
    }
  }

  /**
   * フィールドの視覚的エラー状態を設定
   * @param {string} fieldName - フィールド名
   * @param {Element} inputElement - 入力要素
   */
  setFieldErrorState(fieldName, inputElement) {
    const hasError = this.getFieldErrors(fieldName).length > 0;

    if (inputElement) {
      if (hasError) {
        inputElement.classList.add('border-red-500', 'focus:border-red-500');
        inputElement.classList.remove(
          'border-gray-300',
          'focus:border-blue-500'
        );
      } else {
        inputElement.classList.remove('border-red-500', 'focus:border-red-500');
        inputElement.classList.add('border-gray-300', 'focus:border-blue-500');
      }
    }
  }
}

/**
 * リアルタイムバリデーション
 */
export class RealtimeValidator {
  constructor(formValidator) {
    this.formValidator = formValidator;
    this.debounceTimers = new Map();
  }

  /**
   * フィールドにリアルタイムバリデーションを設定
   * @param {Element} inputElement - 入力要素
   * @param {Element} errorElement - エラー表示要素
   * @param {Function} validator - バリデーター関数
   * @param {number} debounceMs - デバウンス時間
   */
  setupFieldValidation(
    inputElement,
    errorElement,
    validator,
    debounceMs = 300
  ) {
    if (!inputElement) {
      return;
    }

    const fieldName = inputElement.name || inputElement.id;

    const validateField = () => {
      const value = inputElement.value;
      this.formValidator.validateField(fieldName, value, validator);
      this.formValidator.displayFieldError(fieldName, errorElement);
      this.formValidator.setFieldErrorState(fieldName, inputElement);
    };

    // リアルタイムバリデーション（デバウンス付き）
    inputElement.addEventListener('input', () => {
      if (this.debounceTimers.has(fieldName)) {
        clearTimeout(this.debounceTimers.get(fieldName));
      }

      const timer = setTimeout(validateField, debounceMs);
      this.debounceTimers.set(fieldName, timer);
    });

    // フォーカス離脱時の即座バリデーション
    inputElement.addEventListener('blur', validateField);
  }

  /**
   * 認証フォームにリアルタイムバリデーションを設定
   * @param {Element} formElement - フォーム要素
   */
  setupAuthFormValidation(formElement) {
    if (!formElement) {
      return;
    }

    const emailInput = formElement.querySelector('#auth-email, #signup-email');
    const passwordInput = formElement.querySelector(
      '#auth-password, #signup-password'
    );
    const emailError = formElement.querySelector('#email-error');
    const passwordError = formElement.querySelector('#password-error');

    this.setupFieldValidation(emailInput, emailError, Validator.email);
    this.setupFieldValidation(passwordInput, passwordError, Validator.password);
  }

  /**
   * ワークアウトフォームにリアルタイムバリデーションを設定
   * @param {Element} formElement - フォーム要素
   */
  setupWorkoutFormValidation(formElement) {
    if (!formElement) {
      return;
    }

    const exerciseNameInput = formElement.querySelector(
      '[name="exerciseName"]'
    );
    const weightInput = formElement.querySelector('[name="weight"]');
    const repsInput = formElement.querySelector('[name="reps"]');
    const setsInput = formElement.querySelector('[name="sets"]');
    const notesInput = formElement.querySelector('[name="notes"]');

    this.setupFieldValidation(exerciseNameInput, null, Validator.exerciseName);
    this.setupFieldValidation(weightInput, null, Validator.weight);
    this.setupFieldValidation(repsInput, null, Validator.reps);
    this.setupFieldValidation(setsInput, null, Validator.sets);
    this.setupFieldValidation(notesInput, null, (value) =>
      Validator.safeText(value)
    );
  }
}

// グローバルバリデーターインスタンス
export const globalFormValidator = new FormValidator();
export const globalRealtimeValidator = new RealtimeValidator(
  globalFormValidator
);
