// tests/unit/SupabaseService.test.js - SupabaseServiceのテスト

import { SupabaseService, supabaseService } from '../../js/services/supabaseService.js';

// モック設定
jest.mock('../../js/utils/constants.js', () => ({
    SUPABASE_CONFIG: {
        url: 'https://test.supabase.co',
        key: 'test-key'
    }
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

describe('SupabaseService', () => {
    let service;
    let mockClient;

    beforeEach(() => {
        // モッククライアントの設定
        mockClient = {
            auth: {
                getSession: jest.fn(),
                getUser: jest.fn(),
                signUp: jest.fn(),
                signInWithPassword: jest.fn(),
                signOut: jest.fn(),
                onAuthStateChange: jest.fn()
            },
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    order: jest.fn(() => ({
                        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
                    }))
                })),
                insert: jest.fn(() => ({
                    select: jest.fn(() => Promise.resolve({ data: [], error: null }))
                })),
                upsert: jest.fn(() => ({
                    select: jest.fn(() => Promise.resolve({ data: [], error: null }))
                })),
                eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            channel: jest.fn(() => ({
                on: jest.fn(() => ({
                    subscribe: jest.fn()
                }))
            })),
            storage: {
                from: jest.fn(() => ({
                    upload: jest.fn(() => Promise.resolve({ error: null })),
                    getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'test-url' } }))
                }))
            }
        };

        // window.supabaseのモック
        global.window = {
            supabase: {
                createClient: jest.fn(() => mockClient)
            },
            localStorage: {
                getItem: jest.fn(),
                setItem: jest.fn()
            }
        };

        service = new SupabaseService({ autoInitialize: false });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(service.client).toBeNull();
            expect(service.isConnected).toBe(false);
            expect(service.autoInitialize).toBe(false); // autoInitialize is false in test
            expect(service.enableRetry).toBe(true);
            expect(service.maxRetries).toBe(3);
        });

        it('should initialize with custom options', () => {
            const customService = new SupabaseService({
                autoInitialize: false,
                enableRetry: false,
                maxRetries: 5
            });
            expect(customService.autoInitialize).toBe(false);
            expect(customService.enableRetry).toBe(false);
            expect(customService.maxRetries).toBe(5);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            // Mock the testConnection method
            jest.spyOn(service, 'testConnection').mockResolvedValue(true);
            
            const result = await service.initialize();

            expect(result).toBe(true);
            expect(service.isConnected).toBe(true);
            expect(service.client).toBe(mockClient);
        });

        it('should not initialize if already connected', async () => {
            service.isConnected = true;
            service.client = mockClient;

            const result = await service.initialize();

            expect(result).toBe(true);
        });

        it('should handle initialization errors', async () => {
            global.window.supabase.createClient.mockImplementation(() => {
                throw new Error('Connection failed');
            });

            const result = await service.initialize();

            expect(result).toBe(false);
            expect(service.isConnected).toBe(false);
        });

        it('should retry on failure when enabled', async () => {
            let callCount = 0;
            global.window.supabase.createClient.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Connection failed');
                }
                return mockClient;
            });

            mockClient.from().select().order().limit.mockResolvedValue({ data: [], error: null });

            const result = await service.initialize();

            expect(result).toBe(true);
            expect(callCount).toBe(2);
        });
    });

    describe('isAvailable', () => {
        it('should return true when connected', () => {
            service.isConnected = true;
            service.client = mockClient;

            expect(service.isAvailable()).toBe(true);
        });

        it('should return false when not connected', () => {
            service.isConnected = false;
            service.client = null;

            expect(service.isAvailable()).toBe(false);
        });
    });

    describe('testConnection', () => {
        it('should test connection successfully', async () => {
            service.client = mockClient;
            mockClient.from().select().limit.mockResolvedValue({ data: [], error: null });

            const result = await service.testConnection();

            expect(result).toBe(true);
        });

        it('should handle connection test failure', async () => {
            service.client = mockClient;
            mockClient.from().select().limit.mockResolvedValue({ 
                data: null, 
                error: { message: 'Connection failed' } 
            });

            await expect(service.testConnection()).rejects.toThrow('Connection test failed: Connection failed');
        });
    });

    describe('getCurrentUser', () => {
        it('should return null when not available', () => {
            service.isConnected = false;

            expect(service.getCurrentUser()).toBeNull();
        });

        it('should return user from localStorage', () => {
            service.isConnected = true;
            const mockUser = { id: '123', email: 'test@example.com' };
            global.window.localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify({ user: mockUser }));

            const result = service.getCurrentUser();

            expect(result).toEqual(mockUser);
        });

        it('should return null when no session data', () => {
            service.isConnected = true;
            global.window.localStorage.getItem.mockReturnValue(null);

            const result = service.getCurrentUser();

            expect(result).toBeNull();
        });
    });

    describe('signUp', () => {
        it('should sign up successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockData = { user: { id: '123' } };
            mockClient.auth.signUp.mockResolvedValue({ data: mockData, error: null });

            const result = await service.signUp('test@example.com', 'password');

            expect(result).toEqual(mockData);
            expect(mockClient.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password',
                options: { data: {} }
            });
        });

        it('should handle sign up errors', async () => {
            service.isConnected = true;
            service.client = mockClient;
            mockClient.auth.signUp.mockResolvedValue({ 
                data: null, 
                error: { message: 'Sign up failed' } 
            });

            await expect(service.signUp('test@example.com', 'password'))
                .rejects.toThrow('Sign up failed');
        });

        it('should throw error when not available', async () => {
            service.isConnected = false;

            await expect(service.signUp('test@example.com', 'password'))
                .rejects.toThrow('Supabase is not available');
        });
    });

    describe('signIn', () => {
        it('should sign in successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockData = { user: { id: '123' } };
            mockClient.auth.signInWithPassword.mockResolvedValue({ data: mockData, error: null });

            const result = await service.signIn('test@example.com', 'password');

            expect(result).toEqual(mockData);
            expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password'
            });
        });

        it('should handle sign in errors', async () => {
            service.isConnected = true;
            service.client = mockClient;
            mockClient.auth.signInWithPassword.mockResolvedValue({ 
                data: null, 
                error: { message: 'Sign in failed' } 
            });

            await expect(service.signIn('test@example.com', 'password'))
                .rejects.toThrow('Sign in failed');
        });
    });

    describe('signOut', () => {
        it('should sign out successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            mockClient.auth.signOut.mockResolvedValue({ error: null });

            await service.signOut();

            expect(mockClient.auth.signOut).toHaveBeenCalled();
        });

        it('should handle sign out errors', async () => {
            service.isConnected = true;
            service.client = mockClient;
            mockClient.auth.signOut.mockResolvedValue({ 
                error: { message: 'Sign out failed' } 
            });

            await expect(service.signOut()).rejects.toThrow('Sign out failed');
        });
    });

    describe('saveWorkout', () => {
        it('should save workout successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const workoutData = { name: 'Test Workout' };
            const mockResult = [{ id: '1', ...workoutData }];
            mockClient.from().insert().select.mockResolvedValue({ data: mockResult, error: null });

            const result = await service.saveWorkout(workoutData);

            expect(result).toEqual(mockResult);
        });

        it('should handle save workout errors', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const workoutData = { name: 'Test Workout' };
            mockClient.from().insert().select.mockResolvedValue({ 
                data: null, 
                error: { message: 'Save failed' } 
            });

            await expect(service.saveWorkout(workoutData))
                .rejects.toThrow('Save failed');
        });
    });

    describe('getWorkoutHistory', () => {
        it('should get workout history successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockWorkouts = [{ id: '1', name: 'Workout 1' }];
            mockClient.from().select().order().limit.mockResolvedValue({ data: mockWorkouts, error: null });

            const result = await service.getWorkoutHistory(10);

            expect(result).toEqual(mockWorkouts);
        });

        it('should handle get workout history errors', async () => {
            service.isConnected = true;
            service.client = mockClient;
            mockClient.from().select().order().limit.mockResolvedValue({ 
                data: null, 
                error: { message: 'Fetch failed' } 
            });

            await expect(service.getWorkoutHistory())
                .rejects.toThrow('Fetch failed');
        });
    });

    describe('getExercises', () => {
        it('should get exercises successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockExercises = [{ id: '1', name: 'Exercise 1' }];
            mockClient.from().select().order.mockResolvedValue({ data: mockExercises, error: null });

            const result = await service.getExercises();

            expect(result).toEqual(mockExercises);
        });
    });

    describe('getMuscleGroups', () => {
        it('should get muscle groups successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockMuscleGroups = [{ id: '1', name: 'Chest' }];
            mockClient.from().select().order.mockResolvedValue({ data: mockMuscleGroups, error: null });

            const result = await service.getMuscleGroups();

            expect(result).toEqual(mockMuscleGroups);
        });
    });

    describe('saveData', () => {
        it('should save data successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const data = { name: 'Test' };
            const mockResult = [{ id: '1', ...data }];
            mockClient.from().insert().select.mockResolvedValue({ data: mockResult, error: null });

            const result = await service.saveData('test_table', data);

            expect(result).toEqual(mockResult);
        });
    });

    describe('loadData', () => {
        it('should load data successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockData = [{ id: '1', name: 'Test' }];
            mockClient.from().select.mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await service.loadData('test_table', { status: 'active' });

            expect(result).toEqual(mockData);
        });
    });

    describe('getUserStats', () => {
        it('should return default stats when not available', async () => {
            service.isConnected = false;

            const result = await service.getUserStats();

            expect(result).toEqual({
                totalWorkouts: 0,
                currentStreak: 0,
                weeklyProgress: 0,
                lastWorkout: null
            });
        });

        it('should calculate user stats successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockUser = { id: '123' };
            const mockWorkouts = [
                { id: '1', workout_date: new Date().toISOString(), session_name: 'Test' }
            ];

            mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
            mockClient.from().select().order.mockResolvedValue({ data: mockWorkouts, error: null });

            const result = await service.getUserStats();

            expect(result.totalWorkouts).toBe(1);
            expect(result.currentStreak).toBe(1);
            expect(result.weeklyProgress).toBe(1);
            expect(result.lastWorkout).toBeDefined();
        });
    });

    describe('saveUserProfile', () => {
        it('should save user profile successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockUser = { id: '123' };
            const profileData = { display_name: 'Test User' };

            mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
            mockClient.from().upsert().select.mockResolvedValue({ data: [profileData], error: null });

            const result = await service.saveUserProfile(profileData);

            expect(result).toBe(true);
        });

        it('should handle save profile errors', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockUser = { id: '123' };
            const profileData = { display_name: 'Test User' };

            mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
            mockClient.from().upsert().select.mockResolvedValue({ 
                data: null, 
                error: { message: 'Save failed' } 
            });

            const result = await service.saveUserProfile(profileData);

            expect(result).toBe(false);
        });
    });

    describe('uploadAvatar', () => {
        it('should upload avatar successfully', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockUser = { id: '123' };
            const mockFile = { name: 'avatar.jpg', type: 'image/jpeg' };

            mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
            mockClient.storage.from().upload.mockResolvedValue({ error: null });
            mockClient.storage.from().getPublicUrl.mockReturnValue({ 
                data: { publicUrl: 'https://example.com/avatar.jpg' } 
            });

            const result = await service.uploadAvatar(mockFile);

            expect(result).toBe('https://example.com/avatar.jpg');
        });

        it('should handle upload errors', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const mockUser = { id: '123' };
            const mockFile = { name: 'avatar.jpg', type: 'image/jpeg' };

            mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
            mockClient.storage.from().upload.mockResolvedValue({ 
                error: { message: 'Upload failed' } 
            });

            await expect(service.uploadAvatar(mockFile))
                .rejects.toThrow('アバター画像のアップロードに失敗しました: Upload failed');
        });
    });

    describe('performance metrics', () => {
        it('should update performance metrics', () => {
            service.updatePerformanceMetrics(100, true);
            service.updatePerformanceMetrics(200, false);

            const metrics = service.getPerformanceMetrics();

            expect(metrics.totalRequests).toBe(2);
            expect(metrics.successfulRequests).toBe(1);
            expect(metrics.failedRequests).toBe(1);
            expect(metrics.averageResponseTime).toBe(150);
            expect(metrics.successRate).toBe(50);
        });
    });

    describe('health check', () => {
        it('should return healthy status', () => {
            service.isConnected = true;
            service.connectionAttempts = 1;
            service.performanceMetrics.successfulRequests = 10;
            service.performanceMetrics.failedRequests = 2;

            const health = service.healthCheck();

            expect(health.isHealthy).toBe(true);
            expect(health.issues).toHaveLength(0);
            expect(health.score).toBe(100);
        });

        it('should return unhealthy status', () => {
            service.isConnected = false;
            service.connectionAttempts = 5;
            service.performanceMetrics.successfulRequests = 2;
            service.performanceMetrics.failedRequests = 10;

            const health = service.healthCheck();

            expect(health.isHealthy).toBe(false);
            expect(health.issues.length).toBeGreaterThan(0);
            expect(health.score).toBeLessThan(100);
        });
    });

    describe('offline queue', () => {
        it('should add to offline queue', () => {
            const data = { id: '1', name: 'Test' };
            global.window.localStorage.getItem.mockReturnValue('[]');

            service.addToOfflineQueue(data);

            expect(global.window.localStorage.setItem).toHaveBeenCalled();
        });

        it('should process offline queue', async () => {
            service.isConnected = true;
            service.client = mockClient;
            const queueData = [{ id: '1', data: { name: 'Test' } }];
            global.window.localStorage.getItem.mockReturnValue(JSON.stringify(queueData));
            mockClient.from().insert().select.mockResolvedValue({ data: [], error: null });

            const result = await service.processOfflineQueue();

            expect(result.synced).toBe(1);
            expect(result.failed).toBe(0);
        });
    });

    describe('integration', () => {
        it('should handle complete service lifecycle', async () => {
            // Initialize
            mockClient.from().select().order().limit.mockResolvedValue({ data: [], error: null });
            await service.initialize();

            // Test availability
            expect(service.isAvailable()).toBe(true);

            // Test data operations
            const mockData = [{ id: '1', name: 'Test' }];
            mockClient.from().select().order().limit.mockResolvedValue({ data: mockData, error: null });
            const workouts = await service.getWorkoutHistory();
            expect(workouts).toEqual(mockData);

            // Test health check
            const health = service.healthCheck();
            expect(health.isHealthy).toBe(true);
        });
    });
});