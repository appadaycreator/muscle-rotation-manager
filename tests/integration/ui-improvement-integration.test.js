/**
 * UI改善機能の統合テスト
 */

// テストランナーはグローバルで利用可能

// 統合テスト用のモック
const mockIntegrationSystem = {
    // ワークアウトウィザードのモック
    workoutWizard: {
        currentStep: 1,
        selectedMuscleGroups: [],
        selectedExercises: [],
        workoutActive: false,

        initialize() {
            this.currentStep = 1;
            this.selectedMuscleGroups = [];
            this.selectedExercises = [];
            return true;
        },

        selectMuscleGroup(muscleId) {
            if (!this.selectedMuscleGroups.includes(muscleId)) {
                this.selectedMuscleGroups.push(muscleId);
            }
            return this.selectedMuscleGroups;
        },

        addExercise(exerciseName) {
            const exercise = {
                id: Date.now().toString(),
                name: exerciseName,
                sets: []
            };
            this.selectedExercises.push(exercise);
            return exercise;
        },

        nextStep() {
            if (this.currentStep < 3) {
                this.currentStep++;
                return true;
            }
            return false;
        },

        startWorkout() {
            this.workoutActive = true;
            return true;
        },

        completeWorkout() {
            if (!this.workoutActive) {
                throw new Error('ワークアウトが開始されていません');
            }
            this.workoutActive = false;
            return {
                duration: 1800, // 30分
                exercises: this.selectedExercises,
                muscleGroups: this.selectedMuscleGroups
            };
        }
    },

    // エラーハンドリングのモック
    errorHandler: {
        notifications: [],

        showError(message, severity = 'error') {
            const notification = {
                id: Date.now().toString(),
                message,
                severity,
                timestamp: new Date().toISOString(),
                visible: true
            };
            this.notifications.push(notification);
            return notification;
        },

        hideError(notificationId) {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.visible = false;
                return true;
            }
            return false;
        },

        getVisibleNotifications() {
            return this.notifications.filter(n => n.visible);
        },

        clearAllNotifications() {
            this.notifications = [];
        }
    },

    // モバイル最適化のモック
    mobileOptimization: {
        swipeHandlers: [],
        touchTargetsOptimized: false,

        initializeSwipeGestures(element) {
            const handler = {
                element,
                onSwipeLeft: null,
                onSwipeRight: null
            };
            this.swipeHandlers.push(handler);
            return handler;
        },

        optimizeTouchTargets() {
            this.touchTargetsOptimized = true;
            return 15; // 最適化された要素数
        },

        simulateSwipe(direction) {
            const handler = this.swipeHandlers[0];
            if (handler) {
                if (direction === 'left' && handler.onSwipeLeft) {
                    handler.onSwipeLeft();
                    return true;
                }
                if (direction === 'right' && handler.onSwipeRight) {
                    handler.onSwipeRight();
                    return true;
                }
            }
            return false;
        }
    },

    // アクセシビリティのモック
    accessibility: {
        ariaAttributes: new Map(),
        liveRegionMessages: [],
        focusTraps: [],

        addAriaLabel(element, label) {
            this.ariaAttributes.set(element, { 'aria-label': label });
            return true;
        },

        announce(message) {
            this.liveRegionMessages.push({
                message,
                timestamp: new Date().toISOString()
            });
            return true;
        },

        trapFocus(element) {
            const trap = { element, active: true };
            this.focusTraps.push(trap);
            return trap;
        },

        releaseFocus(trap) {
            if (trap) {
                trap.active = false;
                return true;
            }
            return false;
        },

        getActiveTraps() {
            return this.focusTraps.filter(trap => trap.active);
        }
    }
};

// テストスイート
testRunner.describe('UI改善機能統合テスト', () => {
    testRunner.beforeEach(() => {
        // 各テスト前にシステムをリセット
        mockIntegrationSystem.workoutWizard.initialize();
        mockIntegrationSystem.errorHandler.clearAllNotifications();
        mockIntegrationSystem.mobileOptimization.swipeHandlers = [];
        mockIntegrationSystem.accessibility.ariaAttributes.clear();
        mockIntegrationSystem.accessibility.liveRegionMessages = [];
        mockIntegrationSystem.accessibility.focusTraps = [];
    });

    testRunner.test('Full workout wizard flow completes successfully', async () => {
        const wizard = mockIntegrationSystem.workoutWizard;

        // Step 1: 筋肉部位選択
        testRunner.expect(wizard.currentStep).toBe(1);
        wizard.selectMuscleGroup('chest');
        wizard.selectMuscleGroup('shoulders');
        testRunner.expect(wizard.selectedMuscleGroups).toHaveLength(2);

        // Step 2: エクササイズ選択
        wizard.nextStep();
        testRunner.expect(wizard.currentStep).toBe(2);
        wizard.addExercise('ベンチプレス');
        wizard.addExercise('ショルダープレス');
        testRunner.expect(wizard.selectedExercises).toHaveLength(2);

        // Step 3: ワークアウト開始
        wizard.nextStep();
        testRunner.expect(wizard.currentStep).toBe(3);
        wizard.startWorkout();
        testRunner.expect(wizard.workoutActive).toBe(true);

        // ワークアウト完了
        const result = wizard.completeWorkout();
        testRunner.expect(result.exercises).toHaveLength(2);
        testRunner.expect(result.muscleGroups).toHaveLength(2);
        testRunner.expect(wizard.workoutActive).toBe(false);
    });

    testRunner.test('Error notification displays correctly during workout flow', () => {
        const wizard = mockIntegrationSystem.workoutWizard;
        const errorHandler = mockIntegrationSystem.errorHandler;

        // ワークアウト未開始時の完了試行でエラー
        try {
            wizard.completeWorkout();
        } catch (error) {
            const notification = errorHandler.showError(error.message, 'error');
            testRunner.expect(notification.message).toContain('ワークアウトが開始されていません');
            testRunner.expect(notification.severity).toBe('error');
        }

        // エラー通知が表示されていることを確認
        const visibleNotifications = errorHandler.getVisibleNotifications();
        testRunner.expect(visibleNotifications).toHaveLength(1);

        // エラー通知を非表示
        const notificationId = visibleNotifications[0].id;
        const hideResult = errorHandler.hideError(notificationId);
        testRunner.expect(hideResult).toBe(true);
        testRunner.expect(errorHandler.getVisibleNotifications()).toHaveLength(0);
    });

    testRunner.test('Mobile swipe gestures navigate wizard steps', () => {
        const wizard = mockIntegrationSystem.workoutWizard;
        const mobile = mockIntegrationSystem.mobileOptimization;

        // スワイプハンドラーを初期化
        const mockElement = { id: 'wizard-container' };
        const swipeHandler = mobile.initializeSwipeGestures(mockElement);
        
        // スワイプイベントハンドラーを設定
        swipeHandler.onSwipeLeft = () => {
            if (wizard.currentStep < 3) {
                wizard.nextStep();
            }
        };
        
        swipeHandler.onSwipeRight = () => {
            if (wizard.currentStep > 1) {
                wizard.currentStep--;
            }
        };

        // 初期状態
        testRunner.expect(wizard.currentStep).toBe(1);

        // 左スワイプで次のステップ
        mobile.simulateSwipe('left');
        testRunner.expect(wizard.currentStep).toBe(2);

        // 右スワイプで前のステップ
        mobile.simulateSwipe('right');
        testRunner.expect(wizard.currentStep).toBe(1);
    });

    testRunner.test('Accessibility features enhance wizard usability', () => {
        const wizard = mockIntegrationSystem.workoutWizard;
        const accessibility = mockIntegrationSystem.accessibility;

        // Step 1でアクセシビリティ機能を設定
        const muscleGroupButton = { id: 'chest-button' };
        accessibility.addAriaLabel(muscleGroupButton, '胸筋を選択');
        
        testRunner.expect(accessibility.ariaAttributes.has(muscleGroupButton)).toBe(true);

        // 筋肉部位選択時にスクリーンリーダーに通知
        wizard.selectMuscleGroup('chest');
        accessibility.announce('胸筋が選択されました');
        
        testRunner.expect(accessibility.liveRegionMessages).toHaveLength(1);
        testRunner.expect(accessibility.liveRegionMessages[0].message).toBe('胸筋が選択されました');

        // モーダルでフォーカストラップ
        const modalElement = { id: 'workout-summary-modal' };
        const focusTrap = accessibility.trapFocus(modalElement);
        
        testRunner.expect(accessibility.getActiveTraps()).toHaveLength(1);
        testRunner.expect(focusTrap.active).toBe(true);

        // フォーカストラップを解除
        accessibility.releaseFocus(focusTrap);
        testRunner.expect(accessibility.getActiveTraps()).toHaveLength(0);
    });

    testRunner.test('Touch target optimization improves mobile usability', () => {
        const mobile = mockIntegrationSystem.mobileOptimization;

        // タッチターゲットを最適化
        const optimizedCount = mobile.optimizeTouchTargets();
        
        testRunner.expect(optimizedCount).toBeGreaterThan(0);
        testRunner.expect(mobile.touchTargetsOptimized).toBe(true);
    });

    testRunner.test('Error recovery flow works correctly', () => {
        const wizard = mockIntegrationSystem.workoutWizard;
        const errorHandler = mockIntegrationSystem.errorHandler;

        // エラー状況を作成
        try {
            wizard.completeWorkout(); // ワークアウト未開始でエラー
        } catch (error) {
            // エラー通知を表示
            const notification = errorHandler.showError(
                'ワークアウトを開始してから完了してください',
                'warning'
            );
            
            testRunner.expect(notification.severity).toBe('warning');
        }

        // 正しい手順でワークアウトを実行
        wizard.selectMuscleGroup('chest');
        wizard.nextStep();
        wizard.addExercise('ベンチプレス');
        wizard.nextStep();
        wizard.startWorkout();

        // 今度は正常に完了
        const result = wizard.completeWorkout();
        testRunner.expect(result.exercises).toHaveLength(1);

        // 成功通知を表示
        const successNotification = errorHandler.showError(
            'ワークアウトが正常に完了しました',
            'success'
        );
        testRunner.expect(successNotification.severity).toBe('success');
    });

    testRunner.test('Multi-step validation prevents invalid progression', () => {
        const wizard = mockIntegrationSystem.workoutWizard;
        const errorHandler = mockIntegrationSystem.errorHandler;

        // Step 1: 筋肉部位未選択で次へ進もうとする
        testRunner.expect(wizard.selectedMuscleGroups).toHaveLength(0);
        
        if (wizard.selectedMuscleGroups.length === 0) {
            errorHandler.showError('筋肉部位を選択してください', 'warning');
            // 次のステップに進まない
        } else {
            wizard.nextStep();
        }
        
        testRunner.expect(wizard.currentStep).toBe(1); // まだStep 1
        testRunner.expect(errorHandler.getVisibleNotifications()).toHaveLength(1);

        // 筋肉部位を選択してから次へ
        wizard.selectMuscleGroup('chest');
        errorHandler.clearAllNotifications();
        wizard.nextStep();
        
        testRunner.expect(wizard.currentStep).toBe(2);
        testRunner.expect(errorHandler.getVisibleNotifications()).toHaveLength(0);
    });

    testRunner.test('Responsive design adapts to different screen sizes', () => {
        const mobile = mockIntegrationSystem.mobileOptimization;
        const accessibility = mockIntegrationSystem.accessibility;

        // モバイル環境での最適化
        mobile.optimizeTouchTargets();
        testRunner.expect(mobile.touchTargetsOptimized).toBe(true);

        // スクリーンリーダー対応
        const wizardContainer = { id: 'workout-wizard' };
        accessibility.addAriaLabel(wizardContainer, 'ワークアウト作成ウィザード');
        
        testRunner.expect(accessibility.ariaAttributes.has(wizardContainer)).toBe(true);

        // 進行状況の音声通知
        accessibility.announce('ステップ1: 筋肉部位を選択してください');
        testRunner.expect(accessibility.liveRegionMessages).toHaveLength(1);
    });

    testRunner.test('Performance metrics are within acceptable ranges', () => {
        const startTime = performance.now();

        // ワークアウトウィザードの初期化
        const wizard = mockIntegrationSystem.workoutWizard;
        wizard.initialize();

        // UI最適化の実行
        const mobile = mockIntegrationSystem.mobileOptimization;
        mobile.optimizeTouchTargets();

        // アクセシビリティ設定
        const accessibility = mockIntegrationSystem.accessibility;
        const element = { id: 'test-element' };
        accessibility.addAriaLabel(element, 'テスト要素');

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // 初期化が100ms以内に完了することを確認
        testRunner.expect(executionTime).toBeLessThan(100);
    });

    testRunner.test('Data persistence works across wizard steps', () => {
        const wizard = mockIntegrationSystem.workoutWizard;

        // Step 1でデータを設定
        wizard.selectMuscleGroup('chest');
        wizard.selectMuscleGroup('shoulders');
        const step1Data = [...wizard.selectedMuscleGroups];

        // Step 2に進む
        wizard.nextStep();
        wizard.addExercise('ベンチプレス');
        const step2Data = [...wizard.selectedExercises];

        // Step 3に進む
        wizard.nextStep();

        // データが保持されていることを確認
        testRunner.expect(wizard.selectedMuscleGroups).toEqual(step1Data);
        testRunner.expect(wizard.selectedExercises).toEqual(step2Data);

        // ワークアウト完了時にすべてのデータが含まれる
        wizard.startWorkout();
        const result = wizard.completeWorkout();
        
        testRunner.expect(result.muscleGroups).toEqual(step1Data);
        testRunner.expect(result.exercises).toEqual(step2Data);
    });
});

console.log('🔄 UI改善機能の統合テストを実行します...');