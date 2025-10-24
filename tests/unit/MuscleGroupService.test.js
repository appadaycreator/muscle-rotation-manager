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
        it('should initialize with default values', () => {
            expect(muscleGroupService.muscleGroups).toBeNull();
            expect(muscleGroupService.cache).toBeInstanceOf(Map);
            expect(muscleGroupService.cacheExpiry).toBe(5 * 60 * 1000);
        });
    });

    describe('getMuscleGroups', () => {
        it('should load muscle groups from Supabase when available', async () => {
            const mockMuscleGroups = [
                { 
                    id: 'chest', 
                    name: 'chest', 
                    name_ja: '胸', 
                    color_code: '#EF4444',
                    description: 'Pectoral muscles including upper, middle, and lower chest',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'chest',
                    display_order: 1,
                    is_active: true
                },
                { 
                    id: 'back', 
                    name: 'back', 
                    name_ja: '背中', 
                    color_code: '#10B981',
                    description: 'Latissimus dorsi, rhomboids, middle and lower trapezius',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'back',
                    display_order: 2,
                    is_active: true
                }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({ data: mockMuscleGroups, error: null })
                        })
                    })
                })
            };
            
            const result = await muscleGroupService.getMuscleGroups();
            
            expect(result).toEqual(mockMuscleGroups);
        });

        it('should load muscle groups from localStorage when Supabase unavailable', async () => {
            const mockMuscleGroups = [
                { 
                    id: 'chest', 
                    name: 'chest', 
                    name_ja: '胸', 
                    color_code: '#EF4444',
                    description: 'Pectoral muscles including upper, middle, and lower chest',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'chest',
                    display_order: 1,
                    is_active: true
                }
            ];
            
            supabaseService.isAvailable.mockReturnValue(false);
            localStorage.setItem('muscle_groups', JSON.stringify(mockMuscleGroups));
            
            const result = await muscleGroupService.getMuscleGroups();
            
            expect(result).toEqual(mockMuscleGroups);
        });

        it('should handle loading errors', async () => {
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockRejectedValue(new Error('Database error'))
                        })
                    })
                })
            };
            
            const result = await muscleGroupService.getMuscleGroups();
            
            // エラー時はフォールバックデータを返す
            expect(result).toBeDefined();
        });
    });

    describe('getMuscleGroupById', () => {
        it('should return muscle group by ID', async () => {
            const mockMuscleGroups = [
                { 
                    id: 'chest', 
                    name: 'chest', 
                    name_ja: '胸', 
                    color_code: '#EF4444',
                    description: 'Pectoral muscles including upper, middle, and lower chest',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'chest',
                    display_order: 1,
                    is_active: true
                },
                { 
                    id: 'back', 
                    name: 'back', 
                    name_ja: '背中', 
                    color_code: '#10B981',
                    description: 'Latissimus dorsi, rhomboids, middle and lower trapezius',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'back',
                    display_order: 2,
                    is_active: true
                }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({ data: mockMuscleGroups, error: null })
                        })
                    })
                })
            };
            
            const result = await muscleGroupService.getMuscleGroupById('chest');
            
            expect(result).toEqual({ 
                id: 'chest', 
                name: 'chest', 
                name_ja: '胸', 
                color_code: '#EF4444',
                description: 'Pectoral muscles including upper, middle, and lower chest',
                recovery_hours: 72,
                muscle_size: 'large',
                icon_name: 'chest',
                display_order: 1,
                is_active: true
            });
        });

        it('should return null for non-existent muscle group', async () => {
            const mockMuscleGroups = [
                { 
                    id: 'chest', 
                    name: 'chest', 
                    name_ja: '胸', 
                    color_code: '#EF4444',
                    description: 'Pectoral muscles including upper, middle, and lower chest',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'chest',
                    display_order: 1,
                    is_active: true
                }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({ data: mockMuscleGroups, error: null })
                        })
                    })
                })
            };
            
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
                { 
                    id: 'chest', 
                    name: 'chest', 
                    name_ja: '胸', 
                    color_code: '#EF4444',
                    description: 'Pectoral muscles including upper, middle, and lower chest',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'chest',
                    display_order: 1,
                    is_active: true
                }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({ data: mockMuscleGroups, error: null })
                        })
                    })
                })
            };
            
            const result = await muscleGroupService.getMuscleGroupColor('chest');
            
            expect(result).toBe('#EF4444');
        });

        it('should return default color for non-existent muscle group', async () => {
            const mockMuscleGroups = [
                { 
                    id: 'chest', 
                    name: 'chest', 
                    name_ja: '胸', 
                    color_code: '#EF4444',
                    description: 'Pectoral muscles including upper, middle, and lower chest',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'chest',
                    display_order: 1,
                    is_active: true
                }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({ data: mockMuscleGroups, error: null })
                        })
                    })
                })
            };
            
            const result = await muscleGroupService.getMuscleGroupColor('non-existent');
            
            expect(result).toBe('#3B82F6'); // デフォルトカラー
        });
    });

    describe('integration', () => {
        it('should complete full muscle group management flow', async () => {
            const mockMuscleGroups = [
                { 
                    id: 'chest', 
                    name: 'chest', 
                    name_ja: '胸', 
                    color_code: '#EF4444',
                    description: 'Pectoral muscles including upper, middle, and lower chest',
                    recovery_hours: 72,
                    muscle_size: 'large',
                    icon_name: 'chest',
                    display_order: 1,
                    is_active: true
                }
            ];
            
            supabaseService.isAvailable.mockReturnValue(true);
            supabaseService.client = {
                from: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({ data: mockMuscleGroups, error: null })
                        })
                    })
                })
            };
            
            // 筋肉部位を読み込み
            await muscleGroupService.getMuscleGroups();
            
            // 筋肉部位をIDで取得
            const muscleGroup = await muscleGroupService.getMuscleGroupById('chest');
            expect(muscleGroup).toEqual({ 
                id: 'chest', 
                name: 'chest', 
                name_ja: '胸', 
                color_code: '#EF4444',
                description: 'Pectoral muscles including upper, middle, and lower chest',
                recovery_hours: 72,
                muscle_size: 'large',
                icon_name: 'chest',
                display_order: 1,
                is_active: true
            });
            
            // 筋肉部位の色を取得
            const color = await muscleGroupService.getMuscleGroupColor('chest');
            expect(color).toBe('#EF4444');
        });
    });
});