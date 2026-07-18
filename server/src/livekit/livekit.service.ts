import { Injectable } from '@nestjs/common';
import { RoomServiceClient, Room } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly roomClient: RoomServiceClient;

  constructor() {
    this.roomClient = new RoomServiceClient(
      process.env.LIVEKIT_URL || 'wss://your-livekit-instance.com',
      process.env.LIVEKIT_API_KEY || 'dev-api-key',
      process.env.LIVEKIT_API_SECRET || 'dev-api-secret'
    );
  }

  async createRoom(roomName: string, maxParticipants: number = 10): Promise<Room> {
    return this.roomClient.createRoom({
      name: roomName,
      maxParticipants,
      emptyTimeout: 60 * 60, // 1 hour
    });
  }

  async generateToken(userId: string, roomName: string, isHost: boolean): Promise<string> {
    const { AccessToken } = require('livekit-server-sdk');
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY || 'dev-api-key',
      process.env.LIVEKIT_API_SECRET || 'dev-api-secret',
      {
        identity: userId,
      }
    );
    
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isHost,
      canSubscribe: true,
      canPublishData: true,
    });

    return token.toJwt();
  }

  async listParticipants(roomName: string) {
    return this.roomClient.listParticipants(roomName);
  }

  async removeParticipant(roomName: string, participantId: string) {
    return this.roomClient.removeParticipant(roomName, participantId);
  }
}