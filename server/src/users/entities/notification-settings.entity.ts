import { Column } from 'typeorm';

export class NotificationSettings {
  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  likes: boolean;

  @Column({ default: true })
  comments: boolean;

  @Column({ default: true })
  newFollowers: boolean;

  @Column({ default: true })
  messages: boolean;

  @Column({ default: true })
  emailDigest: boolean;

  @Column({ default: true })
  pushAlerts: boolean;

  @Column({ default: false })
  smsAlerts: boolean;

  @Column({ default: true })
  securityAlerts: boolean;

  @Column({ default: true })
  notifyMentions: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  customNotifications: Record<string, boolean>;
}