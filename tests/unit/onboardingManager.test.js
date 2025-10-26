// onboardingManager.test.js - OnboardingManagerクラスのテスト

import { OnboardingManager, onboardingManager } from '../../js/utils/onboardingManager.js';

// モックの設定
jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
}));

describe('OnboardingManager', () => {
  let manager;
  let mockShowNotification;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モジュールの取得
    const helpersModule = require('../../js/utils/helpers.js');
    mockShowNotification = helpersModule.showNotification;

    // OnboardingManagerのインスタンス作成
    manager = new OnboardingManager();

    // DOMをセットアップ
    document.body.innerHTML = `
      <div id="dashboard-link">Dashboard</div>
      <div id="workout-link">Workout</div>
      <div id="exercises-link">Exercises</div>
      <div id="analysis-link">Analysis</div>
      <div id="calendar-link">Calendar</div>
    `;

    // localStorageをクリア
    localStorage.clear();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(manager.storageKey).toBe('muscleRotationOnboarding');
      expect(manager.currentStep).toBe(0);
      expect(manager.steps).toHaveLength(6);
      expect(manager.isActive).toBe(false);
      expect(manager.overlay).toBeNull();
      expect(manager.tooltip).toBeNull();
    });
  });

  describe('hasCompletedOnboarding', () => {
    test('should return false when onboarding not completed', () => {
      const result = manager.hasCompletedOnboarding();
      expect(result).toBe(false);
    });

    test('should return true when onboarding completed', () => {
      localStorage.setItem('muscleRotationOnboarding_completed', 'true');
      const result = manager.hasCompletedOnboarding();
      expect(result).toBe(true);
    });

    test('should handle localStorage errors gracefully', () => {
      // localStorageを無効化
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const result = manager.hasCompletedOnboarding();
      expect(result).toBe(false);

      // localStorageを復元
      localStorage.getItem = originalGetItem;
    });
  });

  describe('startOnboarding', () => {
    test('should start onboarding for first-time users', () => {
      const createOverlaySpy = jest.spyOn(manager, 'createOverlay');
      const showStepSpy = jest.spyOn(manager, 'showStep');

      manager.startOnboarding();

      expect(manager.isActive).toBe(true);
      expect(manager.currentStep).toBe(0);
      expect(createOverlaySpy).toHaveBeenCalled();
      expect(showStepSpy).toHaveBeenCalledWith(0);
    });

    test('should not start onboarding for returning users', () => {
      localStorage.setItem('muscleRotationOnboarding_completed', 'true');
      
      const createOverlaySpy = jest.spyOn(manager, 'createOverlay');
      const showStepSpy = jest.spyOn(manager, 'showStep');

      manager.startOnboarding();

      expect(manager.isActive).toBe(false);
      expect(createOverlaySpy).not.toHaveBeenCalled();
      expect(showStepSpy).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', () => {
      // localStorageを無効化
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        manager.startOnboarding();
      }).not.toThrow();

      // localStorageを復元
      localStorage.getItem = originalGetItem;
    });
  });

  describe('createOverlay', () => {
    test('should create and append overlay to document', () => {
      manager.createOverlay();

      const overlay = document.getElementById('onboarding-overlay');
      expect(overlay).toBeDefined();
      expect(overlay.style.position).toBe('fixed');
      expect(overlay.style.zIndex).toBe('9999');
      expect(manager.overlay).toBe(overlay);
    });

    test('should remove existing overlay before creating new one', () => {
      // 最初のオーバーレイを作成
      manager.createOverlay();
      const firstOverlay = manager.overlay;

      // 2番目のオーバーレイを作成
      manager.createOverlay();
      const secondOverlay = manager.overlay;

      expect(firstOverlay).not.toBe(secondOverlay);
      expect(document.getElementById('onboarding-overlay')).toBe(secondOverlay);
    });
  });

  describe('showStep', () => {
    beforeEach(() => {
      manager.createOverlay();
    });

    test('should show step tooltip', () => {
      const createTooltipSpy = jest.spyOn(manager, 'createTooltip');
      const highlightTargetSpy = jest.spyOn(manager, 'highlightTarget');

      manager.showStep(0);

      expect(createTooltipSpy).toHaveBeenCalledWith(manager.steps[0]);
      expect(highlightTargetSpy).toHaveBeenCalledWith(manager.steps[0]);
    });

    test('should complete onboarding when all steps shown', () => {
      const completeOnboardingSpy = jest.spyOn(manager, 'completeOnboarding');
      
      manager.currentStep = manager.steps.length;
      manager.showStep(manager.steps.length);

      expect(completeOnboardingSpy).toHaveBeenCalled();
    });
  });

  describe('createTooltip', () => {
    test('should create tooltip with step information', () => {
      const step = manager.steps[0];
      manager.createTooltip(step);

      const tooltip = document.getElementById('onboarding-tooltip');
      expect(tooltip).toBeDefined();
      expect(tooltip.innerHTML).toContain(step.title);
      expect(tooltip.innerHTML).toContain(step.content);
      expect(manager.tooltip).toBe(tooltip);
    });

    test('should add event listeners to buttons', () => {
      const step = manager.steps[0];
      const nextStepSpy = jest.spyOn(manager, 'nextStep');
      
      manager.createTooltip(step);

      const nextBtn = document.getElementById('onboarding-next');
      expect(nextBtn).toBeDefined();
      
      nextBtn.click();
      expect(nextStepSpy).toHaveBeenCalled();
    });

    test('should show previous button for steps after first', () => {
      const step = manager.steps[1];
      manager.currentStep = 1;
      
      manager.createTooltip(step);

      const prevBtn = document.getElementById('onboarding-prev');
      expect(prevBtn).toBeDefined();
    });
  });

  describe('nextStep', () => {
    test('should move to next step', () => {
      manager.currentStep = 0;
      const showStepSpy = jest.spyOn(manager, 'showStep');
      const removeHighlightSpy = jest.spyOn(manager, 'removeHighlight');

      manager.nextStep();

      expect(manager.currentStep).toBe(1);
      expect(removeHighlightSpy).toHaveBeenCalled();
      expect(showStepSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('prevStep', () => {
    test('should move to previous step', () => {
      manager.currentStep = 1;
      const showStepSpy = jest.spyOn(manager, 'showStep');
      const removeHighlightSpy = jest.spyOn(manager, 'removeHighlight');

      manager.prevStep();

      expect(manager.currentStep).toBe(0);
      expect(removeHighlightSpy).toHaveBeenCalled();
      expect(showStepSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('completeOnboarding', () => {
    test('should complete onboarding and save to localStorage', () => {
      const removeOverlaySpy = jest.spyOn(manager, 'removeOverlay');
      const removeTooltipSpy = jest.spyOn(manager, 'removeTooltip');
      const removeHighlightSpy = jest.spyOn(manager, 'removeHighlight');

      manager.completeOnboarding();

      expect(localStorage.getItem('muscleRotationOnboarding_completed')).toBe('true');
      expect(localStorage.getItem('muscleRotationOnboarding_completedAt')).toBeDefined();
      expect(manager.isActive).toBe(false);
      expect(removeOverlaySpy).toHaveBeenCalled();
      expect(removeTooltipSpy).toHaveBeenCalled();
      expect(removeHighlightSpy).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith('オンボーディングが完了しました！', 'success');
    });

    test('should handle localStorage errors gracefully', () => {
      // localStorageを無効化
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        manager.completeOnboarding();
      }).not.toThrow();

      // localStorageを復元
      localStorage.setItem = originalSetItem;
    });
  });

  describe('resetOnboarding', () => {
    test('should remove onboarding completion data', () => {
      localStorage.setItem('muscleRotationOnboarding_completed', 'true');
      localStorage.setItem('muscleRotationOnboarding_completedAt', '2023-01-01');

      manager.resetOnboarding();

      expect(localStorage.getItem('muscleRotationOnboarding_completed')).toBeNull();
      expect(localStorage.getItem('muscleRotationOnboarding_completedAt')).toBeNull();
    });

    test('should handle localStorage errors gracefully', () => {
      // localStorageを無効化
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        manager.resetOnboarding();
      }).not.toThrow();

      // localStorageを復元
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('getOnboardingStatus', () => {
    test('should return correct status for new user', () => {
      const status = manager.getOnboardingStatus();

      expect(status.completed).toBe(false);
      expect(status.completedAt).toBeNull();
      expect(status.isActive).toBe(false);
      expect(status.currentStep).toBe(0);
      expect(status.totalSteps).toBe(6);
    });

    test('should return correct status for completed user', () => {
      const completedAt = new Date().toISOString();
      localStorage.setItem('muscleRotationOnboarding_completed', 'true');
      localStorage.setItem('muscleRotationOnboarding_completedAt', completedAt);

      const status = manager.getOnboardingStatus();

      expect(status.completed).toBe(true);
      expect(status.completedAt).toEqual(new Date(completedAt));
      expect(status.isActive).toBe(false);
      expect(status.currentStep).toBe(0);
      expect(status.totalSteps).toBe(6);
    });

    test('should handle localStorage errors gracefully', () => {
      // localStorageを無効化
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const status = manager.getOnboardingStatus();

      expect(status.completed).toBe(false);
      expect(status.completedAt).toBeNull();
      expect(status.isActive).toBe(false);
      expect(status.currentStep).toBe(0);
      expect(status.totalSteps).toBe(6);

      // localStorageを復元
      localStorage.getItem = originalGetItem;
    });
  });

  describe('singleton instance', () => {
    test('should export singleton instance', () => {
      expect(onboardingManager).toBeInstanceOf(OnboardingManager);
    });
  });
});
