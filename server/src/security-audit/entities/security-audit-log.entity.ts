import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SecurityAuditEventType {
  // Account events
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_DEACTIVATED = 'account_deactivated',
  ACCOUNT_REACTIVATED = 'account_reactivated',
  ACCOUNT_DELETED = 'account_deleted',

  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  SIGNUP = 'signup',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',

  // 2FA events
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  TWO_FACTOR_VERIFIED = 'two_factor_verified',
  TWO_FACTOR_FAILED = 'two_factor_failed',

  // Passkey/WebAuthn events
  PASSKEY_REGISTERED = 'passkey_registered',
  PASSKEY_REMOVED = 'passkey_removed',
  WEBAUTHN_VERIFICATION_FAILED = 'webauthn_verification_failed',

  // Device events
  DEVICE_REGISTERED = 'device_registered',
  DEVICE_REMOVED = 'device_removed',
  DEVICE_APPROVED = 'device_approved',
  SUSPICIOUS_DEVICE_DETECTED = 'suspicious_device_detected',

  // Session events
  SESSION_CREATED = 'session_created',
  SESSION_REVOKED = 'session_revoked',
  SESSION_REVOKED_ALL = 'session_revoked_all',

  // Email events
  EMAIL_VERIFIED = 'email_verified',
  EMAIL_CHANGED = 'email_changed',
  EMAIL_VERIFICATION_FAILED = 'email_verification_failed',

  // Verification events
  VERIFICATION_SUBMITTED = 'verification_submitted',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
  BADGE_GRANTED = 'badge_granted',
  BADGE_REVOKED = 'badge_revoked',

  // Account linking events
  ACCOUNT_LINKED = 'account_linked',
  ACCOUNT_UNLINKED = 'account_unlinked',

  // Security events
  SUSPICIOUS_LOGIN_DETECTED = 'suspicious_login_detected',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  RECOVERY_CODE_USED = 'recovery_code_used',
  RECOVERY_CODE_GENERATED = 'recovery_code_generated',

  // Privacy events
  PRIVACY_SETTINGS_CHANGED = 'privacy_settings_changed',
  PERSONALIZATION_SETTING_CHANGED = 'personalization_setting_changed',

  // Admin events
  ADMIN_ACTION = 'admin_action',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_RESTORED = 'account_restored',
}

export enum AuditEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('security_audit_logs')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['severity', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class SecurityAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'CASCADE' })
  user: User | null;

  @Column('uuid', { nullable: true })
  userId: string | null;

  @Column({
    type: 'enum',
    enum: SecurityAuditEventType,
  })
  eventType: SecurityAuditEventType;

  @Column({
    type: 'enum',
    enum: AuditEventSeverity,
    default: AuditEventSeverity.INFO,
  })
  severity: AuditEventSeverity;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  browser: string | null;

  @Column({ type: 'varchar', nullable: true })
  os: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  reviewed: boolean;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;
}
