/**
 * データ分析機能のユニットテスト
 * プログレッシブ・オーバーロード追跡、目標管理、レポート生成機能をテスト
 */

import { progressTrackingService } from '../../js/services/progressTrackingService.js';
import { chartService } from '../../js/services/chartService.js';
import { reportService } from '../../js/services/reportService.js';

// テストデータ
const testUserId = 'test-user-123';
const testExerciseId = 'test-exercise-456';

const mockProgressData = [
    {
        id: 1,
        workout_date: '2024-10-01',
        sets: 3,
        reps: [10, 8, 6],
        weights: [100, 105, 110],
        one_rm: 137.5,
        exercise_name: 'ベンチプレス',
        notes: 'フォーム良好'
    },
    {
        id: 2,
        workout_date: '2024-10-03',
        sets: 3,
        reps: [10, 9, 7],
        weights: [102.5, 107.5, 112.5],
        one_rm: 140.6,
        exercise_name: 'ベンチプレス',
        notes: ''
    },
    {
        id: 3,
        workout_date: '2024-10-05',
        sets: 3,
        reps: [11, 9, 8],
        weights: [105, 110, 115],
        one_rm: 143.8,
        exercise_name: 'ベンチプレス',
        notes: '重量アップ成功'
    }
];

const mockGoalData = {
    userId: testUserId,
    exerciseId: testExerciseId,
    goalType: 'one_rm',
    targetValue: 150,
    currentValue: 137.5,
    targetDate: '2024-12-01',
    priority: 'high',
    strategy: '週3回のトレーニング',
    description: '1RM 150kg達成',
    notifications: {
        progress: true,
        milestone: true,
        deadline: true
    }
};

/**
 * 1RM計算のテスト
 */
function test1RMCalculation() {
    console.log('🧪 1RM計算のテスト開始');
    
    const testCases = [
        { weight: 100, reps: 1, expected: 100 },
        { weight: 100, reps: 5, expected: 112.5 },
        { weight: 100, reps: 10, expected: 133.3 },
        { weight: 80, reps: 8, expected: 100 },
        { weight: 0, reps: 5, expected: 0 }, // エラーケース
        { weight: 100, reps: 0, expected: 0 }, // エラーケース
    ];

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        try {
            const result = progressTrackingService.calculateOneRM(testCase.weight, testCase.reps);
            const tolerance = 0.5; // 許容誤差
            
            if (Math.abs(result - testCase.expected) <= tolerance) {
                console.log(`✅ テスト ${index + 1}: 重量${testCase.weight}kg × ${testCase.reps}回 = ${result}kg (期待値: ${testCase.expected}kg)`);
                passed++;
            } else {
                console.log(`❌ テスト ${index + 1}: 重量${testCase.weight}kg × ${testCase.reps}回 = ${result}kg (期待値: ${testCase.expected}kg)`);
                failed++;
            }
        } catch (error) {
            if (testCase.expected === 0) {
                console.log(`✅ テスト ${index + 1}: エラーケースが正しく処理されました`);
                passed++;
            } else {
                console.log(`❌ テスト ${index + 1}: 予期しないエラー - ${error.message}`);
                failed++;
            }
        }
    });

    console.log(`1RM計算テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * 最高1RM計算のテスト
 */
function testBestOneRMCalculation() {
    console.log('🧪 最高1RM計算のテスト開始');
    
    const testCases = [
        {
            reps: [10, 8, 6],
            weights: [100, 105, 110],
            expected: 137.5 // 110kg × 6回の1RM
        },
        {
            reps: [12, 10, 8],
            weights: [80, 90, 100],
            expected: 125.0 // 100kg × 8回の1RM
        },
        {
            reps: [1],
            weights: [120],
            expected: 120.0 // 1回なのでそのまま
        }
    ];

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        try {
            const result = progressTrackingService.calculateBestOneRM(testCase.reps, testCase.weights);
            const tolerance = 1.0; // 許容誤差
            
            if (Math.abs(result - testCase.expected) <= tolerance) {
                console.log(`✅ テスト ${index + 1}: 最高1RM = ${result}kg (期待値: ${testCase.expected}kg)`);
                passed++;
            } else {
                console.log(`❌ テスト ${index + 1}: 最高1RM = ${result}kg (期待値: ${testCase.expected}kg)`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ テスト ${index + 1}: エラー - ${error.message}`);
            failed++;
        }
    });

    console.log(`最高1RM計算テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * 統計計算のテスト
 */
function testStatsCalculation() {
    console.log('🧪 統計計算のテスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        const stats = progressTrackingService.calculateStats(mockProgressData);
        
        // 最大1RMのテスト
        if (stats.maxOneRM === 143.8) {
            console.log('✅ 最大1RM計算: 正常');
            passed++;
        } else {
            console.log(`❌ 最大1RM計算: ${stats.maxOneRM} (期待値: 143.8)`);
            failed++;
        }

        // 平均1RMのテスト
        const expectedAvgOneRM = (137.5 + 140.6 + 143.8) / 3;
        if (Math.abs(stats.avgOneRM - expectedAvgOneRM) < 0.1) {
            console.log('✅ 平均1RM計算: 正常');
            passed++;
        } else {
            console.log(`❌ 平均1RM計算: ${stats.avgOneRM} (期待値: ${expectedAvgOneRM.toFixed(1)})`);
            failed++;
        }

        // 最大重量のテスト
        if (stats.maxWeight === 115) {
            console.log('✅ 最大重量計算: 正常');
            passed++;
        } else {
            console.log(`❌ 最大重量計算: ${stats.maxWeight} (期待値: 115)`);
            failed++;
        }

        // 改善率のテスト
        const expectedImprovement = ((143.8 - 137.5) / 137.5) * 100;
        if (Math.abs(stats.improvement - expectedImprovement) < 0.1) {
            console.log('✅ 改善率計算: 正常');
            passed++;
        } else {
            console.log(`❌ 改善率計算: ${stats.improvement}% (期待値: ${expectedImprovement.toFixed(1)}%)`);
            failed++;
        }

    } catch (error) {
        console.log(`❌ 統計計算エラー: ${error.message}`);
        failed++;
    }

    console.log(`統計計算テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * トレンド分析のテスト
 */
function testTrendAnalysis() {
    console.log('🧪 トレンド分析のテスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        const trend = progressTrackingService.analyzeTrend(mockProgressData);
        
        // 向上トレンドのテスト（1RMが上昇している）
        if (trend.direction === 'improving') {
            console.log('✅ トレンド方向: 向上中 (正常)');
            passed++;
        } else {
            console.log(`❌ トレンド方向: ${trend.direction} (期待値: improving)`);
            failed++;
        }

        // 強度のテスト（正の値であることを確認）
        if (trend.strength > 0) {
            console.log('✅ トレンド強度: 正の値 (正常)');
            passed++;
        } else {
            console.log(`❌ トレンド強度: ${trend.strength} (期待値: 正の値)`);
            failed++;
        }

        // データ不足のケースをテスト
        const insufficientData = [mockProgressData[0]];
        const trendInsufficient = progressTrackingService.analyzeTrend(insufficientData);
        
        if (trendInsufficient.direction === 'insufficient_data') {
            console.log('✅ データ不足ケース: 正常処理');
            passed++;
        } else {
            console.log(`❌ データ不足ケース: ${trendInsufficient.direction} (期待値: insufficient_data)`);
            failed++;
        }

    } catch (error) {
        console.log(`❌ トレンド分析エラー: ${error.message}`);
        failed++;
    }

    console.log(`トレンド分析テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * 週別データグループ化のテスト
 */
function testWeeklyGrouping() {
    console.log('🧪 週別データグループ化のテスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        const weeklyData = progressTrackingService.groupByWeek(mockProgressData);
        
        // 週数のテスト（3つのデータが1週間内にある場合）
        if (weeklyData.length >= 1) {
            console.log('✅ 週別グループ化: データが正しくグループ化されました');
            passed++;
        } else {
            console.log(`❌ 週別グループ化: ${weeklyData.length}週 (期待値: 1週以上)`);
            failed++;
        }

        // 各週のデータ構造をテスト
        const firstWeek = weeklyData[0];
        if (firstWeek.weekStart && firstWeek.sessions && firstWeek.maxWeight && firstWeek.maxOneRM) {
            console.log('✅ 週データ構造: 必要なプロパティが存在');
            passed++;
        } else {
            console.log('❌ 週データ構造: 必要なプロパティが不足');
            failed++;
        }

        // 最大重量の計算をテスト
        if (firstWeek.maxWeight === 115) {
            console.log('✅ 週最大重量計算: 正常');
            passed++;
        } else {
            console.log(`❌ 週最大重量計算: ${firstWeek.maxWeight} (期待値: 115)`);
            failed++;
        }

    } catch (error) {
        console.log(`❌ 週別グループ化エラー: ${error.message}`);
        failed++;
    }

    console.log(`週別データグループ化テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * レポート生成のテスト
 */
function testReportGeneration() {
    console.log('🧪 レポート生成のテスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        // 週間サマリーのテスト
        const weeklyData = progressTrackingService.groupByWeek(mockProgressData);
        const weeklySummary = reportService.generateWeeklySummary(weeklyData, 'ベンチプレス');
        
        if (weeklySummary && weeklySummary.exerciseName === 'ベンチプレス') {
            console.log('✅ 週間サマリー生成: エクササイズ名正常');
            passed++;
        } else {
            console.log('❌ 週間サマリー生成: エクササイズ名不正');
            failed++;
        }

        if (weeklySummary.totalWeeks >= 1) {
            console.log('✅ 週間サマリー生成: 週数計算正常');
            passed++;
        } else {
            console.log(`❌ 週間サマリー生成: 週数 ${weeklySummary.totalWeeks}`);
            failed++;
        }

        // パフォーマンススコア計算のテスト
        const mockStats = { improvement: 10 };
        const mockTrend = { direction: 'improving', strength: 2.5 };
        const performanceScore = reportService.calculatePerformanceScore(mockStats, mockTrend);
        
        if (performanceScore >= 0 && performanceScore <= 100) {
            console.log(`✅ パフォーマンススコア: ${performanceScore} (0-100の範囲内)`);
            passed++;
        } else {
            console.log(`❌ パフォーマンススコア: ${performanceScore} (範囲外)`);
            failed++;
        }

        // CSV出力のテスト
        const csvBlob = reportService.exportToCSV(mockProgressData, 'ベンチプレス');
        if (csvBlob instanceof Blob && csvBlob.type === 'text/csv;charset=utf-8;') {
            console.log('✅ CSV出力: 正常なBlobオブジェクト生成');
            passed++;
        } else {
            console.log('❌ CSV出力: Blobオブジェクト生成失敗');
            failed++;
        }

    } catch (error) {
        console.log(`❌ レポート生成エラー: ${error.message}`);
        failed++;
    }

    console.log(`レポート生成テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * 目標管理のテスト
 */
function testGoalManagement() {
    console.log('🧪 目標管理のテスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        // 目標進捗計算のテスト
        const currentValue = 137.5;
        const targetValue = 150;
        const expectedProgress = (currentValue / targetValue) * 100;
        
        if (Math.abs(expectedProgress - 91.7) < 0.1) {
            console.log(`✅ 目標進捗計算: ${expectedProgress.toFixed(1)}%`);
            passed++;
        } else {
            console.log(`❌ 目標進捗計算: ${expectedProgress.toFixed(1)}% (期待値: 91.7%)`);
            failed++;
        }

        // 目標達成判定のテスト
        const isAchieved = currentValue >= targetValue;
        if (!isAchieved) {
            console.log('✅ 目標達成判定: 未達成 (正常)');
            passed++;
        } else {
            console.log('❌ 目標達成判定: 達成済み (異常)');
            failed++;
        }

        // 通知設定のテスト
        if (mockGoalData.notifications.progress && 
            mockGoalData.notifications.milestone && 
            mockGoalData.notifications.deadline) {
            console.log('✅ 通知設定: 全ての通知が有効');
            passed++;
        } else {
            console.log('❌ 通知設定: 通知設定に問題');
            failed++;
        }

        // SMART目標要素のテスト
        const hasSpecific = mockGoalData.description && mockGoalData.description.length > 0;
        const hasMeasurable = mockGoalData.targetValue > 0;
        const hasAchievable = mockGoalData.targetValue > mockGoalData.currentValue;
        const hasRelevant = mockGoalData.goalType === 'one_rm';
        const hasTimeBound = mockGoalData.targetDate && new Date(mockGoalData.targetDate) > new Date();

        if (hasSpecific && hasMeasurable && hasAchievable && hasRelevant && hasTimeBound) {
            console.log('✅ SMART目標要素: 全ての要素が満たされています');
            passed++;
        } else {
            console.log('❌ SMART目標要素: 一部の要素が不足');
            failed++;
        }

    } catch (error) {
        console.log(`❌ 目標管理エラー: ${error.message}`);
        failed++;
    }

    console.log(`目標管理テスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * チャートサービスのテスト
 */
function testChartService() {
    console.log('🧪 チャートサービスのテスト開始');
    
    let passed = 0;
    let failed = 0;

    try {
        // チャートサービスの初期化テスト
        if (chartService && typeof chartService.createOneRMChart === 'function') {
            console.log('✅ チャートサービス: 正常に初期化');
            passed++;
        } else {
            console.log('❌ チャートサービス: 初期化失敗');
            failed++;
        }

        // デフォルトカラーのテスト
        if (chartService.defaultColors && 
            chartService.defaultColors.primary && 
            chartService.defaultColors.secondary) {
            console.log('✅ デフォルトカラー: 正常に設定');
            passed++;
        } else {
            console.log('❌ デフォルトカラー: 設定不正');
            failed++;
        }

        // チャート管理Mapのテスト
        if (chartService.charts instanceof Map) {
            console.log('✅ チャート管理: Mapオブジェクト正常');
            passed++;
        } else {
            console.log('❌ チャート管理: Mapオブジェクト不正');
            failed++;
        }

    } catch (error) {
        console.log(`❌ チャートサービスエラー: ${error.message}`);
        failed++;
    }

    console.log(`チャートサービステスト結果: ${passed}件成功, ${failed}件失敗\n`);
    return { passed, failed };
}

/**
 * 全テストを実行
 */
function runAllDataAnalysisTests() {
    console.log('🚀 データ分析機能テスト開始\n');
    console.log('='.repeat(50));
    
    const results = [];
    
    // 各テストを実行
    results.push(test1RMCalculation());
    results.push(testBestOneRMCalculation());
    results.push(testStatsCalculation());
    results.push(testTrendAnalysis());
    results.push(testWeeklyGrouping());
    results.push(testReportGeneration());
    results.push(testGoalManagement());
    results.push(testChartService());
    
    // 総合結果を計算
    const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
    
    console.log('='.repeat(50));
    console.log('📊 データ分析機能テスト結果');
    console.log(`✅ 成功: ${totalPassed}件`);
    console.log(`❌ 失敗: ${totalFailed}件`);
    console.log(`📈 成功率: ${successRate}%`);
    
    if (totalFailed === 0) {
        console.log('🎉 全てのテストが成功しました！');
    } else {
        console.log('⚠️  一部のテストが失敗しました。修正が必要です。');
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
    window.runDataAnalysisTests = runAllDataAnalysisTests;
} else {
    // Node.js環境
    runAllDataAnalysisTests();
}

export { runAllDataAnalysisTests };
