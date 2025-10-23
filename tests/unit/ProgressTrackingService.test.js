// ProgressTrackingService.test.js - ProgressTrackingServiceクラスのテスト

import ProgressTrackingService from '../../js/services/progressTrackingService.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(),
    getCurrentUser: jest.fn(),
    loadData: jest.fn(),
    saveData: jest.fn(),
    client: {
      from: jest.fn()
    }
  }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

describe('ProgressTrackingService', () => {
  let progressTrackingService;
  let mockSupabaseService;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    
    // ProgressTrackingServiceのインスタンス取得（シングルトン）
    progressTrackingService = ProgressTrackingService;
  });

  afterEach(() => {
    if (progressTrackingService) {
      progressTrackingService.destroy?.();
    }
  });

  describe('constructor', () => {
    test('should initialize with Supabase client', () => {
      expect(progressTrackingService).toBeDefined();
      expect(progressTrackingService.supabase).toBeDefined();
    });
  });

  describe('basic functionality', () => {
    test('should have required properties', () => {
      expect(progressTrackingService).toBeDefined();
      expect(typeof progressTrackingService).toBe('object');
    });
  });
});