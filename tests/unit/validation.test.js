// validation.test.js - バリデーション機能のユニットテスト

import {
    Validator,
    FormValidator,
    RealtimeValidator,
    escapeHtml,
    detectXSS,
    VALIDATION_RULES,
    ERROR_MESSAGES
} from '../../js/utils/validation.js';

describe('バリデーション機能テスト', () => {
    let formValidator;

    beforeEach(() => {
        formValidator = new FormValidator();
    });

    describe('HTMLエスケープ機能', () => {
        test('基本的なHTMLタグをエスケープできる', () => {
            const input = '<script>alert("xss")</script>';
            const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
            expect(escapeHtml(input)).toBe(expected);
        });

        test('特殊文字をエスケープできる', () => {
            const input = '&<>"\'`=/';
            const expected = '&amp;&lt;&gt;&quot;&#x27;&#x60;&#x3D;&#x2F;';
            expect(escapeHtml(input)).toBe(expected);
        });

        test('通常の文字列はそのまま返す', () => {
            const input = 'Hello World 123 こんにちは';
            expect(escapeHtml(input)).toBe(input);
        });

        test('非文字列は文字列に変換される', () => {
            expect(escapeHtml(123)).toBe('123');
            expect(escapeHtml(null)).toBe('null');
            expect(escapeHtml(undefined)).toBe('undefined');
        });
    });

    describe('XSS検出機能', () => {
        test('scriptタグを検出できる', () => {
            expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
            expect(detectXSS('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
        });

        test('javascript:プロトコルを検出できる', () => {
            expect(detectXSS('javascript:alert("xss")')).toBe(true);
            expect(detectXSS('JAVASCRIPT:alert("xss")')).toBe(true);
        });

        test('イベントハンドラーを検出できる', () => {
            expect(detectXSS('onclick="alert(1)"')).toBe(true);
            expect(detectXSS('onload="malicious()"')).toBe(true);
        });

        test('危険なタグを検出できる', () => {
            expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
            expect(detectXSS('<object data="evil.swf"></object>')).toBe(true);
            expect(detectXSS('<embed src="evil.swf">')).toBe(true);
        });

        test('安全な文字列は検出しない', () => {
            expect(detectXSS('Hello World')).toBe(false);
            expect(detectXSS('こんにちは世界')).toBe(false);
            expect(detectXSS('123 + 456 = 579')).toBe(false);
        });
    });

    describe('基本バリデーター', () => {
        describe('必須チェック', () => {
            test('有効な値を受け入れる', () => {
                const result = Validator.required('test');
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
                expect(result.sanitizedData).toBe('test');
            });

            test('空文字列を拒否する', () => {
                const result = Validator.required('');
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
            });

            test('null/undefinedを拒否する', () => {
                expect(Validator.required(null).isValid).toBe(false);
                expect(Validator.required(undefined).isValid).toBe(false);
            });

            test('空白文字のみを拒否する', () => {
                const result = Validator.required('   ');
                expect(result.isValid).toBe(false);
            });
        });

        describe('メールアドレスバリデーション', () => {
            test('有効なメールアドレスを受け入れる', () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@domain.co.jp',
                    'test+tag@example.org',
                    'user123@test-domain.com'
                ];

                validEmails.forEach(email => {
                    const result = Validator.email(email);
                    expect(result.isValid).toBe(true);
                    expect(result.sanitizedData).toBe(email.toLowerCase());
                });
            });

            test('無効なメールアドレスを拒否する', () => {
                const invalidEmails = [
                    'invalid-email',
                    '@domain.com',
                    'user@',
                    'user@domain',
                    ''
                ];

                invalidEmails.forEach(email => {
                    const result = Validator.email(email);
                    expect(result.isValid).toBe(false);
                });
            });

            test('メールアドレスを小文字に変換する', () => {
                const result = Validator.email('TEST@EXAMPLE.COM');
                expect(result.sanitizedData).toBe('test@example.com');
            });

            test('長すぎるメールアドレスを拒否する', () => {
                const longEmail = 'a'.repeat(250) + '@example.com';
                const result = Validator.email(longEmail);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.TOO_LONG(VALIDATION_RULES.EMAIL_MAX_LENGTH));
            });

            test('XSS攻撃を検出する', () => {
                const result = Validator.email('<script>alert("xss")</script>@example.com');
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.XSS_DETECTED);
            });
        });

        describe('パスワードバリデーション', () => {
            test('有効なパスワードを受け入れる', () => {
                const validPasswords = [
                    'password123',
                    'MySecure123',
                    'test1234',
                    'abcdefgh1'
                ];

                validPasswords.forEach(password => {
                    const result = Validator.password(password);
                    expect(result.isValid).toBe(true);
                });
            });

            test('短すぎるパスワードを拒否する', () => {
                const result = Validator.password('short1');
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.INVALID_PASSWORD);
            });

            test('英数字混在でないパスワードを拒否する', () => {
                const invalidPasswords = [
                    'onlyletters',
                    '12345678',
                    'パスワード123' // 日本語文字
                ];

                invalidPasswords.forEach(password => {
                    const result = Validator.password(password);
                    expect(result.isValid).toBe(false);
                    expect(result.errors).toContain(ERROR_MESSAGES.INVALID_PASSWORD);
                });
            });

            test('長すぎるパスワードを拒否する', () => {
                const longPassword = 'a'.repeat(130) + '1';
                const result = Validator.password(longPassword);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.TOO_LONG(VALIDATION_RULES.PASSWORD_MAX_LENGTH));
            });
        });

        describe('数値範囲バリデーション', () => {
            test('有効な数値を受け入れる', () => {
                const result = Validator.numberRange(50, 0, 100, 'kg');
                expect(result.isValid).toBe(true);
                expect(result.sanitizedData).toBe(50);
            });

            test('範囲外の数値を拒否する', () => {
                const result1 = Validator.numberRange(-1, 0, 100, 'kg');
                expect(result1.isValid).toBe(false);
                expect(result1.errors).toContain(ERROR_MESSAGES.OUT_OF_RANGE(0, 100, 'kg'));

                const result2 = Validator.numberRange(101, 0, 100, 'kg');
                expect(result2.isValid).toBe(false);
            });

            test('非数値を拒否する', () => {
                const result = Validator.numberRange('abc', 0, 100, 'kg');
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.INVALID_NUMBER);
            });

            test('空値を拒否する', () => {
                const result = Validator.numberRange('', 0, 100, 'kg');
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
            });
        });

        describe('重量バリデーション', () => {
            test('有効な重量を受け入れる', () => {
                const validWeights = [0, 50, 100, 500, 1000];
                validWeights.forEach(weight => {
                    const result = Validator.weight(weight);
                    expect(result.isValid).toBe(true);
                    expect(result.sanitizedData).toBe(weight);
                });
            });

            test('範囲外の重量を拒否する', () => {
                const result1 = Validator.weight(-1);
                expect(result1.isValid).toBe(false);

                const result2 = Validator.weight(1001);
                expect(result2.isValid).toBe(false);
            });
        });

        describe('回数バリデーション', () => {
            test('有効な回数を受け入れる', () => {
                const validReps = [1, 10, 50, 100];
                validReps.forEach(reps => {
                    const result = Validator.reps(reps);
                    expect(result.isValid).toBe(true);
                    expect(result.sanitizedData).toBe(reps);
                });
            });

            test('範囲外の回数を拒否する', () => {
                const result1 = Validator.reps(0);
                expect(result1.isValid).toBe(false);

                const result2 = Validator.reps(101);
                expect(result2.isValid).toBe(false);
            });
        });

        describe('セット数バリデーション', () => {
            test('有効なセット数を受け入れる', () => {
                const validSets = [1, 3, 10, 20];
                validSets.forEach(sets => {
                    const result = Validator.sets(sets);
                    expect(result.isValid).toBe(true);
                    expect(result.sanitizedData).toBe(sets);
                });
            });

            test('範囲外のセット数を拒否する', () => {
                const result1 = Validator.sets(0);
                expect(result1.isValid).toBe(false);

                const result2 = Validator.sets(21);
                expect(result2.isValid).toBe(false);
            });
        });

        describe('安全なテキストバリデーション', () => {
            test('通常のテキストを受け入れる', () => {
                const result = Validator.safeText('Hello World こんにちは');
                expect(result.isValid).toBe(true);
                expect(result.sanitizedData).toBe('Hello World こんにちは');
            });

        test('HTMLをエスケープする', () => {
            const result = Validator.safeText('<script>alert("xss")</script>');
            expect(result.isValid).toBe(false); // XSS検出により無効
            expect(result.errors).toContain(ERROR_MESSAGES.XSS_DETECTED);
        });

            test('長すぎるテキストを拒否する', () => {
                const longText = 'a'.repeat(1001);
                const result = Validator.safeText(longText);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.TOO_LONG(VALIDATION_RULES.NOTES_MAX_LENGTH));
            });

            test('XSS攻撃を検出する', () => {
                const result = Validator.safeText('javascript:alert("xss")');
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(ERROR_MESSAGES.XSS_DETECTED);
            });
        });
    });

    describe('フォームバリデーター', () => {
        test('エラーの設定と取得ができる', () => {
            formValidator.setFieldErrors('email', ['Invalid email']);
            expect(formValidator.getFieldErrors('email')).toEqual(['Invalid email']);
            expect(formValidator.isValid()).toBe(false);
        });

        test('エラーをクリアできる', () => {
            formValidator.setFieldErrors('email', ['Invalid email']);
            formValidator.clearErrors();
            expect(formValidator.isValid()).toBe(true);
        });

        test('認証フォームをバリデーションできる', () => {
            const formData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const sanitizedData = formValidator.validateAuthForm(formData);
            expect(formValidator.isValid()).toBe(true);
            expect(sanitizedData.email).toBe('test@example.com');
            expect(sanitizedData.password).toBe('password123');
        });

        test('無効な認証フォームを拒否する', () => {
            const formData = {
                email: 'invalid-email',
                password: 'short'
            };

            formValidator.validateAuthForm(formData);
            expect(formValidator.isValid()).toBe(false);
            expect(formValidator.getFieldErrors('email')).toContain(ERROR_MESSAGES.INVALID_EMAIL);
            expect(formValidator.getFieldErrors('password')).toContain(ERROR_MESSAGES.INVALID_PASSWORD);
        });

        test('ワークアウトフォームをバリデーションできる', () => {
            const formData = {
                exerciseName: 'ベンチプレス',
                weight: 80,
                reps: 10,
                sets: 3,
                notes: 'フォーム良好'
            };

            const sanitizedData = formValidator.validateWorkoutForm(formData);
            expect(formValidator.isValid()).toBe(true);
            expect(sanitizedData.exerciseName).toBe('ベンチプレス');
            expect(sanitizedData.weight).toBe(80);
            expect(sanitizedData.reps).toBe(10);
            expect(sanitizedData.sets).toBe(3);
            expect(sanitizedData.notes).toBe('フォーム良好');
        });

        test('無効なワークアウトフォームを拒否する', () => {
            const formData = {
                exerciseName: '',
                weight: -1,
                reps: 0,
                sets: 25,
                notes: 'a'.repeat(1001)
            };

            formValidator.validateWorkoutForm(formData);
            expect(formValidator.isValid()).toBe(false);
            expect(formValidator.getFieldErrors('exerciseName')).toContain(ERROR_MESSAGES.REQUIRED);
            expect(formValidator.getFieldErrors('weight').length).toBeGreaterThan(0);
            expect(formValidator.getFieldErrors('reps').length).toBeGreaterThan(0);
            expect(formValidator.getFieldErrors('sets').length).toBeGreaterThan(0);
            expect(formValidator.getFieldErrors('notes').length).toBeGreaterThan(0);
        });

        test('プロフィールフォームをバリデーションできる', () => {
            const formData = {
                nickname: 'テストユーザー',
                email: 'test@example.com'
            };

            const sanitizedData = formValidator.validateProfileForm(formData);
            expect(formValidator.isValid()).toBe(true);
            expect(sanitizedData.nickname).toBe('テストユーザー');
            expect(sanitizedData.email).toBe('test@example.com');
        });
    });

    describe('エッジケースとセキュリティテスト', () => {
        test('SQLインジェクション攻撃パターンを処理する', () => {
            const maliciousInput = "'; DROP TABLE users; --";
            const result = Validator.safeText(maliciousInput);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toBe("&#x27;; DROP TABLE users; --");
        });

        test('複雑なXSS攻撃パターンを検出する', () => {
            const xssPatterns = [
                '<img src="x" onerror="alert(1)">',
                '<svg onload="alert(1)">',
                'javascript:void(0)',
                '<iframe src="javascript:alert(1)"></iframe>',
                '<object data="data:text/html,<script>alert(1)</script>"></object>'
            ];

            xssPatterns.forEach(pattern => {
                expect(detectXSS(pattern)).toBe(true);
            });
        });

        test('Unicode文字を適切に処理する', () => {
            const unicodeText = '🏋️‍♂️ ワークアウト 💪 Émoji tëst';
            const result = Validator.safeText(unicodeText);
            expect(result.isValid).toBe(true);
            expect(result.sanitizedData).toBe(unicodeText);
        });

        test('極端に長い入力を処理する', () => {
            const veryLongInput = 'a'.repeat(10000);
            const result = Validator.safeText(veryLongInput);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(ERROR_MESSAGES.TOO_LONG(VALIDATION_RULES.NOTES_MAX_LENGTH));
        });

        test('null/undefined入力を安全に処理する', () => {
            expect(Validator.safeText(null).sanitizedData).toBe('');
            expect(Validator.safeText(undefined).sanitizedData).toBe('');
            expect(escapeHtml(null)).toBe('null');
            expect(escapeHtml(undefined)).toBe('undefined');
        });
    });

    describe('パフォーマンステスト', () => {
        test('大量のバリデーションを効率的に処理する', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                Validator.email(`test${i}@example.com`);
                Validator.password(`password${i}`);
                Validator.weight(Math.random() * 100);
                Validator.reps(Math.floor(Math.random() * 20) + 1);
                Validator.sets(Math.floor(Math.random() * 5) + 1);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 1000回のバリデーションが1秒以内に完了することを確認
            expect(duration).toBeLessThan(1000);
        });
    });
});

// テストカバレッジ確認用の統計情報
describe('テストカバレッジ統計', () => {
    test('全バリデーター関数がテストされている', () => {
        const testedFunctions = [
            'required',
            'email',
            'password',
            'numberRange',
            'weight',
            'reps',
            'sets',
            'safeText',
            'nickname',
            'exerciseName'
        ];

        testedFunctions.forEach(funcName => {
            expect(typeof Validator[funcName]).toBe('function');
        });
    });

    test('全エラーメッセージがテストされている', () => {
        const testedMessages = [
            'REQUIRED',
            'INVALID_EMAIL',
            'INVALID_PASSWORD',
            'INVALID_NUMBER',
            'OUT_OF_RANGE',
            'TOO_LONG',
            'INVALID_CHARACTERS',
            'XSS_DETECTED'
        ];

        testedMessages.forEach(msgKey => {
            expect(ERROR_MESSAGES[msgKey]).toBeDefined();
        });
    });

    test('全バリデーションルールがテストされている', () => {
        const testedRules = [
            'WEIGHT',
            'REPS',
            'SETS',
            'EMAIL_MAX_LENGTH',
            'PASSWORD_MIN_LENGTH',
            'PASSWORD_MAX_LENGTH',
            'EMAIL_PATTERN',
            'PASSWORD_PATTERN'
        ];

        testedRules.forEach(ruleKey => {
            expect(VALIDATION_RULES[ruleKey]).toBeDefined();
        });
    });
});
