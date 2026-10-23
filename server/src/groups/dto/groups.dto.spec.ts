import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateGroupDto } from './create-group.dto';
import { CreateChannelDto } from './create-channel.dto';
import { CreateProposalDto } from './create-proposal.dto';
import { CreateChallengeDto } from './create-challenge.dto';
import { UpdateChallengeDto } from './update-challenge.dto';
import { CreateContributionDto } from './create-contribution.dto';
import { CreateCalendarEventDto } from './create-calendar-event.dto';
import { CreateTodoItemDto } from './create-todo-item.dto';
import { CreateModMailConversationDto } from './create-modmail-conversation.dto';
import { ModMailMessageDto } from './modmail-message.dto';
import { GroupPrivacy } from '../enums/group-privacy.enum';
import { ChallengeType } from '../enums/challenge-type.enum';
import { ContributionType } from '../enums/contribution-type.enum';

// Mirrors the global ValidationPipe in main.ts (whitelist strips unknown
// properties; transform is on but there is no implicit type conversion).
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
});

async function transform<T>(metatype: new () => T, body: unknown): Promise<T> {
  return (await pipe.transform(body, { type: 'body', metatype })) as T;
}

async function expectRejected(metatype: new () => unknown, body: unknown): Promise<void> {
  await expect(transform(metatype as new () => unknown, body)).rejects.toBeInstanceOf(
    BadRequestException
  );
}

describe('Groups DTO validation (global ValidationPipe config)', () => {
  describe('CreateGroupDto', () => {
    it('accepts a valid group', async () => {
      const dto = await transform(CreateGroupDto, {
        name: 'My Group',
        privacy: GroupPrivacy.PUBLIC,
        allowAnonymousPosting: true,
      });
      expect(dto.name).toBe('My Group');
    });

    it('rejects an empty name', async () => {
      await expectRejected(CreateGroupDto, { name: '' });
    });

    it('rejects a name longer than 100 characters', async () => {
      await expectRejected(CreateGroupDto, { name: 'a'.repeat(101) });
    });

    it('rejects an unknown privacy value', async () => {
      await expectRejected(CreateGroupDto, { name: 'G', privacy: 'friends_only' });
    });

    it('strips unknown properties instead of failing (whitelist)', async () => {
      const dto = await transform(CreateGroupDto, {
        name: 'G',
        injectedField: 'should not land on the DTO',
      } as Record<string, unknown>);
      expect((dto as unknown as Record<string, unknown>).injectedField).toBeUndefined();
    });
  });

  describe('CreateChannelDto', () => {
    it('accepts a broadcast channel', async () => {
      const dto = await transform(CreateChannelDto, { name: 'announcements', type: 'broadcast' });
      expect(dto.type).toBe('broadcast');
    });

    it('rejects an unknown channel type', async () => {
      await expectRejected(CreateChannelDto, { name: 'x', type: 'secret' });
    });

    it('rejects a blank channel name', async () => {
      await expectRejected(CreateChannelDto, { name: '' });
    });
  });

  describe('CreateProposalDto', () => {
    it('accepts a valid proposal', async () => {
      const dto = await transform(CreateProposalDto, {
        title: 'Spend treasury?',
        description: 'Details here',
      });
      expect(dto.title).toBe('Spend treasury?');
    });

    it('rejects an empty description', async () => {
      await expectRejected(CreateProposalDto, { title: 'T', description: '' });
    });
  });

  describe('CreateChallengeDto', () => {
    const valid = {
      title: 'Plant 100 trees',
      description: 'City-wide drive',
      type: ChallengeType.GROUP_GOAL,
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.000Z',
      groupId: '11111111-1111-4111-8111-111111111111',
    };

    it('accepts a valid challenge', async () => {
      const dto = await transform(CreateChallengeDto, valid);
      expect(dto.title).toBe('Plant 100 trees');
    });

    it('rejects a non-ISO date string', async () => {
      await expectRejected(CreateChallengeDto, { ...valid, startDate: 'tomorrow' });
    });

    it('rejects goalParticipantCount below 1', async () => {
      await expectRejected(CreateChallengeDto, { ...valid, goalParticipantCount: 0 });
    });

    it('rejects a negative goalAmount', async () => {
      await expectRejected(CreateChallengeDto, { ...valid, goalAmount: -1 });
    });

    it('rejects a non-uuid groupId', async () => {
      await expectRejected(CreateChallengeDto, { ...valid, groupId: 'not-a-uuid' });
    });
  });

  describe('UpdateChallengeDto', () => {
    it('accepts an empty patch (all fields optional)', async () => {
      const dto = await transform(UpdateChallengeDto, {});
      expect(dto).toEqual({});
    });

    it('rejects a negative currentAmount', async () => {
      await expectRejected(UpdateChallengeDto, { currentAmount: -5 });
    });

    it('rejects a non-ISO endDate', async () => {
      await expectRejected(UpdateChallengeDto, { endDate: 'next week' });
    });
  });

  describe('CreateContributionDto', () => {
    it('accepts a valid contribution', async () => {
      const dto = await transform(CreateContributionDto, {
        type: ContributionType.MONETARY,
        amount: 25,
        challengeId: '33333333-3333-4333-8333-333333333333',
      });
      expect(dto.amount).toBe(25);
    });

    it('rejects a negative amount (used to decrement totals)', async () => {
      await expectRejected(CreateContributionDto, {
        type: ContributionType.MONETARY,
        amount: -10,
      });
    });

    it('rejects a non-uuid challengeId', async () => {
      await expectRejected(CreateContributionDto, {
        type: ContributionType.PARTICIPATION,
        challengeId: 'ch1',
      });
    });
  });

  describe('CreateCalendarEventDto', () => {
    const valid = {
      title: 'Standup',
      startTime: '2026-11-02T09:00:00.000Z',
      endTime: '2026-11-02T09:30:00.000Z',
    };

    it('accepts ISO datetime strings', async () => {
      const dto = await transform(CreateCalendarEventDto, valid);
      expect(dto.startTime).toBe(valid.startTime);
    });

    it('rejects a non-date startTime', async () => {
      await expectRejected(CreateCalendarEventDto, { ...valid, startTime: '9am sharp' });
    });

    it('rejects a missing endTime', async () => {
      await expectRejected(CreateCalendarEventDto, { title: 'x', startTime: valid.startTime });
    });
  });

  describe('CreateTodoItemDto', () => {
    it('accepts a valid task', async () => {
      const dto = await transform(CreateTodoItemDto, {
        title: 'Write brief',
        assigneeId: '44444444-4444-4444-8444-444444444444',
        dueDate: '2026-11-05T17:00:00.000Z',
      });
      expect(dto.title).toBe('Write brief');
    });

    it('rejects an empty-string assigneeId (client used to send this)', async () => {
      await expectRejected(CreateTodoItemDto, { title: 'T', assigneeId: '' });
    });

    it('rejects a non-ISO dueDate', async () => {
      await expectRejected(CreateTodoItemDto, { title: 'T', dueDate: 'Friday' });
    });

    it('accepts a task with no assignee', async () => {
      const dto = await transform(CreateTodoItemDto, { title: 'Unassigned' });
      expect(dto.assigneeId).toBeUndefined();
    });
  });

  describe('CreateModMailConversationDto', () => {
    const valid = {
      subject: 'Report',
      recipientId: '55555555-5555-4555-8555-555555555555',
      initialMessage: 'Please review',
    };

    it('accepts a valid conversation', async () => {
      const dto = await transform(CreateModMailConversationDto, valid);
      expect(dto.recipientId).toBe(valid.recipientId);
    });

    it('rejects a non-uuid recipientId', async () => {
      await expectRejected(CreateModMailConversationDto, { ...valid, recipientId: 'mod' });
    });

    it('rejects a blank subject', async () => {
      await expectRejected(CreateModMailConversationDto, { ...valid, subject: '' });
    });
  });

  describe('ModMailMessageDto', () => {
    it('accepts an internal note', async () => {
      const dto = await transform(ModMailMessageDto, { content: 'note', isInternal: true });
      expect(dto.isInternal).toBe(true);
    });

    it('rejects empty content', async () => {
      await expectRejected(ModMailMessageDto, { content: '' });
    });

    it('rejects a non-boolean isInternal', async () => {
      await expectRejected(ModMailMessageDto, { content: 'x', isInternal: 'yes' });
    });
  });
});
