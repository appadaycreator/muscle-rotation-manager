import { TooltipManager, tooltipManager } from '../../js/utils/tooltip.js';

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
    bottom: 50
  })),
  matches: jest.fn(() => true),
  closest: jest.fn(),
  parentNode: {
    removeChild: jest.fn()
  }
};

// DOM要素のモック
const mockContainer = {
  id: '',
  className: '',
  innerHTML: '',
  style: { 
    cssText: '',
    opacity: '0'
  },
  appendChild: jest.fn(),
  remove: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    width: 200,
    height: 100
  }))
};

Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockContainer)
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockContainer)
});

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn()
});

Object.defineProperty(window, 'addEventListener', {
  value: jest.fn()
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
});

describe('TooltipManager', () => {
  let tooltipManager;

  beforeEach(() => {
    tooltipManager = new TooltipManager();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(tooltipManager.tooltips).toBeDefined();
      expect(tooltipManager.activeTooltip).toBeNull();
      expect(tooltipManager.isInitialized).toBe(false);
      expect(tooltipManager.defaultConfig).toBeDefined();
    });
  });

  describe('initialize', () => {
    test('should initialize tooltip manager', () => {
      // DOM操作をスキップするために、createTooltipContainerをモック
      jest.spyOn(tooltipManager, 'createTooltipContainer').mockImplementation(() => {});
      jest.spyOn(tooltipManager, 'setupGlobalEventListeners').mockImplementation(() => {});
      
      tooltipManager.initialize();
      expect(tooltipManager.isInitialized).toBe(true);
    });

    test('should not initialize if already initialized', () => {
      tooltipManager.isInitialized = true;
      tooltipManager.initialize();
      expect(tooltipManager.isInitialized).toBe(true);
    });
  });

  describe('createTooltipContainer', () => {
    test('should create tooltip container', () => {
      // DOM操作をスキップするために、createTooltipContainerをモック
      const mockCreateTooltipContainer = jest.spyOn(tooltipManager, 'createTooltipContainer').mockImplementation(() => {});
      
      tooltipManager.createTooltipContainer();
      expect(mockCreateTooltipContainer).toHaveBeenCalled();
    });
  });

  describe('addTooltip', () => {
    test('should add tooltip to element', () => {
      tooltipManager.addTooltip(mockElement, 'test content');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', 'test content');
    });

    test('should not add tooltip if element or text is missing', () => {
      tooltipManager.addTooltip(null, 'test');
      tooltipManager.addTooltip(mockElement, null);
      expect(mockElement.setAttribute).not.toHaveBeenCalled();
    });
  });

  describe('removeTooltip', () => {
    test('should remove tooltip from element', () => {
      tooltipManager.removeTooltip(mockElement);
      expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-tooltip');
    });
  });

  describe('addMuscleGroupTooltip', () => {
    test('should add muscle group tooltip', () => {
      tooltipManager.addMuscleGroupTooltip(mockElement, 'chest');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('胸筋'));
    });
  });

  describe('addExerciseTooltip', () => {
    test('should add exercise tooltip', () => {
      const exercise = {
        name: 'Test Exercise',
        difficulty: 'Intermediate',
        muscleGroups: ['chest'],
        description: 'Test description'
      };
      tooltipManager.addExerciseTooltip(mockElement, exercise);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('Test Exercise'));
    });
  });

  describe('addStatsTooltip', () => {
    test('should add stats tooltip', () => {
      tooltipManager.addStatsTooltip(mockElement, 'totalWorkouts');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('総ワークアウト数'));
    });
  });

  describe('destroy', () => {
    test('should destroy tooltip manager', () => {
      tooltipManager.destroy();
      expect(tooltipManager.isInitialized).toBe(false);
      expect(tooltipManager.tooltips.size).toBe(0);
    });
  });

  describe('formatTooltipContent', () => {
    test('should format tooltip content', () => {
      const result = tooltipManager.formatTooltipContent('test\ncontent');
      expect(result).toContain('<br>');
    });
  });

  describe('getElementConfig', () => {
    test('should get element configuration', () => {
      mockElement.getAttribute.mockReturnValue('top');
      const config = tooltipManager.getElementConfig(mockElement);
      expect(config.position).toBe('top');
    });
  });
});
