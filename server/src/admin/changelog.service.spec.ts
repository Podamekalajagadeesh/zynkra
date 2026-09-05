import { ConflictException } from '@nestjs/common';
import { ChangelogService } from './changelog.service';

function createRepositoryMock() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => ({ id: 'entry-1', ...input })),
  };
}

describe('ChangelogService', () => {
  it('lists entries newest first with a bounded limit', async () => {
    const repository = createRepositoryMock();
    repository.find.mockResolvedValue([]);
    const service = new ChangelogService(repository as never);

    await service.list(500);

    expect(repository.find).toHaveBeenCalledWith({ order: { publishedAt: 'DESC' }, take: 100 });
  });

  it('publishes a timestamped entry with structured changes', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = new ChangelogService(repository as never);

    const result = await service.publish({
      version: '1.4.0',
      title: 'Changelog is live',
      body: 'Release notes are now public.',
      changes: ['Added persistence', 'Added public page'],
    });

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      version: '1.4.0',
      changes: ['Added persistence', 'Added public page'],
      publishedAt: expect.any(Date),
    }));
    expect(result.id).toBe('entry-1');
  });

  it('rejects duplicate versions', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({ id: 'existing' });
    const service = new ChangelogService(repository as never);

    await expect(service.publish({
      version: '1.4.0',
      title: 'Duplicate',
      body: 'Duplicate release.',
      changes: ['Nothing new'],
    })).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
