// constants.js - アプリケーション全体で使用される定数

// Supabase設定
export const SUPABASE_CONFIG = {
    url: 'https://mwwlqpokfgduxyjbqoff.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d2xxcG9rZmdkdXh5amJxb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU3MTIsImV4cCI6MjA2ODA5MTcxMn0.0vyxxQ7zBfRKrH-JhpHMor_UvuBbQu3wE9HStGjsfGQ'
};

// 筋肉部位の定義（非推奨：muscleGroupServiceを使用してください）
// @deprecated Use muscleGroupService.getMuscleGroups() instead
export const MUSCLE_GROUPS = [
    {
        id: 'chest',
        name: '胸筋',
        bgColor: 'bg-red-100',
        hoverColor: 'bg-red-200',
        iconColor: 'text-red-500',
        textColor: 'text-red-700',
        color: 'chest-color',
        recoveryHours: 72, // 大筋群：72時間
        category: 'large',
        scientificBasis: '大胸筋は大筋群のため、完全回復に72時間必要'
    },
    {
        id: 'back',
        name: '背筋',
        bgColor: 'bg-green-100',
        hoverColor: 'bg-green-200',
        iconColor: 'text-green-500',
        textColor: 'text-green-700',
        color: 'back-color',
        recoveryHours: 72, // 大筋群：72時間
        category: 'large',
        scientificBasis: '広背筋・僧帽筋は大筋群のため、完全回復に72時間必要'
    },
    {
        id: 'shoulder',
        name: '肩',
        bgColor: 'bg-yellow-100',
        hoverColor: 'bg-yellow-200',
        iconColor: 'text-yellow-500',
        textColor: 'text-yellow-700',
        color: 'shoulder-color',
        recoveryHours: 48, // 中筋群：48時間
        category: 'medium',
        scientificBasis: '三角筋は中筋群のため、完全回復に48時間必要'
    },
    {
        id: 'arm',
        name: '腕',
        bgColor: 'bg-purple-100',
        hoverColor: 'bg-purple-200',
        iconColor: 'text-purple-500',
        textColor: 'text-purple-700',
        color: 'arm-color',
        recoveryHours: 48, // 中筋群：48時間
        category: 'medium',
        scientificBasis: '上腕二頭筋・三頭筋は中筋群のため、完全回復に48時間必要'
    },
    {
        id: 'leg',
        name: '脚',
        bgColor: 'bg-blue-100',
        hoverColor: 'bg-blue-200',
        iconColor: 'text-blue-500',
        textColor: 'text-blue-700',
        color: 'leg-color',
        recoveryHours: 72, // 大筋群：72時間
        category: 'large',
        scientificBasis: '大腿四頭筋・ハムストリングは大筋群のため、完全回復に72時間必要'
    },
    {
        id: 'core',
        name: '体幹',
        bgColor: 'bg-pink-100',
        hoverColor: 'bg-pink-200',
        iconColor: 'text-pink-500',
        textColor: 'text-pink-700',
        color: 'core-color',
        recoveryHours: 24, // 小筋群：24時間
        category: 'small',
        scientificBasis: '腹筋群は小筋群のため、完全回復に24時間必要'
    }
];

// 回復期間の科学的根拠
export const RECOVERY_SCIENCE = {
    large: {
        hours: 72,
        description: '大筋群（胸筋、背筋、脚）',
        reason: '筋繊維の損傷が大きく、タンパク質合成に時間を要するため'
    },
    medium: {
        hours: 48,
        description: '中筋群（肩、腕）',
        reason: '中程度の筋繊維損傷で、適度な回復時間が必要'
    },
    small: {
        hours: 24,
        description: '小筋群（体幹）',
        reason: '筋繊維の損傷が軽微で、比較的早期回復が可能'
    }
};

// トレーニング強度による回復時間調整係数
export const INTENSITY_MULTIPLIERS = {
    light: 0.7,    // 軽い強度：回復時間30%短縮
    moderate: 1.0, // 中程度：標準回復時間
    high: 1.3,     // 高強度：回復時間30%延長
    extreme: 1.5   // 極高強度：回復時間50%延長
};

// ユーザー体力レベルによる回復時間調整係数
export const FITNESS_LEVEL_MULTIPLIERS = {
    beginner: 1.2,     // 初心者：回復時間20%延長
    intermediate: 1.0, // 中級者：標準回復時間
    advanced: 0.8,     // 上級者：回復時間20%短縮
    expert: 0.7        // エキスパート：回復時間30%短縮
};

// エクササイズデータ（拡張版）
export const EXERCISES = {
    chest: [
        // 自重エクササイズ
        { id: 1, name: 'プッシュアップ', category: 'compound', description: '基本的な胸筋エクササイズ', muscles: '大胸筋、三角筋前部、上腕三頭筋', difficulty: '初級', equipment: 'bodyweight' },
        { id: 2, name: 'インクラインプッシュアップ', category: 'compound', description: '初心者向けの胸筋エクササイズ', muscles: '大胸筋上部、三角筋前部', difficulty: '初級', equipment: 'bodyweight' },
        { id: 3, name: 'ダイヤモンドプッシュアップ', category: 'compound', description: '上腕三頭筋と内側胸筋に効果的', muscles: '大胸筋内側、上腕三頭筋', difficulty: '中級', equipment: 'bodyweight' },
        { id: 4, name: 'ワイドプッシュアップ', category: 'compound', description: '外側胸筋を重点的に鍛える', muscles: '大胸筋外側、三角筋前部', difficulty: '初級', equipment: 'bodyweight' },
        { id: 5, name: 'デクラインプッシュアップ', category: 'compound', description: '上部胸筋に効果的な上級者向け', muscles: '大胸筋上部、三角筋前部', difficulty: '中級', equipment: 'bodyweight' },
        { id: 6, name: 'パイクプッシュアップ', category: 'compound', description: '肩と上部胸筋を鍛える', muscles: '大胸筋上部、三角筋前部・中部', difficulty: '中級', equipment: 'bodyweight' },
        { id: 7, name: 'アーチャープッシュアップ', category: 'compound', description: '片側ずつ鍛える上級者向け', muscles: '大胸筋、上腕三頭筋', difficulty: '上級', equipment: 'bodyweight' },
        { id: 8, name: 'ヒンドゥープッシュアップ', category: 'compound', description: '流動的な動きで全身を鍛える', muscles: '大胸筋、三角筋、体幹', difficulty: '中級', equipment: 'bodyweight' },

        // 器具を使ったエクササイズ
        { id: 9, name: 'ベンチプレス', category: 'compound', description: '大胸筋を鍛える基本的な複合エクササイズ', muscles: '大胸筋、三角筋前部、上腕三頭筋', difficulty: '中級', equipment: 'barbell' },
        { id: 10, name: 'ダンベルプレス', category: 'compound', description: '可動域を広く取れる胸筋エクササイズ', muscles: '大胸筋、三角筋前部、上腕三頭筋', difficulty: '中級', equipment: 'dumbbell' },
        { id: 11, name: 'インクラインダンベルプレス', category: 'compound', description: '上部胸筋を重点的に鍛える', muscles: '大胸筋上部、三角筋前部', difficulty: '中級', equipment: 'dumbbell' },
        { id: 12, name: 'チェストフライ', category: 'isolation', description: '大胸筋を単独で鍛える単関節エクササイズ', muscles: '大胸筋', difficulty: '初級', equipment: 'dumbbell' },
        { id: 13, name: 'ケーブルクロスオーバー', category: 'isolation', description: '胸筋の内側を鍛える', muscles: '大胸筋内側', difficulty: '初級', equipment: 'cable' },
        { id: 14, name: 'ディップス', category: 'compound', description: '自重で大胸筋下部を鍛える', muscles: '大胸筋下部、上腕三頭筋', difficulty: '中級', equipment: 'dip bars' },
        { id: 15, name: 'マシンチェストプレス', category: 'compound', description: '初心者にも安全で効果的', muscles: '大胸筋、三角筋前部、上腕三頭筋', difficulty: '初級', equipment: 'machine' }
    ],
    back: [
        // 自重エクササイズ
        { id: 16, name: 'プルアップ', category: 'compound', description: '背筋の王道エクササイズ', muscles: '広背筋、上腕二頭筋、三角筋後部', difficulty: '上級', equipment: 'pull-up bar' },
        { id: 17, name: 'チンアップ', category: 'compound', description: '逆手で行う背筋エクササイズ', muscles: '広背筋、上腕二頭筋', difficulty: '中級', equipment: 'pull-up bar' },
        { id: 18, name: 'インバーテッドロウ', category: 'compound', description: '水平に引く背筋エクササイズ', muscles: '広背筋、菱形筋、上腕二頭筋', difficulty: '初級', equipment: 'bodyweight' },
        { id: 19, name: 'スーパーマン', category: 'isolation', description: '腰の強化に効果的', muscles: '脊柱起立筋、臀筋', difficulty: '初級', equipment: 'bodyweight' },
        { id: 20, name: 'リバーススノーエンジェル', category: 'isolation', description: '肩甲骨周りの筋肉を活性化', muscles: '菱形筋、中部僧帽筋', difficulty: '初級', equipment: 'bodyweight' },

        // 器具を使ったエクササイズ
        { id: 21, name: 'デッドリフト', category: 'compound', description: '全身を鍛えるキングオブエクササイズ', muscles: '広背筋、脊柱起立筋、臀筋、ハムストリング', difficulty: '上級', equipment: 'barbell' },
        { id: 22, name: 'ベントオーバーロウ', category: 'compound', description: '背中の厚みを作るエクササイズ', muscles: '広背筋、菱形筋、上腕二頭筋', difficulty: '中級', equipment: 'barbell' },
        { id: 23, name: 'ワンアームダンベルロウ', category: 'compound', description: '片側ずつ鍛える背筋エクササイズ', muscles: '広背筋、菱形筋、上腕二頭筋', difficulty: '中級', equipment: 'dumbbell' },
        { id: 24, name: 'ラットプルダウン', category: 'compound', description: '広背筋を鍛える基本的なエクササイズ', muscles: '広背筋、上腕二頭筋', difficulty: '初級', equipment: 'cable' },
        { id: 25, name: 'ケーブルロウ', category: 'compound', description: '座って行う背筋エクササイズ', muscles: '広背筋、菱形筋、上腕二頭筋', difficulty: '初級', equipment: 'cable' },
        { id: 26, name: 'フェイスプル', category: 'isolation', description: '後部三角筋と上部背筋に効果的', muscles: '後部三角筋、菱形筋', difficulty: '初級', equipment: 'cable' },
        { id: 27, name: 'シュラッグ', category: 'isolation', description: '僧帽筋上部を集中的に鍛える', muscles: '僧帽筋上部', difficulty: '初級', equipment: 'dumbbell' },
        { id: 28, name: 'グッドモーニング', category: 'compound', description: '腰部と臀筋に効果的', muscles: '脊柱起立筋、臀筋、ハムストリング', difficulty: '中級', equipment: 'barbell' }
    ],
    shoulder: [
        // 自重エクササイズ
        { id: 29, name: 'パイクプッシュアップ', category: 'compound', description: '肩の筋肉を主に使う自重エクササイズ', muscles: '三角筋前部・中部、上腕三頭筋', difficulty: '中級', equipment: 'bodyweight' },
        { id: 30, name: '逆立ちプッシュアップ', category: 'compound', description: '上級者向けの肩エクササイズ', muscles: '三角筋前部・中部、上腕三頭筋', difficulty: '上級', equipment: 'bodyweight' },
        { id: 31, name: 'ショルダーサークル', category: 'isolation', description: '肩の可動域を広げるウォームアップ', muscles: '三角筋全体', difficulty: '初級', equipment: 'bodyweight' },

        // 器具を使ったエクササイズ
        { id: 32, name: 'ショルダープレス', category: 'compound', description: '三角筋全体を鍛える基本的なエクササイズ', muscles: '三角筋前部・中部、上腕三頭筋', difficulty: '中級', equipment: 'dumbbell' },
        { id: 33, name: 'サイドレイズ', category: 'isolation', description: '三角筋中部を重点的に鍛える', muscles: '三角筋中部', difficulty: '初級', equipment: 'dumbbell' },
        { id: 34, name: 'フロントレイズ', category: 'isolation', description: '前部三角筋を集中的に鍛える', muscles: '三角筋前部', difficulty: '初級', equipment: 'dumbbell' },
        { id: 35, name: 'リアデルトフライ', category: 'isolation', description: '後部三角筋を集中的に鍛える', muscles: '後部三角筋', difficulty: '中級', equipment: 'dumbbell' },
        { id: 36, name: 'アーノルドプレス', category: 'compound', description: '回転を加えたショルダープレス', muscles: '三角筋全体', difficulty: '中級', equipment: 'dumbbell' },
        { id: 37, name: 'アップライトロウ', category: 'compound', description: '縦に引く肩エクササイズ', muscles: '三角筋前部、僧帽筋', difficulty: '中級', equipment: 'barbell' },
        { id: 38, name: 'ミリタリープレス', category: 'compound', description: '立位で行うショルダープレス', muscles: '三角筋前部・中部、上腕三頭筋', difficulty: '中級', equipment: 'barbell' },
        { id: 39, name: 'ケーブルサイドレイズ', category: 'isolation', description: '一定の負荷でサイドレイズ', muscles: '三角筋中部', difficulty: '初級', equipment: 'cable' },
        { id: 40, name: 'オーバーヘッドプレス', category: 'compound', description: '立位で頭上に押し上げる', muscles: '三角筋前部・中部、上腕三頭筋', difficulty: '中級', equipment: 'barbell' }
    ],
    arm: [
        // 上腕二頭筋
        { id: 41, name: 'バーベルカール', category: 'isolation', description: '上腕二頭筋を鍛える基本的なエクササイズ', muscles: '上腕二頭筋', difficulty: '初級', equipment: 'barbell' },
        { id: 42, name: 'ダンベルカール', category: 'isolation', description: 'ダンベルで行う二頭筋エクササイズ', muscles: '上腕二頭筋', difficulty: '初級', equipment: 'dumbbell' },
        { id: 43, name: 'ハンマーカール', category: 'isolation', description: 'ニュートラルグリップで行うカール', muscles: '上腕二頭筋、前腕', difficulty: '初級', equipment: 'dumbbell' },
        { id: 44, name: 'プリーチャーカール', category: 'isolation', description: '上腕二頭筋のピークを作る', muscles: '上腕二頭筋', difficulty: '中級', equipment: 'barbell' },
        { id: 45, name: 'ケーブルカール', category: 'isolation', description: '一定の負荷でカール', muscles: '上腕二頭筋', difficulty: '初級', equipment: 'cable' },
        { id: 46, name: 'コンセントレーションカール', category: 'isolation', description: '座って片手で行うカール', muscles: '上腕二頭筋', difficulty: '初級', equipment: 'dumbbell' },

        // 上腕三頭筋
        { id: 47, name: 'トライセップディップス', category: 'compound', description: '自重で三頭筋を鍛える', muscles: '上腕三頭筋、大胸筋下部', difficulty: '中級', equipment: 'dip bars' },
        { id: 48, name: 'クローズグリップベンチプレス', category: 'compound', description: '三頭筋に効果的なベンチプレス', muscles: '上腕三頭筋、大胸筋', difficulty: '中級', equipment: 'barbell' },
        { id: 49, name: 'オーバーヘッドトライセップエクステンション', category: 'isolation', description: '頭上で三頭筋を伸ばす', muscles: '上腕三頭筋', difficulty: '中級', equipment: 'dumbbell' },
        { id: 50, name: 'トライセップキックバック', category: 'isolation', description: '三頭筋の単関節運動', muscles: '上腕三頭筋', difficulty: '初級', equipment: 'dumbbell' },
        { id: 51, name: 'ケーブルトライセッププッシュダウン', category: 'isolation', description: 'ケーブルで三頭筋を鍛える', muscles: '上腕三頭筋', difficulty: '初級', equipment: 'cable' },
        { id: 52, name: 'ダイヤモンドプッシュアップ', category: 'compound', description: '三頭筋に効果的なプッシュアップ', muscles: '上腕三頭筋、大胸筋内側', difficulty: '中級', equipment: 'bodyweight' },

        // 前腕
        { id: 53, name: 'リストカール', category: 'isolation', description: '前腕の屈筋を鍛える', muscles: '前腕屈筋', difficulty: '初級', equipment: 'dumbbell' },
        { id: 54, name: 'リバースリストカール', category: 'isolation', description: '前腕の伸筋を鍛える', muscles: '前腕伸筋', difficulty: '初級', equipment: 'dumbbell' }
    ],
    leg: [
        // 大腿四頭筋
        { id: 55, name: 'スクワット', category: 'compound', description: '脚を鍛える基本的な複合エクササイズ', muscles: '大腿四頭筋、臀筋、ハムストリング', difficulty: '中級', equipment: 'bodyweight' },
        { id: 56, name: 'フロントスクワット', category: 'compound', description: '前担ぎで行うスクワット', muscles: '大腿四頭筋、臀筋、体幹', difficulty: '上級', equipment: 'barbell' },
        { id: 57, name: 'ブルガリアンスプリットスクワット', category: 'compound', description: '片足で行うスクワット', muscles: '大腿四頭筋、臀筋', difficulty: '中級', equipment: 'bodyweight' },
        { id: 58, name: 'ランジ', category: 'compound', description: '前踏み出しで行う脚の運動', muscles: '大腿四頭筋、臀筋、ハムストリング', difficulty: '初級', equipment: 'bodyweight' },
        { id: 59, name: 'ウォーキングランジ', category: 'compound', description: '歩きながら行うランジ', muscles: '大腿四頭筋、臀筋、ハムストリング', difficulty: '初級', equipment: 'bodyweight' },
        { id: 60, name: 'レッグプレス', category: 'compound', description: 'マシンで脚を鍛える', muscles: '大腿四頭筋、臀筋', difficulty: '初級', equipment: 'machine' },
        { id: 61, name: 'レッグエクステンション', category: 'isolation', description: '大腿四頭筋の単関節運動', muscles: '大腿四頭筋', difficulty: '初級', equipment: 'machine' },

        // ハムストリング
        { id: 62, name: 'ルーマニアンデッドリフト', category: 'compound', description: 'ハムストリングと臀筋に効果的', muscles: 'ハムストリング、臀筋、脊柱起立筋', difficulty: '中級', equipment: 'barbell' },
        { id: 63, name: 'レッグカール', category: 'isolation', description: 'ハムストリングの単関節運動', muscles: 'ハムストリング', difficulty: '初級', equipment: 'machine' },
        { id: 64, name: 'グッドモーニング', category: 'compound', description: '前傾で行うハムストリングエクササイズ', muscles: 'ハムストリング、臀筋、脊柱起立筋', difficulty: '中級', equipment: 'barbell' },

        // 臀筋
        { id: 65, name: 'ヒップスラスト', category: 'compound', description: '臀筋を集中的に鍛える', muscles: '臀筋、ハムストリング', difficulty: '中級', equipment: 'bodyweight' },
        { id: 66, name: 'グリュートブリッジ', category: 'compound', description: '臀筋の基本運動', muscles: '臀筋、ハムストリング', difficulty: '初級', equipment: 'bodyweight' },

        // ふくらはぎ
        { id: 67, name: 'カーフレイズ', category: 'isolation', description: 'ふくらはぎの基本運動', muscles: '腓腹筋、ヒラメ筋', difficulty: '初級', equipment: 'bodyweight' }
    ],
    core: [
        // 腹直筋
        { id: 68, name: 'クランチ', category: 'isolation', description: '腹直筋を鍛える基本的なエクササイズ', muscles: '腹直筋', difficulty: '初級', equipment: 'bodyweight' },
        { id: 69, name: 'シットアップ', category: 'isolation', description: '上体を起こす腹筋運動', muscles: '腹直筋', difficulty: '中級', equipment: 'bodyweight' },
        { id: 70, name: 'レッグレイズ', category: 'isolation', description: '下腹部に効果的な脚上げ運動', muscles: '腹直筋下部', difficulty: '中級', equipment: 'bodyweight' },
        { id: 71, name: 'ハンギングレッグレイズ', category: 'isolation', description: '上級者向けの下腹部運動', muscles: '腹直筋下部', difficulty: '上級', equipment: 'pull-up bar' },

        // 腹斜筋
        { id: 72, name: 'ロシアンツイスト', category: 'isolation', description: '腹斜筋と体幹の回転力', muscles: '腹斜筋、体幹', difficulty: '中級', equipment: 'bodyweight' },
        { id: 73, name: 'バイシクルクランチ', category: 'isolation', description: '自転車漕ぎのような腹筋運動', muscles: '腹斜筋、腹直筋', difficulty: '中級', equipment: 'bodyweight' },
        { id: 74, name: 'サイドプランク', category: 'isolation', description: '横向きで体を一直線に保つ', muscles: '腹斜筋、体幹', difficulty: '中級', equipment: 'bodyweight' },

        // 体幹
        { id: 75, name: 'プランク', category: 'isolation', description: '体幹を安定させる静的エクササイズ', muscles: '腹直筋、腹斜筋、脊柱起立筋', difficulty: '初級', equipment: 'bodyweight' },
        { id: 76, name: 'マウンテンクライマー', category: 'compound', description: '全身の有酸素運動', muscles: '腹直筋、腹斜筋、体幹', difficulty: '中級', equipment: 'bodyweight' },
        { id: 77, name: 'デッドバグ', category: 'isolation', description: '体幹の安定性向上', muscles: '腹直筋、体幹', difficulty: '初級', equipment: 'bodyweight' },
        { id: 78, name: 'バードドッグ', category: 'isolation', description: '四つん這いで体幹とバランス', muscles: '体幹、臀筋', difficulty: '初級', equipment: 'bodyweight' },
        { id: 79, name: 'アブローラー', category: 'compound', description: '上級者向けの体幹運動', muscles: '腹直筋、体幹', difficulty: '上級', equipment: 'ab wheel' },
        { id: 80, name: 'パロフプレス', category: 'isolation', description: '体幹の回転防止力', muscles: '体幹、腹斜筋', difficulty: '中級', equipment: 'cable' },
        { id: 81, name: 'ウッドチョッパー', category: 'isolation', description: '体幹の回転力向上', muscles: '腹斜筋、体幹', difficulty: '中級', equipment: 'cable' }
    ]
};

// カテゴリー名マッピング
export const CATEGORY_NAMES = {
    chest: '胸筋',
    back: '背筋',
    shoulder: '肩',
    arm: '腕',
    leg: '脚',
    core: '体幹'
};

// 通知設定
export const NOTIFICATION_DURATION = 3000;
export const NOTIFICATION_FADE_DURATION = 300;

// ローカルストレージキー
export const STORAGE_KEYS = {
    DARK_MODE: 'darkMode',
    WORKOUT_HISTORY: 'workoutHistory',
    USER_SETTINGS: 'userSettings'
};
