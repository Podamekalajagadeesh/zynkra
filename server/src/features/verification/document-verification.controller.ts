import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Param,
  Query,
  Body,
  Logger,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { DocumentProcessingService, DocumentMetadata } from './document-processing.service';
import { DocumentStorageService, DocumentRecord } from './document-storage.service';
import { DocumentValidationEngine, ValidationReport } from './document-validation.engine';

@Controller('verification/documents')
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  private readonly logger = new Logger(DocumentVerificationController.name);

  constructor(
    private readonly processingService: DocumentProcessingService,
    private readonly storageService: DocumentStorageService,
    private readonly validationEngine: DocumentValidationEngine,
  ) {}

  /**
   * Upload and process document
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { documentType: string },
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const accountId = req.user.userId;
      this.logger.log(`Processing document upload for account: ${accountId}`);

      // Process document
      const metadata = await this.processingService.processDocument(
        file.path,
        file.originalname,
        body.documentType,
      );

      // Validate document
      const validationReport = await this.validationEngine.validateDocument(metadata);

      // Store in database
      const documentRecord = await this.storageService.storeDocument(
        accountId,
        metadata,
        validationReport.isPassed ? 'under_review' : 'submitted',
      );

      return {
        success: true,
        documentId: metadata.documentId,
        recordId: documentRecord.id,
        status: documentRecord.status,
        validationScore: validationReport.overallScore,
        isPassed: validationReport.isPassed,
        validationReport,
        extractedData: metadata.extractedData,
        message: 'Document uploaded and processed successfully',
      };
    } catch (error) {
      this.logger.error(`Document upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get document details
   */
  @Get(':recordId')
  async getDocument(@Param('recordId') recordId: string) {
    try {
      const document = await this.storageService.getDocumentById(recordId);

      return {
        success: true,
        document: {
          id: document.id,
          documentId: document.documentId,
          status: document.status,
          submittedAt: document.submittedAt,
          reviewedAt: document.reviewedAt,
          reviewNotes: document.reviewNotes,
          rejectionReason: document.rejectionReason,
          metadata: document.metadata,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get document: ${error.message}`);
      throw new NotFoundException('Document not found');
    }
  }

  /**
   * Download document (admin only)
   */
  @Get(':recordId/download')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async downloadDocument(@Param('recordId') recordId: string, @Res() res: Response) {
    try {
      const document = await this.storageService.getDocumentById(recordId);

      if (!document.metadata.encryptedPath) {
        throw new NotFoundException('Document file not found');
      }

      // Decrypt and serve document
      const decryptedBuffer = await this.processingService.decryptDocument(
        document.metadata.encryptedPath,
      );

      res.setHeader('Content-Type', document.metadata.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${document.metadata.fileName}"`,
      );
      res.send(decryptedBuffer);
    } catch (error) {
      this.logger.error(`Failed to download document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get thumbnail preview
   */
  @Get(':recordId/thumbnail')
  async getThumbnail(@Param('recordId') recordId: string, @Res() res: Response) {
    try {
      const document = await this.storageService.getDocumentById(recordId);

      if (!document.metadata.thumbnailPath) {
        throw new NotFoundException('Thumbnail not found');
      }

      res.sendFile(document.metadata.thumbnailPath);
    } catch (error) {
      this.logger.error(`Failed to get thumbnail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all documents for account
   */
  @Get('account/:accountId')
  async getAccountDocuments(@Param('accountId') accountId: string) {
    try {
      const documents = await this.storageService.getAccountDocuments(accountId);

      return {
        success: true,
        count: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          documentId: doc.documentId,
          status: doc.status,
          submittedAt: doc.submittedAt,
          reviewedAt: doc.reviewedAt,
          documentType: doc.metadata.documentType,
          qualityScore: doc.metadata.validationResults?.qualityScore,
          expiresAt: doc.expiresAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get account documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending documents for review (admin)
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getPendingDocuments(@Query() query: { limit?: string; offset?: string }) {
    try {
      const limit = Math.min(parseInt(query.limit || '50'), 100);
      const offset = parseInt(query.offset || '0');

      const { documents, total } = await this.storageService.getPendingDocuments(limit, offset);

      return {
        success: true,
        total,
        limit,
        offset,
        count: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          documentId: doc.documentId,
          accountId: doc.accountId,
          status: doc.status,
          documentType: doc.metadata.documentType,
          submittedAt: doc.submittedAt,
          extractedData: doc.metadata.extractedData,
          validationResults: doc.metadata.validationResults,
          qualityScore: doc.metadata.validationResults?.qualityScore,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get pending documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Review and approve document
   */
  @Put(':recordId/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approveDocument(
    @Request() req,
    @Param('recordId') recordId: string,
    @Body() body: { reviewNotes?: string },
  ) {
    try {
      this.logger.log(`Approving document: ${recordId}`);

      await this.storageService.setReviewer(recordId, req.user.userId);
      const updatedDocument = await this.storageService.updateDocumentStatus(
        recordId,
        'approved',
        body.reviewNotes,
      );

      return {
        success: true,
        message: 'Document approved successfully',
        document: {
          id: updatedDocument.id,
          status: updatedDocument.status,
          reviewedAt: updatedDocument.reviewedAt,
          reviewNotes: updatedDocument.reviewNotes,
          expiresAt: updatedDocument.expiresAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to approve document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject document with reason
   */
  @Put(':recordId/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rejectDocument(
    @Request() req,
    @Param('recordId') recordId: string,
    @Body() body: { rejectionReason: string; reviewNotes?: string },
  ) {
    try {
      if (!body.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }

      this.logger.log(`Rejecting document: ${recordId}`);

      await this.storageService.setReviewer(recordId, req.user.userId);
      const updatedDocument = await this.storageService.updateDocumentStatus(
        recordId,
        'rejected',
        body.reviewNotes,
        body.rejectionReason,
      );

      return {
        success: true,
        message: 'Document rejected',
        document: {
          id: updatedDocument.id,
          status: updatedDocument.status,
          reviewedAt: updatedDocument.reviewedAt,
          rejectionReason: updatedDocument.rejectionReason,
          reviewNotes: updatedDocument.reviewNotes,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to reject document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Re-validate document
   */
  @Post(':recordId/revalidate')
  async revalidateDocument(@Param('recordId') recordId: string) {
    try {
      const document = await this.storageService.getDocumentById(recordId);

      const validationReport = await this.validationEngine.validateDocument(
        document.metadata,
      );

      return {
        success: true,
        validationScore: validationReport.overallScore,
        isPassed: validationReport.isPassed,
        validationReport,
      };
    } catch (error) {
      this.logger.error(`Failed to revalidate document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get validation rules
   */
  @Get('admin/validation-rules')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getValidationRules() {
    try {
      const rules = this.validationEngine.getAllValidationRules();

      return {
        success: true,
        count: rules.length,
        rules: rules.map((rule) => ({
          id: rule.name,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          enabled: rule.enabled,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get validation rules: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStatistics() {
    try {
      const stats = await this.storageService.getDocumentStatistics();

      return {
        success: true,
        statistics: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search documents
   */
  @Get('admin/search')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async searchDocuments(
    @Query() query: {
      accountId?: string;
      status?: string;
      documentType?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    try {
      const documents = await this.storageService.searchDocuments({
        accountId: query.accountId,
        status: query.status as any,
        documentType: query.documentType,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      });

      return {
        success: true,
        count: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          documentId: doc.documentId,
          accountId: doc.accountId,
          status: doc.status,
          documentType: doc.metadata.documentType,
          submittedAt: doc.submittedAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to search documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete document
   */
  @Delete(':recordId')
  async deleteDocument(@Param('recordId') recordId: string) {
    try {
      const document = await this.storageService.getDocumentById(recordId);

      // Cleanup files
      await this.processingService.deleteDocument(document.metadata);

      // Delete from storage
      await this.storageService.deleteDocumentRecord(recordId);

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch approve documents
   */
  @Post('admin/batch-approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async batchApproveDocuments(
    @Body() body: { documentIds: string[]; reviewerId: string },
  ) {
    try {
      const approvedCount = await this.storageService.batchApproveDocuments(
        body.documentIds,
        body.reviewerId,
      );

      return {
        success: true,
        message: `Approved ${approvedCount} documents`,
        approvedCount,
      };
    } catch (error) {
      this.logger.error(`Batch approval failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export documents for audit
   */
  @Get('admin/export')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async exportDocuments(
    @Query() query: { fromDate?: string; toDate?: string },
  ) {
    try {
      const documents = await this.storageService.exportDocumentsForAudit({
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      });

      return {
        success: true,
        exportedAt: new Date().toISOString(),
        count: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          accountId: doc.accountId,
          documentId: doc.documentId,
          status: doc.status,
          documentType: doc.metadata.documentType,
          submittedAt: doc.submittedAt.toISOString(),
          reviewedAt: doc.reviewedAt?.toISOString(),
          qualityScore: doc.metadata.validationResults?.qualityScore,
          expiresAt: doc.expiresAt?.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`);
      throw error;
    }
  }
}
