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
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { VisibilityService } from '../common/visibility/visibility.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ActivityGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ActivityGateway.name);
  private activeUsers: Map<string, Set<string>> = new Map(); // userId -> socket IDs

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly visibilityService: VisibilityService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    try {
      const payload = token ? this.jwtService.verify<{ sub: string }>(token) : null;
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
      return;
    }
    this.logger.log(`Activity client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Activity client disconnected: ${client.id}`);
    
    // Find user who disconnected
    const userEntry = Array.from(this.activeUsers.entries())
      .find(([, socketIds]) => socketIds.has(client.id));
    const userId = userEntry?.[0];
    
    if (userId) {
      const socketIds = userEntry[1];
      socketIds.delete(client.id);

      // A user remains online while at least one device is connected.
      if (socketIds.size > 0) return;
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
  async handleUserOnline(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    const socketIds = this.activeUsers.get(userId) ?? new Set<string>();
    socketIds.add(client.id);
    this.activeUsers.set(userId, socketIds);
    
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
  async handleUpdateLastSeen(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user && user.isOnline) {
      user.lastSeenAt = new Date();
      await this.usersRepository.save(user);
    }
  }

  @SubscribeMessage('update-activity-settings')
  async handleUpdateActivitySettings(
    client: Socket,
    payload: { showOnlineStatus?: boolean; showLastSeenTimestamp?: boolean; activityVisibility?: 'public' | 'friends' | 'private' }
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    const { showOnlineStatus, showLastSeenTimestamp, activityVisibility } = payload;
    
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user) {
      if (showOnlineStatus !== undefined) {
        user.showOnlineStatus = showOnlineStatus;
      }
      if (showLastSeenTimestamp !== undefined) {
        user.showLastSeenTimestamp = showLastSeenTimestamp;
      }
      if (activityVisibility) {
        user.activityVisibility = activityVisibility;
      }
      await this.usersRepository.save(user);
      
      // Broadcast updated status
      this.broadcastUserStatus(userId, user);
    }
  }

  private async broadcastUserStatus(userId: string, user: User) {
    const sockets = await this.server.fetchSockets();
    await Promise.all(sockets.map(async (socket) => {
      const viewerId = socket.data.userId as string | undefined;
      if (!(await this.visibilityService.canViewActivity(viewerId ?? null, user))) return;
      socket.emit('user-status-updated', {
        userId,
        isOnline: user.showOnlineStatus ? user.isOnline : undefined,
        lastSeenAt: user.showLastSeenTimestamp ? user.lastSeenAt : undefined,
        showOnlineStatus: user.showOnlineStatus,
        showLastSeenTimestamp: user.showLastSeenTimestamp,
      });
    }));
  }

}