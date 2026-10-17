import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { applyWsCors } from '../common/ws-auth/ws-cors';
import { LocationService, UserLocation } from './location.service';

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway({
  transports: ['websocket', 'polling'],
})
export class SnapMapGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SnapMapGateway');
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(
    private readonly usersService: UsersService,
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
    private readonly locationService: LocationService,
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  async handleConnection(client: Socket) {
    if (!(await this.wsAuth.authenticate(client))) {
      return;
    }
    const userId = client.data.userId as string;
    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(client.id);
    this.userSockets.set(userId, sockets);
    this.logger.log(`SnapMap client connected: ${client.id}, user: ${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      return;
    }
    const sockets = this.userSockets.get(userId);
    sockets?.delete(client.id);
    if (sockets && sockets.size === 0) {
      this.userSockets.delete(userId);
    }
    this.locationService.clearLocation(userId);
    this.logger.log(`SnapMap client disconnected: ${client.id}, user: ${userId}`);
  }

  @SubscribeMessage('update-location')
  async handleUpdateLocation(
    @MessageBody() data: { latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    // The owner is the authenticated socket, never a client-supplied userId —
    // otherwise anyone could publish coordinates on another user's behalf.
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      return;
    }
    if (typeof data?.latitude !== 'number' || typeof data?.longitude !== 'number') {
      return;
    }
    if (Math.abs(data.latitude) > 90 || Math.abs(data.longitude) > 180) {
      return;
    }

    const location = this.locationService.setLocation(userId, data.latitude, data.longitude);

    const user = await this.usersService.findOneById(userId);
    if (!user?.following?.length) {
      return;
    }

    // Ghost mode suppresses broadcast entirely.
    if (this.locationService.getPrivacy(userId)?.ghostMode) {
      return;
    }

    for (const followed of user.following) {
      if (!this.locationService.canViewLocation(userId, followed.id)) {
        continue;
      }
      this.server.to(followed.id).emit('friend-location-updated', {
        ...location,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      });
    }
  }

  @SubscribeMessage('request-friend-locations')
  async handleRequestFriendLocations(@ConnectedSocket() client: Socket) {
    // @CurrentUser() does not work in a WS context — it reads the HTTP request.
    // The authenticated principal is on the socket.
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const visibleLocations: UserLocation[] = [];
    for (const [ownerId, location] of this.locationService.allLocations()) {
      if (ownerId === userId) continue;
      if (!this.locationService.canViewLocation(ownerId, userId)) continue;
      const friendUser = await this.usersService.findOneById(ownerId);
      if (friendUser) {
        visibleLocations.push({
          ...location,
          username: friendUser.username,
          displayName: friendUser.displayName,
          avatar: friendUser.avatar,
        });
      }
    }

    client.emit('initial-friend-locations', visibleLocations);
  }

  @SubscribeMessage('update-location-privacy')
  handleUpdatePrivacy(
    @MessageBody() data: {
      privacy: {
        shareWith: 'all_friends' | 'selected_friends' | 'no_one';
        selectedFriendIds?: string[];
        ghostMode: boolean;
        expireAfter: string;
      };
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !data?.privacy) {
      return;
    }
    this.locationService.setPrivacy(userId, data.privacy);
  }

  @SubscribeMessage('create-location-story')
  async handleCreateLocationStory(
    @MessageBody() story: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const user = await this.usersService.findOneById(userId);
    if (!user?.following?.length) return;

    for (const followed of user.following) {
      this.server.to(followed.id).emit('new-location-story', story);
    }
  }
}
