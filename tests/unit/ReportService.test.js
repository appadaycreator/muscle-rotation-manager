// ReportService.test.js - ReportServiceクラスのテスト

import { reportService as ReportService } from '../../js/services/reportService.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getCurrentUser: jest.fn(),
    loadData: jest.fn(),
    saveData: jest.fn()
  }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

describe('ReportService', () => {
  let reportService;
  let mockSupabaseService;
  let mockHandleError;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    mockHandleError = require('../../js/utils/errorHandler.js').handleError;

    reportService = ReportService;
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(reportService).toBeDefined();
    });
  });
});