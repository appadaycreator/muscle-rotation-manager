/**
 * ExerciseService テストスイート
 */

import { exerciseService } from '../../js/services/exerciseService.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { showNotification } from '../../js/utils/helpers.js';
import { handleError } from '../../js/utils/errorHandler.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        isAvailable: jest.fn(),
        loadData: jest.fn(),
        saveData: jest.fn(),
        getCurrentUser: jest.fn(),
        client: {
            from: jest.fn()
        }
    }
}));

jest.mock('../../js/utils/helpers.js', () => ({
    showNotification: jest.fn()
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

describe('ExerciseService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(exerciseService.cache).toBeInstanceOf(Map);
            expect(exerciseService.cacheExpiry).toBe(5 * 60 * 1000);
            expect(exerciseService.searchCache).toBeInstanceOf(Map);
        });
    });

    describe('getAllExercises', () => {
        it('should return empty array when Supabase unavailable', async () => {
            supabaseService.isAvailable.mockReturnValue(false);
            
            const result = await exerciseService.getAllExercises();
            
            expect(result).toEqual([]);
        });

        it('should handle loading errors gracefully', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.getCurrentUser.mockReturnValue({ id: 'user123' });
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            or: jest.fn().mockRejectedValue(new Error('Database error'))
                        })
                    })
                })
            };
            
            const result = await exerciseService.getAllExercises();
            
            expect(result).toEqual([]);
        });
    });

    describe('searchExercises', () => {
        it('should return empty array when Supabase unavailable', async () => {
            supabaseService.isAvailable.mockReturnValue(false);
            
            const result = await exerciseService.searchExercises('Bench');
            
            expect(result).toEqual([]);
        });

        it('should handle search errors gracefully', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.getCurrentUser.mockReturnValue({ id: 'user123' });
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        or: jest.fn().mockReturnValue({
                            order: jest.fn().mockReturnValue({
                                limit: jest.fn().mockRejectedValue(new Error('Search error'))
                            })
                        })
                    })
                })
            };
            
            const result = await exerciseService.searchExercises('Bench');
            
            expect(result).toEqual([]);
        });
    });

    describe('addExercise', () => {
        it('should add exercise successfully', async () => {
            const newExercise = {
                name: 'New Exercise',
                muscle_group: 'chest',
                description: 'A new exercise'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue({ id: 3, ...newExercise });
            
            const result = await exerciseService.addExercise(newExercise);
            
            expect(supabaseService.saveData).toHaveBeenCalledWith('exercises', newExercise);
            expect(result).toEqual({ id: 3, ...newExercise });
        });

    });

    describe('updateExercise', () => {
        it('should update exercise successfully', async () => {
            const updatedExercise = {
                id: 1,
                name: 'Updated Exercise',
                muscle_group: 'chest'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue(updatedExercise);
            
            const result = await exerciseService.updateExercise(1, updatedExercise);
            
            expect(supabaseService.saveData).toHaveBeenCalledWith('exercises', updatedExercise);
            expect(result).toEqual(updatedExercise);
        });

    });

    describe('deleteExercise', () => {
        it('should delete exercise successfully', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue({});
            
            await exerciseService.deleteExercise(1);
            
            expect(supabaseService.saveData).toHaveBeenCalledWith('exercises', { id: 1, deleted: true });
        });

    });

    describe('clearCache', () => {
        it('should clear cache', () => {
            exerciseService.cache.set('test', 'data');
            exerciseService.searchCache.set('search', 'data');
            
            exerciseService.clearCache();
            
            expect(exerciseService.cache.size).toBe(0);
            expect(exerciseService.searchCache.size).toBe(0);
        });
    });

    describe('integration', () => {
        it('should handle basic exercise operations', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue({ id: 2, name: 'New Exercise', muscle_group: 'chest' });
            
            // エクササイズを追加
            const newExercise = { name: 'New Exercise', muscle_group: 'chest' };
            const addedExercise = await exerciseService.addExercise(newExercise);
            expect(addedExercise.id).toBe(2);
            
            // エクササイズを更新
            const updatedExercise = { id: 1, name: 'Updated Bench Press' };
            supabaseService.saveData.mockResolvedValue(updatedExercise);
            const result = await exerciseService.updateExercise(1, updatedExercise);
            expect(result.name).toBe('Updated Bench Press');
            
            // エクササイズを削除
            supabaseService.saveData.mockResolvedValue({});
            await exerciseService.deleteExercise(1);
            
            // キャッシュをクリア
            exerciseService.clearCache();
            expect(exerciseService.cache.size).toBe(0);
        });
    });
});