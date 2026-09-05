import { ConflictException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { SandboxEnvironmentsService } from './sandbox-environments.service';
import { SandboxEnvironmentStatus } from './entities/sandbox-environment.entity';

function createRepositoryMock() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => ({ id: 'sandbox-1', ...input })),
    update: jest.fn(),
  };
}

describe('SandboxEnvironmentsService', () => {
  it('creates an environment with a one-time access key and hashed storage', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = new SandboxEnvironmentsService(repository as never);

    const result = await service.create({ name: 'QA Environment', expiresInDays: 7 });

    expect(result).toEqual(expect.objectContaining({
      id: 'sandbox-1',
      slug: 'qa-environment',
      accessKey: expect.stringMatching(/^zk_sbx_/),
      status: SandboxEnvironmentStatus.ACTIVE,
    }));
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      accessKeyHash: expect.not.stringMatching(/^zk_sbx_/),
      expiresAt: expect.any(Date),
    }));
    expect(result).not.toHaveProperty('accessKeyHash');
  });

  it('rejects duplicate slugs', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({ id: 'existing' });
    const service = new SandboxEnvironmentsService(repository as never);

    await expect(service.create({ name: 'QA Environment' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates active, unexpired access keys and records usage', async () => {
    const accessKey = 'zk_sbx_test';
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({
      id: 'sandbox-1',
      slug: 'qa-environment',
      accessKeyHash: createHash('sha256').update(accessKey).digest('hex'),
      status: SandboxEnvironmentStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const service = new SandboxEnvironmentsService(repository as never);

    await expect(service.validateAccess('qa-environment', accessKey)).resolves.toBe(true);
    expect(repository.update).toHaveBeenCalledWith('sandbox-1', { lastUsedAt: expect.any(Date) });
  });

  it('rejects expired or archived environments', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({
      id: 'sandbox-1',
      accessKeyHash: 'hash',
      status: SandboxEnvironmentStatus.ARCHIVED,
      expiresAt: new Date(Date.now() - 60_000),
    });
    const service = new SandboxEnvironmentsService(repository as never);

    await expect(service.validateAccess('qa-environment', 'key')).resolves.toBe(false);
    repository.findOne.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});