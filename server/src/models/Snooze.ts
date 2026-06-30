import { Schema, model, Document } from 'mongoose';

export enum SnoozeTargetType {
  USER = 'USER',
  PAGE = 'PAGE',
  GROUP = 'GROUP',
}

export interface ISnooze extends Document {
  userId: string;
  targetId: string;
  targetType: SnoozeTargetType;
  snoozeUntil: Date;
}

const SnoozeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: String, required: true },
    targetType: { type: String, enum: Object.values(SnoozeTargetType), required: true },
    snoozeUntil: { type: Date, required: true },
  },
  { timestamps: true },
);

SnoozeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

export const Snooze = model<ISnooze>('Snooze', SnoozeSchema);