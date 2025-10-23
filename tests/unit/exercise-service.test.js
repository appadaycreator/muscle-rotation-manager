// exercise-service.test.js - エクササイズサービスのユニットテスト

import { TestRunner } from '../test-runner.js';
import { exerciseService } from '../../js/services/exerciseService.js';
import { supabaseService } from '../../js/services/supabaseService.js';

const testRunner = new TestRunner('Exercise Service Tests');

// モックデータ
const mockExercises = [
    {
        id: 'ex1',
        name: 'Push-ups',
        name_en: 'Push-ups',
        name_ja: 'プッシュアップ',
        muscle_group_id: 'chest',
        equipment: 'bodyweight',
        difficulty_level: 1,
        is_compound: true,
        is_bodyweight: true,
        is_beginner_friendly: true,
        is_custom: false,
        description: 'Classic bodyweight chest exercise',
        muscle_groups: {
            id: 'chest',
            name: 'chest',
            name_ja: '胸筋',
            color_code: '#EF4444'
        }
    },
    {
        id: 'ex2',
        name: 'Diamond Push-ups',
        name_en: 'Diamond Push-ups',
        name_ja: 'ダイヤモンドプッシュアップ',
        muscle_group_id: 'chest',
        equipment: 'bodyweight',
        difficulty_level: 3,
        is_compound: true,
        is_bodyweight: true,
        is_beginner_friendly: false,
        is_custom: false,
        description: 'Targets triceps and inner chest',
        muscle_groups: {
            id: 'chest',
            name: 'chest',
            name_ja: '胸筋',
            color_code: '#EF4444'
        }
    }
];

const mockCustomExercise = {
    id: 'custom1',
    name: 'Custom Exercise',
    name_en: 'Custom Exercise',
    name_ja: 'カスタムエクササイズ',
    muscle_group_id: 'chest',
    equipment: 'dumbbell',
    difficulty_level: 2,
    is_compound: false,
    is_bodyweight: false,
    is_beginner_friendly: true,
    is_custom: true,
    created_by_user_id: 'user123',
    description: 'User created exercise',
    muscle_groups: {
        id: 'chest',
        name: 'chest',
        name_ja: '胸筋',
        color_code: '#EF4444'
    }
};

// Supabaseクライアントのモック
const mockSupabaseClient = {
    from: (table) => ({
        select: (columns) => ({
            eq: (column, value) => ({
                order: (column, options) => ({
                    limit: (limit) => Promise.resolve({ data: mockExercises, error: null }),
                    then: (callback) => callback({ data: mockExercises, error: null })
                }),
                or: (condition) => ({
                    order: (column, options) => ({
                        limit: (limit) => Promise.resolve({ data: mockExercises, error: null }),
                        then: (callback) => callback({ data: mockExercises, error: null })
                    }),
                    then: (callback) => callback({ data: mockExercises, error: null })
                }),
                single: () => Promise.resolve({ data: mockExercises[0], error: null }),
                then: (callback) => callback({ data: mockExercises, error: null })
            }),
            or: (condition) => ({
                order: (column, options) => ({
                    limit: (limit) => Promise.resolve({ data: mockExercises, error: null }),
                    then: (callback) => callback({ data: mockExercises, error: null })
                }),
                then: (callback) => callback({ data: mockExercises, error: null })
            }),
            order: (column, options) => ({
                limit: (limit) => Promise.resolve({ data: mockExercises, error: null }),
                then: (callback) => callback({ data: mockExercises, error: null })
            }),
            single: () => Promise.resolve({ data: mockExercises[0], error: null }),
            then: (callback) => callback({ data: mockExercises, error: null })
        }),
        insert: (data) => ({
            select: (columns) => ({
                single: () => Promise.resolve({ data: mockCustomExercise, error: null })
            })
        }),
        update: (data) => ({
            eq: (column, value) => ({
                select: (columns) => ({
                    single: () => Promise.resolve({ data: mockCustomExercise, error: null })
                })
            })
        }),
        delete: () => ({
            eq: (column, value) => Promise.resolve({ error: null })
        })
    })
};

// テスト前のセットアップ
testRunner.beforeEach(() => {
    // キャッシュをクリア
    exerciseService.clearCache();
    
    // Supabaseサービスのモック
    supabaseService.client = mockSupabaseClient;
    supabaseService.currentUser = { id: 'user123' };
});

// 基本機能のテスト
testRunner.test('全エクササイズ取得', async () => {
    const exercises = await exerciseService.getAllExercises();
    
    testRunner.assert(Array.isArray(exercises), 'エクササイズ配列が返される');
    testRunner.assert(exercises.length > 0, 'エクササイズが存在する');
    testRunner.assert(exercises[0].name_ja, 'エクササイズに日本語名がある');
    testRunner.assert(exercises[0].muscle_groups, 'エクササイズに筋肉部位情報がある');
});

testRunner.test('部位別エクササイズ取得', async () => {
    const exercises = await exerciseService.getExercisesByMuscleGroup('chest');
    
    testRunner.assert(Array.isArray(exercises), 'エクササイズ配列が返される');
    testRunner.assert(exercises.length > 0, 'エクササイズが存在する');
    testRunner.assert(exercises.every(ex => ex.muscle_group_id === 'chest'), '全て胸筋のエクササイズ');
});

testRunner.test('エクササイズ検索 - テキスト検索', async () => {
    const exercises = await exerciseService.searchExercises('プッシュアップ');
    
    testRunner.assert(Array.isArray(exercises), '検索結果が配列で返される');
    testRunner.assert(exercises.length > 0, '検索結果が存在する');
});

testRunner.test('エクササイズ検索 - フィルター適用', async () => {
    const filters = {
        muscleGroupId: 'chest',
        difficulty: 1,
        isBodyweight: true,
        isBeginnerFriendly: true
    };
    
    const exercises = await exerciseService.searchExercises('', filters);
    
    testRunner.assert(Array.isArray(exercises), 'フィルター結果が配列で返される');
    testRunner.assert(exercises.length > 0, 'フィルター結果が存在する');
});

testRunner.test('エクササイズ詳細取得', async () => {
    const exercise = await exerciseService.getExerciseDetails('ex1');
    
    testRunner.assert(exercise !== null, 'エクササイズ詳細が取得される');
    testRunner.assert(exercise.id === 'ex1', '正しいエクササイズが取得される');
    testRunner.assert(exercise.muscle_groups, '筋肉部位情報が含まれる');
});

// カスタムエクササイズのテスト
testRunner.test('カスタムエクササイズ作成', async () => {
    const exerciseData = {
        name_ja: 'テストエクササイズ',
        name_en: 'Test Exercise',
        name: 'Test Exercise',
        muscle_group_id: 'chest',
        equipment: 'dumbbell',
        difficulty_level: 2,
        description: 'テスト用エクササイズ',
        is_bodyweight: false,
        is_compound: false,
        is_beginner_friendly: true,
        is_public: false
    };
    
    const result = await exerciseService.createCustomExercise(exerciseData);
    
    testRunner.assert(result !== null, 'カスタムエクササイズが作成される');
    testRunner.assert(result.is_custom === true, 'カスタムフラグが設定される');
    testRunner.assert(result.created_by_user_id === 'user123', 'ユーザーIDが設定される');
});

testRunner.test('カスタムエクササイズ更新', async () => {
    const updateData = {
        name_ja: '更新されたエクササイズ',
        description: '更新された説明'
    };
    
    const result = await exerciseService.updateCustomExercise('custom1', updateData);
    
    testRunner.assert(result !== null, 'カスタムエクササイズが更新される');
    testRunner.assert(result.id === 'custom1', '正しいエクササイズが更新される');
});

testRunner.test('カスタムエクササイズ削除', async () => {
    const result = await exerciseService.deleteCustomExercise('custom1');
    
    testRunner.assert(result === true, 'カスタムエクササイズが削除される');
});

testRunner.test('ユーザーのカスタムエクササイズ取得', async () => {
    const exercises = await exerciseService.getUserCustomExercises();
    
    testRunner.assert(Array.isArray(exercises), 'カスタムエクササイズ配列が返される');
});

// 特殊機能のテスト
testRunner.test('人気エクササイズ取得', async () => {
    const exercises = await exerciseService.getPopularExercises(5);
    
    testRunner.assert(Array.isArray(exercises), '人気エクササイズ配列が返される');
    testRunner.assert(exercises.length <= 5, '指定した件数以下で返される');
});

testRunner.test('高評価エクササイズ取得', async () => {
    const exercises = await exerciseService.getTopRatedExercises(5);
    
    testRunner.assert(Array.isArray(exercises), '高評価エクササイズ配列が返される');
    testRunner.assert(exercises.length <= 5, '指定した件数以下で返される');
});

testRunner.test('初心者向けエクササイズ取得', async () => {
    const exercises = await exerciseService.getBeginnerExercises();
    
    testRunner.assert(Array.isArray(exercises), '初心者向けエクササイズ配列が返される');
});

testRunner.test('自重エクササイズ取得', async () => {
    const exercises = await exerciseService.getBodyweightExercises();
    
    testRunner.assert(Array.isArray(exercises), '自重エクササイズ配列が返される');
});

testRunner.test('利用可能器具一覧取得', async () => {
    const equipment = await exerciseService.getAvailableEquipment();
    
    testRunner.assert(Array.isArray(equipment), '器具配列が返される');
    testRunner.assert(equipment.length > 0, '器具が存在する');
});

// キャッシュ機能のテスト
testRunner.test('キャッシュ機能', async () => {
    // 初回取得
    const exercises1 = await exerciseService.getAllExercises();
    
    // 2回目取得（キャッシュから）
    const exercises2 = await exerciseService.getAllExercises();
    
    testRunner.assert(exercises1.length === exercises2.length, 'キャッシュから同じデータが返される');
    
    // キャッシュクリア
    exerciseService.clearCache();
    
    // 3回目取得（キャッシュクリア後）
    const exercises3 = await exerciseService.getAllExercises();
    
    testRunner.assert(exercises3.length === exercises1.length, 'キャッシュクリア後も正常に取得される');
});

// エラーハンドリングのテスト
testRunner.test('Supabase未利用時の動作', async () => {
    // Supabaseを無効化
    const originalClient = supabaseService.client;
    supabaseService.client = null;
    
    const exercises = await exerciseService.getAllExercises();
    
    testRunner.assert(Array.isArray(exercises), '空配列が返される');
    testRunner.assert(exercises.length === 0, '空配列が返される');
    
    // 元に戻す
    supabaseService.client = originalClient;
});

testRunner.test('無効なエクササイズID指定', async () => {
    const exercise = await exerciseService.getExerciseDetails('invalid-id');
    
    testRunner.assert(exercise === null, 'nullが返される');
});

testRunner.test('空の検索語での検索', async () => {
    const exercises = await exerciseService.searchExercises('');
    
    testRunner.assert(Array.isArray(exercises), '全エクササイズが返される');
});

testRunner.test('存在しない部位での検索', async () => {
    const exercises = await exerciseService.getExercisesByMuscleGroup('invalid-muscle');
    
    testRunner.assert(Array.isArray(exercises), '空配列が返される');
    testRunner.assert(exercises.length === 0, '空配列が返される');
});

// バリデーションのテスト
testRunner.test('カスタムエクササイズ作成 - 認証なし', async () => {
    // ユーザーを無効化
    const originalUser = supabaseService.currentUser;
    supabaseService.currentUser = null;
    
    try {
        await exerciseService.createCustomExercise({});
        testRunner.assert(false, 'エラーが発生すべき');
    } catch (error) {
        testRunner.assert(error.message.includes('認証'), '認証エラーが発生する');
    }
    
    // 元に戻す
    supabaseService.currentUser = originalUser;
});

export { testRunner as exerciseServiceTests };
