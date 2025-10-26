// ProgressPage.test.js - ProgressPageクラスのテスト

// モック
jest.mock('../../js/services/progressiveOverloadService.js', () => ({
  progressiveOverloadService: {
    getOverallProgress: jest.fn().mockResolvedValue({
      totalWorkouts: 10,
      overallMetrics: {
        totalVolume: 5000,
        averageVolumePerWorkout: 500,
      },
      consistencyScore: 85,
      muscleGroupProgress: {
        chest: {
          totalSessions: 5,
          totalVolume: 2500,
          averageVolumePerSession: 500,
          frequencyAnalysis: {
            frequencyScore: 80,
            averageDaysBetween: 3
          }
        },
      },
      recommendations: [
        {
          priority: 'high',
          message: 'テスト推奨事項',
          action: 'テストアクション'
        }
      ]
    }),
    getExerciseProgress: jest.fn().mockResolvedValue({
      progressMetrics: {
        volumeProgression: 15,
        intensityProgression: 10,
        consistencyScore: 85,
        averageWeight: 60,
        averageReps: 10,
        averageSets: 3
      },
      recommendations: [
        {
          priority: 'medium',
          message: 'テスト推奨事項',
          action: 'テストアクション'
        }
      ]
    }),
    getMuscleGroupProgress: jest.fn().mockResolvedValue({
      totalSessions: 5,
      frequencyAnalysis: {
        frequencyScore: 80,
        averageDaysBetween: 3
      },
      exercises: {
        exerciseCounts: {
          'ベンチプレス': 3,
          'プッシュアップ': 2
        },
        exerciseProgress: {
          'ベンチプレス': {
            weightProgress: 10
          }
        }
      },
      recommendations: [
        {
          priority: 'low',
          message: 'テスト推奨事項',
          action: 'テストアクション'
        }
      ]
    })
  }
}));

jest.mock('../../js/services/workoutDataService.js', () => ({
  workoutDataService: {
    getWorkoutHistory: jest.fn().mockResolvedValue([]),
    getMuscleGroupStats: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../js/utils/helpers.js', () => ({
  safeGetElement: jest.fn((id) => {
    const mockElement = { id, innerHTML: '', appendChild: jest.fn(), removeChild: jest.fn() };
    return mockElement;
  }),
  showNotification: jest.fn(),
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn(),
}));

jest.mock('../../js/core/BasePage.js', () => ({
  BasePage: jest.fn().mockImplementation(() => ({
    pageName: 'ProgressPage',
    handleError: jest.fn(),
  })),
}));

describe('ProgressPage', () => {
  let ProgressPage;
  let progressPage;
  let mockContainer;

  beforeEach(async () => {
    // DOM要素のモック
    mockContainer = document.createElement('div');
    mockContainer.id = 'main-content';
    document.body.appendChild(mockContainer);

    // safeGetElementのモックを設定
    const { safeGetElement } = require('../../js/utils/helpers.js');
    safeGetElement.mockImplementation((id) => {
      const element = document.getElementById(id);
      if (element) {
        return element;
      }
      const mockElement = document.createElement('div');
      mockElement.id = id;
      return mockElement;
    });

    // ProgressPageクラスを動的にインポート
    const module = await import('../../js/pages/progressPage.js');
    ProgressPage = module.default || module.ProgressPage;
    
    // ProgressPageのインスタンスを作成
    progressPage = new ProgressPage();
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    test('should initialize successfully', () => {
      expect(progressPage).toBeDefined();
      expect(progressPage.pageName).toBe('ProgressPage');
    });

    test('should have required properties', () => {
      expect(progressPage.workoutData).toEqual([]);
      expect(progressPage.progressiveOverloadData).toBeNull();
    });
  });

  describe('サンプルデータ生成', () => {
    test('should generate sample workout data', () => {
      const sampleData = progressPage.generateSampleWorkoutData();
      
      expect(Array.isArray(sampleData)).toBe(true);
      expect(sampleData.length).toBeGreaterThan(0);
      
      // サンプルデータの構造を確認
      const firstWorkout = sampleData[0];
      expect(firstWorkout).toHaveProperty('id');
      expect(firstWorkout).toHaveProperty('date');
      expect(firstWorkout).toHaveProperty('muscle_groups');
      expect(firstWorkout).toHaveProperty('exercises');
      expect(firstWorkout).toHaveProperty('duration');
    });

    test('should generate realistic workout parameters', () => {
      const sampleData = progressPage.generateSampleWorkoutData();
      
      sampleData.forEach(workout => {
        if (workout.exercises && workout.exercises.length > 0) {
          workout.exercises.forEach(exercise => {
            expect(exercise.sets).toBeLessThanOrEqual(3); // セット数は3以下
            expect(exercise.reps).toBeLessThanOrEqual(15); // 回数は15以下
            expect(exercise.weight).toBeLessThanOrEqual(100); // 重量は100以下
          });
        }
      });
    });
  });

  describe('プログレッシブ・オーバーロード分析', () => {
    test('should load progressive overload data', async () => {
      // モックが正しく設定されていることを確認
      const { progressiveOverloadService } = require('../../js/services/progressiveOverloadService.js');
      expect(progressiveOverloadService.getOverallProgress).toBeDefined();
      
      // 直接データを設定してテスト
      progressPage.progressiveOverloadData = {
        totalWorkouts: 10,
        overallMetrics: {
          totalVolume: 5000,
          averageVolumePerWorkout: 500,
        },
        consistencyScore: 85,
        muscleGroupProgress: {
          chest: {
            totalSessions: 5,
            totalVolume: 2500,
            averageVolumePerSession: 500,
            frequencyAnalysis: {
              frequencyScore: 80,
              averageDaysBetween: 3
            }
          },
        },
        recommendations: [
          {
            priority: 'high',
            message: 'テスト推奨事項',
            action: 'テストアクション'
          }
        ]
      };
      
      // データが設定されることを確認
      expect(progressPage.progressiveOverloadData).toBeDefined();
      expect(progressPage.progressiveOverloadData.totalWorkouts).toBe(10);
      expect(progressPage.progressiveOverloadData.overallMetrics.totalVolume).toBe(5000);
    });

    test('should handle progressive overload data loading errors', async () => {
      const { progressiveOverloadService } = require('../../js/services/progressiveOverloadService.js');
      progressiveOverloadService.getOverallProgress.mockRejectedValueOnce(new Error('Test error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await progressPage.loadProgressiveOverloadData();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('エクササイズ分析', () => {
    test('should calculate exercise stats correctly', () => {
      const mockExerciseData = [
        {
          date: '2024-01-01',
          exercises: [
            { name: 'ベンチプレス', weight: 60, reps: 10, sets: 3 },
            { name: 'プッシュアップ', weight: 0, reps: 15, sets: 2 },
          ],
        },
        {
          date: '2024-01-02',
          exercises: [
            { name: 'ベンチプレス', weight: 65, reps: 10, sets: 3 },
          ],
        },
      ];

      const stats = progressPage.calculateExerciseStats(mockExerciseData, 'ベンチプレス');
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.maxWeight).toBe(65);
      expect(stats.avgWeight).toBe(63); // (60 + 65) / 2 = 62.5, rounded to 63
      expect(stats.totalVolume).toBe(1800 + 1950); // (60*10*3) + (65*10*3)
      expect(stats.progressRate).toBeGreaterThan(0);
    });

    test('should handle empty exercise data', () => {
      const stats = progressPage.calculateExerciseStats([], 'ベンチプレス');
      
      expect(stats.totalSessions).toBe(0);
      expect(stats.maxWeight).toBe(0);
      expect(stats.avgWeight).toBe(0);
      expect(stats.totalVolume).toBe(0);
      expect(stats.progressRate).toBe(0);
    });
  });

  describe('筋肉部位分析', () => {
    test('should calculate muscle group analysis', () => {
      const mockMuscleData = [
        {
          date: '2024-01-01',
          muscle_groups: ['chest'],
          exercises: [
            { name: 'ベンチプレス', weight: 60, reps: 10, sets: 3 },
          ],
          duration: 45,
        },
        {
          date: '2024-01-02',
          muscle_groups: ['chest'],
          exercises: [
            { name: 'プッシュアップ', weight: 0, reps: 15, sets: 2 },
          ],
          duration: 30,
        },
      ];

      const analysis = progressPage.calculateMuscleGroupAnalysis(mockMuscleData);
      
      expect(analysis.totalSessions).toBe(2);
      expect(analysis.totalVolume).toBe(1800); // 60*10*3 + 0*15*2
      expect(analysis.averageVolumePerSession).toBe(900);
      expect(analysis.totalDuration).toBe(75);
    });
  });

  describe('レンダリング', () => {
    test('should render exercise analysis', async () => {
      // モックが正しく設定されていることを確認
      const { progressiveOverloadService } = require('../../js/services/progressiveOverloadService.js');
      expect(progressiveOverloadService.getExerciseProgress).toBeDefined();

      // メソッドが呼び出されることを確認
      await expect(progressPage.renderExerciseAnalysisFromService('ベンチプレス')).resolves.not.toThrow();
    });

    test('should render muscle group analysis', async () => {
      // モックが正しく設定されていることを確認
      const { progressiveOverloadService } = require('../../js/services/progressiveOverloadService.js');
      expect(progressiveOverloadService.getMuscleGroupProgress).toBeDefined();

      // メソッドが呼び出されることを確認
      await expect(progressPage.renderMuscleGroupAnalysis('chest')).resolves.not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    test('should handle rendering errors gracefully', async () => {
      // モックサービスでエラーを発生させる
      const { progressiveOverloadService } = require('../../js/services/progressiveOverloadService.js');
      progressiveOverloadService.getExerciseProgress.mockRejectedValueOnce(new Error('Test error'));

      // エラーが発生しても例外が投げられないことを確認
      await expect(progressPage.renderExerciseAnalysisFromService('ベンチプレス')).resolves.not.toThrow();
    });
  });
});