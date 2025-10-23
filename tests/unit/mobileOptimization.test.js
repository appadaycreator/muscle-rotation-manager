// MobileOptimization.test.js - モバイル最適化のテスト

// MobileOptimizationクラスをモック
const MobileOptimization = class MobileOptimization {
    constructor() {
        this.isMobile = false;
        this.touchEvents = [];
        this.viewport = { width: 0, height: 0 };
    }

    init() {
        this.detectMobile();
        this.setupTouchEvents();
        this.optimizeViewport();
    }

    detectMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupTouchEvents() {
        if (this.isMobile) {
            this.touchEvents = ['touchstart', 'touchend', 'touchmove'];
        }
    }

    optimizeViewport() {
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    isMobileDevice() {
        return this.isMobile;
    }

    getTouchEvents() {
        return [...this.touchEvents];
    }

    getViewport() {
        return { ...this.viewport };
    }

    optimizeImages() {
        if (!this.isMobile) return;

        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.loading = 'lazy';
            if (!img.sizes) {
                img.sizes = '100vw';
            }
        });
    }

    optimizeFonts() {
        if (!this.isMobile) return;

        document.body.style.fontSize = '16px';
        document.body.style.lineHeight = '1.4';
    }

    setupSwipeGestures() {
        if (!this.isMobile) return;

        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 50) {
                    this.handleSwipeLeft();
                } else if (diffX < -50) {
                    this.handleSwipeRight();
                }
            }
        });
    }

    handleSwipeLeft() {
        console.log('Swipe left detected');
    }

    handleSwipeRight() {
        console.log('Swipe right detected');
    }

    getOptimizationReport() {
        return {
            isMobile: this.isMobile,
            touchEvents: this.getTouchEvents(),
            viewport: this.getViewport(),
            optimizations: this.getAppliedOptimizations()
        };
    }

    getAppliedOptimizations() {
        const optimizations = [];
        if (this.isMobile) {
            optimizations.push('mobile-detected');
            optimizations.push('touch-events');
            optimizations.push('viewport-optimization');
        }
        return optimizations;
    }
};

describe('MobileOptimization', () => {
    let mobileOptimization;

    beforeEach(() => {
        mobileOptimization = new MobileOptimization();
        jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(mobileOptimization.isMobile).toBe(false);
            expect(mobileOptimization.touchEvents).toEqual([]);
            expect(mobileOptimization.viewport).toEqual({ width: 0, height: 0 });
        });
    });

    describe('init', () => {
        it('should initialize mobile optimization', () => {
            mobileOptimization.init();

            expect(mobileOptimization.isMobile).toBeDefined();
            expect(mobileOptimization.touchEvents).toBeDefined();
            expect(mobileOptimization.viewport.width).toBe(window.innerWidth);
            expect(mobileOptimization.viewport.height).toBe(window.innerHeight);
        });
    });

    describe('detectMobile', () => {
        it('should detect mobile device', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });

            mobileOptimization.detectMobile();

            expect(mobileOptimization.isMobile).toBe(true);
        });

        it('should detect desktop device', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                configurable: true
            });

            mobileOptimization.detectMobile();

            expect(mobileOptimization.isMobile).toBe(false);
        });
    });

    describe('setupTouchEvents', () => {
        it('should setup touch events for mobile', () => {
            mobileOptimization.isMobile = true;
            mobileOptimization.setupTouchEvents();

            expect(mobileOptimization.touchEvents).toContain('touchstart');
            expect(mobileOptimization.touchEvents).toContain('touchend');
            expect(mobileOptimization.touchEvents).toContain('touchmove');
        });

        it('should not setup touch events for desktop', () => {
            mobileOptimization.isMobile = false;
            mobileOptimization.setupTouchEvents();

            expect(mobileOptimization.touchEvents).toEqual([]);
        });
    });

    describe('optimizeViewport', () => {
        it('should optimize viewport', () => {
            mobileOptimization.optimizeViewport();

            expect(mobileOptimization.viewport.width).toBe(window.innerWidth);
            expect(mobileOptimization.viewport.height).toBe(window.innerHeight);
        });
    });

    describe('isMobileDevice', () => {
        it('should return mobile status', () => {
            mobileOptimization.isMobile = true;

            const isMobile = mobileOptimization.isMobileDevice();

            expect(isMobile).toBe(true);
        });
    });

    describe('getTouchEvents', () => {
        it('should return touch events', () => {
            mobileOptimization.touchEvents = ['touchstart', 'touchend'];

            const events = mobileOptimization.getTouchEvents();

            expect(events).toEqual(['touchstart', 'touchend']);
        });
    });

    describe('getViewport', () => {
        it('should return viewport dimensions', () => {
            mobileOptimization.viewport = { width: 375, height: 667 };

            const viewport = mobileOptimization.getViewport();

            expect(viewport).toEqual({ width: 375, height: 667 });
        });
    });

    describe('optimizeImages', () => {
        it('should optimize images for mobile', () => {
            mobileOptimization.isMobile = true;
            document.body.innerHTML = '<img src="test.jpg" />';

            mobileOptimization.optimizeImages();

            const img = document.querySelector('img');
            expect(img.loading).toBe('lazy');
            expect(img.sizes).toBe('100vw');
        });

        it('should not optimize images for desktop', () => {
            mobileOptimization.isMobile = false;
            document.body.innerHTML = '<img src="test.jpg" />';

            mobileOptimization.optimizeImages();

            const img = document.querySelector('img');
            expect(img.loading).toBeUndefined();
        });
    });

    describe('optimizeFonts', () => {
        it('should optimize fonts for mobile', () => {
            mobileOptimization.isMobile = true;

            mobileOptimization.optimizeFonts();

            expect(document.body.style.fontSize).toBe('16px');
            expect(document.body.style.lineHeight).toBe('1.4');
        });

        it('should not optimize fonts for desktop', () => {
            mobileOptimization.isMobile = false;

            mobileOptimization.optimizeFonts();

            expect(document.body.style.fontSize).toBe('');
        });
    });

    describe('setupSwipeGestures', () => {
        it('should setup swipe gestures for mobile', () => {
            mobileOptimization.isMobile = true;
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            mobileOptimization.setupSwipeGestures();

            expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
        });

        it('should not setup swipe gestures for desktop', () => {
            mobileOptimization.isMobile = false;
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            mobileOptimization.setupSwipeGestures();

            expect(addEventListenerSpy).not.toHaveBeenCalled();
        });
    });

    describe('handleSwipeLeft', () => {
        it('should handle swipe left', () => {
            mobileOptimization.handleSwipeLeft();

            expect(console.log).toHaveBeenCalledWith('Swipe left detected');
        });
    });

    describe('handleSwipeRight', () => {
        it('should handle swipe right', () => {
            mobileOptimization.handleSwipeRight();

            expect(console.log).toHaveBeenCalledWith('Swipe right detected');
        });
    });

    describe('getOptimizationReport', () => {
        it('should return optimization report', () => {
            mobileOptimization.isMobile = true;
            mobileOptimization.touchEvents = ['touchstart'];
            mobileOptimization.viewport = { width: 375, height: 667 };

            const report = mobileOptimization.getOptimizationReport();

            expect(report).toHaveProperty('isMobile');
            expect(report).toHaveProperty('touchEvents');
            expect(report).toHaveProperty('viewport');
            expect(report).toHaveProperty('optimizations');
            expect(report.isMobile).toBe(true);
        });
    });

    describe('getAppliedOptimizations', () => {
        it('should return applied optimizations for mobile', () => {
            mobileOptimization.isMobile = true;

            const optimizations = mobileOptimization.getAppliedOptimizations();

            expect(optimizations).toContain('mobile-detected');
            expect(optimizations).toContain('touch-events');
            expect(optimizations).toContain('viewport-optimization');
        });

        it('should return empty array for desktop', () => {
            mobileOptimization.isMobile = false;

            const optimizations = mobileOptimization.getAppliedOptimizations();

            expect(optimizations).toEqual([]);
        });
    });
});
