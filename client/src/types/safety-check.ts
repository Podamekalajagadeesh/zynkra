export enum SafetyStatus {
  Safe = 'safe',
  NotMarked = 'not_marked',
  Unknown = 'unknown',
}

export interface UserSafetyStatus {
  userId: string;
  status: SafetyStatus;
  timestamp: number;
}