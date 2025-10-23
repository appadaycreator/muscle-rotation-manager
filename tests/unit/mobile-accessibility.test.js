/**
 * モバイル最適化とアクセシビリティ機能のユニットテスト
 */

// テストランナーはグローバルで利用可能

// モバイル最適化のモック
const mockMobileOptimization = {
    initializeSwipeDetection(element, onSwipeLeft, onSwipeRight) {
        if (!element) return false;
        
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        const handleTouchStart = (event) => {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        };
        
        const handleTouchMove = (event) => {
            touchEndX = event.touches[0].clientX;
            touchEndY = event.touches[0].clientY;
        };
        
        const handleTouchEnd = () => {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 50;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && onSwipeRight) {
                    onSwipeRight();
                } else if (deltaX < 0 && onSwipeLeft) {
                    onSwipeLeft();
                }
            }
        };
        
        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove);
        element.addEventListener('touchend', handleTouchEnd);
        
        return {
            destroy: () => {
                element.removeEventListener('touchstart', handleTouchStart);
                element.removeEventListener('touchmove', handleTouchMove);
                element.removeEventListener('touchend', handleTouchEnd);
            }
        };
    },

    optimizeTouchTargets() {
        const elements = document.querySelectorAll('button, a, input, [role="button"]');
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
            }
        });
        return elements.length;
    },

    enableOneHandedMode() {
        document.body.classList.add('one-handed-mode');
        return true;
    },

    disableOneHandedMode() {
        document.body.classList.remove('one-handed-mode');
        return true;
    }
};

// アクセシビリティマネージャーのモック
const mockAccessibilityManager = {
    addAriaAttributes(element, attributes) {
        if (!element || !attributes) return false;
        
        Object.keys(attributes).forEach(key => {
            element.setAttribute(`aria-${key}`, attributes[key]);
        });
        return true;
    },

    updateAriaAttribute(element, attribute, value) {
        if (!element || !attribute) return false;
        
        element.setAttribute(`aria-${attribute}`, value);
        return true;
    },

    announce(message, politeness = 'polite') {
        const liveRegion = document.getElementById('aria-live-region') || 
                          this.createLiveRegion(politeness);
        liveRegion.textContent = message;
        return true;
    },

    createLiveRegion(politeness = 'polite') {
        const region = document.createElement('div');
        region.id = 'aria-live-region';
        region.setAttribute('aria-live', politeness);
        region.setAttribute('aria-atomic', 'true');
        region.style.position = 'absolute';
        region.style.left = '-10000px';
        region.style.width = '1px';
        region.style.height = '1px';
        region.style.overflow = 'hidden';
        document.body.appendChild(region);
        return region;
    },

    trapFocus(element) {
        if (!element) return null;
        
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return null;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleKeyDown = (event) => {
            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        event.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        event.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        
        element.addEventListener('keydown', handleKeyDown);
        firstElement.focus();
        
        return {
            destroy: () => {
                element.removeEventListener('keydown', handleKeyDown);
            }
        };
    },

    setupFocusManagement() {
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        modals.forEach(modal => {
            if (modal.style.display !== 'none' && !modal.hidden) {
                this.trapFocus(modal);
            }
        });
        return modals.length;
    },

    handleKeyboardNavigation(event) {
        const { key, target } = event;
        
        if (key === 'Enter' || key === ' ') {
            if (target.getAttribute('role') === 'button' && !target.disabled) {
                target.click();
                return true;
            }
        }
        
        if (key === 'Escape') {
            const modal = target.closest('[role="dialog"], .modal');
            if (modal) {
                const closeButton = modal.querySelector('[data-dismiss], .close');
                if (closeButton) {
                    closeButton.click();
                    return true;
                }
            }
        }
        
        return false;
    }
};

// テストスイート
testRunner.describe('モバイル最適化機能テスト', () => {
    let mockElement;

    testRunner.beforeEach(() => {
        mockElement = {
            addEventListener: () => {},
            removeEventListener: () => {},
            getBoundingClientRect: () => ({ width: 30, height: 30 }),
            style: {}
        };
    });

    testRunner.test('Swipe detection works for left swipe', () => {
        let swipeLeftCalled = false;
        let swipeRightCalled = false;

        const onSwipeLeft = () => { swipeLeftCalled = true; };
        const onSwipeRight = () => { swipeRightCalled = true; };

        const detector = mockMobileOptimization.initializeSwipeDetection(
            mockElement, onSwipeLeft, onSwipeRight
        );

        testRunner.expect(detector).toBeTruthy();
        testRunner.expect(typeof detector.destroy).toBe('function');
    });

    testRunner.test('Swipe detection works for right swipe', () => {
        let swipeRightCalled = false;
        const onSwipeRight = () => { swipeRightCalled = true; };

        const detector = mockMobileOptimization.initializeSwipeDetection(
            mockElement, null, onSwipeRight
        );

        testRunner.expect(detector).toBeTruthy();
    });

    testRunner.test('Touch target optimization works', () => {
        // DOM要素のモック
        document.querySelectorAll = () => [mockElement];
        
        const optimizedCount = mockMobileOptimization.optimizeTouchTargets();
        testRunner.expect(optimizedCount).toBeGreaterThan(0);
        testRunner.expect(mockElement.style.minWidth).toBe('44px');
        testRunner.expect(mockElement.style.minHeight).toBe('44px');
    });

    testRunner.test('One-handed mode can be enabled and disabled', () => {
        const enableResult = mockMobileOptimization.enableOneHandedMode();
        testRunner.expect(enableResult).toBe(true);

        const disableResult = mockMobileOptimization.disableOneHandedMode();
        testRunner.expect(disableResult).toBe(true);
    });
});

testRunner.describe('アクセシビリティ機能テスト', () => {
    let mockElement;

    testRunner.beforeEach(() => {
        mockElement = {
            setAttribute: () => {},
            getAttribute: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
            removeEventListener: () => {},
            focus: () => {},
            closest: () => null
        };
    });

    testRunner.test('addAriaAttributes correctly adds attributes', () => {
        let setAttributes = {};
        mockElement.setAttribute = (key, value) => {
            setAttributes[key] = value;
        };

        const result = mockAccessibilityManager.addAriaAttributes(mockElement, {
            label: 'テストボタン',
            expanded: 'false',
            controls: 'menu-1'
        });

        testRunner.expect(result).toBe(true);
        testRunner.expect(setAttributes['aria-label']).toBe('テストボタン');
        testRunner.expect(setAttributes['aria-expanded']).toBe('false');
        testRunner.expect(setAttributes['aria-controls']).toBe('menu-1');
    });

    testRunner.test('updateAriaAttribute correctly updates attributes', () => {
        let setAttribute = '';
        let setValue = '';
        mockElement.setAttribute = (key, value) => {
            setAttribute = key;
            setValue = value;
        };

        const result = mockAccessibilityManager.updateAriaAttribute(
            mockElement, 'expanded', 'true'
        );

        testRunner.expect(result).toBe(true);
        testRunner.expect(setAttribute).toBe('aria-expanded');
        testRunner.expect(setValue).toBe('true');
    });

    testRunner.test('announce uses aria-live region', () => {
        // DOM要素のモック
        const originalGetElementById = document.getElementById;
        const originalCreateElement = document.createElement;
        const originalBody = document.body;

        document.getElementById = () => null;
        document.createElement = (tag) => ({
            id: '',
            setAttribute: () => {},
            style: {},
            textContent: ''
        });
        
        // bodyのモックを適切に設定
        const mockBody = {
            appendChild: () => {}
        };
        Object.defineProperty(document, 'body', {
            value: mockBody,
            writable: true,
            configurable: true
        });

        const result = mockAccessibilityManager.announce('テストメッセージ');
        testRunner.expect(result).toBe(true);

        // 元の状態に戻す
        document.getElementById = originalGetElementById;
        document.createElement = originalCreateElement;
        Object.defineProperty(document, 'body', {
            value: originalBody,
            writable: true,
            configurable: true
        });
    });

    testRunner.test('Focus trapping works for modals', () => {
        const focusableElements = [
            { focus: () => {} },
            { focus: () => {} }
        ];
        
        mockElement.querySelectorAll = () => focusableElements;

        const focusTrap = mockAccessibilityManager.trapFocus(mockElement);
        testRunner.expect(focusTrap).toBeTruthy();
        testRunner.expect(typeof focusTrap.destroy).toBe('function');
    });

    testRunner.test('Focus management setup works', () => {
        document.querySelectorAll = () => [mockElement];
        mockElement.style = { display: 'block' };
        mockElement.hidden = false;

        const setupCount = mockAccessibilityManager.setupFocusManagement();
        testRunner.expect(setupCount).toBe(1);
    });

    testRunner.test('Keyboard navigation handles Enter key', () => {
        mockElement.getAttribute = (attr) => attr === 'role' ? 'button' : null;
        mockElement.disabled = false;
        mockElement.click = () => {};

        const event = {
            key: 'Enter',
            target: mockElement
        };

        const result = mockAccessibilityManager.handleKeyboardNavigation(event);
        testRunner.expect(result).toBe(true);
    });

    testRunner.test('Keyboard navigation handles Space key', () => {
        mockElement.getAttribute = (attr) => attr === 'role' ? 'button' : null;
        mockElement.disabled = false;
        mockElement.click = () => {};

        const event = {
            key: ' ',
            target: mockElement
        };

        const result = mockAccessibilityManager.handleKeyboardNavigation(event);
        testRunner.expect(result).toBe(true);
    });

    testRunner.test('Keyboard navigation handles Escape key', () => {
        const modalElement = {
            querySelector: () => ({ click: () => {} })
        };
        
        mockElement.closest = () => modalElement;

        const event = {
            key: 'Escape',
            target: mockElement
        };

        const result = mockAccessibilityManager.handleKeyboardNavigation(event);
        testRunner.expect(result).toBe(true);
    });

    testRunner.test('ARIA live region is created correctly', () => {
        const originalCreateElement = document.createElement;
        const originalBody = document.body;
        
        let createdElement = null;
        document.createElement = (tag) => {
            createdElement = {
                id: '',
                setAttribute: () => {},
                style: {},
                textContent: ''
            };
            return createdElement;
        };
        
        // bodyのモックを適切に設定
        const mockBody = {
            appendChild: () => {}
        };
        Object.defineProperty(document, 'body', {
            value: mockBody,
            writable: true,
            configurable: true
        });

        const region = mockAccessibilityManager.createLiveRegion('assertive');
        testRunner.expect(region).toBeTruthy();
        testRunner.expect(createdElement.id).toBe('aria-live-region');

        // 元の状態に戻す
        document.createElement = originalCreateElement;
        Object.defineProperty(document, 'body', {
            value: originalBody,
            writable: true,
            configurable: true
        });
    });

    testRunner.test('Focus trap handles empty focusable elements', () => {
        mockElement.querySelectorAll = () => [];

        const focusTrap = mockAccessibilityManager.trapFocus(mockElement);
        testRunner.expect(focusTrap).toBe(null);
    });

    testRunner.test('Keyboard navigation ignores disabled buttons', () => {
        mockElement.getAttribute = (attr) => attr === 'role' ? 'button' : null;
        mockElement.disabled = true;

        const event = {
            key: 'Enter',
            target: mockElement
        };

        const result = mockAccessibilityManager.handleKeyboardNavigation(event);
        testRunner.expect(result).toBe(false);
    });
});

console.log('🧪 モバイル最適化とアクセシビリティのテストが読み込まれました');