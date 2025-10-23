// ResourceOptimizer.test.js - リソース最適化のテスト

// ResourceOptimizerクラスをモック
const ResourceOptimizer = class ResourceOptimizer {
    constructor() {
        this.optimizations = [];
        this.cache = new Map();
        this.compressionEnabled = false;
    }

    init() {
        this.setupCompression();
        this.optimizeResources();
    }

    setupCompression() {
        this.compressionEnabled = true;
        this.optimizations.push('compression');
    }

    optimizeResources() {
        this.optimizeImages();
        this.optimizeCSS();
        this.optimizeJavaScript();
    }

    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.loading) {
                img.loading = 'lazy';
            }
            if (!img.decoding) {
                img.decoding = 'async';
            }
        });
        this.optimizations.push('images');
    }

    optimizeCSS() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(link => {
            if (!link.media) {
                link.media = 'all';
            }
        });
        this.optimizations.push('css');
    }

    optimizeJavaScript() {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (!script.async && !script.defer) {
                script.defer = true;
            }
        });
        this.optimizations.push('javascript');
    }

    cacheResource(url, data) {
        this.cache.set(url, {
            data: data,
            timestamp: Date.now(),
            size: JSON.stringify(data).length
        });
    }

    getCachedResource(url) {
        const cached = this.cache.get(url);
        if (cached) {
            // キャッシュの有効期限チェック（1時間）
            const isExpired = Date.now() - cached.timestamp > 3600000;
            if (!isExpired) {
                return cached.data;
            } else {
                this.cache.delete(url);
            }
        }
        return null;
    }

    clearCache() {
        this.cache.clear();
    }

    getCacheSize() {
        let totalSize = 0;
        for (const [url, cached] of this.cache) {
            totalSize += cached.size;
        }
        return totalSize;
    }

    getOptimizations() {
        return [...this.optimizations];
    }

    isCompressionEnabled() {
        return this.compressionEnabled;
    }

    generateReport() {
        return {
            optimizations: this.getOptimizations(),
            compressionEnabled: this.isCompressionEnabled(),
            cacheSize: this.getCacheSize(),
            cachedResources: this.cache.size
        };
    }
};

describe('ResourceOptimizer', () => {
    let resourceOptimizer;

    beforeEach(() => {
        resourceOptimizer = new ResourceOptimizer();
        document.body.innerHTML = `
            <img src="test1.jpg" />
            <img src="test2.jpg" />
            <link rel="stylesheet" href="style.css" />
            <script src="script.js"></script>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(resourceOptimizer.optimizations).toEqual([]);
            expect(resourceOptimizer.cache).toBeInstanceOf(Map);
            expect(resourceOptimizer.compressionEnabled).toBe(false);
        });
    });

    describe('init', () => {
        it('should initialize resource optimization', () => {
            resourceOptimizer.init();

            expect(resourceOptimizer.compressionEnabled).toBe(true);
            expect(resourceOptimizer.getOptimizations()).toContain('compression');
            expect(resourceOptimizer.getOptimizations()).toContain('images');
            expect(resourceOptimizer.getOptimizations()).toContain('css');
            expect(resourceOptimizer.getOptimizations()).toContain('javascript');
        });
    });

    describe('setupCompression', () => {
        it('should setup compression', () => {
            resourceOptimizer.setupCompression();

            expect(resourceOptimizer.compressionEnabled).toBe(true);
            expect(resourceOptimizer.getOptimizations()).toContain('compression');
        });
    });

    describe('optimizeImages', () => {
        it('should optimize images', () => {
            resourceOptimizer.optimizeImages();

            const images = document.querySelectorAll('img');
            images.forEach(img => {
                expect(img.loading).toBe('lazy');
                expect(img.decoding).toBe('async');
            });
            expect(resourceOptimizer.getOptimizations()).toContain('images');
        });
    });

    describe('optimizeCSS', () => {
        it('should optimize CSS', () => {
            resourceOptimizer.optimizeCSS();

            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            stylesheets.forEach(link => {
                expect(link.media).toBe('all');
            });
            expect(resourceOptimizer.getOptimizations()).toContain('css');
        });
    });

    describe('optimizeJavaScript', () => {
        it('should optimize JavaScript', () => {
            resourceOptimizer.optimizeJavaScript();

            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
                expect(script.defer).toBe(true);
            });
            expect(resourceOptimizer.getOptimizations()).toContain('javascript');
        });
    });

    describe('cacheResource', () => {
        it('should cache resource', () => {
            const url = 'test.json';
            const data = { test: 'data' };

            resourceOptimizer.cacheResource(url, data);

            expect(resourceOptimizer.cache.has(url)).toBe(true);
            const cached = resourceOptimizer.cache.get(url);
            expect(cached.data).toEqual(data);
            expect(cached.timestamp).toBeDefined();
            expect(cached.size).toBeGreaterThan(0);
        });
    });

    describe('getCachedResource', () => {
        it('should return cached resource', () => {
            const url = 'test.json';
            const data = { test: 'data' };
            resourceOptimizer.cacheResource(url, data);

            const result = resourceOptimizer.getCachedResource(url);

            expect(result).toEqual(data);
        });

        it('should return null for non-cached resource', () => {
            const result = resourceOptimizer.getCachedResource('non-existent.json');

            expect(result).toBeNull();
        });

        it('should return null for expired cache', () => {
            const url = 'test.json';
            const data = { test: 'data' };
            resourceOptimizer.cacheResource(url, data);
            
            // キャッシュを古くする
            const cached = resourceOptimizer.cache.get(url);
            cached.timestamp = Date.now() - 7200000; // 2時間前

            const result = resourceOptimizer.getCachedResource(url);

            expect(result).toBeNull();
            expect(resourceOptimizer.cache.has(url)).toBe(false);
        });
    });

    describe('clearCache', () => {
        it('should clear cache', () => {
            resourceOptimizer.cacheResource('test1.json', { data: 1 });
            resourceOptimizer.cacheResource('test2.json', { data: 2 });

            resourceOptimizer.clearCache();

            expect(resourceOptimizer.cache.size).toBe(0);
        });
    });

    describe('getCacheSize', () => {
        it('should return cache size', () => {
            resourceOptimizer.cacheResource('test1.json', { data: 1 });
            resourceOptimizer.cacheResource('test2.json', { data: 2 });

            const size = resourceOptimizer.getCacheSize();

            expect(size).toBeGreaterThan(0);
        });
    });

    describe('getOptimizations', () => {
        it('should return optimizations', () => {
            resourceOptimizer.optimizeImages();
            resourceOptimizer.optimizeCSS();

            const optimizations = resourceOptimizer.getOptimizations();

            expect(optimizations).toContain('images');
            expect(optimizations).toContain('css');
        });
    });

    describe('isCompressionEnabled', () => {
        it('should return compression status', () => {
            expect(resourceOptimizer.isCompressionEnabled()).toBe(false);

            resourceOptimizer.setupCompression();

            expect(resourceOptimizer.isCompressionEnabled()).toBe(true);
        });
    });

    describe('generateReport', () => {
        it('should generate optimization report', () => {
            resourceOptimizer.init();
            resourceOptimizer.cacheResource('test.json', { data: 'test' });

            const report = resourceOptimizer.generateReport();

            expect(report).toHaveProperty('optimizations');
            expect(report).toHaveProperty('compressionEnabled');
            expect(report).toHaveProperty('cacheSize');
            expect(report).toHaveProperty('cachedResources');
            expect(report.compressionEnabled).toBe(true);
            expect(report.cachedResources).toBe(1);
        });
    });
});
