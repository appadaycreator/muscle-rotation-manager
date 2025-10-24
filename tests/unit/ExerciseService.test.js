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
            expect(exerciseService.exercises).toEqual([]);
            expect(exerciseService.isLoading).toBe(false);
            expect(exerciseService.cache).toEqual({});
        });
    });

    describe('getAllExercises', () => {
        it('should load exercises from Supabase when available', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockExercises);
            
            const result = await exerciseService.getAllExercises();
            
            expect(supabaseService.loadData).toHaveBeenCalledWith('exercises');
            expect(result).toEqual(mockExercises);
        });

        it('should load exercises from localStorage when Supabase unavailable', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(false);
            localStorage.setItem('exercises', JSON.stringify(mockExercises));
            
            const result = await exerciseService.getAllExercises();
            
            expect(result).toEqual(mockExercises);
        });

        it('should handle loading errors', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockRejectedValue(new Error('Database error'));
            
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
            
            exerciseService.exercises = mockExercises;
            
            const result = await exerciseService.searchExercises('Bench');
            
            expect(result).toEqual([{ id: 1, name: 'Bench Press', muscle_group: 'chest' }]);
        });

        it('should search exercises by muscle group', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' },
                { id: 2, name: 'Squat', muscle_group: 'legs' }
            ];
            
            exerciseService.exercises = mockExercises;
            
            const result = await exerciseService.searchExercises('', 'chest');
            
            expect(result).toEqual([{ id: 1, name: 'Bench Press', muscle_group: 'chest' }]);
        });

        it('should return empty array for no results', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            exerciseService.exercises = mockExercises;
            
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
            exerciseService.cache = { 'test': 'data' };
            
            exerciseService.clearCache();
            
            expect(exerciseService.cache).toEqual({});
        });
    });

    describe('integration', () => {
        it('should complete full exercise management flow', async () => {
            const mockExercises = [
                { id: 1, name: 'Bench Press', muscle_group: 'chest' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockExercises);
            
            // エクササイズを読み込み
            await exerciseService.getAllExercises();
            
            // エクササイズを検索
            const searchResults = await exerciseService.searchExercises('Bench');
            expect(searchResults).toHaveLength(1);
            
            // キャッシュをクリア
            exerciseService.clearCache();
            expect(exerciseService.cache).toEqual({});
        });
    });
});