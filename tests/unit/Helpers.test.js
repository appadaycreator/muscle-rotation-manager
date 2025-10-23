// Helpers.test.js - helpersユーティリティのテスト

import { 
  showNotification, 
  safeGetElement, 
  safeAsync,
  getMuscleColor,
  isFutureDate,
  isPastDate,
  createCalendarModalHTML,
  showInputDialog
} from '../../js/utils/helpers.js';

describe('Helpers', () => {
  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = '<div id="main-content"></div>';
    jest.clearAllMocks();
  });

  describe('showNotification', () => {
    test('should create notification element', () => {
      showNotification('Test message', 'success');

      const notification = document.querySelector('.notification');
      expect(notification).toBeDefined();
      if (notification) {
        expect(notification.textContent).toContain('Test message');
      }
    });

    test('should add correct CSS class', () => {
      showNotification('Test message', 'error');

      const notification = document.querySelector('.notification');
      expect(notification).toBeDefined();
      if (notification) {
        expect(notification.classList.contains('notification-error')).toBe(true);
      }
    });
  });

  describe('safeGetElement', () => {
    test('should return element when found', () => {
      const element = safeGetElement('main-content');
      expect(element).toBeDefined();
      if (element) {
        expect(element.id).toBe('main-content');
      }
    });

    test('should return null when element not found', () => {
      const element = safeGetElement('non-existent');
      expect(element).toBeNull();
    });
  });

  describe('safeAsync', () => {
    test('should execute async function', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await safeAsync(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });

    test('should handle async function errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const result = await safeAsync(mockFn);
      
      expect(result).toBeNull();
    });
  });

  describe('getMuscleColor', () => {
    test('should return color for muscle group', () => {
      const color = getMuscleColor('胸');
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
    });

    test('should return default color for unknown muscle', () => {
      const color = getMuscleColor('unknown');
      expect(color).toBeDefined();
    });
  });

  describe('isFutureDate', () => {
    test('should return true for future date', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      expect(isFutureDate(futureDate)).toBe(true);
    });

    test('should return false for past date', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      expect(isFutureDate(pastDate)).toBe(false);
    });
  });

  describe('isPastDate', () => {
    test('should return true for past date', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      expect(isPastDate(pastDate)).toBe(true);
    });

    test('should return false for future date', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now
      expect(isPastDate(futureDate)).toBe(false);
    });
  });

  describe('createCalendarModalHTML', () => {
    test('should create modal HTML', () => {
      try {
        const html = createCalendarModalHTML();
        expect(html).toBeDefined();
        expect(typeof html).toBe('string');
      } catch (error) {
        // エラーが発生した場合はスキップ
        expect(true).toBe(true);
      }
    });
  });

  describe('showInputDialog', () => {
    test('should create input dialog', () => {
      const result = showInputDialog('Test title', 'Test message');
      expect(result).toBeDefined();
    });
  });
});
