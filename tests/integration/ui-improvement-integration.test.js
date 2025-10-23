// ui-improvement-integration.test.js - UI改善の統合テスト

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// テスト対象のモジュールをインポート
import { MockWorkoutWizard } from '../unit/workout-wizard.test.js';
import { MockErrorHandler } from '../unit/error-handling.test.js';
import { MockMobileOptimizationManager, MockAccessibilityManager } from '../unit/mobile-accessibility.test.js';

// 統合テスト用のアプリケーションクラス
class IntegratedWorkoutApp {
    constructor() {
        this.workoutWizard = new MockWorkoutWizard();
        this.errorHandler = new MockErrorHandler();
        this.mobileOptimization = new MockMobileOptimizationManager();
        this.accessibilityManager = new MockAccessibilityManager();
        
        this.operationCount = 0;
        this.errorCount = 0;
        this.accessibilityScore = 0;
        this.mobileOptimizationScore = 0;
    }

    async initialize() {
        try {
            await this.workoutWizard.initialize();
            this.mobileOptimization.initialize();
            this.accessibilityManager.initialize();
            
            this.setupIntegration();
            
            return true;
        } catch (error) {
            this.errorHandler.handleError(error, {
                context: 'アプリケーション初期化'
            });
            return false;
        }
    }

    setupIntegration() {
        // エラーハンドリングとワークアウトウィザードの統合
        this.workoutWizard.handleError = this.errorHandler.handleError.bind(this.errorHandler);
        
        // モバイル最適化とワークアウトウィザードの統合
        this.mobileOptimization.registerSwipeCallback('left', () => {
            this.workoutWizard.nextStep();
        });
        
        this.mobileOptimization.registerSwipeCallback('right', () => {
            this.workoutWizard.previousStep();
        });
        
        // アクセシビリティとワークアウトウィザードの統合
        document.addEventListener('workoutStarted', () => {
            this.accessibilityManager.announce('ワークアウトを開始しました');
        });
        
        document.addEventListener('workoutCompleted', () => {
            this.accessibilityManager.announce('ワークアウトが完了しました');
        });
    }

    async performCompleteWorkoutFlow() {
        const startTime = performance.now();
        this.operationCount = 0;
        
        try {
            // ステップ1: 筋肉部位選択
            this.trackOperation('preset_selection');
            this.workoutWizard.selectPreset('upper');
            
            this.trackOperation('step1_next');
            const step2Result = this.workoutWizard.nextStep();
            if (!step2Result) throw new Error('ステップ2への移行に失敗');
            
            // ステップ2: エクササイズ選択
            this.trackOperation('exercise_selection');
            this.workoutWizard.addExercise('ベンチプレス');
            this.workoutWizard.addExercise('ラットプルダウン');
            
            this.trackOperation('step2_next');
            const step3Result = this.workoutWizard.nextStep();
            if (!step3Result) throw new Error('ステップ3への移行に失敗');
            
            // ステップ3: ワークアウト開始
            this.trackOperation('workout_start');
            const workout = await this.workoutWizard.startWorkout();
            if (!workout) throw new Error('ワークアウト開始に失敗');
            
            // ワークアウト実行（シミュレート）
            await this.simulateWorkoutExecution();
            
            // ワークアウト完了
            this.trackOperation('workout_complete');
            const completedWorkout = await this.workoutWizard.stopWorkout();
            if (!completedWorkout) throw new Error('ワークアウト完了に失敗');
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            return {
                success: true,
                operationCount: this.operationCount,
                duration,
                workout: completedWorkout
            };
            
        } catch (error) {
            this.errorCount++;
            this.errorHandler.handleError(error, {
                context: '完全ワークアウトフロー'
            });
            
            return {
                success: false,
                error: error.message,
                operationCount: this.operationCount
            };
        }
    }

    async simulateWorkoutExecution() {
        // エクササイズの実行をシミュレート
        const exercises = this.workoutWizard.selectedExercises;
        
        for (let i = 0; i < exercises.length; i++) {
            // セット追加
            this.trackOperation('add_set');
            this.workoutWizard.addSet(i);
            
            // データ更新
            this.trackOperation('update_data');
            this.workoutWizard.updateExerciseData(i, 'weight', 80);
            this.workoutWizard.updateExerciseData(i, 'reps', 10);
            this.workoutWizard.updateExerciseData(i, 'sets', 3);
            
            // エクササイズ完了
            this.trackOperation('complete_exercise');
            this.workoutWizard.completeExercise(i);
        }
        
        // 短い待機時間をシミュレート
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    trackOperation(operation) {
        this.operationCount++;
        this.workoutWizard.trackOperation(operation);
    }

    calculateOperationReduction() {
        return this.workoutWizard.calculateOperationReduction();
    }

    measureAccessibilityScore() {
        this.accessibilityScore = this.accessibilityManager.calculateAccessibilityScore();
        return this.accessibilityScore;
    }

    measureMobileOptimization() {
        const stats = this.mobileOptimization.getOptimizationStats();
        
        // モバイル最適化スコアを計算
        let score = 0;
        
        // タッチターゲット最適化 (30点)
        if (stats.touchTargetsOptimized > 0) score += 30;
        
        // スワイプジェスチャー対応 (25点)
        if (stats.swipeCallbacksRegistered > 0) score += 25;
        
        // 片手操作対応 (25点)
        if (stats.oneHandedMode !== undefined) score += 25;
        
        // ハプティックフィードバック (20点)
        if (stats.hapticSupported) score += 20;
        
        this.mobileOptimizationScore = score;
        return score;
    }

    simulateNetworkError() {
        const networkError = new Error('fetch failed');
        return this.errorHandler.handleError(networkError, {
            context: 'ネットワーク操作',
            maxRetries: 3,
            onRetry: async () => {
                // リトライ成功をシミュレート
                return { success: true };
            }
        });
    }

    simulateValidationError() {
        const validationError = new Error('validation required');
        return this.errorHandler.handleError(validationError, {
            context: 'フォーム検証'
        });
    }

    simulateSwipeGesture(direction) {
        const swipeEvent = {
            changedTouches: [
                { screenX: direction === 'left' ? 200 : 100, screenY: 100 }
            ]
        };
        
        this.mobileOptimization.handleTouchStart(swipeEvent);
        
        const endEvent = {
            changedTouches: [
                { screenX: direction === 'left' ? 100 : 200, screenY: 100 }
            ]
        };
        
        this.mobileOptimization.handleTouchEnd(endEvent);
    }

    simulateKeyboardNavigation(key, altKey = false) {
        const keyEvent = new KeyboardEvent('keydown', { key, altKey });
        this.accessibilityManager.handleKeyboardNavigation(keyEvent);
    }

    getOverallPerformanceMetrics() {
        return {
            operationReduction: this.calculateOperationReduction(),
            accessibilityScore: this.measureAccessibilityScore(),
            mobileOptimizationScore: this.measureMobileOptimization(),
            errorRate: this.errorCount / Math.max(this.operationCount, 1) * 100
        };
    }
}

describe('UI改善統合テスト', () => {
    let app;

    beforeEach(() => {
        // 完全なDOM環境をセットアップ
        document.body.innerHTML = `
            <div id="app">
                <main role="main">
                    <h1>ワークアウト管理アプリ</h1>
                    <div id="workout-wizard" class="muscle-card rounded-lg p-6 mb-6">
                        <div class="flex items-center justify-center mb-6">
                            <div class="flex items-center space-x-4">
                                <div id="step-1" class="step-indicator active">
                                    <div class="step-circle">1</div>
                                    <span class="step-label">部位選択</span>
                                </div>
                                <div class="step-connector"></div>
                                <div id="step-2" class="step-indicator">
                                    <div class="step-circle">2</div>
                                    <span class="step-label">エクササイズ</span>
                                </div>
                                <div class="step-connector"></div>
                                <div id="step-3" class="step-indicator">
                                    <div class="step-circle">3</div>
                                    <span class="step-label">記録</span>
                                </div>
                            </div>
                        </div>

                        <div id="wizard-step-1" class="wizard-step active">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button class="preset-btn" data-preset="upper">上半身</button>
                                <button class="preset-btn" data-preset="lower">下半身</button>
                            </div>
                            <div id="muscle-groups-grid" class="grid grid-cols-2 md:grid-cols-3 gap-4"></div>
                            <button id="step1-next" class="btn-primary" disabled>次へ</button>
                        </div>

                        <div id="wizard-step-2" class="wizard-step">
                            <div id="exercise-presets" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"></div>
                            <div id="selected-exercises-list" class="space-y-2"></div>
                            <button id="step2-back" class="btn-secondary">戻る</button>
                            <button id="step2-next" class="btn-primary" disabled>次へ</button>
                        </div>

                        <div id="wizard-step-3" class="wizard-step">
                            <div id="workout-summary"></div>
                            <button id="step3-back" class="btn-secondary">戻る</button>
                            <button id="start-workout" class="btn-success">ワークアウト開始</button>
                        </div>
                    </div>
                </main>
            </div>
        `;

        app = new IntegratedWorkoutApp();
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('アプリケーション初期化', () => {
        it('すべてのコンポーネントが正常に初期化される', async () => {
            const result = await app.initialize();
            
            expect(result).toBe(true);
            expect(app.workoutWizard.currentStep).toBe(1);
            expect(app.accessibilityManager.liveRegion).toBeDefined();
        });

        it('初期化エラーが適切に処理される', async () => {
            // 初期化エラーをシミュレート
            app.workoutWizard.initialize = vi.fn().mockRejectedValue(new Error('初期化失敗'));
            
            const result = await app.initialize();
            
            expect(result).toBe(false);
        });
    });

    describe('完全ワークアウトフロー', () => {
        beforeEach(async () => {
            await app.initialize();
        });

        it('完全なワークアウトフローが正常に実行される', async () => {
            const result = await app.performCompleteWorkoutFlow();
            
            expect(result.success).toBe(true);
            expect(result.operationCount).toBeGreaterThan(0);
            expect(result.duration).toBeGreaterThan(0);
            expect(result.workout).toBeDefined();
        });

        it('操作数が50%以上削減される', async () => {
            const result = await app.performCompleteWorkoutFlow();
            
            expect(result.success).toBe(true);
            
            const operationReduction = app.calculateOperationReduction();
            expect(operationReduction).toBeGreaterThanOrEqual(50);
        });

        it('ワークアウト完了までの時間が合理的である', async () => {
            const result = await app.performCompleteWorkoutFlow();
            
            expect(result.success).toBe(true);
            // 1秒以内で完了することを期待（シミュレーション環境）
            expect(result.duration).toBeLessThan(1000);
        });
    });

    describe('エラーハンドリング統合', () => {
        beforeEach(async () => {
            await app.initialize();
        });

        it('ネットワークエラーが適切に処理される', async () => {
            const errorInfo = app.simulateNetworkError();
            
            expect(errorInfo.type).toBe('NETWORK');
            expect(errorInfo.canRetry).toBe(true);
            expect(errorInfo.retry).toBeDefined();
        });

        it('バリデーションエラーが適切に処理される', () => {
            const errorInfo = app.simulateValidationError();
            
            expect(errorInfo.type).toBe('VALIDATION');
            expect(errorInfo.canRetry).toBe(false);
        });

        it('リトライ機能が正常に動作する', async () => {
            const errorInfo = app.simulateNetworkError();
            
            const retryResult = await errorInfo.retry();
            expect(retryResult.success).toBe(true);
        });

        it('エラー発生時もワークフローが継続される', async () => {
            // エラーを発生させる
            app.simulateValidationError();
            
            // ワークフローは継続可能
            const result = await app.performCompleteWorkoutFlow();
            expect(result.success).toBe(true);
        });
    });

    describe('モバイル最適化統合', () => {
        beforeEach(async () => {
            await app.initialize();
        });

        it('スワイプジェスチャーでナビゲーションが動作する', () => {
            // 筋肉部位を選択してステップ2に進める状態にする
            app.workoutWizard.selectPreset('upper');
            
            // 左スワイプで次のステップに進む
            app.simulateSwipeGesture('left');
            
            expect(app.workoutWizard.currentStep).toBe(2);
        });

        it('右スワイプで前のステップに戻る', async () => {
            // ステップ2まで進む
            app.workoutWizard.selectPreset('upper');
            app.workoutWizard.nextStep();
            
            // 右スワイプで前のステップに戻る
            app.simulateSwipeGesture('right');
            
            expect(app.workoutWizard.currentStep).toBe(1);
        });

        it('タッチターゲットが適切に最適化される', () => {
            const buttons = document.querySelectorAll('button');
            
            buttons.forEach(button => {
                const computedStyle = window.getComputedStyle(button);
                const minHeight = parseInt(computedStyle.minHeight) || 0;
                const minWidth = parseInt(computedStyle.minWidth) || 0;
                
                expect(minHeight).toBeGreaterThanOrEqual(44);
                expect(minWidth).toBeGreaterThanOrEqual(44);
            });
        });

        it('片手操作モードが正常に動作する', () => {
            app.mobileOptimization.enableOneHandedMode();
            
            expect(app.mobileOptimization.oneHandedMode).toBe(true);
            expect(document.body.classList.contains('one-handed-mode')).toBe(true);
        });
    });

    describe('アクセシビリティ統合', () => {
        beforeEach(async () => {
            await app.initialize();
        });

        it('キーボードナビゲーションが正常に動作する', () => {
            // Alt+1でメインコンテンツにナビゲート
            app.simulateKeyboardNavigation('1', true);
            
            // エラーが発生しないことを確認
            expect(() => {
                app.simulateKeyboardNavigation('Escape');
            }).not.toThrow();
        });

        it('スクリーンリーダー対応が正常に動作する', () => {
            app.accessibilityManager.announce('テストメッセージ');
            
            expect(app.accessibilityManager.announcements).toContain('テストメッセージ');
            expect(app.accessibilityManager.liveRegion.textContent).toBe('テストメッセージ');
        });

        it('アクセシビリティスコアが90点以上である', () => {
            const score = app.measureAccessibilityScore();
            
            expect(score).toBeGreaterThanOrEqual(90);
        });

        it('フォーカス管理が適切に動作する', () => {
            const button = document.querySelector('button');
            
            const focusEvent = new FocusEvent('focusin', { target: button });
            document.dispatchEvent(focusEvent);
            
            expect(app.accessibilityManager.focusHistory).toContain(button);
        });
    });

    describe('パフォーマンス統合テスト', () => {
        beforeEach(async () => {
            await app.initialize();
        });

        it('全体的なパフォーマンスメトリクスが要件を満たす', async () => {
            await app.performCompleteWorkoutFlow();
            const metrics = app.getOverallPerformanceMetrics();
            
            // DoD要件の確認
            expect(metrics.operationReduction).toBeGreaterThanOrEqual(50); // 操作数50%削減
            expect(metrics.accessibilityScore).toBeGreaterThanOrEqual(90); // アクセシビリティスコア90点以上
            expect(metrics.mobileOptimizationScore).toBeGreaterThanOrEqual(80); // モバイル最適化80点以上
            expect(metrics.errorRate).toBeLessThanOrEqual(10); // エラー率10%以下
        });

        it('大量操作でもパフォーマンスが維持される', async () => {
            const startTime = performance.now();
            
            // 100回のワークアウトフローを実行
            const promises = [];
            for (let i = 0; i < 100; i++) {
                promises.push(app.performCompleteWorkoutFlow());
            }
            
            await Promise.all(promises);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 5秒以内で完了することを期待
            expect(duration).toBeLessThan(5000);
        });

        it('メモリリークが発生しない', async () => {
            const initialMemory = performance.memory?.usedJSHeapSize || 0;
            
            // 大量のワークアウトフローを実行
            for (let i = 0; i < 1000; i++) {
                await app.performCompleteWorkoutFlow();
                app.workoutWizard.resetWorkout();
            }
            
            // ガベージコレクションを促す
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = performance.memory?.usedJSHeapSize || 0;
            const memoryIncrease = finalMemory - initialMemory;
            
            // メモリ使用量の増加が5MB以下であることを期待
            expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
        });
    });

    describe('クロスブラウザ互換性', () => {
        beforeEach(async () => {
            await app.initialize();
        });

        it('タッチイベントが適切に処理される', () => {
            // タッチイベントのサポートをシミュレート
            const touchStartEvent = new TouchEvent('touchstart', {
                changedTouches: [{ screenX: 100, screenY: 100 }]
            });
            
            expect(() => {
                app.mobileOptimization.handleTouchStart(touchStartEvent);
            }).not.toThrow();
        });

        it('キーボードイベントが適切に処理される', () => {
            const keyEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            
            expect(() => {
                app.accessibilityManager.handleKeyboardNavigation(keyEvent);
            }).not.toThrow();
        });

        it('メディアクエリが適切に動作する', () => {
            // window.matchMediaのモック
            window.matchMedia = vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }));
            
            expect(() => {
                app.accessibilityManager.detectAccessibilityPreferences();
            }).not.toThrow();
        });
    });

    describe('リアルタイム機能統合', () => {
        beforeEach(async () => {
            await app.initialize();
        });

        it('リアルタイムフィードバックが正常に動作する', async () => {
            await app.performCompleteWorkoutFlow();
            
            // アナウンスが適切に行われている
            expect(app.accessibilityManager.announcements.length).toBeGreaterThan(0);
        });

        it('プログレス更新が正常に動作する', async () => {
            const result = await app.performCompleteWorkoutFlow();
            
            expect(result.success).toBe(true);
            expect(result.workout.exercises.length).toBeGreaterThan(0);
        });
    });
});

describe('UI改善 E2Eテスト', () => {
    let app;

    beforeEach(async () => {
        // より現実的なDOM環境をセットアップ
        document.body.innerHTML = `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ワークアウト管理アプリ</title>
            </head>
            <body>
                <div id="app">
                    <header role="banner">
                        <h1>ワークアウト管理アプリ</h1>
                        <nav role="navigation">
                            <a href="#dashboard">ダッシュボード</a>
                            <a href="#workout">ワークアウト</a>
                            <a href="#progress">進捗</a>
                        </nav>
                    </header>
                    
                    <main role="main" id="main-content">
                        <div id="workout-wizard" class="muscle-card rounded-lg p-6 mb-6">
                            <!-- ワークアウトウィザードの完全な構造 -->
                        </div>
                    </main>
                    
                    <footer role="contentinfo">
                        <p>&copy; 2024 ワークアウト管理アプリ</p>
                    </footer>
                </div>
            </body>
            </html>
        `;

        app = new IntegratedWorkoutApp();
        await app.initialize();
    });

    it('完全なユーザージャーニーが正常に動作する', async () => {
        // 1. アプリケーション開始
        expect(app.workoutWizard.currentStep).toBe(1);
        
        // 2. 筋肉部位選択（プリセット使用）
        app.workoutWizard.selectPreset('upper');
        expect(app.workoutWizard.selectedMuscleGroups).toEqual(['chest', 'back']);
        
        // 3. 次のステップに進む
        const step2Result = app.workoutWizard.nextStep();
        expect(step2Result).toBe(true);
        expect(app.workoutWizard.currentStep).toBe(2);
        
        // 4. エクササイズ選択
        app.workoutWizard.addExercise('ベンチプレス');
        app.workoutWizard.addExercise('ラットプルダウン');
        expect(app.workoutWizard.selectedExercises.length).toBe(2);
        
        // 5. 最終ステップに進む
        const step3Result = app.workoutWizard.nextStep();
        expect(step3Result).toBe(true);
        expect(app.workoutWizard.currentStep).toBe(3);
        
        // 6. ワークアウト開始
        const workout = await app.workoutWizard.startWorkout();
        expect(workout).toBeDefined();
        expect(workout.exercises.length).toBe(2);
        
        // 7. ワークアウト実行
        await app.simulateWorkoutExecution();
        
        // 8. ワークアウト完了
        const completedWorkout = await app.workoutWizard.stopWorkout();
        expect(completedWorkout.endTime).toBeInstanceOf(Date);
        
        // 9. パフォーマンスメトリクス確認
        const metrics = app.getOverallPerformanceMetrics();
        expect(metrics.operationReduction).toBeGreaterThanOrEqual(50);
        expect(metrics.accessibilityScore).toBeGreaterThanOrEqual(90);
    });

    it('エラー発生時のリカバリーが正常に動作する', async () => {
        // ネットワークエラーをシミュレート
        const errorInfo = app.simulateNetworkError();
        expect(errorInfo.canRetry).toBe(true);
        
        // リトライが成功する
        const retryResult = await errorInfo.retry();
        expect(retryResult.success).toBe(true);
        
        // 通常のフローが継続可能
        const result = await app.performCompleteWorkoutFlow();
        expect(result.success).toBe(true);
    });

    it('アクセシビリティ機能が完全に動作する', () => {
        // キーボードナビゲーション
        app.simulateKeyboardNavigation('Tab');
        app.simulateKeyboardNavigation('1', true);
        app.simulateKeyboardNavigation('Escape');
        
        // スクリーンリーダー対応
        app.accessibilityManager.announce('ワークアウトを開始します');
        expect(app.accessibilityManager.liveRegion.textContent).toBe('ワークアウトを開始します');
        
        // アクセシビリティスコア
        const score = app.measureAccessibilityScore();
        expect(score).toBeGreaterThanOrEqual(90);
    });

    it('モバイル最適化が完全に動作する', () => {
        // タッチターゲット最適化
        const buttons = document.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        // スワイプジェスチャー
        app.workoutWizard.selectPreset('upper');
        app.simulateSwipeGesture('left');
        expect(app.workoutWizard.currentStep).toBe(2);
        
        // 片手操作モード
        app.mobileOptimization.enableOneHandedMode();
        expect(document.body.classList.contains('one-handed-mode')).toBe(true);
        
        // モバイル最適化スコア
        const score = app.measureMobileOptimization();
        expect(score).toBeGreaterThanOrEqual(80);
    });
});

export { IntegratedWorkoutApp };
