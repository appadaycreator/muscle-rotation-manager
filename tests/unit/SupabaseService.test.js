/**
 * SupabaseService テストスイート
 */

import { supabaseService } from '../../js/services/supabaseService.js';

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

describe('SupabaseService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(supabaseService.isAvailable).toBeDefined();
            expect(supabaseService.getCurrentUser).toBeDefined();
            expect(supabaseService.loadData).toBeDefined();
            expect(supabaseService.saveData).toBeDefined();
        });
    });

    describe('isAvailable', () => {
        it('should return availability status', () => {
            supabaseService.isAvailable.mockReturnValue(true);
            
            const result = supabaseService.isAvailable();
            
            expect(result).toBe(true);
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user when authenticated', () => {
            const mockUser = { id: 'user123', email: 'test@example.com' };
            supabaseService.getCurrentUser.mockReturnValue(mockUser);
            
            const result = supabaseService.getCurrentUser();
            
            expect(result).toEqual(mockUser);
        });

        it('should return null when not authenticated', () => {
            supabaseService.getCurrentUser.mockReturnValue(null);
            
            const result = supabaseService.getCurrentUser();
            
            expect(result).toBeNull();
        });
    });

    describe('loadData', () => {
        it('should load data successfully', async () => {
            const mockData = [{ id: 1, name: 'Test' }];
            supabaseService.loadData.mockResolvedValue(mockData);
            
            const result = await supabaseService.loadData('test_table');
            
            expect(result).toEqual(mockData);
            expect(supabaseService.loadData).toHaveBeenCalledWith('test_table');
        });

        it('should handle load data errors', async () => {
            supabaseService.loadData.mockRejectedValue(new Error('Load failed'));
            
            await expect(supabaseService.loadData('test_table')).rejects.toThrow('Load failed');
        });
    });

    describe('saveData', () => {
        it('should save data successfully', async () => {
            const mockData = { id: 1, name: 'Test' };
            supabaseService.saveData.mockResolvedValue(mockData);
            
            const result = await supabaseService.saveData('test_table', mockData);
            
            expect(result).toEqual(mockData);
            expect(supabaseService.saveData).toHaveBeenCalledWith('test_table', mockData);
        });

        it('should handle save data errors', async () => {
            const mockData = { name: 'Test' };
            supabaseService.saveData.mockRejectedValue(new Error('Save failed'));
            
            await expect(supabaseService.saveData('test_table', mockData)).rejects.toThrow('Save failed');
        });
    });

    describe('integration', () => {
        it('should handle basic data operations', async () => {
            const mockUser = { id: 'user123' };
            const mockData = [{ id: 1, name: 'Test' }];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.getCurrentUser.mockReturnValue(mockUser);
            supabaseService.loadData.mockResolvedValue(mockData);
            supabaseService.saveData.mockResolvedValue({ id: 2, name: 'New Test' });
            
            // データを読み込み
            const loadedData = await supabaseService.loadData('test_table');
            expect(loadedData).toEqual(mockData);
            
            // データを保存
            const newData = { name: 'New Test' };
            const savedData = await supabaseService.saveData('test_table', newData);
            expect(savedData.id).toBe(2);
        });
    });
});