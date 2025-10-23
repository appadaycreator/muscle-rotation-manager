// TooltipManager.test.js - ツールチップマネージャーのテスト

import { tooltipManager } from '../../js/utils/tooltip.js';

// DOM環境のモック
const mockElement = {
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    remove: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
        top: 100,
        left: 100,
        width: 200,
        height: 50,
        bottom: 150,
        right: 300
    })),
    matches: jest.fn(() => true),
    querySelectorAll: jest.fn(() => []),
    nodeType: Node.ELEMENT_NODE,
    style: {},
    dataset: {},
    className: ''
};

// DOM要素のモック
document.getElementById = jest.fn(() => mockElement);
document.querySelectorAll = jest.fn(() => [mockElement]);
Object.defineProperty(document, 'body', {
    value: mockElement,
    writable: true
});

// window のモック
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
});

describe('TooltipManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // ツールチップマネージャーをリセット
        tooltipManager.destroy();
    });

    describe('初期化', () => {
        test('ツールチップマネージャーが正しく初期化される', () => {
            tooltipManager.initialize();
            expect(tooltipManager.isInitialized).toBe(true);
        });

        test('重複初期化はスキップされる', () => {
            tooltipManager.initialize();
            tooltipManager.initialize();
            expect(tooltipManager.isInitialized).toBe(true);
        });
    });

    describe('ツールチップの追加', () => {
        test('基本的なツールチップを追加できる', () => {
            tooltipManager.initialize();
            tooltipManager.addTooltip(mockElement, 'テストツールチップ');
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', 'テストツールチップ');
        });

        test('設定付きツールチップを追加できる', () => {
            tooltipManager.initialize();
            const config = {
                position: 'bottom',
                delay: 500,
                maxWidth: 250,
                theme: 'dark',
                animation: false
            };
            
            tooltipManager.addTooltip(mockElement, 'テストツールチップ', config);
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', 'テストツールチップ');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip-position', 'bottom');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip-delay', 500);
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip-max-width', 250);
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip-theme', 'dark');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip-animation', false);
        });

        test('無効な要素ではツールチップを追加しない', () => {
            tooltipManager.initialize();
            tooltipManager.addTooltip(null, 'テストツールチップ');
            
            expect(mockElement.setAttribute).not.toHaveBeenCalled();
        });

        test('空のテキストではツールチップを追加しない', () => {
            tooltipManager.initialize();
            tooltipManager.addTooltip(mockElement, '');
            
            expect(mockElement.setAttribute).not.toHaveBeenCalled();
        });
    });

    describe('複数ツールチップの追加', () => {
        test('複数のツールチップを一括追加できる', () => {
            tooltipManager.initialize();
            const tooltipConfigs = [
                { element: mockElement, text: 'ツールチップ1', config: { position: 'top' } },
                { element: mockElement, text: 'ツールチップ2', config: { position: 'bottom' } }
            ];
            
            tooltipManager.addTooltips(tooltipConfigs);
            
            expect(mockElement.setAttribute).toHaveBeenCalledTimes(4); // 2つのツールチップ × 2回のsetAttribute
        });
    });

    describe('動的ツールチップ', () => {
        test('動的ツールチップを追加できる', () => {
            tooltipManager.initialize();
            tooltipManager.addDynamicTooltip('.test-element', '動的ツールチップ', { position: 'top' });
            
            expect(document.querySelectorAll).toHaveBeenCalledWith('.test-element');
        });
    });

    describe('筋肉部位ツールチップ', () => {
        test('胸筋のツールチップを追加できる', () => {
            tooltipManager.initialize();
            tooltipManager.addMuscleGroupTooltip(mockElement, 'chest');
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('胸筋'));
        });

        test('背筋のツールチップを追加できる', () => {
            tooltipManager.initialize();
            tooltipManager.addMuscleGroupTooltip(mockElement, 'back');
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('背筋'));
        });

        test('未知の筋肉部位ではデフォルトツールチップを追加', () => {
            tooltipManager.initialize();
            tooltipManager.addMuscleGroupTooltip(mockElement, 'unknown');
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('筋肉部位'));
        });
    });

    describe('エクササイズツールチップ', () => {
        test('エクササイズのツールチップを追加できる', () => {
            tooltipManager.initialize();
            const exercise = {
                name: 'ベンチプレス',
                muscleGroups: ['胸'],
                equipment: 'バーベル',
                difficulty: '中級',
                description: '胸筋を鍛えるエクササイズ'
            };
            
            tooltipManager.addExerciseTooltip(mockElement, exercise);
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('ベンチプレス'));
        });
    });

    describe('統計ツールチップ', () => {
        test('1RM統計のツールチップを追加できる', () => {
            tooltipManager.initialize();
            tooltipManager.addStatsTooltip(mockElement, '1rm');
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', '統計データの詳細');
        });

        test('ボリューム統計のツールチップを追加できる', () => {
            tooltipManager.initialize();
            tooltipManager.addStatsTooltip(mockElement, 'volume');
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', '統計データの詳細');
        });

        test('未知の統計タイプではデフォルトツールチップを追加', () => {
            tooltipManager.initialize();
            tooltipManager.addStatsTooltip(mockElement, 'unknown');
            
            expect(mockElement.setAttribute).toHaveBeenCalledWith('data-tooltip', expect.stringContaining('統計データ'));
        });
    });

    describe('位置調整', () => {
        test('ツールチップの位置を調整できる', () => {
            tooltipManager.initialize();
            const tooltip = { 
                ...mockElement, 
                style: { top: '', left: '' }, 
                dataset: { position: 'top' } 
            };
            const target = mockElement;
            
            tooltipManager.adjustTooltipPosition(tooltip, target);
            
            expect(tooltip.style.top).toBeDefined();
            expect(tooltip.style.left).toBeDefined();
        });
    });

    describe('テーマ設定', () => {
        test('ツールチップのテーマを設定できる', () => {
            tooltipManager.initialize();
            tooltipManager.setTheme('dark');
            
            expect(document.getElementById).toHaveBeenCalledWith('tooltip-container');
        });
    });

    describe('アニメーション設定', () => {
        test('ツールチップのアニメーションを設定できる', () => {
            tooltipManager.initialize();
            tooltipManager.setAnimation(false);
            
            expect(tooltipManager.defaultConfig.animation).toBe(false);
        });
    });

    describe('破棄', () => {
        test('ツールチップマネージャーを正しく破棄できる', () => {
            tooltipManager.initialize();
            tooltipManager.destroy();
            
            expect(tooltipManager.isInitialized).toBe(false);
            expect(tooltipManager.tooltips.size).toBe(0);
        });
    });

    describe('エラーハンドリング', () => {
        test('初期化エラーを適切に処理する', () => {
            // DOM要素を無効にしてエラーを発生させる
            document.getElementById = jest.fn(() => null);
            
            expect(() => {
                tooltipManager.initialize();
            }).not.toThrow();
        });

        test('ツールチップ追加エラーを適切に処理する', () => {
            tooltipManager.initialize();
            
            // 無効な要素でエラーを発生させる
            expect(() => {
                tooltipManager.addTooltip(undefined, 'テスト');
            }).not.toThrow();
        });
    });
});
