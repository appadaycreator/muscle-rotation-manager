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
        saveData: jest.fn()
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
        it('should load exercises from Supabase when available', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            or: jest.fn().mockResolvedValue({ data: mockExercises, error: null })
                        })
                    })
                })
            };
            
            const result = await exerciseService.getAllExercises();
            
            expect(result).toEqual(mockExercises);
        });

        it('should load exercises from localStorage when Supabase unavailable', async () => {
            supabaseService.isAvailable.mockReturnValue(false);
            
            const result = await exerciseService.getAllExercises();
            
            expect(result).toEqual([]);
        });

        it('should handle loading errors', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            or: jest.fn().mockRejectedValue(new Error('Database error'))
                        })
                    })
                })
            };
            
            await exerciseService.getAllExercises();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ExerciseService.getAllExercises'
            );
        });
    });

    describe('searchExercises', () => {
        it('should search exercises by name', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        or: jest.fn().mockReturnValue({
                            order: jest.fn().mockReturnValue({
                                limit: jest.fn().mockResolvedValue({ data: [mockExercises[0]], error: null })
                            })
                        })
                    })
                })
            };
            
            const result = await exerciseService.searchExercises('Bench');
            
            expect(result).toEqual([{ id: 1, name: 'Bench Press', muscle_group: 'chest' }]);
        });

        it('should search exercises by muscle group', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockReturnValue({
                                limit: jest.fn().mockResolvedValue({ data: [mockExercises[0]], error: null })
                            })
                        })
                    })
                })
            };
            
            const result = await exerciseService.searchExercises('', { muscleGroupId: 'chest' });
            
            expect(result).toEqual([{ id: 1, name: 'Bench Press', muscle_group: 'chest' }]);
        });

        it('should return empty array for no results', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        or: jest.fn().mockReturnValue({
                            order: jest.fn().mockReturnValue({
                                limit: jest.fn().mockResolvedValue({ data: [], error: null })
                            })
                        })
                    })
                })
            };
            
            const result = await exerciseService.searchExercises('NonExistent');
            
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

        it('should handle add exercise errors', async () => {
            const newExercise = {
                name: 'New Exercise',
                muscle_group: 'chest'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockRejectedValue(new Error('Save failed'));
            
            await exerciseService.addExercise(newExercise);
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ExerciseService.addExercise'
            );
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

        it('should handle update exercise errors', async () => {
            const updatedExercise = {
                id: 1,
                name: 'Updated Exercise'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockRejectedValue(new Error('Update failed'));
            
            await exerciseService.updateExercise(1, updatedExercise);
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ExerciseService.updateExercise'
            );
        });
    });

    describe('deleteExercise', () => {
        it('should delete exercise successfully', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue({});
            
            await exerciseService.deleteExercise(1);
            
            expect(supabaseService.saveData).toHaveBeenCalledWith('exercises', { id: 1, deleted: true });
        });

        it('should handle delete exercise errors', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockRejectedValue(new Error('Delete failed'));
            
            await exerciseService.deleteExercise(1);
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'ExerciseService.deleteExercise'
            );
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
        it('should complete full exercise management flow', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            or: jest.fn().mockResolvedValue({ data: mockExercises, error: null })
                        })
                    })
                })
            };
            supabaseService.saveData.mockResolvedValue({ id: 2, name: 'New Exercise', muscle_group: 'chest' });
            
            // エクササイズを読み込み
            await exerciseService.getAllExercises();
            
            // エクササイズを検索
            const searchResults = await exerciseService.searchExercises('Bench');
            expect(searchResults).toHaveLength(1);
            
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