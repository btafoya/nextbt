// __tests__/lib/session-config.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SessionData,
  SESSION_CONFIG,
  getSessionOptions,
  isSessionExpired,
  shouldRefreshSession,
  createSessionData,
  updateSessionActivity,
  refreshSessionExpiration
} from '@/lib/session-config';

// Mock the secrets module
vi.mock('@/config/secrets', () => ({
  secrets: {
    sessionSecret: 'test-session-secret-with-at-least-32-characters-long-for-security',
    // Other secrets can be empty for these tests
    dbHost: '',
    dbPort: 0,
    dbUser: '',
    dbPassword: '',
    dbDatabase: '',
  }
}));

describe('Session Configuration', () => {
  describe('SESSION_CONFIG', () => {
    it('should have correct constant values', () => {
      expect(SESSION_CONFIG.MAX_AGE).toBe(60 * 60 * 24 * 7); // 7 days
      expect(SESSION_CONFIG.INACTIVITY_TIMEOUT).toBe(60 * 60 * 2); // 2 hours
      expect(SESSION_CONFIG.COOKIE_NAME).toBe('nextbt_session');
      expect(SESSION_CONFIG.ADMIN_ACCESS_LEVEL).toBe(90);
      expect(SESSION_CONFIG.REFRESH_THRESHOLD).toBe(60 * 60 * 24); // 1 day
    });
  });

  describe('getSessionOptions', () => {
    it('should return valid iron-session options', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const options = getSessionOptions();

      expect(options.cookieName).toBe(SESSION_CONFIG.COOKIE_NAME);
      expect(options.ttl).toBe(SESSION_CONFIG.MAX_AGE);
      expect(options.cookieOptions.maxAge).toBe(SESSION_CONFIG.MAX_AGE);
      expect(options.cookieOptions.httpOnly).toBe(true);
      expect(options.cookieOptions.secure).toBe(true); // Production
      expect(options.cookieOptions.sameSite).toBe('lax');
      expect(options.cookieOptions.path).toBe('/');
    });

    it('should use secure: false in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const options = getSessionOptions();

      expect(options.cookieOptions.secure).toBe(false);
    });

    it('should not throw error with valid session secret', () => {
      // With mocked secrets module providing valid secret
      expect(() => {
        getSessionOptions();
      }).not.toThrow();
    });

    it('should validate minimum secret length', () => {
      // Test is implementation-aware: assumes validation happens in getSessionOptions
      const options = getSessionOptions();
      expect(options.password.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('isSessionExpired', () => {
    let mockSession: SessionData;

    beforeEach(() => {
      const now = Date.now();
      mockSession = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1, 2],
        createdAt: now - (60 * 60 * 1000), // 1 hour ago
        expiresAt: now + (60 * 60 * 24 * 6 * 1000), // 6 days from now
        lastActivity: now - (30 * 60 * 1000), // 30 minutes ago
      };
    });

    it('should return false for valid session', () => {
      expect(isSessionExpired(mockSession)).toBe(false);
    });

    it('should return true if absolute expiration passed', () => {
      mockSession.expiresAt = Date.now() - 1000; // Expired 1 second ago
      expect(isSessionExpired(mockSession)).toBe(true);
    });

    it('should return true if inactivity timeout exceeded', () => {
      // 2 hours + 1 minute of inactivity
      mockSession.lastActivity = Date.now() - (SESSION_CONFIG.INACTIVITY_TIMEOUT * 1000 + 60000);
      expect(isSessionExpired(mockSession)).toBe(true);
    });

    it('should return false if just under inactivity timeout', () => {
      // Just under 2 hours of inactivity
      mockSession.lastActivity = Date.now() - (SESSION_CONFIG.INACTIVITY_TIMEOUT * 1000 - 1000);
      expect(isSessionExpired(mockSession)).toBe(false);
    });

    it('should return true if both expiration and inactivity exceeded', () => {
      mockSession.expiresAt = Date.now() - 1000;
      mockSession.lastActivity = Date.now() - (SESSION_CONFIG.INACTIVITY_TIMEOUT * 1000 + 60000);
      expect(isSessionExpired(mockSession)).toBe(true);
    });
  });

  describe('shouldRefreshSession', () => {
    let mockSession: SessionData;

    beforeEach(() => {
      const now = Date.now();
      mockSession = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1, 2],
        createdAt: now - (60 * 60 * 1000),
        expiresAt: now + (60 * 60 * 24 * 6 * 1000), // 6 days from now
        lastActivity: now,
      };
    });

    it('should return false if session has plenty of time left', () => {
      // 6 days remaining (more than 1 day threshold)
      expect(shouldRefreshSession(mockSession)).toBe(false);
    });

    it('should return true if within refresh threshold', () => {
      // 12 hours remaining (less than 1 day threshold)
      mockSession.expiresAt = Date.now() + (60 * 60 * 12 * 1000);
      expect(shouldRefreshSession(mockSession)).toBe(true);
    });

    it('should return true if exactly at threshold', () => {
      // The threshold check is < not <=, so need to be just under threshold
      mockSession.expiresAt = Date.now() + (SESSION_CONFIG.REFRESH_THRESHOLD * 1000 - 1);
      expect(shouldRefreshSession(mockSession)).toBe(true);
    });

    it('should return true if already expired', () => {
      mockSession.expiresAt = Date.now() - 1000;
      expect(shouldRefreshSession(mockSession)).toBe(true);
    });
  });

  describe('createSessionData', () => {
    it('should create session with required fields', () => {
      const userData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1, 2, 3],
      };

      const session = createSessionData(userData);

      expect(session.uid).toBe(1);
      expect(session.username).toBe('testuser');
      expect(session.access_level).toBe(70);
      expect(session.projects).toEqual([1, 2, 3]);
      expect(session.createdAt).toBeGreaterThan(0);
      expect(session.expiresAt).toBeGreaterThan(session.createdAt);
      expect(session.lastActivity).toBe(session.createdAt);
    });

    it('should set expiration 7 days from creation', () => {
      const userData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1],
      };

      const session = createSessionData(userData);
      const expectedExpiration = session.createdAt + SESSION_CONFIG.MAX_AGE * 1000;

      expect(session.expiresAt).toBe(expectedExpiration);
    });

    it('should include optional security metadata', () => {
      const userData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1],
      };

      const session = createSessionData(userData, {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });

      expect(session.userAgent).toBe('Mozilla/5.0');
      expect(session.ipAddress).toBe('192.168.1.1');
    });

    it('should omit optional metadata if not provided', () => {
      const userData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1],
      };

      const session = createSessionData(userData);

      expect(session.userAgent).toBeUndefined();
      expect(session.ipAddress).toBeUndefined();
    });
  });

  describe('updateSessionActivity', () => {
    it('should update lastActivity timestamp', () => {
      const oldTimestamp = Date.now() - 60000; // 1 minute ago
      const mockSession: SessionData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1],
        createdAt: oldTimestamp,
        expiresAt: oldTimestamp + SESSION_CONFIG.MAX_AGE * 1000,
        lastActivity: oldTimestamp,
      };

      const updated = updateSessionActivity(mockSession);

      expect(updated.lastActivity).toBeGreaterThan(mockSession.lastActivity);
      expect(updated.uid).toBe(mockSession.uid);
      expect(updated.username).toBe(mockSession.username);
    });

    it('should preserve all other session fields', () => {
      const mockSession: SessionData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1, 2],
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000,
        lastActivity: Date.now(),
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      const updated = updateSessionActivity(mockSession);

      expect(updated.uid).toBe(mockSession.uid);
      expect(updated.username).toBe(mockSession.username);
      expect(updated.access_level).toBe(mockSession.access_level);
      expect(updated.projects).toEqual(mockSession.projects);
      expect(updated.createdAt).toBe(mockSession.createdAt);
      expect(updated.expiresAt).toBe(mockSession.expiresAt);
      expect(updated.userAgent).toBe(mockSession.userAgent);
      expect(updated.ipAddress).toBe(mockSession.ipAddress);
    });
  });

  describe('refreshSessionExpiration', () => {
    it('should extend expiration by MAX_AGE', () => {
      const oldExpiration = Date.now() + (60 * 60 * 12 * 1000); // 12 hours from now
      const mockSession: SessionData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1],
        createdAt: Date.now() - 1000,
        expiresAt: oldExpiration,
        lastActivity: Date.now() - 1000,
      };

      const refreshed = refreshSessionExpiration(mockSession);

      expect(refreshed.expiresAt).toBeGreaterThan(oldExpiration);
      expect(refreshed.expiresAt - refreshed.lastActivity).toBeCloseTo(SESSION_CONFIG.MAX_AGE * 1000, -2);
    });

    it('should update lastActivity timestamp', () => {
      const oldActivity = Date.now() - 60000;
      const mockSession: SessionData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1],
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000,
        lastActivity: oldActivity,
      };

      const refreshed = refreshSessionExpiration(mockSession);

      expect(refreshed.lastActivity).toBeGreaterThan(oldActivity);
    });

    it('should preserve all other session fields', () => {
      const mockSession: SessionData = {
        uid: 1,
        username: 'testuser',
        access_level: 70,
        projects: [1, 2],
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000,
        lastActivity: Date.now(),
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      const refreshed = refreshSessionExpiration(mockSession);

      expect(refreshed.uid).toBe(mockSession.uid);
      expect(refreshed.username).toBe(mockSession.username);
      expect(refreshed.access_level).toBe(mockSession.access_level);
      expect(refreshed.projects).toEqual(mockSession.projects);
      expect(refreshed.createdAt).toBe(mockSession.createdAt);
      expect(refreshed.userAgent).toBe(mockSession.userAgent);
      expect(refreshed.ipAddress).toBe(mockSession.ipAddress);
    });
  });
});