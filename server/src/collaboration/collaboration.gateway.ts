import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CollaborationService } from './collaboration.service';
import { WsAuthService } from '../common/ws-auth/ws-auth.service';
import { WsRateLimiter } from '../common/ws-auth/ws-rate-limiter';
import { applyWsCors } from '../common/ws-auth/ws-cors';

// CORS is applied in afterInit, not the decorator — see ws-cors.ts.
@WebSocketGateway()
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CollaborationGateway.name);

  constructor(
    private readonly collaborationService: CollaborationService,
    private readonly wsAuth: WsAuthService,
    private readonly configService: ConfigService,
    private readonly rateLimiter: WsRateLimiter
  ) {}

  afterInit(server: Server) {
    applyWsCors(server, this.configService);
  }

  /**
   * The acting user is always the authenticated socket, never `payload.userId`
   * / `payload.hostId`. A client could previously edit, join, or host any
   * editing room on another user's behalf.
   *
   * Returns undefined when the socket is unauthenticated, the payload is
   * missing its subject, or the socket is over its message budget — every
   * handler below bails on undefined.
   */
  private actorId(
    client: Socket,
    payload?: { postId?: string; sessionId?: string } & Record<string, any>
  ): string | undefined {
    const userId = client.data.userId as string | undefined;
    if (!userId) return undefined;
    if (payload && !payload.postId && !payload.sessionId) return undefined;
    if (!this.rateLimiter.allow(client, userId)) return undefined;
    return userId;
  }

  async handleConnection(client: Socket) {
    if (!(await this.wsAuth.authenticate(client))) {
      return;
    }
    this.logger.log(`Collaboration client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.rateLimiter.release(client.id);
    this.logger.log(`Collaboration client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-editing-room')
  async handleJoinEditingRoom(client: Socket, payload: { postId: string; displayName: string }) {
    const userId = this.actorId(client, payload);
    if (!userId) return;
    const { postId, displayName } = payload;

    // Add user to the editing room
    await this.collaborationService.addCollaboratorToRoom(postId, userId, displayName);
    client.join(postId);

    // Notify everyone in the room
    this.server.to(postId).emit('collaborator-joined', { userId, displayName });

    // Send current collaborators list to the new user
    const collaborators = this.collaborationService.getActiveCollaborators(postId);
    client.emit('active-collaborators', collaborators);
  }

  @SubscribeMessage('leave-editing-room')
  async handleLeaveEditingRoom(client: Socket, payload: { postId: string }) {
    const userId = this.actorId(client, payload);
    if (!userId) return;
    const { postId } = payload;

    await this.collaborationService.removeCollaboratorFromRoom(postId, userId);
    client.leave(postId);

    this.server.to(postId).emit('collaborator-left', { userId });
  }

  @SubscribeMessage('content-update')
  async handleContentUpdate(
    client: Socket,
    payload: { postId: string; content: any; timestamp: number }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;
    const { postId, content, timestamp } = payload;

    // Broadcast the update to everyone else in the room
    client.to(postId).emit('content-updated', { userId, content, timestamp });

    // Save the latest version
    await this.collaborationService.saveDraftVersion(postId, content, userId);
  }

  @SubscribeMessage('cursor-position')
  async handleCursorPosition(
    client: Socket,
    payload: { postId: string; position: { x: number; y: number } }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;
    const { postId, position } = payload;
    client.to(postId).emit('cursor-moved', { userId, position });
  }

  @SubscribeMessage('selection-change')
  async handleSelectionChange(client: Socket, payload: { postId: string; selection: any }) {
    const userId = this.actorId(client, payload);
    if (!userId) return;
    const { postId, selection } = payload;
    client.to(postId).emit('selection-changed', { userId, selection });
  }

  @SubscribeMessage('invite-collaborator')
  async handleInviteCollaborator(
    client: Socket,
    payload: { postId: string; guestId: string; guestEmail: string }
  ) {
    const hostId = this.actorId(client, payload);
    if (!hostId || !payload.guestId) return;
    const { postId, guestId, guestEmail } = payload;

    // Add collaborator to the post's permanent list
    await this.collaborationService.addPermanentCollaborator(postId, guestId);

    // Send notification to the invited user's own sockets
    this.server.to(guestId).emit('collaboration-invite', {
      type: 'collaboration-invite',
      postId,
      hostId,
      guestEmail,
      message: 'You have been invited to collaborate on a post',
    });
  }

  @SubscribeMessage('remove-collaborator')
  async handleRemoveCollaborator(
    client: Socket,
    payload: { postId: string; collaboratorId: string }
  ) {
    if (!this.actorId(client, payload) || !payload.collaboratorId) return;
    const { postId, collaboratorId } = payload;

    await this.collaborationService.removePermanentCollaborator(postId, collaboratorId);

    // Notify the removed collaborator they no longer have access
    this.server.to(postId).emit('collaborator-removed', { collaboratorId });

    // Kick them from the room if they're in it. Match on the authenticated
    // principal, not `handshake.query.userId`, which a client controls.
    const sockets = await this.server.in(postId).allSockets();
    for (const socketId of sockets) {
      const socketClient = this.server.sockets.sockets.get(socketId);
      if (socketClient?.data?.userId === collaboratorId) {
        socketClient.leave(postId);
        socketClient.emit('access-revoked', { postId });
      }
    }
  }

  @SubscribeMessage('collective-experience:create-session')
  async handleCreateCollectiveExperienceSession(
    client: Socket,
    payload: {
      displayName: string;
      title: string;
      theme: 'virtual-trip' | 'event' | 'story';
      prompt: string;
      location?: string;
      sensoryMood?: string;
    }
  ) {
    const hostId = this.actorId(client, payload);
    if (!hostId || !payload?.title) return;

    const session = this.collaborationService.createCollectiveExperienceSession({
      hostId,
      hostName: payload.displayName,
      title: payload.title,
      theme: payload.theme,
      prompt: payload.prompt,
      location: payload.location,
      sensoryMood: payload.sensoryMood,
    });

    client.join(session.id);
    client.emit('collective-experience:session-created', { session });
    this.server.to(session.id).emit('collective-experience:session-updated', { session });
    this.broadcastCollectiveExperienceSessions();
  }

  @SubscribeMessage('collective-experience:list-sessions')
  async handleListCollectiveExperienceSessions(
    client: Socket,
    _payload: unknown,
    ack?: (response: {
      success: boolean;
      sessions: ReturnType<CollaborationService['getCollectiveExperienceSessions']>;
    }) => void
  ) {
    const sessions = this.collaborationService.getCollectiveExperienceSessions();

    if (ack) {
      ack({ success: true, sessions });
    }
  }

  @SubscribeMessage('collective-experience:get-session')
  async handleGetCollectiveExperienceSession(
    client: Socket,
    payload: { sessionId: string },
    ack?: (response: {
      success: boolean;
      session: ReturnType<CollaborationService['getCollectiveExperienceSession']>;
    }) => void
  ) {
    const session = this.collaborationService.getCollectiveExperienceSession(payload.sessionId);

    if (ack) {
      if (!session) {
        ack({ success: false, session: null });
        return;
      }

      ack({ success: true, session });
    }
  }

  @SubscribeMessage('collective-experience:join-session')
  async handleJoinCollectiveExperienceSession(
    client: Socket,
    payload: { sessionId: string; displayName: string }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.joinCollectiveExperienceSession(
      payload.sessionId,
      userId,
      payload.displayName
    );

    client.join(payload.sessionId);
    this.server.to(payload.sessionId).emit('collective-experience:participant-joined', {
      sessionId: payload.sessionId,
      userId,
      displayName: payload.displayName,
    });
    this.server.to(payload.sessionId).emit('collective-experience:session-updated', { session });
    client.emit('collective-experience:session-joined', { session });
    this.broadcastCollectiveExperienceSessions();
  }

  @SubscribeMessage('collective-experience:leave-session')
  async handleLeaveCollectiveExperienceSession(client: Socket, payload: { sessionId: string }) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.leaveCollectiveExperienceSession(
      payload.sessionId,
      userId
    );
    client.leave(payload.sessionId);

    this.server.to(payload.sessionId).emit('collective-experience:participant-left', {
      sessionId: payload.sessionId,
      userId,
    });

    if (session) {
      this.server.to(payload.sessionId).emit('collective-experience:session-updated', { session });
    } else {
      this.server.to(payload.sessionId).emit('collective-experience:session-ended', {
        sessionId: payload.sessionId,
      });
    }

    this.broadcastCollectiveExperienceSessions();
  }

  @SubscribeMessage('collective-experience:update-scene')
  async handleUpdateCollectiveExperienceScene(
    client: Socket,
    payload: {
      sessionId: string;
      updates: { prompt?: string; location?: string; sensoryMood?: string; highlights?: string[] };
    }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.updateCollectiveExperienceScene(
      payload.sessionId,
      payload.updates
    );
    this.server
      .to(payload.sessionId)
      .emit('collective-experience:session-updated', { session, userId });
    this.broadcastCollectiveExperienceSessions();
  }

  @SubscribeMessage('collective-experience:add-contribution')
  async handleAddCollectiveExperienceContribution(
    client: Socket,
    payload: {
      sessionId: string;
      displayName: string;
      type: 'travel-note' | 'event-step' | 'story-beat' | 'sensory-cue';
      text: string;
      intensity: number;
    }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.addCollectiveExperienceContribution(
      payload.sessionId,
      {
        userId,
        displayName: payload.displayName,
        type: payload.type,
        text: payload.text,
        intensity: payload.intensity,
      }
    );

    this.server.to(payload.sessionId).emit('collective-experience:contribution-added', {
      sessionId: payload.sessionId,
      contribution: session.contributions[session.contributions.length - 1],
    });
    this.server.to(payload.sessionId).emit('collective-experience:session-updated', { session });
    this.broadcastCollectiveExperienceSessions();
  }

  @SubscribeMessage('neural-live-stream:create-session')
  async handleCreateNeuralLiveStreamSession(
    client: Socket,
    payload: {
      displayName: string;
      title: string;
      headline: string;
      description?: string;
      currentScene?: string;
      sensoryPalette?: string[];
      thoughtPrompt?: string;
      broadcastIntensity?: number;
      maxAudience?: number;
    }
  ) {
    const hostId = this.actorId(client, payload);
    if (!hostId || !payload?.title) return;

    const session = this.collaborationService.createNeuralLiveStreamSession({
      hostId,
      hostName: payload.displayName,
      title: payload.title,
      headline: payload.headline,
      description: payload.description,
      currentScene: payload.currentScene,
      sensoryPalette: payload.sensoryPalette,
      thoughtPrompt: payload.thoughtPrompt,
      broadcastIntensity: payload.broadcastIntensity,
      maxAudience: payload.maxAudience,
    });

    client.join(session.id);
    client.emit('neural-live-stream:session-created', { session });
    this.server.to(session.id).emit('neural-live-stream:session-updated', { session });
    this.broadcastNeuralLiveStreamSessions();
  }

  @SubscribeMessage('neural-live-stream:list-sessions')
  async handleListNeuralLiveStreamSessions(
    _client: Socket,
    _payload: unknown,
    ack?: (response: {
      success: boolean;
      sessions: ReturnType<CollaborationService['getNeuralLiveStreamSessions']>;
    }) => void
  ) {
    const sessions = this.collaborationService.getNeuralLiveStreamSessions();

    if (ack) {
      ack({ success: true, sessions });
    }
  }

  @SubscribeMessage('neural-live-stream:get-session')
  async handleGetNeuralLiveStreamSession(
    _client: Socket,
    payload: { sessionId: string },
    ack?: (response: {
      success: boolean;
      session: ReturnType<CollaborationService['getNeuralLiveStreamSession']>;
    }) => void
  ) {
    const session = this.collaborationService.getNeuralLiveStreamSession(payload.sessionId);

    if (ack) {
      if (!session) {
        ack({ success: false, session: null });
        return;
      }

      ack({ success: true, session });
    }
  }

  @SubscribeMessage('neural-live-stream:join-session')
  async handleJoinNeuralLiveStreamSession(
    client: Socket,
    payload: { sessionId: string; displayName: string; role?: 'host' | 'co-host' | 'viewer' }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.joinNeuralLiveStreamSession(
      payload.sessionId,
      userId,
      payload.displayName,
      payload.role
    );

    client.join(payload.sessionId);
    this.server.to(payload.sessionId).emit('neural-live-stream:participant-joined', {
      sessionId: payload.sessionId,
      userId,
      displayName: payload.displayName,
      role: payload.role || 'viewer',
    });
    this.server.to(payload.sessionId).emit('neural-live-stream:session-updated', { session });
    client.emit('neural-live-stream:session-joined', { session });
    this.broadcastNeuralLiveStreamSessions();
  }

  @SubscribeMessage('neural-live-stream:leave-session')
  async handleLeaveNeuralLiveStreamSession(client: Socket, payload: { sessionId: string }) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.leaveNeuralLiveStreamSession(
      payload.sessionId,
      userId
    );
    client.leave(payload.sessionId);

    this.server.to(payload.sessionId).emit('neural-live-stream:participant-left', {
      sessionId: payload.sessionId,
      userId,
    });

    if (session) {
      this.server.to(payload.sessionId).emit('neural-live-stream:session-updated', { session });
    } else {
      this.server.to(payload.sessionId).emit('neural-live-stream:session-ended', {
        sessionId: payload.sessionId,
      });
    }

    this.broadcastNeuralLiveStreamSessions();
  }

  @SubscribeMessage('neural-live-stream:update-broadcast')
  async handleUpdateNeuralLiveStreamBroadcast(
    client: Socket,
    payload: {
      sessionId: string;
      updates: {
        headline?: string;
        description?: string;
        currentScene?: string;
        sensoryPalette?: string[];
        thoughtPrompt?: string;
        broadcastIntensity?: number;
      };
    }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.updateNeuralLiveStreamBroadcast(
      payload.sessionId,
      payload.updates
    );
    this.server
      .to(payload.sessionId)
      .emit('neural-live-stream:session-updated', { session, userId });
    this.broadcastNeuralLiveStreamSessions();
  }

  @SubscribeMessage('neural-live-stream:add-thought')
  async handleAddNeuralLiveStreamThought(
    client: Socket,
    payload: {
      sessionId: string;
      displayName: string;
      type: 'observation' | 'thought' | 'memory' | 'sensory-input';
      content: string;
      intensity: number;
      sensoryTags: string[];
    }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.addNeuralLiveStreamThought(payload.sessionId, {
      userId,
      displayName: payload.displayName,
      type: payload.type,
      content: payload.content,
      intensity: payload.intensity,
      sensoryTags: payload.sensoryTags,
    });

    this.server.to(payload.sessionId).emit('neural-live-stream:thought-added', {
      sessionId: payload.sessionId,
      thought: session.thoughts[session.thoughts.length - 1],
    });
    this.server.to(payload.sessionId).emit('neural-live-stream:session-updated', { session });
    this.broadcastNeuralLiveStreamSessions();
  }

  @SubscribeMessage('neural-live-stream:add-audience-signal')
  async handleAddNeuralLiveStreamAudienceSignal(
    client: Socket,
    payload: {
      sessionId: string;
      displayName: string;
      type: 'reaction' | 'question' | 'spotlight-request' | 'sensory-feedback';
      content: string;
      reaction?: string;
    }
  ) {
    const userId = this.actorId(client, payload);
    if (!userId) return;

    const session = this.collaborationService.addNeuralLiveStreamAudienceSignal(payload.sessionId, {
      userId,
      displayName: payload.displayName,
      type: payload.type,
      content: payload.content,
      reaction: payload.reaction,
    });

    this.server.to(payload.sessionId).emit('neural-live-stream:audience-signal-added', {
      sessionId: payload.sessionId,
      signal: session.audienceSignals[session.audienceSignals.length - 1],
    });
    this.server.to(payload.sessionId).emit('neural-live-stream:session-updated', { session });
    this.broadcastNeuralLiveStreamSessions();
  }

  @SubscribeMessage('neural-live-stream:end-session')
  async handleEndNeuralLiveStreamSession(client: Socket, payload: { sessionId: string }) {
    if (!this.actorId(client, payload)) return;

    const ended = this.collaborationService.endNeuralLiveStreamSession(payload.sessionId);

    if (ended) {
      client.leave(payload.sessionId);
      this.server.to(payload.sessionId).emit('neural-live-stream:session-ended', {
        sessionId: payload.sessionId,
      });
      this.broadcastNeuralLiveStreamSessions();
    }
  }

  private broadcastCollectiveExperienceSessions() {
    this.server.emit('collective-experience:sessions-updated', {
      sessions: this.collaborationService.getCollectiveExperienceSessions(),
    });
  }

  private broadcastNeuralLiveStreamSessions() {
    this.server.emit('neural-live-stream:sessions-updated', {
      sessions: this.collaborationService.getNeuralLiveStreamSessions(),
    });
  }
}
