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
import { User, MessagePrivacy } from '../users/entities/user.entity';
import { ConversationType } from './conversation-type.enum';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageReceipt } from './entities/message-receipt.entity';

import { SendMessageDto } from './dto/send-message.dto';
import { ForwardMessageDto } from './dto/forward-message.dto';
import { VisibilityService } from '../common/visibility/visibility.service';
import { DataPermission } from '../features/account-management/dto/data-permissions.dto';
import { DataPermissionsService } from '../common/data-permissions/data-permissions.service';

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
    private readonly dataPermissions: DataPermissionsService,
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

    // Forwarding is another send path, so it must observe the same privacy rules.
    if (conversation.type === ConversationType.ONE_TO_ONE) {
      const other = conversation.participants.find((p) => p.id !== user.id);
      if (other) await this.assertCanMessage(user, other);
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
  ): Promise<MessageReceipt | null> {
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

    if (!user.readReceipts) {
      return null;
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
    await this.dataPermissions.require(starter.id, DataPermission.MESSAGES);
    const recipients = await this.usersRepository.findBy({
      id: In(recipientIds),
    });

    if (recipients.length !== recipientIds.length) {
      throw new NotFoundException('One or more recipients not found');
    }

    const participants = [starter, ...recipients];

    // Check message privacy settings for each recipient before creating conversation
    for (const recipient of recipients) {
      if (recipient.id === starter.id) continue; // Skip self

      await this.assertCanMessage(starter, recipient);
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
    await this.dataPermissions.require(sender.id, DataPermission.MESSAGES);
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
      if (other) await this.assertCanMessage(sender, other);
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

  async getConversations(user: User): Promise<Array<Conversation & { unreadCount: number; lastMessage?: Message }>> {
    await this.dataPermissions.require(user.id, DataPermission.MESSAGES);
    const conversations = await this.conversationsRepository.find({
      where: { participants: { id: user.id } },
      relations: ['participants', 'messages', 'messages.sender', 'messages.readBy', 'owner'],
    });

    return conversations.map((conversation) => {
      const messages = (conversation.messages ?? [])
        .filter((message) => !message.deletedAt && (!message.expiresAt || message.expiresAt > new Date()))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const unreadCount = messages.filter(
        (message) => message.sender?.id !== user.id && !message.readBy?.some((receipt) => receipt.user?.id === user.id),
      ).length;

      return {
        ...conversation,
        messages: undefined,
        lastMessage: messages.at(-1),
        unreadCount,
      };
    });
  }

  async markConversationAsRead(
    user: User,
    conversationId: string,
  ): Promise<{ conversationId: string; markedCount: number }> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (!conversation.participants.some((participant) => participant.id === user.id)) {
      throw new UnauthorizedException('You are not a participant of this conversation.');
    }

    const messages = await this.messagesRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender', 'readBy', 'readBy.user'],
    });
    const unreadMessages = messages.filter(
      (message) => message.sender?.id !== user.id && !message.readBy?.some((receipt) => receipt.user?.id === user.id),
    );

    if (!user.readReceipts) {
      return { conversationId, markedCount: 0 };
    }

    if (unreadMessages.length > 0) {
      await this.messageReceiptsRepository.save(
        unreadMessages.map((message) => this.messageReceiptsRepository.create({ user, message })),
      );
    }

    return { conversationId, markedCount: unreadMessages.length };
  }

  async getMessages(
    user: User,
    conversationId: string,
  ): Promise<Message[]> {
    await this.dataPermissions.require(user.id, DataPermission.MESSAGES);
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
    await this.dataPermissions.require(user.id, DataPermission.MESSAGES);
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
    await this.dataPermissions.require(user.id, DataPermission.MESSAGES);
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

  private async assertCanMessage(sender: User, recipient: User): Promise<void> {
    if (await this.visibilityService.isBlockedEither(sender.id, recipient.id)) {
      throw new UnauthorizedException('You cannot send messages in this conversation.');
    }

    const privacy = recipient.messagePrivacy || MessagePrivacy.EVERYONE;
    if (privacy === MessagePrivacy.EVERYONE) return;

    const [senderProfile, recipientProfile] = await Promise.all([
      this.usersRepository.findOne({
        where: { id: sender.id },
        relations: ['following', 'following.following'],
      }),
      this.usersRepository.findOne({
        where: { id: recipient.id },
        relations: ['following', 'following.following'],
      }),
    ]);

    const senderFollowing = senderProfile?.following ?? [];
    const recipientFollowing = recipientProfile?.following ?? [];
    const senderId = sender.id;
    const recipientId = recipient.id;
    const senderFriendIds = new Set(
      senderFollowing
        .filter((user) => user.following?.some((followed) => followed.id === senderId))
        .map((user) => user.id),
    );
    const recipientFriendIds = new Set(
      recipientFollowing
        .filter((user) => user.following?.some((followed) => followed.id === recipientId))
        .map((user) => user.id),
    );
    const areFriends = senderFriendIds.has(recipientId) && recipientFriendIds.has(senderId);

    if (privacy === MessagePrivacy.FRIENDS && !areFriends) {
      throw new UnauthorizedException('You cannot send messages in this conversation.');
    }

    if (privacy === MessagePrivacy.FRIENDS_OF_FRIENDS) {
      const shareFriend = [...recipientFriendIds].some((friendId) => senderFriendIds.has(friendId));
      if (!areFriends && !shareFriend) {
        throw new UnauthorizedException('You cannot send messages in this conversation.');
      }
    }

    if (privacy === MessagePrivacy.NO_ONE) {
      throw new UnauthorizedException('You cannot send messages in this conversation.');
    }
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