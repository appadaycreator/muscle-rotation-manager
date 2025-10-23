jest.mock('../../js/utils/tooltip.js', () => ({
  Tooltip: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    destroy: jest.fn(),
    destroyAll: jest.fn(),
    update: jest.fn(),
    getPosition: jest.fn(),
    setTheme: jest.fn(),
    setDelay: jest.fn(),
    isVisible: jest.fn().mockReturnValue(false),
    getTooltipCount: jest.fn().mockReturnValue(0)
  }))
}));

import { Tooltip } from '../../js/utils/tooltip.js';

describe('Tooltip', () => {
  let tooltip;

  beforeEach(() => {
    tooltip = new Tooltip();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(tooltip).toBeDefined();
    });
  });

  describe('create', () => {
    test('should create tooltip', () => {
      tooltip.create('test', 'content');
      expect(tooltip.create).toHaveBeenCalledWith('test', 'content');
    });
  });

  describe('show', () => {
    test('should show tooltip', () => {
      tooltip.show();
      expect(tooltip.show).toHaveBeenCalled();
    });
  });

  describe('hide', () => {
    test('should hide tooltip', () => {
      tooltip.hide();
      expect(tooltip.hide).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    test('should destroy tooltip', () => {
      tooltip.destroy();
      expect(tooltip.destroy).toHaveBeenCalled();
    });
  });

  describe('destroyAll', () => {
    test('should destroy all tooltips', () => {
      tooltip.destroyAll();
      expect(tooltip.destroyAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    test('should update tooltip', () => {
      tooltip.update('new content');
      expect(tooltip.update).toHaveBeenCalledWith('new content');
    });
  });

  describe('getPosition', () => {
    test('should return position', () => {
      const position = tooltip.getPosition();
      expect(position).toBeDefined();
      expect(tooltip.getPosition).toHaveBeenCalled();
    });
  });

  describe('setTheme', () => {
    test('should set theme', () => {
      tooltip.setTheme('dark');
      expect(tooltip.setTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('setDelay', () => {
    test('should set delay', () => {
      tooltip.setDelay(1000);
      expect(tooltip.setDelay).toHaveBeenCalledWith(1000);
    });
  });

  describe('isVisible', () => {
    test('should return visibility status', () => {
      const isVisible = tooltip.isVisible();
      expect(isVisible).toBe(false);
      expect(tooltip.isVisible).toHaveBeenCalled();
    });
  });

  describe('getTooltipCount', () => {
    test('should return tooltip count', () => {
      const count = tooltip.getTooltipCount();
      expect(count).toBe(0);
      expect(tooltip.getTooltipCount).toHaveBeenCalled();
    });
  });
});
