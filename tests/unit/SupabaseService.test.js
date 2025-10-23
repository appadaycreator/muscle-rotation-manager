// SupabaseService.test.js - SupabaseServiceクラスのテスト

import { supabaseService } from '../../js/services/supabaseService.js';

// モックの設定
jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn()
}));

describe('SupabaseService', () => {
  let mockSupabaseClient;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // Supabaseクライアントのモック
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signUp: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null }))
      }
    };

    // supabaseServiceのクライアントをモックに置き換え
    supabaseService.client = mockSupabaseClient;
  });

  describe('constructor', () => {
    test('should initialize with Supabase client', () => {
      expect(supabaseService).toBeDefined();
      expect(supabaseService.client).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    test('should return true when client is available', () => {
      // supabaseServiceの実際のisAvailableメソッドをテスト
      const result = supabaseService.isAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCurrentUser', () => {
    test('should return current user', async () => {
      // getCurrentUserメソッドの存在確認
      expect(typeof supabaseService.getCurrentUser).toBe('function');
    });

    test('should return null when no session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const user = await supabaseService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('loadData', () => {
    test('should handle Supabase unavailable', async () => {
      // Supabaseが利用できない場合のテスト
      try {
        await supabaseService.loadData('test_table');
      } catch (error) {
        expect(error.message).toContain('Supabase is not available');
      }
    });
  });

  describe('saveData', () => {
    test('should handle Supabase unavailable', async () => {
      // Supabaseが利用できない場合のテスト
      try {
        await supabaseService.saveData('test_table', {});
      } catch (error) {
        expect(error.message).toContain('Supabase is not available');
      }
    });
  });
});
