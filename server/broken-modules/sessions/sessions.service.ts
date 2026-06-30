import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ISession } from '../../src/models/Session';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel('Session') private readonly sessionModel: Model<ISession>,
  ) {}

  async getUserSessions(userId: string) {
    return this.sessionModel.find({ userId }).sort({ last_used_at: -1 });
  }

  async revokeSession(userId: string, sessionId: string) {
    return this.sessionModel.findByIdAndDelete(sessionId);
  }
}