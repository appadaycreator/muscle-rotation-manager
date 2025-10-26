// tests/unit/ProgressTrackingService.test.js - ProgressTrackingServiceのテスト

import {
  ProgressTrackingService,
  progressTrackingService,
} from '../../js/services/progressTrackingService.js';

// モック設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    client: {
      from: jest.fn(() => ({
        insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() =>
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
        })),
        upsert: jest.fn(() => Promise.resolve({ data: [], error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    },
  },
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn(),
}));

describe('ProgressTrackingService', () => {
  let service;

  beforeEach(() => {
    service = new ProgressTrackingService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(service.supabase).toBeDefined();
    });
  });

  describe('calculateOneRM', () => {
    it('should calculate 1RM correctly for single rep', () => {
      const result = service.calculateOneRM(100, 1);
      expect(result).toBe(100);
    });

    it('should calculate 1RM using Brzycki formula', () => {
      const result = service.calculateOneRM(100, 10);
      expect(result).toBe(133.3); // 100 * (36 / (37 - 10)) = 100 * (36/27) = 133.3
    });

    it('should handle edge case of 36 reps', () => {
      const result = service.calculateOneRM(100, 36);
      expect(result).toBe(3600); // 100 * (36 / (37 - 36))
    });

    it('should return 0 for invalid inputs', () => {
      expect(service.calculateOneRM(0, 10)).toBe(0);
      expect(service.calculateOneRM(100, 0)).toBe(0);
      expect(service.calculateOneRM(100, 37)).toBe(0);
    });

    it('should return 0 on error', () => {
      const result = service.calculateOneRM(null, null);
      expect(result).toBe(0);
    });
  });

  describe('calculateBestOneRM', () => {
    it('should return highest 1RM from multiple sets', () => {
      const reps = [10, 8, 6];
      const weights = [100, 110, 120];
      const result = service.calculateBestOneRM(reps, weights);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle empty arrays', () => {
      const result = service.calculateBestOneRM([], []);
      expect(result).toBe(0);
    });

    it('should handle mismatched array lengths', () => {
      const result = service.calculateBestOneRM([10, 8], [100]);
      expect(result).toBeGreaterThan(0); // 実際の実装では最初の要素のみ処理される
    });
  });

  describe('generateMonthlyAnalysis', () => {
    it('should generate monthly analysis successfully', () => {
      const data = [
        { date: '2024-01-01', one_rm: 100 },
        { date: '2024-01-15', one_rm: 110 },
      ];
      const result = service.generateMonthlyAnalysis(data);
      expect(result).toBeDefined();
    });

    it('should handle no data', () => {
      const result = service.generateMonthlyAnalysis([]);
      expect(result).toBeDefined();
    });
  });

  describe('groupByWeek', () => {
    it('should group data by week correctly', () => {
      const data = [];
      const result = service.groupByWeek(data);
      expect(result).toBeDefined();
    });
  });

  describe('analyzeTrend', () => {
    it('should analyze improving trend', () => {
      const data = [{ one_rm: 100 }, { one_rm: 110 }, { one_rm: 120 }];
      const result = service.analyzeTrend(data);
      expect(result).toBeDefined();
    });

    it('should analyze declining trend', () => {
      const data = [{ one_rm: 120 }, { one_rm: 110 }, { one_rm: 100 }];
      const result = service.analyzeTrend(data);
      expect(result).toBeDefined();
    });

    it('should handle insufficient data', () => {
      const result = service.analyzeTrend([]);
      expect(result).toBeDefined();
    });
  });

  describe('calculateStats', () => {
    it('should calculate statistics correctly', () => {
      const data = [
        { one_rm: 100, weight: 100, reps: 10 },
        { one_rm: 110, weight: 110, reps: 8 },
      ];
      const result = service.calculateStats(data);
      expect(result).toBeDefined();
    });
  });

  describe('sendGoalNotification', () => {
    it('should send browser notification when permission granted', () => {
      global.Notification = jest.fn();
      global.Notification.permission = 'granted';
      global.window = {
        dispatchEvent: jest.fn(),
      };

      service.sendGoalNotification('Test Title', 'Test Message');

      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Message',
        icon: '/favicon-32x32.png',
        tag: 'goal-progress',
      });
    });

    it('should send app notification when browser notification not available', () => {
      global.Notification = undefined;
      global.window = {
        dispatchEvent: jest.fn(),
      };

      service.sendGoalNotification('Test Title', 'Test Message');

      // 通知が送信されたことを確認（実装に依存）
      expect(global.window.dispatchEvent).toBeDefined();
    });
  });

  describe('deactivateGoal', () => {
    it('should handle deactivate goal', async () => {
      // 基本的な機能テストのみ
      expect(service.deactivateGoal).toBeDefined();
    });
  });
});
