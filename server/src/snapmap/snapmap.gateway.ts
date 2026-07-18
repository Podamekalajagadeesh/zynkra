import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  username?: string;
  displayName?: string;
  avatar?: string;
}

interface LocationPrivacy {
  userId: string;
  shareWith: 'all_friends' | 'selected_friends' | 'no_one';
  selectedFriendIds: string[];
  ghostMode: boolean;
  expireAfter: string;
  expiresAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class SnapMapGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SnapMapGateway');
  private userLocations: Map<string, UserLocation> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private locationPrivacy: Map<string, LocationPrivacy> = new Map();

  constructor(private readonly usersService: UsersService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      this.logger.log(`SnapMap client connected: ${client.id}, user: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.userSockets.entries()].find(([, socketId]) => socketId === client.id)?.[0];
    if (userId) {
      this.userSockets.delete(userId);
      this.userLocations.delete(userId);
      this.logger.log(`SnapMap client disconnected: ${client.id}, user: ${userId}`);
    }
  }

  @SubscribeMessage('update-location')
  async handleUpdateLocation(
    @MessageBody() data: { userId: string; latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    const location: UserLocation = {
      userId: data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
      lastUpdated: new Date(),
    };
    
    this.userLocations.set(data.userId, location);

    // Get user's friends to broadcast location to
    const user = await this.usersService.findOneById(data.userId);
    if (user && user.following) {
      const privacy = this.locationPrivacy.get(data.userId);
      
      // Only broadcast if user is not in ghost mode
      if (!privacy?.ghostMode) {
        // Broadcast to all mutual friends who can see this user's location
        for (const followed of user.following) {
          const canSee = this.canUserSeeLocation(data.userId, followed.id, privacy);
          if (canSee && this.userSockets.has(followed.id)) {
            const friendSocketId = this.userSockets.get(followed.id);
            if (friendSocketId) {
              this.server.to(friendSocketId).emit('friend-location-updated', {
                ...location,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
              });
            }
          }
        }
      }
    }
  }

  @SubscribeMessage('request-friend-locations')
  async handleRequestFriendLocations(
    @CurrentUser() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    // Send all visible friend locations to the requesting user
    const visibleLocations: UserLocation[] = [];
    
    for (const [userId, location] of this.userLocations.entries()) {
      // Skip if it's the current user
      if (userId === user.id) continue;
      
      const privacy = this.locationPrivacy.get(userId);
      if (this.canUserSeeLocation(userId, user.id, privacy)) {
        const friendUser = await this.usersService.findOneById(userId);
        if (friendUser) {
          visibleLocations.push({
            ...location,
            username: friendUser.username,
            displayName: friendUser.displayName,
            avatar: friendUser.avatar,
          });
        }
      }
    }
    
    client.emit('initial-friend-locations', visibleLocations);
  }

  @SubscribeMessage('update-location-privacy')
  async handleUpdatePrivacy(
    @MessageBody() data: { userId: string; privacy: any },
    @ConnectedSocket() client: Socket,
  ) {
    const privacySettings: LocationPrivacy = {
      ...data.privacy,
      userId: data.userId,
      expiresAt: this.calculateExpiration(data.privacy.expireAfter),
    };
    
    this.locationPrivacy.set(data.userId, privacySettings);
    this.logger.log(`Updated location privacy for user: ${data.userId}`);
  }

  @SubscribeMessage('create-location-story')
  async handleCreateLocationStory(
    @MessageBody() story: any,
    @CurrentUser() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast location story to all eligible friends
    for (const followed of user.following || []) {
      if (this.userSockets.has(followed.id)) {
        const socketId = this.userSockets.get(followed.id);
        if (socketId) {
          this.server.to(socketId).emit('new-location-story', story);
        }
      }
    }
  }

  private canUserSeeLocation(ownerId: string, viewerId: string, privacy: LocationPrivacy | undefined): boolean {
    if (!privacy) return true; // Default to sharing with all friends
    if (privacy.ghostMode) return false;
    if (privacy.shareWith === 'no_one') return false;
    if (privacy.shareWith === 'selected_friends' && !privacy.selectedFriendIds.includes(viewerId)) return false;
    
    // Check if location has expired
    if (new Date() > privacy.expiresAt) return false;
    
    return true;
  }

  private calculateExpiration(expireAfter: string): Date {
    const now = new Date();
    switch (expireAfter) {
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '4hours':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case '24hours':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Until turned off (1 year)
    }
  }
}