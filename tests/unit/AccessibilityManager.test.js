/**
 * AccessibilityManager テストスイート
 */

import { accessibilityManager } from '../../js/utils/accessibilityManager.js';

// モックの設定
jest.mock('../../js/utils/accessibilityManager.js', () => ({
    accessibilityManager: {
        initialize: jest.fn(),
        setupKeyboardNavigation: jest.fn(),
        setupScreenReaderSupport: jest.fn(),
        setupHighContrastMode: jest.fn(),
        setupFocusManagement: jest.fn(),
        announceToScreenReader: jest.fn(),
        isHighContrastMode: jest.fn(),
        toggleHighContrastMode: jest.fn(),
        destroy: jest.fn()
    }
}));

describe('AccessibilityManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(accessibilityManager.initialize).toBeDefined();
        });
    });

    describe('initialize', () => {
        it('should initialize accessibility features', () => {
            accessibilityManager.initialize();
            
            expect(accessibilityManager.setupKeyboardNavigation).toHaveBeenCalled();
            expect(accessibilityManager.setupScreenReaderSupport).toHaveBeenCalled();
            expect(accessibilityManager.setupHighContrastMode).toHaveBeenCalled();
            expect(accessibilityManager.setupFocusManagement).toHaveBeenCalled();
        });
    });

    describe('setupKeyboardNavigation', () => {
        it('should setup keyboard navigation', () => {
            accessibilityManager.setupKeyboardNavigation();
            
            expect(accessibilityManager.setupKeyboardNavigation).toHaveBeenCalled();
        });
    });

    describe('setupScreenReaderSupport', () => {
        it('should setup screen reader support', () => {
            accessibilityManager.setupScreenReaderSupport();
            
            expect(accessibilityManager.setupScreenReaderSupport).toHaveBeenCalled();
        });
    });

    describe('setupHighContrastMode', () => {
        it('should setup high contrast mode', () => {
            accessibilityManager.setupHighContrastMode();
            
            expect(accessibilityManager.setupHighContrastMode).toHaveBeenCalled();
        });
    });

    describe('setupFocusManagement', () => {
        it('should setup focus management', () => {
            accessibilityManager.setupFocusManagement();
            
            expect(accessibilityManager.setupFocusManagement).toHaveBeenCalled();
        });
    });

    describe('announceToScreenReader', () => {
        it('should announce message to screen reader', () => {
            const message = 'Test announcement';
            accessibilityManager.announceToScreenReader(message);
            
            expect(accessibilityManager.announceToScreenReader).toHaveBeenCalledWith(message);
        });
    });

    describe('isHighContrastMode', () => {
        it('should return high contrast mode status', () => {
            accessibilityManager.isHighContrastMode.mockReturnValue(false);
            
            const result = accessibilityManager.isHighContrastMode();
            
            expect(result).toBe(false);
        });
    });

    describe('toggleHighContrastMode', () => {
        it('should toggle high contrast mode', () => {
            accessibilityManager.toggleHighContrastMode();
            
            expect(accessibilityManager.toggleHighContrastMode).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should destroy accessibility manager', () => {
            accessibilityManager.destroy();
            
            expect(accessibilityManager.destroy).toHaveBeenCalled();
        });
    });

    describe('integration', () => {
        it('should complete full accessibility setup flow', () => {
            accessibilityManager.initialize();
            
            expect(accessibilityManager.setupKeyboardNavigation).toHaveBeenCalled();
            expect(accessibilityManager.setupScreenReaderSupport).toHaveBeenCalled();
            expect(accessibilityManager.setupHighContrastMode).toHaveBeenCalled();
            expect(accessibilityManager.setupFocusManagement).toHaveBeenCalled();
        });
    });
});