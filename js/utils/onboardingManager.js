// onboardingManager.js - オンボーディング管理ユーティリティ

import { showNotification } from './helpers.js';

/**
 * オンボーディング管理クラス
 * 初回ユーザー向けのガイド機能を提供
 */
export class OnboardingManager {
  constructor() {
    this.storageKey = 'muscleRotationOnboarding';
    this.currentStep = 0;
    this.steps = [
      {
        id: 'welcome',
        title: 'MuscleRotationManagerへようこそ！',
        content: 'このアプリで筋トレの記録と分析を効率的に行いましょう。',
        target: null,
        position: 'center'
      },
      {
        id: 'dashboard',
        title: 'ダッシュボード',
        content: 'ここで全体の進捗と統計を確認できます。',
        target: '#dashboard-link',
        position: 'bottom'
      },
      {
        id: 'workout',
        title: 'ワークアウト記録',
        content: '新しいワークアウトを記録して進捗を追跡しましょう。',
        target: '#workout-link',
        position: 'bottom'
      },
      {
        id: 'exercises',
        title: 'エクササイズデータベース',
        content: '豊富なエクササイズから選択して、カスタムエクササイズも追加できます。',
        target: '#exercises-link',
        position: 'bottom'
      },
      {
        id: 'analysis',
        title: '分析・レポート',
        content: '詳細な分析とレポートでトレーニングの効果を確認できます。',
        target: '#analysis-link',
        position: 'bottom'
      },
      {
        id: 'calendar',
        title: 'カレンダー',
        content: 'トレーニング履歴をカレンダー形式で確認できます。',
        target: '#calendar-link',
        position: 'bottom'
      }
    ];
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
  }

  /**
   * オンボーディングを開始
   */
  startOnboarding() {
    try {
      const hasCompleted = this.hasCompletedOnboarding();
      if (hasCompleted) {
        console.log('Onboarding already completed');
        return;
      }

      this.isActive = true;
      this.currentStep = 0;
      this.createOverlay();
      this.showStep(this.currentStep);
      
      console.log('Onboarding started');
    } catch (error) {
      console.error('Failed to start onboarding:', error);
    }
  }

  /**
   * オンボーディングが完了済みかチェック
   * @returns {boolean} 完了済みかどうか
   */
  hasCompletedOnboarding() {
    try {
      const completed = localStorage.getItem(`${this.storageKey}_completed`);
      return completed === 'true';
    } catch (error) {
      console.warn('Failed to check onboarding status:', error);
      return false;
    }
  }

  /**
   * オーバーレイを作成
   */
  createOverlay() {
    // 既存のオーバーレイを削除
    this.removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.id = 'onboarding-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(this.overlay);
  }

  /**
   * ステップを表示
   * @param {number} stepIndex - ステップインデックス
   */
  showStep(stepIndex) {
    if (stepIndex >= this.steps.length) {
      this.completeOnboarding();
      return;
    }

    const step = this.steps[stepIndex];
    this.createTooltip(step);
    this.highlightTarget(step);
  }

  /**
   * ツールチップを作成
   * @param {Object} step - ステップ情報
   */
  createTooltip(step) {
    // 既存のツールチップを削除
    this.removeTooltip();

    this.tooltip = document.createElement('div');
    this.tooltip.id = 'onboarding-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    this.tooltip.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
          ${step.title}
        </h3>
        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
          ${step.content}
        </p>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #9ca3af; font-size: 12px;">
          ${this.currentStep + 1} / ${this.steps.length}
        </div>
        <div>
          ${this.currentStep > 0 ? `
            <button id="onboarding-prev" style="
              background: #f3f4f6;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              margin-right: 8px;
              cursor: pointer;
              font-size: 14px;
            ">前へ</button>
          ` : ''}
          <button id="onboarding-next" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">${this.currentStep === this.steps.length - 1 ? '完了' : '次へ'}</button>
        </div>
      </div>
    `;

    // イベントリスナーを追加
    const nextBtn = this.tooltip.querySelector('#onboarding-next');
    const prevBtn = this.tooltip.querySelector('#onboarding-prev');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }

    document.body.appendChild(this.tooltip);
    this.positionTooltip(step);
  }

  /**
   * ツールチップを配置
   * @param {Object} step - ステップ情報
   */
  positionTooltip(step) {
    if (!this.tooltip) return;

    if (step.target) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        let top, left;

        switch (step.position) {
          case 'top':
            top = rect.top - tooltipRect.height - 10;
            left = rect.left + (rect.width - tooltipRect.width) / 2;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + (rect.width - tooltipRect.width) / 2;
            break;
          case 'left':
            top = rect.top + (rect.height - tooltipRect.height) / 2;
            left = rect.left - tooltipRect.width - 10;
            break;
          case 'right':
            top = rect.top + (rect.height - tooltipRect.height) / 2;
            left = rect.right + 10;
            break;
          default:
            top = rect.bottom + 10;
            left = rect.left + (rect.width - tooltipRect.width) / 2;
        }

        // 画面外に出ないように調整
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
      }
    } else {
      // 中央配置
      this.tooltip.style.top = '50%';
      this.tooltip.style.left = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
    }
  }

  /**
   * ターゲット要素をハイライト
   * @param {Object} step - ステップ情報
   */
  highlightTarget(step) {
    if (!step.target) return;

    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      targetElement.style.position = 'relative';
      targetElement.style.zIndex = '10001';
      targetElement.style.outline = '2px solid #3b82f6';
      targetElement.style.outlineOffset = '2px';
      targetElement.style.borderRadius = '4px';
    }
  }

  /**
   * ハイライトを削除
   */
  removeHighlight() {
    const highlightedElements = document.querySelectorAll('[style*="outline: 2px solid #3b82f6"]');
    highlightedElements.forEach(element => {
      element.style.outline = '';
      element.style.outlineOffset = '';
      element.style.borderRadius = '';
      element.style.zIndex = '';
    });
  }

  /**
   * 次のステップへ
   */
  nextStep() {
    this.removeHighlight();
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  /**
   * 前のステップへ
   */
  prevStep() {
    this.removeHighlight();
    this.currentStep--;
    this.showStep(this.currentStep);
  }

  /**
   * オンボーディングをスキップ
   */
  skipOnboarding() {
    this.completeOnboarding();
    showNotification('オンボーディングをスキップしました', 'info');
  }

  /**
   * オンボーディングを完了
   */
  completeOnboarding() {
    try {
      localStorage.setItem(`${this.storageKey}_completed`, 'true');
      localStorage.setItem(`${this.storageKey}_completedAt`, new Date().toISOString());
      
      this.removeOverlay();
      this.removeTooltip();
      this.removeHighlight();
      
      this.isActive = false;
      
      showNotification('オンボーディングが完了しました！', 'success');
      console.log('Onboarding completed');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }

  /**
   * オーバーレイを削除
   */
  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * ツールチップを削除
   */
  removeTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  /**
   * オンボーディングをリセット
   */
  resetOnboarding() {
    try {
      localStorage.removeItem(`${this.storageKey}_completed`);
      localStorage.removeItem(`${this.storageKey}_completedAt`);
      console.log('Onboarding reset');
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }

  /**
   * オンボーディング状態を取得
   * @returns {Object} オンボーディング状態
   */
  getOnboardingStatus() {
    try {
      const completed = this.hasCompletedOnboarding();
      const completedAt = localStorage.getItem(`${this.storageKey}_completedAt`);
      
      return {
        completed,
        completedAt: completedAt ? new Date(completedAt) : null,
        isActive: this.isActive,
        currentStep: this.currentStep,
        totalSteps: this.steps.length
      };
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return {
        completed: false,
        completedAt: null,
        isActive: false,
        currentStep: 0,
        totalSteps: this.steps.length
      };
    }
  }
}

// シングルトンインスタンスをエクスポート
export const onboardingManager = new OnboardingManager();
