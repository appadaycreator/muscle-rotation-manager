// MuscleGroupService.test.js - MuscleGroupServiceクラスのテスト

import MuscleGroupService from '../../js/services/muscleGroupService.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(() => true),
    fetchData: jest.fn(),
    saveData: jest.fn(),
    updateData: jest.fn(),
    deleteData: jest.fn(),
  },
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn(),
}));

describe('MuscleGroupService', () => {
  let muscleGroupService;
  let mockSupabaseService;
  let mockShowNotification;
  let mockHandleError;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseService = require('../../js/services/supabaseService.js').supabaseService;
    mockShowNotification = require('../../js/utils/helpers.js').showNotification;
    mockHandleError = require('../../js/utils/errorHandler.js').handleError;

    muscleGroupService = new MuscleGroupService();
  });

  describe('constructor', () => {
    test('should initialize with Supabase client', () => {
      expect(muscleGroupService.supabase).toBe(mockSupabaseService);
    });
  });

  describe('get muscle groups', () => {
    test('should get all muscle groups successfully', async () => {
      const mockData = [
        { id: '1', name_ja: '胸筋', name_en: 'Chest' },
        { id: '2', name_ja: '背筋', name_en: 'Back' },
        { id: '3', name_ja: '肩', name_en: 'Shoulders' }
      ];

      mockSupabaseService.fetchData.mockResolvedValue(mockData);

      const result = await muscleGroupService.getMuscleGroups();

      expect(result).toEqual(mockData);
      expect(mockSupabaseService.fetchData).toHaveBeenCalledWith('muscle_groups');
    });

    test('should handle get muscle groups error', async () => {
      const error = new Error('Database connection failed');
      mockSupabaseService.fetchData.mockRejectedValue(error);

      const result = await muscleGroupService.getMuscleGroups();

      expect(result).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.getMuscleGroups',
        showNotification: true,
        severity: 'error'
      });
    });

    test('should get muscle group by ID', async () => {
      const mockData = { id: '1', name_ja: '胸筋', name_en: 'Chest' };
      mockSupabaseService.fetchData.mockResolvedValue(mockData);

      const result = await muscleGroupService.getMuscleGroupById('1');

      expect(result).toEqual(mockData);
      expect(mockSupabaseService.fetchData).toHaveBeenCalledWith('muscle_groups', { id: '1' });
    });

    test('should handle get muscle group by ID error', async () => {
      const error = new Error('Muscle group not found');
      mockSupabaseService.fetchData.mockRejectedValue(error);

      const result = await muscleGroupService.getMuscleGroupById('999');

      expect(result).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.getMuscleGroupById',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('create muscle group', () => {
    test('should create muscle group successfully', async () => {
      const muscleGroupData = {
        name_ja: '腹筋',
        name_en: 'Abs',
        description: '腹部の筋肉群'
      };

      const mockResponse = { id: '4', ...muscleGroupData };
      mockSupabaseService.saveData.mockResolvedValue(mockResponse);

      const result = await muscleGroupService.createMuscleGroup(muscleGroupData);

      expect(result).toEqual(mockResponse);
      expect(mockSupabaseService.saveData).toHaveBeenCalledWith('muscle_groups', muscleGroupData);
    });

    test('should handle create muscle group error', async () => {
      const muscleGroupData = {
        name_ja: '腹筋',
        name_en: 'Abs'
      };

      const error = new Error('Validation failed');
      mockSupabaseService.saveData.mockRejectedValue(error);

      const result = await muscleGroupService.createMuscleGroup(muscleGroupData);

      expect(result).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.createMuscleGroup',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('update muscle group', () => {
    test('should update muscle group successfully', async () => {
      const muscleGroupId = '1';
      const updateData = {
        name_ja: '大胸筋',
        name_en: 'Pectorals'
      };

      const mockResponse = { id: muscleGroupId, ...updateData };
      mockSupabaseService.updateData.mockResolvedValue(mockResponse);

      const result = await muscleGroupService.updateMuscleGroup(muscleGroupId, updateData);

      expect(result).toEqual(mockResponse);
      expect(mockSupabaseService.updateData).toHaveBeenCalledWith('muscle_groups', muscleGroupId, updateData);
    });

    test('should handle update muscle group error', async () => {
      const muscleGroupId = '999';
      const updateData = { name_ja: 'Updated Name' };

      const error = new Error('Muscle group not found');
      mockSupabaseService.updateData.mockRejectedValue(error);

      const result = await muscleGroupService.updateMuscleGroup(muscleGroupId, updateData);

      expect(result).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.updateMuscleGroup',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('delete muscle group', () => {
    test('should delete muscle group successfully', async () => {
      const muscleGroupId = '1';
      mockSupabaseService.deleteData.mockResolvedValue(true);

      const result = await muscleGroupService.deleteMuscleGroup(muscleGroupId);

      expect(result).toBe(true);
      expect(mockSupabaseService.deleteData).toHaveBeenCalledWith('muscle_groups', muscleGroupId);
    });

    test('should handle delete muscle group error', async () => {
      const muscleGroupId = '999';

      const error = new Error('Cannot delete muscle group with associated exercises');
      mockSupabaseService.deleteData.mockRejectedValue(error);

      const result = await muscleGroupService.deleteMuscleGroup(muscleGroupId);

      expect(result).toBe(false);
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.deleteMuscleGroup',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('muscle group validation', () => {
    test('should validate muscle group data', () => {
      const validData = {
        name_ja: '胸筋',
        name_en: 'Chest',
        description: '胸部の筋肉群'
      };

      const isValid = muscleGroupService.validateMuscleGroupData(validData);
      expect(isValid).toBe(true);
    });

    test('should reject invalid muscle group data', () => {
      const invalidData = {
        name_ja: '', // Empty name
        name_en: 'Chest'
      };

      const isValid = muscleGroupService.validateMuscleGroupData(invalidData);
      expect(isValid).toBe(false);
    });

    test('should validate muscle group ID', () => {
      const validId = '1';
      const invalidId = '';

      expect(muscleGroupService.validateMuscleGroupId(validId)).toBe(true);
      expect(muscleGroupService.validateMuscleGroupId(invalidId)).toBe(false);
    });
  });

  describe('muscle group search', () => {
    test('should search muscle groups by name', async () => {
      const searchTerm = '胸';
      const mockData = [
        { id: '1', name_ja: '胸筋', name_en: 'Chest' }
      ];

      mockSupabaseService.fetchData.mockResolvedValue(mockData);

      const result = await muscleGroupService.searchMuscleGroups(searchTerm);

      expect(result).toEqual(mockData);
      expect(mockSupabaseService.fetchData).toHaveBeenCalledWith('muscle_groups', {
        search: searchTerm
      });
    });

    test('should handle search error', async () => {
      const searchTerm = 'invalid';
      const error = new Error('Search failed');
      mockSupabaseService.fetchData.mockRejectedValue(error);

      const result = await muscleGroupService.searchMuscleGroups(searchTerm);

      expect(result).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.searchMuscleGroups',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('muscle group statistics', () => {
    test('should get muscle group statistics', async () => {
      const mockData = {
        totalMuscleGroups: 10,
        activeMuscleGroups: 8,
        exercisesPerGroup: {
          '1': 15,
          '2': 12,
          '3': 8
        }
      };

      mockSupabaseService.fetchData.mockResolvedValue(mockData);

      const result = await muscleGroupService.getMuscleGroupStats();

      expect(result).toEqual(mockData);
      expect(mockSupabaseService.fetchData).toHaveBeenCalledWith('muscle_group_stats');
    });

    test('should handle statistics error', async () => {
      const error = new Error('Statistics calculation failed');
      mockSupabaseService.fetchData.mockRejectedValue(error);

      const result = await muscleGroupService.getMuscleGroupStats();

      expect(result).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.getMuscleGroupStats',
        showNotification: true,
        severity: 'error'
      });
    });
  });

  describe('muscle group relationships', () => {
    test('should get exercises for muscle group', async () => {
      const muscleGroupId = '1';
      const mockData = [
        { id: '1', name: 'ベンチプレス', muscle_group_id: '1' },
        { id: '2', name: 'プッシュアップ', muscle_group_id: '1' }
      ];

      mockSupabaseService.fetchData.mockResolvedValue(mockData);

      const result = await muscleGroupService.getExercisesForMuscleGroup(muscleGroupId);

      expect(result).toEqual(mockData);
      expect(mockSupabaseService.fetchData).toHaveBeenCalledWith('exercises', {
        muscle_group_id: muscleGroupId
      });
    });

    test('should handle get exercises error', async () => {
      const muscleGroupId = '999';
      const error = new Error('Exercises not found');
      mockSupabaseService.fetchData.mockRejectedValue(error);

      const result = await muscleGroupService.getExercisesForMuscleGroup(muscleGroupId);

      expect(result).toBeNull();
      expect(mockHandleError).toHaveBeenCalledWith(error, {
        context: 'MuscleGroupService.getExercisesForMuscleGroup',
        showNotification: true,
        severity: 'error'
      });
    });
  });
});
