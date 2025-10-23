// exercisePage.js - エクササイズ管理ページ

import { exerciseService } from '../services/exerciseService.js';
import { supabaseService } from '../services/supabaseService.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';
import { showNotification, debounce } from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';

/**
 * エクササイズ管理ページクラス
 */
class ExercisePage {
    constructor() {
        this.currentExercises = [];
        this.currentFilters = {};
        this.selectedExercise = null;
        this.isLoading = false;

        // デバウンス検索
        this.debouncedSearch = debounce(this.performSearch.bind(this), 300);

        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 検索入力
        const searchInput = document.getElementById('exercise-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });
        }

        // フィルター
        const filterElements = [
            'muscle-group-filter',
            'difficulty-filter',
            'equipment-filter',
            'exercise-type-filter'
        ];

        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        // チェックボックスフィルター
        const checkboxFilters = [
            'bodyweight-filter',
            'compound-filter',
            'beginner-filter'
        ];

        checkboxFilters.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        // ソート
        const sortSelect = document.getElementById('exercise-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applyFilters());
        }

        // カスタムエクササイズ追加ボタン
        const addCustomBtn = document.getElementById('add-custom-exercise-btn');
        if (addCustomBtn) {
            addCustomBtn.addEventListener('click', () => this.showCustomExerciseModal());
        }

        // カテゴリ詳細ボタン
        document.querySelectorAll('.category-detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const muscle = btn.dataset.muscle;
                this.showCategoryDetail(muscle);
            });
        });


        // モーダル関連
        this.setupModalEventListeners();
    }

    /**
     * モーダルイベントリスナーの設定
     */
    setupModalEventListeners() {
        // エクササイズ詳細モーダル
        const detailModal = document.getElementById('exercise-detail-modal');
        if (detailModal) {
            const closeBtn = detailModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeDetailModal());
            }
        }

        // カスタムエクササイズモーダル
        const customModal = document.getElementById('custom-exercise-modal');
        if (customModal) {
            const closeBtn = customModal.querySelector('.modal-close');
            const cancelBtn = customModal.querySelector('.cancel-btn');
            const saveBtn = customModal.querySelector('.save-btn');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeCustomModal());
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeCustomModal());
            }
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveCustomExercise());
            }
        }

        // ファイルアップロードイベントリスナー
        this.setupFileUploadListeners();

        // モーダル外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    /**
     * ファイルアップロードイベントリスナーの設定
     */
    setupFileUploadListeners() {
        // 画像アップロード
        const imageUpload = document.getElementById('custom-image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // 動画アップロード
        const videoUpload = document.getElementById('custom-video-upload');
        if (videoUpload) {
            videoUpload.addEventListener('change', (e) => this.handleVideoUpload(e));
        }

        // 画像削除ボタン
        const removeImageBtn = document.getElementById('remove-image-btn');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => this.removeImage());
        }

        // 動画削除ボタン
        const removeVideoBtn = document.getElementById('remove-video-btn');
        if (removeVideoBtn) {
            removeVideoBtn.addEventListener('click', () => this.removeVideo());
        }
    }

    /**
     * 初期データの読み込み
     */
    async loadInitialData() {
        this.showLoading(true);

        try {
            // 筋肉部位フィルターを設定
            await this.setupMuscleGroupFilter();

            // 器具フィルターを設定
            await this.setupEquipmentFilter();


            // 初期エクササイズを読み込み
            await this.loadExercises();

        } catch (error) {
            handleError(error, {
                context: 'エクササイズページ初期化',
                showNotification: true
            });
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 筋肉部位フィルターの設定
     */
    async setupMuscleGroupFilter() {
        const select = document.getElementById('muscle-group-filter');
        if (!select) {return;}

        // デフォルトオプションをクリア
        select.innerHTML = '<option value="">すべての部位</option>';

        // 筋肉部位を追加
        MUSCLE_GROUPS.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        });
    }

    /**
     * 器具フィルターの設定
     */
    async setupEquipmentFilter() {
        const select = document.getElementById('equipment-filter');
        if (!select) {return;}

        try {
            const equipment = await exerciseService.getAvailableEquipment();

            // デフォルトオプションをクリア
            select.innerHTML = '<option value="">すべての器具</option>';

            // 器具を追加
            equipment.forEach(eq => {
                const option = document.createElement('option');
                option.value = eq;
                option.textContent = this.getEquipmentDisplayName(eq);
                select.appendChild(option);
            });
        } catch (error) {
            console.warn('Failed to setup equipment filter:', error);
        }
    }

    /**
     * 器具の表示名を取得
     * @param {string} equipment - 器具名
     * @returns {string} 表示名
     */
    getEquipmentDisplayName(equipment) {
        const names = {
            bodyweight: '自重',
            dumbbell: 'ダンベル',
            barbell: 'バーベル',
            machine: 'マシン',
            'cable machine': 'ケーブルマシン',
            'pull-up bar': '懸垂バー',
            'resistance band': 'レジスタンスバンド'
        };
        return names[equipment] || equipment;
    }


    /**
     * エクササイズを読み込み
     */
    async loadExercises() {
        this.showLoading(true);

        try {
            const searchTerm = document.getElementById('exercise-search')?.value || '';
            const filters = this.getCurrentFilters();

            this.currentExercises = await exerciseService.searchExercises(searchTerm, filters);
            this.renderExercises();

        } catch (error) {
            handleError(error, {
                context: 'エクササイズ読み込み',
                showNotification: true
            });
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 現在のフィルター条件を取得
     * @returns {Object} フィルター条件
     */
    getCurrentFilters() {
        const filters = {};

        // セレクトボックスフィルター
        const muscleGroup = document.getElementById('muscle-group-filter')?.value;
        if (muscleGroup) {filters.muscleGroupId = muscleGroup;}

        const difficulty = document.getElementById('difficulty-filter')?.value;
        if (difficulty) {filters.difficulty = parseInt(difficulty);}

        const equipment = document.getElementById('equipment-filter')?.value;
        if (equipment) {filters.equipment = equipment;}

        const exerciseType = document.getElementById('exercise-type-filter')?.value;
        if (exerciseType) {filters.exerciseType = exerciseType;}

        // チェックボックスフィルター
        const bodyweightOnly = document.getElementById('bodyweight-filter')?.checked;
        if (bodyweightOnly) {filters.isBodyweight = true;}

        const compoundOnly = document.getElementById('compound-filter')?.checked;
        if (compoundOnly) {filters.isCompound = true;}

        const beginnerOnly = document.getElementById('beginner-filter')?.checked;
        if (beginnerOnly) {filters.isBeginnerFriendly = true;}

        // ソート
        const sortBy = document.getElementById('exercise-sort')?.value;
        if (sortBy) {filters.sortBy = sortBy;}

        return filters;
    }

    /**
     * 検索を実行
     * @param {string} searchTerm - 検索語
     */
    async performSearch(searchTerm) {
        this.showLoading(true);

        try {
            const filters = this.getCurrentFilters();
            this.currentExercises = await exerciseService.searchExercises(searchTerm, filters);
            this.renderExercises();

        } catch (error) {
            handleError(error, {
                context: 'エクササイズ検索',
                showNotification: true
            });
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * フィルターを適用
     */
    async applyFilters() {
        await this.loadExercises();
    }

    /**
     * エクササイズ一覧を描画
     */
    renderExercises() {
        const container = document.getElementById('exercises-list');
        if (!container) {return;}

        if (this.currentExercises.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-search text-4xl"></i>
                    </div>
                    <p class="text-gray-600">エクササイズが見つかりませんでした</p>
                    <p class="text-sm text-gray-500 mt-2">検索条件を変更してお試しください</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentExercises.map(exercise =>
            this.renderExerciseCard(exercise)
        ).join('');

        // カードクリックイベントを設定
        container.querySelectorAll('.exercise-card').forEach(card => {
            card.addEventListener('click', () => {
                const exerciseId = card.dataset.exerciseId;
                this.showExerciseDetail(exerciseId);
            });
        });
    }

    /**
     * エクササイズカードを描画
     * @param {Object} exercise - エクササイズデータ
     * @returns {string} HTML文字列
     */
    renderExerciseCard(exercise) {
        const muscleGroup = exercise.muscle_groups;
        const difficultyStars = '★'.repeat(exercise.difficulty_level) +
                               '☆'.repeat(5 - exercise.difficulty_level);

        const isCustom = exercise.is_custom;
        const customBadge = isCustom ?
            '<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">' +
            'カスタム</span>' : '';

        return `
            <div class="exercise-card bg-white rounded-lg shadow-md p-6 cursor-pointer 
                        hover:shadow-lg transition-shadow duration-200" 
                 data-exercise-id="${exercise.id}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            ${exercise.name_ja}
                        </h3>
                        <p class="text-sm text-gray-600 mb-2">${exercise.name_en}</p>
                        ${customBadge}
                    </div>
                    ${exercise.image_url ?
        `<img src="${exercise.image_url}" alt="${exercise.name_ja}" 
              class="w-16 h-16 rounded-lg object-cover ml-4">` :
        `<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center ml-4">
                            <i class="fas fa-dumbbell text-gray-400"></i>
                         </div>`
}
                </div>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm">
                        <span class="w-16 text-gray-500">部位:</span>
                        <span class="px-2 py-1 rounded text-xs" style="background-color: ${muscleGroup?.color_code}20; color: ${muscleGroup?.color_code}">
                            ${muscleGroup?.name_ja || '未設定'}
                        </span>
                    </div>
                    <div class="flex items-center text-sm">
                        <span class="w-16 text-gray-500">難易度:</span>
                        <span class="text-yellow-500">${difficultyStars}</span>
                    </div>
                    <div class="flex items-center text-sm">
                        <span class="w-16 text-gray-500">器具:</span>
                        <span class="text-gray-700">${this.getEquipmentDisplayName(exercise.equipment)}</span>
                    </div>
                </div>
                
                <p class="text-sm text-gray-600 line-clamp-2">${exercise.description || ''}</p>
                
                <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                        ${exercise.is_bodyweight ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded">自重</span>' : ''}
                        ${exercise.is_compound ? '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">複合</span>' : ''}
                        ${exercise.is_beginner_friendly ? '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">初心者</span>' : ''}
                    </div>
                    <div class="flex items-center space-x-2 text-xs text-gray-500">
                        ${exercise.average_rating > 0 ?
        `<span>★${exercise.average_rating.toFixed(1)}</span>` : ''
}
                        ${exercise.usage_count > 0 ?
        `<span>${exercise.usage_count}回使用</span>` : ''
}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * カテゴリ詳細を表示
     * @param {string} muscleGroup - 筋肉部位
     */
    showCategoryDetail(muscleGroup) {
        const categoryInfo = this.getCategoryInfo(muscleGroup);
        this.renderCategoryDetail(categoryInfo);
        this.showDetailModal();
    }

    /**
     * カテゴリ情報を取得
     * @param {string} muscleGroup - 筋肉部位
     * @returns {Object} カテゴリ情報
     */
    getCategoryInfo(muscleGroup) {
        const categories = {
            chest: {
                name: '胸筋',
                nameEn: 'Chest',
                icon: 'fas fa-heart',
                color: 'text-red-500',
                description: '大胸筋、小胸筋、前鋸筋を鍛えるエクササイズ',
                benefits: [
                    '胸筋の厚みと幅を向上',
                    '上半身の安定性向上',
                    '姿勢の改善',
                    'プッシュ系動作の強化'
                ],
                exercises: [
                    'プッシュアップ（腕立て伏せ）',
                    'ベンチプレス',
                    'ダンベルフライ',
                    'インクラインプレス',
                    'ディップス',
                    'ケーブルクロスオーバー',
                    'プッシュアップバリエーション',
                    'ダンベルプレス'
                ],
                tips: [
                    '胸筋を意識して動作を行う',
                    '肩甲骨を安定させる',
                    '適切な可動域を保つ',
                    '呼吸を意識する'
                ],
                commonMistakes: [
                    '肩が前に出すぎる',
                    '可動域が狭い',
                    '反動を使いすぎる',
                    '呼吸を止める'
                ]
            },
            back: {
                name: '背筋',
                nameEn: 'Back',
                icon: 'fas fa-user',
                color: 'text-green-500',
                description: '広背筋、僧帽筋、菱形筋、脊柱起立筋を鍛えるエクササイズ',
                benefits: [
                    '背中の厚みと幅を向上',
                    '姿勢の改善',
                    '肩甲骨の安定性向上',
                    '引く動作の強化'
                ],
                exercises: [
                    'プルアップ（懸垂）',
                    'ラットプルダウン',
                    'ベントオーバーロウ',
                    'ワンハンドダンベルロウ',
                    'シーテッドロウ',
                    'フェイスプル',
                    'デッドリフト',
                    'リバースフライ'
                ],
                tips: [
                    '肩甲骨を寄せる動作を意識',
                    '胸を張って姿勢を保つ',
                    '背筋を意識して動作',
                    '適切な重量を選択'
                ],
                commonMistakes: [
                    '肩が上がる',
                    '腰が丸まる',
                    '反動を使いすぎる',
                    '可動域が狭い'
                ]
            },
            legs: {
                name: '脚筋',
                nameEn: 'Legs',
                icon: 'fas fa-running',
                color: 'text-purple-500',
                description: '大腿四頭筋、ハムストリングス、臀筋、ふくらはぎを鍛えるエクササイズ',
                benefits: [
                    '下半身の筋力向上',
                    'バランス能力向上',
                    '代謝の向上',
                    '日常動作の改善'
                ],
                exercises: [
                    'スクワット',
                    'ランジ',
                    'デッドリフト',
                    'レッグプレス',
                    'レッグカール',
                    'レッグエクステンション',
                    'カーフレイズ',
                    'ブルガリアンスクワット'
                ],
                tips: [
                    '膝の向きに注意',
                    '重心を安定させる',
                    '深い可動域を意識',
                    '呼吸を意識する'
                ],
                commonMistakes: [
                    '膝が内側に入る',
                    '腰が丸まる',
                    '可動域が浅い',
                    '反動を使いすぎる'
                ]
            },
            shoulders: {
                name: '肩筋',
                nameEn: 'Shoulders',
                icon: 'fas fa-dumbbell',
                color: 'text-blue-500',
                description: '三角筋（前部・中部・後部）を鍛えるエクササイズ',
                benefits: [
                    '肩の幅と厚みを向上',
                    '肩の安定性向上',
                    '姿勢の改善',
                    'オーバーヘッド動作の強化'
                ],
                exercises: [
                    'ショルダープレス',
                    'サイドレイズ',
                    'フロントレイズ',
                    'リアデルトフライ',
                    'アーノルドプレス',
                    'アップライトロウ',
                    'フェイスプル',
                    'バックフライ'
                ],
                tips: [
                    '肩甲骨を安定させる',
                    '適切な重量を選択',
                    '可動域を意識',
                    'バランスよく鍛える'
                ],
                commonMistakes: [
                    '重量が重すぎる',
                    '肩が上がる',
                    '可動域が狭い',
                    '前部ばかり鍛える'
                ]
            },
            arms: {
                name: '腕筋',
                nameEn: 'Arms',
                icon: 'fas fa-fist-raised',
                color: 'text-orange-500',
                description: '上腕二頭筋、上腕三頭筋、前腕筋を鍛えるエクササイズ',
                benefits: [
                    '腕の筋力向上',
                    '握力の向上',
                    '腕の太さと形の改善',
                    'プッシュ・プル動作の強化'
                ],
                exercises: [
                    'ダンベルカール',
                    'ハンマーカール',
                    'トライセップディップス',
                    'トライセッププッシュダウン',
                    'オーバーヘッドエクステンション',
                    'クローズグリッププッシュアップ',
                    'リバースカール',
                    'プリーチャーカール'
                ],
                tips: [
                    '適切な重量を選択',
                    '可動域を意識',
                    '反動を使わない',
                    'バランスよく鍛える'
                ],
                commonMistakes: [
                    '反動を使いすぎる',
                    '重量が重すぎる',
                    '可動域が狭い',
                    '片方ばかり鍛える'
                ]
            },
            core: {
                name: '体幹',
                nameEn: 'Core',
                icon: 'fas fa-circle',
                color: 'text-yellow-500',
                description: '腹筋、背筋、横腹筋、深層筋を鍛えるエクササイズ',
                benefits: [
                    '体幹の安定性向上',
                    '姿勢の改善',
                    '腰痛の予防',
                    'パフォーマンス向上'
                ],
                exercises: [
                    'プランク',
                    'クランチ',
                    'サイドプランク',
                    'ロシアンツイスト',
                    'マウンテンクライマー',
                    'デッドバグ',
                    'バードドッグ',
                    'レッグレイズ'
                ],
                tips: [
                    '呼吸を意識する',
                    '正しい姿勢を保つ',
                    'ゆっくりと動作',
                    '継続的に行う'
                ],
                commonMistakes: [
                    '呼吸を止める',
                    '腰を反らしすぎる',
                    '反動を使う',
                    '継続しない'
                ]
            }
        };

        return categories[muscleGroup] || categories.chest;
    }

    /**
     * カテゴリ詳細を描画
     * @param {Object} categoryInfo - カテゴリ情報
     */
    renderCategoryDetail(categoryInfo) {
        const modal = document.getElementById('exercise-detail-modal');
        if (!modal) {return;}

        const content = modal.querySelector('.modal-content');
        if (!content) {return;}

        content.innerHTML = `
            <div class="modal-header flex justify-between items-center p-6 border-b">
                <div class="flex items-center">
                    <i class="${categoryInfo.icon} ${categoryInfo.color} text-3xl mr-4"></i>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${categoryInfo.name}エクササイズ</h2>
                        <p class="text-gray-600">${categoryInfo.nameEn} Exercises</p>
                    </div>
                </div>
                <button class="modal-close text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="modal-body p-6 max-h-96 overflow-y-auto">
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">概要</h3>
                    <p class="text-gray-700">${categoryInfo.description}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">効果・メリット</h3>
                        <ul class="space-y-2">
                            ${categoryInfo.benefits.map(benefit => `
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${benefit}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">代表的なエクササイズ</h3>
                        <ul class="space-y-2">
                            ${categoryInfo.exercises.map(exercise => `
                                <li class="flex items-start">
                                    <i class="fas fa-dumbbell text-blue-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${exercise}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">コツ・ポイント</h3>
                        <ul class="space-y-2">
                            ${categoryInfo.tips.map(tip => `
                                <li class="flex items-start">
                                    <i class="fas fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${tip}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">よくある間違い</h3>
                        <ul class="space-y-2">
                            ${categoryInfo.commonMistakes.map(mistake => `
                                <li class="flex items-start">
                                    <i class="fas fa-exclamation-triangle text-red-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${mistake}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer p-6 border-t bg-gray-50">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                        この部位のエクササイズをフィルターで表示できます
                    </div>
                    <div class="space-x-2">
                        <button class="filter-category-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            この部位のエクササイズを表示
                        </button>
                        <button class="modal-close px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        // イベントリスナーを再設定
        const closeButtons = content.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeDetailModal());
        });

        // フィルターボタンのイベントリスナー
        const filterBtn = content.querySelector('.filter-category-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.applyCategoryFilter(categoryInfo.name.toLowerCase());
                this.closeDetailModal();
            });
        }
    }

    /**
     * カテゴリフィルターを適用
     * @param {string} categoryName - カテゴリ名
     */
    applyCategoryFilter(categoryName) {
        console.log('applyCategoryFilter called with:', categoryName);
        const muscleGroupFilter = document.getElementById('muscle-group-filter');
        if (muscleGroupFilter) {
            console.log('Setting muscle group filter to:', categoryName);
            muscleGroupFilter.value = categoryName;
            this.applyFilters();
        } else {
            console.error('muscle-group-filter element not found');
        }
    }

    /**
     * エクササイズ詳細を表示
     * @param {string} exerciseId - エクササイズID
     */
    async showExerciseDetail(exerciseId) {
        try {
            const exercise = await exerciseService.getExerciseDetails(exerciseId);
            if (!exercise) {
                showNotification('エクササイズの詳細を取得できませんでした', 'error');
                return;
            }

            this.selectedExercise = exercise;
            this.renderExerciseDetail(exercise);
            this.showDetailModal();

        } catch (error) {
            handleError(error, {
                context: 'エクササイズ詳細表示',
                showNotification: true
            });
        }
    }

    /**
     * エクササイズ詳細を描画
     * @param {Object} exercise - エクササイズデータ
     */
    renderExerciseDetail(exercise) {
        const modal = document.getElementById('exercise-detail-modal');
        if (!modal) {return;}

        const content = modal.querySelector('.modal-content');
        if (!content) {return;}

        const muscleGroup = exercise.muscle_groups;
        const difficultyStars = '★'.repeat(exercise.difficulty_level) +
                               '☆'.repeat(5 - exercise.difficulty_level);

        content.innerHTML = `
            <div class="modal-header flex justify-between items-center p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-900">${exercise.name_ja}</h2>
                <button class="modal-close text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="modal-body p-6 max-h-96 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        ${exercise.image_url ?
        `<img src="${exercise.image_url}" alt="${exercise.name_ja}" class="w-full h-48 rounded-lg object-cover mb-4">` :
        `<div class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-dumbbell text-gray-400 text-4xl"></i>
                             </div>`
}
                        
                        ${exercise.video_url ?
        `<div class="mb-4">
                                <a href="${exercise.video_url}" target="_blank" 
                                   class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                    <i class="fab fa-youtube mr-2"></i>
                                    動画を見る
                                </a>
                             </div>` : ''
}
                    </div>
                    
                    <div>
                        <div class="space-y-4">
                            <div>
                                <h3 class="font-semibold text-gray-900 mb-2">基本情報</h3>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">英語名:</span>
                                        <span>${exercise.name_en}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">対象部位:</span>
                                        <span class="px-2 py-1 rounded text-xs" style="background-color: ${muscleGroup?.color_code}20; color: ${muscleGroup?.color_code}">
                                            ${muscleGroup?.name_ja}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">難易度:</span>
                                        <span class="text-yellow-500">${difficultyStars}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">器具:</span>
                                        <span>${this.getEquipmentDisplayName(exercise.equipment)}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">種目タイプ:</span>
                                        <span>${exercise.exercise_type}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex flex-wrap gap-2">
                                ${exercise.is_bodyweight ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">自重</span>' : ''}
                                ${exercise.is_compound ? '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">複合種目</span>' : ''}
                                ${exercise.is_beginner_friendly ? '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">初心者向け</span>' : ''}
                                ${exercise.is_custom ? '<span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">カスタム</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                ${exercise.description ?
        `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">説明</h3>
                        <p class="text-gray-700">${exercise.description}</p>
                     </div>` : ''
}
                
                ${exercise.instructions ?
        `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">実行方法</h3>
                        <p class="text-gray-700 whitespace-pre-line">${exercise.instructions}</p>
                     </div>` : ''
}
                
                ${exercise.tips ?
        `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">コツ・ポイント</h3>
                        <p class="text-gray-700 whitespace-pre-line">${exercise.tips}</p>
                     </div>` : ''
}
                
                ${exercise.common_mistakes ?
        `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">よくある間違い</h3>
                        <p class="text-gray-700 whitespace-pre-line">${exercise.common_mistakes}</p>
                     </div>` : ''
}
            </div>
            
            <div class="modal-footer p-6 border-t bg-gray-50">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                        ${exercise.average_rating > 0 ? `評価: ★${exercise.average_rating.toFixed(1)} ` : ''}
                        ${exercise.usage_count > 0 ? `使用回数: ${exercise.usage_count}回` : ''}
                    </div>
                    <div class="space-x-2">
                        ${exercise.is_custom && supabaseService.getCurrentUser()?.id === exercise.created_by_user_id ?
        `<button class="edit-exercise-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                編集
                             </button>
                             <button class="delete-exercise-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                削除
                             </button>` : ''
}
                        <button class="modal-close px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        // イベントリスナーを再設定
        const closeButtons = content.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeDetailModal());
        });

        // 編集・削除ボタンのイベントリスナー
        const editBtn = content.querySelector('.edit-exercise-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editCustomExercise(exercise));
        }

        const deleteBtn = content.querySelector('.delete-exercise-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCustomExercise(exercise.id));
        }
    }

    /**
     * カスタムエクササイズモーダルを表示
     * @param {Object} exercise - 編集するエクササイズ（新規作成時はnull）
     */
    showCustomExerciseModal(exercise = null) {
        const modal = document.getElementById('custom-exercise-modal');
        if (!modal) {return;}

        // フォームをリセット
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }

        // 編集モードの場合はデータを設定
        if (exercise) {
            this.populateCustomExerciseForm(exercise);
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    /**
     * カスタムエクササイズフォームにデータを設定
     * @param {Object} exercise - エクササイズデータ
     */
    populateCustomExerciseForm(exercise) {
        const fields = [
            'custom-name-ja',
            'custom-name-en',
            'custom-muscle-group',
            'custom-equipment',
            'custom-difficulty',
            'custom-exercise-type',
            'custom-description',
            'custom-instructions',
            'custom-tips',
            'custom-mistakes'
        ];

        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && exercise) {
                const fieldName = fieldId.replace('custom-', '').replace('-', '_');
                if (fieldName === 'muscle_group') {
                    element.value = exercise.muscle_group_id;
                } else if (fieldName === 'difficulty') {
                    element.value = exercise.difficulty_level;
                } else {
                    element.value = exercise[fieldName] || '';
                }
            }
        });

        // チェックボックス
        const checkboxes = [
            'custom-bodyweight',
            'custom-compound',
            'custom-beginner',
            'custom-public'
        ];

        checkboxes.forEach(checkboxId => {
            const element = document.getElementById(checkboxId);
            if (element && exercise) {
                const fieldName = checkboxId.replace('custom-', '').replace('-', '_');
                if (fieldName === 'bodyweight') {
                    element.checked = exercise.is_bodyweight;
                } else if (fieldName === 'compound') {
                    element.checked = exercise.is_compound;
                } else if (fieldName === 'beginner') {
                    element.checked = exercise.is_beginner_friendly;
                } else if (fieldName === 'public') {
                    element.checked = exercise.is_public;
                }
            }
        });
    }

    /**
     * カスタムエクササイズを保存
     */
    async saveCustomExercise() {
        try {
            showNotification('エクササイズを保存中...', 'info');

            const formData = this.getCustomExerciseFormData();
            let savedExercise;

            if (this.selectedExercise && this.selectedExercise.is_custom) {
                // 更新
                savedExercise = await exerciseService.updateCustomExercise(this.selectedExercise.id, formData);
            } else {
                // 新規作成
                savedExercise = await exerciseService.createCustomExercise(formData);
            }

            // メディアファイルのアップロード
            if (savedExercise) {
                await this.uploadMediaFiles(savedExercise.id);
            }

            this.closeCustomModal();
            await this.loadExercises(); // リストを更新

        } catch (error) {
            handleError(error, {
                context: 'カスタムエクササイズ保存',
                showNotification: true
            });
        }
    }

    /**
     * メディアファイルをアップロード
     * @param {string} exerciseId - エクササイズID
     */
    async uploadMediaFiles(exerciseId) {
        const updateData = {};

        try {
            // 画像アップロード
            if (this.tempImageFile) {
                showNotification('画像をアップロード中...', 'info');
                const imageUrl = await exerciseService.uploadExerciseImage(this.tempImageFile, exerciseId);
                updateData.image_url = imageUrl;
                this.tempImageFile = null;
            }

            // 動画アップロード
            if (this.tempVideoFile) {
                showNotification('動画をアップロード中...', 'info');
                const videoUrl = await exerciseService.uploadExerciseVideo(this.tempVideoFile, exerciseId);
                updateData.video_url = videoUrl;

                // 動画情報も更新
                const videoInfo = await exerciseService.getVideoInfo(this.tempVideoFile);
                updateData.video_duration = videoInfo.duration;

                this.tempVideoFile = null;
            }

            // 動画URLが指定されている場合
            const videoUrlInput = document.getElementById('custom-video-url')?.value;
            if (videoUrlInput && !updateData.video_url) {
                updateData.video_url = videoUrlInput;
            }

            // メディア情報を更新
            if (Object.keys(updateData).length > 0) {
                await exerciseService.updateCustomExercise(exerciseId, updateData);
            }

        } catch (error) {
            console.error('Media upload error:', error);
            showNotification('メディアファイルのアップロードに失敗しました', 'warning');
        }
    }

    /**
     * カスタムエクササイズフォームデータを取得
     * @returns {Object} フォームデータ
     */
    getCustomExerciseFormData() {
        return {
            name_ja: document.getElementById('custom-name-ja')?.value || '',
            name_en: document.getElementById('custom-name-en')?.value || '',
            name: document.getElementById('custom-name-en')?.value || '', // nameフィールドも設定
            muscle_group_id: document.getElementById('custom-muscle-group')?.value || null,
            equipment: document.getElementById('custom-equipment')?.value || 'bodyweight',
            difficulty_level: parseInt(document.getElementById('custom-difficulty')?.value) || 1,
            exercise_type: document.getElementById('custom-exercise-type')?.value || 'strength',
            description: document.getElementById('custom-description')?.value || '',
            instructions: document.getElementById('custom-instructions')?.value || '',
            tips: document.getElementById('custom-tips')?.value || '',
            common_mistakes: document.getElementById('custom-mistakes')?.value || '',
            is_bodyweight: document.getElementById('custom-bodyweight')?.checked || false,
            is_compound: document.getElementById('custom-compound')?.checked || false,
            is_beginner_friendly: document.getElementById('custom-beginner')?.checked || false,
            is_public: document.getElementById('custom-public')?.checked || false,
            search_keywords: this.generateSearchKeywords()
        };
    }

    /**
     * 検索キーワードを生成
     * @returns {string} 検索キーワード
     */
    generateSearchKeywords() {
        const nameJa = document.getElementById('custom-name-ja')?.value || '';
        const nameEn = document.getElementById('custom-name-en')?.value || '';
        const description = document.getElementById('custom-description')?.value || '';

        return `${nameJa} ${nameEn} ${description}`.trim();
    }

    /**
     * カスタムエクササイズを編集
     * @param {Object} exercise - エクササイズデータ
     */
    editCustomExercise(exercise) {
        this.closeDetailModal();
        this.selectedExercise = exercise;
        this.showCustomExerciseModal(exercise);
    }

    /**
     * カスタムエクササイズを削除
     * @param {string} exerciseId - エクササイズID
     */
    async deleteCustomExercise(exerciseId) {
        // カスタム削除確認ダイアログ
        const shouldDelete = await this.showDeleteConfirmDialog(
            'このエクササイズを削除しますか？この操作は取り消せません。'
        );
        if (!shouldDelete) {
            return;
        }

        try {
            await exerciseService.deleteCustomExercise(exerciseId);
            this.closeDetailModal();
            await this.loadExercises(); // リストを更新

        } catch (error) {
            handleError(error, {
                context: 'カスタムエクササイズ削除',
                showNotification: true
            });
        }
    }

    /**
     * 詳細モーダルを表示
     */
    showDetailModal() {
        const modal = document.getElementById('exercise-detail-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    /**
     * 詳細モーダルを閉じる
     */
    closeDetailModal() {
        const modal = document.getElementById('exercise-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        this.selectedExercise = null;
    }

    /**
     * カスタムモーダルを閉じる
     */
    closeCustomModal() {
        const modal = document.getElementById('custom-exercise-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        this.selectedExercise = null;
    }

    /**
     * 全モーダルを閉じる
     */
    closeAllModals() {
        this.closeDetailModal();
        this.closeCustomModal();
    }

    /**
     * ローディング状態を表示/非表示
     * @param {boolean} show - 表示するかどうか
     */
    showLoading(show) {
        this.isLoading = show;
        const loader = document.getElementById('exercises-loader');
        const list = document.getElementById('exercises-list');

        if (loader && list) {
            if (show) {
                loader.classList.remove('hidden');
                list.classList.add('hidden');
            } else {
                loader.classList.add('hidden');
                list.classList.remove('hidden');
            }
        }
    }

    /**
     * 画像アップロードを処理
     * @param {Event} event - ファイル選択イベント
     */
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) {return;}

        try {
            // プレビューを表示
            const previewUrl = await exerciseService.generateImagePreview(file);
            this.showImagePreview(previewUrl);

            // ファイルを一時保存（実際のアップロードは保存時に行う）
            this.tempImageFile = file;

        } catch (error) {
            handleError(error, {
                context: '画像プレビュー',
                showNotification: true
            });
        }
    }

    /**
     * 動画アップロードを処理
     * @param {Event} event - ファイル選択イベント
     */
    async handleVideoUpload(event) {
        const file = event.target.files[0];
        if (!file) {return;}

        try {
            // 動画情報を取得
            const videoInfo = await exerciseService.getVideoInfo(file);
            this.showVideoPreview(file, videoInfo);

            // ファイルを一時保存（実際のアップロードは保存時に行う）
            this.tempVideoFile = file;

        } catch (error) {
            handleError(error, {
                context: '動画プレビュー',
                showNotification: true
            });
        }
    }

    /**
     * 画像プレビューを表示
     * @param {string} previewUrl - プレビューURL
     */
    showImagePreview(previewUrl) {
        const placeholder = document.getElementById('image-placeholder');
        const preview = document.getElementById('image-preview');
        const previewImg = document.getElementById('image-preview-img');
        const removeBtn = document.getElementById('remove-image-btn');

        if (placeholder && preview && previewImg && removeBtn) {
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
            removeBtn.classList.remove('hidden');
            previewImg.src = previewUrl;
        }
    }

    /**
     * 動画プレビューを表示
     * @param {File} file - 動画ファイル
     * @param {Object} videoInfo - 動画情報
     */
    showVideoPreview(file) {
        const placeholder = document.getElementById('video-placeholder');
        const preview = document.getElementById('video-preview');
        const previewVideo = document.getElementById('video-preview-video');
        const removeBtn = document.getElementById('remove-video-btn');

        if (placeholder && preview && previewVideo && removeBtn) {
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
            removeBtn.classList.remove('hidden');

            const videoUrl = URL.createObjectURL(file);
            previewVideo.src = videoUrl;
            previewVideo.load();
        }
    }

    /**
     * 画像を削除
     */
    removeImage() {
        const placeholder = document.getElementById('image-placeholder');
        const preview = document.getElementById('image-preview');
        const previewImg = document.getElementById('image-preview-img');
        const removeBtn = document.getElementById('remove-image-btn');
        const fileInput = document.getElementById('custom-image-upload');

        if (placeholder && preview && previewImg && removeBtn && fileInput) {
            placeholder.classList.remove('hidden');
            preview.classList.add('hidden');
            removeBtn.classList.add('hidden');
            previewImg.src = '';
            fileInput.value = '';
            this.tempImageFile = null;
        }
    }

    /**
     * 動画を削除
     */
    removeVideo() {
        const placeholder = document.getElementById('video-placeholder');
        const preview = document.getElementById('video-preview');
        const previewVideo = document.getElementById('video-preview-video');
        const removeBtn = document.getElementById('remove-video-btn');
        const fileInput = document.getElementById('custom-video-upload');

        if (placeholder && preview && previewVideo && removeBtn && fileInput) {
            placeholder.classList.remove('hidden');
            preview.classList.add('hidden');
            removeBtn.classList.add('hidden');

            // 動画URLを解放
            if (previewVideo.src) {
                URL.revokeObjectURL(previewVideo.src);
            }
            previewVideo.src = '';
            fileInput.value = '';
            this.tempVideoFile = null;
        }
    }

    /**
     * 削除確認ダイアログを表示
     * @param {string} message - 確認メッセージ
     * @returns {Promise<boolean>} 削除するかどうか
     */
    showDeleteConfirmDialog(message) {
        return new Promise((resolve) => {
            // カスタム確認ダイアログを作成
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            dialog.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500 text-xl mr-3"></i>
                        <h3 class="text-lg font-semibold text-gray-900">確認</h3>
                    </div>
                    <p class="text-gray-700 mb-6">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button class="cancel-btn px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button class="delete-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            削除
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            // イベントリスナー
            const cancelBtn = dialog.querySelector('.cancel-btn');
            const deleteBtn = dialog.querySelector('.delete-btn');

            const cleanup = () => {
                document.body.removeChild(dialog);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            deleteBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            // ESCキーで閉じる
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }
}

// シングルトンインスタンスをエクスポート
export const exercisePage = new ExercisePage();
