/**
 * ワークアウトフロー統合テスト
 * 実際のユーザー操作フローをテストする
 */

// テストランナーの読み込み（ブラウザ環境では不要）
if (typeof require !== 'undefined') {
    const { test, describe, expect, beforeEach, mock } = require('../unit/test-runner.js');
}

describe('ワークアウトフロー統合テスト', () => {
    let mockSupabase;
    let workoutManager;

    beforeEach(() => {
        // Supabaseのモック
        mockSupabase = {
            from: mock().mockReturnValue({
                select: mock().mockReturnValue({
                    eq: mock().mockReturnValue({
                        single: mock().mockReturnValue(Promise.resolve({ data: null, error: null }))
                    })
                }),
                insert: mock().mockReturnValue(Promise.resolve({ data: {}, error: null })),
                update: mock().mockReturnValue({
                    eq: mock().mockReturnValue(Promise.resolve({ data: {}, error: null }))
                })
            }),
            auth: {
                getUser: mock().mockReturnValue(Promise.resolve({ 
                    data: { user: { id: 'test-user-id' } }, 
                    error: null 
                }))
            }
        };

        // ワークアウトマネージャーのモック
        workoutManager = {
            currentWorkout: null,
            exercises: [],
            
            startWorkout: function(muscleGroups) {
                this.currentWorkout = {
                    id: 'workout-' + Date.now(),
                    userId: 'test-user-id',
                    date: new Date().toISOString(),
                    muscleGroups: muscleGroups,
                    exercises: [],
                    startTime: new Date(),
                    endTime: null,
                    duration: 0
                };
                return this.currentWorkout;
            },

            addExercise: function(exercise) {
                if (!this.currentWorkout) {
                    throw new Error('ワークアウトが開始されていません');
                }
                
                const exerciseData = {
                    id: 'exercise-' + Date.now(),
                    workoutId: this.currentWorkout.id,
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup,
                    sets: exercise.sets || [],
                    notes: exercise.notes || ''
                };
                
                this.currentWorkout.exercises.push(exerciseData);
                return exerciseData;
            },

            addSet: function(exerciseId, setData) {
                const exercise = this.currentWorkout.exercises.find(e => e.id === exerciseId);
                if (!exercise) {
                    throw new Error('エクササイズが見つかりません');
                }
                
                const set = {
                    id: 'set-' + Date.now(),
                    weight: setData.weight,
                    reps: setData.reps,
                    completed: setData.completed || false
                };
                
                exercise.sets.push(set);
                return set;
            },

            completeWorkout: function() {
                if (!this.currentWorkout) {
                    throw new Error('ワークアウトが開始されていません');
                }
                
                this.currentWorkout.endTime = new Date();
                this.currentWorkout.duration = this.currentWorkout.endTime - this.currentWorkout.startTime;
                
                const completedWorkout = { ...this.currentWorkout };
                this.currentWorkout = null;
                
                return completedWorkout;
            }
        };
    });

    test('新しいワークアウトを開始できる', () => {
        const muscleGroups = ['chest', 'shoulders'];
        const workout = workoutManager.startWorkout(muscleGroups);
        
        expect(workout).toBeTruthy();
        expect(workout.muscleGroups).toEqual(muscleGroups);
        expect(workout.exercises).toHaveLength(0);
        expect(workout.startTime).toBeInstanceOf(Date);
        expect(workoutManager.currentWorkout).toBe(workout);
    });

    test('ワークアウトにエクササイズを追加できる', () => {
        // ワークアウト開始
        workoutManager.startWorkout(['chest']);
        
        // エクササイズ追加
        const exercise = workoutManager.addExercise({
            name: 'ベンチプレス',
            muscleGroup: 'chest'
        });
        
        expect(exercise.name).toBe('ベンチプレス');
        expect(exercise.muscleGroup).toBe('chest');
        expect(workoutManager.currentWorkout.exercises).toHaveLength(1);
    });

    test('エクササイズにセットを追加できる', () => {
        // ワークアウト開始とエクササイズ追加
        workoutManager.startWorkout(['chest']);
        const exercise = workoutManager.addExercise({
            name: 'ベンチプレス',
            muscleGroup: 'chest'
        });
        
        // セット追加
        const set1 = workoutManager.addSet(exercise.id, {
            weight: 80,
            reps: 10,
            completed: true
        });
        
        const set2 = workoutManager.addSet(exercise.id, {
            weight: 85,
            reps: 8,
            completed: true
        });
        
        expect(exercise.sets).toHaveLength(2);
        expect(set1.weight).toBe(80);
        expect(set1.reps).toBe(10);
        expect(set2.weight).toBe(85);
        expect(set2.reps).toBe(8);
    });

    test('ワークアウトを完了できる', () => {
        // ワークアウト開始
        workoutManager.startWorkout(['chest', 'shoulders']);
        
        // エクササイズとセットを追加
        const exercise1 = workoutManager.addExercise({
            name: 'ベンチプレス',
            muscleGroup: 'chest'
        });
        workoutManager.addSet(exercise1.id, { weight: 80, reps: 10, completed: true });
        
        const exercise2 = workoutManager.addExercise({
            name: 'ショルダープレス',
            muscleGroup: 'shoulders'
        });
        workoutManager.addSet(exercise2.id, { weight: 30, reps: 12, completed: true });
        
        // ワークアウト完了
        const completedWorkout = workoutManager.completeWorkout();
        
        expect(completedWorkout.endTime).toBeInstanceOf(Date);
        expect(completedWorkout.duration).toBeTruthy();
        expect(completedWorkout.exercises).toHaveLength(2);
        expect(workoutManager.currentWorkout).toBe(null);
    });

    test('ワークアウト未開始時にエクササイズ追加するとエラーが発生する', () => {
        expect(() => {
            workoutManager.addExercise({
                name: 'ベンチプレス',
                muscleGroup: 'chest'
            });
        }).toThrow('ワークアウトが開始されていません');
    });

    test('存在しないエクササイズにセット追加するとエラーが発生する', () => {
        workoutManager.startWorkout(['chest']);
        
        expect(() => {
            workoutManager.addSet('non-existent-id', {
                weight: 80,
                reps: 10
            });
        }).toThrow('エクササイズが見つかりません');
    });

    test('ワークアウト未開始時に完了するとエラーが発生する', () => {
        expect(() => {
            workoutManager.completeWorkout();
        }).toThrow('ワークアウトが開始されていません');
    });
});

describe('データ永続化統合テスト', () => {
    let mockSupabase;
    let dataManager;

    beforeEach(() => {
        mockSupabase = {
            from: mock().mockReturnValue({
                select: mock().mockReturnValue({
                    eq: mock().mockReturnValue({
                        order: mock().mockReturnValue(Promise.resolve({ 
                            data: [], 
                            error: null 
                        }))
                    })
                }),
                insert: mock().mockReturnValue(Promise.resolve({ 
                    data: [{ id: 'new-workout-id' }], 
                    error: null 
                })),
                update: mock().mockReturnValue({
                    eq: mock().mockReturnValue(Promise.resolve({ 
                        data: [{}], 
                        error: null 
                    }))
                }),
                delete: mock().mockReturnValue({
                    eq: mock().mockReturnValue(Promise.resolve({ 
                        data: [], 
                        error: null 
                    }))
                })
            })
        };

        dataManager = {
            saveWorkout: async function(workoutData) {
                const result = await mockSupabase.from('workouts').insert(workoutData);
                if (result.error) throw new Error(result.error.message);
                return result.data[0];
            },

            getWorkouts: async function(userId) {
                const result = await mockSupabase.from('workouts')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false });
                if (result.error) throw new Error(result.error.message);
                return result.data;
            },

            updateWorkout: async function(workoutId, updates) {
                const result = await mockSupabase.from('workouts')
                    .update(updates)
                    .eq('id', workoutId);
                if (result.error) throw new Error(result.error.message);
                return result.data[0];
            },

            deleteWorkout: async function(workoutId) {
                const result = await mockSupabase.from('workouts')
                    .delete()
                    .eq('id', workoutId);
                if (result.error) throw new Error(result.error.message);
                return true;
            }
        };
    });

    test('ワークアウトデータを保存できる', async () => {
        const workoutData = {
            user_id: 'test-user-id',
            date: '2024-01-01',
            muscle_groups: ['chest', 'shoulders'],
            exercises: [
                {
                    name: 'ベンチプレス',
                    muscle_group: 'chest',
                    sets: [{ weight: 80, reps: 10 }]
                }
            ]
        };

        const savedWorkout = await dataManager.saveWorkout(workoutData);
        
        expect(savedWorkout.id).toBe('new-workout-id');
        expect(mockSupabase.from().insert).toHaveBeenCalledWith(workoutData);
    });

    test('ユーザーのワークアウト履歴を取得できる', async () => {
        const userId = 'test-user-id';
        const workouts = await dataManager.getWorkouts(userId);
        
        expect(Array.isArray(workouts)).toBeTruthy();
        expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('user_id', userId);
    });

    test('ワークアウトデータを更新できる', async () => {
        const workoutId = 'workout-123';
        const updates = { notes: '良いワークアウトでした' };
        
        await dataManager.updateWorkout(workoutId, updates);
        
        expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', workoutId);
    });

    test('ワークアウトデータを削除できる', async () => {
        const workoutId = 'workout-123';
        
        const result = await dataManager.deleteWorkout(workoutId);
        
        expect(result).toBe(true);
        expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', workoutId);
    });
});

// ブラウザ環境でのテスト実行
if (typeof window !== 'undefined') {
    console.log('🔄 ワークアウトフロー統合テストを実行します...');
}
