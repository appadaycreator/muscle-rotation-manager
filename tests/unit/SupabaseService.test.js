// tests/unit/SupabaseService.test.js - SupabaseServiceのテスト

import { SupabaseService } from '../../js/services/supabaseService.js';

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
            expect(service.autoInitialize).toBe(false);
            expect(service.enableRetry).toBe(true);
            expect(service.maxRetries).toBe(3);
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

    describe('getCurrentUser', () => {
        it('should return null when not available', () => {
            service.isConnected = false;

            expect(service.getCurrentUser()).toBeNull();
        });

        it('should return user from localStorage', () => {
            service.isConnected = true; // isAvailable()がtrueを返すように設定
            service.client = {}; // clientも設定
            const mockUser = { id: '123', email: 'test@example.com' };
            const mockAuthData = { user: mockUser };
            
            // localStorageのモックを設定
            const mockGetItem = jest.fn()
                .mockReturnValueOnce(JSON.stringify(mockAuthData)); // 最初のキーでデータを返す
            
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: mockGetItem
                },
                writable: true
            });

            const result = service.getCurrentUser();

            expect(mockGetItem).toHaveBeenCalledWith('sb-mwwlqpokfgduxyjbqoff-auth-token');
            expect(result).toEqual(mockUser);
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
});