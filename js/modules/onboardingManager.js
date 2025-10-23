// onboardingManager.js - オンボーディングフロー管理

import { supabaseService } from '../services/supabaseService.js';
import recommendationService from '../services/recommendationService.js';
import {
    showNotification,
    safeGetElement
} from '../utils/helpers.js';

/**
 * オンボーディングマネージャー
 * 新規ユーザーの初期設定フローを管理
 */
class OnboardingManager {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 5;
        this.onboardingData = {};
        this.isCompleted = false;
    }

    /**
     * オンボーディングが必要かチェック
     * @returns {boolean} オンボーディングが必要かどうか
     */
    isOnboardingNeeded() {
        try {
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            return !userProfile.onboarding_completed;
        } catch (error) {
            console.warn('オンボーディング状態の確認に失敗:', error);
            return true; // エラー時は安全側に倒してオンボーディングを実行
        }
    }

    /**
     * オンボーディングフローを開始
     */
    async startOnboarding() {
        if (!this.isOnboardingNeeded()) {
            console.log('オンボーディングは既に完了しています');
            return;
        }

        console.log('オンボーディングフローを開始します');
        this.currentStep = 0;
        this.onboardingData = {};

        await this.showOnboardingModal();
    }

    /**
     * オンボーディングモーダルを表示
     */
    async showOnboardingModal() {
        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = this.getModalHTML();

        document.body.appendChild(modal);
        this.setupModalEventListeners();
        this.updateStepContent();
    }

    /**
     * モーダルHTMLを取得
     * @returns {string} モーダルHTML
     */
    getModalHTML() {
        return `
            <div class="bg-white rounded-lg max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <!-- ヘッダー -->
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">
                            <i class="fas fa-rocket text-blue-500 mr-2"></i>
                            初期設定
                        </h2>
                        <p class="text-gray-600 mt-1">あなたに最適なトレーニングプランを作成しましょう</p>
                    </div>
                    <button id="close-onboarding" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <!-- プログレスバー -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-600">ステップ <span id="current-step">1</span> / ${this.totalSteps}</span>
                        <span class="text-sm text-gray-600"><span id="progress-percent">20</span>%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="progress-bar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 20%"></div>
                    </div>
                </div>

                <!-- ステップコンテンツ -->
                <div id="step-content" class="mb-6">
                    <!-- 動的にコンテンツが挿入される -->
                </div>

                <!-- ナビゲーションボタン -->
                <div class="flex justify-between">
                    <button id="prev-step" 
                            class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 
                                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled>
                        <i class="fas fa-arrow-left mr-2"></i>
                        戻る
                    </button>
                    <button id="next-step" 
                            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        次へ
                        <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * モーダルイベントリスナーを設定
     */
    setupModalEventListeners() {
        const closeBtn = safeGetElement('#close-onboarding');
        const prevBtn = safeGetElement('#prev-step');
        const nextBtn = safeGetElement('#next-step');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeOnboarding());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        // モーダル外クリックでは閉じない（重要な設定のため）
    }

    /**
     * ステップコンテンツを更新
     */
    updateStepContent() {
        const stepContent = safeGetElement('#step-content');
        const currentStepEl = safeGetElement('#current-step');
        const progressBar = safeGetElement('#progress-bar');
        const progressPercent = safeGetElement('#progress-percent');
        const prevBtn = safeGetElement('#prev-step');
        const nextBtn = safeGetElement('#next-step');

        if (!stepContent) {return;}

        // プログレス更新
        const progress = ((this.currentStep + 1) / this.totalSteps) * 100;
        if (currentStepEl) {currentStepEl.textContent = this.currentStep + 1;}
        if (progressBar) {progressBar.style.width = `${progress}%`;}
        if (progressPercent) {progressPercent.textContent = Math.round(progress);}

        // ボタン状態更新
        if (prevBtn) {prevBtn.disabled = this.currentStep === 0;}
        if (nextBtn) {
            if (this.currentStep === this.totalSteps - 1) {
                nextBtn.innerHTML = '<i class="fas fa-check mr-2"></i>完了';
                nextBtn.className = nextBtn.className.replace('bg-blue-500 hover:bg-blue-600', 'bg-green-500 hover:bg-green-600');
            } else {
                nextBtn.innerHTML = '次へ <i class="fas fa-arrow-right ml-2"></i>';
                nextBtn.className = nextBtn.className.replace('bg-green-500 hover:bg-green-600', 'bg-blue-500 hover:bg-blue-600');
            }
        }

        // ステップコンテンツ更新
        stepContent.innerHTML = this.getStepContent(this.currentStep);
        this.setupStepEventListeners();
    }

    /**
     * ステップコンテンツを取得
     * @param {number} step - ステップ番号
     * @returns {string} ステップHTML
     */
    getStepContent(step) {
        const steps = [
            this.getWelcomeStep(),
            this.getBasicInfoStep(),
            this.getFitnessLevelStep(),
            this.getGoalsStep(),
            this.getScheduleStep()
        ];

        return steps[step] || '';
    }

    /**
     * ウェルカムステップ
     * @returns {string} ステップHTML
     */
    getWelcomeStep() {
        return `
            <div class="text-center">
                <div class="mb-6">
                    <i class="fas fa-dumbbell text-6xl text-blue-500 mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">
                        筋肉ローテーションマネージャーへようこそ！
                    </h3>
                    <p class="text-gray-600">
                        科学的根拠に基づいたトレーニング推奨システムで、<br>
                        効率的な筋力トレーニングをサポートします。
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <i class="fas fa-chart-line text-2xl text-blue-500 mb-2"></i>
                        <h4 class="font-semibold text-gray-800">科学的推奨</h4>
                        <p class="text-sm text-gray-600">筋肉の回復時間を考慮した最適な推奨</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <i class="fas fa-user-cog text-2xl text-green-500 mb-2"></i>
                        <h4 class="font-semibold text-gray-800">個人最適化</h4>
                        <p class="text-sm text-gray-600">あなたの体力レベルと目標に合わせた調整</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <i class="fas fa-mobile-alt text-2xl text-purple-500 mb-2"></i>
                        <h4 class="font-semibold text-gray-800">簡単記録</h4>
                        <p class="text-sm text-gray-600">ワンタップでトレーニングを記録</p>
                    </div>
                </div>

                <p class="text-sm text-gray-500">
                    まずは簡単な質問にお答えいただき、あなた専用の設定を作成しましょう。
                </p>
            </div>
        `;
    }

    /**
     * 基本情報ステップ
     * @returns {string} ステップHTML
     */
    getBasicInfoStep() {
        const data = this.onboardingData;
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-user text-blue-500 mr-2"></i>
                    基本情報
                </h3>
                <p class="text-gray-600 mb-6">
                    より正確な推奨のために、基本的な情報を教えてください。
                </p>

                <form id="basic-info-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="display-name" class="block text-sm font-medium text-gray-700 mb-2">
                                ニックネーム <span class="text-red-500">*</span>
                            </label>
                            <input type="text" 
                                   id="display-name" 
                                   name="display_name"
                                   value="${data.display_name || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="例: 太郎"
                                   required>
                        </div>
                        <div>
                            <label for="age" class="block text-sm font-medium text-gray-700 mb-2">
                                年齢 <span class="text-red-500">*</span>
                            </label>
                            <input type="number" 
                                   id="age" 
                                   name="age"
                                   value="${data.age || ''}"
                                   min="10" max="100"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="25"
                                   required>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="weight" class="block text-sm font-medium text-gray-700 mb-2">
                                体重 (kg)
                            </label>
                            <input type="number" 
                                   id="weight" 
                                   name="weight"
                                   value="${data.weight || ''}"
                                   step="0.1" min="30" max="200"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="70.0">
                        </div>
                        <div>
                            <label for="height" class="block text-sm font-medium text-gray-700 mb-2">
                                身長 (cm)
                            </label>
                            <input type="number" 
                                   id="height" 
                                   name="height"
                                   value="${data.height || ''}"
                                   step="0.1" min="100" max="250"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="170.0">
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * 体力レベルステップ
     * @returns {string} ステップHTML
     */
    getFitnessLevelStep() {
        const data = this.onboardingData;
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-dumbbell text-orange-500 mr-2"></i>
                    体力レベル
                </h3>
                <p class="text-gray-600 mb-6">
                    現在の体力レベルを教えてください。これにより回復時間が調整されます。
                </p>

                <form id="fitness-level-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            体力レベル <span class="text-red-500">*</span>
                        </label>
                        <div class="space-y-3">
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.fitness_level === 'beginner' ? 'border-blue-500 bg-blue-50' : ''}">
                                <input type="radio" 
                                       name="fitness_level" 
                                       value="beginner"
                                       ${data.fitness_level === 'beginner' ? 'checked' : ''}
                                       class="mt-1 text-blue-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">初心者</div>
                                    <div class="text-sm text-gray-600">
                                        トレーニング経験が少ない、または久しぶりに始める方
                                    </div>
                                </div>
                            </label>
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.fitness_level === 'intermediate' ? 'border-blue-500 bg-blue-50' : ''}">
                                <input type="radio" 
                                       name="fitness_level" 
                                       value="intermediate"
                                       ${data.fitness_level === 'intermediate' ? 'checked' : ''}
                                       class="mt-1 text-blue-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">中級者</div>
                                    <div class="text-sm text-gray-600">
                                        基本的なトレーニング経験があり、定期的に運動している方
                                    </div>
                                </div>
                            </label>
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.fitness_level === 'advanced' ? 'border-blue-500 bg-blue-50' : ''}">
                                <input type="radio" 
                                       name="fitness_level" 
                                       value="advanced"
                                       ${data.fitness_level === 'advanced' ? 'checked' : ''}
                                       class="mt-1 text-blue-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">上級者</div>
                                    <div class="text-sm text-gray-600">
                                        豊富なトレーニング経験があり、高強度の運動に慣れている方
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label for="experience-months" class="block text-sm font-medium text-gray-700 mb-2">
                            トレーニング経験（月数）
                        </label>
                        <input type="number" 
                               id="experience-months" 
                               name="experience_months"
                               value="${data.experience_months || 0}"
                               min="0" max="600"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="6">
                        <p class="text-xs text-gray-500 mt-1">
                            継続的にトレーニングを行った期間を月数で入力してください
                        </p>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * 目標ステップ
     * @returns {string} ステップHTML
     */
    getGoalsStep() {
        const data = this.onboardingData;
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-target text-red-500 mr-2"></i>
                    トレーニング目標
                </h3>
                <p class="text-gray-600 mb-6">
                    主な目標を選択してください。これにより最適なトレーニング強度が決まります。
                </p>

                <form id="goals-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            主要目標 <span class="text-red-500">*</span>
                        </label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.primary_goal === 'strength' ? 'border-red-500 bg-red-50' : ''}">
                                <input type="radio" 
                                       name="primary_goal" 
                                       value="strength"
                                       ${data.primary_goal === 'strength' ? 'checked' : ''}
                                       class="mt-1 text-red-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">筋力向上</div>
                                    <div class="text-sm text-gray-600">最大筋力を高める</div>
                                </div>
                            </label>
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.primary_goal === 'muscle_gain' ? 'border-red-500 bg-red-50' : ''}">
                                <input type="radio" 
                                       name="primary_goal" 
                                       value="muscle_gain"
                                       ${data.primary_goal === 'muscle_gain' ? 'checked' : ''}
                                       class="mt-1 text-red-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">筋肥大</div>
                                    <div class="text-sm text-gray-600">筋肉量を増やす</div>
                                </div>
                            </label>
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.primary_goal === 'endurance' ? 'border-red-500 bg-red-50' : ''}">
                                <input type="radio" 
                                       name="primary_goal" 
                                       value="endurance"
                                       ${data.primary_goal === 'endurance' ? 'checked' : ''}
                                       class="mt-1 text-red-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">持久力</div>
                                    <div class="text-sm text-gray-600">筋持久力を向上させる</div>
                                </div>
                            </label>
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.primary_goal === 'weight_loss' ? 'border-red-500 bg-red-50' : ''}">
                                <input type="radio" 
                                       name="primary_goal" 
                                       value="weight_loss"
                                       ${data.primary_goal === 'weight_loss' ? 'checked' : ''}
                                       class="mt-1 text-red-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">減量</div>
                                    <div class="text-sm text-gray-600">体脂肪を減らす</div>
                                </div>
                            </label>
                            <label class="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${data.primary_goal === 'general_fitness' ? 'border-red-500 bg-red-50' : ''}">
                                <input type="radio" 
                                       name="primary_goal" 
                                       value="general_fitness"
                                       ${data.primary_goal === 'general_fitness' ? 'checked' : ''}
                                       class="mt-1 text-red-500">
                                <div class="ml-3">
                                    <div class="font-medium text-gray-800">健康維持</div>
                                    <div class="text-sm text-gray-600">全般的な体力向上</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * スケジュールステップ
     * @returns {string} ステップHTML
     */
    getScheduleStep() {
        const data = this.onboardingData;
        return `
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-calendar-alt text-purple-500 mr-2"></i>
                    トレーニングスケジュール
                </h3>
                <p class="text-gray-600 mb-6">
                    あなたのライフスタイルに合わせたトレーニング計画を作成します。
                </p>

                <form id="schedule-form" class="space-y-6">
                    <div>
                        <label for="workout-frequency" class="block text-sm font-medium text-gray-700 mb-2">
                            週間トレーニング回数 <span class="text-red-500">*</span>
                        </label>
                        <select id="workout-frequency" 
                                name="workout_frequency"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required>
                            <option value="1" ${data.workout_frequency === 1 ? 'selected' : ''}>週1回</option>
                            <option value="2" ${data.workout_frequency === 2 ? 'selected' : ''}>週2回</option>
                            <option value="3" ${data.workout_frequency === 3 ? 'selected' : ''}>週3回（推奨）</option>
                            <option value="4" ${data.workout_frequency === 4 ? 'selected' : ''}>週4回</option>
                            <option value="5" ${data.workout_frequency === 5 ? 'selected' : ''}>週5回</option>
                            <option value="6" ${data.workout_frequency === 6 ? 'selected' : ''}>週6回</option>
                            <option value="7" ${data.workout_frequency === 7 ? 'selected' : ''}>毎日</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="preferred-time" class="block text-sm font-medium text-gray-700 mb-2">
                                希望トレーニング時間
                            </label>
                            <input type="time" 
                                   id="preferred-time" 
                                   name="preferred_workout_time"
                                   value="${data.preferred_workout_time || '18:00'}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label for="workout-duration" class="block text-sm font-medium text-gray-700 mb-2">
                                希望トレーニング時間（分）
                            </label>
                            <select id="workout-duration" 
                                    name="preferred_workout_duration"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="30" ${data.preferred_workout_duration === 30 ? 'selected' : ''}>30分</option>
                                <option value="45" ${data.preferred_workout_duration === 45 ? 'selected' : ''}>45分</option>
                                <option value="60" ${data.preferred_workout_duration === 60 ? 'selected' : ''}>60分（推奨）</option>
                                <option value="90" ${data.preferred_workout_duration === 90 ? 'selected' : ''}>90分</option>
                                <option value="120" ${data.preferred_workout_duration === 120 ? 'selected' : ''}>120分</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="sleep-hours" class="block text-sm font-medium text-gray-700 mb-2">
                                平均睡眠時間（時間）
                            </label>
                            <input type="number" 
                                   id="sleep-hours" 
                                   name="sleep_hours_per_night"
                                   value="${data.sleep_hours_per_night || 7.0}"
                                   step="0.5" min="4" max="12"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="7.0">
                        </div>
                        <div>
                            <label for="recovery-preference" class="block text-sm font-medium text-gray-700 mb-2">
                                回復速度
                            </label>
                            <select id="recovery-preference" 
                                    name="recovery_preference"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="fast" ${data.recovery_preference === 'fast' ? 'selected' : ''}>早い</option>
                                <option value="standard" ${data.recovery_preference === 'standard' ? 'selected' : ''}>標準</option>
                                <option value="slow" ${data.recovery_preference === 'slow' ? 'selected' : ''}>遅い</option>
                            </select>
                        </div>
                    </div>

                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-medium text-blue-800 mb-2">
                            <i class="fas fa-lightbulb mr-2"></i>
                            設定完了後の機能
                        </h4>
                        <ul class="text-sm text-blue-700 space-y-1">
                            <li>• あなたの設定に基づいた個別の推奨アルゴリズム</li>
                            <li>• 筋肉の回復状況を考慮したトレーニング提案</li>
                            <li>• 目標に応じた最適な強度とボリューム</li>
                            <li>• 継続的な進捗追跡とフィードバック</li>
                        </ul>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * ステップイベントリスナーを設定
     */
    setupStepEventListeners() {
        // ラジオボタンの選択時にスタイルを更新
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const name = e.target.name;
                document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
                    const label = radio.closest('label');
                    if (label) {
                        if (radio.checked) {
                            label.classList.add('border-blue-500', 'bg-blue-50');
                            label.classList.remove('border-gray-200');
                        } else {
                            label.classList.remove('border-blue-500', 'bg-blue-50');
                            label.classList.add('border-gray-200');
                        }
                    }
                });
            });
        });
    }

    /**
     * 次のステップへ進む
     */
    async nextStep() {
        // 現在のステップのデータを保存
        if (!await this.saveCurrentStepData()) {
            return; // バリデーションエラー
        }

        if (this.currentStep === this.totalSteps - 1) {
            // 最後のステップ - オンボーディング完了
            await this.completeOnboarding();
        } else {
            // 次のステップへ
            this.currentStep++;
            this.updateStepContent();
        }
    }

    /**
     * 前のステップに戻る
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepContent();
        }
    }

    /**
     * 現在のステップのデータを保存
     * @returns {Promise<boolean>} 保存成功かどうか
     */
    async saveCurrentStepData() {
        const forms = [
            null, // ウェルカムステップはフォームなし
            '#basic-info-form',
            '#fitness-level-form',
            '#goals-form',
            '#schedule-form'
        ];

        const formSelector = forms[this.currentStep];
        if (!formSelector) {return true;}

        const form = safeGetElement(formSelector);
        if (!form) {return true;}

        const formData = new FormData(form);
        const stepData = {};

        // フォームデータを取得
        for (const [key, value] of formData.entries()) {
            if (key === 'age' || key === 'experience_months' || key === 'workout_frequency' || key === 'preferred_workout_duration') {
                stepData[key] = parseInt(value) || 0;
            } else if (key === 'weight' || key === 'height' || key === 'sleep_hours_per_night') {
                stepData[key] = parseFloat(value) || null;
            } else {
                stepData[key] = value;
            }
        }

        // バリデーション
        if (this.currentStep === 1) { // 基本情報
            const errors = [];
            if (!stepData.display_name) {errors.push('ニックネーム');}
            if (!stepData.age) {errors.push('年齢');}

            if (errors.length > 0) {
                showNotification(`以下の項目を入力してください: ${errors.join(', ')}`, 'error');
                return false;
            }
        } else if (this.currentStep === 2) { // 体力レベル
            if (!stepData.fitness_level) {
                showNotification('体力レベルを選択してください', 'error');
                return false;
            }
        } else if (this.currentStep === 3) { // 目標
            if (!stepData.primary_goal) {
                showNotification('主要目標を選択してください', 'error');
                return false;
            }
        } else if (this.currentStep === 4) { // スケジュール
            if (!stepData.workout_frequency) {
                showNotification('週間トレーニング回数を選択してください', 'error');
                return false;
            }
        }

        // データを保存
        this.onboardingData = { ...this.onboardingData, ...stepData };
        return true;
    }

    /**
     * オンボーディングを完了
     */
    async completeOnboarding() {
        try {
            // オンボーディングデータを統合
            const profileData = {
                ...this.onboardingData,
                onboarding_completed: true,
                onboarding_step: this.totalSteps,
                onboarding_completed_at: new Date().toISOString()
            };

            // プロフィールを保存
            await this.saveProfile(profileData);

            // 推奨サービスの設定を更新
            recommendationService.updateUserSettings({
                fitnessLevel: profileData.fitness_level,
                primaryGoal: profileData.primary_goal,
                workoutFrequency: profileData.workout_frequency,
                recoveryPreference: profileData.recovery_preference,
                sleepHoursPerNight: profileData.sleep_hours_per_night
            });

            // 成功メッセージ
            showNotification('初期設定が完了しました！', 'success');

            // モーダルを閉じる
            this.closeOnboarding();

            // ダッシュボードを更新
            if (window.pageManager) {
                await window.pageManager.navigateToPage('dashboard');
            }

        } catch (error) {
            console.error('オンボーディング完了エラー:', error);
            showNotification('設定の保存に失敗しました', 'error');
        }
    }

    /**
     * プロフィールを保存
     * @param {Object} profileData - プロフィールデータ
     */
    async saveProfile(profileData) {
        // ローカルストレージに保存
        const existingProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const updatedProfile = { ...existingProfile, ...profileData };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        // Supabaseに保存（利用可能な場合）
        if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
            try {
                await supabaseService.saveUserProfile(profileData);
            } catch (error) {
                console.warn('Supabase profile save failed, using localStorage:', error);
            }
        }
    }

    /**
     * オンボーディングを閉じる
     */
    closeOnboarding() {
        const modal = safeGetElement('#onboarding-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }

    /**
     * オンボーディングをスキップ
     */
    skipOnboarding() {
        const profileData = {
            onboarding_completed: true,
            onboarding_step: 0, // スキップしたことを示す
            onboarding_completed_at: new Date().toISOString()
        };

        this.saveProfile(profileData);
        this.closeOnboarding();
        showNotification('初期設定をスキップしました。後で設定ページから変更できます。', 'info');
    }
}

// デフォルトエクスポート
export default new OnboardingManager();
