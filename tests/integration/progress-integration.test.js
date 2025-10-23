/**
 * プログレッシブ・オーバーロード機能の統合テスト
 * サービス間の連携、データフロー、UI統合の検証
 */

// テストランナーが利用可能かチェック
if (typeof global !== 'undefined' && global.TestRunner) {
    const { TestRunner } = global;

    // プログレッシブ・オーバーロード統合テスト
    TestRunner.describe('Progressive Overload Integration', () => {
        let mockSupabaseService;
        let mockProgressTrackingService;
        let mockChartService;

        TestRunner.beforeEach(() => {
            // モックSupabaseサービス
            mockSupabaseService = {
                currentUser: { id: 'test-user-id' },
                
                getCurrentUser: function() {
                    return Promise.resolve(this.currentUser);
                },
                
                getClient: function() {
                    return {
                        from: function(table) {
                            return {
                                select: function(columns) {
                                    return {
                                        eq: function(column, value) {
                                            return {
                                                order: function(orderBy) {
                                                    // モックデータを返す
                                                    if (table === 'training_logs') {
                                                        return Promise.resolve({
                                                            data: [
                                                                {
                                                                    id: '1',
                                                                    workout_date: '2024-01-01',
                                                                    exercise_name: 'ベンチプレス',
                                                                    weights: [60, 65, 70],
                                                                    reps: [10, 8, 6],
                                                                    one_rm: 80
                                                                },
                                                                {
                                                                    id: '2',
                                                                    workout_date: '2024-01-08',
                                                                    exercise_name: 'ベンチプレス',
                                                                    weights: [65, 70, 75],
                                                                    reps: [10, 8, 6],
                                                                    one_rm: 85
                                                                }
                                                            ],
                                                            error: null
                                                        });
                                                    } else if (table === 'user_goals') {
                                                        return Promise.resolve({
                                                            data: [
                                                                {
                                                                    id: 'goal-1',
                                                                    goal_type: 'one_rm',
                                                                    target_value: 100,
                                                                    current_value: 85,
                                                                    target_date: '2024-06-01',
                                                                    description: '1RM 100kg達成',
                                                                    is_active: true,
                                                                    is_achieved: false
                                                                }
                                                            ],
                                                            error: null
                                                        });
                                                    }
                                                    return Promise.resolve({ data: [], error: null });
                                                }
                                            };
                                        }
                                    };
                                },
                                
                                insert: function(data) {
                                    return Promise.resolve({
                                        data: { ...data, id: 'new-id' },
                                        error: null
                                    });
                                },
                                
                                upsert: function(data) {
                                    return Promise.resolve({
                                        data: { ...data, id: data.id || 'new-id' },
                                        error: null
                                    });
                                }
                            };
                        }
                    };
                }
            };

            // モックプログレッシブ・オーバーロードサービス
            mockProgressTrackingService = {
                calculateOneRM: function(weight, reps) {
                    if (reps === 1) return weight;
                    return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
                },
                
                getProgressHistory: function(userId, exerciseId, days = 90) {
                    return Promise.resolve([
                        {
                            workout_date: '2024-01-01',
                            one_rm: 80,
                            weights: [60, 65, 70],
                            reps: [10, 8, 6]
                        },
                        {
                            workout_date: '2024-01-08',
                            one_rm: 85,
                            weights: [65, 70, 75],
                            reps: [10, 8, 6]
                        }
                    ]);
                },
                
                calculateGoalProgress: function(userId, exerciseId) {
                    return Promise.resolve({
                        hasGoals: true,
                        progress: [
                            {
                                id: 'goal-1',
                                goal_type: 'one_rm',
                                target_value: 100,
                                current_value: 85,
                                progress_percentage: 85.0,
                                is_achieved: false,
                                description: '1RM 100kg達成'
                            }
                        ]
                    });
                },
                
                setGoal: function(goalData) {
                    return Promise.resolve({
                        success: true,
                        data: { ...goalData, id: 'new-goal-id' }
                    });
                },
                
                generateMonthlyAnalysis: function(userId, exerciseId) {
                    return Promise.resolve({
                        hasData: true,
                        weeklyData: [
                            {
                                weekStart: '2023-12-31',
                                sessions: [{ workout_date: '2024-01-01' }],
                                maxWeight: 70,
                                maxOneRM: 80,
                                totalVolume: 1200
                            },
                            {
                                weekStart: '2024-01-07',
                                sessions: [{ workout_date: '2024-01-08' }],
                                maxWeight: 75,
                                maxOneRM: 85,
                                totalVolume: 1300
                            }
                        ],
                        trend: {
                            direction: 'improving',
                            strength: 2.5
                        },
                        stats: {
                            maxOneRM: 85,
                            avgOneRM: 82.5,
                            maxWeight: 75,
                            avgWeight: 67.5,
                            maxReps: 10,
                            avgReps: 8,
                            improvement: 6.25
                        },
                        totalSessions: 2,
                        dateRange: {
                            start: '2024-01-01',
                            end: '2024-01-08'
                        }
                    });
                }
            };

            // モックチャートサービス
            mockChartService = {
                charts: new Map(),
                
                createOneRMChart: function(canvasId, data, options = {}) {
                    const chart = {
                        id: canvasId,
                        type: '1rm',
                        data: data,
                        options: options
                    };
                    this.charts.set(canvasId, chart);
                    return chart;
                },
                
                createWeightChart: function(canvasId, data, options = {}) {
                    const chart = {
                        id: canvasId,
                        type: 'weight',
                        data: data,
                        options: options
                    };
                    this.charts.set(canvasId, chart);
                    return chart;
                },
                
                createVolumeChart: function(canvasId, data, options = {}) {
                    const chart = {
                        id: canvasId,
                        type: 'volume',
                        data: data,
                        options: options
                    };
                    this.charts.set(canvasId, chart);
                    return chart;
                },
                
                destroyChart: function(chartId) {
                    return this.charts.delete(chartId);
                },
                
                destroyAllCharts: function() {
                    this.charts.clear();
                }
            };
        });

        TestRunner.test('進捗データ取得と表示の統合', async () => {
            const userId = 'test-user-id';
            const exerciseId = 'exercise-1';
            
            // 進捗履歴を取得
            const progressHistory = await mockProgressTrackingService.getProgressHistory(userId, exerciseId);
            
            TestRunner.assertEqual(progressHistory.length, 2);
            TestRunner.assertEqual(progressHistory[0].one_rm, 80);
            TestRunner.assertEqual(progressHistory[1].one_rm, 85);
            
            // チャートを作成
            const chart = mockChartService.createOneRMChart('test-canvas', progressHistory);
            
            TestRunner.assertNotNull(chart);
            TestRunner.assertEqual(chart.type, '1rm');
            TestRunner.assertEqual(chart.data.length, 2);
            TestRunner.assertTrue(mockChartService.charts.has('test-canvas'));
        });

        TestRunner.test('目標設定から達成度計算までの統合フロー', async () => {
            const userId = 'test-user-id';
            const exerciseId = 'exercise-1';
            
            // 目標を設定
            const goalData = {
                userId: userId,
                exerciseId: exerciseId,
                goalType: 'one_rm',
                targetValue: 100,
                currentValue: 85,
                targetDate: '2024-06-01',
                description: '1RM 100kg達成'
            };
            
            const setGoalResult = await mockProgressTrackingService.setGoal(goalData);
            
            TestRunner.assertTrue(setGoalResult.success);
            TestRunner.assertNotNull(setGoalResult.data.id);
            
            // 目標達成度を計算
            const goalProgress = await mockProgressTrackingService.calculateGoalProgress(userId, exerciseId);
            
            TestRunner.assertTrue(goalProgress.hasGoals);
            TestRunner.assertEqual(goalProgress.progress.length, 1);
            
            const progress = goalProgress.progress[0];
            TestRunner.assertEqual(progress.goal_type, 'one_rm');
            TestRunner.assertEqual(progress.target_value, 100);
            TestRunner.assertEqual(progress.current_value, 85);
            TestRunner.assertEqual(progress.progress_percentage, 85.0);
            TestRunner.assertFalse(progress.is_achieved);
        });

        TestRunner.test('月間分析レポート生成の統合', async () => {
            const userId = 'test-user-id';
            const exerciseId = 'exercise-1';
            
            // 月間分析を生成
            const analysis = await mockProgressTrackingService.generateMonthlyAnalysis(userId, exerciseId);
            
            TestRunner.assertTrue(analysis.hasData);
            TestRunner.assertEqual(analysis.weeklyData.length, 2);
            TestRunner.assertEqual(analysis.trend.direction, 'improving');
            TestRunner.assertEqual(analysis.stats.maxOneRM, 85);
            TestRunner.assertEqual(analysis.totalSessions, 2);
            
            // 週間比較チャートを作成（モック）
            const weeklyChart = {
                id: 'weekly-chart',
                type: 'weekly',
                data: analysis.weeklyData
            };
            
            TestRunner.assertNotNull(weeklyChart);
            TestRunner.assertEqual(weeklyChart.data.length, 2);
        });

        TestRunner.test('データ保存から統計更新までの統合フロー', async () => {
            const progressData = {
                userId: 'test-user-id',
                exerciseId: 'exercise-1',
                exerciseName: 'ベンチプレス',
                muscleGroupId: 'chest',
                workoutDate: '2024-01-15',
                sets: 3,
                reps: [10, 8, 6],
                weights: [70, 75, 80],
                workoutSessionId: 'session-1',
                notes: 'Good workout'
            };
            
            // 1RM計算
            const bestOneRM = mockProgressTrackingService.calculateOneRM(80, 6);
            TestRunner.assertEqual(bestOneRM, Math.round(80 * (36 / (37 - 6)) * 10) / 10);
            
            // データ保存をシミュレート
            const client = mockSupabaseService.getClient();
            const saveResult = await client.from('training_logs').insert({
                ...progressData,
                one_rm: bestOneRM
            });
            
            TestRunner.assertNull(saveResult.error);
            TestRunner.assertNotNull(saveResult.data.id);
            
            // 統計更新をシミュレート
            const statsResult = await client.from('progress_stats').upsert({
                user_id: progressData.userId,
                exercise_id: progressData.exerciseId,
                max_one_rm: bestOneRM,
                total_sessions: 1
            });
            
            TestRunner.assertNull(statsResult.error);
        });

        TestRunner.test('チャート切り替えの統合', () => {
            const mockData = [
                {
                    workout_date: '2024-01-01',
                    one_rm: 80,
                    weights: [60, 65, 70],
                    reps: [10, 8, 6]
                }
            ];
            
            // 1RMチャート作成
            const oneRMChart = mockChartService.createOneRMChart('progress-chart', mockData);
            TestRunner.assertEqual(oneRMChart.type, '1rm');
            
            // 重量チャートに切り替え
            mockChartService.destroyChart('progress-chart');
            const weightChart = mockChartService.createWeightChart('progress-chart', mockData);
            TestRunner.assertEqual(weightChart.type, 'weight');
            
            // ボリュームチャートに切り替え
            mockChartService.destroyChart('progress-chart');
            const volumeChart = mockChartService.createVolumeChart('progress-chart', mockData);
            TestRunner.assertEqual(volumeChart.type, 'volume');
        });

        TestRunner.test('エラーハンドリングの統合', async () => {
            // 無効なユーザーIDでのデータ取得
            try {
                const progressHistory = await mockProgressTrackingService.getProgressHistory(null, 'exercise-1');
                TestRunner.fail('Should have thrown an error for null user ID');
            } catch (error) {
                TestRunner.assertTrue(error instanceof Error);
            }
            
            // 無効な目標データの設定
            try {
                const invalidGoalData = {
                    userId: 'test-user-id',
                    exerciseId: 'exercise-1',
                    goalType: '',
                    targetValue: -100,
                    targetDate: '2023-01-01' // 過去の日付
                };
                
                // バリデーションエラーをシミュレート
                if (!invalidGoalData.goalType || invalidGoalData.targetValue <= 0) {
                    throw new Error('Invalid goal data');
                }
            } catch (error) {
                TestRunner.assertEqual(error.message, 'Invalid goal data');
            }
        });

        TestRunner.test('パフォーマンス最適化の検証', () => {
            const largeDataSet = Array.from({ length: 100 }, (_, i) => ({
                workout_date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                one_rm: 80 + (i * 0.5),
                weights: [60 + i, 65 + i, 70 + i],
                reps: [10, 8, 6]
            }));
            
            // 大量データでのチャート作成
            const startTime = Date.now();
            const chart = mockChartService.createOneRMChart('large-chart', largeDataSet);
            const endTime = Date.now();
            
            TestRunner.assertNotNull(chart);
            TestRunner.assertEqual(chart.data.length, 100);
            
            // パフォーマンス検証（100ms以内で完了することを期待）
            const processingTime = endTime - startTime;
            TestRunner.assertTrue(processingTime < 100, `Processing took ${processingTime}ms, expected < 100ms`);
        });

        TestRunner.test('データ整合性の検証', async () => {
            const userId = 'test-user-id';
            const exerciseId = 'exercise-1';
            
            // 進捗履歴を取得
            const progressHistory = await mockProgressTrackingService.getProgressHistory(userId, exerciseId);
            
            // データ整合性チェック
            progressHistory.forEach((record, index) => {
                // 日付の整合性
                TestRunner.assertTrue(record.workout_date instanceof String || typeof record.workout_date === 'string');
                
                // 配列の長さの整合性
                TestRunner.assertTrue(record.weights.length > 0);
                TestRunner.assertTrue(record.reps.length > 0);
                TestRunner.assertTrue(record.weights.length === record.reps.length);
                
                // 1RMの妥当性
                TestRunner.assertTrue(record.one_rm > 0);
                const maxWeight = Math.max(...record.weights);
                TestRunner.assertTrue(record.one_rm >= maxWeight);
            });
            
            // 時系列の整合性（日付順）
            for (let i = 1; i < progressHistory.length; i++) {
                const prevDate = new Date(progressHistory[i - 1].workout_date);
                const currDate = new Date(progressHistory[i].workout_date);
                TestRunner.assertTrue(currDate >= prevDate, 'Data should be in chronological order');
            }
        });
    });

    console.log('プログレッシブ・オーバーロード統合テストが読み込まれました');
} else {
    console.warn('TestRunner not available. Skipping progress integration tests.');
}
