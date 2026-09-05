import { SecuritySettingsService } from './security-settings.service';
import { SecurityEventType, SecurityEventSeverity } from '../../security-audit/entities/security-audit.entity';

describe('SecuritySettingsService', () => {
  it('reads persisted security logs from the real audit log service', async () => {
    const securityAuditService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      getUserAuditLog: jest.fn().mockResolvedValue({
        logs: [{
          id: 'audit-2',
          userId: 'user-1',
          eventType: SecurityEventType.LOGIN_SUCCESS,
          severity: SecurityEventSeverity.HIGH,
          message: 'User signed in successfully',
          metadata: { sessionId: 'session-1', location: 'London' },
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        }],
        total: 1,
      }),
      exportUserAuditLog: jest.fn(),
      cleanupOldLogs: jest.fn(),
    };

    const service = new SecuritySettingsService(securityAuditService as any);
    const logs = await service.getSecurityAuditLog('user-1', 20);

    expect(securityAuditService.getUserAuditLog).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ take: 20, skip: 0 }),
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
      }),
    );
  });
});
