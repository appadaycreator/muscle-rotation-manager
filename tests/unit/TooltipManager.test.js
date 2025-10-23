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
});