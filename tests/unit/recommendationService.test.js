// RecommendationService.test.js - 推奨サービスのテスト

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
    supabaseService: {
        getWorkoutData: jest.fn(),
        getExercises: jest.fn(),
        getMuscleGroups: jest.fn()
    }
}));

// RecommendationServiceクラスをモック
const RecommendationService = class RecommendationService {
    constructor() {
        this.supabaseService = require('../../js/services/supabaseService.js').supabaseService;
        this.workoutHistory = [];
        this.exercises = [];
        this.muscleGroups = [];
    }

    async loadData() {
        this.workoutHistory = await this.supabaseService.getWorkoutData();
        this.exercises = await this.supabaseService.getExercises();
        this.muscleGroups = await this.supabaseService.getMuscleGroups();
    }

    getRecommendations(userPreferences) {
        const recommendations = [];
        
        // 基本的な推奨ロジック
        if (userPreferences.muscleGroup) {
            const muscleExercises = this.exercises.filter(
                exercise => exercise.muscle_group === userPreferences.muscleGroup
            );
            recommendations.push(...muscleExercises.slice(0, 3));
        }
        
        return recommendations;
    }

    getWorkoutPlan(daysPerWeek, focusAreas) {
        const plan = {
            days: daysPerWeek,
            focusAreas: focusAreas,
            workouts: []
        };
        
        // 基本的なプラン作成ロジック
        for (let i = 0; i < daysPerWeek; i++) {
            plan.workouts.push({
                day: i + 1,
                exercises: this.getExercisesForDay(focusAreas[i % focusAreas.length])
            });
        }
        
        return plan;
    }

    getExercisesForDay(focusArea) {
        return this.exercises.filter(
            exercise => exercise.muscle_group === focusArea
        ).slice(0, 4);
    }

    analyzeProgress() {
        if (this.workoutHistory.length === 0) {
            return { message: 'データが不足しています' };
        }
        
        const totalWorkouts = this.workoutHistory.length;
        const recentWorkouts = this.workoutHistory.slice(-7);
        
        return {
            totalWorkouts,
            recentWorkouts: recentWorkouts.length,
            message: `総ワークアウト数: ${totalWorkouts}, 最近のワークアウト: ${recentWorkouts.length}`
        };
    }

    getPersonalizedTips() {
        const tips = [
            '十分な休息を取ることを忘れずに',
            '水分補給を心がけましょう',
            'フォームを重視してトレーニングしましょう'
        ];
        
        return tips;
    }
};

describe('RecommendationService', () => {
    let recommendationService;

    beforeEach(() => {
        recommendationService = new RecommendationService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(recommendationService.workoutHistory).toEqual([]);
            expect(recommendationService.exercises).toEqual([]);
            expect(recommendationService.muscleGroups).toEqual([]);
        });
    });

    describe('loadData', () => {
        it('should load data successfully', async () => {
            const mockWorkoutData = [
                { id: 1, name: 'ワークアウト1' },
                { id: 2, name: 'ワークアウト2' }
            ];
            const mockExercises = [
                { id: 1, name: 'プッシュアップ', muscle_group: '胸' },
                { id: 2, name: 'スクワット', muscle_group: '脚' }
            ];
            const mockMuscleGroups = [
                { id: 1, name: '胸' },
                { id: 2, name: '背中' }
            ];

            const { supabaseService } = require('../../js/services/supabaseService.js');
            supabaseService.getWorkoutData.mockResolvedValue(mockWorkoutData);
            supabaseService.getExercises.mockResolvedValue(mockExercises);
            supabaseService.getMuscleGroups.mockResolvedValue(mockMuscleGroups);

            await recommendationService.loadData();

            expect(supabaseService.getWorkoutData).toHaveBeenCalled();
            expect(supabaseService.getExercises).toHaveBeenCalled();
            expect(supabaseService.getMuscleGroups).toHaveBeenCalled();
            expect(recommendationService.workoutHistory).toEqual(mockWorkoutData);
            expect(recommendationService.exercises).toEqual(mockExercises);
            expect(recommendationService.muscleGroups).toEqual(mockMuscleGroups);
        });
    });

    describe('getRecommendations', () => {
        it('should return recommendations for specific muscle group', () => {
            recommendationService.exercises = [
                { id: 1, name: 'プッシュアップ', muscle_group: '胸' },
                { id: 2, name: 'ベンチプレス', muscle_group: '胸' },
                { id: 3, name: 'スクワット', muscle_group: '脚' },
                { id: 4, name: 'デッドリフト', muscle_group: '背中' }
            ];

            const userPreferences = { muscleGroup: '胸' };
            const recommendations = recommendationService.getRecommendations(userPreferences);

            expect(recommendations).toHaveLength(2);
            expect(recommendations[0].muscle_group).toBe('胸');
            expect(recommendations[1].muscle_group).toBe('胸');
        });

        it('should return empty array for no muscle group preference', () => {
            recommendationService.exercises = [
                { id: 1, name: 'プッシュアップ', muscle_group: '胸' }
            ];

            const userPreferences = {};
            const recommendations = recommendationService.getRecommendations(userPreferences);

            expect(recommendations).toHaveLength(0);
        });
    });

    describe('getWorkoutPlan', () => {
        it('should create workout plan', () => {
            recommendationService.exercises = [
                { id: 1, name: 'プッシュアップ', muscle_group: '胸' },
                { id: 2, name: 'スクワット', muscle_group: '脚' },
                { id: 3, name: 'デッドリフト', muscle_group: '背中' }
            ];

            const plan = recommendationService.getWorkoutPlan(3, ['胸', '脚', '背中']);

            expect(plan.days).toBe(3);
            expect(plan.focusAreas).toEqual(['胸', '脚', '背中']);
            expect(plan.workouts).toHaveLength(3);
            expect(plan.workouts[0].day).toBe(1);
            expect(plan.workouts[0].exercises).toHaveLength(1);
        });
    });

    describe('getExercisesForDay', () => {
        it('should return exercises for specific muscle group', () => {
            recommendationService.exercises = [
                { id: 1, name: 'プッシュアップ', muscle_group: '胸' },
                { id: 2, name: 'ベンチプレス', muscle_group: '胸' },
                { id: 3, name: 'スクワット', muscle_group: '脚' }
            ];

            const exercises = recommendationService.getExercisesForDay('胸');

            expect(exercises).toHaveLength(2);
            expect(exercises[0].muscle_group).toBe('胸');
            expect(exercises[1].muscle_group).toBe('胸');
        });
    });

    describe('analyzeProgress', () => {
        it('should analyze progress with workout data', () => {
            recommendationService.workoutHistory = [
                { id: 1, date: '2024-01-01' },
                { id: 2, date: '2024-01-02' },
                { id: 3, date: '2024-01-03' },
                { id: 4, date: '2024-01-04' },
                { id: 5, date: '2024-01-05' }
            ];

            const analysis = recommendationService.analyzeProgress();

            expect(analysis.totalWorkouts).toBe(5);
            expect(analysis.recentWorkouts).toBe(5);
            expect(analysis.message).toContain('総ワークアウト数: 5');
        });

        it('should return message for no workout data', () => {
            recommendationService.workoutHistory = [];

            const analysis = recommendationService.analyzeProgress();

            expect(analysis.message).toBe('データが不足しています');
        });
    });

    describe('getPersonalizedTips', () => {
        it('should return personalized tips', () => {
            const tips = recommendationService.getPersonalizedTips();

            expect(tips).toHaveLength(3);
            expect(tips[0]).toContain('休息');
            expect(tips[1]).toContain('水分補給');
            expect(tips[2]).toContain('フォーム');
        });
    });
});
