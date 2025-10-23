// workout-save-integration.test.js - ワークアウト保存機能の統合テスト

describe('ワークアウト保存機能 統合テスト', () => {
    let mockSupabase;
    let mockApp;
    let originalLocalStorage;
    let originalNavigator;

    beforeEach(() => {
        // LocalStorageのモック
        originalLocalStorage = global.localStorage;
        const storage = {};
        global.localStorage = {
            getItem: jest.fn((key) => storage[key] || null),
            setItem: jest.fn((key, value) => { storage[key] = value; }),
            removeItem: jest.fn((key) => { delete storage[key]; }),
            clear: jest.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); })
        };

        // Navigatorのモック
        originalNavigator = global.navigator;
        global.navigator = {
            onLine: true
        };

        // Supabaseのモック
        mockSupabase = {
            from: jest.fn(() => ({
                insert: jest.fn(() => ({
                    data: [{ id: 'new-workout-id', created_at: new Date().toISOString() }],
                    error: null
                })),
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        order: jest.fn(() => ({
                            limit: jest.fn(() => ({
                                data: [],
                                error: null
                            }))
                        }))
                    }))
                }))
            }))
        };

        // SupabaseServiceのモック
        global.supabaseService = {
            isAvailable: jest.fn(() => true),
            getCurrentUser: jest.fn(() => ({ 
                id: 'test-user-id', 
                email: 'test@example.com' 
            })),
            saveWorkout: jest.fn(async (workoutData) => {
                const result = await mockSupabase.from('workout_sessions').insert(workoutData);
                if (result.error) throw new Error(result.error.message);
                return result.data[0];
            }),
            getWorkouts: jest.fn(async () => {
                const result = await mockSupabase.from('workout_sessions')
                    .select('*')
                    .eq('user_id', 'test-user-id')
                    .order('workout_date', { ascending: false })
                    .limit(20);
                if (result.error) throw new Error(result.error.message);
                return result.data;
            })
        };

        global.showNotification = jest.fn();

        // アプリケーションのモック（実際のMuscleRotationAppクラスの簡易版）
        mockApp = {
            currentWorkout: null,
            
            // 実際の実装をシミュレート
            async saveWorkoutData() {
                if (!this.currentWorkout) {
                    console.warn('保存するワークアウトデータがありません');
                    return;
                }

                try {
                    const workoutData = this.formatWorkoutData(this.currentWorkout);
                    const isOnline = navigator.onLine && supabaseService.isAvailable() && supabaseService.getCurrentUser();
                    
                    if (isOnline) {
                        await this.saveToSupabase(workoutData);
                    } else {
                        await this.saveToLocalStorage(workoutData);
                    }

                    showNotification('ワークアウトデータを保存しました', 'success');
                    this.onWorkoutSaved(workoutData);

                } catch (error) {
                    console.error('❌ ワークアウトデータ保存エラー:', error);
                    
                    try {
                        const workoutData = this.formatWorkoutData(this.currentWorkout);
                        await this.saveToLocalStorage(workoutData);
                        showNotification('オフラインでワークアウトデータを保存しました', 'warning');
                    } catch (fallbackError) {
                        showNotification('ワークアウトデータの保存に失敗しました', 'error');
                        throw fallbackError;
                    }
                }
            },

            formatWorkoutData(currentWorkout) {
                const now = new Date();
                const startTime = currentWorkout.startTime || now;
                const endTime = currentWorkout.endTime || now;
                const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

                return {
                    id: currentWorkout.id || `workout_${Date.now()}`,
                    session_name: currentWorkout.name || `ワークアウト ${new Date().toLocaleDateString('ja-JP')}`,
                    workout_date: new Date().toISOString().split('T')[0],
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    total_duration_minutes: Math.max(1, durationMinutes),
                    muscle_groups_trained: currentWorkout.muscleGroups || [],
                    session_type: 'strength',
                    is_completed: true,
                    exercises: currentWorkout.exercises || [],
                    notes: currentWorkout.notes || '',
                    created_at: now.toISOString(),
                    _offline: !navigator.onLine,
                    _sync_status: 'pending'
                };
            },

            async saveToSupabase(workoutData) {
                const sessionData = {
                    session_name: workoutData.session_name,
                    workout_date: workoutData.workout_date,
                    start_time: workoutData.start_time,
                    end_time: workoutData.end_time,
                    total_duration_minutes: workoutData.total_duration_minutes,
                    muscle_groups_trained: workoutData.muscle_groups_trained,
                    session_type: workoutData.session_type,
                    is_completed: workoutData.is_completed,
                    notes: workoutData.notes
                };

                const savedData = await supabaseService.saveWorkout(sessionData);
                this.removeFromOfflineQueue(workoutData.id);
                return savedData;
            },

            async saveToLocalStorage(workoutData) {
                const existingHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
                const existingIndex = existingHistory.findIndex(w => w.id === workoutData.id);
                
                if (existingIndex >= 0) {
                    existingHistory[existingIndex] = workoutData;
                } else {
                    existingHistory.unshift(workoutData);
                }

                const limitedHistory = existingHistory.slice(0, 50);
                localStorage.setItem('workoutHistory', JSON.stringify(limitedHistory));
                this.addToOfflineQueue(workoutData);
            },

            addToOfflineQueue(workoutData) {
                const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
                const existingIndex = offlineQueue.findIndex(item => item.id === workoutData.id);
                
                const queueItem = {
                    id: workoutData.id,
                    data: workoutData,
                    timestamp: new Date().toISOString(),
                    retryCount: 0,
                    status: 'pending'
                };
                
                if (existingIndex >= 0) {
                    offlineQueue[existingIndex] = queueItem;
                } else {
                    offlineQueue.push(queueItem);
                }
                
                localStorage.setItem('offlineWorkoutQueue', JSON.stringify(offlineQueue));
            },

            removeFromOfflineQueue(workoutId) {
                const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
                const filteredQueue = offlineQueue.filter(item => item.id !== workoutId);
                localStorage.setItem('offlineWorkoutQueue', JSON.stringify(filteredQueue));
            },

            onWorkoutSaved(workoutData) {
                this.updateWorkoutStats(workoutData);
            },

            updateWorkoutStats(workoutData) {
                const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
                stats.totalWorkouts = (stats.totalWorkouts || 0) + 1;
                stats.totalMinutes = (stats.totalMinutes || 0) + workoutData.total_duration_minutes;
                stats.lastWorkoutDate = workoutData.workout_date;
                
                if (!stats.muscleGroupStats) {
                    stats.muscleGroupStats = {};
                }
                
                workoutData.muscle_groups_trained.forEach(muscleGroup => {
                    stats.muscleGroupStats[muscleGroup] = (stats.muscleGroupStats[muscleGroup] || 0) + 1;
                });
                
                localStorage.setItem('workoutStats', JSON.stringify(stats));
            }
        };
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
        global.navigator = originalNavigator;
        jest.clearAllMocks();
    });

    describe('完全なワークアウト保存フロー', () => {
        test('オンライン環境での完全なワークアウト保存フロー', async () => {
            // ワークアウトデータを設定
            const workoutData = {
                id: 'integration-test-workout-1',
                name: '胸と肩のワークアウト',
                muscleGroups: ['chest', 'shoulders'],
                exercises: [
                    {
                        name: 'プッシュアップ',
                        muscleGroup: 'chest',
                        sets: [
                            { weight: 0, reps: 15, completed: true },
                            { weight: 0, reps: 12, completed: true },
                            { weight: 0, reps: 10, completed: true }
                        ]
                    },
                    {
                        name: 'ショルダープレス',
                        muscleGroup: 'shoulders',
                        sets: [
                            { weight: 10, reps: 12, completed: true },
                            { weight: 10, reps: 10, completed: true }
                        ]
                    }
                ],
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T11:15:00Z'),
                notes: '良いワークアウトでした！'
            };

            mockApp.currentWorkout = workoutData;

            // ワークアウトを保存
            await mockApp.saveWorkoutData();

            // Supabaseに保存されたことを確認
            expect(supabaseService.saveWorkout).toHaveBeenCalledWith(
                expect.objectContaining({
                    session_name: '胸と肩のワークアウト',
                    workout_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                    start_time: '2024-01-01T10:00:00.000Z',
                    end_time: '2024-01-01T11:15:00.000Z',
                    total_duration_minutes: 75,
                    muscle_groups_trained: ['chest', 'shoulders'],
                    session_type: 'strength',
                    is_completed: true,
                    notes: '良いワークアウトでした！'
                })
            );

            // 成功通知が表示されたことを確認
            expect(showNotification).toHaveBeenCalledWith('ワークアウトデータを保存しました', 'success');

            // 統計情報が更新されたことを確認
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutStats',
                expect.stringContaining('"totalWorkouts":1')
            );
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutStats',
                expect.stringContaining('"totalMinutes":75')
            );
        });

        test('オフライン環境での完全なワークアウト保存フロー', async () => {
            // オフライン状態に設定
            navigator.onLine = false;

            const workoutData = {
                id: 'integration-test-workout-2',
                name: '背中と腕のワークアウト',
                muscleGroups: ['back', 'arms'],
                exercises: [
                    {
                        name: 'プルアップ',
                        muscleGroup: 'back',
                        sets: [
                            { weight: 0, reps: 8, completed: true },
                            { weight: 0, reps: 6, completed: true }
                        ]
                    }
                ],
                startTime: new Date('2024-01-01T14:00:00Z'),
                endTime: new Date('2024-01-01T15:00:00Z'),
                notes: 'オフラインワークアウト'
            };

            mockApp.currentWorkout = workoutData;

            // ワークアウトを保存
            await mockApp.saveWorkoutData();

            // Supabaseには保存されていないことを確認
            expect(supabaseService.saveWorkout).not.toHaveBeenCalled();

            // ローカルストレージに保存されたことを確認
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutHistory',
                expect.stringContaining('integration-test-workout-2')
            );

            // オフライン同期キューに追加されたことを確認
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'offlineWorkoutQueue',
                expect.stringContaining('integration-test-workout-2')
            );

            // 成功通知が表示されたことを確認
            expect(showNotification).toHaveBeenCalledWith('ワークアウトデータを保存しました', 'success');
        });

        test('Supabase保存失敗時のフォールバック処理', async () => {
            // Supabaseエラーをシミュレート
            supabaseService.saveWorkout.mockRejectedValue(new Error('Database connection failed'));

            const workoutData = {
                id: 'integration-test-workout-3',
                name: '脚のワークアウト',
                muscleGroups: ['legs'],
                exercises: [],
                startTime: new Date('2024-01-01T16:00:00Z'),
                endTime: new Date('2024-01-01T17:00:00Z')
            };

            mockApp.currentWorkout = workoutData;

            // ワークアウトを保存
            await mockApp.saveWorkoutData();

            // Supabaseへの保存が試行されたことを確認
            expect(supabaseService.saveWorkout).toHaveBeenCalled();

            // フォールバックでローカルストレージに保存されたことを確認
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutHistory',
                expect.stringContaining('integration-test-workout-3')
            );

            // 警告通知が表示されたことを確認
            expect(showNotification).toHaveBeenCalledWith('オフラインでワークアウトデータを保存しました', 'warning');
        });
    });

    describe('データ整合性テスト', () => {
        test('複数のワークアウトを連続保存した場合の整合性', async () => {
            const workouts = [
                {
                    id: 'workout-1',
                    name: 'ワークアウト1',
                    muscleGroups: ['chest'],
                    startTime: new Date('2024-01-01T10:00:00Z'),
                    endTime: new Date('2024-01-01T11:00:00Z')
                },
                {
                    id: 'workout-2',
                    name: 'ワークアウト2',
                    muscleGroups: ['back'],
                    startTime: new Date('2024-01-02T10:00:00Z'),
                    endTime: new Date('2024-01-02T11:30:00Z')
                },
                {
                    id: 'workout-3',
                    name: 'ワークアウト3',
                    muscleGroups: ['legs'],
                    startTime: new Date('2024-01-03T10:00:00Z'),
                    endTime: new Date('2024-01-03T12:00:00Z')
                }
            ];

            // 連続してワークアウトを保存
            for (const workout of workouts) {
                mockApp.currentWorkout = workout;
                await mockApp.saveWorkoutData();
            }

            // 全てのワークアウトがSupabaseに保存されたことを確認
            expect(supabaseService.saveWorkout).toHaveBeenCalledTimes(3);

            // 統計情報が正しく累積されたことを確認
            const finalStats = JSON.parse(localStorage.setItem.mock.calls
                .filter(call => call[0] === 'workoutStats')
                .pop()[1]);

            expect(finalStats.totalWorkouts).toBe(3);
            expect(finalStats.totalMinutes).toBe(60 + 90 + 120); // 270分
            expect(finalStats.muscleGroupStats).toEqual({
                chest: 1,
                back: 1,
                legs: 1
            });
        });

        test('同じIDのワークアウトを重複保存した場合の処理', async () => {
            navigator.onLine = false; // オフライン環境でテスト

            const workoutData = {
                id: 'duplicate-workout',
                name: '重複テスト',
                muscleGroups: ['abs'],
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T10:30:00Z')
            };

            mockApp.currentWorkout = workoutData;

            // 最初の保存
            await mockApp.saveWorkoutData();

            // 同じワークアウトを再度保存
            workoutData.notes = '更新されたノート';
            await mockApp.saveWorkoutData();

            // ローカルストレージの履歴を確認
            const historyCall = localStorage.setItem.mock.calls
                .filter(call => call[0] === 'workoutHistory')
                .pop();
            
            const history = JSON.parse(historyCall[1]);
            
            // 重複ではなく更新されていることを確認
            expect(history.length).toBe(1);
            expect(history[0].id).toBe('duplicate-workout');
            expect(history[0].notes).toBe('更新されたノート');

            // オフライン同期キューも重複ではなく更新されていることを確認
            const queueCall = localStorage.setItem.mock.calls
                .filter(call => call[0] === 'offlineWorkoutQueue')
                .pop();
            
            const queue = JSON.parse(queueCall[1]);
            expect(queue.length).toBe(1);
            expect(queue[0].id).toBe('duplicate-workout');
        });
    });

    describe('エラーハンドリングテスト', () => {
        test('LocalStorage容量不足時のエラーハンドリング', async () => {
            // LocalStorageエラーをシミュレート
            localStorage.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            const workoutData = {
                id: 'storage-error-workout',
                muscleGroups: ['chest'],
                startTime: new Date(),
                endTime: new Date()
            };

            mockApp.currentWorkout = workoutData;

            // エラーが適切にハンドリングされることを確認
            await expect(mockApp.saveWorkoutData()).rejects.toThrow();
            
            expect(showNotification).toHaveBeenCalledWith('ワークアウトデータの保存に失敗しました', 'error');
        });

        test('不正なワークアウトデータでのエラーハンドリング', async () => {
            // 不正なデータを設定
            mockApp.currentWorkout = {
                // IDなし、必須フィールドなし
                muscleGroups: null,
                startTime: 'invalid-date',
                endTime: null
            };

            // エラーが発生しても適切にハンドリングされることを確認
            await expect(mockApp.saveWorkoutData()).rejects.toThrow();
        });
    });
});
