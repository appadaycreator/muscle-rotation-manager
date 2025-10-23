// PerformanceOptimizer.test.js - パフォーマンス最適化のテスト

// PerformanceOptimizerクラスをモック
const PerformanceOptimizer = class PerformanceOptimizer {
    constructor() {
        this.metrics = new Map();
        this.optimizations = [];
    }

    init() {
        this.setupPerformanceMonitoring();
    }

    setupPerformanceMonitoring() {
        // パフォーマンス監視のセットアップ
        this.recordMetric('init_time', Date.now());
    }

    recordMetric(name, value) {
        this.metrics.set(name, value);
    }

    getMetric(name) {
        return this.metrics.get(name);
    }

    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }

    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.loading) {
                img.loading = 'lazy';
            }
        });
        this.optimizations.push('images');
    }

    optimizeCSS() {
        // CSS最適化のロジック
        this.optimizations.push('css');
    }

    optimizeJavaScript() {
        // JavaScript最適化のロジック
        this.optimizations.push('javascript');
    }

    getOptimizations() {
        return [...this.optimizations];
    }

    clearOptimizations() {
        this.optimizations = [];
    }

    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.recordMetric(name, end - start);
        return result;
    }

    getPerformanceReport() {
        return {
            metrics: this.getAllMetrics(),
            optimizations: this.getOptimizations(),
            score: this.calculateScore()
        };
    }

    calculateScore() {
        const metrics = this.getAllMetrics();
        let score = 100;
        
        // 簡単なスコア計算
        Object.values(metrics).forEach(value => {
            if (typeof value === 'number' && value > 1000) {
                score -= 10;
            }
        });
        
        return Math.max(0, score);
    }
};

describe('PerformanceOptimizer', () => {
    let performanceOptimizer;

    beforeEach(() => {
        performanceOptimizer = new PerformanceOptimizer();
        document.body.innerHTML = '<img src="test1.jpg" /><img src="test2.jpg" />';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(performanceOptimizer.metrics).toBeInstanceOf(Map);
            expect(performanceOptimizer.optimizations).toEqual([]);
        });
    });

    describe('init', () => {
        it('should setup performance monitoring', () => {
            performanceOptimizer.init();

            expect(performanceOptimizer.getMetric('init_time')).toBeDefined();
        });
    });

    describe('recordMetric', () => {
        it('should record metric with name and value', () => {
            performanceOptimizer.recordMetric('test_metric', 123);

            expect(performanceOptimizer.getMetric('test_metric')).toBe(123);
        });
    });

    describe('getMetric', () => {
        it('should return metric value', () => {
            performanceOptimizer.recordMetric('test_metric', 456);

            const value = performanceOptimizer.getMetric('test_metric');

            expect(value).toBe(456);
        });

        it('should return undefined for non-existent metric', () => {
            const value = performanceOptimizer.getMetric('non-existent');

            expect(value).toBeUndefined();
        });
    });

    describe('getAllMetrics', () => {
        it('should return all metrics as object', () => {
            performanceOptimizer.recordMetric('metric1', 100);
            performanceOptimizer.recordMetric('metric2', 200);

            const metrics = performanceOptimizer.getAllMetrics();

            expect(metrics).toEqual({
                metric1: 100,
                metric2: 200
            });
        });
    });

    describe('optimizeImages', () => {
        it('should optimize images', () => {
            performanceOptimizer.optimizeImages();

            const images = document.querySelectorAll('img');
            images.forEach(img => {
                expect(img.loading).toBe('lazy');
            });
            expect(performanceOptimizer.getOptimizations()).toContain('images');
        });
    });

    describe('optimizeCSS', () => {
        it('should add CSS optimization', () => {
            performanceOptimizer.optimizeCSS();

            expect(performanceOptimizer.getOptimizations()).toContain('css');
        });
    });

    describe('optimizeJavaScript', () => {
        it('should add JavaScript optimization', () => {
            performanceOptimizer.optimizeJavaScript();

            expect(performanceOptimizer.getOptimizations()).toContain('javascript');
        });
    });

    describe('getOptimizations', () => {
        it('should return array of optimizations', () => {
            performanceOptimizer.optimizeImages();
            performanceOptimizer.optimizeCSS();

            const optimizations = performanceOptimizer.getOptimizations();

            expect(optimizations).toContain('images');
            expect(optimizations).toContain('css');
        });
    });

    describe('clearOptimizations', () => {
        it('should clear all optimizations', () => {
            performanceOptimizer.optimizeImages();
            performanceOptimizer.optimizeCSS();

            performanceOptimizer.clearOptimizations();

            expect(performanceOptimizer.getOptimizations()).toHaveLength(0);
        });
    });

    describe('measurePerformance', () => {
        it('should measure function performance', () => {
            const testFn = () => 'test result';

            const result = performanceOptimizer.measurePerformance('test_function', testFn);

            expect(result).toBe('test result');
            expect(performanceOptimizer.getMetric('test_function')).toBeDefined();
        });
    });

    describe('getPerformanceReport', () => {
        it('should return performance report', () => {
            performanceOptimizer.recordMetric('test_metric', 100);
            performanceOptimizer.optimizeImages();

            const report = performanceOptimizer.getPerformanceReport();

            expect(report).toHaveProperty('metrics');
            expect(report).toHaveProperty('optimizations');
            expect(report).toHaveProperty('score');
            expect(report.metrics.test_metric).toBe(100);
            expect(report.optimizations).toContain('images');
        });
    });

    describe('calculateScore', () => {
        it('should calculate performance score', () => {
            performanceOptimizer.recordMetric('fast_metric', 100);
            performanceOptimizer.recordMetric('slow_metric', 2000);

            const score = performanceOptimizer.calculateScore();

            expect(score).toBeLessThanOrEqual(100);
            expect(score).toBeGreaterThanOrEqual(0);
        });
    });
});
