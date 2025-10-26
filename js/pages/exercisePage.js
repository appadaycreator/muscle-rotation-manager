// exercisePage.js - エクササイズ管理ページ

import { exerciseService } from '../services/exerciseService.js';
import { supabaseService } from '../services/supabaseService.js';
import { muscleGroupService } from '../services/muscleGroupService.js';
import { showNotification, debounce } from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';
import { tooltipManager } from '../utils/TooltipManager.js';

/**
 * エクササイズ管理ページクラス
 */
class ExercisePage {
  constructor() {
    this.currentExercises = [];
    this.totalExercises = 0;
    this.currentFilters = {};
    this.selectedExercise = null;
    this.isLoading = false;
    this.favoriteExercises = new Set(); // お気に入りエクササイズ

    // デバウンス検索
    this.debouncedSearch = debounce((searchTerm) => {
      this.performSearch(searchTerm);
    }, 300);

    this.init();
  }

  /**
   * 初期化
   */
  init() {
    // ツールチップ機能を初期化
    tooltipManager.initialize();

    // お気に入りデータを読み込み
    this.loadFavorites();

    this.setupEventListeners();
    this.loadInitialData();
    this.setupTooltips();
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
      'exercise-type-filter',
    ];

    filterElements.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.applyFilters());
      }
    });

    // チェックボックスフィルター
    const checkboxFilters = [
      'bodyweight-filter',
      'compound-filter',
      'beginner-filter',
    ];

    checkboxFilters.forEach((id) => {
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
      addCustomBtn.addEventListener('click', () =>
        this.showCustomExerciseModal()
      );
    }

    // お気に入りフィルターボタン
    const favoritesFilterBtn = document.getElementById('favorites-filter');
    if (favoritesFilterBtn) {
      favoritesFilterBtn.addEventListener('click', () => {
        this.toggleFavoritesFilter();
      });
    }

    // カテゴリ詳細ボタン
    document.querySelectorAll('.category-detail-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const muscle = btn.dataset.muscle;
        this.showCategoryDetail(muscle);
      });
    });

    // フィルターリセットボタン
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => this.resetFilters());
    }

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

      // 総件数を取得
      await this.loadTotalExerciseCount();

      // 初期エクササイズを読み込み
      await this.loadExercises();
    } catch (error) {
      handleError(error, {
        context: 'エクササイズページ初期化',
        showNotification: true,
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
    if (!select) {
      return;
    }

    // デフォルトオプションをクリア
    select.innerHTML = '<option value="">すべての部位</option>';

    try {
      // 筋肉部位データを取得（認証なしでも動作）
      const muscleGroups = [
        { id: 'chest', name: 'Chest', name_ja: '胸' },
        { id: 'back', name: 'Back', name_ja: '背中' },
        { id: 'shoulders', name: 'Shoulders', name_ja: '肩' },
        { id: 'arms', name: 'Arms', name_ja: '腕' },
        { id: 'legs', name: 'Legs', name_ja: '脚' },
        { id: 'core', name: 'Core', name_ja: '腹筋' },
      ];

      muscleGroups.forEach((group) => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name_ja;
        select.appendChild(option);
      });

      console.log(
        'Muscle group filter setup complete. Total options:',
        select.options.length
      );
    } catch (error) {
      console.error('Failed to load muscle groups:', error);
    }
  }

  /**
   * 器具フィルターの設定
   */
  async setupEquipmentFilter() {
    const select = document.getElementById('equipment-filter');
    if (!select) {
      return;
    }

    try {
      // 器具データを取得（認証なしでも動作）
      const equipment = [
        'bodyweight',
        'barbell',
        'dumbbell',
        'machine',
        'cable',
        'kettlebell',
        'resistance-band',
      ];

      // デフォルトオプションをクリア
      select.innerHTML = '<option value="">すべての器具</option>';

      // 器具を追加
      equipment.forEach((eq) => {
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
   * 総エクササイズ件数を取得
   */
  async loadTotalExerciseCount() {
    try {
      // ローカルエクササイズデータから件数をカウント（認証なしでも動作）
      const allExercises = this.getLocalExercises();
      this.totalExercises = allExercises.length;
    } catch (error) {
      console.warn('Failed to load total exercise count:', error);
      this.totalExercises = 0;
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
      'resistance band': 'レジスタンスバンド',
    };
    return names[equipment] || equipment;
  }

  /**
   * 筋肉部位の表示名を取得
   * @param {string} muscleGroup - 筋肉部位ID
   * @returns {string} 表示名
   */
  getMuscleGroupDisplayName(muscleGroup) {
    const names = {
      chest: '胸',
      back: '背中',
      shoulders: '肩',
      arms: '腕',
      legs: '脚',
      core: '腹筋',
    };
    return names[muscleGroup] || muscleGroup || '未設定';
  }

  /**
   * 筋肉部位の色を取得
   * @param {string} muscleGroup - 筋肉部位ID
   * @returns {string} 色コード
   */
  getMuscleGroupColor(muscleGroup) {
    const colors = {
      chest: '#EF4444', // 赤
      back: '#3B82F6', // 青
      shoulders: '#10B981', // 緑
      arms: '#F59E0B', // オレンジ
      legs: '#8B5CF6', // 紫
      core: '#EC4899', // ピンク
    };
    return colors[muscleGroup] || '#6B7280';
  }

  /**
   * エクササイズタイプの表示名を取得
   * @param {string} type - エクササイズタイプ
   * @returns {string} 表示名
   */
  getExerciseTypeLabel(type) {
    const labels = {
      compound: '複合種目',
      isolation: '単関節種目',
      strength: '筋力',
      cardio: '有酸素',
      flexibility: '柔軟性',
    };
    return labels[type] || type || '未設定';
  }

  /**
   * エクササイズを読み込み
   */
  async loadExercises() {
    this.showLoading(true);

    try {
      console.log('Loading exercises...');

      const searchTerm =
        document.getElementById('exercise-search')?.value || '';
      const filters = this.getCurrentFilters();

      // ローカルストレージからエクササイズデータを読み込み（認証なしでも動作）
      this.currentExercises = this.getLocalExercises();

      console.log(
        `Loaded ${this.currentExercises.length} exercises from local storage`
      );

      // 検索・フィルタリングを適用
      if (searchTerm || this.hasActiveFilters()) {
        this.currentExercises = this.filterExercises(
          this.currentExercises,
          searchTerm,
          filters
        );
        console.log(`Filtered to ${this.currentExercises.length} exercises`);
      }

      this.renderExercises();

      // updateExerciseCountメソッドが存在することを確認してから呼び出し
      if (typeof this.updateExerciseCount === 'function') {
        this.updateExerciseCount();
      } else {
        console.warn(
          'updateExerciseCount method not found, skipping count update'
        );
      }

      console.log('Exercises loaded successfully');
    } catch (error) {
      console.error('Error loading exercises:', error);

      // より具体的なエラーメッセージを表示
      let errorMessage = 'エクササイズの読み込みに失敗しました';
      if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'アクセス権限がありません。ログインし直してください。';
        } else if (error.message.includes('not found')) {
          errorMessage = 'エクササイズデータが見つかりません。';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('Error details:', {
        message: errorMessage,
        originalError: error,
        exercises: this.currentExercises?.length || 0,
      });

      // ユーザーフレンドリーなエラーメッセージを表示
      this.showErrorState(errorMessage);

      // エラーハンドラーに委譲（通知は表示しない）
      handleError(error, {
        context: 'エクササイズ読み込み',
        showNotification: false, // 通知を無効化
        logToConsole: true,
      });
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * ローカルエクササイズデータを取得
   */
  getLocalExercises() {
    try {
      // ローカルストレージからエクササイズデータを読み込み
      const localExercises = JSON.parse(
        localStorage.getItem('exercises') || '[]'
      );

      // サンプルデータを追加（デモ用）
      if (localExercises.length === 0) {
        return this.getSampleExercises();
      }

      return localExercises;
    } catch (error) {
      console.warn('Failed to parse exercises from localStorage:', error);
      // JSONパースエラーの場合はサンプルデータを返す
      return this.getSampleExercises();
    }
  }

  /**
   * サンプルエクササイズデータを取得
   */
  getSampleExercises() {
    return [
      // 胸のエクササイズ
      {
        id: 'bench-press',
        name: 'ベンチプレス',
        name_ja: 'ベンチプレス',
        muscle_group: 'chest',
        difficulty: 3,
        equipment: 'barbell',
        type: 'compound',
      },
      {
        id: 'push-ups',
        name: 'プッシュアップ',
        name_ja: 'プッシュアップ',
        muscle_group: 'chest',
        difficulty: 2,
        equipment: 'bodyweight',
        type: 'compound',
      },
      {
        id: 'dumbbell-press',
        name: 'ダンベルプレス',
        name_ja: 'ダンベルプレス',
        muscle_group: 'chest',
        difficulty: 2,
        equipment: 'dumbbell',
        type: 'compound',
      },
      {
        id: 'incline-press',
        name: 'インクラインプレス',
        name_ja: 'インクラインプレス',
        muscle_group: 'chest',
        difficulty: 3,
        equipment: 'barbell',
        type: 'compound',
      },
      {
        id: 'decline-press',
        name: 'デクラインプレス',
        name_ja: 'デクラインプレス',
        muscle_group: 'chest',
        difficulty: 3,
        equipment: 'barbell',
        type: 'compound',
      },

      // 背中のエクササイズ
      {
        id: 'pull-ups',
        name: 'プルアップ',
        name_ja: 'プルアップ',
        muscle_group: 'back',
        difficulty: 4,
        equipment: 'bodyweight',
        type: 'compound',
      },
      {
        id: 'rows',
        name: 'ロウイング',
        name_ja: 'ロウイング',
        muscle_group: 'back',
        difficulty: 3,
        equipment: 'barbell',
        type: 'compound',
      },
      {
        id: 'lat-pulldown',
        name: 'ラットプルダウン',
        name_ja: 'ラットプルダウン',
        muscle_group: 'back',
        difficulty: 2,
        equipment: 'machine',
        type: 'compound',
      },
      {
        id: 'deadlift',
        name: 'デッドリフト',
        name_ja: 'デッドリフト',
        muscle_group: 'back',
        difficulty: 5,
        equipment: 'barbell',
        type: 'compound',
      },
      {
        id: 'bent-over-row',
        name: 'ベントオーバーロウ',
        name_ja: 'ベントオーバーロウ',
        muscle_group: 'back',
        difficulty: 3,
        equipment: 'barbell',
        type: 'compound',
      },

      // 肩のエクササイズ
      {
        id: 'overhead-press',
        name: 'オーバーヘッドプレス',
        name_ja: 'オーバーヘッドプレス',
        muscle_group: 'shoulders',
        difficulty: 4,
        equipment: 'barbell',
        type: 'compound',
      },
      {
        id: 'lateral-raises',
        name: 'サイドレイズ',
        name_ja: 'サイドレイズ',
        muscle_group: 'shoulders',
        difficulty: 2,
        equipment: 'dumbbell',
        type: 'isolation',
      },
      {
        id: 'rear-delt-fly',
        name: 'リアデルトフライ',
        name_ja: 'リアデルトフライ',
        muscle_group: 'shoulders',
        difficulty: 2,
        equipment: 'dumbbell',
        type: 'isolation',
      },
      {
        id: 'front-raises',
        name: 'フロントレイズ',
        name_ja: 'フロントレイズ',
        muscle_group: 'shoulders',
        difficulty: 2,
        equipment: 'dumbbell',
        type: 'isolation',
      },
      {
        id: 'arnold-press',
        name: 'アーノルドプレス',
        name_ja: 'アーノルドプレス',
        muscle_group: 'shoulders',
        difficulty: 3,
        equipment: 'dumbbell',
        type: 'compound',
      },

      // 腕のエクササイズ
      {
        id: 'bicep-curls',
        name: 'バイセップカール',
        name_ja: 'バイセップカール',
        muscle_group: 'arms',
        difficulty: 2,
        equipment: 'dumbbell',
        type: 'isolation',
      },
      {
        id: 'tricep-dips',
        name: 'トライセップディップス',
        name_ja: 'トライセップディップス',
        muscle_group: 'arms',
        difficulty: 3,
        equipment: 'bodyweight',
        type: 'compound',
      },
      {
        id: 'hammer-curls',
        name: 'ハンマーカール',
        name_ja: 'ハンマーカール',
        muscle_group: 'arms',
        difficulty: 2,
        equipment: 'dumbbell',
        type: 'isolation',
      },
      {
        id: 'close-grip-press',
        name: 'クローズグリッププレス',
        name_ja: 'クローズグリッププレス',
        muscle_group: 'arms',
        difficulty: 3,
        equipment: 'barbell',
        type: 'compound',
      },
      {
        id: 'preacher-curls',
        name: 'プリーチャーカール',
        name_ja: 'プリーチャーカール',
        muscle_group: 'arms',
        difficulty: 2,
        equipment: 'barbell',
        type: 'isolation',
      },

      // 脚のエクササイズ
      {
        id: 'squats',
        name: 'スクワット',
        name_ja: 'スクワット',
        muscle_group: 'legs',
        difficulty: 3,
        equipment: 'barbell',
        type: 'compound',
      },
      {
        id: 'lunges',
        name: 'ランジ',
        name_ja: 'ランジ',
        muscle_group: 'legs',
        difficulty: 3,
        equipment: 'bodyweight',
        type: 'compound',
      },
      {
        id: 'leg-press',
        name: 'レッグプレス',
        name_ja: 'レッグプレス',
        muscle_group: 'legs',
        difficulty: 2,
        equipment: 'machine',
        type: 'compound',
      },
      {
        id: 'bulgarian-squats',
        name: 'ブルガリアンスクワット',
        name_ja: 'ブルガリアンスクワット',
        muscle_group: 'legs',
        difficulty: 4,
        equipment: 'bodyweight',
        type: 'compound',
      },
      {
        id: 'calf-raises',
        name: 'カーフレイズ',
        name_ja: 'カーフレイズ',
        muscle_group: 'legs',
        difficulty: 2,
        equipment: 'bodyweight',
        type: 'isolation',
      },

      // 腹筋のエクササイズ
      {
        id: 'plank',
        name: 'プランク',
        name_ja: 'プランク',
        muscle_group: 'core',
        difficulty: 2,
        equipment: 'bodyweight',
        type: 'isolation',
      },
      {
        id: 'crunches',
        name: 'クランチ',
        name_ja: 'クランチ',
        muscle_group: 'core',
        difficulty: 1,
        equipment: 'bodyweight',
        type: 'isolation',
      },
      {
        id: 'russian-twists',
        name: 'ロシアンツイスト',
        name_ja: 'ロシアンツイスト',
        muscle_group: 'core',
        difficulty: 2,
        equipment: 'bodyweight',
        type: 'isolation',
      },
      {
        id: 'mountain-climbers',
        name: 'マウンテンクライマー',
        name_ja: 'マウンテンクライマー',
        muscle_group: 'core',
        difficulty: 3,
        equipment: 'bodyweight',
        type: 'compound',
      },
      {
        id: 'bicycle-crunches',
        name: 'バイシクルクランチ',
        name_ja: 'バイシクルクランチ',
        muscle_group: 'core',
        difficulty: 2,
        equipment: 'bodyweight',
        type: 'isolation',
      },
    ];
  }

  /**
   * 現在のフィルター条件を取得
   * @returns {Object} フィルター条件
   */
  getCurrentFilters() {
    const filters = {};

    // セレクトボックスフィルター
    const muscleGroup = document.getElementById('muscle-group-filter')?.value;
    console.log('Muscle group filter value:', muscleGroup);
    if (muscleGroup) {
      filters.muscleGroupId = muscleGroup;
    }

    const difficulty = document.getElementById('difficulty-filter')?.value;
    if (difficulty) {
      filters.difficulty = parseInt(difficulty);
    }

    const equipment = document.getElementById('equipment-filter')?.value;
    if (equipment) {
      filters.equipment = equipment;
    }

    const exerciseType = document.getElementById('exercise-type-filter')?.value;
    if (exerciseType) {
      filters.exerciseType = exerciseType;
    }

    // チェックボックスフィルター
    const bodyweightOnly =
      document.getElementById('bodyweight-filter')?.checked;
    if (bodyweightOnly) {
      filters.isBodyweight = true;
    }

    const compoundOnly = document.getElementById('compound-filter')?.checked;
    if (compoundOnly) {
      filters.isCompound = true;
    }

    const beginnerOnly = document.getElementById('beginner-filter')?.checked;
    if (beginnerOnly) {
      filters.isBeginnerFriendly = true;
    }

    // お気に入りフィルター
    if (this.currentFilters.showFavoritesOnly) {
      filters.showFavoritesOnly = true;
    }

    // ソート
    const sortBy = document.getElementById('exercise-sort')?.value;
    if (sortBy) {
      filters.sortBy = sortBy;
    }

    console.log('Final filters object:', filters);
    return filters;
  }

  /**
   * 検索を実行
   * @param {string} searchTerm - 検索語
   */
  async performSearch(searchTerm) {
    try {
      console.log('Performing search:', searchTerm);

      if (!searchTerm.trim()) {
        // 検索語が空の場合は全件表示
        await this.loadExercises();
        return;
      }

      this.showLoading(true);

      // ローカルエクササイズから検索
      const allExercises = this.getLocalExercises();
      const filteredExercises = this.filterExercises(
        allExercises,
        searchTerm,
        this.getCurrentFilters()
      );

      this.currentExercises = filteredExercises;
      this.renderExercises();
      this.updateExerciseCount();

      console.log(
        `Search completed: ${filteredExercises.length} exercises found`
      );
    } catch (error) {
      console.error('Search failed:', error);
      handleError(error, {
        context: 'エクササイズ検索',
        showNotification: true,
      });
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * エクササイズをフィルタリング
   * @param {Array} exercises - エクササイズ配列
   * @param {string} searchTerm - 検索語
   * @param {Object} filters - フィルター条件
   * @returns {Array} フィルタリングされたエクササイズ配列
   */
  filterExercises(exercises, searchTerm = '', filters = {}) {
    try {
      let filtered = [...exercises];

      // 検索語によるフィルタリング
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter((exercise) => {
          return (
            exercise.name?.toLowerCase().includes(searchLower) ||
            exercise.name_ja?.toLowerCase().includes(searchLower) ||
            exercise.description?.toLowerCase().includes(searchLower) ||
            exercise.muscle_group?.toLowerCase().includes(searchLower)
          );
        });
      }

      // 筋肉部位フィルター（muscleGroupIdとmuscleGroupの両方に対応）
      if (filters.muscleGroupId) {
        filtered = filtered.filter(
          (exercise) => exercise.muscle_group === filters.muscleGroupId
        );
      } else if (filters.muscleGroup) {
        filtered = filtered.filter(
          (exercise) => exercise.muscle_group === filters.muscleGroup
        );
      }

      // 器具フィルター
      if (filters.equipment) {
        filtered = filtered.filter(
          (exercise) => exercise.equipment === filters.equipment
        );
      }

      // 難易度フィルター
      if (filters.difficulty) {
        filtered = filtered.filter(
          (exercise) => exercise.difficulty === parseInt(filters.difficulty)
        );
      }

      // エクササイズタイプフィルター
      if (filters.exerciseType) {
        filtered = filtered.filter(
          (exercise) => exercise.type === filters.exerciseType
        );
      }

      // ボディウェイトフィルター
      if (filters.isBodyweight) {
        filtered = filtered.filter(
          (exercise) => exercise.equipment === 'bodyweight'
        );
      }

      // コンパウンドフィルター
      if (filters.isCompound) {
        filtered = filtered.filter((exercise) => exercise.type === 'compound');
      }

      // 初心者フィルター
      if (filters.isBeginnerFriendly) {
        filtered = filtered.filter((exercise) => exercise.difficulty <= 2);
      }

      // お気に入りフィルター
      if (filters.showFavoritesOnly) {
        filtered = filtered.filter((exercise) =>
          this.favoriteExercises.has(exercise.id)
        );
      }

      // ソート適用
      if (filters.sortBy) {
        filtered = this.sortExercises(filtered, filters.sortBy);
      }

      return filtered;
    } catch (error) {
      console.error('Filtering failed:', error);
      return exercises; // エラーの場合は元の配列を返す
    }
  }

  /**
   * エクササイズをソート
   * @param {Array} exercises - エクササイズ配列
   * @param {string} sortType - ソートタイプ
   * @returns {Array} ソートされたエクササイズ配列
   */
  sortExercises(exercises, sortType) {
    try {
      const sorted = [...exercises];

      switch (sortType) {
        case 'name':
        case 'name_asc':
          return sorted.sort((a, b) =>
            (a.name_ja || a.name || '').localeCompare(b.name_ja || b.name || '')
          );
        case 'name_desc':
          return sorted.sort((a, b) =>
            (b.name_ja || b.name || '').localeCompare(a.name_ja || a.name || '')
          );
        case 'difficulty':
        case 'difficulty_asc':
          return sorted.sort(
            (a, b) => (a.difficulty || 0) - (b.difficulty || 0)
          );
        case 'difficulty_desc':
          return sorted.sort(
            (a, b) => (b.difficulty || 0) - (a.difficulty || 0)
          );
        case 'rating':
          return sorted.sort(
            (a, b) => (b.average_rating || 0) - (a.average_rating || 0)
          );
        case 'usage':
          return sorted.sort(
            (a, b) => (b.usage_count || 0) - (a.usage_count || 0)
          );
        case 'muscle_group':
          return sorted.sort((a, b) =>
            (a.muscle_group || '').localeCompare(b.muscle_group || '')
          );
        case 'equipment':
          return sorted.sort((a, b) =>
            (a.equipment || '').localeCompare(b.equipment || '')
          );
        default:
          return sorted;
      }
    } catch (error) {
      console.error('Sorting failed:', error);
      return exercises; // エラーの場合は元の配列を返す
    }
  }

  /**
   * フィルターを適用
   */
  async applyFilters() {
    console.log('Applying filters...');
    const currentFilters = this.getCurrentFilters();
    console.log('Current filters:', currentFilters);
    await this.loadExercises();
  }

  /**
   * エクササイズ件数を更新
   */
  updateExerciseCount() {
    try {
      const currentCountElement = document.getElementById('current-count');
      const totalCountElement = document.getElementById('total-count');

      if (currentCountElement && totalCountElement) {
        const currentCount = this.currentExercises
          ? this.currentExercises.length
          : 0;
        const totalCount = this.totalExercises || currentCount;

        currentCountElement.textContent = currentCount;
        totalCountElement.textContent = totalCount;

        // フィルターが適用されている場合の表示を更新
        const countElement = document.getElementById('exercise-count');
        if (countElement) {
          if (this.hasActiveFilters()) {
            countElement.innerHTML = `
                            <span id="current-count">${currentCount}</span>件中 <span id="total-count">${totalCount}</span>件を表示
                            <span class="text-blue-600 ml-2">（フィルター適用中）</span>
                        `;
          } else {
            countElement.innerHTML = `
                            <span id="current-count">${currentCount}</span>件中 <span id="total-count">${totalCount}</span>件を表示
                        `;
          }
        }
      }
    } catch (error) {
      console.error('Error updating exercise count:', error);
    }
  }

  /**
   * アクティブなフィルターがあるかチェック
   * @returns {boolean} フィルターが適用されているかどうか
   */
  hasActiveFilters() {
    const searchTerm = document.getElementById('exercise-search')?.value || '';
    const muscleGroup = document.getElementById('muscle-group-filter')?.value;
    const equipment = document.getElementById('equipment-filter')?.value;
    const difficulty = document.getElementById('difficulty-filter')?.value;
    const exerciseType = document.getElementById('exercise-type-filter')?.value;
    const bodyweightOnly =
      document.getElementById('bodyweight-filter')?.checked;
    const compoundOnly = document.getElementById('compound-filter')?.checked;
    const beginnerOnly = document.getElementById('beginner-filter')?.checked;
    const favoritesOnly = this.currentFilters.showFavoritesOnly;

    return !!(
      searchTerm ||
      muscleGroup ||
      equipment ||
      difficulty ||
      exerciseType ||
      bodyweightOnly ||
      compoundOnly ||
      beginnerOnly ||
      favoritesOnly
    );
  }

  /**
   * フィルターをリセット
   */
  async resetFilters() {
    // 検索ボックスをクリア
    const searchInput = document.getElementById('exercise-search');
    if (searchInput) {
      searchInput.value = '';
    }

    // セレクトボックスをリセット
    const selectElements = [
      'muscle-group-filter',
      'equipment-filter',
      'difficulty-filter',
      'exercise-type-filter',
    ];

    selectElements.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.selectedIndex = 0;
      }
    });

    // チェックボックスをリセット
    const checkboxElements = [
      'bodyweight-filter',
      'compound-filter',
      'beginner-filter',
    ];

    checkboxElements.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.checked = false;
      }
    });

    // エクササイズ一覧を再読み込み
    await this.loadExercises();
    this.updateExerciseCount();
  }

  /**
   * エクササイズ一覧を描画
   */
  renderExercises() {
    const container = document.getElementById('exercises-list');
    if (!container) {
      return;
    }

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

    container.innerHTML = this.currentExercises
      .map((exercise) => this.renderExerciseCard(exercise))
      .join('');

    // カードクリックイベントを設定
    container.querySelectorAll('.exercise-card').forEach((card) => {
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
    // サンプルデータの構造に合わせて調整
    const muscleGroupName = this.getMuscleGroupDisplayName(
      exercise.muscle_group
    );
    const difficultyLevel =
      exercise.difficulty || exercise.difficulty_level || 1;
    const difficultyStars =
      '★'.repeat(difficultyLevel) + '☆'.repeat(5 - difficultyLevel);

    const isCustom = exercise.is_custom;
    const customBadge = isCustom
      ? '<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">' +
        '<i class="fas fa-user-edit mr-1"></i>カスタム</span>'
      : '';

    // 難易度に応じた色分け
    const difficultyColor = this.getDifficultyColor(difficultyLevel);

    // エクイップメントアイコン
    const equipmentIcon = this.getEquipmentIcon(exercise.equipment);

    // 筋肉部位の色
    const muscleColor = this.getMuscleGroupColor(exercise.muscle_group);

    return `
            <div class="exercise-card bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 group" 
                 data-exercise-id="${exercise.id}">
                <div class="p-6">
                    <!-- ヘッダー部分 -->
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <h3 class="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    ${exercise.name_ja || exercise.name}
                                </h3>
                                ${customBadge}
                            </div>
                            <p class="text-sm text-gray-600 mb-3">${exercise.name_en || exercise.name}</p>
                        </div>
                        <div class="flex-shrink-0 ml-4">
                            ${
                              exercise.image_url
                                ? `<img src="${exercise.image_url}" alt="${exercise.name_ja || exercise.name}" 
                      class="w-20 h-20 rounded-lg object-cover shadow-sm">`
                                : `<div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                                    <i class="fas fa-dumbbell text-gray-400 text-2xl"></i>
                                 </div>`
                            }
                        </div>
                    </div>
                    
                    <!-- 詳細情報 -->
                    <div class="space-y-3 mb-4">
                        <!-- 筋肉部位 -->
                        <div class="flex items-center">
                            <i class="fas fa-muscle w-4 text-gray-500 mr-3"></i>
                            <span class="text-sm text-gray-600 mr-2">部位:</span>
                            <span class="px-3 py-1 rounded-full text-xs font-medium" style="background-color: ${muscleColor}20; color: ${muscleColor}">
                                ${muscleGroupName}
                            </span>
                        </div>
                        
                        <!-- 難易度 -->
                        <div class="flex items-center">
                            <i class="fas fa-signal w-4 text-gray-500 mr-3"></i>
                            <span class="text-sm text-gray-600 mr-2">難易度:</span>
                            <div class="flex items-center">
                                <span class="text-sm font-medium ${difficultyColor} mr-2">${difficultyStars}</span>
                                <span class="text-xs text-gray-500">(${difficultyLevel}/5)</span>
                            </div>
                        </div>
                        
                        <!-- エクイップメント -->
                        <div class="flex items-center">
                            <i class="fas ${equipmentIcon} w-4 text-gray-500 mr-3"></i>
                            <span class="text-sm text-gray-600 mr-2">器具:</span>
                            <span class="text-sm font-medium text-gray-800">${this.getEquipmentDisplayName(exercise.equipment)}</span>
                        </div>
                        
                        <!-- エクササイズタイプ -->
                        <div class="flex items-center">
                            <i class="fas fa-tag w-4 text-gray-500 mr-3"></i>
                            <span class="text-sm text-gray-600 mr-2">タイプ:</span>
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                ${this.getExerciseTypeLabel(exercise.type || exercise.exercise_type)}
                            </span>
                        </div>
                    </div>
                    
                    <!-- 説明 -->
                    ${
                      exercise.description
                        ? `
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 line-clamp-2">${exercise.description}</p>
                    </div>
                    `
                        : ''
                    }
                    
                    <!-- フッター -->
                    <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div class="flex items-center space-x-3">
                            ${exercise.type === 'compound' ? '<span class="text-xs text-green-600 font-medium"><i class="fas fa-link mr-1"></i>複合</span>' : ''}
                            ${exercise.equipment === 'bodyweight' ? '<span class="text-xs text-blue-600 font-medium"><i class="fas fa-weight mr-1"></i>自重</span>' : ''}
                            ${difficultyLevel <= 2 ? '<span class="text-xs text-purple-600 font-medium"><i class="fas fa-seedling mr-1"></i>初心者向け</span>' : ''}
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="p-2 text-gray-400 hover:text-red-500 transition-colors" 
                                    onclick="event.stopPropagation(); window.exercisePageInstance.toggleFavorite('${exercise.id}')"
                                    title="お気に入り">
                                <i class="${this.favoriteExercises.has(exercise.id) ? 'fas fa-heart text-red-500' : 'far fa-heart'}"></i>
                            </button>
                            <button class="p-2 text-gray-400 hover:text-blue-500 transition-colors" 
                                    onclick="event.stopPropagation(); window.exercisePageInstance.showExerciseDetail('${exercise.id}')"
                                    title="詳細">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * 難易度に応じた色を取得
   */
  getDifficultyColor(level) {
    const colors = {
      1: 'text-green-600',
      2: 'text-blue-600',
      3: 'text-yellow-600',
      4: 'text-orange-600',
      5: 'text-red-600',
    };
    return colors[level] || 'text-gray-600';
  }

  /**
   * エクイップメントアイコンを取得
   */
  getEquipmentIcon(equipment) {
    const icons = {
      bodyweight: 'fa-weight',
      dumbbell: 'fa-dumbbell',
      barbell: 'fa-weight-hanging',
      machine: 'fa-cogs',
      'cable machine': 'fa-link',
      kettlebell: 'fa-dumbbell',
      'resistance band': 'fa-expand-arrows-alt',
      'pull-up bar': 'fa-grip-lines',
      'dip bars': 'fa-grip-lines-vertical',
    };
    return icons[equipment] || 'fa-dumbbell';
  }

  /**
   * お気に入りデータを読み込み
   */
  loadFavorites() {
    try {
      const favorites = localStorage.getItem('favoriteExercises');
      if (favorites) {
        this.favoriteExercises = new Set(JSON.parse(favorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoriteExercises = new Set();
    }
  }

  /**
   * お気に入りデータを保存
   */
  saveFavorites() {
    try {
      localStorage.setItem(
        'favoriteExercises',
        JSON.stringify([...this.favoriteExercises])
      );
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  /**
   * お気に入りの切り替え
   */
  toggleFavorite(exerciseId) {
    if (this.favoriteExercises.has(exerciseId)) {
      this.favoriteExercises.delete(exerciseId);
      showNotification('お気に入りから削除しました', 'info');
    } else {
      this.favoriteExercises.add(exerciseId);
      showNotification('お気に入りに追加しました', 'success');
    }

    this.saveFavorites();
    this.updateFavoriteButtons();
  }

  /**
   * お気に入りフィルターの切り替え
   */
  toggleFavoritesFilter() {
    const favoritesFilterBtn = document.getElementById('favorites-filter');
    if (!favoritesFilterBtn) return;

    const isActive = favoritesFilterBtn.classList.contains('bg-red-600');

    if (isActive) {
      // フィルターを解除
      favoritesFilterBtn.classList.remove('bg-red-600', 'text-white');
      favoritesFilterBtn.classList.add('bg-red-100', 'text-red-700');
      this.currentFilters.showFavoritesOnly = false;
    } else {
      // フィルターを適用
      favoritesFilterBtn.classList.remove('bg-red-100', 'text-red-700');
      favoritesFilterBtn.classList.add('bg-red-600', 'text-white');
      this.currentFilters.showFavoritesOnly = true;
    }

    this.applyFilters();
  }

  /**
   * カテゴリ詳細を表示
   * @param {string} muscleGroup - 筋肉部位
   */
  async showCategoryDetail(muscleGroup) {
    console.log('Showing category detail for:', muscleGroup);
    try {
      const categoryInfo =
        await muscleGroupService.getMuscleGroupCategoryInfo(muscleGroup);
      console.log('Retrieved category info:', categoryInfo);

      if (categoryInfo) {
        this.renderCategoryDetail(categoryInfo);
        this.showDetailModal();
      } else {
        console.error('Category info is null or undefined for:', muscleGroup);
        showNotification('カテゴリ情報を取得できませんでした', 'error');
      }
    } catch (error) {
      console.error('Error getting category info:', error);
      showNotification('カテゴリ情報の取得中にエラーが発生しました', 'error');
    }
  }

  /**
   * カテゴリ詳細を描画
   * @param {Object} categoryInfo - カテゴリ情報
   */
  renderCategoryDetail(categoryInfo) {
    const modal = document.getElementById('exercise-detail-modal');
    if (!modal) {
      return;
    }

    const content = modal.querySelector('.modal-content');
    if (!content) {
      return;
    }

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
                            ${categoryInfo.benefits
                              .map(
                                (benefit) => `
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${benefit}</span>
                                </li>
                            `
                              )
                              .join('')}
                        </ul>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">代表的なエクササイズ</h3>
                        <ul class="space-y-2">
                            ${categoryInfo.exercises
                              .map(
                                (exercise) => `
                                <li class="flex items-start">
                                    <i class="fas fa-dumbbell text-blue-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${exercise}</span>
                                </li>
                            `
                              )
                              .join('')}
                        </ul>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">コツ・ポイント</h3>
                        <ul class="space-y-2">
                            ${categoryInfo.tips
                              .map(
                                (tip) => `
                                <li class="flex items-start">
                                    <i class="fas fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${tip}</span>
                                </li>
                            `
                              )
                              .join('')}
                        </ul>
                    </div>

                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">よくある間違い</h3>
                        <ul class="space-y-2">
                            ${categoryInfo.commonMistakes
                              .map(
                                (mistake) => `
                                <li class="flex items-start">
                                    <i class="fas fa-exclamation-triangle text-red-500 mr-2 mt-1"></i>
                                    <span class="text-gray-700">${mistake}</span>
                                </li>
                            `
                              )
                              .join('')}
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
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.closeDetailModal());
    });

    // フィルターボタンのイベントリスナー
    const filterBtn = content.querySelector('.filter-category-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', async () => {
        await this.applyCategoryFilter(categoryInfo.name);
        this.closeDetailModal();
        // エクササイズ一覧にスクロール
        this.scrollToExerciseList();
      });
    }
  }

  /**
   * カテゴリフィルターを適用
   * @param {string} categoryName - カテゴリ名
   */
  async applyCategoryFilter(categoryName) {
    try {
      console.log('Applying category filter for:', categoryName);

      // 筋肉部位名のマッピング（カテゴリ詳細の名前からデータベースの筋肉部位名へ）
      const categoryNameMapping = {
        胸筋: '胸',
        背筋: '背中',
        脚筋: '脚',
        肩筋: '肩',
        腕筋: '腕',
        腹: '腹',
        体幹: '腹',
      };

      const mappedName = categoryNameMapping[categoryName] || categoryName;
      console.log('Mapped category name:', mappedName);

      // 筋肉部位サービスから筋肉部位を取得
      const muscleGroup =
        await muscleGroupService.getMuscleGroupByName(mappedName);
      console.log('Found muscle group:', muscleGroup);

      if (muscleGroup) {
        const muscleGroupFilter = document.getElementById(
          'muscle-group-filter'
        );
        if (muscleGroupFilter) {
          console.log('Setting muscle group filter to:', muscleGroup.id);
          muscleGroupFilter.value = muscleGroup.id;

          // フィルターを適用
          await this.applyFilters();
          this.updateExerciseCount();

          // フィルター適用の通知を表示
          showNotification(
            `${muscleGroup.name_ja}のエクササイズで絞り込みました`,
            'success'
          );
        } else {
          console.error('Muscle group filter element not found');
          showNotification('フィルター要素が見つかりませんでした', 'error');
        }
      } else {
        console.warn(
          'Muscle group not found for category:',
          categoryName,
          'mapped to:',
          mappedName
        );

        // フォールバック: 直接筋肉部位IDで検索
        const directMapping = {
          胸筋: 'chest',
          背筋: 'back',
          脚筋: 'legs',
          肩筋: 'shoulders',
          腕筋: 'arms',
          腹: 'abs',
          体幹: 'abs',
        };

        const directId = directMapping[categoryName];
        if (directId) {
          console.log('Trying direct ID mapping:', directId);
          const muscleGroupFilter = document.getElementById(
            'muscle-group-filter'
          );
          if (muscleGroupFilter) {
            // 筋肉部位フィルターのオプションを確認
            const options = Array.from(muscleGroupFilter.options);
            console.log(
              'Available filter options:',
              options.map((opt) => ({ value: opt.value, text: opt.text }))
            );

            // 筋肉部位IDで直接検索
            const targetOption = options.find((opt) => opt.value === directId);
            if (targetOption) {
              muscleGroupFilter.value = directId;
              await this.applyFilters();
              this.updateExerciseCount();
              showNotification(
                `${targetOption.text}のエクササイズで絞り込みました`,
                'success'
              );
            } else {
              console.error('Target option not found:', directId);
              showNotification(
                `筋肉部位「${categoryName}」のフィルターが見つかりませんでした`,
                'error'
              );
            }
          }
        } else {
          showNotification(
            `筋肉部位「${categoryName}」が見つかりませんでした`,
            'error'
          );
        }
      }
    } catch (error) {
      console.error('Failed to apply category filter:', error);
      showNotification('フィルターの適用に失敗しました', 'error');
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
        showNotification: true,
      });
    }
  }

  /**
   * エクササイズ詳細を描画
   * @param {Object} exercise - エクササイズデータ
   */
  renderExerciseDetail(exercise) {
    const modal = document.getElementById('exercise-detail-modal');
    if (!modal) {
      return;
    }

    const content = modal.querySelector('.modal-content');
    if (!content) {
      return;
    }

    const muscleGroup = exercise.muscle_groups;
    const difficultyStars =
      '★'.repeat(exercise.difficulty_level) +
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
                        ${
                          exercise.image_url
                            ? `<img src="${exercise.image_url}" alt="${exercise.name_ja}" class="w-full h-48 rounded-lg object-cover mb-4">`
                            : `<div class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                                <i class="fas fa-dumbbell text-gray-400 text-4xl"></i>
                             </div>`
                        }
                        
                        ${
                          exercise.video_url
                            ? `<div class="mb-4">
                                <a href="${exercise.video_url}" target="_blank" 
                                   class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                    <i class="fab fa-youtube mr-2"></i>
                                    動画を見る
                                </a>
                             </div>`
                            : ''
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
                
                ${
                  exercise.description
                    ? `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">説明</h3>
                        <p class="text-gray-700">${exercise.description}</p>
                     </div>`
                    : ''
                }
                
                ${
                  exercise.instructions
                    ? `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">実行方法</h3>
                        <p class="text-gray-700 whitespace-pre-line">${exercise.instructions}</p>
                     </div>`
                    : ''
                }
                
                ${
                  exercise.tips
                    ? `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">コツ・ポイント</h3>
                        <p class="text-gray-700 whitespace-pre-line">${exercise.tips}</p>
                     </div>`
                    : ''
                }
                
                ${
                  exercise.common_mistakes
                    ? `<div class="mt-6">
                        <h3 class="font-semibold text-gray-900 mb-2">よくある間違い</h3>
                        <p class="text-gray-700 whitespace-pre-line">${exercise.common_mistakes}</p>
                     </div>`
                    : ''
                }
            </div>
            
            <div class="modal-footer p-6 border-t bg-gray-50">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                        ${exercise.average_rating > 0 ? `評価: ★${exercise.average_rating.toFixed(1)} ` : ''}
                        ${exercise.usage_count > 0 ? `使用回数: ${exercise.usage_count}回` : ''}
                    </div>
                    <div class="space-x-2">
                        ${
                          exercise.is_custom &&
                          supabaseService.getCurrentUser()?.id ===
                            exercise.created_by_user_id
                            ? `<button class="edit-exercise-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                編集
                             </button>
                             <button class="delete-exercise-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                削除
                             </button>`
                            : ''
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
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.closeDetailModal());
    });

    // 編集・削除ボタンのイベントリスナー
    const editBtn = content.querySelector('.edit-exercise-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () =>
        this.editCustomExercise(exercise)
      );
    }

    const deleteBtn = content.querySelector('.delete-exercise-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () =>
        this.deleteCustomExercise(exercise.id)
      );
    }
  }

  /**
   * カスタムエクササイズモーダルを表示
   * @param {Object} exercise - 編集するエクササイズ（新規作成時はnull）
   */
  showCustomExerciseModal(exercise = null) {
    const modal = document.getElementById('custom-exercise-modal');
    if (!modal) {
      return;
    }

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
      'custom-mistakes',
    ];

    fields.forEach((fieldId) => {
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
      'custom-public',
    ];

    checkboxes.forEach((checkboxId) => {
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
        savedExercise = await exerciseService.updateCustomExercise(
          this.selectedExercise.id,
          formData
        );
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
        showNotification: true,
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
        const imageUrl = await exerciseService.uploadExerciseImage(
          this.tempImageFile,
          exerciseId
        );
        updateData.image_url = imageUrl;
        this.tempImageFile = null;
      }

      // 動画アップロード
      if (this.tempVideoFile) {
        showNotification('動画をアップロード中...', 'info');
        const videoUrl = await exerciseService.uploadExerciseVideo(
          this.tempVideoFile,
          exerciseId
        );
        updateData.video_url = videoUrl;

        // 動画情報も更新
        const videoInfo = await exerciseService.getVideoInfo(
          this.tempVideoFile
        );
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
      showNotification(
        'メディアファイルのアップロードに失敗しました',
        'warning'
      );
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
      muscle_group_id:
        document.getElementById('custom-muscle-group')?.value || null,
      equipment:
        document.getElementById('custom-equipment')?.value || 'bodyweight',
      difficulty_level:
        parseInt(document.getElementById('custom-difficulty')?.value) || 1,
      exercise_type:
        document.getElementById('custom-exercise-type')?.value || 'strength',
      description: document.getElementById('custom-description')?.value || '',
      instructions: document.getElementById('custom-instructions')?.value || '',
      tips: document.getElementById('custom-tips')?.value || '',
      common_mistakes: document.getElementById('custom-mistakes')?.value || '',
      is_bodyweight:
        document.getElementById('custom-bodyweight')?.checked || false,
      is_compound: document.getElementById('custom-compound')?.checked || false,
      is_beginner_friendly:
        document.getElementById('custom-beginner')?.checked || false,
      is_public: document.getElementById('custom-public')?.checked || false,
      search_keywords: this.generateSearchKeywords(),
    };
  }

  /**
   * 検索キーワードを生成
   * @returns {string} 検索キーワード
   */
  generateSearchKeywords() {
    const nameJa = document.getElementById('custom-name-ja')?.value || '';
    const nameEn = document.getElementById('custom-name-en')?.value || '';
    const description =
      document.getElementById('custom-description')?.value || '';

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
        showNotification: true,
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
   * エラー状態を表示
   * @param {string} errorMessage - エラーメッセージ
   */
  showErrorState(errorMessage) {
    const exercisesList = document.getElementById('exercises-list');
    if (exercisesList) {
      exercisesList.innerHTML = `
        <div class="text-center py-8">
          <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div class="flex items-center justify-center mb-4">
              <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h3>
            <p class="text-red-600 mb-4">${errorMessage}</p>
            <div class="space-y-2">
              <button 
                onclick="location.reload()" 
                class="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                ページを再読み込み
              </button>
              <button 
                onclick="window.location.href='dashboard.html'" 
                class="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        </div>
      `;
    }
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
    if (!file) {
      return;
    }

    try {
      // プレビューを表示
      const previewUrl = await exerciseService.generateImagePreview(file);
      this.showImagePreview(previewUrl);

      // ファイルを一時保存（実際のアップロードは保存時に行う）
      this.tempImageFile = file;
    } catch (error) {
      handleError(error, {
        context: '画像プレビュー',
        showNotification: true,
      });
    }
  }

  /**
   * 動画アップロードを処理
   * @param {Event} event - ファイル選択イベント
   */
  async handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    try {
      // 動画情報を取得
      const videoInfo = await exerciseService.getVideoInfo(file);
      this.showVideoPreview(file, videoInfo);

      // ファイルを一時保存（実際のアップロードは保存時に行う）
      this.tempVideoFile = file;
    } catch (error) {
      handleError(error, {
        context: '動画プレビュー',
        showNotification: true,
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
   * エクササイズ一覧にスクロール
   */
  scrollToExerciseList() {
    const exerciseList = document.getElementById('exercises-list');
    if (exerciseList) {
      // 少し上にオフセットを設けて、ヘッダーに隠れないようにする
      const offset = 100;
      const elementPosition = exerciseList.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // フィルター適用の視覚的フィードバック
      this.highlightExerciseList();
    }
  }

  /**
   * エクササイズ一覧をハイライト
   */
  highlightExerciseList() {
    const exerciseList = document.getElementById('exercises-list');
    if (exerciseList) {
      // ハイライト効果を追加
      exerciseList.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');

      // 2秒後にハイライトを削除
      setTimeout(() => {
        exerciseList.classList.remove(
          'ring-2',
          'ring-blue-500',
          'ring-opacity-50'
        );
      }, 2000);
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
      dialog.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
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

      // 背景クリックでキャンセル
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  /**
   * ツールチップを設定
   */
  setupTooltips() {
    try {
      console.log('Setting up tooltips for exercise page');

      // 検索機能のツールチップ
      tooltipManager.addTooltip(
        '#exercise-search',
        'エクササイズ名で検索できます。部分一致で検索されます。',
        {
          position: 'bottom',
        }
      );

      // フィルター機能のツールチップ
      tooltipManager.addTooltip(
        '#muscle-group-filter',
        '筋肉部位でフィルタリングできます。複数選択可能です。',
        {
          position: 'bottom',
        }
      );

      tooltipManager.addTooltip(
        '#equipment-filter',
        '使用器具でフィルタリングできます。',
        {
          position: 'bottom',
        }
      );

      tooltipManager.addTooltip(
        '#difficulty-filter',
        '難易度でフィルタリングできます。',
        {
          position: 'bottom',
        }
      );

      // エクササイズカードのツールチップ
      tooltipManager.addTooltip(
        '.exercise-card',
        'エクササイズの詳細情報を表示します。クリックで詳細を確認できます。',
        {
          position: 'top',
        }
      );

      // エクササイズ追加ボタンのツールチップ
      tooltipManager.addTooltip(
        '#add-exercise-btn',
        '新しいエクササイズを追加します。',
        {
          position: 'top',
        }
      );

      // エクササイズ編集ボタンのツールチップ
      tooltipManager.addTooltip(
        '.edit-exercise-btn',
        'エクササイズの情報を編集します。',
        {
          position: 'top',
        }
      );

      // エクササイズ削除ボタンのツールチップ
      tooltipManager.addTooltip(
        '.delete-exercise-btn',
        'エクササイズを削除します。この操作は取り消せません。',
        {
          position: 'top',
        }
      );

      // 筋肉部位タグのツールチップ
      tooltipManager.addTooltip(
        '.muscle-group-tag',
        'このエクササイズで鍛えられる筋肉部位です。',
        {
          position: 'top',
        }
      );

      // 難易度バッジのツールチップ
      tooltipManager.addTooltip(
        '.difficulty-badge',
        'エクササイズの難易度レベルです。',
        {
          position: 'top',
        }
      );

      // 器具アイコンのツールチップ
      tooltipManager.addTooltip(
        '.equipment-icon',
        'このエクササイズに必要な器具です。',
        {
          position: 'top',
        }
      );

      // ページネーションのツールチップ
      tooltipManager.addTooltip(
        '.pagination-btn',
        '他のページのエクササイズを表示します。',
        {
          position: 'top',
        }
      );

      // ソート機能のツールチップ
      tooltipManager.addTooltip(
        '#sort-select',
        'エクササイズの並び順を変更できます。',
        {
          position: 'bottom',
        }
      );

      // 表示件数のツールチップ
      tooltipManager.addTooltip(
        '#items-per-page',
        '1ページに表示するエクササイズの数を設定できます。',
        {
          position: 'bottom',
        }
      );

      console.log('✅ Tooltips setup complete for exercise page');
    } catch (error) {
      console.error('❌ Failed to setup tooltips:', error);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const exercisePage = new ExercisePage();

// グローバルインスタンスを設定
window.exercisePageInstance = exercisePage;
