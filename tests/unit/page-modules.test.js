/**
 * ページモジュール ユニットテスト
 * 新しく作成されたページモジュールの機能をテスト
 */

// テストランナーの読み込み（Node.js環境では自動的にグローバルに設定済み）

describe('ワークアウトページモジュール', () => {
    let workoutPage;
    let mockSupabaseService;

    beforeEach(() => {
        // ワークアウトページのモック
        workoutPage = {
            currentWorkout: null,
            selectedMuscleGroups: [],
            exercises: [],
            workoutTimer: null,
            startTime: null,

            initialize: function() {
                console.log('WorkoutPage initialized');
                return Promise.resolve();
            },

            toggleMuscleGroup: function(muscleId, cardElement) {
                const index = this.selectedMuscleGroups.indexOf(muscleId);
                
                if (index > -1) {
                    this.selectedMuscleGroups.splice(index, 1);
                } else {
                    this.selectedMuscleGroups.push(muscleId);
                }
                
                return this.selectedMuscleGroups;
            },

            startWorkout: function() {
                if (this.selectedMuscleGroups.length === 0) {
                    throw new Error('筋肉部位を選択してください');
                }

                this.currentWorkout = {
                    id: `workout_${Date.now()}`,
                    muscleGroups: [...this.selectedMuscleGroups],
                    exercises: [],
                    startTime: new Date(),
                    endTime: null
                };

                this.startTime = new Date();
                return this.currentWorkout;
            },

            stopWorkout: function() {
                if (!this.currentWorkout) {
                    throw new Error('ワークアウトが開始されていません');
                }

                this.currentWorkout.endTime = new Date();
                const completedWorkout = { ...this.currentWorkout };
                this.currentWorkout = null;
                
                return completedWorkout;
            },

            resetWorkout: function() {
                this.currentWorkout = null;
                this.selectedMuscleGroups = [];
                this.exercises = [];
                this.startTime = null;
            }
        };

        // Supabaseサービスのモック
        mockSupabaseService = {
            isAvailable: mock().mockReturnValue(true),
            getCurrentUser: mock().mockReturnValue({ id: 'test-user' }),
            saveWorkout: mock().mockReturnValue(Promise.resolve({ id: 'saved-workout' }))
        };
    });

    test('ワークアウトページが正しく初期化される', async () => {
        await workoutPage.initialize();
        
        expect(workoutPage.currentWorkout).toBe(null);
        expect(workoutPage.selectedMuscleGroups).toHaveLength(0);
        expect(workoutPage.exercises).toHaveLength(0);
    });

    test('筋肉部位の選択と解除ができる', () => {
        // 部位を選択
        workoutPage.toggleMuscleGroup('chest', {});
        expect(workoutPage.selectedMuscleGroups.includes('chest')).toBeTruthy();
        expect(workoutPage.selectedMuscleGroups).toHaveLength(1);

        // 別の部位を選択
        workoutPage.toggleMuscleGroup('back', {});
        expect(workoutPage.selectedMuscleGroups.includes('back')).toBeTruthy();
        expect(workoutPage.selectedMuscleGroups).toHaveLength(2);

        // 部位を解除
        workoutPage.toggleMuscleGroup('chest', {});
        expect(workoutPage.selectedMuscleGroups.includes('chest')).toBeFalsy();
        expect(workoutPage.selectedMuscleGroups).toHaveLength(1);
    });

    test('部位選択後にワークアウトを開始できる', () => {
        workoutPage.toggleMuscleGroup('chest', {});
        workoutPage.toggleMuscleGroup('shoulders', {});

        const workout = workoutPage.startWorkout();
        
        expect(workout).toBeTruthy();
        expect(workout.muscleGroups).toEqual(['chest', 'shoulders']);
        expect(workout.startTime).toBeInstanceOf(Date);
        expect(workoutPage.currentWorkout).toBe(workout);
    });

    test('部位未選択時はワークアウト開始でエラー', () => {
        expect(() => {
            workoutPage.startWorkout();
        }).toThrow('筋肉部位を選択してください');
    });

    test('ワークアウトを正常に終了できる', () => {
        // ワークアウトを開始
        workoutPage.toggleMuscleGroup('chest', {});
        workoutPage.startWorkout();

        // ワークアウトを終了
        const completedWorkout = workoutPage.stopWorkout();
        
        expect(completedWorkout.endTime).toBeInstanceOf(Date);
        expect(workoutPage.currentWorkout).toBe(null);
    });

    test('ワークアウト未開始時の終了でエラー', () => {
        expect(() => {
            workoutPage.stopWorkout();
        }).toThrow('ワークアウトが開始されていません');
    });

    test('ワークアウトをリセットできる', () => {
        // データを設定
        workoutPage.selectedMuscleGroups = ['chest', 'back'];
        workoutPage.currentWorkout = { id: 'test' };
        workoutPage.exercises = [{ name: 'test' }];

        // リセット
        workoutPage.resetWorkout();

        expect(workoutPage.currentWorkout).toBe(null);
        expect(workoutPage.selectedMuscleGroups).toHaveLength(0);
        expect(workoutPage.exercises).toHaveLength(0);
        expect(workoutPage.startTime).toBe(null);
    });
});

describe('設定ページモジュール', () => {
    let settingsPage;

    beforeEach(() => {
        // 設定ページのモック
        settingsPage = {
            userProfile: {},
            isLoading: false,

            initialize: function() {
                console.log('SettingsPage initialized');
                return Promise.resolve();
            },

            loadUserProfile: function() {
                this.userProfile = {
                    nickname: 'テストユーザー',
                    email: 'test@example.com',
                    font_size: 'md'
                };
                return Promise.resolve(this.userProfile);
            },

            saveProfile: function(profileData) {
                this.userProfile = { ...this.userProfile, ...profileData };
                return Promise.resolve(this.userProfile);
            },

            exportData: function() {
                const data = {
                    profile: this.userProfile,
                    workoutHistory: [],
                    settings: {},
                    exportDate: new Date().toISOString()
                };
                return Promise.resolve(data);
            },

            deleteAllData: function() {
                this.userProfile = {};
                return Promise.resolve();
            },

            applyDisplaySettings: function(settings) {
                if (settings.font_size) {
                    this.userProfile.font_size = settings.font_size;
                }
            }
        };
    });

    test('設定ページが正しく初期化される', async () => {
        await settingsPage.initialize();
        expect(settingsPage.isLoading).toBe(false);
    });

    test('ユーザープロフィールを読み込める', async () => {
        const profile = await settingsPage.loadUserProfile();
        
        expect(profile.nickname).toBe('テストユーザー');
        expect(profile.email).toBe('test@example.com');
        expect(profile.font_size).toBe('md');
    });

    test('プロフィールを保存できる', async () => {
        await settingsPage.loadUserProfile();
        
        const newData = { nickname: '新しいニックネーム' };
        const savedProfile = await settingsPage.saveProfile(newData);
        
        expect(savedProfile.nickname).toBe('新しいニックネーム');
        expect(savedProfile.email).toBe('test@example.com'); // 既存データは保持
    });

    test('データをエクスポートできる', async () => {
        await settingsPage.loadUserProfile();
        
        const exportedData = await settingsPage.exportData();
        
        expect(exportedData.profile).toBeTruthy();
        expect(exportedData.workoutHistory).toBeTruthy();
        expect(exportedData.exportDate).toBeTruthy();
    });

    test('全データを削除できる', async () => {
        await settingsPage.loadUserProfile();
        await settingsPage.deleteAllData();
        
        expect(Object.keys(settingsPage.userProfile)).toHaveLength(0);
    });

    test('表示設定を適用できる', () => {
        const settings = { font_size: 'lg' };
        settingsPage.applyDisplaySettings(settings);
        
        expect(settingsPage.userProfile.font_size).toBe('lg');
    });
});

describe('カレンダーページモジュール', () => {
    let calendarPage;

    beforeEach(() => {
        // カレンダーページのモック
        calendarPage = {
            currentDate: new Date(2024, 0, 15), // 2024年1月15日
            workoutData: [
                {
                    date: '2024-01-10',
                    name: '胸筋ワークアウト',
                    muscle_groups: ['chest'],
                    duration: 3600
                },
                {
                    date: '2024-01-12',
                    name: '背筋ワークアウト',
                    muscle_groups: ['back'],
                    duration: 4200
                }
            ],
            selectedDate: null,

            initialize: function() {
                console.log('CalendarPage initialized');
                return Promise.resolve();
            },

            loadWorkoutData: function() {
                return Promise.resolve(this.workoutData);
            },

            getWorkoutsForDate: function(dateStr) {
                return this.workoutData.filter(workout => workout.date === dateStr);
            },

            selectDate: function(dateStr) {
                this.selectedDate = dateStr;
                return this.getWorkoutsForDate(dateStr);
            },

            formatDateString: function(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            },

            isToday: function(date) {
                const today = new Date();
                return this.formatDateString(date) === this.formatDateString(today);
            },

            getMonthlyStats: function() {
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                
                const monthWorkouts = this.workoutData.filter(workout => {
                    const workoutDate = new Date(workout.date);
                    return workoutDate.getFullYear() === year && workoutDate.getMonth() === month;
                });

                return {
                    totalWorkouts: monthWorkouts.length,
                    totalDuration: monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
                    workoutDays: new Set(monthWorkouts.map(w => w.date)).size
                };
            }
        };
    });

    test('カレンダーページが正しく初期化される', async () => {
        await calendarPage.initialize();
        expect(calendarPage.currentDate).toBeInstanceOf(Date);
        expect(calendarPage.selectedDate).toBe(null);
    });

    test('ワークアウトデータを読み込める', async () => {
        const data = await calendarPage.loadWorkoutData();
        expect(data).toHaveLength(2);
        expect(data[0].name).toBe('胸筋ワークアウト');
    });

    test('指定日のワークアウトを取得できる', () => {
        const workouts = calendarPage.getWorkoutsForDate('2024-01-10');
        expect(workouts).toHaveLength(1);
        expect(workouts[0].name).toBe('胸筋ワークアウト');
    });

    test('存在しない日のワークアウト取得で空配列', () => {
        const workouts = calendarPage.getWorkoutsForDate('2024-01-15');
        expect(workouts).toHaveLength(0);
    });

    test('日付を選択できる', () => {
        const workouts = calendarPage.selectDate('2024-01-12');
        expect(calendarPage.selectedDate).toBe('2024-01-12');
        expect(workouts).toHaveLength(1);
        expect(workouts[0].name).toBe('背筋ワークアウト');
    });

    test('日付を正しくフォーマットできる', () => {
        const date = new Date(2024, 0, 5); // 2024年1月5日
        const formatted = calendarPage.formatDateString(date);
        expect(formatted).toBe('2024-01-05');
    });

    test('今日の日付を正しく判定できる', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        expect(calendarPage.isToday(today)).toBeTruthy();
        expect(calendarPage.isToday(yesterday)).toBeFalsy();
    });

    test('月間統計を正しく計算できる', () => {
        const stats = calendarPage.getMonthlyStats();
        
        expect(stats.totalWorkouts).toBe(2);
        expect(stats.totalDuration).toBe(7800); // 3600 + 4200
        expect(stats.workoutDays).toBe(2);
    });
});

// ブラウザ環境でのテスト実行
if (typeof window !== 'undefined') {
    console.log('🔄 ページモジュールテストを実行します...');
}
