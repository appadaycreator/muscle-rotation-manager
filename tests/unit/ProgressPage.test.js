// ProgressPage.test.js - ProgressPageクラスのテスト

import ProgressPage from '../../js/pages/progressPage.js';

// モックの設定
jest.mock('../../js/services/progressTrackingService.js', () => ({
  progressTrackingService: {
    calculateOneRM: jest.fn(),
    getProgressData: jest.fn(),
    saveProgressData: jest.fn(),
    getGoals: jest.fn(),
    setGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn()
  }
}));

jest.mock('../../js/services/chartService.js', () => ({
  chartService: {
    createProgressChart: jest.fn(),
    createGoalChart: jest.fn(),
    updateChart: jest.fn(),
    destroyChart: jest.fn()
  }
}));

jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getCurrentUser: jest.fn(),
    saveData: jest.fn(),
    loadData: jest.fn()
  }
}));

jest.mock('../../js/services/reportService.js', () => ({
  reportService: {
    generateProgressReport: jest.fn(),
    exportToPDF: jest.fn(),
    exportToCSV: jest.fn()
  }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

jest.mock('../../js/utils/helpers.js', () => ({
  safeGetElement: jest.fn(),
  safeGetElements: jest.fn()
}));

// グローバル関数のモック
global.handleError = jest.fn();

describe('ProgressPage', () => {
  let progressPage;
  let mockProgressTrackingService;
  let mockChartService;
  let mockSupabaseService;
  let mockReportService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // DOMのセットアップ
    document.body.innerHTML = `
      <div id="progress-chart"></div>
      <div id="goal-chart"></div>
      <div id="progress-data"></div>
      <div id="goal-data"></div>
    `;
    
    // モジュールの取得
    const progressTrackingServiceModule = require('../../js/services/progressTrackingService.js');
    const chartServiceModule = require('../../js/services/chartService.js');
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    const reportServiceModule = require('../../js/services/reportService.js');
    
    mockProgressTrackingService = progressTrackingServiceModule.progressTrackingService;
    mockChartService = chartServiceModule.chartService;
    mockSupabaseService = supabaseServiceModule.supabaseService;
    mockReportService = reportServiceModule.reportService;
    
    // ProgressPageのインスタンス作成
    progressPage = new ProgressPage();
  });

  afterEach(() => {
    if (progressPage) {
      progressPage.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(progressPage.currentUser).toBeNull();
      expect(progressPage.selectedExercise).toBeNull();
      expect(progressPage.progressData).toEqual([]);
      expect(progressPage.goalsData).toEqual([]);
      expect(progressPage.isInitialized).toBe(false);
    });
  });

  describe('initialization', () => {
    test('should initialize successfully', async () => {
      mockSupabaseService.getCurrentUser.mockReturnValue({ id: 1, email: 'test@example.com' });
      mockProgressTrackingService.getProgressData.mockResolvedValue([]);
      mockProgressTrackingService.getGoals.mockResolvedValue([]);
      
      await progressPage.init();
      
      expect(progressPage.isInitialized).toBe(true);
      expect(progressPage.currentUser).toEqual({ id: 1, email: 'test@example.com' });
    });

    test('should handle initialization error', async () => {
      const error = new Error('Initialization failed');
      mockSupabaseService.getCurrentUser.mockImplementation(() => {
        throw error;
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await progressPage.init();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Progress page initialization failed:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('1RM calculation', () => {
    test('should calculate 1RM', () => {
      const weight = 100;
      const reps = 5;
      const expected1RM = 120;
      
      mockProgressTrackingService.calculateOneRM.mockReturnValue(expected1RM);
      
      const result = progressPage.calculateOneRM(weight, reps);
      
      expect(mockProgressTrackingService.calculateOneRM).toHaveBeenCalledWith(weight, reps);
      expect(result).toBe(expected1RM);
    });

    test('should handle 1RM calculation error', () => {
      const weight = 100;
      const reps = 5;
      const error = new Error('Invalid input');
      
      mockProgressTrackingService.calculateOneRM.mockImplementation(() => {
        throw error;
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      progressPage.calculateOneRM(weight, reps);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('1RM calculation failed:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('progress data management', () => {
    test('should load progress data', async () => {
      const mockProgressData = [
        { id: 1, exercise: 'ベンチプレス', date: '2024-01-01', weight: 100, reps: 5 },
        { id: 2, exercise: 'ベンチプレス', date: '2024-01-08', weight: 105, reps: 5 }
      ];
      
      mockProgressTrackingService.getProgressData.mockResolvedValue(mockProgressData);
      
      await progressPage.loadProgressData();
      
      expect(mockProgressTrackingService.getProgressData).toHaveBeenCalled();
      expect(progressPage.progressData).toEqual(mockProgressData);
    });

    test('should save progress data', async () => {
      const progressData = {
        exercise: 'ベンチプレス',
        date: '2024-01-01',
        weight: 100,
        reps: 5
      };
      
      const mockSavedData = { id: 1, ...progressData };
      mockProgressTrackingService.saveProgressData.mockResolvedValue(mockSavedData);
      
      const result = await progressPage.saveProgressData(progressData);
      
      expect(mockProgressTrackingService.saveProgressData).toHaveBeenCalledWith(progressData);
      expect(result).toEqual(mockSavedData);
    });

    test('should handle progress data loading error', async () => {
      const error = new Error('Failed to load progress data');
      mockProgressTrackingService.getProgressData.mockRejectedValue(error);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await progressPage.loadProgressData();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load progress data:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('goal management', () => {
    test('should load goals', async () => {
      const mockGoals = [
        { id: 1, exercise: 'ベンチプレス', targetWeight: 120, targetDate: '2024-06-01' },
        { id: 2, exercise: 'スクワット', targetWeight: 150, targetDate: '2024-06-01' }
      ];
      
      mockProgressTrackingService.getGoals.mockResolvedValue(mockGoals);
      
      await progressPage.loadGoals();
      
      expect(mockProgressTrackingService.getGoals).toHaveBeenCalled();
      expect(progressPage.goalsData).toEqual(mockGoals);
    });

    test('should set new goal', async () => {
      const goalData = {
        exercise: 'ベンチプレス',
        targetWeight: 120,
        targetDate: '2024-06-01'
      };
      
      const mockCreatedGoal = { id: 1, ...goalData };
      mockProgressTrackingService.setGoal.mockResolvedValue(mockCreatedGoal);
      
      const result = await progressPage.setGoal(goalData);
      
      expect(mockProgressTrackingService.setGoal).toHaveBeenCalledWith(goalData);
      expect(result).toEqual(mockCreatedGoal);
    });

    test('should update goal', async () => {
      const goalId = 1;
      const updateData = { targetWeight: 130 };
      const mockUpdatedGoal = { id: 1, targetWeight: 130 };
      
      mockProgressTrackingService.updateGoal.mockResolvedValue(mockUpdatedGoal);
      
      const result = await progressPage.updateGoal(goalId, updateData);
      
      expect(mockProgressTrackingService.updateGoal).toHaveBeenCalledWith(goalId, updateData);
      expect(result).toEqual(mockUpdatedGoal);
    });

    test('should delete goal', async () => {
      const goalId = 1;
      
      mockProgressTrackingService.deleteGoal.mockResolvedValue(true);
      
      const result = await progressPage.deleteGoal(goalId);
      
      expect(mockProgressTrackingService.deleteGoal).toHaveBeenCalledWith(goalId);
      expect(result).toBe(true);
    });
  });

  describe('chart management', () => {
    test('should create progress chart', async () => {
      const chartData = [
        { date: '2024-01-01', weight: 100 },
        { date: '2024-01-08', weight: 105 }
      ];
      
      mockChartService.createProgressChart.mockResolvedValue({ id: 'progress-chart' });
      
      await progressPage.createProgressChart(chartData);
      
      expect(mockChartService.createProgressChart).toHaveBeenCalledWith('progress-chart', chartData);
    });

    test('should create goal chart', async () => {
      const goalData = [
        { exercise: 'ベンチプレス', current: 100, target: 120 },
        { exercise: 'スクワット', current: 130, target: 150 }
      ];
      
      mockChartService.createGoalChart.mockResolvedValue({ id: 'goal-chart' });
      
      await progressPage.createGoalChart(goalData);
      
      expect(mockChartService.createGoalChart).toHaveBeenCalledWith('goal-chart', goalData);
    });

    test('should update chart', async () => {
      const chartId = 'progress-chart';
      const newData = [{ date: '2024-01-15', weight: 110 }];
      
      mockChartService.updateChart.mockResolvedValue(true);
      
      await progressPage.updateChart(chartId, newData);
      
      expect(mockChartService.updateChart).toHaveBeenCalledWith(chartId, newData);
    });

    test('should destroy chart', () => {
      const chartId = 'progress-chart';
      
      progressPage.destroyChart(chartId);
      
      expect(mockChartService.destroyChart).toHaveBeenCalledWith(chartId);
    });
  });

  describe('report generation', () => {
    test('should generate progress report', async () => {
      const reportData = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        exercises: ['ベンチプレス', 'スクワット']
      };
      
      const mockReport = { id: 1, data: reportData };
      mockReportService.generateProgressReport.mockResolvedValue(mockReport);
      
      const result = await progressPage.generateProgressReport(reportData);
      
      expect(mockReportService.generateProgressReport).toHaveBeenCalledWith(reportData);
      expect(result).toEqual(mockReport);
    });

    test('should export to PDF', async () => {
      const reportData = { id: 1, data: {} };
      
      mockReportService.exportToPDF.mockResolvedValue(true);
      
      const result = await progressPage.exportToPDF(reportData);
      
      expect(mockReportService.exportToPDF).toHaveBeenCalledWith(reportData);
      expect(result).toBe(true);
    });

    test('should export to CSV', async () => {
      const reportData = { id: 1, data: {} };
      
      mockReportService.exportToCSV.mockResolvedValue(true);
      
      const result = await progressPage.exportToCSV(reportData);
      
      expect(mockReportService.exportToCSV).toHaveBeenCalledWith(reportData);
      expect(result).toBe(true);
    });
  });

  describe('exercise selection', () => {
    test('should select exercise', () => {
      const exercise = { id: 1, name: 'ベンチプレス' };
      
      progressPage.selectExercise(exercise);
      
      expect(progressPage.selectedExercise).toEqual(exercise);
    });

    test('should clear exercise selection', () => {
      progressPage.selectedExercise = { id: 1, name: 'ベンチプレス' };
      
      progressPage.clearExerciseSelection();
      
      expect(progressPage.selectedExercise).toBeNull();
    });
  });

  describe('data refresh', () => {
    test('should refresh all data', async () => {
      const mockProgressData = [{ id: 1 }];
      const mockGoalsData = [{ id: 1 }];
      
      mockProgressTrackingService.getProgressData.mockResolvedValue(mockProgressData);
      mockProgressTrackingService.getGoals.mockResolvedValue(mockGoalsData);
      
      await progressPage.refreshData();
      
      expect(mockProgressTrackingService.getProgressData).toHaveBeenCalled();
      expect(mockProgressTrackingService.getGoals).toHaveBeenCalled();
      expect(progressPage.progressData).toEqual(mockProgressData);
      expect(progressPage.goalsData).toEqual(mockGoalsData);
    });
  });

  describe('cleanup', () => {
    test('should cleanup resources', () => {
      progressPage.progressData = [{ id: 1 }];
      progressPage.goalsData = [{ id: 1 }];
      progressPage.selectedExercise = { id: 1 };
      
      progressPage.cleanup();
      
      expect(progressPage.progressData).toEqual([]);
      expect(progressPage.goalsData).toEqual([]);
      expect(progressPage.selectedExercise).toBeNull();
    });
  });
});
