import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentMetadata } from './document-processing.service';
import { DocumentVerificationRecord } from './entities/document-verification.entity';

/**
 * Document entity for database persistence
 */
export interface DocumentRecord {
  id: string;
  accountId: string;
  documentId: string;
  metadata: DocumentMetadata;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);

  constructor(
    @InjectRepository(DocumentVerificationRecord)
    private readonly documentsRepository: Repository<DocumentVerificationRecord>,
  ) {
    this.logger.log('DocumentStorageService initialized');
  }

  /**
   * Store document metadata in database
   */
  async storeDocument(
    accountId: string,
    metadata: DocumentMetadata,
    status: 'submitted' | 'under_review' = 'submitted',
  ): Promise<DocumentRecord> {
    try {
      const documentRecord = this.documentsRepository.create({
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        accountId,
        documentId: metadata.documentId,
        metadata,
        status,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DocumentVerificationRecord);

      const savedRecord = await this.documentsRepository.save(documentRecord);
      this.logger.log(`Document stored: ${documentRecord.id} for account: ${accountId}`);
      return savedRecord as DocumentRecord;
    } catch (error) {
      this.logger.error(`Failed to store document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get document record by ID
   */
  async getDocumentById(documentRecordId: string): Promise<DocumentRecord> {
    const record = await this.documentsRepository.findOne({ where: { id: documentRecordId } });
    if (!record) {
      throw new NotFoundException(`Document record not found: ${documentRecordId}`);
    }
    return record as DocumentRecord;
  }

  /**
   * Get all documents for an account
   */
  async getAccountDocuments(accountId: string): Promise<DocumentRecord[]> {
    return (await this.documentsRepository.find({
      where: { accountId },
      order: { submittedAt: 'DESC' },
    })) as DocumentRecord[];
  }

  /**
   * Get pending documents for review
   */
  async getPendingDocuments(limit: number = 50, offset: number = 0): Promise<{
    documents: DocumentRecord[];
    total: number;
  }> {
    const [documents, total] = await this.documentsRepository.findAndCount({
      where: [{ status: 'submitted' }, { status: 'under_review' }],
      order: { submittedAt: 'ASC' },
      skip: offset,
      take: limit,
    });
    return {
      documents: documents as DocumentRecord[],
      total,
    };
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentRecordId: string,
    status: DocumentRecord['status'],
    reviewNotes?: string,
    rejectionReason?: string,
  ): Promise<DocumentRecord> {
    const record = await this.getDocumentById(documentRecordId);

    record.status = status;
    record.reviewedAt = new Date();
    record.updatedAt = new Date();

    if (reviewNotes) {
      record.reviewNotes = reviewNotes;
    }

    if (rejectionReason) {
      record.rejectionReason = rejectionReason;
    }

    if (status === 'approved') {
      // Set expiration (e.g., 5 years from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 5);
      record.expiresAt = expiresAt;
    }

    await this.documentsRepository.save(record as DocumentVerificationRecord);
    this.logger.log(`Document status updated: ${documentRecordId} -> ${status}`);
    return record;
  }

  /**
   * Set reviewer for document
   */
  async setReviewer(documentRecordId: string, reviewerId: string): Promise<DocumentRecord> {
    const record = await this.getDocumentById(documentRecordId);
    record.reviewedBy = reviewerId;
    record.status = 'under_review';
    record.updatedAt = new Date();
    await this.documentsRepository.save(record as DocumentVerificationRecord);
    return record;
  }

  /**
   * Search documents
   */
  async searchDocuments(query: {
    accountId?: string;
    status?: DocumentRecord['status'];
    documentType?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<DocumentRecord[]> {
    const documents = await this.documentsRepository.find({ order: { submittedAt: 'DESC' } });
    return (documents as DocumentRecord[]).filter((doc) => {
      return (!query.accountId || doc.accountId === query.accountId) &&
        (!query.status || doc.status === query.status) &&
        (!query.documentType || doc.metadata.documentType === query.documentType) &&
        (!query.fromDate || doc.submittedAt >= query.fromDate) &&
        (!query.toDate || doc.submittedAt <= query.toDate);
    });
  }

  /**
   * Get latest document for account
   */
  async getLatestDocumentForAccount(accountId: string): Promise<DocumentRecord | null> {
    const documents = await this.getAccountDocuments(accountId);
    if (documents.length === 0) return null;

    return documents.reduce((latest, current) => {
      return current.submittedAt > latest.submittedAt ? current : latest;
    });
  }

  /**
   * Check if document is expired
   */
  isDocumentExpired(record: DocumentRecord): boolean {
    if (!record.expiresAt) return false;
    return new Date() > record.expiresAt;
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(): Promise<{
    total: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    expired: number;
    averageReviewTime: number; // in hours
  }> {
    const documents = (await this.documentsRepository.find()) as DocumentRecord[];

    const stats = {
      total: documents.length,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      averageReviewTime: 0,
    };

    const reviewTimes: number[] = [];

    documents.forEach((doc) => {
      switch (doc.status) {
        case 'submitted':
          stats.submitted++;
          break;
        case 'under_review':
          stats.underReview++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'expired':
          stats.expired++;
          break;
      }

      if (doc.reviewedAt) {
        const reviewTime = (doc.reviewedAt.getTime() - doc.submittedAt.getTime()) / (1000 * 60 * 60);
        reviewTimes.push(reviewTime);
      }
    });

    if (reviewTimes.length > 0) {
      stats.averageReviewTime = reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length;
    }

    return stats;
  }

  /**
   * Batch approve documents
   */
  async batchApproveDocuments(documentIds: string[], reviewerId: string): Promise<number> {
    let count = 0;

    for (const docId of documentIds) {
      try {
        await this.updateDocumentStatus(docId, 'approved', `Batch approved by ${reviewerId}`);
        count++;
      } catch (error) {
        this.logger.warn(`Failed to approve document ${docId}: ${error.message}`);
      }
    }

    return count;
  }

  /**
   * Cleanup expired documents
   */
  async cleanupExpiredDocuments(): Promise<number> {
    const documents = (await this.documentsRepository.find({ where: { status: 'approved' } })) as DocumentRecord[];
    let cleanedCount = 0;

    for (const doc of documents) {
      if (doc.status === 'approved' && this.isDocumentExpired(doc)) {
        doc.status = 'expired';
        doc.updatedAt = new Date();
        await this.documentsRepository.save(doc as DocumentVerificationRecord);
        cleanedCount++;
      }
    }

    this.logger.log(`Cleaned up ${cleanedCount} expired documents`);
    return cleanedCount;
  }

  /**
   * Delete document record and cleanup
   */
  async deleteDocumentRecord(documentRecordId: string): Promise<void> {
    await this.documentsRepository.delete(documentRecordId);
    this.logger.log(`Document record deleted: ${documentRecordId}`);
  }

  /**
   * Export documents for audit
   */
  async exportDocumentsForAudit(filters?: {
    fromDate?: Date;
    toDate?: Date;
  }): Promise<DocumentRecord[]> {
    let documents = (await this.documentsRepository.find({ order: { submittedAt: 'DESC' } })) as DocumentRecord[];

    if (filters) {
      if (filters.fromDate) {
        documents = documents.filter((doc) => doc.submittedAt >= filters.fromDate!);
      }
      if (filters.toDate) {
        documents = documents.filter((doc) => doc.submittedAt <= filters.toDate!);
      }
    }

    return documents;
  }
}
