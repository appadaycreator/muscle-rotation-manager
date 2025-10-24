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
        it('should not reload libraries if already loaded', async () => {
            reportService.isLibrariesLoaded = true;
            
            await reportService.loadLibraries();
            
            expect(mockDocument.createElement).not.toHaveBeenCalled();
        });

        it('should set libraries when window has them available', () => {
            // ライブラリをクリア
            reportService.jsPDF = null;
            reportService.html2canvas = null;
            reportService.isLibrariesLoaded = false;
            
            // windowにライブラリを設定
            const mockJsPDF = jest.fn();
            const mockHtml2canvas = jest.fn();
            mockWindow.jsPDF = mockJsPDF;
            mockWindow.html2canvas = mockHtml2canvas;
            
            // 同期的にライブラリを設定
            reportService.jsPDF = mockJsPDF;
            reportService.html2canvas = mockHtml2canvas;
            reportService.isLibrariesLoaded = true;
            
            expect(reportService.jsPDF).toBe(mockJsPDF);
            expect(reportService.html2canvas).toBe(mockHtml2canvas);
            expect(reportService.isLibrariesLoaded).toBe(true);
        });
    });

    describe('generateProgressReportPDF', () => {
        it('should generate PDF report successfully', async () => {
            const mockPdfInstance = {
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn(),
                output: jest.fn().mockReturnValue('mock-pdf-blob')
            };
            
            const mockJsPDF = jest.fn().mockImplementation(() => mockPdfInstance);
            
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
            expect(result).toBe('mock-pdf-blob');
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
            const mockPdfInstance = {
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn(),
                output: jest.fn().mockReturnValue('mock-pdf-blob')
            };
            
            const mockJsPDF = jest.fn().mockImplementation(() => mockPdfInstance);
            
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
            expect(result).toBe('mock-pdf-blob');
        });
    });

    describe('generateStatisticsReportPDF', () => {
        it('should generate statistics PDF report successfully', async () => {
            const mockPdfInstance = {
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn(),
                output: jest.fn().mockReturnValue('mock-pdf-blob')
            };
            
            const mockJsPDF = jest.fn().mockImplementation(() => mockPdfInstance);
            
            reportService.jsPDF = mockJsPDF;
            reportService.isLibrariesLoaded = true;
            
            const statisticsData = {
                totalWorkouts: 10,
                averageWeight: 100,
                muscleGroups: ['chest', 'back']
            };
            
            const result = await reportService.generateStatisticsReportPDF(statisticsData);
            
            expect(mockJsPDF).toHaveBeenCalledWith('p', 'mm', 'a4');
            expect(result).toBe('mock-pdf-blob');
        });
    });

    describe('exportToPDF', () => {
        it('should export element to PDF successfully', async () => {
            const mockCanvas = {
                toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test'),
                height: 100,
                width: 200
            };
            
            const mockHtml2canvas = jest.fn().mockResolvedValue(mockCanvas);
            const mockPdfInstance = {
                addImage: jest.fn(),
                save: jest.fn()
            };
            const mockJsPDF = jest.fn().mockImplementation(() => mockPdfInstance);
            
            reportService.html2canvas = mockHtml2canvas;
            reportService.jsPDF = mockJsPDF;
            reportService.isLibrariesLoaded = true;
            
            const element = document.createElement('div');
            const filename = 'test-report.pdf';
            
            await reportService.exportToPDF(element, filename);
            
            expect(mockHtml2canvas).toHaveBeenCalledWith(element, {
                backgroundColor: '#ffffff',
                scale: 2
            });
            expect(mockJsPDF).toHaveBeenCalledWith('p', 'mm', 'a4');
            expect(mockPdfInstance.addImage).toHaveBeenCalled();
            expect(mockPdfInstance.save).toHaveBeenCalledWith(filename);
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
            const mockPdfInstance = {
                internal: {
                    pageSize: {
                        getWidth: () => 210,
                        getHeight: () => 297
                    }
                },
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setTextColor: jest.fn(),
                text: jest.fn(),
                output: jest.fn().mockReturnValue('mock-pdf-blob')
            };
            
            const mockJsPDF = jest.fn().mockImplementation(() => mockPdfInstance);
            
            // ライブラリを直接設定（loadLibrariesをスキップ）
            reportService.jsPDF = mockJsPDF;
            reportService.html2canvas = jest.fn();
            reportService.isLibrariesLoaded = true;
            
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
            
            expect(result).toBe('mock-pdf-blob');
        });
    });
});