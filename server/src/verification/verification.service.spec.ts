import { BadRequestException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationAppealStatus } from './entities/verification-appeal.entity';
import {
  VerificationCategory,
  VerificationStatus,
  VerificationWorkflow,
} from './entities/verification-request.entity';

describe('VerificationService appeals', () => {
  it('allows an appeal for a rejected request and places the request under review', async () => {
    const user = { id: 'user-1', verified: false } as any;
    const request = {
      id: 'req-1',
      user,
      userId: 'user-1',
      status: VerificationStatus.REJECTED,
      workflow: VerificationWorkflow.PERSONAL,
      category: VerificationCategory.CREATOR,
      justification: 'I am a creator with verified media coverage.',
      links: ['https://example.com/profile'],
      reviewNote: 'Not enough identity proof',
    } as any;

    const appealsRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => payload),
    };

    const requestsRepo = {
      findOne: jest.fn().mockResolvedValue(request),
      save: jest.fn(async (payload) => payload),
      create: jest.fn((payload) => payload),
    };

    const usersRepo = {
      findOne: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue({}),
      save: jest.fn(async (payload) => payload),
    };

    const service = new VerificationService(
      requestsRepo as any,
      usersRepo as any,
      appealsRepo as any,
    );

    const appeal = await service.submitAppeal('user-1', 'req-1', {
      appealReason: 'I have submitted additional government ID and a recent creator portfolio.',
      documentUrls: ['https://example.com/id.pdf'],
      links: ['https://example.com/portfolio'],
    });

    expect(appeal.status).toBe(VerificationAppealStatus.PENDING);
    expect(request.status).toBe(VerificationStatus.UNDER_REVIEW);
  });

  it('blocks a second appeal before the cooldown window expires', async () => {
    const user = { id: 'user-1', verified: false } as any;
    const request = {
      id: 'req-1',
      user,
      userId: 'user-1',
      status: VerificationStatus.REJECTED,
      workflow: VerificationWorkflow.PERSONAL,
      category: VerificationCategory.CREATOR,
      justification: 'I am a creator with verified media coverage.',
      links: ['https://example.com/profile'],
    } as any;

    const existingAppeal = {
      status: VerificationAppealStatus.REJECTED,
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    } as any;

    const requestsRepo = {
      findOne: jest.fn().mockResolvedValue(request),
      save: jest.fn(async (payload) => payload),
    };

    const appealsRepo = {
      find: jest.fn().mockResolvedValue([existingAppeal]),
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => payload),
    };

    const usersRepo = {
      findOne: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue({}),
      save: jest.fn(async (payload) => payload),
    };

    const service = new VerificationService(
      requestsRepo as any,
      usersRepo as any,
      appealsRepo as any,
    );

    await expect(
      service.submitAppeal('user-1', 'req-1', {
        appealReason: 'I have more evidence showing the incorrect rejection.',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
