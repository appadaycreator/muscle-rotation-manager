// securityManager.test.js - securityManagerのテスト

import { SecurityManager } from '../../js/utils/securityManager.js';

describe('SecurityManager', () => {
  let securityManager;

  beforeEach(() => {
    securityManager = new SecurityManager();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(securityManager).toBeDefined();
      expect(securityManager.isEnabled).toBe(false);
    });
  });

  describe('enable', () => {
    test('should enable security manager', () => {
      securityManager.enable();
      expect(securityManager.isEnabled).toBe(true);
    });
  });

  describe('disable', () => {
    test('should disable security manager', () => {
      securityManager.enable();
      securityManager.disable();
      expect(securityManager.isEnabled).toBe(false);
    });
  });

  describe('validateInput', () => {
    test('should validate safe input when enabled', () => {
      securityManager.enable();
      const result = securityManager.validateInput('safe input');
      expect(result).toBe(true);
    });

    test('should reject XSS input when enabled', () => {
      securityManager.enable();
      const result = securityManager.validateInput('<script>alert("xss")</script>');
      expect(result).toBe(false);
    });

    test('should always return true when disabled', () => {
      const result = securityManager.validateInput('<script>alert("xss")</script>');
      expect(result).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize malicious input when enabled', () => {
      securityManager.enable();
      const result = securityManager.sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });

    test('should return original input when disabled', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = securityManager.sanitizeInput(maliciousInput);
      expect(result).toBe(maliciousInput);
    });
  });

  describe('blockRequest', () => {
    test('should block request with reason', () => {
      securityManager.enable();
      securityManager.blockRequest('suspicious-request', 'XSS detected');
      
      const blockedRequests = securityManager.getBlockedRequests();
      expect(blockedRequests).toHaveLength(1);
      expect(blockedRequests[0].reason).toBe('XSS detected');
    });
  });

  describe('getBlockedRequests', () => {
    test('should return blocked requests', () => {
      securityManager.enable();
      securityManager.blockRequest('test-request', 'Test reason');
      
      const blockedRequests = securityManager.getBlockedRequests();
      expect(Array.isArray(blockedRequests)).toBe(true);
    });
  });

  describe('clearBlockedRequests', () => {
    test('should clear all blocked requests', () => {
      securityManager.enable();
      securityManager.blockRequest('test-request', 'Test reason');
      securityManager.clearBlockedRequests();
      
      const blockedRequests = securityManager.getBlockedRequests();
      expect(blockedRequests).toHaveLength(0);
    });
  });

  describe('getSecurityRules', () => {
    test('should return security rules', () => {
      const rules = securityManager.getSecurityRules();
      expect(typeof rules).toBe('object');
    });
  });

  describe('updateSecurityRule', () => {
    test('should update security rule', () => {
      securityManager.updateSecurityRule('xss-protection', { enabled: true });
      const rules = securityManager.getSecurityRules();
      expect(rules).toBeDefined();
    });
  });

  describe('generateSecurityReport', () => {
    test('should generate security report', () => {
      const report = securityManager.generateSecurityReport();
      expect(report).toBeDefined();
      expect(typeof report).toBe('object');
    });
  });

  describe('calculateSecurityScore', () => {
    test('should calculate security score when enabled', () => {
      securityManager.enable();
      const score = securityManager.calculateSecurityScore();
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should return 0 when disabled', () => {
      const score = securityManager.calculateSecurityScore();
      expect(score).toBe(0);
    });
  });

  describe('isSecurityEnabled', () => {
    test('should return security status', () => {
      expect(securityManager.isSecurityEnabled()).toBe(false);
      
      securityManager.enable();
      expect(securityManager.isSecurityEnabled()).toBe(true);
    });
  });
});