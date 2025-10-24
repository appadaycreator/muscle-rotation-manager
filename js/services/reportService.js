/**
 * レポート生成サービス
 * PDFエクスポート、統計レポート生成を管理
 */

import { handleError } from '../utils/errorHandler.js';

class ReportService {
    constructor() {
        this.jsPDF = null;
        this.html2canvas = null;
        this.isLibrariesLoaded = false;
    }

    /**
     * 必要なライブラリを動的に読み込み
     */
    async loadLibraries() {
        if (this.isLibrariesLoaded) {
            return;
        }

        try {
            // jsPDFとhtml2canvasを動的に読み込み
            if (typeof window !== 'undefined') {
                // jsPDF
                if (!window.jsPDF) {
                    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                }
                this.jsPDF = window.jsPDF?.jsPDF || window.jsPDF;

                // html2canvas
                if (!window.html2canvas) {
                    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
                }
                this.html2canvas = window.html2canvas;

                this.isLibrariesLoaded = true;
            }
        } catch (error) {
            handleError(error, 'ReportService.loadLibraries');
            throw new Error('PDFライブラリの読み込みに失敗しました');
        }
    }

    /**
     * スクリプトを動的に読み込み
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 進捗レポートをPDF形式で生成
     * @param {Object} reportData - レポートデータ
     * @param {string} exerciseName - エクササイズ名
     * @returns {Promise<Blob>} PDFファイル
     */
    async generateProgressReportPDF(reportData, exerciseName) {
        try {
            await this.loadLibraries();

            if (!this.jsPDF) {
                throw new Error('jsPDFライブラリが利用できません');
            }

            const pdf = new this.jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 20;

            // フォント設定（日本語対応）
            pdf.setFont('helvetica');

            // タイトル
            pdf.setFontSize(20);
            pdf.setTextColor(60, 60, 60);
            pdf.text('プログレッシブ・オーバーロード レポート', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // エクササイズ名
            pdf.setFontSize(16);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`エクササイズ: ${exerciseName}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;

            // 期間
            if (reportData.dateRange) {
                pdf.setFontSize(12);
                pdf.text(`期間: ${reportData.dateRange.start} - ${reportData.dateRange.end}`, 20, yPosition);
                yPosition += 15;
            }

            // 統計サマリー
            if (reportData.stats) {
                pdf.setFontSize(14);
                pdf.setTextColor(50, 50, 50);
                pdf.text('パフォーマンス統計', 20, yPosition);
                yPosition += 10;

                pdf.setFontSize(10);
                pdf.setTextColor(80, 80, 80);

                const stats = [
                    `最大1RM: ${reportData.stats.maxOneRM?.toFixed(1) || 'N/A'} kg`,
                    `平均1RM: ${reportData.stats.avgOneRM?.toFixed(1) || 'N/A'} kg`,
                    `最大重量: ${reportData.stats.maxWeight?.toFixed(1) || 'N/A'} kg`,
                    `平均重量: ${reportData.stats.avgWeight?.toFixed(1) || 'N/A'} kg`,
                    `最大回数: ${reportData.stats.maxReps || 'N/A'} 回`,
                    `平均回数: ${reportData.stats.avgReps?.toFixed(1) || 'N/A'} 回`,
                    `改善率: ${reportData.stats.improvement > 0 ? '+' : ''}${reportData.stats.improvement?.toFixed(1) || 'N/A'}%`
                ];

                stats.forEach(stat => {
                    pdf.text(stat, 25, yPosition);
                    yPosition += 6;
                });

                yPosition += 10;
            }

            // トレンド分析
            if (reportData.trend) {
                pdf.setFontSize(14);
                pdf.setTextColor(50, 50, 50);
                pdf.text('トレンド分析', 20, yPosition);
                yPosition += 10;

                pdf.setFontSize(10);
                pdf.setTextColor(80, 80, 80);

                const trendText = reportData.trend.direction === 'improving' ? '向上中' :
                    reportData.trend.direction === 'declining' ? '低下中' : '安定';

                pdf.text(`傾向: ${trendText}`, 25, yPosition);
                yPosition += 6;
                pdf.text(`強度: ${reportData.trend.strength?.toFixed(2) || 'N/A'}`, 25, yPosition);
                yPosition += 15;
            }

            // 目標達成度
            if (reportData.goals && reportData.goals.length > 0) {
                pdf.setFontSize(14);
                pdf.setTextColor(50, 50, 50);
                pdf.text('目標達成度', 20, yPosition);
                yPosition += 10;

                pdf.setFontSize(10);
                pdf.setTextColor(80, 80, 80);

                reportData.goals.forEach(goal => {
                    const goalText = `${goal.description || `${goal.goal_type}目標`}: ${goal.progress_percentage?.toFixed(1) || 'N/A'}%`;
                    const statusText = goal.is_achieved ? ' (達成済み)' : '';
                    pdf.text(goalText + statusText, 25, yPosition);
                    yPosition += 6;
                });

                yPosition += 10;
            }

            // 進捗データサマリー
            if (reportData.progressData && reportData.progressData.length > 0) {
                pdf.setFontSize(14);
                pdf.setTextColor(50, 50, 50);
                pdf.text('最近のセッション', 20, yPosition);
                yPosition += 10;

                pdf.setFontSize(8);
                pdf.setTextColor(80, 80, 80);

                // テーブルヘッダー
                const headers = ['日付', '最大重量', '最大回数', '1RM', 'セット数'];
                const colWidths = [35, 25, 25, 25, 25];
                let xPosition = 20;

                headers.forEach((header, index) => {
                    pdf.text(header, xPosition, yPosition);
                    xPosition += colWidths[index];
                });
                yPosition += 8;

                // 最新10件のデータを表示
                const recentData = reportData.progressData.slice(-10);
                recentData.forEach(session => {
                    xPosition = 20;
                    const rowData = [
                        new Date(session.workout_date).toLocaleDateString('ja-JP'),
                        `${Math.max(...session.weights).toFixed(1)}kg`,
                        `${Math.max(...session.reps)}回`,
                        `${session.one_rm.toFixed(1)}kg`,
                        `${session.sets}セット`
                    ];

                    rowData.forEach((data, index) => {
                        pdf.text(data, xPosition, yPosition);
                        xPosition += colWidths[index];
                    });
                    yPosition += 6;

                    // ページ境界チェック
                    if (yPosition > pageHeight - 30) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                });
            }

            // フッター
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`生成日時: ${new Date().toLocaleString('ja-JP')}`, 20, pageHeight - 10);
            pdf.text('Muscle Rotation Manager', pageWidth - 20, pageHeight - 10, { align: 'right' });

            return pdf.output('blob');
        } catch (error) {
            handleError(error, 'ReportService.generateProgressReportPDF');
            throw error;
        }
    }

    /**
     * チャートを画像として取得してPDFに追加
     * @param {Object} pdf - jsPDFインスタンス
     * @param {string} canvasId - チャートのキャンバスID
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     */
    async addChartToPDF(pdf, canvasId, x, y, width, height) {
        try {
            await this.loadLibraries();

            if (!this.html2canvas) {
                throw new Error('html2canvasライブラリが利用できません');
            }

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const chartImage = await this.html2canvas(canvas, {
                backgroundColor: '#ffffff',
                scale: 2
            });

            const imgData = chartImage.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', x, y, width, height);
        } catch (error) {
            handleError(error, 'ReportService.addChartToPDF');
        }
    }

    /**
     * 週間サマリーレポートを生成
     * @param {Array} weeklyData - 週間データ
     * @param {string} exerciseName - エクササイズ名
     * @returns {Object} サマリーデータ
     */
    generateWeeklySummary(weeklyData, exerciseName) {
        try {
            if (!weeklyData || weeklyData.length === 0) {
                return {
                    exerciseName,
                    totalWeeks: 0,
                    averageSessionsPerWeek: 0,
                    maxWeightProgress: 0,
                    oneRMProgress: 0,
                    consistencyScore: 0
                };
            }

            const totalWeeks = weeklyData.length;
            const totalSessions = weeklyData.reduce((sum, week) => sum + week.sessions.length, 0);
            const averageSessionsPerWeek = totalSessions / totalWeeks;

            // 重量とRM進歩の計算
            const firstWeek = weeklyData[0];
            const lastWeek = weeklyData[weeklyData.length - 1];

            const maxWeightProgress = lastWeek.maxWeight > 0 && firstWeek.maxWeight > 0
                ? ((lastWeek.maxWeight - firstWeek.maxWeight) / firstWeek.maxWeight) * 100
                : 0;

            const oneRMProgress = lastWeek.maxOneRM > 0 && firstWeek.maxOneRM > 0
                ? ((lastWeek.maxOneRM - firstWeek.maxOneRM) / firstWeek.maxOneRM) * 100
                : 0;

            // 一貫性スコア（週あたりのセッション数の標準偏差から計算）
            const sessionCounts = weeklyData.map(week => week.sessions.length);
            const avgSessions = sessionCounts.reduce((sum, count) => sum + count, 0) / sessionCounts.length;
            const variance = sessionCounts.reduce((sum, count) => sum + Math.pow(count - avgSessions, 2), 0) / sessionCounts.length;
            const standardDeviation = Math.sqrt(variance);
            const consistencyScore = Math.max(0, 100 - (standardDeviation * 20)); // 0-100スケール

            return {
                exerciseName,
                totalWeeks,
                averageSessionsPerWeek: Math.round(averageSessionsPerWeek * 10) / 10,
                maxWeightProgress: Math.round(maxWeightProgress * 10) / 10,
                oneRMProgress: Math.round(oneRMProgress * 10) / 10,
                consistencyScore: Math.round(consistencyScore * 10) / 10,
                weeklyData
            };
        } catch (error) {
            handleError(error, 'ReportService.generateWeeklySummary');
            return null;
        }
    }

    /**
     * 月間サマリーレポートを生成
     * @param {Object} monthlyAnalysis - 月間分析データ
     * @param {string} exerciseName - エクササイズ名
     * @returns {Object} 月間サマリー
     */
    generateMonthlySummary(monthlyAnalysis, exerciseName) {
        try {
            if (!monthlyAnalysis || !monthlyAnalysis.hasData) {
                return {
                    exerciseName,
                    hasData: false,
                    message: 'データが不足しています'
                };
            }

            const { stats, trend, totalSessions, dateRange, weeklyData } = monthlyAnalysis;

            // 週間一貫性の計算
            const weeklySessionCounts = weeklyData.map(week => week.sessions.length);
            const avgWeeklySessions = weeklySessionCounts.reduce((sum, count) => sum + count, 0) / weeklySessionCounts.length;

            // パフォーマンス評価
            const performanceScore = this.calculatePerformanceScore(stats, trend);

            return {
                exerciseName,
                hasData: true,
                period: `${dateRange.start} - ${dateRange.end}`,
                totalSessions,
                avgWeeklySessions: Math.round(avgWeeklySessions * 10) / 10,
                performanceScore,
                stats: {
                    ...stats,
                    improvement: Math.round(stats.improvement * 10) / 10
                },
                trend: {
                    ...trend,
                    description: this.getTrendDescription(trend)
                },
                recommendations: this.generateRecommendations(stats, trend, avgWeeklySessions)
            };
        } catch (error) {
            handleError(error, 'ReportService.generateMonthlySummary');
            return null;
        }
    }

    /**
     * パフォーマンススコアを計算
     * @param {Object} stats - 統計データ
     * @param {Object} trend - トレンドデータ
     * @returns {number} パフォーマンススコア (0-100)
     */
    calculatePerformanceScore(stats, trend) {
        try {
            let score = 50; // ベーススコア

            // 改善率によるスコア調整
            if (stats.improvement > 10) {
                score += 30;
            } else if (stats.improvement > 5) {
                score += 20;
            } else if (stats.improvement > 0) {
                score += 10;
            } else if (stats.improvement < -5) {
                score -= 20;
            }

            // トレンドによるスコア調整
            if (trend.direction === 'improving') {
                score += 20;
            } else if (trend.direction === 'declining') {
                score -= 15;
            }

            return Math.max(0, Math.min(100, Math.round(score)));
        } catch (error) {
            handleError(error, 'ReportService.calculatePerformanceScore');
            return 50;
        }
    }

    /**
     * トレンドの説明文を生成
     * @param {Object} trend - トレンドデータ
     * @returns {string} 説明文
     */
    getTrendDescription(trend) {
        switch (trend.direction) {
            case 'improving':
                return `パフォーマンスが向上しています（強度: ${trend.strength}）`;
            case 'declining':
                return `パフォーマンスが低下傾向にあります（強度: ${trend.strength}）`;
            case 'stable':
                return 'パフォーマンスは安定しています';
            default:
                return 'データが不足しています';
        }
    }

    /**
     * 推奨事項を生成
     * @param {Object} stats - 統計データ
     * @param {Object} trend - トレンドデータ
     * @param {number} avgWeeklySessions - 週平均セッション数
     * @returns {Array} 推奨事項リスト
     */
    generateRecommendations(stats, trend, avgWeeklySessions) {
        const recommendations = [];

        try {
            // 頻度に関する推奨
            if (avgWeeklySessions < 1) {
                recommendations.push('トレーニング頻度を増やすことを検討してください（週2-3回が理想的）');
            } else if (avgWeeklySessions > 4) {
                recommendations.push('オーバートレーニングに注意し、適切な休息を取ってください');
            }

            // パフォーマンストレンドに関する推奨
            if (trend.direction === 'declining') {
                recommendations.push('パフォーマンスが低下しています。休息期間を設けるか、トレーニング強度を見直してください');
                recommendations.push('フォームの確認や、栄養・睡眠の改善を検討してください');
            } else if (trend.direction === 'stable' && stats.improvement < 2) {
                recommendations.push('プログレッシブ・オーバーロードの原則に従い、重量や回数を段階的に増やしてください');
                recommendations.push('新しいエクササイズバリエーションを試してみてください');
            }

            // 改善率に関する推奨
            if (stats.improvement > 15) {
                recommendations.push('素晴らしい進歩です！現在のトレーニングプログラムを継続してください');
            } else if (stats.improvement < 0) {
                recommendations.push('パフォーマンスが低下しています。トレーニングプログラムの見直しを検討してください');
            }

            // 一般的な推奨事項
            if (recommendations.length === 0) {
                recommendations.push('現在のトレーニングを継続し、定期的に進捗を確認してください');
                recommendations.push('目標設定を行い、モチベーションを維持してください');
            }

            return recommendations;
        } catch (error) {
            handleError(error, 'ReportService.generateRecommendations');
            return ['データの分析中にエラーが発生しました'];
        }
    }

    /**
     * データをCSV形式でエクスポート
     * @param {Array} progressData - 進捗データ
     * @param {string} exerciseName - エクササイズ名
     * @returns {Blob} CSVファイル
     */
    exportToCSV(progressData, exerciseName) {
        try {
            if (!progressData || progressData.length === 0) {
                throw new Error('エクスポートするデータがありません');
            }

            const headers = ['日付', 'エクササイズ', 'セット数', '重量(kg)', '回数', '1RM(kg)', 'メモ'];
            const csvContent = [headers.join(',')];

            progressData.forEach(session => {
                const weights = session.weights.join(';');
                const reps = session.reps.join(';');
                const row = [
                    session.workout_date,
                    exerciseName,
                    session.sets,
                    weights,
                    reps,
                    session.one_rm.toFixed(1),
                    session.notes || ''
                ];
                csvContent.push(row.map(field => `"${field}"`).join(','));
            });

            const csvString = csvContent.join('\n');
            return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        } catch (error) {
            handleError(error, 'ReportService.exportToCSV');
            throw error;
        }
    }

    /**
     * ファイルをダウンロード
     * @param {Blob} blob - ファイルデータ
     * @param {string} filename - ファイル名
     */
    downloadFile(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            handleError(error, 'ReportService.downloadFile');
            throw error;
        }
    }

    /**
     * ワークアウトレポートをPDF形式で生成
     * @param {Object} workoutData - ワークアウトデータ
     * @returns {Promise<Blob>} PDFファイル
     */
    async generateWorkoutReportPDF(workoutData) {
        try {
            await this.loadLibraries();

            if (!this.jsPDF) {
                throw new Error('jsPDFライブラリが利用できません');
            }

            const pdf = new this.jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 20;

            // フォント設定
            pdf.setFont('helvetica');

            // タイトル
            pdf.setFontSize(20);
            pdf.setTextColor(60, 60, 60);
            pdf.text('ワークアウトレポート', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // 日付
            if (workoutData.date) {
                pdf.setFontSize(12);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`日付: ${workoutData.date}`, 20, yPosition);
                yPosition += 15;
            }

            // エクササイズ一覧
            if (workoutData.exercises && workoutData.exercises.length > 0) {
                pdf.setFontSize(14);
                pdf.setTextColor(50, 50, 50);
                pdf.text('エクササイズ', 20, yPosition);
                yPosition += 10;

                pdf.setFontSize(10);
                pdf.setTextColor(80, 80, 80);

                workoutData.exercises.forEach(exercise => {
                    pdf.text(`• ${exercise.name}`, 25, yPosition);
                    yPosition += 6;
                    if (exercise.sets && exercise.reps && exercise.weight) {
                        pdf.text(`  セット: ${exercise.sets}, 回数: ${exercise.reps}, 重量: ${exercise.weight}kg`, 30, yPosition);
                        yPosition += 6;
                    }
                    yPosition += 5;
                });
            }

            // フッター
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`生成日時: ${new Date().toLocaleString('ja-JP')}`, 20, pageHeight - 10);
            pdf.text('Muscle Rotation Manager', pageWidth - 20, pageHeight - 10, { align: 'right' });

            return pdf.output('blob');
        } catch (error) {
            handleError(error, 'ReportService.generateWorkoutReportPDF');
            throw error;
        }
    }

    /**
     * 統計レポートをPDF形式で生成
     * @param {Object} statisticsData - 統計データ
     * @returns {Promise<Blob>} PDFファイル
     */
    async generateStatisticsReportPDF(statisticsData) {
        try {
            await this.loadLibraries();

            if (!this.jsPDF) {
                throw new Error('jsPDFライブラリが利用できません');
            }

            const pdf = new this.jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 20;

            // フォント設定
            pdf.setFont('helvetica');

            // タイトル
            pdf.setFontSize(20);
            pdf.setTextColor(60, 60, 60);
            pdf.text('統計レポート', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // 統計データ
            if (statisticsData) {
                pdf.setFontSize(14);
                pdf.setTextColor(50, 50, 50);
                pdf.text('統計サマリー', 20, yPosition);
                yPosition += 10;

                pdf.setFontSize(10);
                pdf.setTextColor(80, 80, 80);

                const stats = [
                    `総ワークアウト数: ${statisticsData.totalWorkouts || 'N/A'}`,
                    `平均重量: ${statisticsData.averageWeight || 'N/A'} kg`,
                    `対象筋群: ${statisticsData.muscleGroups ? statisticsData.muscleGroups.join(', ') : 'N/A'}`
                ];

                stats.forEach(stat => {
                    pdf.text(stat, 25, yPosition);
                    yPosition += 6;
                });
            }

            // フッター
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`生成日時: ${new Date().toLocaleString('ja-JP')}`, 20, pageHeight - 10);
            pdf.text('Muscle Rotation Manager', pageWidth - 20, pageHeight - 10, { align: 'right' });

            return pdf.output('blob');
        } catch (error) {
            handleError(error, 'ReportService.generateStatisticsReportPDF');
            throw error;
        }
    }

    /**
     * 要素をPDFとしてエクスポート
     * @param {HTMLElement} element - エクスポートする要素
     * @param {string} filename - ファイル名
     * @returns {Promise<void>}
     */
    async exportToPDF(element, filename) {
        try {
            await this.loadLibraries();

            if (!this.html2canvas || !this.jsPDF) {
                throw new Error('必要なライブラリが利用できません');
            }

            // 要素をキャンバスに変換
            const canvas = await this.html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2
            });

            // PDFを作成
            const pdf = new this.jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4幅
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(filename);
        } catch (error) {
            handleError(error, 'ReportService.exportToPDF');
            throw error;
        }
    }
}

// シングルトンインスタンスをエクスポート
export const reportService = new ReportService();
