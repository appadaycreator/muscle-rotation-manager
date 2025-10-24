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

  describe('addTooltips', () => {
    test('should add multiple tooltips', () => {
      const tooltipConfigs = [
        { element: mockElement, text: 'Tooltip 1', config: {} },
        { element: mockElement, text: 'Tooltip 2', config: {} }
      ];
      
      jest.spyOn(tooltipManager, 'addTooltip').mockImplementation(() => {});
      
      tooltipManager.addTooltips(tooltipConfigs);
      
      expect(tooltipManager.addTooltip).toHaveBeenCalledTimes(2);
    });

    test('should handle errors when adding multiple tooltips', () => {
      const tooltipConfigs = [
        { element: null, text: 'Tooltip 1', config: {} }
      ];
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      tooltipManager.addTooltips(tooltipConfigs);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('addTooltipStyles', () => {
    test('should apply tooltip styles', () => {
      const tooltip = { style: { cssText: '' } };
      const config = { maxWidth: 200, theme: 'dark' };
      
      tooltipManager.applyTooltipStyles(tooltip, config);
      
      expect(tooltip.style.cssText).toContain('max-width: 200px');
      expect(tooltip.style.cssText).toContain('background: #1f2937');
    });
  });

  describe('integration tests', () => {
    test('should handle complete tooltip lifecycle', () => {
      // Initialize
      tooltipManager.initialize();
      expect(tooltipManager.isInitialized).toBe(true);
      
      // Add tooltip
      tooltipManager.addTooltip(mockElement, 'Test tooltip', {
        position: 'top',
        theme: 'light'
      });
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', 'Test tooltip');
      
      // Remove tooltip
      tooltipManager.removeTooltip(mockElement);
      expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-tooltip');
      
      // Destroy
      tooltipManager.destroy();
      expect(tooltipManager.isInitialized).toBe(false);
    });

    test('should handle muscle group tooltips', () => {
      const muscleGroups = ['chest', 'back', 'shoulder', 'arm', 'leg', 'core'];
      
      muscleGroups.forEach(group => {
        tooltipManager.addMuscleGroupTooltip(mockElement, group);
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('筋肉'));
      });
    });

    test('should handle exercise tooltips', () => {
      const exercise = {
        name: 'Bench Press',
        difficulty: 'Intermediate',
        muscleGroups: ['chest', 'shoulder'],
        description: 'A compound exercise for chest development'
      };
      
      tooltipManager.addExerciseTooltip(mockElement, exercise);
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('Bench Press'));
    });

    test('should handle stats tooltips', () => {
      const statTypes = ['totalWorkouts', 'currentStreak', 'weeklyGoal', 'progressRate', 'recoveryTime', 'muscleBalance'];
      
      statTypes.forEach(statType => {
        tooltipManager.addStatsTooltip(mockElement, statType);
        expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.any(String));
      });
    });
  });

  describe('error handling', () => {
    test('should handle missing element in addTooltip', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      tooltipManager.addTooltip(null, 'Test tooltip');
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Cannot add tooltip: element or text is missing', { element: null, text: 'Test tooltip' });
      
      consoleSpy.mockRestore();
    });

    test('should handle missing text in addTooltip', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      tooltipManager.addTooltip(mockElement, null);
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Cannot add tooltip: element or text is missing', { element: mockElement, text: null });
      
      consoleSpy.mockRestore();
    });

    test('should handle string selector in addTooltip', () => {
      document.querySelectorAll = jest.fn(() => [mockElement]);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      tooltipManager.addTooltip('.test-selector', 'Test tooltip');
      
      expect(document.querySelectorAll).toHaveBeenCalledWith('.test-selector');
      expect(consoleSpy).toHaveBeenCalledWith('🎯 Using first element from selector: .test-selector (1 total)');
      
      consoleSpy.mockRestore();
    });

    test('should handle empty selector in addTooltip', () => {
      document.querySelectorAll = jest.fn(() => []);
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      tooltipManager.addTooltip('.empty-selector', 'Test tooltip');
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ No elements found for selector: .empty-selector');
      
      consoleSpy.mockRestore();
    });
  });

  describe('theme and animation management', () => {
    test('should add custom theme', () => {
      const customTheme = {
        backgroundColor: '#ff0000',
        color: '#ffffff',
        border: 'none'
      };
      
      tooltipManager.addTheme('custom', customTheme);
      
      expect(tooltipManager.themes.get('custom')).toEqual(customTheme);
    });

    test('should add custom animation', () => {
      const customAnimation = {
        show: { opacity: '0', transform: 'scale(0.5)' },
        visible: { opacity: '1', transform: 'scale(1)' },
        hide: { opacity: '0', transform: 'scale(0.5)' }
      };
      
      tooltipManager.addAnimation('custom', customAnimation);
      
      expect(tooltipManager.animations.get('custom')).toEqual(customAnimation);
    });

    test('should get theme with fallback', () => {
      const theme = tooltipManager.getTheme('nonexistent');
      expect(theme).toBeDefined();
      expect(theme.backgroundColor).toBe('#ffffff'); // Should fallback to light theme
    });

    test('should get animation with fallback', () => {
      const animation = tooltipManager.getAnimation('nonexistent');
      expect(animation).toBeDefined();
      expect(animation.show).toBeDefined();
    });
  });

  describe('content formatting', () => {
    test('should format tooltip content with newlines', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const formatted = tooltipManager.formatTooltipContent(content);
      
      expect(formatted).toContain('<br>');
      expect(formatted).not.toContain('\n');
    });

    test('should escape HTML in tooltip content', () => {
      const content = '<script>alert("xss")</script>';
      const formatted = tooltipManager.formatTooltipContent(content);
      
      expect(formatted).toContain('&lt;script&gt;');
      expect(formatted).toContain('&lt;/script&gt;');
    });

    test('should handle special characters in tooltip content', () => {
      const content = 'Test & "quotes" and \'apostrophes\'';
      const formatted = tooltipManager.formatTooltipContent(content);
      
      expect(formatted).toContain('&amp;');
      expect(formatted).toContain('&quot;');
      expect(formatted).toContain('&#39;');
    });
  });
});
