/**
 * MuscleGroupService テストスイート
 */

import { muscleGroupService } from '../../js/services/muscleGroupService.js';
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

describe('MuscleGroupService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with Supabase client', () => {
            expect(muscleGroupService.supabase).toBeDefined();
        });
    });

    describe('getMuscleGroups', () => {
        it('should load muscle groups from Supabase when available', async () => {
            const mockMuscleGroups = [
                { id: 'chest', name: '胸', color: '#3B82F6' },
                { id: 'back', name: '背中', color: '#10B981' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockMuscleGroups);
            
            const result = await muscleGroupService.getMuscleGroups();
            
            expect(supabaseService.loadData).toHaveBeenCalledWith('muscle_groups');
            expect(result).toEqual(mockMuscleGroups);
        });

        it('should load muscle groups from localStorage when Supabase unavailable', async () => {
            const mockMuscleGroups = [
                { id: 'chest', name: '胸', color: '#3B82F6' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(false);
            localStorage.setItem('muscle_groups', JSON.stringify(mockMuscleGroups));
            
            const result = await muscleGroupService.getMuscleGroups();
            
            expect(result).toEqual(mockMuscleGroups);
        });

        it('should handle loading errors', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockRejectedValue(new Error('Database error'));
            
            await muscleGroupService.getMuscleGroups();
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'MuscleGroupService.getMuscleGroups'
            );
        });
    });

    describe('getMuscleGroupById', () => {
        it('should return muscle group by ID', async () => {
            const mockMuscleGroups = [
                { id: 'chest', name: '胸', color: '#3B82F6' },
                { id: 'back', name: '背中', color: '#10B981' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockMuscleGroups);
            
            const result = await muscleGroupService.getMuscleGroupById('chest');
            
            expect(result).toEqual({ id: 'chest', name: '胸', color: '#3B82F6' });
        });

        it('should return null for non-existent muscle group', async () => {
            const mockMuscleGroups = [
                { id: 'chest', name: '胸', color: '#3B82F6' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockMuscleGroups);
            
            const result = await muscleGroupService.getMuscleGroupById('non-existent');
            
            expect(result).toBeNull();
        });
    });

    describe('addMuscleGroup', () => {
        it('should add muscle group successfully', async () => {
            const newMuscleGroup = {
                id: 'shoulders',
                name: '肩',
                color: '#F59E0B'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue({ id: 'shoulders', ...newMuscleGroup });
            
            const result = await muscleGroupService.addMuscleGroup(newMuscleGroup);
            
            expect(supabaseService.saveData).toHaveBeenCalledWith('muscle_groups', newMuscleGroup);
            expect(result).toEqual({ id: 'shoulders', ...newMuscleGroup });
        });

        it('should handle add muscle group errors', async () => {
            const newMuscleGroup = {
                id: 'shoulders',
                name: '肩'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockRejectedValue(new Error('Save failed'));
            
            await muscleGroupService.addMuscleGroup(newMuscleGroup);
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'MuscleGroupService.addMuscleGroup'
            );
        });
    });

    describe('updateMuscleGroup', () => {
        it('should update muscle group successfully', async () => {
            const updatedMuscleGroup = {
                id: 'chest',
                name: '胸（更新）',
                color: '#3B82F6'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue(updatedMuscleGroup);
            
            const result = await muscleGroupService.updateMuscleGroup('chest', updatedMuscleGroup);
            
            expect(supabaseService.saveData).toHaveBeenCalledWith('muscle_groups', updatedMuscleGroup);
            expect(result).toEqual(updatedMuscleGroup);
        });

        it('should handle update muscle group errors', async () => {
            const updatedMuscleGroup = {
                id: 'chest',
                name: '胸（更新）'
            };
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockRejectedValue(new Error('Update failed'));
            
            await muscleGroupService.updateMuscleGroup('chest', updatedMuscleGroup);
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'MuscleGroupService.updateMuscleGroup'
            );
        });
    });

    describe('deleteMuscleGroup', () => {
        it('should delete muscle group successfully', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockResolvedValue({});
            
            await muscleGroupService.deleteMuscleGroup('chest');
            
            expect(supabaseService.saveData).toHaveBeenCalledWith('muscle_groups', { id: 'chest', deleted: true });
        });

        it('should handle delete muscle group errors', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.saveData.mockRejectedValue(new Error('Delete failed'));
            
            await muscleGroupService.deleteMuscleGroup('chest');
            
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error), 
                'MuscleGroupService.deleteMuscleGroup'
            );
        });
    });

    describe('getMuscleGroupColor', () => {
        it('should return muscle group color', async () => {
            const mockMuscleGroups = [
                { id: 'chest', name: '胸', color: '#3B82F6' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockMuscleGroups);
            
            const result = await muscleGroupService.getMuscleGroupColor('chest');
            
            expect(result).toBe('#3B82F6');
        });

        it('should return default color for non-existent muscle group', async () => {
            const mockMuscleGroups = [
                { id: 'chest', name: '胸', color: '#3B82F6' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockMuscleGroups);
            
            const result = await muscleGroupService.getMuscleGroupColor('non-existent');
            
            expect(result).toBe('#6B7280'); // デフォルトカラー
        });
    });

    describe('integration', () => {
        it('should complete full muscle group management flow', async () => {
            const mockMuscleGroups = [
                { id: 'chest', name: '胸', color: '#3B82F6' }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.loadData.mockResolvedValue(mockMuscleGroups);
            
            // 筋肉部位を読み込み
            await muscleGroupService.getMuscleGroups();
            
            // 筋肉部位をIDで取得
            const muscleGroup = await muscleGroupService.getMuscleGroupById('chest');
            expect(muscleGroup).toEqual({ id: 'chest', name: '胸', color: '#3B82F6' });
            
            // 筋肉部位の色を取得
            const color = await muscleGroupService.getMuscleGroupColor('chest');
            expect(color).toBe('#3B82F6');
        });
    });
});