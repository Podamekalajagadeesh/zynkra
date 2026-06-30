import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ActivityGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ActivityGateway.name);
  private activeUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Activity client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Activity client disconnected: ${client.id}`);
    
    // Find user who disconnected
    const userId = Array.from(this.activeUsers.entries())
      .find(([_, socketId]) => socketId === client.id)?.[0];
    
    if (userId) {
      this.activeUsers.delete(userId);
      
      // Update user's last seen and set offline
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (user) {
        user.isOnline = false;
        user.lastSeenAt = new Date();
        await this.usersRepository.save(user);
        
        // Broadcast that user went offline
        this.broadcastUserStatus(userId, user);
      }
    }
  }

  @SubscribeMessage('user-online')
  async handleUserOnline(client: Socket, payload: { userId: string }) {
    const { userId } = payload;
    this.activeUsers.set(userId, client.id);
    
    // Update user's online status
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user) {
      user.isOnline = true;
      await this.usersRepository.save(user);
      
      // Broadcast that user came online
      this.broadcastUserStatus(userId, user);
    }
  }

  @SubscribeMessage('update-last-seen')
  async handleUpdateLastSeen(client: Socket, payload: { userId: string }) {
    const { userId } = payload;
    
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user && user.isOnline) {
      user.lastSeenAt = new Date();
      await this.usersRepository.save(user);
    }
  }

  @SubscribeMessage('update-activity-settings')
  async handleUpdateActivitySettings(
    client: Socket,
    payload: { userId: string; showOnlineStatus?: boolean; showLastSeenTimestamp?: boolean }
  ) {
    const { userId, showOnlineStatus, showLastSeenTimestamp } = payload;
    
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user) {
      if (showOnlineStatus !== undefined) {
        user.showOnlineStatus = showOnlineStatus;
      }
      if (showLastSeenTimestamp !== undefined) {
        user.showLastSeenTimestamp = showLastSeenTimestamp;
      }
      await this.usersRepository.save(user);
      
      // Broadcast updated status
      this.broadcastUserStatus(userId, user);
    }
  }

  private broadcastUserStatus(userId: string, user: User) {
    // Only broadcast status if user allows it
    const statusToBroadcast = {
      userId,
      isOnline: user.showOnlineStatus ? user.isOnline : undefined,
      lastSeenAt: user.showLastSeenTimestamp ? user.lastSeenAt : undefined,
      showOnlineStatus: user.showOnlineStatus,
      showLastSeenTimestamp: user.showLastSeenTimestamp,
    };
    
    this.server.emit('user-status-updated', statusToBroadcast);
  }

  // Helper method to get online users for a specific set of user IDs
  async getUsersStatuses(userIds: string[]) {
    const users = await this.usersRepository.findByIds(userIds);
    return users.map(user => ({
      userId: user.id,
      isOnline: user.showOnlineStatus ? user.isOnline : undefined,
      lastSeenAt: user.showLastSeenTimestamp ? user.lastSeenAt : undefined,
    }));
  }
}