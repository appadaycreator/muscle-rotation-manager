// workout-save.test.js - ワークアウト保存機能のユニットテスト

describe('ワークアウト保存機能テスト', () => {
    let app;
    let mockSupabaseService;
    let originalLocalStorage;
    let originalNavigator;

    beforeEach(() => {
        // LocalStorageのモック
        originalLocalStorage = global.localStorage;
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };

        // Navigatorのモック
        originalNavigator = global.navigator;
        global.navigator = {
            onLine: true
        };

        // SupabaseServiceのモック
        mockSupabaseService = {
            isAvailable: jest.fn(() => true),
            getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
            saveWorkout: jest.fn()
        };

        // グローバルオブジェクトとして設定
        global.supabaseService = mockSupabaseService;
        global.showNotification = jest.fn();

        // MuscleRotationAppクラスをインポート（実際の実装では動的インポートが必要）
        // ここではテスト用の簡易版を作成
        class TestMuscleRotationApp {
            constructor() {
                this.currentWorkout = null;
            }

            // 実装されたメソッドをコピー
            async saveWorkoutData() {
                if (!this.currentWorkout) {
                    console.warn('保存するワークアウトデータがありません');
                    return;
                }

                try {
                    console.log('ワークアウトデータ保存開始:', this.currentWorkout);

                    const workoutData = this.formatWorkoutData(this.currentWorkout);
                    const isOnline = navigator.onLine && supabaseService.isAvailable() && supabaseService.getCurrentUser();
                    
                    if (isOnline) {
                        await this.saveToSupabase(workoutData);
                        console.log('✅ Supabaseへの保存が完了しました');
                    } else {
                        await this.saveToLocalStorage(workoutData);
                        console.log('✅ ローカルストレージへの保存が完了しました');
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
                        console.error('❌ フォールバック保存も失敗:', fallbackError);
                        showNotification('ワークアウトデータの保存に失敗しました', 'error');
                        throw fallbackError;
                    }
                }
            }

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
            }

            async saveToSupabase(workoutData) {
                if (!supabaseService.isAvailable()) {
                    throw new Error('Supabaseが利用できません');
                }

                const currentUser = supabaseService.getCurrentUser();
                if (!currentUser) {
                    throw new Error('ユーザーがログインしていません');
                }

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
                console.log('Supabase保存結果:', savedData);
                this.removeFromOfflineQueue(workoutData.id);
                return savedData;
            }

            async saveToLocalStorage(workoutData) {
                try {
                    const existingHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
                    const existingIndex = existingHistory.findIndex(w => w.id === workoutData.id);
                    
                    if (existingIndex >= 0) {
                        existingHistory[existingIndex] = workoutData;
                        console.log('既存のワークアウトデータを更新しました');
                    } else {
                        existingHistory.unshift(workoutData);
                        console.log('新規ワークアウトデータを追加しました');
                    }

                    const limitedHistory = existingHistory.slice(0, 50);
                    localStorage.setItem('workoutHistory', JSON.stringify(limitedHistory));
                    this.addToOfflineQueue(workoutData);
                    console.log(`ローカルストレージに保存完了 (${limitedHistory.length}件)`);
                    
                } catch (error) {
                    console.error('ローカルストレージ保存エラー:', error);
                    throw new Error(`ローカルストレージへの保存に失敗しました: ${error.message}`);
                }
            }

            addToOfflineQueue(workoutData) {
                try {
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
                    console.log('オフライン同期キューに追加:', workoutData.id);
                    
                } catch (error) {
                    console.error('オフライン同期キュー追加エラー:', error);
                }
            }

            removeFromOfflineQueue(workoutId) {
                try {
                    const offlineQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
                    const filteredQueue = offlineQueue.filter(item => item.id !== workoutId);
                    localStorage.setItem('offlineWorkoutQueue', JSON.stringify(filteredQueue));
                    console.log('オフライン同期キューから削除:', workoutId);
                } catch (error) {
                    console.error('オフライン同期キュー削除エラー:', error);
                }
            }

            onWorkoutSaved(workoutData) {
                this.updateWorkoutStats(workoutData);
                console.log('ワークアウト保存完了イベントを発火しました');
            }

            updateWorkoutStats(workoutData) {
                try {
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
                    console.log('ワークアウト統計情報を更新しました:', stats);
                    
                } catch (error) {
                    console.error('統計情報更新エラー:', error);
                }
            }
        }

        app = new TestMuscleRotationApp();
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
        global.navigator = originalNavigator;
        jest.clearAllMocks();
    });

    describe('saveWorkoutData()', () => {
        test('currentWorkoutがnullの場合は早期リターンする', async () => {
            app.currentWorkout = null;
            
            await app.saveWorkoutData();
            
            expect(mockSupabaseService.saveWorkout).not.toHaveBeenCalled();
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        test('オンライン時はSupabaseに保存される', async () => {
            const mockWorkout = {
                id: 'test-workout-1',
                muscleGroups: ['chest', 'shoulders'],
                exercises: [],
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T11:00:00Z'),
                notes: 'テストワークアウト'
            };
            
            app.currentWorkout = mockWorkout;
            mockSupabaseService.saveWorkout.mockResolvedValue({ id: 'saved-workout-id' });
            localStorage.getItem.mockReturnValue('[]');

            await app.saveWorkoutData();

            expect(mockSupabaseService.saveWorkout).toHaveBeenCalledWith(
                expect.objectContaining({
                    session_name: expect.any(String),
                    workout_date: expect.any(String),
                    start_time: '2024-01-01T10:00:00.000Z',
                    end_time: '2024-01-01T11:00:00.000Z',
                    total_duration_minutes: 60,
                    muscle_groups_trained: ['chest', 'shoulders'],
                    session_type: 'strength',
                    is_completed: true,
                    notes: 'テストワークアウト'
                })
            );
            expect(showNotification).toHaveBeenCalledWith('ワークアウトデータを保存しました', 'success');
        });

        test('オフライン時はローカルストレージに保存される', async () => {
            const mockWorkout = {
                id: 'test-workout-2',
                muscleGroups: ['back', 'arms'],
                exercises: [],
                startTime: new Date('2024-01-01T14:00:00Z'),
                endTime: new Date('2024-01-01T15:30:00Z')
            };
            
            app.currentWorkout = mockWorkout;
            navigator.onLine = false;
            localStorage.getItem.mockReturnValue('[]');

            await app.saveWorkoutData();

            expect(mockSupabaseService.saveWorkout).not.toHaveBeenCalled();
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutHistory',
                expect.stringContaining('test-workout-2')
            );
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'offlineWorkoutQueue',
                expect.stringContaining('test-workout-2')
            );
            expect(showNotification).toHaveBeenCalledWith('ワークアウトデータを保存しました', 'success');
        });

        test('Supabase保存失敗時はローカルストレージにフォールバック', async () => {
            const mockWorkout = {
                id: 'test-workout-3',
                muscleGroups: ['legs'],
                exercises: [],
                startTime: new Date('2024-01-01T16:00:00Z'),
                endTime: new Date('2024-01-01T17:00:00Z')
            };
            
            app.currentWorkout = mockWorkout;
            mockSupabaseService.saveWorkout.mockRejectedValue(new Error('Network error'));
            localStorage.getItem.mockReturnValue('[]');

            await app.saveWorkoutData();

            expect(mockSupabaseService.saveWorkout).toHaveBeenCalled();
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutHistory',
                expect.stringContaining('test-workout-3')
            );
            expect(showNotification).toHaveBeenCalledWith('オフラインでワークアウトデータを保存しました', 'warning');
        });
    });

    describe('formatWorkoutData()', () => {
        test('ワークアウトデータが正しく整形される', () => {
            const mockWorkout = {
                id: 'test-workout-format',
                name: 'カスタムワークアウト',
                muscleGroups: ['chest', 'shoulders', 'arms'],
                exercises: [
                    { name: 'プッシュアップ', sets: 3, reps: 10 }
                ],
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T11:30:00Z'),
                notes: 'とても良いワークアウトでした'
            };

            const formatted = app.formatWorkoutData(mockWorkout);

            expect(formatted).toEqual({
                id: 'test-workout-format',
                session_name: 'カスタムワークアウト',
                workout_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                start_time: '2024-01-01T10:00:00.000Z',
                end_time: '2024-01-01T11:30:00.000Z',
                total_duration_minutes: 90,
                muscle_groups_trained: ['chest', 'shoulders', 'arms'],
                session_type: 'strength',
                is_completed: true,
                exercises: [{ name: 'プッシュアップ', sets: 3, reps: 10 }],
                notes: 'とても良いワークアウトでした',
                created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
                _offline: false,
                _sync_status: 'pending'
            });
        });

        test('最小時間が1分に設定される', () => {
            const mockWorkout = {
                id: 'test-workout-short',
                muscleGroups: ['abs'],
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T10:00:30Z') // 30秒後
            };

            const formatted = app.formatWorkoutData(mockWorkout);

            expect(formatted.total_duration_minutes).toBe(1);
        });
    });

    describe('updateWorkoutStats()', () => {
        test('統計情報が正しく更新される', () => {
            const mockWorkoutData = {
                id: 'test-workout-stats',
                workout_date: '2024-01-01',
                total_duration_minutes: 45,
                muscle_groups_trained: ['chest', 'shoulders']
            };

            localStorage.getItem.mockReturnValue('{"totalWorkouts": 5, "totalMinutes": 200}');

            app.updateWorkoutStats(mockWorkoutData);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutStats',
                JSON.stringify({
                    totalWorkouts: 6,
                    totalMinutes: 245,
                    lastWorkoutDate: '2024-01-01',
                    muscleGroupStats: {
                        chest: 1,
                        shoulders: 1
                    }
                })
            );
        });

        test('初回統計情報が正しく作成される', () => {
            const mockWorkoutData = {
                id: 'test-workout-first',
                workout_date: '2024-01-01',
                total_duration_minutes: 30,
                muscle_groups_trained: ['back']
            };

            localStorage.getItem.mockReturnValue('{}');

            app.updateWorkoutStats(mockWorkoutData);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'workoutStats',
                JSON.stringify({
                    totalWorkouts: 1,
                    totalMinutes: 30,
                    lastWorkoutDate: '2024-01-01',
                    muscleGroupStats: {
                        back: 1
                    }
                })
            );
        });
    });

    describe('オフライン同期キュー管理', () => {
        test('オフラインキューにデータが追加される', () => {
            const mockWorkoutData = {
                id: 'test-workout-queue',
                session_name: 'テストワークアウト'
            };

            localStorage.getItem.mockReturnValue('[]');

            app.addToOfflineQueue(mockWorkoutData);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'offlineWorkoutQueue',
                expect.stringContaining('"id":"test-workout-queue"')
            );
        });

        test('オフラインキューからデータが削除される', () => {
            const mockQueue = [
                { id: 'workout-1', data: {} },
                { id: 'workout-2', data: {} },
                { id: 'workout-3', data: {} }
            ];

            localStorage.getItem.mockReturnValue(JSON.stringify(mockQueue));

            app.removeFromOfflineQueue('workout-2');

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'offlineWorkoutQueue',
                JSON.stringify([
                    { id: 'workout-1', data: {} },
                    { id: 'workout-3', data: {} }
                ])
            );
        });
    });
});
