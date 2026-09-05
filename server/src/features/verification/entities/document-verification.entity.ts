import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Represents a document verification record
 * Stores metadata about uploaded and processed identity documents
 */
@Entity('document_verification_records')
@Index(['accountId'])
@Index(['status'])
@Index(['documentId'])
@Index(['submittedAt'])
@Index(['accountId', 'status'])
export class DocumentVerificationRecord {
  @PrimaryColumn('varchar', { length: 100 })
  id: string; // Unique record ID (rec_timestamp_randomhex)

  @Column('varchar', { length: 100 })
  accountId: string; // User account ID

  @Column('varchar', { length: 100 })
  documentId: string; // Document processing ID

  @Column('varchar', { length: 50 })
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';

  @Column('jsonb', { nullable: true })
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    documentType: 'passport' | 'driver_license' | 'national_id' | 'visa' | 'other';
    detectedType?: string;
    confidenceScore?: number;
    hash: string;
    extractedData?: {
      names?: string[];
      documentNumber?: string;
      issueDate?: string;
      expiryDate?: string;
      country?: string;
      dateOfBirth?: string;
    };
    validationResults?: {
      isExpired: boolean;
      isLegible: boolean;
      hasFacialImage: boolean;
      qualityScore: number;
      securityFeaturesDetected: boolean;
      warnings: string[];
    };
    encryptedPath?: string;
    thumbnailPath?: string;
  };

  @Column('timestamp')
  submittedAt: Date;

  @Column('timestamp', { nullable: true })
  reviewedAt?: Date;

  @Column('varchar', { length: 100, nullable: true })
  reviewedBy?: string; // Admin/reviewer ID

  @Column('text', { nullable: true })
  reviewNotes?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column('timestamp', { nullable: true })
  expiresAt?: Date; // Document expiration date

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Stores validation rules and their configuration
 */
@Entity('document_validation_rules')
@Index(['enabled'])
export class DocumentValidationRule {
  @PrimaryColumn('varchar', { length: 100 })
  ruleId: string;

  @Column('varchar', { length: 255 })
  ruleName: string;

  @Column('text')
  description: string;

  @Column('varchar', { length: 20 })
  severity: 'critical' | 'warning' | 'info';

  @Column('boolean', { default: true })
  enabled: boolean;

  @Column('jsonb', { nullable: true })
  config?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Audit log for document verification actions
 */
@Entity('document_verification_audit_logs')
@Index(['accountId'])
@Index(['action'])
@Index(['createdAt'])
export class DocumentVerificationAuditLog {
  @PrimaryColumn('varchar', { length: 100 })
  id: string;

  @Column('varchar', { length: 100 })
  accountId: string;

  @Column('varchar', { length: 100, nullable: true })
  documentRecordId?: string;

  @Column('varchar', { length: 100, nullable: true })
  adminId?: string;

  @Column('varchar', { length: 50 })
  action:
    | 'upload'
    | 'process'
    | 'validate'
    | 'review_started'
    | 'approve'
    | 'reject'
    | 'appeal'
    | 'delete'
    | 'export';

  @Column('varchar', { length: 50, nullable: true })
  previousStatus?: string;

  @Column('varchar', { length: 50, nullable: true })
  newStatus?: string;

  @Column('text', { nullable: true })
  details?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * Stores appeals for rejected documents
 */
@Entity('document_verification_appeals')
@Index(['documentRecordId'])
@Index(['status'])
@Index(['submittedAt'])
export class DocumentVerificationAppeal {
  @PrimaryColumn('varchar', { length: 100 })
  id: string;

  @Column('varchar', { length: 100 })
  documentRecordId: string;

  @Column('varchar', { length: 100 })
  accountId: string;

  @Column('text')
  appealReason: string;

  @Column('jsonb', { nullable: true, default: () => "'[]'" })
  supportingLinks?: string[];

  @Column('varchar', { length: 50 })
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';

  @Column('text', { nullable: true })
  reviewNotes?: string;

  @Column('varchar', { length: 100, nullable: true })
  reviewedBy?: string;

  @Column('timestamp', { nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Document verification statistics cache
 */
@Entity('document_verification_stats')
@Index(['date'])
export class DocumentVerificationStats {
  @PrimaryColumn('date')
  date: Date;

  @Column('integer', { default: 0 })
  totalSubmitted: number;

  @Column('integer', { default: 0 })
  totalApproved: number;

  @Column('integer', { default: 0 })
  totalRejected: number;

  @Column('integer', { default: 0 })
  averageReviewTimeHours: number;

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  averageQualityScore: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
