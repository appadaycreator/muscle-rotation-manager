// helpPage.js - ヘルプページ

import { tooltipManager } from '../utils/TooltipManager.js';
import { safeGetElement } from '../utils/helpers.js';

/**
 * ヘルプページクラス
 */
class HelpPage {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * 初期化
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('🔄 Initializing help page...');

            // ツールチップ機能を初期化
            tooltipManager.initialize();

            // ヘルプページのコンテンツを表示
            this.renderHelpPage();

            // ツールチップを設定
            this.setupTooltips();

            this.isInitialized = true;
            console.log('✅ Help page initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize help page:', error);
        }
    }

    /**
     * ヘルプページをレンダリング
     */
    renderHelpPage() {
        const main = safeGetElement('main');
        if (!main) return;

        main.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <!-- ヘッダー -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">
                        <i class="fas fa-question-circle text-blue-500 mr-3"></i>
                        ヘルプ・サポート
                    </h1>
                    <p class="text-gray-600">アプリの使い方やよくある質問を確認できます</p>
                </div>

                <!-- クイックスタートガイド -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-rocket text-green-500 mr-2"></i>
                        クイックスタートガイド
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="bg-blue-50 rounded-lg p-4">
                            <h3 class="font-semibold text-blue-800 mb-2">1. アカウント作成</h3>
                            <p class="text-blue-600 text-sm">メールアドレスでアカウントを作成し、プロフィールを設定します。</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-4">
                            <h3 class="font-semibold text-green-800 mb-2">2. ワークアウト開始</h3>
                            <p class="text-green-600 text-sm">筋肉部位を選択して、エクササイズを追加してワークアウトを開始します。</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-4">
                            <h3 class="font-semibold text-purple-800 mb-2">3. 進捗追跡</h3>
                            <p class="text-purple-600 text-sm">プログレスページで進捗を確認し、目標達成を目指します。</p>
                        </div>
                    </div>
                </div>

                <!-- よくある質問 -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-question text-orange-500 mr-2"></i>
                        よくある質問
                    </h2>
                    <div class="space-y-4">
                        <div class="border-l-4 border-blue-500 pl-4">
                            <h3 class="font-semibold text-gray-800">Q. ワークアウトを保存するには？</h3>
                            <p class="text-gray-600 text-sm mt-1">ワークアウトページで「ワークアウト終了」ボタンをクリックすると、自動的に保存されます。</p>
                        </div>
                        <div class="border-l-4 border-green-500 pl-4">
                            <h3 class="font-semibold text-gray-800">Q. 進捗を確認するには？</h3>
                            <p class="text-gray-600 text-sm mt-1">プログレスページで過去のワークアウト履歴と進捗グラフを確認できます。</p>
                        </div>
                        <div class="border-l-4 border-purple-500 pl-4">
                            <h3 class="font-semibold text-gray-800">Q. エクササイズを追加するには？</h3>
                            <p class="text-gray-600 text-sm mt-1">エクササイズページで「エクササイズ追加」ボタンをクリックして新しいエクササイズを追加できます。</p>
                        </div>
                        <div class="border-l-4 border-orange-500 pl-4">
                            <h3 class="font-semibold text-gray-800">Q. 設定を変更するには？</h3>
                            <p class="text-gray-600 text-sm mt-1">設定ページでプロフィール情報やトレーニング設定を変更できます。</p>
                        </div>
                    </div>
                </div>

                <!-- 機能別ガイド -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-book text-indigo-500 mr-2"></i>
                        機能別ガイド
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3">ワークアウト機能</h3>
                            <ul class="space-y-2 text-sm text-gray-600">
                                <li>• 筋肉部位別エクササイズ選択</li>
                                <li>• セット・回数・重量の記録</li>
                                <li>• ワークアウトタイマー</li>
                                <li>• 自動保存機能</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3">進捗追跡機能</h3>
                            <ul class="space-y-2 text-sm text-gray-600">
                                <li>• 1RM計算</li>
                                <li>• プログレッシブ・オーバーロード分析</li>
                                <li>• 進捗グラフ表示</li>
                                <li>• 目標設定・達成度</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3">エクササイズ管理</h3>
                            <ul class="space-y-2 text-sm text-gray-600">
                                <li>• エクササイズ検索・フィルタリング</li>
                                <li>• カスタムエクササイズ追加</li>
                                <li>• 筋肉部位別分類</li>
                                <li>• 難易度・器具情報</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3">カレンダー機能</h3>
                            <ul class="space-y-2 text-sm text-gray-600">
                                <li>• ワークアウト履歴表示</li>
                                <li>• 日別トレーニング記録</li>
                                <li>• 筋肉部位別色分け</li>
                                <li>• 月別・週別表示</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- サポート情報 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-headset text-teal-500 mr-2"></i>
                        サポート情報
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3">お問い合わせ</h3>
                            <p class="text-gray-600 text-sm mb-2">アプリに関するご質問やご要望がございましたら、お気軽にお問い合わせください。</p>
                            <div class="space-y-2">
                                <div class="flex items-center text-sm text-gray-600">
                                    <i class="fas fa-envelope mr-2 text-blue-500"></i>
                                    support@muscle-rotation.com
                                </div>
                                <div class="flex items-center text-sm text-gray-600">
                                    <i class="fas fa-clock mr-2 text-green-500"></i>
                                    平日 9:00-18:00
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3">更新情報</h3>
                            <p class="text-gray-600 text-sm mb-2">最新の機能追加や改善情報をお知らせします。</p>
                            <div class="space-y-2">
                                <div class="flex items-center text-sm text-gray-600">
                                    <i class="fas fa-bell mr-2 text-yellow-500"></i>
                                    通知設定で更新情報を受け取れます
                                </div>
                                <div class="flex items-center text-sm text-gray-600">
                                    <i class="fas fa-download mr-2 text-purple-500"></i>
                                    自動更新で最新機能を利用できます
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ツールチップを設定
     */
    setupTooltips() {
        try {
            console.log('Setting up tooltips for help page');

            // クイックスタートガイドのツールチップ
            tooltipManager.addTooltip('.bg-blue-50', {
                content: 'アカウント作成は初回のみ必要です。メールアドレスとパスワードを設定してください。',
                position: 'top'
            });

            tooltipManager.addTooltip('.bg-green-50', {
                content: 'ワークアウトページで筋肉部位を選択し、エクササイズを追加してトレーニングを開始できます。',
                position: 'top'
            });

            tooltipManager.addTooltip('.bg-purple-50', {
                content: 'プログレスページで1RM計算や進捗グラフを確認し、目標達成を目指しましょう。',
                position: 'top'
            });

            // よくある質問のツールチップ
            tooltipManager.addTooltip('.border-blue-500', {
                content: 'ワークアウトは自動保存されます。手動で保存する必要はありません。',
                position: 'right'
            });

            tooltipManager.addTooltip('.border-green-500', {
                content: 'プログレスページで詳細な進捗分析とグラフを確認できます。',
                position: 'right'
            });

            tooltipManager.addTooltip('.border-purple-500', {
                content: 'エクササイズページでカスタムエクササイズを追加・編集できます。',
                position: 'right'
            });

            tooltipManager.addTooltip('.border-orange-500', {
                content: '設定ページでプロフィール情報やトレーニング設定を変更できます。',
                position: 'right'
            });

            // 機能別ガイドのツールチップ
            tooltipManager.addTooltip('h3', {
                content: '各機能の詳細な使い方を確認できます。',
                position: 'top'
            });

            // サポート情報のツールチップ
            tooltipManager.addTooltip('.fa-envelope', {
                content: 'メールでのお問い合わせは24時間以内に回答いたします。',
                position: 'top'
            });

            tooltipManager.addTooltip('.fa-clock', {
                content: '平日の営業時間内のお問い合わせは迅速に対応いたします。',
                position: 'top'
            });

            tooltipManager.addTooltip('.fa-bell', {
                content: '設定ページで通知設定を変更できます。',
                position: 'top'
            });

            tooltipManager.addTooltip('.fa-download', {
                content: 'アプリは自動更新されるため、常に最新機能を利用できます。',
                position: 'top'
            });

            console.log('✅ Tooltips setup complete for help page');

        } catch (error) {
            console.error('❌ Failed to setup tooltips:', error);
        }
    }
}

// シングルトンインスタンスをエクスポート
export const helpPage = new HelpPage();
