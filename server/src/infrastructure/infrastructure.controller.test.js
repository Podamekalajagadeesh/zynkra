require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { InfrastructureController } = require('./infrastructure.controller');
const { InfrastructureService } = require('./infrastructure.service');
const { BackupService } = require('./backup.service');

test('infrastructure controller exposes health and backup capabilities', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [InfrastructureController],
    providers: [
      {
        provide: InfrastructureService,
        useValue: {
          getHealthSnapshot: async () => ({
            status: 'operational',
            services: {
              redis: { status: 'operational' },
              cdn: { status: 'operational' },
            },
          }),
          getStatusPage: async () => ({
            status: 'operational',
            services: { redis: { status: 'operational' } },
            activeIncidents: [],
            upcomingMaintenance: [],
            history: [],
          }),
          getHistory: async () => [],
          createIncident: async (body) => body,
          updateIncident: async (_id, body) => body,
          createMaintenance: async (body) => body,
          updateMaintenance: async (_id, body) => body,
        },
      },
      {
        provide: BackupService,
        useValue: {
          createBackup: async () => ({ success: true, archivePath: '/tmp/demo-backup.zip' }),
        },
      },
    ],
  }).compile();

  const controller = moduleRef.get(InfrastructureController);
  const snapshot = await controller.getHealth();
  const backup = await controller.triggerBackup();

  assert.equal(snapshot.status, 'operational');
  assert.equal(snapshot.services.redis.status, 'operational');
  assert.equal(backup.success, true);
  assert.match(backup.archivePath, /demo-backup\.zip$/);
});
