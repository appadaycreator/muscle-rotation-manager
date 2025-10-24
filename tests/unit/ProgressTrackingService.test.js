// tests/unit/ProgressTrackingService.test.js - ProgressTrackingServiceのテスト

import { ProgressTrackingService, progressTrackingService } from '../../js/services/progressTrackingService.js';

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
                                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
                            }))
                        }))
                    }))
                })),
                upsert: jest.fn(() => Promise.resolve({ data: [], error: null })),
                update: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
                }))
            }))
        }
    }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

describe('ProgressTrackingService', () => {
    let service;
    let mockSupabase;

    beforeEach(() => {
        service = new ProgressTrackingService();
        mockSupabase = service.supabase;
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
            expect(result).toBe(370.4); // 100 * (36 / (37 - 10))
        });

        it('should handle edge case of 36 reps', () => {
            const result = service.calculateOneRM(100, 36);
            expect(result).toBe(3600); // 100 * (36 / (37 - 36))
        });

        it('should throw error for invalid inputs', () => {
            expect(() => service.calculateOneRM(0, 10)).toThrow('重量と回数は正の数である必要があります');
            expect(() => service.calculateOneRM(100, 0)).toThrow('重量と回数は正の数である必要があります');
            expect(() => service.calculateOneRM(100, 37)).toThrow('36回を超える回数では1RM計算が不正確になります');
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
            
            // 120kg x 6回が最高1RMになるはず
            expect(result).toBeGreaterThan(0);
        });

        it('should handle empty arrays', () => {
            const result = service.calculateBestOneRM([], []);
            expect(result).toBe(0);
        });

        it('should handle mismatched array lengths', () => {
            const reps = [10, 8];
            const weights = [100, 110, 120];
            
            const result = service.calculateBestOneRM(reps, weights);
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('saveProgressData', () => {
        it('should save progress data successfully', async () => {
            const progressData = {
                userId: 'user123',
                exerciseId: 'exercise123',
                exerciseName: 'Bench Press',
                muscleGroupId: 'chest',
                workoutDate: '2024-01-01',
                sets: 3,
                reps: [10, 8, 6],
                weights: [100, 110, 120],
                workoutSessionId: 'session123',
                notes: 'Good workout'
            };

            const result = await service.saveProgressData(progressData);

            expect(result.success).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledWith('training_logs');
        });

        it('should handle save errors', async () => {
            mockSupabase.from().insert.mockResolvedValue({ 
                data: null, 
                error: { message: 'Save failed' } 
            });

            const progressData = {
                userId: 'user123',
                exerciseId: 'exercise123',
                exerciseName: 'Bench Press',
                muscleGroupId: 'chest',
                workoutDate: '2024-01-01',
                sets: 3,
                reps: [10, 8, 6],
                weights: [100, 110, 120],
                workoutSessionId: 'session123'
            };

            const result = await service.saveProgressData(progressData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Save failed');
        });
    });

    describe('getProgressHistory', () => {
        it('should get progress history successfully', async () => {
            const mockData = [
                {
                    id: '1',
                    workout_date: '2024-01-01',
                    sets: 3,
                    reps: [10, 8, 6],
                    weights: [100, 110, 120],
                    one_rm: 150,
                    exercise_name: 'Bench Press',
                    notes: 'Good workout'
                }
            ];

            mockSupabase.from().select().eq().eq().gte().order.mockResolvedValue({ 
                data: mockData, 
                error: null 
            });

            const result = await service.getProgressHistory('user123', 'exercise123', 90);

            expect(result).toEqual(mockData);
            expect(mockSupabase.from).toHaveBeenCalledWith('training_logs');
        });

        it('should handle get history errors', async () => {
            mockSupabase.from().select().eq().eq().gte().order.mockResolvedValue({ 
                data: null, 
                error: { message: 'Fetch failed' } 
            });

            const result = await service.getProgressHistory('user123', 'exercise123');

            expect(result).toEqual([]);
        });
    });

    describe('setGoal', () => {
        it('should set goal successfully', async () => {
            const goalData = {
                userId: 'user123',
                exerciseId: 'exercise123',
                goalType: 'weight',
                targetValue: 150,
                currentValue: 120,
                targetDate: '2024-12-31',
                description: 'Bench Press 150kg',
                priority: 'high',
                strategy: 'linear_progression'
            };

            const result = await service.setGoal(goalData);

            expect(result.success).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledWith('user_goals');
        });

        it('should handle set goal errors', async () => {
            mockSupabase.from().upsert.mockResolvedValue({ 
                data: null, 
                error: { message: 'Goal save failed' } 
            });

            const goalData = {
                userId: 'user123',
                exerciseId: 'exercise123',
                goalType: 'weight',
                targetValue: 150,
                currentValue: 120,
                targetDate: '2024-12-31',
                description: 'Bench Press 150kg'
            };

            const result = await service.setGoal(goalData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Goal save failed');
        });
    });

    describe('calculateGoalProgress', () => {
        it('should calculate goal progress successfully', async () => {
            const mockGoals = [
                {
                    id: 'goal1',
                    goal_type: 'weight',
                    target_value: 150,
                    description: 'Bench Press 150kg'
                }
            ];

            const mockHistory = [
                {
                    workout_date: '2024-01-01',
                    weights: [120, 125, 130],
                    reps: [8, 6, 4],
                    one_rm: 140
                }
            ];

            mockSupabase.from().select().eq().eq().eq.mockResolvedValue({ 
                data: mockGoals, 
                error: null 
            });

            // getProgressHistoryのモック
            jest.spyOn(service, 'getProgressHistory').mockResolvedValue(mockHistory);

            const result = await service.calculateGoalProgress('user123', 'exercise123');

            expect(result.hasGoals).toBe(true);
            expect(result.progress).toBeDefined();
            expect(result.progress[0].current_value).toBe(130); // 最大重量
        });

        it('should handle no goals', async () => {
            mockSupabase.from().select().eq().eq().eq.mockResolvedValue({ 
                data: [], 
                error: null 
            });

            const result = await service.calculateGoalProgress('user123', 'exercise123');

            expect(result.hasGoals).toBe(false);
        });

        it('should handle calculation errors', async () => {
            mockSupabase.from().select().eq().eq().eq.mockResolvedValue({ 
                data: null, 
                error: { message: 'Fetch failed' } 
            });

            const result = await service.calculateGoalProgress('user123', 'exercise123');

            expect(result.hasGoals).toBe(false);
            expect(result.error).toBe('Fetch failed');
        });
    });

    describe('generateMonthlyAnalysis', () => {
        it('should generate monthly analysis successfully', async () => {
            const mockHistory = [
                {
                    workout_date: '2024-01-01',
                    weights: [100, 110, 120],
                    reps: [10, 8, 6],
                    one_rm: 140
                },
                {
                    workout_date: '2024-01-08',
                    weights: [105, 115, 125],
                    reps: [10, 8, 6],
                    one_rm: 145
                }
            ];

            jest.spyOn(service, 'getProgressHistory').mockResolvedValue(mockHistory);

            const result = await service.generateMonthlyAnalysis('user123', 'exercise123');

            expect(result.hasData).toBe(true);
            expect(result.weeklyData).toBeDefined();
            expect(result.trend).toBeDefined();
            expect(result.stats).toBeDefined();
            expect(result.totalSessions).toBe(2);
        });

        it('should handle no data', async () => {
            jest.spyOn(service, 'getProgressHistory').mockResolvedValue([]);

            const result = await service.generateMonthlyAnalysis('user123', 'exercise123');

            expect(result.hasData).toBe(false);
        });
    });

    describe('groupByWeek', () => {
        it('should group data by week correctly', () => {
            const history = [
                {
                    workout_date: '2024-01-01',
                    weights: [100, 110],
                    reps: [10, 8],
                    one_rm: 130
                },
                {
                    workout_date: '2024-01-08',
                    weights: [105, 115],
                    reps: [10, 8],
                    one_rm: 135
                }
            ];

            const result = service.groupByWeek(history);

            expect(result).toHaveLength(2);
            expect(result[0].weekStart).toBeDefined();
            expect(result[0].sessions).toBeDefined();
            expect(result[0].maxWeight).toBeGreaterThan(0);
            expect(result[0].maxOneRM).toBeGreaterThan(0);
        });
    });

    describe('analyzeTrend', () => {
        it('should analyze improving trend', () => {
            const history = [
                { one_rm: 100 },
                { one_rm: 110 },
                { one_rm: 120 }
            ];

            const result = service.analyzeTrend(history);

            expect(result.direction).toBe('improving');
            expect(result.strength).toBeGreaterThan(0);
        });

        it('should analyze declining trend', () => {
            const history = [
                { one_rm: 120 },
                { one_rm: 110 },
                { one_rm: 100 }
            ];

            const result = service.analyzeTrend(history);

            expect(result.direction).toBe('declining');
            expect(result.strength).toBeGreaterThan(0);
        });

        it('should handle insufficient data', () => {
            const history = [{ one_rm: 100 }];

            const result = service.analyzeTrend(history);

            expect(result.direction).toBe('insufficient_data');
            expect(result.strength).toBe(0);
        });
    });

    describe('calculateStats', () => {
        it('should calculate statistics correctly', () => {
            const history = [
                {
                    one_rm: 100,
                    weights: [80, 90, 100],
                    reps: [10, 8, 6]
                },
                {
                    one_rm: 110,
                    weights: [85, 95, 105],
                    reps: [10, 8, 6]
                }
            ];

            const result = service.calculateStats(history);

            expect(result.maxOneRM).toBe(110);
            expect(result.avgOneRM).toBe(105);
            expect(result.maxWeight).toBe(105);
            expect(result.maxReps).toBe(10);
            expect(result.improvement).toBe(10); // 10% improvement
        });
    });

    describe('sendGoalNotification', () => {
        it('should send browser notification when permission granted', () => {
            global.Notification = jest.fn();
            global.Notification.permission = 'granted';
            global.window = {
                dispatchEvent: jest.fn()
            };

            service.sendGoalNotification('Test Title', 'Test Message');

            expect(global.Notification).toHaveBeenCalledWith('Test Title', {
                body: 'Test Message',
                icon: '/favicon-32x32.png',
                tag: 'goal-progress'
            });
            expect(global.window.dispatchEvent).toHaveBeenCalled();
        });

        it('should send app notification when browser notification not available', () => {
            global.Notification = undefined;
            global.window = {
                dispatchEvent: jest.fn()
            };

            service.sendGoalNotification('Test Title', 'Test Message');

            expect(global.window.dispatchEvent).toHaveBeenCalled();
        });
    });

    describe('deactivateGoal', () => {
        it('should deactivate goal successfully', async () => {
            const result = await service.deactivateGoal('goal123');

            expect(mockSupabase.from).toHaveBeenCalledWith('user_goals');
        });

        it('should handle deactivation errors', async () => {
            mockSupabase.from().update().eq.mockResolvedValue({ 
                data: null, 
                error: { message: 'Update failed' } 
            });

            await service.deactivateGoal('goal123');

            // エラーが発生しても例外は投げられない（handleErrorで処理される）
            expect(mockSupabase.from).toHaveBeenCalledWith('user_goals');
        });
    });

    describe('integration', () => {
        it('should handle complete progress tracking flow', async () => {
            const progressData = {
                userId: 'user123',
                exerciseId: 'exercise123',
                exerciseName: 'Bench Press',
                muscleGroupId: 'chest',
                workoutDate: '2024-01-01',
                sets: 3,
                reps: [10, 8, 6],
                weights: [100, 110, 120],
                workoutSessionId: 'session123'
            };

            // Save progress
            const saveResult = await service.saveProgressData(progressData);
            expect(saveResult.success).toBe(true);

            // Get history
            const history = await service.getProgressHistory('user123', 'exercise123');
            expect(Array.isArray(history)).toBe(true);

            // Set goal
            const goalData = {
                userId: 'user123',
                exerciseId: 'exercise123',
                goalType: 'weight',
                targetValue: 150,
                currentValue: 120,
                targetDate: '2024-12-31',
                description: 'Bench Press 150kg'
            };

            const goalResult = await service.setGoal(goalData);
            expect(goalResult.success).toBe(true);

            // Calculate goal progress
            const progress = await service.calculateGoalProgress('user123', 'exercise123');
            expect(progress.hasGoals).toBe(true);
        });
    });
});
