/**
 * チャートサービス
 * Chart.jsを使用した進捗グラフの生成・管理を行う
 */

import { handleError } from '../utils/errorHandler.js';

class ChartService {
    constructor() {
        this.charts = new Map(); // アクティブなチャートインスタンスを管理
        this.defaultColors = {
            primary: '#3B82F6',
            secondary: '#10B981',
            accent: '#F59E0B',
            danger: '#EF4444',
            success: '#22C55E',
            warning: '#F97316'
        };
    }

    /**
   * 既存のチャートを破棄
   * @param {string} chartId - チャートID
   */
    destroyChart(chartId) {
        try {
            if (this.charts.has(chartId)) {
                this.charts.get(chartId).destroy();
                this.charts.delete(chartId);
            }
        } catch (error) {
            handleError(error, { context: 'ChartService.destroyChart' });
        }
    }

    /**
   * 1RM推移グラフを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} data - 進捗データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createOneRMChart(canvasId, data, options = {}) {
        try {
            // 既存のチャートを破棄
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const ctx = canvas.getContext('2d');

            // データの準備
            const labels = data.map((d) =>
                new Date(d.workout_date).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric'
                })
            );
            const oneRMValues = data.map((d) => d.one_rm);

            const chartConfig = {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: '1RM (kg)',
                            data: oneRMValues,
                            borderColor: options.color || this.defaultColors.primary,
                            backgroundColor: `${options.color || this.defaultColors.primary}20`,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointBackgroundColor: options.color || this.defaultColors.primary,
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || '1RM推移',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#374151'
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: options.color || this.defaultColors.primary,
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                title(context) {
                                    return `日付: ${context[0].label}`;
                                },
                                label(context) {
                                    return `1RM: ${context.parsed.y.toFixed(1)} kg`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: '日付',
                                color: '#6B7280',
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#6B7280',
                                maxTicksLimit: 8
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: '1RM (kg)',
                                color: '#6B7280',
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: '#E5E7EB',
                                borderDash: [2, 2]
                            },
                            ticks: {
                                color: '#6B7280',
                                callback(value) {
                                    return `${value.toFixed(1)} kg`;
                                }
                            },
                            beginAtZero: false
                        }
                    },
                    elements: {
                        point: {
                            hoverBackgroundColor: '#ffffff'
                        }
                    }
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);

            return chart;
        } catch (error) {
            handleError(error, { context: 'ChartService.createOneRMChart' });
            return null;
        }
    }

    /**
   * 重量推移グラフを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} data - 進捗データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createWeightChart(canvasId, data, options = {}) {
        try {
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const ctx = canvas.getContext('2d');

            // データの準備
            const labels = data.map((d) =>
                new Date(d.workout_date).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric'
                })
            );
            const maxWeights = data.map((d) => Math.max(...d.weights));
            const avgWeights = data.map(
                (d) => d.weights.reduce((sum, w) => sum + w, 0) / d.weights.length
            );

            const chartConfig = {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: '最大重量',
                            data: maxWeights,
                            borderColor: this.defaultColors.primary,
                            backgroundColor: `${this.defaultColors.primary}20`,
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: '平均重量',
                            data: avgWeights,
                            borderColor: this.defaultColors.secondary,
                            backgroundColor: `${this.defaultColors.secondary}20`,
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || '重量推移',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#374151'
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                color: '#374151'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: this.defaultColors.primary,
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                title(context) {
                                    return `日付: ${context[0].label}`;
                                },
                                label(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kg`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: '日付',
                                color: '#6B7280'
                            },
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#6B7280',
                                maxTicksLimit: 8
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: '重量 (kg)',
                                color: '#6B7280'
                            },
                            grid: {
                                color: '#E5E7EB',
                                borderDash: [2, 2]
                            },
                            ticks: {
                                color: '#6B7280',
                                callback(value) {
                                    return `${value.toFixed(1)} kg`;
                                }
                            },
                            beginAtZero: false
                        }
                    }
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);

            return chart;
        } catch (error) {
            handleError(error, { context: 'ChartService.createWeightChart' });
            return null;
        }
    }

    /**
   * ボリューム推移グラフを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} data - 進捗データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createVolumeChart(canvasId, data, options = {}) {
        try {
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const ctx = canvas.getContext('2d');

            // ボリューム計算（重量 × 回数の合計）
            const labels = data.map((d) =>
                new Date(d.workout_date).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric'
                })
            );
            const volumes = data.map((d) => {
                return d.weights.reduce((sum, weight, index) => {
                    return sum + weight * d.reps[index];
                }, 0);
            });

            const chartConfig = {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'トレーニングボリューム',
                            data: volumes,
                            backgroundColor: `${options.color || this.defaultColors.accent}80`,
                            borderColor: options.color || this.defaultColors.accent,
                            borderWidth: 1,
                            borderRadius: 4,
                            borderSkipped: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || 'トレーニングボリューム推移',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#374151'
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: options.color || this.defaultColors.accent,
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                title(context) {
                                    return `日付: ${context[0].label}`;
                                },
                                label(context) {
                                    return `ボリューム: ${context.parsed.y.toFixed(0)} kg`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: '日付',
                                color: '#6B7280'
                            },
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#6B7280',
                                maxTicksLimit: 8
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'ボリューム (kg)',
                                color: '#6B7280'
                            },
                            grid: {
                                color: '#E5E7EB',
                                borderDash: [2, 2]
                            },
                            ticks: {
                                color: '#6B7280',
                                callback(value) {
                                    return `${value.toFixed(0)} kg`;
                                }
                            },
                            beginAtZero: true
                        }
                    }
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);

            return chart;
        } catch (error) {
            handleError(error, { context: 'ChartService.createVolumeChart' });
            return null;
        }
    }

    /**
   * 目標達成度グラフを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} goalsData - 目標データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createGoalProgressChart(canvasId, goalsData, options = {}) {
        try {
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const ctx = canvas.getContext('2d');

            const labels = goalsData.map(
                (g) => g.description || `${g.goal_type}目標`
            );
            const progressValues = goalsData.map((g) => g.progress_percentage);
            const colors = goalsData.map((g) =>
                g.progress_percentage >= 100
                    ? this.defaultColors.success
                    : g.progress_percentage >= 75
                        ? this.defaultColors.warning
                        : this.defaultColors.primary
            );

            const chartConfig = {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [
                        {
                            data: progressValues,
                            backgroundColor: colors.map((c) => `${c}80`),
                            borderColor: colors,
                            borderWidth: 2,
                            hoverBackgroundColor: colors,
                            hoverBorderWidth: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || '目標達成度',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#374151'
                        },
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                color: '#374151'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label(context) {
                                    return `${context.label}: ${context.parsed.toFixed(1)}%`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);

            return chart;
        } catch (error) {
            handleError(error, { context: 'ChartService.createGoalProgressChart' });
            return null;
        }
    }

    /**
   * 週間比較グラフを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} weeklyData - 週間データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createWeeklyComparisonChart(canvasId, weeklyData, options = {}) {
        try {
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const ctx = canvas.getContext('2d');

            const labels = weeklyData.map((w) => {
                const date = new Date(w.weekStart);
                return `${date.getMonth() + 1}/${date.getDate()}週`;
            });

            const chartConfig = {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: '最大重量',
                            data: weeklyData.map((w) => w.maxWeight),
                            backgroundColor: `${this.defaultColors.primary}80`,
                            borderColor: this.defaultColors.primary,
                            borderWidth: 1
                        },
                        {
                            label: '最大1RM',
                            data: weeklyData.map((w) => w.maxOneRM),
                            backgroundColor: `${this.defaultColors.secondary}80`,
                            borderColor: this.defaultColors.secondary,
                            borderWidth: 1
                        },
                        {
                            label: 'セッション数',
                            data: weeklyData.map((w) => w.sessions.length),
                            backgroundColor: `${this.defaultColors.accent}80`,
                            borderColor: this.defaultColors.accent,
                            borderWidth: 1,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || '週間パフォーマンス比較',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#374151'
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                color: '#374151'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderWidth: 1,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: '週',
                                color: '#6B7280'
                            },
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#6B7280'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: '重量 (kg)',
                                color: '#6B7280'
                            },
                            grid: {
                                color: '#E5E7EB',
                                borderDash: [2, 2]
                            },
                            ticks: {
                                color: '#6B7280'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'セッション数',
                                color: '#6B7280'
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: {
                                color: '#6B7280'
                            }
                        }
                    }
                }
            };

            const chart = new Chart(ctx, chartConfig);
            this.charts.set(canvasId, chart);

            return chart;
        } catch (error) {
            handleError(error, {
                context: 'ChartService.createWeeklyComparisonChart'
            });
            return null;
        }
    }

    /**
   * すべてのチャートを破棄
   */
    destroyAllCharts() {
        try {
            this.charts.forEach((chart) => {
                chart.destroy();
            });
            this.charts.clear();
        } catch (error) {
            handleError(error, { context: 'ChartService.destroyAllCharts' });
        }
    }

    /**
   * チャートのリサイズ
   * @param {string} chartId - チャートID
   */
    resizeChart(chartId) {
        try {
            if (this.charts.has(chartId)) {
                this.charts.get(chartId).resize();
            }
        } catch (error) {
            handleError(error, { context: 'ChartService.resizeChart' });
        }
    }

    /**
   * 進捗チャートを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} data - 進捗データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createProgressChart(canvasId, data, options = {}) {
        try {
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: data.map((item) => item.date),
                    datasets: [
                        {
                            label: '進捗',
                            data: data.map((item) => item.value),
                            borderColor: this.defaultColors.primary,
                            backgroundColor: `${this.defaultColors.primary}20`,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...options
                }
            });

            this.charts.set(canvasId, chart);
            return chart;
        } catch (error) {
            handleError(error, { context: 'ChartService.createProgressChart' });
            return null;
        }
    }

    /**
   * 筋肉部位チャートを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} data - 筋肉部位データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createMuscleGroupChart(canvasId, data, options = {}) {
        try {
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const chart = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: data.map((item) => item.name),
                    datasets: [
                        {
                            data: data.map((item) => item.value),
                            backgroundColor: [
                                this.defaultColors.primary,
                                this.defaultColors.secondary,
                                this.defaultColors.accent,
                                this.defaultColors.danger,
                                this.defaultColors.success,
                                this.defaultColors.warning
                            ]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...options
                }
            });

            this.charts.set(canvasId, chart);
            return chart;
        } catch (error) {
            handleError(error, { context: 'ChartService.createMuscleGroupChart' });
            return null;
        }
    }

    /**
   * 頻度チャートを作成
   * @param {string} canvasId - キャンバス要素のID
   * @param {Array} data - 頻度データ
   * @param {Object} options - オプション設定
   * @returns {Object} チャートインスタンス
   */
    createFrequencyChart(canvasId, data, options = {}) {
        try {
            this.destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }

            const chart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: data.map((item) => item.name),
                    datasets: [
                        {
                            label: '頻度',
                            data: data.map((item) => item.value),
                            backgroundColor: this.defaultColors.primary,
                            borderColor: this.defaultColors.primary,
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    ...options
                }
            });

            this.charts.set(canvasId, chart);
            return chart;
        } catch (error) {
            handleError(error, { context: 'ChartService.createFrequencyChart' });
            return null;
        }
    }

    /**
   * チャートを更新
   * @param {string} chartId - チャートID
   * @param {Object} newData - 新しいデータ
   */
    updateChart(chartId, newData) {
        try {
            if (this.charts.has(chartId)) {
                const chart = this.charts.get(chartId);
                chart.data = newData;
                chart.update();
            }
        } catch (error) {
            handleError(error, { context: 'ChartService.updateChart' });
        }
    }

    /**
   * チャートを取得
   * @param {string} chartId - チャートID
   * @returns {Object|null} チャートインスタンス
   */
    getChart(chartId) {
        try {
            return this.charts.get(chartId) || null;
        } catch (error) {
            handleError(error, { context: 'ChartService.getChart' });
            return null;
        }
    }
}

// シングルトンインスタンスをエクスポート
export const chartService = new ChartService();
