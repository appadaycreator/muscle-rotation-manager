// constants.js - アプリケーション全体で使用される定数

// Supabase設定
export const SUPABASE_CONFIG = {
    url: 'https://mwwlqpokfgduxyjbqoff.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d2xxcG9rZmdkdXh5amJxb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU3MTIsImV4cCI6MjA2ODA5MTcxMn0.0vyxxQ7zBfRKrH-JhpHMor_UvuBbQu3wE9HStGjsfGQ'
};

// 筋肉部位の定義
export const MUSCLE_GROUPS = [
    {
        id: 'chest',
        name: '胸筋',
        bgColor: 'bg-red-100',
        hoverColor: 'bg-red-200',
        iconColor: 'text-red-500',
        textColor: 'text-red-700',
        color: 'chest-color'
    },
    {
        id: 'back',
        name: '背筋',
        bgColor: 'bg-green-100',
        hoverColor: 'bg-green-200',
        iconColor: 'text-green-500',
        textColor: 'text-green-700',
        color: 'back-color'
    },
    {
        id: 'shoulder',
        name: '肩',
        bgColor: 'bg-yellow-100',
        hoverColor: 'bg-yellow-200',
        iconColor: 'text-yellow-500',
        textColor: 'text-yellow-700',
        color: 'shoulder-color'
    },
    {
        id: 'arm',
        name: '腕',
        bgColor: 'bg-purple-100',
        hoverColor: 'bg-purple-200',
        iconColor: 'text-purple-500',
        textColor: 'text-purple-700',
        color: 'arm-color'
    },
    {
        id: 'leg',
        name: '脚',
        bgColor: 'bg-blue-100',
        hoverColor: 'bg-blue-200',
        iconColor: 'text-blue-500',
        textColor: 'text-blue-700',
        color: 'leg-color'
    },
    {
        id: 'core',
        name: '体幹',
        bgColor: 'bg-pink-100',
        hoverColor: 'bg-pink-200',
        iconColor: 'text-pink-500',
        textColor: 'text-pink-700',
        color: 'core-color'
    }
];

// エクササイズデータ
export const EXERCISES = {
    chest: [
        { id: 1, name: 'ベンチプレス', category: 'compound', description: '大胸筋を鍛える基本的な複合エクササイズ', muscles: '大胸筋、三角筋前部、上腕三頭筋', difficulty: '中級' },
        { id: 2, name: 'インクラインプレス', category: 'compound', description: '大胸筋上部を重点的に鍛える', muscles: '大胸筋上部、三角筋前部', difficulty: '中級' },
        { id: 3, name: 'ディップス', category: 'compound', description: '自重で大胸筋下部を鍛える', muscles: '大胸筋下部、上腕三頭筋', difficulty: '初級' },
        { id: 4, name: 'ダンベルフライ', category: 'isolation', description: '大胸筋を単独で鍛える単関節エクササイズ', muscles: '大胸筋', difficulty: '初級' }
    ],
    back: [
        { id: 5, name: 'デッドリフト', category: 'compound', description: '全身を鍛える基本的な複合エクササイズ', muscles: '広背筋、脊柱起立筋、臀筋', difficulty: '上級' },
        { id: 6, name: 'ラットプルダウン', category: 'compound', description: '広背筋を鍛える基本的なエクササイズ', muscles: '広背筋、上腕二頭筋', difficulty: '初級' },
        { id: 7, name: 'ロウ', category: 'compound', description: '背中の厚みを作るエクササイズ', muscles: '広背筋、菱形筋', difficulty: '中級' }
    ],
    shoulder: [
        { id: 8, name: 'ショルダープレス', category: 'compound', description: '三角筋全体を鍛える基本的なエクササイズ', muscles: '三角筋前部・中部、上腕三頭筋', difficulty: '中級' },
        { id: 9, name: 'サイドレイズ', category: 'isolation', description: '三角筋中部を重点的に鍛える', muscles: '三角筋中部', difficulty: '初級' }
    ],
    arm: [
        { id: 10, name: 'バーベルカール', category: 'isolation', description: '上腕二頭筋を鍛える基本的なエクササイズ', muscles: '上腕二頭筋', difficulty: '初級' },
        { id: 11, name: 'トライセップスプッシュダウン', category: 'isolation', description: '上腕三頭筋を鍛えるエクササイズ', muscles: '上腕三頭筋', difficulty: '初級' }
    ],
    leg: [
        { id: 12, name: 'スクワット', category: 'compound', description: '脚を鍛える基本的な複合エクササイズ', muscles: '大腿四頭筋、臀筋、ハムストリング', difficulty: '中級' },
        { id: 13, name: 'レッグプレス', category: 'compound', description: 'マシンで脚を鍛えるエクササイズ', muscles: '大腿四頭筋、臀筋', difficulty: '初級' }
    ],
    core: [
        { id: 14, name: 'クランチ', category: 'isolation', description: '腹直筋を鍛える基本的なエクササイズ', muscles: '腹直筋', difficulty: '初級' },
        { id: 15, name: 'プランク', category: 'isolation', description: '体幹を安定させる静的エクササイズ', muscles: '腹直筋、腹斜筋、脊柱起立筋', difficulty: '初級' }
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
