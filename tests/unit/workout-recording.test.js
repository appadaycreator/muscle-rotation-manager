// workout-recording.test.js - ワークアウト記録機能のユニットテスト

// テストランナーのインスタンス化（既存のグローバルインスタンスを使用）
const testRunner = global.testRunner || (typeof window !== 'undefined' ? window.testRunner : null);

if (!testRunner) {
    console.error('❌ TestRunner not found. Make sure test-runner.js is loaded first.');
    process.exit(1);
}

// テストスイート: ワークアウト記録機能
testRunner.describe('ワークアウト記録機能', () => {
    let workoutPage;
    let mockSupabaseService;

    // 各テスト前の準備
    testRunner.beforeEach(() => {
        // DOM環境をクリア
        document.body.innerHTML = '';
        
        // LocalStorageをクリア
        localStorage.clear();
        
        // モックSupabaseサービスを作成
        mockSupabaseService = {
            isAvailable: () => true,
            getCurrentUser: () => ({ id: 'test-user-id', email: 'test@example.com' }),
            saveWorkout: async (data) => [{ id: 'session-123', ...data }],
            saveTrainingLog: async (data) => [{ id: 'log-123', ...data }],
            saveTrainingLogs: async (data) => data.map((item, index) => ({ id: `log-${index}`, ...item }))
        };
        
        // WorkoutPageのモック作成
        workoutPage = {
            currentWorkout: null,
            selectedMuscleGroups: [],
            exercises: [],
            workoutTimer: null,
            startTime: null,
            
            // リアルタイム保存機能
            saveExerciseRealtime: async function(exercise) {
                if (mockSupabaseService.isAvailable() && mockSupabaseService.getCurrentUser()) {
                    if (this.currentWorkout?.sessionId) {
                        const trainingLog = {
                            workout_session_id: this.currentWorkout.sessionId,
                            muscle_group_id: exercise.muscleGroups[0],
                            exercise_name: exercise.name,
                            sets: exercise.sets,
                            reps: [exercise.reps],
                            weights: [exercise.weight],
                            workout_date: new Date().toISOString().split('T')[0],
                            notes: exercise.notes
                        };
                        await mockSupabaseService.saveTrainingLog(trainingLog);
                        return true;
                    }
                }
                return false;
            },
            
            // データ保存機能
            saveWorkoutData: async function(workoutData) {
                try {
                    if (mockSupabaseService.isAvailable() && mockSupabaseService.getCurrentUser()) {
                        const sessionData = {
                            session_name: `ワークアウト ${new Date().toLocaleDateString()}`,
                            workout_date: workoutData.startTime.toISOString().split('T')[0],
                            start_time: workoutData.startTime.toISOString(),
                            end_time: workoutData.endTime.toISOString(),
                            total_duration_minutes: workoutData.duration,
                            muscle_groups_trained: workoutData.muscleGroups,
                            session_type: 'strength',
                            is_completed: true
                        };
                        
                        const savedSession = await mockSupabaseService.saveWorkout(sessionData);
                        const sessionId = savedSession[0]?.id;
                        
                        if (sessionId && workoutData.exercises.length > 0) {
                            const trainingLogs = workoutData.exercises.map(exercise => ({
                                workout_session_id: sessionId,
                                muscle_group_id: workoutData.muscleGroups[0],
                                exercise_name: exercise.name,
                                sets: exercise.sets,
                                reps: [exercise.reps],
                                weights: [exercise.weight],
                                workout_date: workoutData.startTime.toISOString().split('T')[0],
                                notes: exercise.notes || null
                            }));
                            
                            await mockSupabaseService.saveTrainingLogs(trainingLogs);
                        }
                        
                        await this.updateWorkoutStatistics(workoutData);
                        return true;
                    } else {
                        await this.saveToLocalStorage(workoutData);
                        return true;
                    }
                } catch (error) {
                    await this.saveToLocalStorage(workoutData);
                    return false;
                }
            },
            
            // ローカルストレージ保存
            saveToLocalStorage: async function(workoutData) {
                const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
                const enhancedData = {
                    ...workoutData,
                    id: workoutData.id || `workout_${Date.now()}`,
                    savedAt: new Date().toISOString(),
                    syncStatus: 'pending'
                };
                
                history.unshift(enhancedData);
                localStorage.setItem('workoutHistory', JSON.stringify(history.slice(0, 50)));
                
                const syncQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
                syncQueue.push({
                    id: enhancedData.id,
                    data: enhancedData,
                    operation: 'INSERT',
                    timestamp: Date.now()
                });
                localStorage.setItem('offlineWorkoutQueue', JSON.stringify(syncQueue));
            },
            
            // 統計更新
            updateWorkoutStatistics: async function(workoutData) {
                try {
                    const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
                    const today = new Date().toISOString().split('T')[0];
                    
                    if (!stats[today]) {
                        stats[today] = {
                            workouts: 0,
                            exercises: 0,
                            duration: 0,
                            muscleGroups: []
                        };
                    }
                    
                    stats[today].workouts += 1;
                    stats[today].exercises += workoutData.exercises.length;
                    stats[today].duration += workoutData.duration;
                    stats[today].muscleGroups = [...new Set([
                        ...stats[today].muscleGroups,
                        ...workoutData.muscleGroups
                    ])];
                    
                    localStorage.setItem('workoutStats', JSON.stringify(stats));
                    return true;
                } catch (error) {
                    return false;
                }
            },
            
            // ワークアウト開始
            startWorkout: async function() {
                if (this.selectedMuscleGroups.length === 0) {
                    throw new Error('筋肉部位を選択してください');
                }
                
                this.currentWorkout = {
                    id: `workout_${Date.now()}`,
                    muscleGroups: [...this.selectedMuscleGroups],
                    exercises: [],
                    startTime: new Date(),
                    endTime: null,
                    sessionId: 'session-123'
                };
                
                this.startTime = new Date();
                return this.currentWorkout;
            },
            
            // エクササイズ追加
            addExercise: async function(exerciseData) {
                if (!this.currentWorkout) {
                    throw new Error('ワークアウトが開始されていません');
                }
                
                const exercise = {
                    id: `exercise_${Date.now()}`,
                    name: exerciseData.name,
                    weight: parseFloat(exerciseData.weight),
                    reps: parseInt(exerciseData.reps),
                    sets: parseInt(exerciseData.sets),
                    notes: exerciseData.notes || '',
                    timestamp: new Date(),
                    muscleGroups: [...this.selectedMuscleGroups]
                };
                
                this.exercises.push(exercise);
                this.currentWorkout.exercises.push(exercise);
                
                // リアルタイム保存
                await this.saveExerciseRealtime(exercise);
                
                return exercise;
            },
            
            // ワークアウト完了
            completeWorkout: async function() {
                if (!this.currentWorkout) {
                    throw new Error('ワークアウトが開始されていません');
                }
                
                this.currentWorkout.endTime = new Date();
                this.currentWorkout.duration = Math.floor(
                    (this.currentWorkout.endTime - this.currentWorkout.startTime) / (1000 * 60)
                );
                
                const success = await this.saveWorkoutData(this.currentWorkout);
                return { success, workout: this.currentWorkout };
            }
        };
    });

    // テスト1: エクササイズのリアルタイム保存
    testRunner.test('エクササイズをリアルタイムで保存できる', async () => {
        workoutPage.selectedMuscleGroups = ['chest'];
        await workoutPage.startWorkout();
        
        const exercise = {
            name: 'ベンチプレス',
            weight: 80,
            reps: 10,
            sets: 3,
            notes: 'フォーム良好'
        };
        
        const addedExercise = await workoutPage.addExercise(exercise);
        
        testRunner.expect(addedExercise.name).toBe('ベンチプレス');
        testRunner.expect(addedExercise.weight).toBe(80);
        testRunner.expect(addedExercise.reps).toBe(10);
        testRunner.expect(addedExercise.sets).toBe(3);
        testRunner.expect(workoutPage.exercises.length).toBe(1);
    });

    // テスト2: ワークアウトデータの完全保存
    testRunner.test('ワークアウトデータを完全に保存できる', async () => {
        workoutPage.selectedMuscleGroups = ['chest', 'shoulders'];
        await workoutPage.startWorkout();
        
        // 複数のエクササイズを追加
        await workoutPage.addExercise({
            name: 'ベンチプレス',
            weight: 80,
            reps: 10,
            sets: 3
        });
        
        await workoutPage.addExercise({
            name: 'ショルダープレス',
            weight: 30,
            reps: 12,
            sets: 3
        });
        
        const result = await workoutPage.completeWorkout();
        
        console.log('Test 2 Debug - result:', result);
        console.log('Test 2 Debug - result.success:', result.success);
        console.log('Test 2 Debug - typeof result.success:', typeof result.success);
        console.log('Test 2 Debug - result.success === true:', result.success === true);
        
        // 直接比較をテスト
        if (result.success !== true) {
            console.log('❌ Direct comparison failed!');
            console.log('result.success:', result.success);
            console.log('true:', true);
        } else {
            console.log('✅ Direct comparison passed!');
        }
        
        testRunner.expect(result.success).toBe(true);
        testRunner.expect(result.workout.exercises.length).toBe(2);
        testRunner.expect(result.workout.duration > 0).toBe(true);
        testRunner.expect(result.workout.endTime !== null).toBe(true);
    });

    // テスト3: オフライン時のローカル保存
    testRunner.test('オフライン時にローカルストレージに保存される', async () => {
        // オフライン状態をシミュレート
        mockSupabaseService.isAvailable = () => false;
        
        workoutPage.selectedMuscleGroups = ['legs'];
        await workoutPage.startWorkout();
        
        await workoutPage.addExercise({
            name: 'スクワット',
            weight: 100,
            reps: 15,
            sets: 4
        });
        
        await workoutPage.completeWorkout();
        
        // ローカルストレージに保存されているかチェック
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        const syncQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
        
        testRunner.expect(history.length).toBe(1);
        testRunner.expect(syncQueue.length).toBe(1);
        testRunner.expect(history[0].exercises.length).toBe(1);
        testRunner.expect(history[0].exercises[0].name).toBe('スクワット');
    });

    // テスト4: 統計情報の更新
    testRunner.test('ワークアウト完了時に統計情報が更新される', async () => {
        workoutPage.selectedMuscleGroups = ['back'];
        await workoutPage.startWorkout();
        
        await workoutPage.addExercise({
            name: 'プルアップ',
            weight: 0,
            reps: 8,
            sets: 3
        });
        
        await workoutPage.addExercise({
            name: 'ローイング',
            weight: 60,
            reps: 12,
            sets: 3
        });
        
        await workoutPage.completeWorkout();
        
        const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
        const today = new Date().toISOString().split('T')[0];
        
        testRunner.expect(stats[today] !== undefined).toBe(true);
        testRunner.expect(stats[today].workouts).toBe(1);
        testRunner.expect(stats[today].exercises).toBe(2);
        testRunner.expect(stats[today].duration > 0).toBe(true);
        testRunner.expect(stats[today].muscleGroups.includes('back')).toBe(true);
    });

    // テスト5: エクササイズ追加時のバリデーション
    testRunner.test('ワークアウト未開始時のエクササイズ追加でエラーが発生する', async () => {
        let errorThrown = false;
        
        try {
            await workoutPage.addExercise({
                name: 'ベンチプレス',
                weight: 80,
                reps: 10,
                sets: 3
            });
        } catch (error) {
            errorThrown = true;
            testRunner.expect(error.message).toBe('ワークアウトが開始されていません');
        }
        
        testRunner.expect(errorThrown).toBe(true);
    });

    // テスト6: 複数セッションの統計集計
    testRunner.test('複数のワークアウトセッションの統計が正しく集計される', async () => {
        // 1回目のワークアウト
        workoutPage.selectedMuscleGroups = ['chest'];
        await workoutPage.startWorkout();
        await workoutPage.addExercise({
            name: 'プッシュアップ',
            weight: 0,
            reps: 20,
            sets: 3
        });
        await workoutPage.completeWorkout();
        
        // 2回目のワークアウト
        workoutPage.selectedMuscleGroups = ['legs'];
        await workoutPage.startWorkout();
        await workoutPage.addExercise({
            name: 'スクワット',
            weight: 50,
            reps: 15,
            sets: 4
        });
        await workoutPage.completeWorkout();
        
        const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
        const today = new Date().toISOString().split('T')[0];
        
        testRunner.expect(stats[today].workouts).toBe(2);
        testRunner.expect(stats[today].exercises).toBe(2);
        testRunner.expect(stats[today].muscleGroups.includes('chest')).toBe(true);
        testRunner.expect(stats[today].muscleGroups.includes('legs')).toBe(true);
    });

    // テスト7: データ整合性チェック
    testRunner.test('保存されたデータの整合性が保たれる', async () => {
        workoutPage.selectedMuscleGroups = ['arms'];
        const startTime = new Date();
        await workoutPage.startWorkout();
        
        const exerciseData = {
            name: 'バイセップカール',
            weight: 15,
            reps: 12,
            sets: 3,
            notes: 'フォーム確認'
        };
        
        const addedExercise = await workoutPage.addExercise(exerciseData);
        const result = await workoutPage.completeWorkout();
        
        // データ整合性チェック
        testRunner.expect(result.workout.muscleGroups.length).toBe(1);
        testRunner.expect(result.workout.muscleGroups[0]).toBe('arms');
        testRunner.expect(result.workout.exercises[0].name).toBe(exerciseData.name);
        testRunner.expect(result.workout.exercises[0].weight).toBe(exerciseData.weight);
        testRunner.expect(result.workout.startTime >= startTime).toBe(true);
        testRunner.expect(result.workout.endTime > result.workout.startTime).toBe(true);
        testRunner.expect(result.workout.duration >= 0).toBe(true);
    });

    // テスト8: 大量データの処理
    testRunner.test('大量のエクササイズデータを正しく処理できる', async () => {
        workoutPage.selectedMuscleGroups = ['chest', 'back', 'shoulders'];
        await workoutPage.startWorkout();
        
        // 10個のエクササイズを追加
        for (let i = 1; i <= 10; i++) {
            await workoutPage.addExercise({
                name: `エクササイズ${i}`,
                weight: i * 10,
                reps: 10 + i,
                sets: 3
            });
        }
        
        const result = await workoutPage.completeWorkout();
        
        testRunner.expect(result.workout.exercises.length).toBe(10);
        testRunner.expect(workoutPage.exercises.length).toBe(10);
        
        // 各エクササイズのデータが正しく保存されているかチェック
        for (let i = 0; i < 10; i++) {
            const exercise = result.workout.exercises[i];
            testRunner.expect(exercise.name).toBe(`エクササイズ${i + 1}`);
            testRunner.expect(exercise.weight).toBe((i + 1) * 10);
            testRunner.expect(exercise.reps).toBe(10 + (i + 1));
        }
    });
});

// グローバル関数として登録（ブラウザ環境用）
if (typeof window !== 'undefined') {
    window.workoutRecordingTests = testRunner;
}

console.log('🧪 ワークアウト記録機能のテストが読み込まれました');
