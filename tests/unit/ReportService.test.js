// ReportService.test.js - ReportServiceクラスのテスト

import ReportService from '../../js/services/reportService.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(() => true),
    fetchData: jest.fn(),
    saveData: jest.fn(),
  },
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
  formatDate: jest.fn((date) => date.toISOString().split('T')[0]),
  formatNumber: jest.fn((num) => num.toString()),
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn(),
}));

describe('ReportService', () => {
  let reportService;
  let mockSupabaseService;
  let mockShowNotification;
  let mockHandleError;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseService = require('../../js/services/supabaseService.js').supabaseService;
    mockShowNotification = require('../../js/utils/helpers.js').showNotification;
    mockHandleError = require('../../js/utils/errorHandler.js').handleError;

    reportService = new ReportService();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(reportService.supabase).toBe(mockSupabaseService);
      expect(reportService.reportCache).toBeInstanceOf(Map);
      expect(reportService.cacheExpiryTime).toBe(300000); // 5 minutes
    });
  });

  describe('progress report generation', () => {
    test('should generate progress report successfully', async () => {
      const mockData = {
        userId: 'user123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        exercises: [
          { name: 'Bench Press', progress: 10 },
          { name: 'Squat', progress: 15 }
        ]
      };

      mockSupabaseService.fetchData.mockResolvedValue(mockData);

      const report = await reportService.generateProgressReport('user123', '2024-01-01', '2024-01-31');

      expect(report).toBeDefined();
      expect(report.userId).toBe('user123');
      expect(report.exercises).toHaveLength(2);
      expect(mockSupabaseService.fetchData).toHaveBeenCalledWith('progress_reports', {
        userId: 'user123',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
    });

    test('should handle progress report generation error', async () => {
      const error = new Error('Database connection failed');
      mockSupabaseService.fetchData.mockRejectedValue(error);

      const report = await reportService.generateProgressReport('user123', '2024-01-01', '2024-01-31');

      expect(report).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'ReportService.generateProgressReport',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('workout summary report', () => {
    test('should generate workout summary report', async () => {
      const mockData = {
        totalWorkouts: 20,
        totalDuration: 1200,
        averageDuration: 60,
        exercises: [
          { name: 'Bench Press', sets: 15, reps: 45 },
          { name: 'Squat', sets: 12, reps: 36 }
        ]
      };

      mockSupabaseService.fetchData.mockResolvedValue(mockData);

      const report = await reportService.generateWorkoutSummary('user123', '2024-01-01', '2024-01-31');

      expect(report).toBeDefined();
      expect(report.totalWorkouts).toBe(20);
      expect(report.exercises).toHaveLength(2);
    });

    test('should handle workout summary generation error', async () => {
      const error = new Error('Data fetch failed');
      mockSupabaseService.fetchData.mockRejectedValue(error);

      const report = await reportService.generateWorkoutSummary('user123', '2024-01-01', '2024-01-31');

      expect(report).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'ReportService.generateWorkoutSummary',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('export functionality', () => {
    test('should export report to PDF', async () => {
      const reportData = {
        userId: 'user123',
        title: 'Progress Report',
        content: 'Report content here'
      };

      const pdfBlob = await reportService.exportToPDF(reportData);

      expect(pdfBlob).toBeDefined();
      expect(pdfBlob.type).toBe('application/pdf');
    });

    test('should export report to CSV', async () => {
      const reportData = {
        exercises: [
          { name: 'Bench Press', progress: 10 },
          { name: 'Squat', progress: 15 }
        ]
      };

      const csvContent = await reportService.exportToCSV(reportData);

      expect(csvContent).toBeDefined();
      expect(csvContent).toContain('Bench Press');
      expect(csvContent).toContain('Squat');
    });

    test('should handle export errors', async () => {
      const reportData = null;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await reportService.exportToPDF(reportData);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('report caching', () => {
    test('should cache report data', () => {
      const reportId = 'report123';
      const reportData = { id: 'report123', content: 'test' };

      reportService.cacheReport(reportId, reportData);

      expect(reportService.reportCache.has(reportId)).toBe(true);
      expect(reportService.reportCache.get(reportId)).toEqual(reportData);
    });

    test('should retrieve cached report', () => {
      const reportId = 'report123';
      const reportData = { id: 'report123', content: 'test' };

      reportService.cacheReport(reportId, reportData);
      const cachedReport = reportService.getCachedReport(reportId);

      expect(cachedReport).toEqual(reportData);
    });

    test('should return null for non-existent cached report', () => {
      const cachedReport = reportService.getCachedReport('non-existent');

      expect(cachedReport).toBeNull();
    });

    test('should clear expired cache', () => {
      const reportId = 'report123';
      const reportData = { id: 'report123', content: 'test' };

      reportService.cacheReport(reportId, reportData);
      
      // Simulate expired cache
      const originalTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(originalTime + 400000); // 6+ minutes later

      const cachedReport = reportService.getCachedReport(reportId);

      expect(cachedReport).toBeNull();

      Date.now.mockRestore();
    });
  });

  describe('report validation', () => {
    test('should validate report data', () => {
      const validData = {
        userId: 'user123',
        title: 'Test Report',
        content: 'Report content'
      };

      const isValid = reportService.validateReportData(validData);
      expect(isValid).toBe(true);
    });

    test('should reject invalid report data', () => {
      const invalidData = {
        userId: '', // Empty userId
        title: 'Test Report',
        content: 'Report content'
      };

      const isValid = reportService.validateReportData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('report formatting', () => {
    test('should format report for display', () => {
      const rawData = {
        userId: 'user123',
        exercises: [
          { name: 'Bench Press', progress: 10 },
          { name: 'Squat', progress: 15 }
        ]
      };

      const formattedReport = reportService.formatReport(rawData);

      expect(formattedReport).toBeDefined();
      expect(formattedReport.userId).toBe('user123');
      expect(formattedReport.exercises).toHaveLength(2);
    });

    test('should handle formatting errors', () => {
      const invalidData = null;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const formattedReport = reportService.formatReport(invalidData);

      expect(formattedReport).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('report statistics', () => {
    test('should calculate report statistics', () => {
      const reportData = {
        exercises: [
          { name: 'Bench Press', progress: 10 },
          { name: 'Squat', progress: 15 },
          { name: 'Deadlift', progress: 20 }
        ]
      };

      const stats = reportService.calculateReportStats(reportData);

      expect(stats).toBeDefined();
      expect(stats.totalExercises).toBe(3);
      expect(stats.averageProgress).toBe(15);
    });

    test('should handle empty report data', () => {
      const emptyData = { exercises: [] };

      const stats = reportService.calculateReportStats(emptyData);

      expect(stats).toBeDefined();
      expect(stats.totalExercises).toBe(0);
      expect(stats.averageProgress).toBe(0);
    });
  });
});
