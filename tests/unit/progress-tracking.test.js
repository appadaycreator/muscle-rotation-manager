/**
 * プログレッシブ・オーバーロード追跡機能のユニットテスト
 * 1RM計算、進捗統計、目標設定・達成度の検証
 */

// テストランナーが利用可能かチェック
if (typeof global !== 'undefined' && global.TestRunner) {
    const { TestRunner } = global;

    // プログレッシブ・オーバーロード追跡サービスのテスト
    TestRunner.describe('ProgressTrackingService', () => {
        let progressTrackingService;

        TestRunner.beforeEach(() => {
            // モックサービスを作成
            progressTrackingService = {
                calculateOneRM: function(weight, reps) {
                    if (!weight || !reps || weight <= 0 || reps <= 0) {
                        throw new Error('重量と回数は正の数である必要があります');
                    }
                    if (reps === 1) return weight;
                    if (reps > 36) {
                        throw new Error('36回を超える回数では1RM計算が不正確になります');
                    }
                    // Brzycki式: 1RM = weight × (36 / (37 - reps))
                    const oneRM = weight * (36 / (37 - reps));
                    return Math.round(oneRM * 10) / 10;
                },
                
                calculateBestOneRM: function(repsArray, weightsArray) {
                    let bestOneRM = 0;
                    for (let i = 0; i < repsArray.length && i < weightsArray.length; i++) {
                        const oneRM = this.calculateOneRM(weightsArray[i], repsArray[i]);
                        if (oneRM > bestOneRM) {
                            bestOneRM = oneRM;
                        }
                    }
                    return bestOneRM;
                },
                
                calculateStats: function(history) {
                    if (!history || history.length === 0) {
                        return {
                            maxOneRM: 0,
                            avgOneRM: 0,
                            maxWeight: 0,
                            avgWeight: 0,
                            maxReps: 0,
                            avgReps: 0,
                            improvement: 0
                        };
                    }
                    
                    const oneRMValues = history.map(h => h.one_rm).filter(rm => rm > 0);
                    const weights = history.flatMap(h => h.weights);
                    const reps = history.flatMap(h => h.reps);
                    
                    return {
                        maxOneRM: Math.max(...oneRMValues),
                        avgOneRM: Math.round((oneRMValues.reduce((sum, rm) => sum + rm, 0) / oneRMValues.length) * 10) / 10,
                        maxWeight: Math.max(...weights),
                        avgWeight: Math.round((weights.reduce((sum, w) => sum + w, 0) / weights.length) * 10) / 10,
                        maxReps: Math.max(...reps),
                        avgReps: Math.round((reps.reduce((sum, r) => sum + r, 0) / reps.length) * 10) / 10,
                        improvement: oneRMValues.length > 1 
                            ? Math.round(((oneRMValues[oneRMValues.length - 1] - oneRMValues[0]) / oneRMValues[0]) * 100 * 10) / 10
                            : 0
                    };
                },
                
                analyzeTrend: function(history) {
                    if (!history || history.length < 2) {
                        return { direction: 'insufficient_data', strength: 0 };
                    }
                    
                    const oneRMValues = history.map(h => h.one_rm).filter(rm => rm > 0);
                    if (oneRMValues.length < 2) {
                        return { direction: 'insufficient_data', strength: 0 };
                    }
                    
                    // 線形回帰による傾向分析
                    const n = oneRMValues.length;
                    const x = Array.from({ length: n }, (_, i) => i);
                    const y = oneRMValues;
                    
                    const sumX = x.reduce((sum, val) => sum + val, 0);
                    const sumY = y.reduce((sum, val) => sum + val, 0);
                    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
                    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
                    
                    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                    
                    let direction = 'stable';
                    let strength = Math.abs(slope);
                    
                    if (slope > 0.1) {
                        direction = 'improving';
                    } else if (slope < -0.1) {
                        direction = 'declining';
                    }
                    
                    return { direction, strength: Math.round(strength * 100) / 100 };
                }
            };
        });

        TestRunner.test('1RM計算 - 正常ケース', () => {
            // 1回の場合
            TestRunner.assertEqual(progressTrackingService.calculateOneRM(100, 1), 100);
            
            // 5回の場合（Brzycki式）
            const result5reps = progressTrackingService.calculateOneRM(80, 5);
            const expected5reps = 80 * (36 / (37 - 5)); // 90kg
            TestRunner.assertEqual(result5reps, Math.round(expected5reps * 10) / 10);
            
            // 10回の場合
            const result10reps = progressTrackingService.calculateOneRM(60, 10);
            const expected10reps = 60 * (36 / (37 - 10)); // 80kg
            TestRunner.assertEqual(result10reps, Math.round(expected10reps * 10) / 10);
        });

        TestRunner.test('1RM計算 - エラーケース', () => {
            // 無効な入力値
            TestRunner.assertThrows(() => {
                progressTrackingService.calculateOneRM(0, 5);
            }, '重量と回数は正の数である必要があります');
            
            TestRunner.assertThrows(() => {
                progressTrackingService.calculateOneRM(100, 0);
            }, '重量と回数は正の数である必要があります');
            
            TestRunner.assertThrows(() => {
                progressTrackingService.calculateOneRM(-50, 5);
            }, '重量と回数は正の数である必要があります');
            
            // 36回を超える場合
            TestRunner.assertThrows(() => {
                progressTrackingService.calculateOneRM(50, 40);
            }, '36回を超える回数では1RM計算が不正確になります');
        });

        TestRunner.test('セット内最高1RM計算', () => {
            const repsArray = [8, 6, 4];
            const weightsArray = [70, 80, 90];
            
            const bestOneRM = progressTrackingService.calculateBestOneRM(repsArray, weightsArray);
            
            // 90kg × 4回が最も高い1RMになるはず
            const expected = 90 * (36 / (37 - 4)); // 約101.8kg
            TestRunner.assertEqual(bestOneRM, Math.round(expected * 10) / 10);
        });

        TestRunner.test('進捗統計計算', () => {
            const mockHistory = [
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
                },
                {
                    workout_date: '2024-01-15',
                    one_rm: 90,
                    weights: [70, 75, 80],
                    reps: [10, 8, 6]
                }
            ];
            
            const stats = progressTrackingService.calculateStats(mockHistory);
            
            TestRunner.assertEqual(stats.maxOneRM, 90);
            TestRunner.assertEqual(stats.avgOneRM, 85.0);
            TestRunner.assertEqual(stats.maxWeight, 80);
            TestRunner.assertEqual(stats.improvement, 12.5); // (90-80)/80 * 100 = 12.5%
        });

        TestRunner.test('トレンド分析 - 向上中', () => {
            const mockHistory = [
                { one_rm: 80 },
                { one_rm: 85 },
                { one_rm: 90 },
                { one_rm: 95 }
            ];
            
            const trend = progressTrackingService.analyzeTrend(mockHistory);
            
            TestRunner.assertEqual(trend.direction, 'improving');
            TestRunner.assertTrue(trend.strength > 0);
        });

        TestRunner.test('トレンド分析 - 低下中', () => {
            const mockHistory = [
                { one_rm: 100 },
                { one_rm: 95 },
                { one_rm: 90 },
                { one_rm: 85 }
            ];
            
            const trend = progressTrackingService.analyzeTrend(mockHistory);
            
            TestRunner.assertEqual(trend.direction, 'declining');
            TestRunner.assertTrue(trend.strength > 0);
        });

        TestRunner.test('トレンド分析 - データ不足', () => {
            const mockHistory = [{ one_rm: 80 }];
            
            const trend = progressTrackingService.analyzeTrend(mockHistory);
            
            TestRunner.assertEqual(trend.direction, 'insufficient_data');
            TestRunner.assertEqual(trend.strength, 0);
        });
    });

    // チャートサービスのテスト
    TestRunner.describe('ChartService', () => {
        let chartService;

        TestRunner.beforeEach(() => {
            // モックチャートサービス
            chartService = {
                charts: new Map(),
                
                destroyChart: function(chartId) {
                    if (this.charts.has(chartId)) {
                        this.charts.delete(chartId);
                        return true;
                    }
                    return false;
                },
                
                createChart: function(canvasId, data, type = 'line') {
                    if (!canvasId || !data) {
                        throw new Error('Canvas ID and data are required');
                    }
                    
                    const mockChart = {
                        id: canvasId,
                        type: type,
                        data: data,
                        destroy: () => this.destroyChart(canvasId)
                    };
                    
                    this.charts.set(canvasId, mockChart);
                    return mockChart;
                },
                
                destroyAllCharts: function() {
                    this.charts.clear();
                }
            };
        });

        TestRunner.test('チャート作成 - 正常ケース', () => {
            const mockData = [
                { workout_date: '2024-01-01', one_rm: 80 },
                { workout_date: '2024-01-08', one_rm: 85 }
            ];
            
            const chart = chartService.createChart('test-canvas', mockData, 'line');
            
            TestRunner.assertNotNull(chart);
            TestRunner.assertEqual(chart.id, 'test-canvas');
            TestRunner.assertEqual(chart.type, 'line');
            TestRunner.assertTrue(chartService.charts.has('test-canvas'));
        });

        TestRunner.test('チャート作成 - エラーケース', () => {
            TestRunner.assertThrows(() => {
                chartService.createChart(null, []);
            }, 'Canvas ID and data are required');
            
            TestRunner.assertThrows(() => {
                chartService.createChart('test-canvas', null);
            }, 'Canvas ID and data are required');
        });

        TestRunner.test('チャート破棄', () => {
            const mockData = [{ workout_date: '2024-01-01', one_rm: 80 }];
            chartService.createChart('test-canvas', mockData);
            
            TestRunner.assertTrue(chartService.charts.has('test-canvas'));
            
            const destroyed = chartService.destroyChart('test-canvas');
            
            TestRunner.assertTrue(destroyed);
            TestRunner.assertFalse(chartService.charts.has('test-canvas'));
        });

        TestRunner.test('全チャート破棄', () => {
            const mockData = [{ workout_date: '2024-01-01', one_rm: 80 }];
            
            chartService.createChart('chart1', mockData);
            chartService.createChart('chart2', mockData);
            chartService.createChart('chart3', mockData);
            
            TestRunner.assertEqual(chartService.charts.size, 3);
            
            chartService.destroyAllCharts();
            
            TestRunner.assertEqual(chartService.charts.size, 0);
        });
    });

    // 目標設定・達成度のテスト
    TestRunner.describe('Goal Management', () => {
        let goalManager;

        TestRunner.beforeEach(() => {
            goalManager = {
                calculateGoalProgress: function(currentValue, targetValue) {
                    if (targetValue <= 0) {
                        throw new Error('目標値は正の数である必要があります');
                    }
                    
                    const progressPercentage = Math.min(100, (currentValue / targetValue) * 100);
                    return {
                        current_value: currentValue,
                        target_value: targetValue,
                        progress_percentage: Math.round(progressPercentage * 10) / 10,
                        is_achieved: progressPercentage >= 100
                    };
                },
                
                validateGoal: function(goalData) {
                    const errors = [];
                    
                    if (!goalData.goalType) {
                        errors.push('目標タイプが必要です');
                    }
                    
                    if (!goalData.targetValue || goalData.targetValue <= 0) {
                        errors.push('目標値は正の数である必要があります');
                    }
                    
                    if (!goalData.targetDate) {
                        errors.push('目標達成日が必要です');
                    } else {
                        const targetDate = new Date(goalData.targetDate);
                        const today = new Date();
                        if (targetDate <= today) {
                            errors.push('目標達成日は未来の日付である必要があります');
                        }
                    }
                    
                    return {
                        isValid: errors.length === 0,
                        errors: errors
                    };
                }
            };
        });

        TestRunner.test('目標進捗計算 - 未達成', () => {
            const progress = goalManager.calculateGoalProgress(80, 100);
            
            TestRunner.assertEqual(progress.current_value, 80);
            TestRunner.assertEqual(progress.target_value, 100);
            TestRunner.assertEqual(progress.progress_percentage, 80.0);
            TestRunner.assertFalse(progress.is_achieved);
        });

        TestRunner.test('目標進捗計算 - 達成', () => {
            const progress = goalManager.calculateGoalProgress(105, 100);
            
            TestRunner.assertEqual(progress.current_value, 105);
            TestRunner.assertEqual(progress.target_value, 100);
            TestRunner.assertEqual(progress.progress_percentage, 100.0);
            TestRunner.assertTrue(progress.is_achieved);
        });

        TestRunner.test('目標進捗計算 - エラーケース', () => {
            TestRunner.assertThrows(() => {
                goalManager.calculateGoalProgress(80, 0);
            }, '目標値は正の数である必要があります');
            
            TestRunner.assertThrows(() => {
                goalManager.calculateGoalProgress(80, -50);
            }, '目標値は正の数である必要があります');
        });

        TestRunner.test('目標バリデーション - 正常ケース', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            
            const goalData = {
                goalType: 'weight',
                targetValue: 100,
                targetDate: futureDate.toISOString().split('T')[0]
            };
            
            const validation = goalManager.validateGoal(goalData);
            
            TestRunner.assertTrue(validation.isValid);
            TestRunner.assertEqual(validation.errors.length, 0);
        });

        TestRunner.test('目標バリデーション - エラーケース', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            
            const invalidGoalData = {
                goalType: '',
                targetValue: -50,
                targetDate: pastDate.toISOString().split('T')[0]
            };
            
            const validation = goalManager.validateGoal(invalidGoalData);
            
            TestRunner.assertFalse(validation.isValid);
            TestRunner.assertTrue(validation.errors.length > 0);
            TestRunner.assertContains(validation.errors, '目標タイプが必要です');
            TestRunner.assertContains(validation.errors, '目標値は正の数である必要があります');
            TestRunner.assertContains(validation.errors, '目標達成日は未来の日付である必要があります');
        });
    });

    // 週間データ集計のテスト
    TestRunner.describe('Weekly Data Aggregation', () => {
        let dataAggregator;

        TestRunner.beforeEach(() => {
            dataAggregator = {
                groupByWeek: function(history) {
                    const weeks = {};
                    
                    history.forEach(record => {
                        const date = new Date(record.workout_date);
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        const weekKey = weekStart.toISOString().split('T')[0];
                        
                        if (!weeks[weekKey]) {
                            weeks[weekKey] = {
                                weekStart: weekKey,
                                sessions: [],
                                maxWeight: 0,
                                maxOneRM: 0,
                                totalVolume: 0
                            };
                        }
                        
                        weeks[weekKey].sessions.push(record);
                        weeks[weekKey].maxWeight = Math.max(weeks[weekKey].maxWeight, Math.max(...record.weights));
                        weeks[weekKey].maxOneRM = Math.max(weeks[weekKey].maxOneRM, record.one_rm);
                        
                        const sessionVolume = record.weights.reduce((sum, weight, index) => {
                            return sum + (weight * record.reps[index]);
                        }, 0);
                        weeks[weekKey].totalVolume += sessionVolume;
                    });
                    
                    return Object.values(weeks).sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
                }
            };
        });

        TestRunner.test('週間データ集計', () => {
            const mockHistory = [
                {
                    workout_date: '2024-01-01', // 月曜日
                    one_rm: 80,
                    weights: [60, 65],
                    reps: [10, 8]
                },
                {
                    workout_date: '2024-01-03', // 水曜日（同じ週）
                    one_rm: 85,
                    weights: [65, 70],
                    reps: [10, 8]
                },
                {
                    workout_date: '2024-01-08', // 次の週の月曜日
                    one_rm: 90,
                    weights: [70, 75],
                    reps: [10, 8]
                }
            ];
            
            const weeklyData = dataAggregator.groupByWeek(mockHistory);
            
            TestRunner.assertEqual(weeklyData.length, 2); // 2週間分
            
            // 第1週
            const week1 = weeklyData[0];
            TestRunner.assertEqual(week1.sessions.length, 2);
            TestRunner.assertEqual(week1.maxWeight, 70);
            TestRunner.assertEqual(week1.maxOneRM, 85);
            
            // 第2週
            const week2 = weeklyData[1];
            TestRunner.assertEqual(week2.sessions.length, 1);
            TestRunner.assertEqual(week2.maxWeight, 75);
            TestRunner.assertEqual(week2.maxOneRM, 90);
        });

        TestRunner.test('ボリューム計算', () => {
            const mockHistory = [
                {
                    workout_date: '2024-01-01',
                    one_rm: 80,
                    weights: [60, 70],
                    reps: [10, 8]
                }
            ];
            
            const weeklyData = dataAggregator.groupByWeek(mockHistory);
            
            // ボリューム = 60×10 + 70×8 = 600 + 560 = 1160
            TestRunner.assertEqual(weeklyData[0].totalVolume, 1160);
        });
    });

    console.log('プログレッシブ・オーバーロード追跡機能のテストが読み込まれました');
} else {
    console.warn('TestRunner not available. Skipping progress tracking tests.');
}
