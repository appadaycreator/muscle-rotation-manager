// MuscleGroupService.test.js - MuscleGroupServiceクラスのテスト

import { muscleGroupService as MuscleGroupService } from '../../js/services/muscleGroupService.js';

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

describe('MuscleGroupService', () => {
  let muscleGroupService;
  let mockSupabaseService;
  let mockHandleError;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // モジュールの取得
    const supabaseServiceModule = require('../../js/services/supabaseService.js');
    mockSupabaseService = supabaseServiceModule.supabaseService;
    mockHandleError = require('../../js/utils/errorHandler.js').handleError;

    muscleGroupService = MuscleGroupService;
  });

  describe('constructor', () => {
    test('should initialize with Supabase client', () => {
      expect(muscleGroupService).toBeDefined();
    });
  });
});