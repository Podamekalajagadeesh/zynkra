import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { ConversationType } from './conversation-type.enum';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageReceipt } from './entities/message-receipt.entity';

import { SendMessageDto } from './dto/send-message.dto';
import { ForwardMessageDto } from './dto/forward-message.dto';
import { VisibilityService } from '../common/visibility/visibility.service';

@Injectable()
export class DmsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(MessageReaction)
    private readonly messageReactionsRepository: Repository<MessageReaction>,
    @InjectRepository(MessageReceipt)
    private readonly messageReceiptsRepository: Repository<MessageReceipt>,
    private readonly visibilityService: VisibilityService,
  ) {}

  async forwardMessage(
    user: User,
    messageId: string,
    forwardMessageDto: ForwardMessageDto,
  ): Promise<Message> {
    const originalMessage = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!originalMessage) {
      throw new NotFoundException('Original message not found');
    }

    const conversation = await this.conversationsRepository.findOne({
      where: { id: forwardMessageDto.conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.id === user.id,
    );
    if (!isParticipant) {
      throw new UnauthorizedException(
        'You are not a participant of this conversation.',
      );
    }

    // Same block rule as sendMessage — forwarding is just another send path.
    if (conversation.type === ConversationType.ONE_TO_ONE) {
      const other = conversation.participants.find((p) => p.id !== user.id);
      if (other && (await this.visibilityService.isBlockedEither(user.id, other.id))) {
        throw new UnauthorizedException('You cannot send messages in this conversation.');
      }
    }

    const message = this.messagesRepository.create({
      sender: user,
      conversation,
      forwardedFrom: originalMessage,
      content: originalMessage.content,
      mediaType: originalMessage.mediaType,
      mediaUrl: originalMessage.mediaUrl,
      media: originalMessage.media,
      voiceNote: originalMessage.voiceNote,
    });

    return this.messagesRepository.save(message);
  }

  async markMessageAsRead(
    user: User,
    messageId: string,
  ): Promise<MessageReceipt> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isParticipant = message.conversation.participants.some(
      (p) => p.id === user.id,
    );
    if (!isParticipant) {
      throw new UnauthorizedException(
        'You are not a participant of this conversation.',
      );
    }

    const existingReceipt = await this.messageReceiptsRepository.findOne({
      where: {
        message: { id: messageId },
        user: { id: user.id },
      },
    });

    if (existingReceipt) {
      return existingReceipt;
    }

    const newReceipt = this.messageReceiptsRepository.create({
      user,
      message,
    });

    return this.messageReceiptsRepository.save(newReceipt);
  }

  async addReaction(
    user: User,
    messageId: string,
    reaction: string,
  ): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isParticipant = message.conversation.participants.some(
      (p) => p.id === user.id,
    );
    if (!isParticipant) {
      throw new UnauthorizedException(
        'You are not a participant of this conversation.',
      );
    }

    const existingReaction = await this.messageReactionsRepository.findOne({
      where: {
        message: { id: messageId },
        user: { id: user.id },
        reaction,
      },
    });

    if (existingReaction) {
      await this.messageReactionsRepository.remove(existingReaction);
    } else {
      const newReaction = this.messageReactionsRepository.create({
        user,
        message,
        reaction,
      });
      await this.messageReactionsRepository.save(newReaction);
    }

    return this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['reactions', 'reactions.user'],
    });
  }

  async createConversation(
    starter: User,
    recipientIds: string[],
    name?: string,
  ): Promise<Conversation> {
    const recipients = await this.usersRepository.findBy({
      id: In(recipientIds),
    });

    if (recipients.length !== recipientIds.length) {
      throw new NotFoundException('One or more recipients not found');
    }

    const participants = [starter, ...recipients];

    // Check message privacy settings for each recipient before creating conversation
    const { MessagePrivacy } = require('../users/entities/user.entity');
    for (const recipient of recipients) {
      if (recipient.id === starter.id) continue; // Skip self

      // Blocks (either direction) trump privacy settings. Same message as the
      // privacy denial so a block isn't distinguishable from "messages off".
      if (await this.visibilityService.isBlockedEither(starter.id, recipient.id)) {
        throw new UnauthorizedException(`You are not allowed to send messages to ${recipient.username}`);
      }

      const privacy = recipient.messagePrivacy;
      // Default to everyone if no privacy set
      if (!privacy || privacy === MessagePrivacy.EVERYONE) {
        continue;
      }

      // Check if users are friends
      const areFriends = this.areUsersFriends(starter, recipient);
      if (privacy === MessagePrivacy.FRIENDS) {
        if (!areFriends) {
          throw new UnauthorizedException(`You are not allowed to send messages to ${recipient.username}`);
        }
        continue;
      }

      // If privacy is NO_ONE, only allow if it's the recipient themselves (already checked)
      if (privacy === MessagePrivacy.NO_ONE) {
        throw new UnauthorizedException(`You are not allowed to send messages to ${recipient.username}`);
      }
    }

    if (participants.length === 2 && !name) {
      // One-to-one conversation
      const conversation = this.conversationsRepository.create({
        participants,
        type: ConversationType.ONE_TO_ONE,
        isEncrypted: true,
      });
      return this.conversationsRepository.save(conversation);
    } else {
      // Group conversation
      const conversation = this.conversationsRepository.create({
        participants,
        name,
        owner: starter,
        type: ConversationType.GROUP,
      });
      return this.conversationsRepository.save(conversation);
    }
  }

  async sendMessage(
    sender: User,
    conversationId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.id === sender.id,
    );
    if (!isParticipant) {
      throw new UnauthorizedException(
        'You are not a participant of this conversation.',
      );
    }

    // Blocks after the conversation exists still stop new one-to-one messages.
    if (conversation.type === ConversationType.ONE_TO_ONE) {
      const other = conversation.participants.find((p) => p.id !== sender.id);
      if (other && (await this.visibilityService.isBlockedEither(sender.id, other.id))) {
        throw new UnauthorizedException('You cannot send messages in this conversation.');
      }
    }

    let replyTo: Message | undefined;
    if (sendMessageDto.replyToId) {
      replyTo = await this.messagesRepository.findOne({
        where: { id: sendMessageDto.replyToId },
      });
      if (!replyTo) {
        throw new NotFoundException('Message to reply to not found');
      }
    }

    const firstMedia = sendMessageDto.media?.[0];
    const message = this.messagesRepository.create({
      content: sendMessageDto.content ?? '',
      sender,
      conversation,
      replyTo,
      senderPublicKey: sendMessageDto.senderPublicKey,
      media: sendMessageDto.media ?? null,
      voiceNote: sendMessageDto.voiceNote ?? null,
      // Legacy single-attachment columns, kept in sync with the first item.
      mediaType: firstMedia?.type ?? 'text',
      mediaUrl: firstMedia?.url,
      // Disappearing messages: stamp expiry from the conversation timer.
      expiresAt: conversation.messageTtlSeconds
        ? new Date(Date.now() + conversation.messageTtlSeconds * 1000)
        : null,
    });

    return this.messagesRepository.save(message);
  }

  async getConversations(user: User): Promise<Conversation[]> {
    return this.conversationsRepository.find({
      where: { participants: { id: user.id } },
      relations: ['participants', 'messages', 'owner'],
    });
  }

  async getMessages(
    user: User,
    conversationId: string,
  ): Promise<Message[]> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'modmailRecipient'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.id === user.id,
    );
    if (!isParticipant) {
      throw new UnauthorizedException(
        'You are not a participant of this conversation.',
      );
    }

    const messages = await this.messagesRepository.find({
      // Hide expired disappearing messages that the sweep hasn't caught yet.
      where: [
        { conversation: { id: conversationId }, expiresAt: IsNull() },
        {
          conversation: { id: conversationId },
          expiresAt: MoreThan(new Date()),
        },
      ],
      relations: [
        'sender',
        'reactions',
        'reactions.user',
        'replyTo',
        'replyTo.sender',
        'readBy',
      ],
      order: { createdAt: 'ASC' },
    });

    // Modmail: internal mod notes are hidden from the recipient.
    if (
      conversation.type === ConversationType.MODMAIL &&
      conversation.modmailRecipient?.id === user.id
    ) {
      return messages.filter((m) => !m.isInternal);
    }

    return messages;
  }

  async updateMessage(
    user: User,
    messageId: string,
    content: string,
  ): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.id !== user.id) {
      throw new UnauthorizedException('You can only edit your own messages.');
    }

    message.content = content;
    return this.messagesRepository.save(message);
  }

  async deleteMessage(user: User, messageId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.id !== user.id) {
      throw new UnauthorizedException('You can only delete your own messages.');
    }

    await this.messagesRepository.softDelete(messageId);
  }

  private areUsersFriends(user1: User, user2: User): boolean {
    // Check if they follow each other (mutual follow = friends)
    const user1FollowsUser2 = user1.following?.some(f => f.id === user2.id);
    const user2FollowsUser1 = user2.following?.some(f => f.id === user1.id);
    return user1FollowsUser2 && user2FollowsUser1;
  }

  async setVanishMode(
    user: User,
    conversationId: string,
    vanishMode: boolean,
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.id === user.id,
    );
    if (!isParticipant) {
      throw new UnauthorizedException(
        'You are not a participant of this conversation.',
      );
    }

    conversation.vanishMode = vanishMode;
    return this.conversationsRepository.save(conversation);
  }

  /** Allowed disappearing-message timers, in seconds (Instagram/WhatsApp-style). */
  static readonly ALLOWED_TTLS = [
    24 * 60 * 60, // 24 hours
    7 * 24 * 60 * 60, // 7 days
    90 * 24 * 60 * 60, // 90 days
  ];

  async setMessageTtl(
    user: User,
    conversationId: string,
    ttlSeconds: number | null,
  ): Promise<Conversation> {
    if (ttlSeconds !== null && !DmsService.ALLOWED_TTLS.includes(ttlSeconds)) {
      throw new BadRequestException(
        `messageTtlSeconds must be null or one of: ${DmsService.ALLOWED_TTLS.join(', ')}`,
      );
    }

    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.id === user.id,
    );
    if (!isParticipant) {
      throw new UnauthorizedException(
        'You are not a participant of this conversation.',
      );
    }

    conversation.messageTtlSeconds = ttlSeconds;
    return this.conversationsRepository.save(conversation);
  }

  /** Sweep expired disappearing messages (soft delete, matching message deletion). */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'disappearing-messages-sweep' })
  async sweepExpiredMessages(): Promise<void> {
    await this.messagesRepository.softDelete({
      expiresAt: LessThan(new Date()),
      deletedAt: IsNull(),
    });
  }
}