/**
 * ReportService テストスイート
 */

import { reportService } from '../../js/services/reportService.js';
import { handleError } from '../../js/utils/errorHandler.js';

// モックの設定
jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

// DOM のモック
const mockScript = {
    src: '',
    onload: null,
    onerror: null
};

const mockDocument = {
    createElement: jest.fn(() => mockScript),
    head: {
        appendChild: jest.fn()
    }
};

// window のモック
const mockWindow = {
    jsPDF: null,
    html2canvas: null
};

describe('ReportService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.document = mockDocument;
        global.window = mockWindow;
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(reportService.jsPDF).toBe(null);
            expect(reportService.html2canvas).toBe(null);
            expect(reportService.isLibrariesLoaded).toBe(false);
        });
    });

    describe('loadLibraries', () => {
        it('should load libraries successfully', async () => {
            const mockJsPDF = jest.fn();
            const mockHtml2canvas = jest.fn();
            
            mockWindow.jsPDF = mockJsPDF;
            mockWindow.html2canvas = mockHtml2canvas;
            
            await reportService.loadLibraries();
            
            expect(reportService.jsPDF).toBe(mockJsPDF);
            expect(reportService.html2canvas).toBe(mockHtml2canvas);
            expect(reportService.isLibrariesLoaded).toBe(true);
        });

        it('should not reload libraries if already loaded', async () => {
            reportService.isLibrariesLoaded = true;
            
            await reportService.loadLibraries();
            
            expect(mockDocument.createElement).not.toHaveBeenCalled();
        });

        it('should handle library loading errors', async () => {
            mockDocument.createElement.mockImplementation(() => {
                throw new Error('DOM error');
            });
            
            await expect(reportService.loadLibraries()).rejects.toThrow('PDFライブラリの読み込みに失敗しました');
            expect(handleError).toHaveBeenCalled();
        });
    });

    describe('loadScript', () => {
        it('should load script successfully', async () => {
            const src = 'https://example.com/script.js';
            mockScript.onload = jest.fn();
            
            const promise = reportService.loadScript(src);
            
            // スクリプトの読み込みをシミュレート
            mockScript.onload();
            
            await promise;
            
            expect(mockDocument.createElement).toHaveBeenCalledWith('script');
            expect(mockScript.src).toBe(src);
            expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockScript);
        });

        it('should handle script loading errors', async () => {
            const src = 'https://example.com/script.js';
            mockScript.onerror = jest.fn();
            
            const promise = reportService.loadScript(src);
            
            // スクリプトの読み込みエラーをシミュレート
            mockScript.onerror();
            
            await expect(promise).rejects.toBeUndefined();
        });
    });

    describe('generateProgressReportPDF', () => {
        it('should generate PDF report successfully', async () => {
            const mockJsPDF = jest.fn().mockImplementation(() => ({
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn()
            }));
            
            reportService.jsPDF = mockJsPDF;
            reportService.isLibrariesLoaded = true;
            
            const reportData = {
                dateRange: {
                    start: '2024-01-01',
                    end: '2024-01-31'
                },
                statistics: {
                    totalWorkouts: 10,
                    averageWeight: 100
                }
            };
            const exerciseName = 'Bench Press';
            
            const result = await reportService.generateProgressReportPDF(reportData, exerciseName);
            
            expect(mockJsPDF).toHaveBeenCalledWith('p', 'mm', 'a4');
        });

        it('should handle missing jsPDF library', async () => {
            reportService.jsPDF = null;
            reportService.isLibrariesLoaded = true;
            
            const reportData = {};
            const exerciseName = 'Bench Press';
            
            await expect(reportService.generateProgressReportPDF(reportData, exerciseName))
                .rejects.toThrow('jsPDFライブラリが利用できません');
        });
    });

    describe('generateWorkoutReportPDF', () => {
        it('should generate workout PDF report successfully', async () => {
            const mockJsPDF = jest.fn().mockImplementation(() => ({
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn()
            }));
            
            reportService.jsPDF = mockJsPDF;
            reportService.isLibrariesLoaded = true;
            
            const workoutData = {
                date: '2024-01-01',
                exercises: [
                    { name: 'Bench Press', sets: 3, reps: 10, weight: 100 }
                ]
            };
            
            const result = await reportService.generateWorkoutReportPDF(workoutData);
            
            expect(mockJsPDF).toHaveBeenCalledWith('p', 'mm', 'a4');
        });
    });

    describe('generateStatisticsReportPDF', () => {
        it('should generate statistics PDF report successfully', async () => {
            const mockJsPDF = jest.fn().mockImplementation(() => ({
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn()
            }));
            
            reportService.jsPDF = mockJsPDF;
            reportService.isLibrariesLoaded = true;
            
            const statisticsData = {
                totalWorkouts: 10,
                averageWeight: 100,
                muscleGroups: ['chest', 'back']
            };
            
            const result = await reportService.generateStatisticsReportPDF(statisticsData);
            
            expect(mockJsPDF).toHaveBeenCalledWith('p', 'mm', 'a4');
        });
    });

    describe('exportToPDF', () => {
        it('should export element to PDF successfully', async () => {
            const mockHtml2canvas = jest.fn().mockResolvedValue({
                toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test')
            });
            const mockJsPDF = jest.fn().mockImplementation(() => ({
                addImage: jest.fn(),
                save: jest.fn()
            }));
            
            reportService.html2canvas = mockHtml2canvas;
            reportService.jsPDF = mockJsPDF;
            reportService.isLibrariesLoaded = true;
            
            const element = document.createElement('div');
            const filename = 'test-report.pdf';
            
            await reportService.exportToPDF(element, filename);
            
            expect(mockHtml2canvas).toHaveBeenCalledWith(element);
            expect(mockJsPDF).toHaveBeenCalled();
        });

        it('should handle export errors', async () => {
            const mockHtml2canvas = jest.fn().mockRejectedValue(new Error('Canvas error'));
            
            reportService.html2canvas = mockHtml2canvas;
            reportService.isLibrariesLoaded = true;
            
            const element = document.createElement('div');
            const filename = 'test-report.pdf';
            
            await expect(reportService.exportToPDF(element, filename)).rejects.toThrow();
        });
    });

    describe('integration', () => {
        it('should complete full report generation flow', async () => {
            const mockJsPDF = jest.fn().mockImplementation(() => ({
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn()
            }));
            
            mockWindow.jsPDF = mockJsPDF;
            mockWindow.html2canvas = jest.fn();
            
            // ライブラリを読み込み
            await reportService.loadLibraries();
            
            // レポートを生成
            const reportData = {
                dateRange: {
                    start: '2024-01-01',
                    end: '2024-01-31'
                },
                statistics: {
                    totalWorkouts: 10,
                    averageWeight: 100
                }
            };
            
            const result = await reportService.generateProgressReportPDF(reportData, 'Bench Press');
            
            expect(result).toBeTruthy();
        });
    });
});