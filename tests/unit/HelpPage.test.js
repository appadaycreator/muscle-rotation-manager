// tests/unit/HelpPage.test.js - HelpPageのテスト

import { HelpPage } from '../../js/pages/helpPage.js';

// モック設定
jest.mock('../../js/utils/errorHandler.js', () => ({
    handleError: jest.fn()
}));

jest.mock('../../js/modules/authManager.js', () => ({
    authManager: {
        isAuthenticated: jest.fn(() => true),
        getCurrentUser: jest.fn(() => ({ id: '123', email: 'test@example.com' }))
    }
}));

describe('HelpPage', () => {
    let helpPage;

    beforeEach(() => {
        // DOMのモック
        global.document = {
            getElementById: jest.fn(() => ({
                innerHTML: '',
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            })),
            createElement: jest.fn(() => ({
                innerHTML: '',
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            }))
        };

        helpPage = new HelpPage();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(helpPage.isInitialized).toBe(false);
            expect(helpPage.eventListeners).toEqual([]);
        });
    });

    describe('init', () => {
        it('should initialize successfully', async () => {
            const result = await helpPage.init();

            expect(result).toBe(true);
            expect(helpPage.isInitialized).toBe(true);
        });

        it('should not initialize if already initialized', async () => {
            helpPage.isInitialized = true;

            const result = await helpPage.init();

            expect(result).toBe(true);
        });

        it('should handle initialization errors', async () => {
            global.document.getElementById.mockReturnValue(null);

            const result = await helpPage.init();

            expect(result).toBe(false);
        });
    });

    describe('render', () => {
        it('should render help page content', () => {
            const mockElement = {
                innerHTML: '',
                addEventListener: jest.fn()
            };
            global.document.getElementById.mockReturnValue(mockElement);

            helpPage.render();

            expect(mockElement.innerHTML).toContain('ヘルプ');
        });

        it('should return early if main element is not found', () => {
            global.document.getElementById.mockReturnValue(null);

            const result = helpPage.render();

            expect(result).toBeUndefined();
        });
    });

    describe('setupEventListeners', () => {
        it('should setup event listeners', () => {
            const mockElement = {
                addEventListener: jest.fn()
            };
            global.document.getElementById.mockReturnValue(mockElement);

            helpPage.setupEventListeners();

            expect(mockElement.addEventListener).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should destroy help page', () => {
            helpPage.isInitialized = true;
            helpPage.eventListeners = [
                { element: { removeEventListener: jest.fn() }, event: 'click', handler: jest.fn() }
            ];

            helpPage.destroy();

            expect(helpPage.isInitialized).toBe(false);
            expect(helpPage.eventListeners).toHaveLength(0);
        });
    });
});
