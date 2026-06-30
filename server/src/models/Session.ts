import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
  userId: Schema.Types.ObjectId;
  ip_address: string;
  user_agent: string;
  last_used_at: Date;
}

export const SessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ip_address: {
    type: String,
    required: true,
  },
  user_agent: {
    type: String,
    required: true,
  },
  last_used_at: {
    type: Date,
    default: Date.now,
  },
});

export const Session = model<ISession>('Session', SessionSchema);