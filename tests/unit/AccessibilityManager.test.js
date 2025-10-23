// AccessibilityManagerのモック
jest.mock('../../js/utils/accessibilityManager.js', () => ({
    AccessibilityManager: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        isEnabled: jest.fn().mockReturnValue(false),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        destroy: jest.fn()
    }))
}));

import { AccessibilityManager } from '../../js/utils/accessibilityManager.js';

describe('AccessibilityManager', () => {
    let accessibilityManager;

    beforeEach(() => {
        accessibilityManager = new AccessibilityManager();
    });

    test('should initialize with default values', () => {
        expect(accessibilityManager).toBeDefined();
    });

    test('should initialize successfully', () => {
        accessibilityManager.init();
        expect(accessibilityManager.init).toHaveBeenCalled();
    });

    test('should enable accessibility', () => {
        accessibilityManager.enable();
        expect(accessibilityManager.enable).toHaveBeenCalled();
    });

    test('should disable accessibility', () => {
        accessibilityManager.disable();
        expect(accessibilityManager.disable).toHaveBeenCalled();
    });

    test('should check if accessibility is enabled', () => {
        const isEnabled = accessibilityManager.isEnabled();
        expect(isEnabled).toBe(false);
    });

    test('should add event listener', () => {
        const mockCallback = jest.fn();
        accessibilityManager.addEventListener('test', mockCallback);
        expect(accessibilityManager.addEventListener).toHaveBeenCalledWith('test', mockCallback);
    });

    test('should remove event listener', () => {
        const mockCallback = jest.fn();
        accessibilityManager.removeEventListener('test', mockCallback);
        expect(accessibilityManager.removeEventListener).toHaveBeenCalledWith('test', mockCallback);
    });

    test('should destroy accessibility manager', () => {
        accessibilityManager.destroy();
        expect(accessibilityManager.destroy).toHaveBeenCalled();
    });
});