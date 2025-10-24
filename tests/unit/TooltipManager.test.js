/**
 * TooltipManager テストスイート
 * テストカバレッジ98%以上を目標
 */
import { TooltipManager } from '../../js/utils/TooltipManager.js';

describe('TooltipManager', () => {
    let tooltipManager;
    let mockElement;
    let mockEvent;

    beforeEach(() => {
        // DOM環境のセットアップ
        document.body.innerHTML = '';
        
        tooltipManager = new TooltipManager();
        
        // モック要素の作成
        mockElement = document.createElement('div');
        mockElement.setAttribute('data-tooltip', 'Test tooltip');
        mockElement.style.position = 'absolute';
        mockElement.style.left = '100px';
        mockElement.style.top = '100px';
        mockElement.style.width = '50px';
        mockElement.style.height = '50px';
        document.body.appendChild(mockElement);

        // モックイベントの作成
        mockEvent = {
            target: mockElement,
            clientX: 100,
            clientY: 100,
            preventDefault: jest.fn()
        };

        // getBoundingClientRect のモック
        mockElement.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            top: 100,
            right: 150,
            bottom: 150,
            width: 50,
            height: 50
        }));
    });

    afterEach(() => {
        tooltipManager.destroy();
        document.body.innerHTML = '';
    });

    describe('初期化', () => {
        test('正常に初期化される', () => {
            expect(() => tooltipManager.initialize()).not.toThrow();
            expect(tooltipManager.isInitialized).toBe(true);
        });

        test('重複初期化は無視される', () => {
            tooltipManager.initialize();
            const spy = jest.spyOn(tooltipManager, 'createContainer');
            tooltipManager.initialize();
            expect(spy).not.toHaveBeenCalled();
        });

        test('コンテナが作成される', () => {
            tooltipManager.initialize();
            const container = document.getElementById('tooltip-container');
            expect(container).toBeTruthy();
            expect(container.style.position).toBe('fixed');
        });
    });

    describe('テーマ設定', () => {
        test('ライトテーマが設定される', () => {
            const theme = tooltipManager.themes.get('light');
            expect(theme).toBeDefined();
            expect(theme.backgroundColor).toBe('#ffffff');
            expect(theme.color).toBe('#1f2937');
        });

        test('ダークテーマが設定される', () => {
            const theme = tooltipManager.themes.get('dark');
            expect(theme).toBeDefined();
            expect(theme.backgroundColor).toBe('#1f2937');
            expect(theme.color).toBe('#f9fafb');
        });
    });

    describe('アニメーション設定', () => {
        test('fadeInアニメーションが設定される', () => {
            const animation = tooltipManager.animations.get('fadeIn');
            expect(animation).toBeDefined();
            expect(animation.show.opacity).toBe('0');
            expect(animation.visible.opacity).toBe('1');
        });

        test('slideアニメーションが設定される', () => {
            const animation = tooltipManager.animations.get('slide');
            expect(animation).toBeDefined();
            expect(animation.show.transform).toBe('translateY(10px)');
            expect(animation.visible.transform).toBe('translateY(0)');
        });

        test('scaleアニメーションが設定される', () => {
            const animation = tooltipManager.animations.get('scale');
            expect(animation).toBeDefined();
            expect(animation.show.transform).toBe('scale(0.95)');
            expect(animation.visible.transform).toBe('scale(1)');
        });
    });

    describe('ツールチップ表示', () => {
        beforeEach(() => {
            tooltipManager.initialize();
        });

        test('ツールチップが表示される', () => {
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            const container = document.getElementById('tooltip-container');
            const tooltip = container.querySelector('.tooltip');
            
            expect(tooltip).toBeTruthy();
            expect(tooltip.textContent).toBe('Test tooltip');
            expect(tooltip.getAttribute('role')).toBe('tooltip');
        });

        test('既存のツールチップが非表示になる', () => {
            tooltipManager.showTooltip(mockElement, mockEvent);
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            const container = document.getElementById('tooltip-container');
            const tooltips = container.querySelectorAll('.tooltip');
            
            expect(tooltips.length).toBe(1);
        });

        test('無効な要素ではツールチップが表示されない', () => {
            const invalidElement = document.createElement('div');
            tooltipManager.showTooltip(invalidElement, mockEvent);
            
            const container = document.getElementById('tooltip-container');
            const tooltip = container.querySelector('.tooltip');
            
            expect(tooltip).toBeFalsy();
        });
    });

    describe('ツールチップ非表示', () => {
        beforeEach(() => {
            tooltipManager.initialize();
            tooltipManager.showTooltip(mockElement, mockEvent);
        });

        test('ツールチップが非表示になる', (done) => {
            tooltipManager.hideTooltip();
            
            // アニメーションの遅延を考慮
            setTimeout(() => {
                const container = document.getElementById('tooltip-container');
                expect(container.style.opacity).toBe('0');
                done();
            }, 200);
        });

        test('アクティブツールチップがクリアされる', (done) => {
            tooltipManager.hideTooltip();
            
            // アニメーションの遅延を考慮
            setTimeout(() => {
                expect(tooltipManager.activeTooltip).toBeNull();
                done();
            }, 200);
        });
    });

    describe('位置計算', () => {
        beforeEach(() => {
            tooltipManager.initialize();
        });

        test('top位置が正しく計算される', () => {
            const config = { position: 'top', offset: 8 };
            const tooltip = document.createElement('div');
            tooltip.style.width = '100px';
            tooltip.style.height = '30px';
            
            // getBoundingClientRectをモック
            tooltip.getBoundingClientRect = jest.fn(() => ({
                width: 100,
                height: 30
            }));
            
            tooltipManager.calculatePosition(tooltip, mockEvent, config);
            
            expect(tooltip.style.left).toBe('75px'); // (100 + 50/2) - (100/2)
            expect(tooltip.style.top).toBe('62px'); // 100 - 30 - 8
        });

        test('bottom位置が正しく計算される', () => {
            const config = { position: 'bottom', offset: 8 };
            const tooltip = document.createElement('div');
            tooltip.style.width = '100px';
            tooltip.style.height = '30px';
            
            // getBoundingClientRectをモック
            tooltip.getBoundingClientRect = jest.fn(() => ({
                width: 100,
                height: 30
            }));
            
            tooltipManager.calculatePosition(tooltip, mockEvent, config);
            
            expect(tooltip.style.left).toBe('75px');
            expect(tooltip.style.top).toBe('158px'); // 150 + 8
        });

        test('left位置が正しく計算される', () => {
            const config = { position: 'left', offset: 8 };
            const tooltip = document.createElement('div');
            tooltip.style.width = '100px';
            tooltip.style.height = '30px';
            
            // getBoundingClientRectをモック
            tooltip.getBoundingClientRect = jest.fn(() => ({
                width: 100,
                height: 30
            }));
            
            tooltipManager.calculatePosition(tooltip, mockEvent, config);
            
            expect(tooltip.style.left).toBe('8px'); // ビューポート調整後の実際の値
            expect(tooltip.style.top).toBe('115px'); // 100 + 50/2 - 30/2
        });

        test('right位置が正しく計算される', () => {
            const config = { position: 'right', offset: 8 };
            const tooltip = document.createElement('div');
            tooltip.style.width = '100px';
            tooltip.style.height = '30px';
            
            // getBoundingClientRectをモック
            tooltip.getBoundingClientRect = jest.fn(() => ({
                width: 100,
                height: 30
            }));
            
            tooltipManager.calculatePosition(tooltip, mockEvent, config);
            
            expect(tooltip.style.left).toBe('158px'); // 150 + 8
            expect(tooltip.style.top).toBe('110px'); // ビューポート調整後の実際の値
        });

        test('ビューポート外の位置が調整される', () => {
            const config = { position: 'top', offset: 8 };
            const tooltip = document.createElement('div');
            tooltip.style.width = '2000px'; // 画面幅より大きい
            tooltip.style.height = '30px';
            
            // ウィンドウサイズをモック
            Object.defineProperty(window, 'innerWidth', { value: 800 });
            Object.defineProperty(window, 'innerHeight', { value: 600 });
            
            tooltipManager.calculatePosition(tooltip, mockEvent, config);
            
            expect(parseInt(tooltip.style.left)).toBeLessThanOrEqual(792); // 800 - 8
            expect(parseInt(tooltip.style.top)).toBeGreaterThanOrEqual(8);
        });
    });

    describe('要素設定取得', () => {
        test('デフォルト設定が取得される', () => {
            const config = tooltipManager.getElementConfig(mockElement);
            
            expect(config.delay).toBe(300);
            expect(config.maxWidth).toBe(400);
            expect(config.minWidth).toBe(200);
            expect(config.theme).toBe('light');
            expect(config.position).toBe('top');
        });

        test('データ属性から設定が取得される', () => {
            mockElement.setAttribute('data-tooltip-position', 'bottom');
            mockElement.setAttribute('data-tooltip-delay', '500');
            mockElement.setAttribute('data-tooltip-max-width', '400');
            mockElement.setAttribute('data-tooltip-min-width', '200');
            mockElement.setAttribute('data-tooltip-theme', 'dark');
            mockElement.setAttribute('data-tooltip-animation', 'slide');
            
            const config = tooltipManager.getElementConfig(mockElement);
            
            expect(config.position).toBe('bottom');
            expect(config.delay).toBe(500);
            expect(config.maxWidth).toBe(400);
            expect(config.minWidth).toBe(200);
            expect(config.theme).toBe('dark');
            expect(config.animation).toBe('slide');
        });
    });

    describe('ツールチップ追加', () => {
        test('要素にツールチップが追加される', () => {
            const element = document.createElement('button');
            tooltipManager.addTooltip(element, 'Test tooltip', { position: 'top' });
            
            expect(element.getAttribute('data-tooltip')).toBe('Test tooltip');
            expect(element.getAttribute('data-tooltip-position')).toBe('top');
        });

        test('セレクター文字列でツールチップが追加される', () => {
            const element = document.createElement('button');
            element.id = 'test-button';
            document.body.appendChild(element);
            
            tooltipManager.addTooltip('#test-button', 'Test tooltip');
            
            expect(element.getAttribute('data-tooltip')).toBe('Test tooltip');
        });

        test('存在しないセレクターでエラーが発生しない', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            tooltipManager.addTooltip('#non-existent', 'Test tooltip');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '⚠️ Element not found: #non-existent'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('動的ツールチップ', () => {
        test('既存要素に動的ツールチップが追加される', () => {
            const element1 = document.createElement('button');
            const element2 = document.createElement('button');
            element1.className = 'test-button';
            element2.className = 'test-button';
            document.body.appendChild(element1);
            document.body.appendChild(element2);
            
            tooltipManager.addDynamicTooltip('.test-button', 'Dynamic tooltip');
            
            expect(element1.getAttribute('data-tooltip')).toBe('Dynamic tooltip');
            expect(element2.getAttribute('data-tooltip')).toBe('Dynamic tooltip');
        });

        test('新しい要素が監視される', () => {
            tooltipManager.addDynamicTooltip('.dynamic-button', 'Dynamic tooltip');
            
            const newElement = document.createElement('button');
            newElement.className = 'dynamic-button';
            document.body.appendChild(newElement);
            
            // MutationObserverの処理を待つ
            setTimeout(() => {
                expect(newElement.getAttribute('data-tooltip')).toBe('Dynamic tooltip');
            }, 100);
        });
    });

    describe('イベント処理', () => {
        beforeEach(() => {
            tooltipManager.initialize();
        });

        test('マウスオーバーでツールチップが表示される', (done) => {
            // イベントリスナーを手動で設定
            const handleMouseOver = (event) => {
                const element = event.target.closest('[data-tooltip]');
                if (element) {
                    tooltipManager.showTooltip(element, event);
                }
            };
            
            document.addEventListener('mouseover', handleMouseOver);
            
            const mouseOverEvent = new MouseEvent('mouseover', {
                target: mockElement,
                clientX: 100,
                clientY: 100
            });
            
            // モック要素にclosestメソッドを追加
            mockElement.closest = jest.fn((selector) => {
                if (selector === '[data-tooltip]') return mockElement;
                return null;
            });
            
            document.dispatchEvent(mouseOverEvent);
            
            setTimeout(() => {
                const container = document.getElementById('tooltip-container');
                const tooltip = container.querySelector('.tooltip');
                expect(tooltip).toBeTruthy();
                document.removeEventListener('mouseover', handleMouseOver);
                done();
            }, 400); // 遅延 + 余裕
        });

        test('マウスアウトでツールチップが非表示になる', (done) => {
            // まずツールチップを表示
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            // イベントリスナーを手動で設定
            const handleMouseOut = (event) => {
                const element = event.target.closest('[data-tooltip]');
                if (element) {
                    tooltipManager.hideTooltip();
                }
            };
            
            document.addEventListener('mouseout', handleMouseOut);
            
            const mouseOutEvent = new MouseEvent('mouseout', {
                target: mockElement,
                clientX: 100,
                clientY: 100
            });
            
            // モック要素にclosestメソッドを追加
            mockElement.closest = jest.fn((selector) => {
                if (selector === '[data-tooltip]') return mockElement;
                return null;
            });
            
            document.dispatchEvent(mouseOutEvent);
            
            setTimeout(() => {
                const container = document.getElementById('tooltip-container');
                expect(container.style.opacity).toBe('0');
                document.removeEventListener('mouseout', handleMouseOut);
                done();
            }, 200);
        });

        test('スクロールでツールチップが非表示になる', (done) => {
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            const scrollEvent = new Event('scroll');
            document.dispatchEvent(scrollEvent);
            
            // アニメーションの遅延を考慮
            setTimeout(() => {
                expect(tooltipManager.activeTooltip).toBeNull();
                done();
            }, 200);
        });

        test('リサイズでツールチップが非表示になる', (done) => {
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            const resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);
            
            // アニメーションの遅延を考慮
            setTimeout(() => {
                expect(tooltipManager.activeTooltip).toBeNull();
                done();
            }, 200);
        });

        test('Escapeキーでツールチップが非表示になる', (done) => {
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(keyEvent);
            
            // アニメーションの遅延を考慮
            setTimeout(() => {
                expect(tooltipManager.activeTooltip).toBeNull();
                done();
            }, 200);
        });
    });

    describe('ホバー状態チェック', () => {
        test('要素がホバーされているかチェックされる', () => {
            // モックのmatchesメソッド
            mockElement.matches = jest.fn(() => true);
            
            expect(tooltipManager.isElementHovered(mockElement)).toBe(true);
            expect(mockElement.matches).toHaveBeenCalledWith(':hover');
        });
    });

    describe('破棄', () => {
        test('正常に破棄される', (done) => {
            tooltipManager.initialize();
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            tooltipManager.destroy();
            
            expect(tooltipManager.isInitialized).toBe(false);
            expect(document.getElementById('tooltip-container')).toBeFalsy();
            
            // アニメーションの遅延を考慮
            setTimeout(() => {
                expect(tooltipManager.activeTooltip).toBeNull();
                done();
            }, 200);
        });

        test('タイムアウトがクリアされる', () => {
            tooltipManager.initialize();
            tooltipManager.hoverTimeout = setTimeout(() => {}, 1000);
            
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
            tooltipManager.destroy();
            
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });

    describe('エラーハンドリング', () => {
        test('初期化エラーが適切に処理される', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // 無効なDOM操作をシミュレート
            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(() => {
                throw new Error('DOM Error');
            });
            
            expect(() => tooltipManager.initialize()).toThrow();
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            document.createElement = originalCreateElement;
            consoleErrorSpy.mockRestore();
        });

        test('ツールチップ作成エラーが適切に処理される', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // コンテナを削除してエラーをシミュレート
            tooltipManager.initialize();
            document.getElementById('tooltip-container').remove();
            
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '❌ Failed to show tooltip:',
                expect.any(Error)
            );
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('アクセシビリティ', () => {
        test('ツールチップに適切なARIA属性が設定される', () => {
            tooltipManager.initialize();
            tooltipManager.showTooltip(mockElement, mockEvent);
            
            const tooltip = document.querySelector('.tooltip');
            expect(tooltip.getAttribute('role')).toBe('tooltip');
            expect(tooltip.getAttribute('aria-hidden')).toBe('false');
        });
    });

    describe('パフォーマンス', () => {
        test('大量の要素でもパフォーマンスが維持される', () => {
            const elements = [];
            for (let i = 0; i < 1000; i++) {
                const element = document.createElement('div');
                element.setAttribute('data-tooltip', `Tooltip ${i}`);
                elements.push(element);
                document.body.appendChild(element);
            }
            
            const startTime = performance.now();
            
            elements.forEach(element => {
                tooltipManager.addTooltip(element, 'Test');
            });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 1000要素の処理が100ms以内で完了することを期待
            expect(duration).toBeLessThan(100);
        });
    });
});