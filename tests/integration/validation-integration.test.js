// validation-integration.test.js - バリデーション機能の統合テスト

import { authManager } from '../../js/modules/authManager.js';
import { globalFormValidator } from '../../js/utils/validation.js';

describe('バリデーション統合テスト', () => {
    let mockSupabaseService;
    let mockPageManager;

    beforeEach(() => {
        // DOM環境をセットアップ
        document.body.innerHTML = '';
        
        // モックサービスをセットアップ
        mockSupabaseService = {
            isAvailable: () => true,
            signIn: jest.fn(),
            signUp: jest.fn(),
            getCurrentUser: () => null
        };

        mockPageManager = {
            loadPartial: jest.fn().mockResolvedValue(`
                <div id="auth-modal" class="hidden">
                    <form id="auth-form">
                        <input id="auth-email" name="email" type="email">
                        <input id="auth-password" name="password" type="password">
                        <div id="auth-error" class="hidden"></div>
                    </form>
                    <form id="signup-form" class="hidden">
                        <input id="signup-email" name="email" type="email">
                        <input id="signup-password" name="password" type="password">
                        <input id="privacy-agreement" type="checkbox">
                        <div id="signup-error" class="hidden"></div>
                    </form>
                </div>
            `)
        };

        // グローバルオブジェクトを設定
        global.supabaseService = mockSupabaseService;
        global.pageManager = mockPageManager;
        global.showNotification = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
        globalFormValidator.clearErrors();
    });

    describe('認証フォームの統合テスト', () => {
        test('有効なログインデータで認証が成功する', async () => {
            // 認証モーダルを表示
            await authManager.showAuthModal('login');
            
            // フォーム要素を取得
            const emailInput = document.getElementById('auth-email');
            const passwordInput = document.getElementById('auth-password');
            const form = document.getElementById('auth-form');
            
            // 有効なデータを入力
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';
            
            // Supabaseサービスのモック設定
            mockSupabaseService.signIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } });
            
            // フォーム送信をシミュレート
            const submitEvent = new Event('submit');
            await authManager.handleLogin(submitEvent);
            
            // バリデーションが成功し、Supabaseが呼ばれることを確認
            expect(mockSupabaseService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(global.showNotification).toHaveBeenCalledWith('ログインしました', 'success');
        });

        test('無効なメールアドレスでログインが失敗する', async () => {
            await authManager.showAuthModal('login');
            
            const emailInput = document.getElementById('auth-email');
            const passwordInput = document.getElementById('auth-password');
            
            // 無効なメールアドレスを入力
            emailInput.value = 'invalid-email';
            passwordInput.value = 'password123';
            
            const submitEvent = new Event('submit');
            await authManager.handleLogin(submitEvent);
            
            // バリデーションエラーが発生し、Supabaseが呼ばれないことを確認
            expect(mockSupabaseService.signIn).not.toHaveBeenCalled();
            
            // エラーメッセージが表示されることを確認
            const errorDiv = document.getElementById('auth-error');
            expect(errorDiv.textContent).toContain('メールアドレスの形式が正しくありません');
        });

        test('弱いパスワードで新規登録が失敗する', async () => {
            await authManager.showAuthModal('signup');
            
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');
            const privacyCheckbox = document.getElementById('privacy-agreement');
            
            // 弱いパスワードを入力
            emailInput.value = 'test@example.com';
            passwordInput.value = 'weak';
            privacyCheckbox.checked = true;
            
            const submitEvent = new Event('submit');
            await authManager.handleSignup(submitEvent);
            
            // バリデーションエラーが発生し、Supabaseが呼ばれないことを確認
            expect(mockSupabaseService.signUp).not.toHaveBeenCalled();
            
            // エラーメッセージが表示されることを確認
            const errorDiv = document.getElementById('signup-error');
            expect(errorDiv.textContent).toContain('パスワードは8文字以上で、英数字を含む必要があります');
        });

        test('プライバシーポリシー未同意で新規登録が失敗する', async () => {
            await authManager.showAuthModal('signup');
            
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');
            const privacyCheckbox = document.getElementById('privacy-agreement');
            
            // プライバシーポリシーに同意しない
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';
            privacyCheckbox.checked = false;
            
            const submitEvent = new Event('submit');
            await authManager.handleSignup(submitEvent);
            
            // プライバシーポリシーエラーが発生することを確認
            expect(mockSupabaseService.signUp).not.toHaveBeenCalled();
            
            const errorDiv = document.getElementById('signup-error');
            expect(errorDiv.textContent).toContain('プライバシーポリシーへの同意が必要です');
        });
    });

    describe('ワークアウトフォームの統合テスト', () => {
        beforeEach(() => {
            // ワークアウトフォームのDOM要素を追加
            document.body.innerHTML += `
                <div id="add-exercise-modal">
                    <form id="add-exercise-form">
                        <input id="exercise-name" name="exerciseName" type="text">
                        <input id="exercise-weight" name="weight" type="number">
                        <input id="exercise-reps" name="reps" type="number">
                        <input id="exercise-sets" name="sets" type="number">
                        <textarea id="exercise-notes" name="notes"></textarea>
                        <div id="exercise-form-error" class="hidden"></div>
                    </form>
                </div>
            `;
        });

        test('有効なエクササイズデータが受け入れられる', () => {
            const formData = {
                exerciseName: 'ベンチプレス',
                weight: '80',
                reps: '10',
                sets: '3',
                notes: 'フォーム良好'
            };

            const sanitizedData = globalFormValidator.validateWorkoutForm(formData);
            
            expect(globalFormValidator.isValid()).toBe(true);
            expect(sanitizedData.exerciseName).toBe('ベンチプレス');
            expect(sanitizedData.weight).toBe(80);
            expect(sanitizedData.reps).toBe(10);
            expect(sanitizedData.sets).toBe(3);
            expect(sanitizedData.notes).toBe('フォーム良好');
        });

        test('範囲外の重量が拒否される', () => {
            const formData = {
                exerciseName: 'ベンチプレス',
                weight: '1500', // 範囲外
                reps: '10',
                sets: '3',
                notes: ''
            };

            globalFormValidator.validateWorkoutForm(formData);
            
            expect(globalFormValidator.isValid()).toBe(false);
            expect(globalFormValidator.getFieldErrors('weight')).toContain('0kgから1000kgの範囲で入力してください');
        });

        test('XSS攻撃を含むエクササイズ名が適切に処理される', () => {
            const formData = {
                exerciseName: '<script>alert("xss")</script>',
                weight: '80',
                reps: '10',
                sets: '3',
                notes: ''
            };

            globalFormValidator.validateWorkoutForm(formData);
            
            expect(globalFormValidator.isValid()).toBe(false);
            expect(globalFormValidator.getFieldErrors('exerciseName')).toContain('不正なスクリプトが検出されました');
        });
    });

    describe('リアルタイムバリデーションの統合テスト', () => {
        test('入力時にリアルタイムバリデーションが動作する', (done) => {
            // フォーム要素を作成
            document.body.innerHTML = `
                <form id="test-form">
                    <input id="test-email" name="email" type="email">
                    <div id="email-error" class="hidden"></div>
                </form>
            `;

            const emailInput = document.getElementById('test-email');
            const errorDiv = document.getElementById('email-error');

            // リアルタイムバリデーションを設定
            const realtimeValidator = new (await import('../../js/utils/validation.js')).RealtimeValidator(globalFormValidator);
            realtimeValidator.setupFieldValidation(emailInput, errorDiv, (await import('../../js/utils/validation.js')).Validator.email, 100);

            // 無効なメールアドレスを入力
            emailInput.value = 'invalid-email';
            emailInput.dispatchEvent(new Event('input'));

            // デバウンス後にバリデーションが実行されることを確認
            setTimeout(() => {
                expect(errorDiv.classList.contains('hidden')).toBe(false);
                expect(errorDiv.textContent).toContain('メールアドレスの形式が正しくありません');
                done();
            }, 150);
        });
    });

    describe('セキュリティ統合テスト', () => {
        test('複数のXSS攻撃パターンが適切にブロックされる', () => {
            const xssPatterns = [
                '<img src="x" onerror="alert(1)">',
                'javascript:void(0)',
                '<svg onload="alert(1)">',
                '<iframe src="javascript:alert(1)"></iframe>'
            ];

            xssPatterns.forEach(pattern => {
                const formData = {
                    exerciseName: pattern,
                    weight: '80',
                    reps: '10',
                    sets: '3',
                    notes: ''
                };

                globalFormValidator.validateWorkoutForm(formData);
                expect(globalFormValidator.isValid()).toBe(false);
                expect(globalFormValidator.getFieldErrors('exerciseName')).toContain('不正なスクリプトが検出されました');
                
                globalFormValidator.clearErrors();
            });
        });

        test('SQLインジェクション攻撃パターンが適切にエスケープされる', () => {
            const sqlInjectionPattern = "'; DROP TABLE users; --";
            
            const formData = {
                exerciseName: 'ベンチプレス',
                weight: '80',
                reps: '10',
                sets: '3',
                notes: sqlInjectionPattern
            };

            const sanitizedData = globalFormValidator.validateWorkoutForm(formData);
            
            expect(globalFormValidator.isValid()).toBe(true);
            expect(sanitizedData.notes).toBe("&#x27;; DROP TABLE users; --");
        });
    });

    describe('パフォーマンス統合テスト', () => {
        test('大量のフォーム送信を効率的に処理する', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                const formData = {
                    exerciseName: `エクササイズ${i}`,
                    weight: String(Math.random() * 100),
                    reps: String(Math.floor(Math.random() * 20) + 1),
                    sets: String(Math.floor(Math.random() * 5) + 1),
                    notes: `メモ${i}`
                };

                globalFormValidator.validateWorkoutForm(formData);
                globalFormValidator.clearErrors();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 100回のバリデーションが500ms以内に完了することを確認
            expect(duration).toBeLessThan(500);
        });
    });

    describe('エラーハンドリング統合テスト', () => {
        test('ネットワークエラー時にバリデーションが適切に動作する', async () => {
            // Supabaseサービスでネットワークエラーをシミュレート
            mockSupabaseService.signIn.mockRejectedValue(new Error('Network error'));
            
            await authManager.showAuthModal('login');
            
            const emailInput = document.getElementById('auth-email');
            const passwordInput = document.getElementById('auth-password');
            
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';
            
            const submitEvent = new Event('submit');
            await authManager.handleLogin(submitEvent);
            
            // バリデーションは成功するが、ネットワークエラーが適切に処理されることを確認
            expect(mockSupabaseService.signIn).toHaveBeenCalled();
            
            const errorDiv = document.getElementById('auth-error');
            expect(errorDiv.textContent).toContain('Network error');
        });

        test('DOM要素が存在しない場合の適切なエラーハンドリング', () => {
            // DOM要素を削除
            document.body.innerHTML = '';
            
            // バリデーション関数が例外を投げないことを確認
            expect(() => {
                globalFormValidator.validateAuthForm({
                    email: 'test@example.com',
                    password: 'password123'
                });
            }).not.toThrow();
        });
    });
});
