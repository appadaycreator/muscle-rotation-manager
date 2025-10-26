// progressiveOverloadService.test.js - ProgressiveOverloadServiceクラスのテスト

import { ProgressiveOverloadService } from '../../js/services/progressiveOverloadService.js';

// モックの設定
jest.mock('../../js/services/workoutDataService.js', () => ({
  workoutDataService: {
    loadWorkouts: jest.fn(),
  },
}));

describe('ProgressiveOverloadService', () => {
  let serviceInstance;
  let mockWorkoutDataService;

  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();

    // モジュールの取得
    const workoutDataServiceModule = require('../../js/services/workoutDataService.js');
    mockWorkoutDataService = workoutDataServiceModule.workoutDataService;

    // ProgressiveOverloadServiceのインスタンス作成
    serviceInstance = new ProgressiveOverloadService();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(serviceInstance.analysisCache).toBeInstanceOf(Map);
      expect(serviceInstance.cacheExpiry).toBe(5 * 60 * 1000); // 5分間
    });
  });

  describe('cache management', () => {
    test('should set and get cached analysis', () => {
      const mockAnalysis = { test: 'data' };
      const cacheKey = 'test_key';

      serviceInstance.setCachedAnalysis(cacheKey, mockAnalysis);
      const result = serviceInstance.getCachedAnalysis(cacheKey);

      expect(result).toEqual(mockAnalysis);
    });

    test('should return null for expired cache', () => {
      const mockAnalysis = { test: 'data' };
      const cacheKey = 'test_key';

      // 古いタイムスタンプでキャッシュを設定
      serviceInstance.analysisCache.set(cacheKey, {
        data: mockAnalysis,
        timestamp: Date.now() - (serviceInstance.cacheExpiry + 1000),
      });

      const result = serviceInstance.getCachedAnalysis(cacheKey);

      expect(result).toBeNull();
    });

    test('should return null for non-existent cache', () => {
      const result = serviceInstance.getCachedAnalysis('non_existent_key');

      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    test('should clear all cached analysis', () => {
      serviceInstance.setCachedAnalysis('key1', { data: 'test1' });
      serviceInstance.setCachedAnalysis('key2', { data: 'test2' });

      expect(serviceInstance.analysisCache.size).toBe(2);

      serviceInstance.clearCache();

      expect(serviceInstance.analysisCache.size).toBe(0);
    });
  });

  describe('getExerciseProgress', () => {
    test('should return cached analysis if available', async () => {
      const mockAnalysis = {
        exerciseName: 'ベンチプレス',
        period: 90,
        totalSessions: 10,
        progressMetrics: {},
        volumeProgression: 15,
        intensityProgression: 10,
        recommendations: [],
        trends: {},
        lastUpdated: new Date().toISOString(),
      };

      // キャッシュにデータを設定
      serviceInstance.setCachedAnalysis('exercise_ベンチプレス_90', mockAnalysis);

      const result = await serviceInstance.getExerciseProgress('ベンチプレス', 90);

      expect(result).toEqual(mockAnalysis);
      expect(mockWorkoutDataService.loadWorkouts).not.toHaveBeenCalled();
    });

    test('should handle analysis error', async () => {
      const error = new Error('Analysis failed');
      mockWorkoutDataService.loadWorkouts.mockRejectedValue(error);

      await expect(serviceInstance.getExerciseProgress('ベンチプレス', 90))
        .rejects.toThrow('Analysis failed');
    });
  });

  describe('getMuscleGroupProgress', () => {
    test('should return cached analysis if available', async () => {
      const mockAnalysis = {
        muscleGroup: 'chest',
        period: 90,
        totalSessions: 15,
        frequencyAnalysis: {},
        exercises: {},
        recommendations: [],
        lastUpdated: new Date().toISOString(),
      };

      serviceInstance.setCachedAnalysis('muscle_chest_90', mockAnalysis);

      const result = await serviceInstance.getMuscleGroupProgress('chest', 90);

      expect(result).toEqual(mockAnalysis);
      expect(mockWorkoutDataService.loadWorkouts).not.toHaveBeenCalled();
    });
  });

  describe('getOverallProgress', () => {
    test('should return cached analysis if available', async () => {
      const mockAnalysis = {
        period: 90,
        totalWorkouts: 20,
        overallMetrics: {},
        muscleGroupProgress: {},
        consistencyScore: 85,
        recommendations: [],
        lastUpdated: new Date().toISOString(),
      };

      serviceInstance.setCachedAnalysis('overall_90', mockAnalysis);

      const result = await serviceInstance.getOverallProgress(90);

      expect(result).toEqual(mockAnalysis);
      expect(mockWorkoutDataService.loadWorkouts).not.toHaveBeenCalled();
    });
  });

  describe('filterExerciseData', () => {
    test('should filter workouts by exercise name', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
      
      const mockWorkouts = [
        {
          id: '1',
          date: recentDate.toISOString(),
          exercises: [
            { name: 'ベンチプレス', sets: 3, reps: 10, weight: 80 },
          ],
        },
        {
          id: '2',
          date: recentDate.toISOString(),
          exercises: [
            { name: 'スクワット', sets: 3, reps: 12, weight: 100 },
          ],
        },
      ];

      const result = serviceInstance.filterExerciseData(mockWorkouts, 'ベンチプレス', 90);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].exerciseData).toHaveLength(1);
      expect(result[0].exerciseData[0].name).toBe('ベンチプレス');
    });

    test('should handle empty workouts array', () => {
      const result = serviceInstance.filterExerciseData([], 'ベンチプレス', 90);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateProgressMetrics', () => {
    test('should calculate metrics from exercise data', () => {
      const now = new Date();
      const recentDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
      const recentDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14日前
      
      const mockExerciseData = [
        {
          exerciseData: [
            { weight: 80, reps: 10, sets: 3 },
          ],
          date: recentDate1.toISOString(),
        },
        {
          exerciseData: [
            { weight: 85, reps: 10, sets: 3 },
          ],
          date: recentDate2.toISOString(),
        },
      ];

      const result = serviceInstance.calculateProgressMetrics(mockExerciseData);

      expect(result).toBeDefined();
      expect(result.averageWeight).toBeGreaterThan(0);
      expect(result.averageReps).toBeGreaterThan(0);
      expect(result.averageSets).toBeGreaterThan(0);
      expect(result.volumeProgression).toBeDefined();
      expect(result.intensityProgression).toBeDefined();
      expect(result.totalSessions).toBe(2);
    });

    test('should handle empty exercise data', () => {
      const result = serviceInstance.calculateProgressMetrics([]);

      expect(result.averageWeight).toBe(0);
      expect(result.averageReps).toBe(0);
      expect(result.averageSets).toBe(0);
      expect(result.volumeProgression).toBe(0);
      expect(result.intensityProgression).toBe(0);
      expect(result.consistencyScore).toBe(0);
    });
  });

  describe('calculateVolumeProgression', () => {
    test('should calculate volume progression', () => {
      const now = new Date();
      const recentDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
      const recentDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14日前
      
      const mockExerciseData = [
        {
          exerciseData: [
            { weight: 80, reps: 10, sets: 3 },
          ],
          date: recentDate1.toISOString(),
        },
        {
          exerciseData: [
            { weight: 85, reps: 10, sets: 3 },
          ],
          date: recentDate2.toISOString(),
        },
      ];

      const result = serviceInstance.calculateVolumeProgression(mockExerciseData);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle single session', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
      
      const mockExerciseData = [
        {
          exerciseData: [
            { weight: 80, reps: 10, sets: 3 },
          ],
          date: recentDate.toISOString(),
        },
      ];

      const result = serviceInstance.calculateVolumeProgression(mockExerciseData);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('calculateIntensityProgression', () => {
    test('should calculate intensity progression', () => {
      const now = new Date();
      const recentDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
      const recentDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14日前
      
      const mockExerciseData = [
        {
          exerciseData: [
            { weight: 80, reps: 10, sets: 3 },
          ],
          date: recentDate1.toISOString(),
        },
        {
          exerciseData: [
            { weight: 85, reps: 10, sets: 3 },
          ],
          date: recentDate2.toISOString(),
        },
      ];

      const result = serviceInstance.calculateIntensityProgression(mockExerciseData);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateRecommendations', () => {
    test('should generate recommendations based on exercise data', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
      
      const mockExerciseData = [
        {
          exerciseData: [
            { weight: 80, reps: 10, sets: 3 },
          ],
          date: recentDate.toISOString(),
        },
      ];

      const result = serviceInstance.generateRecommendations(mockExerciseData);

      expect(Array.isArray(result)).toBe(true);
      result.forEach(rec => {
        expect(rec).toHaveProperty('message');
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('priority');
      });
    });
  });

  describe('analyzeTrends', () => {
    test('should analyze trends from exercise data', () => {
      const now = new Date();
      const recentDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
      const recentDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14日前
      
      const mockExerciseData = [
        {
          exerciseData: [
            { weight: 80, reps: 10, sets: 3 },
          ],
          date: recentDate1.toISOString(),
        },
        {
          exerciseData: [
            { weight: 85, reps: 10, sets: 3 },
          ],
          date: recentDate2.toISOString(),
        },
      ];

      const result = serviceInstance.analyzeTrends(mockExerciseData);

      expect(result).toBeDefined();
      expect(result.weightTrend).toBeDefined();
      expect(result.volumeTrend).toBeDefined();
    });
  });
});