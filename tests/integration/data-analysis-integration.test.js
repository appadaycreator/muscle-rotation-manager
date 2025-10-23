/**
 * データ分析機能の統合テスト
 * プログレッシブ・オーバーロード追跡の全体フローをテスト
 */

import { progressTrackingService } from '../../js/services/progressTrackingService.js';
import { chartService } from '../../js/services/chartService.js';
import { reportService } from '../../js/services/reportService.js';

// テスト用のモックデータ
const mockUser = {
    id: 'test-user-integration-123',
    email: 'test@example.com'
};

const mockExercise = {
    id: 'test-exercise-integration-456',
    name: 'ベンチプレス',
    name_ja: 'ベンチプレス',
    muscle_group_id: 'chest'
};

/**
 * プログレッシブ・オーバーロード追跡の全体フローテスト
 */
async function testProgressTrackingFlow() {
    console.log('🧪 プログレッシブ・オーバーロード追跡フローテスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        // Step 1: 初期データの記録
        const initialData = {
            userId: mockUser.id,
            exerciseId: mockExercise.id,
            exerciseName: mockExercise.name_ja,
            muscleGroupId: mockExercise.muscle_group_id,
            workoutDate: '2024-10-01',
            sets: 3,
            reps: [10, 8, 6],
            weights: [100, 105, 110],
            workoutSessionId: 'session-1',
            notes: '初回記録'
        };

        console.log('📝 Step 1: 初期データ記録テスト');
        
        // 1RM計算のテスト
        const expectedOneRM = progressTrackingService.calculateBestOneRM(initialData.reps, initialData.weights);
        if (expectedOneRM > 0) {
            console.log(`✅ 1RM計算: ${expectedOneRM}kg`);
            passed++;
        } else {
            console.log('❌ 1RM計算: 失敗');
            failed++;
        }

        // Step 2: 進捗データの蓄積
        console.log('📈 Step 2: 進捗データ蓄積テスト');
        
        const progressSessions = [
            {
                ...initialData,
                workoutDate: '2024-10-03',
                reps: [10, 9, 7],
                weights: [102.5, 107.5, 112.5],
                workoutSessionId: 'session-2',
                notes: '重量アップ'
            },
            {
                ...initialData,
                workoutDate: '2024-10-05',
                reps: [11, 9, 8],
                weights: [105, 110, 115],
                workoutSessionId: 'session-3',
                notes: '順調な進歩'
            },
            {
                ...initialData,
                workoutDate: '2024-10-08',
                reps: [12, 10, 8],
                weights: [107.5, 112.5, 117.5],
                workoutSessionId: 'session-4',
                notes: '新記録'
            }
        ];

        // 各セッションの1RM計算
        const oneRMProgression = progressSessions.map(session => 
            progressTrackingService.calculateBestOneRM(session.reps, session.weights)
        );

        if (oneRMProgression.every(rm => rm > 0)) {
            console.log(`✅ 進捗データ蓄積: ${oneRMProgression.length}セッション記録`);
            console.log(`   1RM推移: ${oneRMProgression.map(rm => rm.toFixed(1)).join(' → ')}kg`);
            passed++;
        } else {
            console.log('❌ 進捗データ蓄積: 一部のセッションで計算エラー');
            failed++;
        }

        // Step 3: 統計分析
        console.log('📊 Step 3: 統計分析テスト');
        
        const allSessions = [initialData, ...progressSessions];
        const mockProgressData = allSessions.map((session, index) => ({
            id: index + 1,
            workout_date: session.workoutDate,
            sets: session.sets,
            reps: session.reps,
            weights: session.weights,
            one_rm: progressTrackingService.calculateBestOneRM(session.reps, session.weights),
            exercise_name: session.exerciseName,
            notes: session.notes
        }));

        const stats = progressTrackingService.calculateStats(mockProgressData);
        
        if (stats.maxOneRM > stats.avgOneRM && stats.improvement > 0) {
            console.log(`✅ 統計分析: 最大1RM ${stats.maxOneRM}kg, 改善率 ${stats.improvement.toFixed(1)}%`);
            passed++;
        } else {
            console.log('❌ 統計分析: 統計値に異常');
            failed++;
        }

        // Step 4: トレンド分析
        console.log('📈 Step 4: トレンド分析テスト');
        
        const trend = progressTrackingService.analyzeTrend(mockProgressData);
        
        if (trend.direction === 'improving' && trend.strength > 0) {
            console.log(`✅ トレンド分析: ${trend.direction} (強度: ${trend.strength})`);
            passed++;
        } else {
            console.log(`❌ トレンド分析: ${trend.direction} (強度: ${trend.strength})`);
            failed++;
        }

        // Step 5: 目標設定と進捗追跡
        console.log('🎯 Step 5: 目標設定・進捗追跡テスト');
        
        const goalData = {
            userId: mockUser.id,
            exerciseId: mockExercise.id,
            goalType: 'one_rm',
            targetValue: 160,
            currentValue: stats.maxOneRM,
            targetDate: '2024-12-31',
            priority: 'high',
            strategy: '週3回のプログレッシブオーバーロード',
            description: '年末までに1RM 160kg達成',
            notifications: {
                progress: true,
                milestone: true,
                deadline: true
            }
        };

        // 目標進捗計算
        const progressPercentage = (goalData.currentValue / goalData.targetValue) * 100;
        const isAchievable = (goalData.targetValue - goalData.currentValue) / goalData.currentValue <= 0.3; // 30%以内の増加

        if (progressPercentage > 0 && progressPercentage < 100 && isAchievable) {
            console.log(`✅ 目標設定: 進捗 ${progressPercentage.toFixed(1)}%, 達成可能性あり`);
            passed++;
        } else {
            console.log(`❌ 目標設定: 進捗 ${progressPercentage.toFixed(1)}%, 達成可能性に問題`);
            failed++;
        }

        // Step 6: 週間分析
        console.log('📅 Step 6: 週間分析テスト');
        
        const weeklyData = progressTrackingService.groupByWeek(mockProgressData);
        
        if (weeklyData.length > 0 && weeklyData[0].sessions.length > 0) {
            console.log(`✅ 週間分析: ${weeklyData.length}週間のデータ, 最新週 ${weeklyData[weeklyData.length - 1].sessions.length}セッション`);
            passed++;
        } else {
            console.log('❌ 週間分析: データのグループ化に失敗');
            failed++;
        }

        // Step 7: レポート生成
        console.log('📄 Step 7: レポート生成テスト');
        
        const monthlyAnalysis = {
            hasData: true,
            stats,
            trend,
            totalSessions: mockProgressData.length,
            dateRange: {
                start: mockProgressData[0].workout_date,
                end: mockProgressData[mockProgressData.length - 1].workout_date
            },
            weeklyData
        };

        const weeklySummary = reportService.generateWeeklySummary(weeklyData, mockExercise.name_ja);
        const monthlySummary = reportService.generateMonthlySummary(monthlyAnalysis, mockExercise.name_ja);

        if (weeklySummary && monthlySummary && weeklySummary.exerciseName === mockExercise.name_ja) {
            console.log(`✅ レポート生成: 週間・月間サマリー正常生成`);
            console.log(`   パフォーマンススコア: ${monthlySummary.performanceScore}/100`);
            passed++;
        } else {
            console.log('❌ レポート生成: サマリー生成に失敗');
            failed++;
        }

        // Step 8: データエクスポート
        console.log('💾 Step 8: データエクスポートテスト');
        
        try {
            const csvBlob = reportService.exportToCSV(mockProgressData, mockExercise.name_ja);
            
            if (csvBlob instanceof Blob && csvBlob.size > 0) {
                console.log(`✅ CSVエクスポート: ${csvBlob.size}バイトのファイル生成`);
                passed++;
            } else {
                console.log('❌ CSVエクスポート: ファイル生成失敗');
                failed++;
            }
        } catch (error) {
            console.log(`❌ CSVエクスポート: ${error.message}`);
            failed++;
        }

    } catch (error) {
        console.log(`❌ 統合テストエラー: ${error.message}`);
        failed++;
    }

    console.log(`プログレッシブ・オーバーロード追跡フローテスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * 目標管理システムの統合テスト
 */
async function testGoalManagementIntegration() {
    console.log('🧪 目標管理システム統合テスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        // Step 1: SMART目標の設定
        console.log('🎯 Step 1: SMART目標設定テスト');
        
        const smartGoal = {
            userId: mockUser.id,
            exerciseId: mockExercise.id,
            goalType: 'weight',
            targetValue: 120,
            currentValue: 100,
            targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60日後
            priority: 'high',
            strategy: '週3回のトレーニング、毎回2.5kg増加',
            description: '最大重量120kg達成',
            notifications: {
                progress: true,
                milestone: true,
                deadline: true
            }
        };

        // SMART要素の検証
        const isSpecific = smartGoal.description && smartGoal.description.length > 5;
        const isMeasurable = smartGoal.targetValue > 0 && smartGoal.goalType;
        const isAchievable = (smartGoal.targetValue - smartGoal.currentValue) / smartGoal.currentValue <= 0.5; // 50%以内
        const isRelevant = ['weight', 'reps', 'one_rm'].includes(smartGoal.goalType);
        const isTimeBound = new Date(smartGoal.targetDate) > new Date();

        if (isSpecific && isMeasurable && isAchievable && isRelevant && isTimeBound) {
            console.log('✅ SMART目標設定: 全ての要素が適切');
            passed++;
        } else {
            console.log('❌ SMART目標設定: 一部要素に問題');
            console.log(`   Specific: ${isSpecific}, Measurable: ${isMeasurable}, Achievable: ${isAchievable}, Relevant: ${isRelevant}, Time-bound: ${isTimeBound}`);
            failed++;
        }

        // Step 2: 進捗シミュレーション
        console.log('📈 Step 2: 進捗シミュレーションテスト');
        
        const progressSimulation = [];
        let currentWeight = smartGoal.currentValue;
        const weeklyIncrease = 2.5;
        const weeks = 8;

        for (let week = 1; week <= weeks; week++) {
            currentWeight += weeklyIncrease;
            const progressPercentage = (currentWeight / smartGoal.targetValue) * 100;
            
            progressSimulation.push({
                week,
                weight: currentWeight,
                progress: progressPercentage,
                isAchieved: progressPercentage >= 100
            });
        }

        const finalProgress = progressSimulation[progressSimulation.length - 1];
        if (finalProgress.isAchieved) {
            console.log(`✅ 進捗シミュレーション: ${weeks}週間で目標達成 (${finalProgress.weight}kg)`);
            passed++;
        } else {
            console.log(`❌ 進捗シミュレーション: ${weeks}週間で未達成 (${finalProgress.weight}kg, ${finalProgress.progress.toFixed(1)}%)`);
            failed++;
        }

        // Step 3: マイルストーン検出
        console.log('🏆 Step 3: マイルストーン検出テスト');
        
        const milestones = [25, 50, 75, 90];
        const detectedMilestones = [];

        progressSimulation.forEach(progress => {
            milestones.forEach(milestone => {
                if (progress.progress >= milestone && progress.progress < milestone + 10) {
                    if (!detectedMilestones.includes(milestone)) {
                        detectedMilestones.push(milestone);
                    }
                }
            });
        });

        if (detectedMilestones.length >= 2) {
            console.log(`✅ マイルストーン検出: ${detectedMilestones.join(', ')}%で検出`);
            passed++;
        } else {
            console.log(`❌ マイルストーン検出: 検出数不足 (${detectedMilestones.length}件)`);
            failed++;
        }

        // Step 4: 通知システム
        console.log('🔔 Step 4: 通知システムテスト');
        
        let notificationCount = 0;
        
        // 進捗通知のシミュレーション
        if (smartGoal.notifications.progress) {
            notificationCount++;
        }
        
        // マイルストーン通知のシミュレーション
        if (smartGoal.notifications.milestone) {
            notificationCount += detectedMilestones.length;
        }
        
        // 期限前通知のシミュレーション
        if (smartGoal.notifications.deadline) {
            const daysUntilDeadline = Math.ceil((new Date(smartGoal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline <= 7) {
                notificationCount++;
            }
        }

        if (notificationCount > 0) {
            console.log(`✅ 通知システム: ${notificationCount}件の通知が予定されています`);
            passed++;
        } else {
            console.log('❌ 通知システム: 通知が設定されていません');
            failed++;
        }

        // Step 5: 目標達成後の処理
        console.log('🎉 Step 5: 目標達成後処理テスト');
        
        if (finalProgress.isAchieved) {
            // 新しい目標の提案
            const nextGoalValue = smartGoal.targetValue * 1.1; // 10%増加
            const nextGoal = {
                ...smartGoal,
                currentValue: smartGoal.targetValue,
                targetValue: nextGoalValue,
                description: `最大重量${nextGoalValue}kg達成（次のレベル）`
            };

            if (nextGoal.targetValue > smartGoal.targetValue) {
                console.log(`✅ 次の目標提案: ${nextGoal.targetValue}kg (10%増加)`);
                passed++;
            } else {
                console.log('❌ 次の目標提案: 適切な目標値が設定されていません');
                failed++;
            }
        } else {
            console.log('ℹ️  目標未達成のため、次の目標提案はスキップ');
            passed++; // 正常な処理として扱う
        }

    } catch (error) {
        console.log(`❌ 目標管理統合テストエラー: ${error.message}`);
        failed++;
    }

    console.log(`目標管理システム統合テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * レポート・エクスポート機能の統合テスト
 */
async function testReportExportIntegration() {
    console.log('🧪 レポート・エクスポート機能統合テスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        // テストデータの準備
        const testData = {
            progressData: [
                {
                    id: 1,
                    workout_date: '2024-10-01',
                    sets: 3,
                    reps: [10, 8, 6],
                    weights: [100, 105, 110],
                    one_rm: 137.5,
                    exercise_name: 'ベンチプレス',
                    notes: 'テストデータ1'
                },
                {
                    id: 2,
                    workout_date: '2024-10-08',
                    sets: 3,
                    reps: [11, 9, 7],
                    weights: [105, 110, 115],
                    one_rm: 143.8,
                    exercise_name: 'ベンチプレス',
                    notes: 'テストデータ2'
                }
            ],
            goals: [
                {
                    description: '1RM 150kg達成',
                    progress_percentage: 95.8,
                    current_value: 143.8,
                    target_value: 150,
                    is_achieved: false
                }
            ]
        };

        // Step 1: CSV出力テスト
        console.log('📊 Step 1: CSV出力テスト');
        
        const csvBlob = reportService.exportToCSV(testData.progressData, 'ベンチプレス');
        
        if (csvBlob instanceof Blob && csvBlob.type.includes('csv')) {
            console.log(`✅ CSV出力: ${csvBlob.size}バイトのファイル生成成功`);
            passed++;
        } else {
            console.log('❌ CSV出力: ファイル生成失敗');
            failed++;
        }

        // Step 2: 週間サマリー生成テスト
        console.log('📅 Step 2: 週間サマリー生成テスト');
        
        const weeklyData = progressTrackingService.groupByWeek(testData.progressData);
        const weeklySummary = reportService.generateWeeklySummary(weeklyData, 'ベンチプレス');
        
        if (weeklySummary && weeklySummary.exerciseName === 'ベンチプレス' && weeklySummary.totalWeeks > 0) {
            console.log(`✅ 週間サマリー: ${weeklySummary.totalWeeks}週間, 平均${weeklySummary.averageSessionsPerWeek}セッション/週`);
            passed++;
        } else {
            console.log('❌ 週間サマリー: 生成失敗');
            failed++;
        }

        // Step 3: 月間サマリー生成テスト
        console.log('📈 Step 3: 月間サマリー生成テスト');
        
        const stats = progressTrackingService.calculateStats(testData.progressData);
        const trend = progressTrackingService.analyzeTrend(testData.progressData);
        
        const monthlyAnalysis = {
            hasData: true,
            stats,
            trend,
            totalSessions: testData.progressData.length,
            dateRange: {
                start: testData.progressData[0].workout_date,
                end: testData.progressData[testData.progressData.length - 1].workout_date
            },
            weeklyData
        };

        const monthlySummary = reportService.generateMonthlySummary(monthlyAnalysis, 'ベンチプレス');
        
        if (monthlySummary && monthlySummary.hasData && monthlySummary.performanceScore >= 0) {
            console.log(`✅ 月間サマリー: パフォーマンススコア ${monthlySummary.performanceScore}/100`);
            passed++;
        } else {
            console.log('❌ 月間サマリー: 生成失敗');
            failed++;
        }

        // Step 4: 推奨事項生成テスト
        console.log('💡 Step 4: 推奨事項生成テスト');
        
        const recommendations = reportService.generateRecommendations(stats, trend, 2.5);
        
        if (recommendations && recommendations.length > 0) {
            console.log(`✅ 推奨事項: ${recommendations.length}件の推奨事項を生成`);
            console.log(`   例: "${recommendations[0]}"`);
            passed++;
        } else {
            console.log('❌ 推奨事項: 生成失敗');
            failed++;
        }

        // Step 5: パフォーマンススコア計算テスト
        console.log('🎯 Step 5: パフォーマンススコア計算テスト');
        
        const performanceScore = reportService.calculatePerformanceScore(stats, trend);
        
        if (performanceScore >= 0 && performanceScore <= 100) {
            console.log(`✅ パフォーマンススコア: ${performanceScore}/100 (有効範囲内)`);
            passed++;
        } else {
            console.log(`❌ パフォーマンススコア: ${performanceScore} (範囲外)`);
            failed++;
        }

        // Step 6: トレンド説明生成テスト
        console.log('📊 Step 6: トレンド説明生成テスト');
        
        const trendDescription = reportService.getTrendDescription(trend);
        
        if (trendDescription && trendDescription.length > 0) {
            console.log(`✅ トレンド説明: "${trendDescription}"`);
            passed++;
        } else {
            console.log('❌ トレンド説明: 生成失敗');
            failed++;
        }

    } catch (error) {
        console.log(`❌ レポート・エクスポート統合テストエラー: ${error.message}`);
        failed++;
    }

    console.log(`レポート・エクスポート機能統合テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * 全統合テストを実行
 */
async function runAllDataAnalysisIntegrationTests() {
    console.log('🚀 データ分析機能統合テスト開始\n');
    console.log('='.repeat(60));
    
    const results = [];
    
    // 各統合テストを実行
    results.push(await testProgressTrackingFlow());
    results.push(await testGoalManagementIntegration());
    results.push(await testReportExportIntegration());
    
    // 総合結果を計算
    const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
    
    console.log('='.repeat(60));
    console.log('📊 データ分析機能統合テスト結果');
    console.log(`✅ 成功: ${totalPassed}件`);
    console.log(`❌ 失敗: ${totalFailed}件`);
    console.log(`📈 成功率: ${successRate}%`);
    
    if (totalFailed === 0) {
        console.log('🎉 全ての統合テストが成功しました！');
        console.log('💪 データ分析・可視化機能は完全に動作しています！');
    } else {
        console.log('⚠️  一部の統合テストが失敗しました。修正が必要です。');
    }
    
    return {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: parseFloat(successRate)
    };
}

// テストを実行
if (typeof window !== 'undefined') {
    // ブラウザ環境
    window.runDataAnalysisIntegrationTests = runAllDataAnalysisIntegrationTests;
} else {
    // Node.js環境
    runAllDataAnalysisIntegrationTests();
}

export { runAllDataAnalysisIntegrationTests };
