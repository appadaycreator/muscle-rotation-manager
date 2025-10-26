// muscleGroupService.js - 筋肉部位管理サービス

import { supabaseService } from './supabaseService.js';

/**
 * 筋肉部位管理サービス
 * 筋肉部位の定義、マッピング、取得を一元管理
 */
class MuscleGroupService {
  constructor() {
    this.muscleGroups = null;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分
  }

  /**
   * 筋肉部位一覧を取得（キャッシュ付き）
   * @returns {Promise<Array>} 筋肉部位一覧
   */
  async getMuscleGroups() {
    const cacheKey = 'muscle_groups';

    // キャッシュチェック
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      if (!supabaseService.isAvailable()) {
        console.warn('Supabase not available, using fallback muscle groups');
        return this.getFallbackMuscleGroups();
      }

      const { data, error } = await supabaseService.client
        .from('muscle_groups')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        throw new Error(error.message);
      }

      const muscleGroups = data || [];

      // キャッシュに保存
      this.cache.set(cacheKey, {
        data: muscleGroups,
        timestamp: Date.now(),
      });

      return muscleGroups;
    } catch (error) {
      console.error('Failed to get muscle groups:', error);
      return this.getFallbackMuscleGroups();
    }
  }

  /**
   * フォールバック用の筋肉部位データ
   * @returns {Array} 筋肉部位一覧
   */
  getFallbackMuscleGroups() {
    return [
      {
        id: 'chest',
        name: 'chest',
        name_en: 'Chest',
        name_ja: '胸',
        description:
          'Pectoral muscles including upper, middle, and lower chest',
        recovery_hours: 72,
        muscle_size: 'large',
        color_code: '#EF4444',
        icon_name: 'chest',
        display_order: 1,
        is_active: true,
      },
      {
        id: 'back',
        name: 'back',
        name_en: 'Back',
        name_ja: '背中',
        description: 'Latissimus dorsi, rhomboids, middle and lower trapezius',
        recovery_hours: 72,
        muscle_size: 'large',
        color_code: '#10B981',
        icon_name: 'back',
        display_order: 2,
        is_active: true,
      },
      {
        id: 'shoulders',
        name: 'shoulders',
        name_en: 'Shoulders',
        name_ja: '肩',
        description: 'Deltoids (anterior, medial, posterior)',
        recovery_hours: 48,
        muscle_size: 'small',
        color_code: '#F59E0B',
        icon_name: 'shoulders',
        display_order: 3,
        is_active: true,
      },
      {
        id: 'arms',
        name: 'arms',
        name_en: 'Arms',
        name_ja: '腕',
        description: 'Biceps, triceps, and forearms',
        recovery_hours: 48,
        muscle_size: 'small',
        color_code: '#8B5CF6',
        icon_name: 'arms',
        display_order: 4,
        is_active: true,
      },
      {
        id: 'legs',
        name: 'legs',
        name_en: 'Legs',
        name_ja: '脚',
        description: 'Quadriceps, hamstrings, glutes, and calves',
        recovery_hours: 72,
        muscle_size: 'large',
        color_code: '#06B6D4',
        icon_name: 'legs',
        display_order: 5,
        is_active: true,
      },
      {
        id: 'abs',
        name: 'abs',
        name_en: 'Abs',
        name_ja: '腹',
        description: 'Abdominal muscles and core',
        recovery_hours: 48,
        muscle_size: 'small',
        color_code: '#F97316',
        icon_name: 'abs',
        display_order: 6,
        is_active: true,
      },
    ];
  }

  /**
   * 筋肉部位IDから筋肉部位情報を取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @returns {Promise<Object|null>} 筋肉部位情報
   */
  async getMuscleGroupById(muscleGroupId) {
    if (!muscleGroupId) {
      return null;
    }

    const muscleGroups = await this.getMuscleGroups();
    console.log('Searching for muscle group ID:', muscleGroupId);
    console.log(
      'Available muscle groups:',
      muscleGroups.map((g) => ({ id: g.id, name_ja: g.name_ja }))
    );

    const found = muscleGroups.find((group) => group.id === muscleGroupId);
    console.log('Found muscle group:', found);
    return found || null;
  }

  /**
   * 筋肉部位名から筋肉部位情報を取得
   * @param {string} muscleGroupName - 筋肉部位名（日本語、英語、IDのいずれか）
   * @returns {Promise<Object|null>} 筋肉部位情報
   */
  async getMuscleGroupByName(muscleGroupName) {
    if (!muscleGroupName) {
      return null;
    }

    const muscleGroups = await this.getMuscleGroups();
    console.log('Searching for muscle group name:', muscleGroupName);
    console.log(
      'Available muscle groups:',
      muscleGroups.map((g) => ({
        name: g.name,
        name_ja: g.name_ja,
        name_en: g.name_en,
      }))
    );

    const found = muscleGroups.find(
      (group) =>
        group.name === muscleGroupName ||
        group.name_ja === muscleGroupName ||
        group.name_en === muscleGroupName
    );
    console.log('Found muscle group by name:', found);
    return found || null;
  }

  /**
   * 筋肉部位の表示名を取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @returns {Promise<string>} 表示名
   */
  async getMuscleGroupDisplayName(muscleGroupId) {
    const muscleGroup = await this.getMuscleGroupById(muscleGroupId);
    return muscleGroup ? muscleGroup.name_ja : muscleGroupId;
  }

  /**
   * 筋肉部位の色コードを取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @returns {Promise<string>} 色コード
   */
  async getMuscleGroupColor(muscleGroupId) {
    const muscleGroup = await this.getMuscleGroupById(muscleGroupId);
    return muscleGroup ? muscleGroup.color_code : '#3B82F6';
  }

  /**
   * 筋肉部位の回復時間を取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @returns {Promise<number>} 回復時間（時間）
   */
  async getMuscleGroupRecoveryHours(muscleGroupId) {
    const muscleGroup = await this.getMuscleGroupById(muscleGroupId);
    return muscleGroup ? muscleGroup.recovery_hours : 72;
  }

  /**
   * 筋肉部位のサイズカテゴリを取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @returns {Promise<string>} サイズカテゴリ（large/small）
   */
  async getMuscleGroupSize(muscleGroupId) {
    const muscleGroup = await this.getMuscleGroupById(muscleGroupId);
    return muscleGroup ? muscleGroup.muscle_size : 'large';
  }

  /**
   * 筋肉部位のマッピング（旧システムとの互換性用）
   * @param {string} oldMuscleGroupId - 旧システムの筋肉部位ID
   * @returns {string} 新しい筋肉部位ID
   */
  getMuscleGroupMapping(oldMuscleGroupId) {
    const mapping = {
      chest: 'chest',
      back: 'back',
      shoulder: 'shoulders',
      arm: 'arms',
      leg: 'legs',
      core: 'abs',
    };
    return mapping[oldMuscleGroupId] || oldMuscleGroupId;
  }

  /**
   * 筋肉部位のカテゴリ詳細情報を取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @returns {Promise<Object|null>} カテゴリ詳細情報
   */
  async getMuscleGroupCategoryInfo(muscleGroupId) {
    // 筋肉部位IDのマッピング（HTMLのdata-muscle属性とサービス内のIDを対応）
    const muscleGroupMapping = {
      chest: 'chest',
      back: 'back',
      legs: 'legs',
      shoulders: 'shoulders',
      arms: 'arms',
      core: 'abs', // HTMLでは'core'だが、データベースでは'abs'
    };

    const mappedId = muscleGroupMapping[muscleGroupId] || muscleGroupId;
    console.log(
      'Getting category info for:',
      muscleGroupId,
      'mapped to:',
      mappedId
    );

    // まずIDで検索
    let muscleGroup = await this.getMuscleGroupById(mappedId);

    // IDで見つからない場合は名前で検索
    if (!muscleGroup) {
      console.log('Trying to find by name...');
      muscleGroup = await this.getMuscleGroupByName(muscleGroupId);
    }

    if (!muscleGroup) {
      console.warn(
        'Muscle group not found by ID or name:',
        muscleGroupId,
        'mapped to:',
        mappedId
      );
      // フォールバック: 筋肉部位が見つからない場合でも、カテゴリ情報は返す
      console.log('Using fallback category info for:', muscleGroupId);
      return this.getFallbackCategoryInfo(muscleGroupId);
    }

    console.log('Found muscle group:', muscleGroup);

    const categoryInfo = {
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
          'プッシュ系動作の強化',
        ],
        exercises: [
          'プッシュアップ（腕立て伏せ）',
          'ベンチプレス',
          'ダンベルフライ',
          'インクラインプレス',
          'ディップス',
          'ケーブルクロスオーバー',
          'プッシュアップバリエーション',
          'ダンベルプレス',
        ],
        tips: [
          '胸筋を意識して動作を行う',
          '肩甲骨を安定させる',
          '適切な可動域を保つ',
          '呼吸を意識する',
        ],
        commonMistakes: [
          '肩が前に出すぎる',
          '可動域が狭い',
          '反動を使いすぎる',
          '呼吸を止める',
        ],
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
          '引く動作の強化',
        ],
        exercises: [
          'プルアップ（懸垂）',
          'ラットプルダウン',
          'ベントオーバーロウ',
          'ワンハンドダンベルロウ',
          'シーテッドロウ',
          'フェイスプル',
          'デッドリフト',
          'リバースフライ',
        ],
        tips: [
          '肩甲骨を寄せる動作を意識',
          '胸を張って姿勢を保つ',
          '背筋を意識して動作',
          '適切な重量を選択',
        ],
        commonMistakes: [
          '肩が上がる',
          '腰が丸まる',
          '反動を使いすぎる',
          '可動域が狭い',
        ],
      },
      legs: {
        name: '脚筋',
        nameEn: 'Legs',
        icon: 'fas fa-running',
        color: 'text-purple-500',
        description:
          '大腿四頭筋、ハムストリングス、臀筋、ふくらはぎを鍛えるエクササイズ',
        benefits: [
          '下半身の筋力向上',
          'バランス能力向上',
          '代謝の向上',
          '日常動作の改善',
        ],
        exercises: [
          'スクワット',
          'ランジ',
          'デッドリフト',
          'レッグプレス',
          'レッグカール',
          'レッグエクステンション',
          'カーフレイズ',
          'ブルガリアンスクワット',
        ],
        tips: [
          '膝の向きに注意',
          '重心を安定させる',
          '深い可動域を意識',
          '呼吸を意識する',
        ],
        commonMistakes: [
          '膝が内側に入る',
          '腰が丸まる',
          '可動域が浅い',
          '反動を使いすぎる',
        ],
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
          'オーバーヘッド動作の強化',
        ],
        exercises: [
          'ショルダープレス',
          'サイドレイズ',
          'フロントレイズ',
          'リアデルトフライ',
          'アーノルドプレス',
          'アップライトロウ',
          'フェイスプル',
          'バックフライ',
        ],
        tips: [
          '肩甲骨を安定させる',
          '適切な重量を選択',
          '可動域を意識',
          'バランスよく鍛える',
        ],
        commonMistakes: [
          '重量が重すぎる',
          '肩が上がる',
          '可動域が狭い',
          '前部ばかり鍛える',
        ],
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
          'プッシュ・プル動作の強化',
        ],
        exercises: [
          'ダンベルカール',
          'ハンマーカール',
          'トライセップディップス',
          'トライセッププッシュダウン',
          'オーバーヘッドエクステンション',
          'クローズグリッププッシュアップ',
          'リバースカール',
          'プリーチャーカール',
        ],
        tips: [
          '適切な重量を選択',
          '可動域を意識',
          '反動を使わない',
          'バランスよく鍛える',
        ],
        commonMistakes: [
          '反動を使いすぎる',
          '重量が重すぎる',
          '可動域が狭い',
          '片方ばかり鍛える',
        ],
      },
      abs: {
        name: '腹',
        nameEn: 'Core',
        icon: 'fas fa-circle',
        color: 'text-yellow-500',
        description: '腹筋、背筋、横腹筋、深層筋を鍛えるエクササイズ',
        benefits: [
          '体幹の安定性向上',
          '姿勢の改善',
          '腰痛の予防',
          'パフォーマンス向上',
        ],
        exercises: [
          'プランク',
          'クランチ',
          'サイドプランク',
          'ロシアンツイスト',
          'マウンテンクライマー',
          'デッドバグ',
          'バードドッグ',
          'レッグレイズ',
        ],
        tips: [
          '呼吸を意識する',
          '正しい姿勢を保つ',
          'ゆっくりと動作',
          '継続的に行う',
        ],
        commonMistakes: [
          '呼吸を止める',
          '腰を反らしすぎる',
          '反動を使う',
          '継続しない',
        ],
      },
    };

    const result = categoryInfo[mappedId] || null;
    console.log('Category info result:', result);
    return result;
  }

  /**
   * 筋肉部位のフィルターオプションを生成
   * @returns {Promise<Array>} フィルターオプション
   */
  async getMuscleGroupFilterOptions() {
    const muscleGroups = await this.getMuscleGroups();
    return muscleGroups.map((group) => ({
      value: group.id,
      text: group.name_ja,
      color: group.color_code,
    }));
  }

  /**
   * フォールバック用のカテゴリ情報を取得
   * @param {string} muscleGroupId - 筋肉部位ID
   * @returns {Object|null} カテゴリ情報
   */
  getFallbackCategoryInfo(muscleGroupId) {
    const fallbackInfo = {
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
          'プッシュ系動作の強化',
        ],
        exercises: [
          'プッシュアップ',
          'ベンチプレス',
          'ダンベルフライ',
          'インクラインプレス',
          'ディップス',
        ],
        tips: [
          '胸筋を意識して動作を行う',
          '肩甲骨を安定させる',
          '適切な可動域を保つ',
          '呼吸を意識する',
        ],
        commonMistakes: [
          '肩が前に出すぎる',
          '可動域が狭い',
          '反動を使いすぎる',
          '呼吸を止める',
        ],
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
          '引く動作の強化',
        ],
        exercises: [
          'プルアップ',
          'ラットプルダウン',
          'ベントオーバーロウ',
          'ワンハンドダンベルロウ',
          'シーテッドロウ',
        ],
        tips: [
          '肩甲骨を寄せる動作を意識',
          '胸を張って姿勢を保つ',
          '背筋を意識して動作',
          '適切な重量を選択',
        ],
        commonMistakes: [
          '肩が上がる',
          '腰が丸まる',
          '反動を使いすぎる',
          '可動域が狭い',
        ],
      },
      legs: {
        name: '脚筋',
        nameEn: 'Legs',
        icon: 'fas fa-running',
        color: 'text-purple-500',
        description:
          '大腿四頭筋、ハムストリングス、臀筋、ふくらはぎを鍛えるエクササイズ',
        benefits: [
          '下半身の筋力向上',
          'バランス能力向上',
          '代謝の向上',
          '日常動作の改善',
        ],
        exercises: [
          'スクワット',
          'ランジ',
          'デッドリフト',
          'レッグプレス',
          'レッグカール',
        ],
        tips: [
          '膝の向きに注意',
          '重心を安定させる',
          '深い可動域を意識',
          '呼吸を意識する',
        ],
        commonMistakes: [
          '膝が内側に入る',
          '腰が丸まる',
          '可動域が浅い',
          '反動を使いすぎる',
        ],
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
          'オーバーヘッド動作の強化',
        ],
        exercises: [
          'ショルダープレス',
          'サイドレイズ',
          'フロントレイズ',
          'リアデルトフライ',
          'アーノルドプレス',
        ],
        tips: [
          '肩甲骨を安定させる',
          '適切な重量を選択',
          '可動域を意識',
          'バランスよく鍛える',
        ],
        commonMistakes: [
          '重量が重すぎる',
          '肩が上がる',
          '可動域が狭い',
          '前部ばかり鍛える',
        ],
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
          'プッシュ・プル動作の強化',
        ],
        exercises: [
          'ダンベルカール',
          'ハンマーカール',
          'トライセップディップス',
          'トライセッププッシュダウン',
          'オーバーヘッドエクステンション',
        ],
        tips: [
          '適切な重量を選択',
          '可動域を意識',
          '反動を使わない',
          'バランスよく鍛える',
        ],
        commonMistakes: [
          '反動を使いすぎる',
          '重量が重すぎる',
          '可動域が狭い',
          '片方ばかり鍛える',
        ],
      },
      core: {
        name: '腹',
        nameEn: 'Core',
        icon: 'fas fa-circle',
        color: 'text-yellow-500',
        description: '腹筋、背筋、横腹筋、深層筋を鍛えるエクササイズ',
        benefits: [
          '体幹の安定性向上',
          '姿勢の改善',
          '腰痛の予防',
          'パフォーマンス向上',
        ],
        exercises: [
          'プランク',
          'クランチ',
          'サイドプランク',
          'ロシアンツイスト',
          'マウンテンクライマー',
        ],
        tips: [
          '呼吸を意識する',
          '正しい姿勢を保つ',
          'ゆっくりと動作',
          '継続的に行う',
        ],
        commonMistakes: [
          '呼吸を止める',
          '腰を反らしすぎる',
          '反動を使う',
          '継続しない',
        ],
      },
    };

    return fallbackInfo[muscleGroupId] || null;
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.cache.clear();
    this.muscleGroups = null;
  }

  /**
   * 筋肉部位を追加
   * @param {Object} muscleGroupData - 筋肉部位データ
   * @returns {Promise<Object>} 追加された筋肉部位
   */
  async addMuscleGroup(muscleGroupData) {
    try {
      if (!supabaseService.isAvailable()) {
        throw new Error('Supabase not available');
      }

      const result = await supabaseService.saveData(
        'muscle_groups',
        muscleGroupData
      );
      this.clearCache(); // キャッシュをクリア
      return result;
    } catch (error) {
      console.error('Error adding muscle group:', error);
      throw error;
    }
  }

  /**
   * 筋肉部位を更新
   * @param {string} id - 筋肉部位ID
   * @param {Object} muscleGroupData - 更新データ
   * @returns {Promise<Object>} 更新された筋肉部位
   */
  async updateMuscleGroup(id, muscleGroupData) {
    try {
      if (!supabaseService.isAvailable()) {
        throw new Error('Supabase not available');
      }

      const result = await supabaseService.saveData('muscle_groups', {
        ...muscleGroupData,
        id,
      });
      this.clearCache(); // キャッシュをクリア
      return result;
    } catch (error) {
      console.error('Error updating muscle group:', error);
      throw error;
    }
  }

  /**
   * 筋肉部位を削除
   * @param {string} id - 筋肉部位ID
   * @returns {Promise<void>}
   */
  async deleteMuscleGroup(id) {
    try {
      if (!supabaseService.isAvailable()) {
        throw new Error('Supabase not available');
      }

      await supabaseService.saveData('muscle_groups', { id, deleted: true });
      this.clearCache(); // キャッシュをクリア
    } catch (error) {
      console.error('Error deleting muscle group:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const muscleGroupService = new MuscleGroupService();
