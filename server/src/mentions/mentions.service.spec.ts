import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { MentionsService } from './mentions.service';
import { Mention } from './mention.entity';
import { User, TagPrivacy } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SentimentService, SentimentType } from '../sentiment/sentiment.service';

describe('MentionsService tag controls', () => {
  let service: MentionsService;
  let usersRepository: { findOne: jest.Mock };
  let mentionsRepository: { create: jest.Mock; save: jest.Mock };
  let sentimentService: { analyzeSentiment: jest.Mock };

  const author = Object.assign(new User(), { id: 'author', username: 'author', following: [] });

  beforeEach(async () => {
    usersRepository = { findOne: jest.fn() };
    mentionsRepository = {
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    sentimentService = {
      analyzeSentiment: jest.fn().mockResolvedValue({
        sentiment: SentimentType.NEUTRAL,
        score: 0,
        confidence: 1,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MentionsService,
        { provide: getRepositoryToken(Mention), useValue: mentionsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: NotificationsService, useValue: { createNotification: jest.fn() } },
        { provide: SentimentService, useValue: sentimentService },
      ],
    }).compile();

    service = module.get(MentionsService);
  });

  it.each([
    [TagPrivacy.NO_ONE, false],
    [TagPrivacy.FRIENDS, false],
    [TagPrivacy.FRIENDS_OF_FRIENDS, false],
    [TagPrivacy.EVERYONE, true],
  ])('enforces %s privacy for an unrelated user', async (privacy, allowed) => {
    const taggedUser = Object.assign(new User(), {
      id: 'tagged',
      username: 'tagged',
      tagPrivacy: privacy,
      following: [],
    });
    usersRepository.findOne.mockResolvedValue(taggedUser);

    if (!allowed) {
      expect(() => service.assertCanTag(author, taggedUser)).toThrow(UnauthorizedException);
      return;
    }

    expect(() => service.assertCanTag(author, taggedUser)).not.toThrow();
  });

  it('allows friends when tag privacy is friends', async () => {
    const taggedUser = Object.assign(new User(), {
      id: 'tagged',
      username: 'tagged',
      tagPrivacy: TagPrivacy.FRIENDS,
      following: [author],
    });
    author.following = [taggedUser];
    usersRepository.findOne.mockResolvedValue(taggedUser);

    expect(() => service.assertCanTag(author, taggedUser)).not.toThrow();
  });

  it.each([
    ['no_one', false, false],
    ['followers', false, false],
    ['followers', true, true],
    ['everyone', false, true],
  ] as const)('enforces mention controls for %s', async (privacy, followsMentionedUser, allowed) => {
    const taggedUser = Object.assign(new User(), {
      id: 'tagged',
      username: 'tagged',
      mentions: privacy,
      following: [],
    });
    author.following = followsMentionedUser ? [taggedUser] : [];
    usersRepository.findOne.mockResolvedValue(taggedUser);

    if (!allowed) {
      await expect(service.createMentions('@tagged', null, null, author)).rejects.toThrow(UnauthorizedException);
      expect(mentionsRepository.save).not.toHaveBeenCalled();
      return;
    }

    await expect(service.createMentions('@tagged', null, null, author)).resolves.toEqual([taggedUser]);
    expect(mentionsRepository.save).toHaveBeenCalledTimes(1);
  });
});