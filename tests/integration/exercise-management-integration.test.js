// exercise-management-integration.test.js - エクササイズ管理の統合テスト

import { TestRunner } from '../test-runner.js';
import { exerciseService } from '../../js/services/exerciseService.js';
import { supabaseService } from '../../js/services/supabaseService.js';
import { pageManager } from '../../js/modules/pageManager.js';

const testRunner = new TestRunner('Exercise Management Integration Tests');

// モックDOM要素を作成
function createMockDOM() {
    // メインコンテナ
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    document.body.appendChild(mainContent);

    // サイドバーコンテナ
    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'sidebar-container';
    document.body.appendChild(sidebarContainer);

    // ヘッダーコンテナ
    const headerContainer = document.createElement('div');
    headerContainer.id = 'header-container';
    document.body.appendChild(headerContainer);
}

// モックSupabaseクライアント
const mockSupabaseClient = {
    from: (table) => ({
        select: (columns) => ({
            eq: (column, value) => ({
                order: (column, options) => ({
                    limit: (limit) => Promise.resolve({ 
                        data: [
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
                            }
                        ], 
                        error: null 
                    })
                }),
                or: (condition) => ({
                    order: (column, options) => Promise.resolve({ 
                        data: [
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
                            }
                        ], 
                        error: null 
                    })
                }),
                single: () => Promise.resolve({ 
                    data: {
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
                    error: null 
                })
            }),
            or: (condition) => ({
                order: (column, options) => Promise.resolve({ 
                    data: [
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
                        }
                    ], 
                    error: null 
                })
            }),
            order: (column, options) => Promise.resolve({ 
                data: [
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
                    }
                ], 
                error: null 
            })
        }),
        insert: (data) => ({
            select: (columns) => ({
                single: () => Promise.resolve({ 
                    data: {
                        ...data[0],
                        id: 'custom1',
                        is_custom: true,
                        created_by_user_id: 'user123'
                    }, 
                    error: null 
                })
            })
        }),
        update: (data) => ({
            eq: (column, value) => ({
                select: (columns) => ({
                    single: () => Promise.resolve({ 
                        data: {
                            id: value,
                            ...data,
                            is_custom: true,
                            created_by_user_id: 'user123'
                        }, 
                        error: null 
                    })
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
    // DOM要素をクリア
    document.body.innerHTML = '';
    
    // モックDOM作成
    createMockDOM();
    
    // Supabaseサービスのモック
    supabaseService.client = mockSupabaseClient;
    supabaseService.currentUser = { id: 'user123' };
    
    // キャッシュクリア
    exerciseService.clearCache();
});

// ページナビゲーションのテスト
testRunner.test('エクササイズ管理ページへのナビゲーション', async () => {
    // ページマネージャーのloadPartialをモック
    const originalLoadPartial = pageManager.loadPartial;
    pageManager.loadPartial = async (partialName) => {
        if (partialName === 'exercises-management') {
            return `
                <div id="exercises-management-page" class="page-content">
                    <div id="exercise-search"></div>
                    <div id="exercises-list"></div>
                    <div id="exercises-loader" class="hidden"></div>
                </div>
            `;
        }
        return '<div>Mock content</div>';
    };

    await pageManager.navigateToPage('exercises-management');
    
    testRunner.assert(pageManager.getCurrentPage() === 'exercises-management', 'エクササイズ管理ページに遷移');
    testRunner.assert(document.getElementById('exercises-management-page') !== null, 'エクササイズ管理ページが表示される');
    
    // 元に戻す
    pageManager.loadPartial = originalLoadPartial;
});

// エクササイズサービスとの統合テスト
testRunner.test('エクササイズ一覧の取得と表示', async () => {
    const exercises = await exerciseService.getAllExercises();
    
    testRunner.assert(Array.isArray(exercises), 'エクササイズ配列が取得される');
    testRunner.assert(exercises.length > 0, 'エクササイズが存在する');
    testRunner.assert(exercises[0].name_ja === 'プッシュアップ', '正しいエクササイズデータが取得される');
});

testRunner.test('部位別エクササイズの絞り込み', async () => {
    const chestExercises = await exerciseService.getExercisesByMuscleGroup('chest');
    
    testRunner.assert(Array.isArray(chestExercises), '胸筋エクササイズ配列が取得される');
    testRunner.assert(chestExercises.length > 0, '胸筋エクササイズが存在する');
    testRunner.assert(chestExercises.every(ex => ex.muscle_group_id === 'chest'), '全て胸筋のエクササイズ');
});

testRunner.test('エクササイズ検索機能', async () => {
    // テキスト検索
    const searchResults = await exerciseService.searchExercises('プッシュアップ');
    
    testRunner.assert(Array.isArray(searchResults), '検索結果が配列で返される');
    testRunner.assert(searchResults.length > 0, '検索結果が存在する');
    
    // フィルター検索
    const filterResults = await exerciseService.searchExercises('', {
        muscleGroupId: 'chest',
        isBodyweight: true
    });
    
    testRunner.assert(Array.isArray(filterResults), 'フィルター結果が配列で返される');
    testRunner.assert(filterResults.length > 0, 'フィルター結果が存在する');
});

// カスタムエクササイズの統合テスト
testRunner.test('カスタムエクササイズの作成から削除まで', async () => {
    // 1. カスタムエクササイズ作成
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
    
    const createdExercise = await exerciseService.createCustomExercise(exerciseData);
    
    testRunner.assert(createdExercise !== null, 'カスタムエクササイズが作成される');
    testRunner.assert(createdExercise.is_custom === true, 'カスタムフラグが設定される');
    testRunner.assert(createdExercise.name_ja === 'テストエクササイズ', '正しい名前で作成される');
    
    // 2. カスタムエクササイズ更新
    const updateData = {
        name_ja: '更新されたエクササイズ',
        description: '更新された説明'
    };
    
    const updatedExercise = await exerciseService.updateCustomExercise(createdExercise.id, updateData);
    
    testRunner.assert(updatedExercise !== null, 'カスタムエクササイズが更新される');
    testRunner.assert(updatedExercise.name_ja === '更新されたエクササイズ', '名前が更新される');
    
    // 3. カスタムエクササイズ削除
    const deleteResult = await exerciseService.deleteCustomExercise(createdExercise.id);
    
    testRunner.assert(deleteResult === true, 'カスタムエクササイズが削除される');
});

testRunner.test('ユーザー別カスタムエクササイズの管理', async () => {
    // ユーザーのカスタムエクササイズ取得
    const customExercises = await exerciseService.getUserCustomExercises();
    
    testRunner.assert(Array.isArray(customExercises), 'カスタムエクササイズ配列が取得される');
    
    // 全エクササイズ取得（カスタム含む）
    const allExercises = await exerciseService.getAllExercises({ includeCustom: true });
    
    testRunner.assert(Array.isArray(allExercises), '全エクササイズ配列が取得される');
    
    // カスタムエクササイズ除外
    const publicExercises = await exerciseService.getAllExercises({ includeCustom: false });
    
    testRunner.assert(Array.isArray(publicExercises), '公開エクササイズ配列が取得される');
});

// 特殊機能の統合テスト
testRunner.test('人気・高評価エクササイズの取得', async () => {
    // 人気エクササイズ
    const popularExercises = await exerciseService.getPopularExercises(5);
    
    testRunner.assert(Array.isArray(popularExercises), '人気エクササイズ配列が取得される');
    testRunner.assert(popularExercises.length <= 5, '指定件数以下で取得される');
    
    // 高評価エクササイズ
    const topRatedExercises = await exerciseService.getTopRatedExercises(5);
    
    testRunner.assert(Array.isArray(topRatedExercises), '高評価エクササイズ配列が取得される');
    testRunner.assert(topRatedExercises.length <= 5, '指定件数以下で取得される');
});

testRunner.test('初心者・自重エクササイズの取得', async () => {
    // 初心者向けエクササイズ
    const beginnerExercises = await exerciseService.getBeginnerExercises();
    
    testRunner.assert(Array.isArray(beginnerExercises), '初心者向けエクササイズ配列が取得される');
    
    // 自重エクササイズ
    const bodyweightExercises = await exerciseService.getBodyweightExercises();
    
    testRunner.assert(Array.isArray(bodyweightExercises), '自重エクササイズ配列が取得される');
    
    // 部位指定の初心者向けエクササイズ
    const chestBeginnerExercises = await exerciseService.getBeginnerExercises('chest');
    
    testRunner.assert(Array.isArray(chestBeginnerExercises), '胸筋の初心者向けエクササイズ配列が取得される');
});

// キャッシュ機能の統合テスト
testRunner.test('キャッシュ機能の動作確認', async () => {
    // 初回取得（キャッシュなし）
    const startTime1 = Date.now();
    const exercises1 = await exerciseService.getAllExercises();
    const endTime1 = Date.now();
    
    testRunner.assert(Array.isArray(exercises1), '初回取得が成功する');
    
    // 2回目取得（キャッシュあり）
    const startTime2 = Date.now();
    const exercises2 = await exerciseService.getAllExercises();
    const endTime2 = Date.now();
    
    testRunner.assert(Array.isArray(exercises2), '2回目取得が成功する');
    testRunner.assert(exercises1.length === exercises2.length, 'キャッシュから同じデータが取得される');
    
    // キャッシュクリア後の取得
    exerciseService.clearCache();
    const exercises3 = await exerciseService.getAllExercises();
    
    testRunner.assert(Array.isArray(exercises3), 'キャッシュクリア後の取得が成功する');
    testRunner.assert(exercises3.length === exercises1.length, 'キャッシュクリア後も同じデータが取得される');
});

// エラーハンドリングの統合テスト
testRunner.test('ネットワークエラー時の動作', async () => {
    // Supabaseクライアントを無効化
    const originalClient = supabaseService.client;
    supabaseService.client = null;
    
    const exercises = await exerciseService.getAllExercises();
    
    testRunner.assert(Array.isArray(exercises), 'エラー時も配列が返される');
    testRunner.assert(exercises.length === 0, 'エラー時は空配列が返される');
    
    // 元に戻す
    supabaseService.client = originalClient;
});

testRunner.test('認証エラー時の動作', async () => {
    // ユーザーを無効化
    const originalUser = supabaseService.currentUser;
    supabaseService.currentUser = null;
    
    try {
        await exerciseService.createCustomExercise({
            name_ja: 'テスト',
            name_en: 'Test',
            name: 'Test'
        });
        testRunner.assert(false, 'エラーが発生すべき');
    } catch (error) {
        testRunner.assert(error.message.includes('認証'), '認証エラーが適切に処理される');
    }
    
    // 元に戻す
    supabaseService.currentUser = originalUser;
});

// パフォーマンステスト
testRunner.test('大量データ処理のパフォーマンス', async () => {
    // 複数の検索を並行実行
    const promises = [
        exerciseService.getAllExercises(),
        exerciseService.getExercisesByMuscleGroup('chest'),
        exerciseService.searchExercises('プッシュアップ'),
        exerciseService.getPopularExercises(10),
        exerciseService.getBeginnerExercises()
    ];
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    testRunner.assert(results.every(result => Array.isArray(result)), '全ての検索が成功する');
    testRunner.assert(endTime - startTime < 5000, '5秒以内に完了する'); // 5秒以内
});

export { testRunner as exerciseManagementIntegrationTests };
