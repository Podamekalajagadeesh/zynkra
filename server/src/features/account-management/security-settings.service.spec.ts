import { SecuritySettingsService } from './security-settings.service';
import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../security-audit/entities/security-audit.entity';

describe('SecuritySettingsService', () => {
  it('reads persisted security logs from the real audit log service', async () => {
    const securityAuditService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      getUserAuditLog: jest.fn().mockResolvedValue({
        logs: [
          {
            id: 'audit-2',
            userId: 'user-1',
            eventType: SecurityEventType.LOGIN_SUCCESS,
            severity: SecurityEventSeverity.HIGH,
            message: 'User signed in successfully',
            metadata: { sessionId: 'session-1', location: 'London' },
            ipAddress: '127.0.0.1',
            userAgent: 'jest',
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
        ],
        total: 1,
      }),
      exportUserAuditLog: jest.fn(),
      cleanupOldLogs: jest.fn(),
    };

    const service = new SecuritySettingsService(securityAuditService as any);
    const logs = await service.getSecurityAuditLog('user-1', 20);

    expect(securityAuditService.getUserAuditLog).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ take: 20, skip: 0 })
    );
    expect(logs[0]).toMatchObject({
      accountId: 'user-1',
      eventType: SecurityEventType.LOGIN_SUCCESS,
      description: 'User signed in successfully',
      ipAddress: '127.0.0.1',
      location: 'London',
      status: 'failed',
    });
  });

  it('persists security changes to the real audit log service', async () => {
    const securityAuditService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      getUserAuditLog: jest.fn(),
      exportUserAuditLog: jest.fn(),
      cleanupOldLogs: jest.fn(),
    };

    const service = new SecuritySettingsService(securityAuditService as any);

    await service.updateSecuritySettings('user-1', { twoFactorAuthentication: true }, 'admin-1');

    expect(securityAuditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        eventType: SecurityEventType.PRIVACY_SETTINGS_CHANGED,
        severity: SecurityEventSeverity.LOW,
        message: 'Security settings updated',
        metadata: expect.objectContaining({
          changes: expect.objectContaining({
            twoFactorAuthentication: true,
          }),
          modifiedBy: 'admin-1',
        }),
      })
    );
  });

  describe('getSecurityRiskAssessment', () => {
    function makeService(user: Record<string, any> | null, counts: Record<string, number> = {}) {
      return new SecuritySettingsService(
        undefined,
        { findOne: jest.fn().mockResolvedValue(user) } as any,
        { count: jest.fn().mockResolvedValue(counts.passkeys ?? 0) } as any,
        { count: jest.fn().mockResolvedValue(counts.failedLogins ?? 0) } as any,
        { count: jest.fn().mockResolvedValue(counts.activeSessions ?? 0) } as any
      );
    }

    it('does NOT tell a user with 2FA enabled to enable 2FA', async () => {
      // Regression: this read `twoFactorAuthentication` from an in-process map
      // that nothing outside the service ever wrote, while the real state lives
      // on `User.twoFactorEnabled`. Users WITH 2FA were told to turn it on and
      // lost 25 risk points.
      const service = makeService(
        {
          id: 'user-1',
          emailVerified: true,
          twoFactorEnabled: true,
          recoveryCodeHashes: ['a', 'b'],
        },
        { passkeys: 1, failedLogins: 0, activeSessions: 2 }
      );

      const result = await service.getSecurityRiskAssessment('user-1');

      expect(result.signals.twoFactorEnabled).toBe(true);
      expect(result.recommendations.join(' ')).not.toMatch(/two-factor/i);
      expect(result.score).toBe(100);
      expect(result.riskLevel).toBe('low');
    });

    it('does recommend 2FA when it is genuinely off', async () => {
      const service = makeService(
        {
          id: 'user-1',
          emailVerified: true,
          twoFactorEnabled: false,
          recoveryCodeHashes: ['a'],
        },
        { passkeys: 1 }
      );

      const result = await service.getSecurityRiskAssessment('user-1');
      expect(result.signals.twoFactorEnabled).toBe(false);
      expect(result.recommendations.join(' ')).toMatch(/two-factor/i);
      expect(result.score).toBeLessThan(100);
    });

    it('counts failed sign-ins from the persisted audit log', async () => {
      const service = makeService(
        {
          id: 'user-1',
          emailVerified: true,
          twoFactorEnabled: true,
          recoveryCodeHashes: ['a'],
        },
        { passkeys: 1, failedLogins: 9, activeSessions: 1 }
      );

      const result = await service.getSecurityRiskAssessment('user-1');
      expect(result.signals.failedLoginsLast7Days).toBe(9);
      expect(result.recommendations.join(' ')).toMatch(/failed sign-in attempts/i);
    });

    it('penalises an unverified email', async () => {
      const service = makeService(
        {
          id: 'user-1',
          emailVerified: false,
          twoFactorEnabled: true,
          recoveryCodeHashes: ['a'],
        },
        { passkeys: 1 }
      );

      const result = await service.getSecurityRiskAssessment('user-1');
      expect(result.recommendations.join(' ')).toMatch(/verify your email/i);
    });

    it('reports unenforced controls instead of implying they protect the account', async () => {
      const service = makeService({ id: 'user-1', emailVerified: true, twoFactorEnabled: true });
      const result = await service.getSecurityRiskAssessment('user-1');
      expect(result.notEnforced).toEqual(
        expect.arrayContaining([expect.stringContaining('sessionTimeout')])
      );
    });

    it('returns high risk for an unknown account', async () => {
      const service = makeService(null);
      const result = await service.getSecurityRiskAssessment('ghost');
      expect(result.riskLevel).toBe('high');
      expect(result.score).toBe(0);
    });

    it('flags an unusual number of active sessions', async () => {
      const service = makeService(
        { id: 'user-1', emailVerified: true, twoFactorEnabled: true, recoveryCodeHashes: ['a'] },
        { passkeys: 1, activeSessions: 25 }
      );
      const result = await service.getSecurityRiskAssessment('user-1');
      expect(result.signals.activeSessions).toBe(25);
      expect(result.recommendations.join(' ')).toMatch(/active sessions/i);
    });
  });
});
