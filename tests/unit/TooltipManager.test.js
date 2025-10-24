// TooltipManager.test.js - ツールチップマネージャーのテスト

import { TooltipManager } from '../../js/utils/tooltip.js';

// DOM環境のモック
const mockElement = {
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    hasAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    closest: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    matches: jest.fn(),
    style: {},
    id: '',
    className: '',
    parentNode: {
        removeChild: jest.fn()
    }
};

// document のモック
Object.defineProperty(document, 'getElementById', {
    value: jest.fn(() => mockElement),
    writable: true
});

Object.defineProperty(document, 'createElement', {
    value: jest.fn(() => ({
        ...mockElement,
        id: '',
        className: '',
        style: { cssText: '' }
    })),
    writable: true
});

Object.defineProperty(document, 'addEventListener', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document.body, 'appendChild', {
    value: jest.fn(),
    writable: true
});

describe('TooltipManager', () => {
    let tooltipManager;

    beforeEach(() => {
        tooltipManager = new TooltipManager();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(tooltipManager.tooltips).toBeInstanceOf(Map);
            expect(tooltipManager.activeTooltip).toBeNull();
            expect(tooltipManager.isInitialized).toBe(false);
            expect(tooltipManager.themes).toBeInstanceOf(Map);
            expect(tooltipManager.animations).toBeInstanceOf(Map);
        });

        test('should have default configuration', () => {
            expect(tooltipManager.defaultConfig).toEqual({
                position: 'top',
                delay: 300,
                maxWidth: 300,
                theme: 'light',
                animation: true,
                arrow: true,
                interactive: false,
                trigger: 'hover',
                hideOnScroll: true,
                hideOnResize: true,
                accessibility: true
            });
        });
    });

    describe('setupDefaultThemes', () => {
        test('should setup default themes', () => {
            expect(tooltipManager.themes.has('light')).toBe(true);
            expect(tooltipManager.themes.has('dark')).toBe(true);
            expect(tooltipManager.themes.has('primary')).toBe(true);
            expect(tooltipManager.themes.has('success')).toBe(true);
            expect(tooltipManager.themes.has('warning')).toBe(true);
            expect(tooltipManager.themes.has('error')).toBe(true);
        });

        test('should have correct light theme properties', () => {
            const lightTheme = tooltipManager.themes.get('light');
            expect(lightTheme.backgroundColor).toBe('#ffffff');
            expect(lightTheme.color).toBe('#333333');
            expect(lightTheme.border).toBe('1px solid #e0e0e0');
        });

        test('should have correct dark theme properties', () => {
            const darkTheme = tooltipManager.themes.get('dark');
            expect(darkTheme.backgroundColor).toBe('#2d3748');
            expect(darkTheme.color).toBe('#ffffff');
            expect(darkTheme.border).toBe('1px solid #4a5568');
        });
    });

    describe('setupDefaultAnimations', () => {
        test('should setup default animations', () => {
            expect(tooltipManager.animations.has('fadeIn')).toBe(true);
            expect(tooltipManager.animations.has('slide')).toBe(true);
            expect(tooltipManager.animations.has('scale')).toBe(true);
            expect(tooltipManager.animations.has('bounce')).toBe(true);
        });

        test('should have correct fadeIn animation properties', () => {
            const fadeInAnimation = tooltipManager.animations.get('fadeIn');
            expect(fadeInAnimation.show.opacity).toBe('0');
            expect(fadeInAnimation.visible.opacity).toBe('1');
            expect(fadeInAnimation.hide.opacity).toBe('0');
        });
    });

    describe('addTheme', () => {
        test('should add custom theme', () => {
            const customTheme = {
                backgroundColor: '#ff0000',
                color: '#ffffff',
                border: 'none'
            };
            
            tooltipManager.addTheme('custom', customTheme);
            expect(tooltipManager.themes.get('custom')).toEqual(customTheme);
        });
    });

    describe('addAnimation', () => {
        test('should add custom animation', () => {
            const customAnimation = {
                show: { opacity: '0' },
                visible: { opacity: '1' },
                hide: { opacity: '0' }
            };
            
            tooltipManager.addAnimation('custom', customAnimation);
            expect(tooltipManager.animations.get('custom')).toEqual(customAnimation);
        });
    });

    describe('getTheme', () => {
        test('should return theme if exists', () => {
            const theme = tooltipManager.getTheme('light');
            expect(theme).toBeDefined();
            expect(theme.backgroundColor).toBe('#ffffff');
        });

        test('should return light theme as fallback', () => {
            const theme = tooltipManager.getTheme('nonexistent');
            expect(theme).toBeDefined();
            expect(theme.backgroundColor).toBe('#ffffff');
        });
    });

    describe('getAnimation', () => {
        test('should return animation if exists', () => {
            const animation = tooltipManager.getAnimation('fadeIn');
            expect(animation).toBeDefined();
            expect(animation.show).toBeDefined();
            expect(animation.visible).toBeDefined();
            expect(animation.hide).toBeDefined();
        });

        test('should return fadeIn animation as fallback', () => {
            const animation = tooltipManager.getAnimation('nonexistent');
            expect(animation).toBeDefined();
            expect(animation.show).toBeDefined();
        });
    });

    describe('initialize', () => {
        test('should initialize tooltip manager', () => {
            // モックを設定
            const mockContainer = {
                id: '',
                className: '',
                style: { cssText: '' }
            };
            
            document.createElement = jest.fn(() => mockContainer);
            document.body.appendChild = jest.fn();
            
            tooltipManager.initialize();
            expect(tooltipManager.isInitialized).toBe(true);
        });

        test('should not initialize if already initialized', () => {
            tooltipManager.isInitialized = true;
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            tooltipManager.initialize();
            
            expect(consoleSpy).not.toHaveBeenCalledWith('🔄 Initializing tooltip manager...');
            consoleSpy.mockRestore();
        });
    });

    describe('addTooltip', () => {
        test('should add tooltip configuration', () => {
            const element = {
                setAttribute: jest.fn(),
                getAttribute: jest.fn((attr) => {
                    const attrs = {
                        'data-tooltip': 'Test tooltip',
                        'data-tooltip-position': 'top',
                        'data-tooltip-theme': 'light'
                    };
                    return attrs[attr] || null;
                })
            };
            const text = 'Test tooltip';
            const config = {
                position: 'top',
                theme: 'light'
            };
            
            tooltipManager.addTooltip(element, text, config);
            expect(element.setAttribute).toHaveBeenCalledWith('data-tooltip', text);
            expect(element.setAttribute).toHaveBeenCalledWith('data-tooltip-position', 'top');
            expect(element.setAttribute).toHaveBeenCalledWith('data-tooltip-theme', 'light');
        });
    });

    describe('removeTooltip', () => {
        test('should remove tooltip configuration', () => {
            const element = {
                removeAttribute: jest.fn()
            };
            
            tooltipManager.removeTooltip(element);
            expect(element.removeAttribute).toHaveBeenCalledWith('data-tooltip');
        });
    });

    describe('getElementConfig', () => {
        test('should return default config for element without data attributes', () => {
            const element = {
                getAttribute: jest.fn(() => null),
                hasAttribute: jest.fn(() => false)
            };
            
            const config = tooltipManager.getElementConfig(element);
            expect(config).toEqual(tooltipManager.defaultConfig);
        });

        test('should return custom config for element with data attributes', () => {
            const element = {
                getAttribute: jest.fn((attr) => {
                    const attrs = {
                        'data-tooltip-position': 'bottom',
                        'data-tooltip-theme': 'dark',
                        'data-tooltip-delay': '500'
                    };
                    return attrs[attr] || null;
                }),
                hasAttribute: jest.fn(() => true)
            };
            
            const config = tooltipManager.getElementConfig(element);
            expect(config.position).toBe('bottom');
            expect(config.theme).toBe('dark');
            expect(config.delay).toBe(500);
        });
    });

    describe('formatTooltipContent', () => {
        test('should format simple text content', () => {
            const content = 'Simple text';
            const formatted = tooltipManager.formatTooltipContent(content);
            expect(formatted).toBe('Simple text');
        });

        test('should format HTML content', () => {
            const content = '<strong>Bold text</strong>';
            const formatted = tooltipManager.formatTooltipContent(content);
            expect(formatted).toBe('&lt;strong&gt;Bold text&lt;/strong&gt;');
        });
    });

    describe('isElementHovered', () => {
        test('should return true for hovered element', () => {
            const element = {
                matches: jest.fn(() => true)
            };
            
            const isHovered = tooltipManager.isElementHovered(element);
            expect(isHovered).toBe(true);
        });

        test('should return false for not hovered element', () => {
            const element = {
                matches: jest.fn(() => false)
            };
            
            const isHovered = tooltipManager.isElementHovered(element);
            expect(isHovered).toBe(false);
        });
    });

    describe('destroy', () => {
        test('should destroy tooltip manager', () => {
            tooltipManager.isInitialized = true;
            tooltipManager.activeTooltip = mockElement;
            tooltipManager.tooltips.set('test', {});
            
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            tooltipManager.destroy();
            
            expect(tooltipManager.isInitialized).toBe(false);
            expect(tooltipManager.tooltips.size).toBe(0);
            expect(consoleSpy).toHaveBeenCalledWith('🗑️ Tooltip manager destroyed');
            
            consoleSpy.mockRestore();
        });
    });

    describe('createTooltipContainer', () => {
        test('should create tooltip container', () => {
            const mockContainer = {
                id: '',
                className: '',
                style: { cssText: '' },
                remove: jest.fn()
            };
            
            document.getElementById = jest.fn(() => mockContainer);
            document.createElement = jest.fn(() => mockContainer);
            document.body.appendChild = jest.fn();
            
            tooltipManager.createTooltipContainer();
            
            expect(document.getElementById).toHaveBeenCalledWith('tooltip-container');
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalledWith(mockContainer);
        });

        test('should remove existing container before creating new one', () => {
            const existingContainer = {
                id: 'tooltip-container',
                remove: jest.fn()
            };
            
            const newContainer = {
                id: '',
                className: '',
                style: { cssText: '' }
            };
            
            document.getElementById = jest.fn(() => existingContainer);
            document.createElement = jest.fn(() => newContainer);
            document.body.appendChild = jest.fn();
            
            tooltipManager.createTooltipContainer();
            
            expect(existingContainer.remove).toHaveBeenCalled();
        });
    });

    describe('setupGlobalEventListeners', () => {
        test('should setup global event listeners', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
            const windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
            
            tooltipManager.setupGlobalEventListeners();
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('mouseover', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('mouseout', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(windowAddEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        });
    });

    describe('showTooltip', () => {
        test('should show tooltip with delay', () => {
            const element = {
                getAttribute: jest.fn(() => 'Test tooltip'),
                matches: jest.fn(() => true)
            };
            
            const event = { clientX: 100, clientY: 100 };
            
            jest.spyOn(tooltipManager, 'createTooltip').mockImplementation(() => {});
            jest.spyOn(tooltipManager, 'isElementHovered').mockReturnValue(true);
            
            tooltipManager.showTooltip(element, event);
            
            expect(element.getAttribute).toHaveBeenCalledWith('data-tooltip');
        });

        test('should not show tooltip if no text', () => {
            const element = {
                getAttribute: jest.fn(() => null)
            };
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            tooltipManager.showTooltip(element, {});
            
            expect(consoleSpy).toHaveBeenCalledWith('⚠️ No tooltip text found for element:', element);
            
            consoleSpy.mockRestore();
        });
    });

    describe('createTooltip', () => {
        test('should create tooltip element', () => {
            const mockContainer = {
                id: 'tooltip-container',
                appendChild: jest.fn()
            };
            
            const mockTooltip = {
                className: '',
                innerHTML: '',
                style: {},
                getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 }))
            };
            
            document.getElementById = jest.fn(() => mockContainer);
            document.createElement = jest.fn(() => mockTooltip);
            
            jest.spyOn(tooltipManager, 'applyTooltipTheme').mockImplementation(() => {});
            jest.spyOn(tooltipManager, 'applyTooltipAnimation').mockImplementation(() => {});
            jest.spyOn(tooltipManager, 'positionTooltip').mockImplementation(() => {});
            jest.spyOn(tooltipManager, 'showTooltipWithAnimation').mockImplementation(() => {});
            
            tooltipManager.createTooltip('Test content', { theme: 'light' }, { clientX: 100, clientY: 100 });
            
            expect(document.getElementById).toHaveBeenCalledWith('tooltip-container');
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(mockContainer.appendChild).toHaveBeenCalledWith(mockTooltip);
        });

        test('should not create tooltip if container not found', () => {
            document.getElementById = jest.fn(() => null);
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            tooltipManager.createTooltip('Test content', {}, {});
            
            expect(consoleSpy).toHaveBeenCalledWith('❌ Tooltip container not found');
            
            consoleSpy.mockRestore();
        });
    });

    describe('applyTooltipTheme', () => {
        test('should apply theme to tooltip', () => {
            const tooltip = {
                style: {},
                appendChild: jest.fn()
            };
            
            const config = { theme: 'light', arrow: true };
            
            jest.spyOn(tooltipManager, 'addTooltipArrow').mockImplementation(() => {});
            
            tooltipManager.applyTooltipTheme(tooltip, config);
            
            expect(tooltip.style.position).toBe('absolute');
            expect(tooltip.style.maxWidth).toBe('300px');
        });
    });

    describe('applyTooltipAnimation', () => {
        test('should apply animation to tooltip', () => {
            const tooltip = { style: {} };
            const config = { animation: 'fadeIn' };
            
            tooltipManager.applyTooltipAnimation(tooltip, config);
            
            expect(tooltip.style.opacity).toBe('0');
        });

        test('should not apply animation if disabled', () => {
            const tooltip = { style: {} };
            const config = { animation: false };
            
            tooltipManager.applyTooltipAnimation(tooltip, config);
            
            expect(tooltip.style.opacity).toBeUndefined();
        });
    });

    describe('showTooltipWithAnimation', () => {
        test('should show tooltip with animation', () => {
            const tooltip = { style: {} };
            const config = { animation: 'fadeIn' };
            
            global.requestAnimationFrame = jest.fn((callback) => callback());
            
            tooltipManager.showTooltipWithAnimation(tooltip, config);
            
            expect(global.requestAnimationFrame).toHaveBeenCalled();
        });

        test('should show tooltip without animation', () => {
            const tooltip = { style: {} };
            const config = { animation: false };
            
            tooltipManager.showTooltipWithAnimation(tooltip, config);
            
            expect(tooltip.style.opacity).toBe('1');
        });
    });

    describe('addTooltipArrow', () => {
        test('should add arrow to tooltip', () => {
            const tooltip = {
                appendChild: jest.fn(),
                style: {}
            };
            
            const config = { position: 'top', theme: 'light' };
            
            tooltipManager.addTooltipArrow(tooltip, config);
            
            expect(tooltip.appendChild).toHaveBeenCalled();
        });
    });

    describe('positionTooltip', () => {
        test('should position tooltip at top', () => {
            const tooltip = {
                style: {},
                getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 }))
            };
            
            const event = {
                target: {
                    getBoundingClientRect: jest.fn(() => ({
                        left: 100,
                        top: 100,
                        width: 50,
                        height: 30,
                        right: 150,
                        bottom: 130
                    }))
                }
            };
            
            const config = { position: 'top' };
            
            global.window = { innerWidth: 800, innerHeight: 600 };
            
            tooltipManager.positionTooltip(tooltip, event, config);
            
            expect(tooltip.style.left).toBeDefined();
            expect(tooltip.style.top).toBeDefined();
        });
    });

    describe('updateTooltipPosition', () => {
        test('should update tooltip position', () => {
            const tooltip = {
                style: {},
                getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 }))
            };
            
            tooltipManager.activeTooltip = tooltip;
            
            global.window = { innerWidth: 800, innerHeight: 600 };
            
            const event = { clientX: 100, clientY: 100 };
            
            tooltipManager.updateTooltipPosition(event);
            
            expect(tooltip.style.left).toBeDefined();
            expect(tooltip.style.top).toBeDefined();
        });

        test('should not update position if no active tooltip', () => {
            tooltipManager.activeTooltip = null;
            
            const event = { clientX: 100, clientY: 100 };
            
            tooltipManager.updateTooltipPosition(event);
            
            // Should not throw error
            expect(true).toBe(true);
        });
    });

    describe('hideTooltip', () => {
        test('should hide tooltip with animation', () => {
            const tooltip = { style: {} };
            tooltipManager.activeTooltip = tooltip;
            
            const mockContainer = { id: 'tooltip-container', style: { opacity: '0' } };
            document.getElementById = jest.fn(() => mockContainer);
            
            jest.spyOn(tooltipManager, 'getActiveTooltipConfig').mockReturnValue({ animation: 'fadeIn' });
            jest.spyOn(tooltipManager, 'removeActiveTooltip').mockImplementation(() => {});
            
            global.setTimeout = jest.fn((callback) => callback());
            
            tooltipManager.hideTooltip();
            
            expect(global.setTimeout).toHaveBeenCalled();
        });

        test('should hide tooltip without animation', () => {
            const tooltip = { style: {} };
            tooltipManager.activeTooltip = tooltip;
            
            const mockContainer = { id: 'tooltip-container', style: { opacity: '0' } };
            document.getElementById = jest.fn(() => mockContainer);
            
            jest.spyOn(tooltipManager, 'getActiveTooltipConfig').mockReturnValue({ animation: false });
            jest.spyOn(tooltipManager, 'removeActiveTooltip').mockImplementation(() => {});
            
            tooltipManager.hideTooltip();
            
            expect(tooltipManager.removeActiveTooltip).toHaveBeenCalled();
        });
    });

    describe('getActiveTooltipConfig', () => {
        test('should return config for active tooltip', () => {
            tooltipManager.activeTooltip = mockElement;
            
            const config = tooltipManager.getActiveTooltipConfig();
            
            expect(config).toEqual({
                animation: 'fadeIn',
                theme: 'light'
            });
        });

        test('should return null if no active tooltip', () => {
            tooltipManager.activeTooltip = null;
            
            const config = tooltipManager.getActiveTooltipConfig();
            
            expect(config).toBeNull();
        });
    });

    describe('removeActiveTooltip', () => {
        test('should remove active tooltip', () => {
            const tooltip = {
                parentNode: {
                    removeChild: jest.fn()
                }
            };
            
            tooltipManager.activeTooltip = tooltip;
            
            const mockContainer = { style: { opacity: '0' } };
            document.getElementById = jest.fn(() => mockContainer);
            
            tooltipManager.removeActiveTooltip();
            
            expect(tooltipManager.activeTooltip).toBeNull();
        });
    });

    describe('addTooltipsToElements', () => {
        test('should add tooltips to multiple elements', () => {
            const elements = [mockElement, mockElement];
            
            jest.spyOn(tooltipManager, 'addTooltip').mockImplementation(() => {});
            
            tooltipManager.addTooltipsToElements(elements, 'Test tooltip', {});
            
            expect(tooltipManager.addTooltip).toHaveBeenCalledTimes(2);
        });

        test('should not add tooltips if elements is not array', () => {
            jest.spyOn(tooltipManager, 'addTooltip').mockImplementation(() => {});
            
            tooltipManager.addTooltipsToElements(null, 'Test tooltip', {});
            
            expect(tooltipManager.addTooltip).not.toHaveBeenCalled();
        });
    });

    describe('addDynamicTooltip', () => {
        test('should add dynamic tooltip', () => {
            const mockElements = [mockElement, mockElement];
            
            document.querySelectorAll = jest.fn(() => mockElements);
            
            jest.spyOn(tooltipManager, 'addTooltip').mockImplementation(() => {});
            jest.spyOn(tooltipManager, 'observeNewElements').mockImplementation(() => {});
            
            tooltipManager.addDynamicTooltip('.test', 'Test tooltip', {});
            
            expect(document.querySelectorAll).toHaveBeenCalledWith('.test');
            expect(tooltipManager.addTooltip).toHaveBeenCalledTimes(2);
        });
    });

    describe('observeNewElements', () => {
        test('should setup mutation observer', () => {
            global.MutationObserver = jest.fn(() => ({
                observe: jest.fn()
            }));
            
            tooltipManager.observeNewElements('.test', 'Test tooltip', {});
            
            expect(global.MutationObserver).toHaveBeenCalled();
        });
    });

    describe('adjustTooltipPosition', () => {
        test('should adjust tooltip position', () => {
            const tooltip = {
                style: {},
                getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 })),
                dataset: { position: 'top' }
            };
            
            const target = {
                getBoundingClientRect: jest.fn(() => ({
                    top: 100,
                    left: 100,
                    width: 50,
                    height: 30,
                    right: 150,
                    bottom: 130
                }))
            };
            
            global.window = { innerWidth: 800, innerHeight: 600 };
            
            tooltipManager.adjustTooltipPosition(tooltip, target);
            
            expect(tooltip.style.top).toBeDefined();
            expect(tooltip.style.left).toBeDefined();
        });
    });

    describe('setTheme', () => {
        test('should set tooltip theme', () => {
            const mockContainer = {
                id: 'tooltip-container',
                className: ''
            };
            
            document.getElementById = jest.fn(() => mockContainer);
            
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            tooltipManager.setTheme('dark');
            
            expect(mockContainer.className).toBe('tooltip-container theme-dark');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Tooltip theme set to: dark');
            
            consoleSpy.mockRestore();
        });
    });

    describe('setAnimation', () => {
        test('should set tooltip animation', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            tooltipManager.setAnimation(true);
            
            expect(tooltipManager.defaultConfig.animation).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('✅ Tooltip animation enabled');
            
            consoleSpy.mockRestore();
        });
    });
});