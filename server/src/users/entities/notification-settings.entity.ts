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
}