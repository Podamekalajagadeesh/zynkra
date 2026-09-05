import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',

  // 2FA events
  TOTP_SETUP = 'totp_setup',
  TOTP_ENABLED = 'totp_enabled',
  TOTP_DISABLED = 'totp_disabled',
  TOTP_VERIFIED = 'totp_verified',
  TOTP_FAILED = 'totp_failed',
  RECOVERY_CODES_GENERATED = 'recovery_codes_generated',
  RECOVERY_CODE_USED = 'recovery_code_used',
  RECOVERY_CODES_EXHAUSTED = 'recovery_codes_exhausted',

  // Passkey/WebAuthn events
  PASSKEY_REGISTERED = 'passkey_registered',
  PASSKEY_AUTHENTICATED = 'passkey_authenticated',
  PASSKEY_REMOVED = 'passkey_removed',
  PASSKEY_FAILED = 'passkey_failed',

  // Session/Device events
  SESSION_CREATED = 'session_created',
  SESSION_REVOKED = 'session_revoked',
  SESSION_REVOKED_ALL = 'session_revoked_all',
  DEVICE_REGISTERED = 'device_registered',
  DEVICE_REVOKED = 'device_revoked',
  DEVICE_APPROVED = 'device_approved',
  SUSPICIOUS_DEVICE_DETECTED = 'suspicious_device_detected',

  // Account security events
  ACCOUNT_DEACTIVATED = 'account_deactivated',
  ACCOUNT_REACTIVATED = 'account_reactivated',
  ACCOUNT_DELETION_REQUESTED = 'account_deletion_requested',
  ACCOUNT_DELETION_COMPLETED = 'account_deletion_completed',
  ACCOUNT_RECOVERY_STARTED = 'account_recovery_started',
  ACCOUNT_RECOVERY_COMPLETED = 'account_recovery_completed',
  ACCOUNT_RECOVERY_FAILED = 'account_recovery_failed',

  // Trusted contact recovery
  TRUSTED_CONTACT_ADDED = 'trusted_contact_added',
  TRUSTED_CONTACT_REMOVED = 'trusted_contact_removed',
  TRUSTED_CONTACT_RECOVERY_REQUESTED = 'trusted_contact_recovery_requested',
  TRUSTED_CONTACT_RECOVERY_APPROVED = 'trusted_contact_recovery_approved',
  TRUSTED_CONTACT_RECOVERY_REJECTED = 'trusted_contact_recovery_rejected',

  // Verification events
  VERIFICATION_REQUESTED = 'verification_requested',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
  VERIFICATION_APPEAL_SUBMITTED = 'verification_appeal_submitted',
  VERIFICATION_APPEAL_REVIEWED = 'verification_appeal_reviewed',

  // Linked accounts
  ACCOUNT_LINKED = 'account_linked',
  ACCOUNT_UNLINKED = 'account_unlinked',

  // Email/Contact events
  EMAIL_VERIFIED = 'email_verified',
  EMAIL_CHANGED = 'email_changed',
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',

  // Privacy/Settings
  PRIVACY_SETTINGS_CHANGED = 'privacy_settings_changed',
  NOTIFICATION_SETTINGS_CHANGED = 'notification_settings_changed',
  DATA_EXPORT_REQUESTED = 'data_export_requested',
  DATA_EXPORT_DOWNLOADED = 'data_export_downloaded',

  // Admin actions
  ADMIN_ACCOUNT_MODIFIED = 'admin_account_modified',
  ADMIN_VERIFICATION_REVIEWED = 'admin_verification_reviewed',
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('security_audit_logs')
@Index('IDX_b6f457bae5315954b9f151e33d', ['userId', 'createdAt'])
@Index('IDX_45d7916af2cc29c38d56f282b1', ['eventType', 'createdAt'])
@Index('IDX_31e35a162f069d11f7c031fba8', ['severity', 'createdAt'])
export class SecurityAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'event_type', type: 'enum', enum: SecurityEventType })
  eventType: SecurityEventType;

  @Column({ type: 'enum', enum: SecurityEventSeverity, default: SecurityEventSeverity.LOW })
  severity: SecurityEventSeverity;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}