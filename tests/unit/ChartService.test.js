// ChartService.test.js - ChartServiceクラスのテスト

import { chartService as ChartService } from '../../js/services/chartService.js';

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

describe('ChartService', () => {
  let chartService;
  let mockSupabaseService;
  let mockHandleError;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    mockHandleError = require('../../js/utils/errorHandler.js').handleError;

    chartService = ChartService;
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(chartService).toBeDefined();
    });
  });
});