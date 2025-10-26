// tests/unit/HelpPage.test.js - HelpPageのテスト

import { helpPage } from '../../js/pages/helpPage.js';

describe('HelpPage', () => {
  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(helpPage.isInitialized).toBe(false);
    });
  });

  describe('init', () => {
    it('should initialize successfully', async () => {
      const result = await helpPage.init();
      expect(result).toBeUndefined();
      expect(helpPage.isInitialized).toBe(true);
    });

    it('should not initialize if already initialized', async () => {
      helpPage.isInitialized = true;
      const result = await helpPage.init();
      expect(result).toBeUndefined();
    });
  });

  describe('setupTooltips', () => {
    it('should setup tooltips', () => {
      helpPage.setupTooltips();
      expect(helpPage.setupTooltips).toBeDefined();
    });
  });
});
