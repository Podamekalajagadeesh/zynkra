import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupPrivacy } from './enums/group-privacy.enum';
import { Message } from '../dms/entities/message.entity';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { WsRateLimiter } from '../common/ws-auth/ws-rate-limiter';
import { applyWsCors } from '../common/ws-auth/ws-cors';

/**
 * The only payload that may cross the wire on `newMessage`. REST responses go
 * through ClassSerializerInterceptor (`@Exclude()` strips password_hash,
 * email, phone, …) but socket payloads are JSON.stringify'd verbatim — so the
 * gateway builds this allowlist itself rather than trusting the entity.
 */
export interface ChannelMessageEvent {
  id: string;
  content: string;
  mediaType: string;
  mediaUrl: string | null;
  media: Message['media'];
  voiceNote: Message['voiceNote'];
  createdAt: Date;
  channelId: string;
  sender: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
  };
}

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway({ namespace: '/channels' })
export class ChannelsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChannelsGateway');

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
    private readonly rateLimiter: WsRateLimiter,
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  async handleConnection(client: Socket) {
    if (!(await this.wsAuth.authenticate(client))) {
      return;
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.rateLimiter.release(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private mayAct(client: Socket, channelId: unknown): boolean {
    if (!client.data.userId || typeof channelId !== 'string' || channelId.length === 0) {
      return false;
    }
    return this.rateLimiter.allow(client, client.data.userId as string);
  }

  // Mirrors GroupsService.assertCanReadChannel — the socket path must not
  // be a hole around the REST access checks.
  private async canRead(channelId: string, userId: string): Promise<boolean> {
    const channel = await this.channelsRepository.findOne({
      where: { id: channelId },
      relations: ['group'],
    });
    if (!channel || !channel.group) return false;
    if (channel.group.privacy === GroupPrivacy.PUBLIC) return true;
    const member = await this.groupMembersRepository.findOne({
      where: { group: { id: channel.group.id }, user: { id: userId } },
    });
    return !!member;
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(client: Socket, channelId: string) {
    if (!this.mayAct(client, channelId)) return;
    if (!(await this.canRead(channelId, client.data.userId as string))) return;
    client.join(channelId);
    client.emit('joinedChannel', channelId);
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(client: Socket, channelId: string) {
    if (!this.mayAct(client, channelId)) return;
    client.leave(channelId);
    client.emit('leftChannel', channelId);
  }

  sendMessageToChannel(channelId: string, message: Message): void {
    this.server.to(channelId).emit('newMessage', this.toChannelMessageEvent(channelId, message));
  }

  /**
   * Drops a user's live sockets out of the given channel rooms — called when
   * they leave the group. Socket joins are never revalidated on their own, so
   * without this a leaver would keep receiving private-group traffic (E14).
   */
  async kickUserFromGroupRooms(userId: string, roomIds: string[]): Promise<void> {
    if (roomIds.length === 0 || !this.server) {
      return;
    }
    for (const socket of this.server.sockets.sockets.values()) {
      if (socket.data.userId !== userId) {
        continue;
      }
      for (const roomId of roomIds) {
        if (socket.rooms.has(roomId)) {
          await socket.leave(roomId);
        }
      }
    }
  }

  private toChannelMessageEvent(channelId: string, message: Message): ChannelMessageEvent {
    return {
      id: message.id,
      content: message.content,
      mediaType: message.mediaType,
      mediaUrl: message.mediaUrl ?? null,
      media: message.media ?? null,
      voiceNote: message.voiceNote ?? null,
      createdAt: message.createdAt,
      channelId,
      sender: {
        id: message.sender.id,
        username: message.sender.username ?? null,
        displayName: message.sender.displayName ?? null,
        avatar: message.sender.avatar ?? null,
      },
    };
  }
}
