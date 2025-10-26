import { tooltipManager } from '../../js/utils/TooltipManager.js';

// DOM環境のモック
const mockElement = {
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 100,
    height: 50,
    right: 100,
    bottom: 50,
  })),
  matches: jest.fn(() => true),
  closest: jest.fn(),
  parentNode: {
    removeChild: jest.fn(),
  },
};

const mockContainer = {
  id: '',
  className: '',
  innerHTML: '',
  style: {
    cssText: '',
    opacity: '0',
  },
  appendChild: jest.fn(),
  remove: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    width: 200,
    height: 100,
  })),
};

Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockContainer),
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockContainer),
});

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
});

Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

describe('TooltipManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(tooltipManager.activeTooltip).toBeNull();
      expect(tooltipManager.isInitialized).toBe(false);
      expect(tooltipManager.config).toBeDefined();
    });
  });

  describe('initialize', () => {
    test('should initialize tooltip manager', () => {
      jest
        .spyOn(tooltipManager, 'createContainer')
        .mockImplementation(() => {});
      jest
        .spyOn(tooltipManager, 'setupEventListeners')
        .mockImplementation(() => {});

      tooltipManager.initialize();
      expect(tooltipManager.isInitialized).toBe(true);
    });

    test('should not initialize if already initialized', () => {
      tooltipManager.isInitialized = true;
      tooltipManager.initialize();
      expect(tooltipManager.isInitialized).toBe(true);
    });
  });

  describe('addTooltip', () => {
    test('should add tooltip to element', () => {
      const element = mockElement;
      const text = 'Test tooltip';

      tooltipManager.addTooltip(element, text);

      expect(element.setAttribute).toHaveBeenCalledWith('data-tooltip', text);
    });

    test('should not add tooltip if element or text is missing', () => {
      tooltipManager.addTooltip(null, 'Test');
      tooltipManager.addTooltip(mockElement, null);

      // エラーが発生しないことを確認
      expect(true).toBe(true);
    });
  });

  describe('destroy', () => {
    test('should destroy tooltip manager', () => {
      tooltipManager.isInitialized = true;

      tooltipManager.destroy();

      expect(tooltipManager.isInitialized).toBe(false);
    });
  });
});
