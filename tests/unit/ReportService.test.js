// tests/unit/ReportService.test.js - ReportServiceのテスト

import { ReportService, reportService } from '../../js/services/reportService.js';

// モック設定
jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

// jsPDFのモック
const mockPDF = {
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn(() => new Blob(['mock pdf content'], { type: 'application/pdf' }))
};

const mockJsPDF = jest.fn(() => mockPDF);
mockJsPDF.prototype = {
    ...mockPDF,
    internal: {
        pageSize: {
            getWidth: () => 210,
            getHeight: () => 297
        }
    }
};

// html2canvasのモック
const mockHtml2canvas = jest.fn(() => Promise.resolve({
    toDataURL: jest.fn(() => 'data:image/png;base64,mock-image-data')
}));

// グローバルモック
global.window = {
    jsPDF: mockJsPDF,
    html2canvas: mockHtml2canvas
};

global.document = {
    createElement: jest.fn((tag) => {
        if (tag === 'script') {
            return {
                src: '',
                onload: null,
                onerror: null
            };
        } else if (tag === 'a') {
            return {
                href: '',
                download: '',
                click: jest.fn()
            };
        }
        return {};
    }),
    head: {
        appendChild: jest.fn()
    },
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    getElementById: jest.fn(() => ({
        toDataURL: jest.fn(() => 'data:image/png;base64,mock-image-data')
    }))
};

global.URL = {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn()
};

describe('ReportService', () => {
    let service;

    beforeEach(() => {
        service = new ReportService();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(service.jsPDF).toBeNull();
            expect(service.html2canvas).toBeNull();
            expect(service.isLibrariesLoaded).toBe(false);
        });
    });

    describe('loadLibraries', () => {
        it('should load libraries successfully', async () => {
            await service.loadLibraries();

            expect(service.jsPDF).toBe(mockJsPDF);
            expect(service.html2canvas).toBe(mockHtml2canvas);
            expect(service.isLibrariesLoaded).toBe(true);
        });

        it('should not reload libraries if already loaded', async () => {
            service.isLibrariesLoaded = true;
            service.jsPDF = mockJsPDF;
            service.html2canvas = mockHtml2canvas;

            await service.loadLibraries();

            expect(service.isLibrariesLoaded).toBe(true);
        });

        it('should handle library loading errors', async () => {
            global.window = undefined;

            await expect(service.loadLibraries()).rejects.toThrow('PDFライブラリの読み込みに失敗しました');
        });
    });

    describe('loadScript', () => {
        it('should load script successfully', async () => {
            const mockScript = {
                src: '',
                onload: null,
                onerror: null
            };
            global.document.createElement.mockReturnValue(mockScript);

            const promise = service.loadScript('https://example.com/script.js');
            
            // シミュレート: スクリプトの読み込み成功
            mockScript.onload();
            
            await promise;
            expect(global.document.createElement).toHaveBeenCalledWith('script');
            expect(global.document.head.appendChild).toHaveBeenCalledWith(mockScript);
        });

        it('should handle script loading errors', async () => {
            const mockScript = {
                src: '',
                onload: null,
                onerror: null
            };
            global.document.createElement.mockReturnValue(mockScript);

            const promise = service.loadScript('https://example.com/script.js');
            
            // シミュレート: スクリプトの読み込み失敗
            mockScript.onerror();
            
            await expect(promise).rejects.toBeUndefined();
        });
    });

    describe('generateProgressReportPDF', () => {
        it('should generate progress report PDF successfully', async () => {
            const reportData = {
                dateRange: {
                    start: '2024-01-01',
                    end: '2024-01-31'
                },
                stats: {
                    maxOneRM: 150,
                    avgOneRM: 140,
                    maxWeight: 120,
                    avgWeight: 110,
                    maxReps: 12,
                    avgReps: 8,
                    improvement: 10
                },
                trend: {
                    direction: 'improving',
                    strength: 0.5
                },
                goals: [
                    {
                        description: 'Bench Press 150kg',
                        progress_percentage: 80,
                        is_achieved: false
                    }
                ],
                progressData: [
                    {
                        workout_date: '2024-01-01',
                        weights: [100, 110, 120],
                        reps: [10, 8, 6],
                        one_rm: 140,
                        sets: 3
                    }
                ]
            };

            const result = await service.generateProgressReportPDF(reportData, 'Bench Press');

            expect(result).toBeInstanceOf(Blob);
            expect(mockPDF.setFont).toHaveBeenCalled();
            expect(mockPDF.setTextColor).toHaveBeenCalled();
            expect(mockPDF.text).toHaveBeenCalled();
        });

        it('should handle missing jsPDF library', async () => {
            service.jsPDF = null;

            await expect(service.generateProgressReportPDF({}, 'Test'))
                .rejects.toThrow('jsPDFライブラリが利用できません');
        });
    });

    describe('addChartToPDF', () => {
        it('should add chart to PDF successfully', async () => {
            const mockCanvas = {
                toDataURL: jest.fn(() => 'data:image/png;base64,mock-image-data')
            };
            global.document.getElementById.mockReturnValue(mockCanvas);

            await service.addChartToPDF(mockPDF, 'chart-canvas', 10, 20, 100, 80);

            expect(mockHtml2canvas).toHaveBeenCalledWith(mockCanvas, {
                backgroundColor: '#ffffff',
                scale: 2
            });
            expect(mockPDF.addImage).toHaveBeenCalled();
        });

        it('should handle missing html2canvas library', async () => {
            service.html2canvas = null;

            await service.addChartToPDF(mockPDF, 'chart-canvas', 10, 20, 100, 80);

            // エラーが発生しても例外は投げられない（handleErrorで処理される）
            expect(mockPDF.addImage).not.toHaveBeenCalled();
        });

        it('should handle missing canvas element', async () => {
            global.document.getElementById.mockReturnValue(null);

            await service.addChartToPDF(mockPDF, 'missing-canvas', 10, 20, 100, 80);

            // エラーが発生しても例外は投げられない（handleErrorで処理される）
            expect(mockPDF.addImage).not.toHaveBeenCalled();
        });
    });

    describe('generateWeeklySummary', () => {
        it('should generate weekly summary successfully', () => {
            const weeklyData = [
                {
                    weekStart: '2024-01-01',
                    sessions: [{ one_rm: 100 }],
                    maxWeight: 100,
                    maxOneRM: 120
                },
                {
                    weekStart: '2024-01-08',
                    sessions: [{ one_rm: 110 }],
                    maxWeight: 110,
                    maxOneRM: 130
                }
            ];

            const result = service.generateWeeklySummary(weeklyData, 'Bench Press');

            expect(result.exerciseName).toBe('Bench Press');
            expect(result.totalWeeks).toBe(2);
            expect(result.averageSessionsPerWeek).toBe(1);
            expect(result.maxWeightProgress).toBe(10);
            expect(result.oneRMProgress).toBe(8.33);
            expect(result.consistencyScore).toBeGreaterThan(0);
        });

        it('should handle empty weekly data', () => {
            const result = service.generateWeeklySummary([], 'Bench Press');

            expect(result.exerciseName).toBe('Bench Press');
            expect(result.totalWeeks).toBe(0);
            expect(result.averageSessionsPerWeek).toBe(0);
            expect(result.maxWeightProgress).toBe(0);
            expect(result.oneRMProgress).toBe(0);
            expect(result.consistencyScore).toBe(0);
        });

        it('should handle null weekly data', () => {
            const result = service.generateWeeklySummary(null, 'Bench Press');

            expect(result.exerciseName).toBe('Bench Press');
            expect(result.totalWeeks).toBe(0);
        });
    });

    describe('generateMonthlySummary', () => {
        it('should generate monthly summary successfully', () => {
            const monthlyAnalysis = {
                hasData: true,
                stats: {
                    maxOneRM: 150,
                    avgOneRM: 140,
                    improvement: 10
                },
                trend: {
                    direction: 'improving',
                    strength: 0.5
                },
                totalSessions: 12,
                dateRange: {
                    start: '2024-01-01',
                    end: '2024-01-31'
                },
                weeklyData: [
                    { sessions: [{ one_rm: 100 }] },
                    { sessions: [{ one_rm: 110 }] }
                ]
            };

            const result = service.generateMonthlySummary(monthlyAnalysis, 'Bench Press');

            expect(result.exerciseName).toBe('Bench Press');
            expect(result.hasData).toBe(true);
            expect(result.totalSessions).toBe(12);
            expect(result.performanceScore).toBeGreaterThan(0);
            expect(result.recommendations).toBeDefined();
        });

        it('should handle no data', () => {
            const monthlyAnalysis = {
                hasData: false
            };

            const result = service.generateMonthlySummary(monthlyAnalysis, 'Bench Press');

            expect(result.exerciseName).toBe('Bench Press');
            expect(result.hasData).toBe(false);
            expect(result.message).toBe('データが不足しています');
        });
    });

    describe('calculatePerformanceScore', () => {
        it('should calculate high performance score for good improvement', () => {
            const stats = { improvement: 15 };
            const trend = { direction: 'improving' };

            const result = service.calculatePerformanceScore(stats, trend);

            expect(result).toBeGreaterThan(80);
        });

        it('should calculate low performance score for declining trend', () => {
            const stats = { improvement: -10 };
            const trend = { direction: 'declining' };

            const result = service.calculatePerformanceScore(stats, trend);

            expect(result).toBeLessThan(50);
        });

        it('should return base score for neutral data', () => {
            const stats = { improvement: 0 };
            const trend = { direction: 'stable' };

            const result = service.calculatePerformanceScore(stats, trend);

            expect(result).toBe(50);
        });
    });

    describe('getTrendDescription', () => {
        it('should return improving description', () => {
            const trend = { direction: 'improving', strength: 0.5 };
            const result = service.getTrendDescription(trend);
            expect(result).toContain('向上しています');
        });

        it('should return declining description', () => {
            const trend = { direction: 'declining', strength: 0.3 };
            const result = service.getTrendDescription(trend);
            expect(result).toContain('低下傾向');
        });

        it('should return stable description', () => {
            const trend = { direction: 'stable' };
            const result = service.getTrendDescription(trend);
            expect(result).toContain('安定しています');
        });

        it('should return insufficient data description', () => {
            const trend = { direction: 'insufficient_data' };
            const result = service.getTrendDescription(trend);
            expect(result).toContain('データが不足');
        });
    });

    describe('generateRecommendations', () => {
        it('should generate recommendations for low frequency', () => {
            const stats = { improvement: 5 };
            const trend = { direction: 'stable' };
            const avgWeeklySessions = 0.5;

            const result = service.generateRecommendations(stats, trend, avgWeeklySessions);

            expect(result).toContain('トレーニング頻度を増やす');
        });

        it('should generate recommendations for high frequency', () => {
            const stats = { improvement: 5 };
            const trend = { direction: 'stable' };
            const avgWeeklySessions = 5;

            const result = service.generateRecommendations(stats, trend, avgWeeklySessions);

            expect(result).toContain('オーバートレーニング');
        });

        it('should generate recommendations for declining trend', () => {
            const stats = { improvement: -5 };
            const trend = { direction: 'declining' };
            const avgWeeklySessions = 2;

            const result = service.generateRecommendations(stats, trend, avgWeeklySessions);

            expect(result).toContain('パフォーマンスが低下');
        });

        it('should generate general recommendations when no specific conditions', () => {
            const stats = { improvement: 3 };
            const trend = { direction: 'stable' };
            const avgWeeklySessions = 2;

            const result = service.generateRecommendations(stats, trend, avgWeeklySessions);

            expect(result).toContain('現在のトレーニングを継続');
        });
    });

    describe('exportToCSV', () => {
        it('should export progress data to CSV successfully', () => {
            const progressData = [
                {
                    workout_date: '2024-01-01',
                    weights: [100, 110, 120],
                    reps: [10, 8, 6],
                    one_rm: 140,
                    sets: 3,
                    notes: 'Good workout'
                }
            ];

            const result = service.exportToCSV(progressData, 'Bench Press');

            expect(result).toBeInstanceOf(Blob);
            expect(result.type).toBe('text/csv;charset=utf-8;');
        });

        it('should handle empty progress data', () => {
            expect(() => service.exportToCSV([], 'Bench Press'))
                .toThrow('エクスポートするデータがありません');
        });

        it('should handle null progress data', () => {
            expect(() => service.exportToCSV(null, 'Bench Press'))
                .toThrow('エクスポートするデータがありません');
        });
    });

    describe('downloadFile', () => {
        it('should download file successfully', () => {
            const blob = new Blob(['test content'], { type: 'text/plain' });
            const filename = 'test.txt';

            service.downloadFile(blob, filename);

            expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
            expect(global.document.createElement).toHaveBeenCalledWith('a');
            expect(global.URL.revokeObjectURL).toHaveBeenCalled();
        });
    });

    describe('generateWorkoutReportPDF', () => {
        it('should generate workout report PDF successfully', async () => {
            const workoutData = {
                date: '2024-01-01',
                exercises: [
                    {
                        name: 'Bench Press',
                        sets: 3,
                        reps: 10,
                        weight: 100
                    }
                ]
            };

            const result = await service.generateWorkoutReportPDF(workoutData);

            expect(result).toBeInstanceOf(Blob);
            expect(mockPDF.setFont).toHaveBeenCalled();
            expect(mockPDF.text).toHaveBeenCalled();
        });

        it('should handle missing jsPDF library', async () => {
            service.jsPDF = null;

            await expect(service.generateWorkoutReportPDF({}))
                .rejects.toThrow('jsPDFライブラリが利用できません');
        });
    });

    describe('generateStatisticsReportPDF', () => {
        it('should generate statistics report PDF successfully', async () => {
            const statisticsData = {
                totalWorkouts: 50,
                averageWeight: 120,
                muscleGroups: ['Chest', 'Back']
            };

            const result = await service.generateStatisticsReportPDF(statisticsData);

            expect(result).toBeInstanceOf(Blob);
            expect(mockPDF.setFont).toHaveBeenCalled();
            expect(mockPDF.text).toHaveBeenCalled();
        });

        it('should handle missing jsPDF library', async () => {
            service.jsPDF = null;

            await expect(service.generateStatisticsReportPDF({}))
                .rejects.toThrow('jsPDFライブラリが利用できません');
        });
    });

    describe('exportToPDF', () => {
        it('should export element to PDF successfully', async () => {
            const mockElement = {
                offsetWidth: 800,
                offsetHeight: 600
            };

            await service.exportToPDF(mockElement, 'test.pdf');

            expect(mockHtml2canvas).toHaveBeenCalledWith(mockElement, {
                backgroundColor: '#ffffff',
                scale: 2
            });
        });

        it('should handle missing libraries', async () => {
            service.html2canvas = null;
            service.jsPDF = null;

            await expect(service.exportToPDF({}, 'test.pdf'))
                .rejects.toThrow('必要なライブラリが利用できません');
        });
    });

    describe('integration', () => {
        it('should handle complete report generation flow', async () => {
            const reportData = {
                dateRange: { start: '2024-01-01', end: '2024-01-31' },
                stats: { maxOneRM: 150, improvement: 10 },
                trend: { direction: 'improving', strength: 0.5 },
                progressData: [{
                    workout_date: '2024-01-01',
                    weights: [100, 110, 120],
                    reps: [10, 8, 6],
                    one_rm: 140,
                    sets: 3
                }]
            };

            // Generate progress report
            const progressPDF = await service.generateProgressReportPDF(reportData, 'Bench Press');
            expect(progressPDF).toBeInstanceOf(Blob);

            // Generate weekly summary
            const weeklyData = [{
                weekStart: '2024-01-01',
                sessions: [{ one_rm: 100 }],
                maxWeight: 100,
                maxOneRM: 120
            }];
            const weeklySummary = service.generateWeeklySummary(weeklyData, 'Bench Press');
            expect(weeklySummary.exerciseName).toBe('Bench Press');

            // Export to CSV
            const csvBlob = service.exportToCSV(reportData.progressData, 'Bench Press');
            expect(csvBlob).toBeInstanceOf(Blob);

            // Download file
            service.downloadFile(csvBlob, 'progress.csv');
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });
    });
});
