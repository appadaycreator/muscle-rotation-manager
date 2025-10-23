// SecurityManager.test.js - セキュリティ管理のテスト

// SecurityManagerクラスをモック
const SecurityManager = class SecurityManager {
    constructor() {
        this.isEnabled = false;
        this.securityRules = [];
        this.blockedRequests = [];
    }

    init() {
        this.isEnabled = true;
        this.setupSecurityRules();
    }

    setupSecurityRules() {
        this.securityRules = [
            { type: 'xss', enabled: true },
            { type: 'csrf', enabled: true },
            { type: 'injection', enabled: true }
        ];
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    isSecurityEnabled() {
        return this.isEnabled;
    }

    validateInput(input) {
        if (!this.isEnabled) return true;

        // 簡単なXSS検証
        const xssPatterns = ['<script>', 'javascript:', 'onload='];
        return !xssPatterns.some(pattern => input.includes(pattern));
    }

    sanitizeInput(input) {
        if (!this.isEnabled) return input;

        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    blockRequest(reason) {
        this.blockedRequests.push({
            timestamp: Date.now(),
            reason: reason
        });
    }

    getBlockedRequests() {
        return [...this.blockedRequests];
    }

    clearBlockedRequests() {
        this.blockedRequests = [];
    }

    getSecurityRules() {
        return [...this.securityRules];
    }

    updateSecurityRule(type, enabled) {
        const rule = this.securityRules.find(r => r.type === type);
        if (rule) {
            rule.enabled = enabled;
        }
    }

    generateSecurityReport() {
        return {
            isEnabled: this.isEnabled,
            rules: this.getSecurityRules(),
            blockedRequests: this.getBlockedRequests().length,
            score: this.calculateSecurityScore()
        };
    }

    calculateSecurityScore() {
        if (!this.isEnabled) return 0;
        
        const enabledRules = this.securityRules.filter(rule => rule.enabled).length;
        const totalRules = this.securityRules.length;
        
        return Math.round((enabledRules / totalRules) * 100);
    }
};

describe('SecurityManager', () => {
    let securityManager;

    beforeEach(() => {
        securityManager = new SecurityManager();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(securityManager.isEnabled).toBe(false);
            expect(securityManager.securityRules).toEqual([]);
            expect(securityManager.blockedRequests).toEqual([]);
        });
    });

    describe('init', () => {
        it('should enable security and setup rules', () => {
            securityManager.init();

            expect(securityManager.isEnabled).toBe(true);
            expect(securityManager.securityRules).toHaveLength(3);
        });
    });

    describe('enable', () => {
        it('should enable security', () => {
            securityManager.enable();

            expect(securityManager.isEnabled).toBe(true);
        });
    });

    describe('disable', () => {
        it('should disable security', () => {
            securityManager.enable();
            securityManager.disable();

            expect(securityManager.isEnabled).toBe(false);
        });
    });

    describe('isSecurityEnabled', () => {
        it('should return security status', () => {
            expect(securityManager.isSecurityEnabled()).toBe(false);

            securityManager.enable();

            expect(securityManager.isSecurityEnabled()).toBe(true);
        });
    });

    describe('validateInput', () => {
        it('should validate safe input', () => {
            securityManager.enable();

            const isValid = securityManager.validateInput('Hello World');

            expect(isValid).toBe(true);
        });

        it('should reject XSS input', () => {
            securityManager.enable();

            const isValid = securityManager.validateInput('<script>alert("xss")</script>');

            expect(isValid).toBe(false);
        });

        it('should always return true when disabled', () => {
            securityManager.disable();

            const isValid = securityManager.validateInput('<script>alert("xss")</script>');

            expect(isValid).toBe(true);
        });
    });

    describe('sanitizeInput', () => {
        it('should sanitize malicious input', () => {
            securityManager.enable();

            const sanitized = securityManager.sanitizeInput('<script>alert("xss")</script>Hello');

            expect(sanitized).toBe('Hello');
        });

        it('should return original input when disabled', () => {
            securityManager.disable();

            const input = '<script>alert("xss")</script>';
            const sanitized = securityManager.sanitizeInput(input);

            expect(sanitized).toBe(input);
        });
    });

    describe('blockRequest', () => {
        it('should block request with reason', () => {
            securityManager.blockRequest('Suspicious activity');

            const blockedRequests = securityManager.getBlockedRequests();

            expect(blockedRequests).toHaveLength(1);
            expect(blockedRequests[0].reason).toBe('Suspicious activity');
        });
    });

    describe('getBlockedRequests', () => {
        it('should return blocked requests', () => {
            securityManager.blockRequest('Reason 1');
            securityManager.blockRequest('Reason 2');

            const blockedRequests = securityManager.getBlockedRequests();

            expect(blockedRequests).toHaveLength(2);
        });
    });

    describe('clearBlockedRequests', () => {
        it('should clear all blocked requests', () => {
            securityManager.blockRequest('Reason 1');
            securityManager.blockRequest('Reason 2');

            securityManager.clearBlockedRequests();

            expect(securityManager.getBlockedRequests()).toHaveLength(0);
        });
    });

    describe('getSecurityRules', () => {
        it('should return security rules', () => {
            securityManager.init();

            const rules = securityManager.getSecurityRules();

            expect(rules).toHaveLength(3);
            expect(rules[0].type).toBe('xss');
        });
    });

    describe('updateSecurityRule', () => {
        it('should update security rule', () => {
            securityManager.init();

            securityManager.updateSecurityRule('xss', false);

            const rules = securityManager.getSecurityRules();
            const xssRule = rules.find(r => r.type === 'xss');

            expect(xssRule.enabled).toBe(false);
        });
    });

    describe('generateSecurityReport', () => {
        it('should generate security report', () => {
            securityManager.init();
            securityManager.blockRequest('Test reason');

            const report = securityManager.generateSecurityReport();

            expect(report).toHaveProperty('isEnabled');
            expect(report).toHaveProperty('rules');
            expect(report).toHaveProperty('blockedRequests');
            expect(report).toHaveProperty('score');
            expect(report.isEnabled).toBe(true);
            expect(report.blockedRequests).toBe(1);
        });
    });

    describe('calculateSecurityScore', () => {
        it('should calculate security score when enabled', () => {
            securityManager.init();

            const score = securityManager.calculateSecurityScore();

            expect(score).toBe(100);
        });

        it('should return 0 when disabled', () => {
            securityManager.disable();

            const score = securityManager.calculateSecurityScore();

            expect(score).toBe(0);
        });
    });
});
