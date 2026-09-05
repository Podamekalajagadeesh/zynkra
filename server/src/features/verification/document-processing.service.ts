import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp, { Metadata } from 'sharp';
import Tesseract from 'tesseract.js';

export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  expiresAt?: Date;
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
  status: 'pending' | 'validated' | 'rejected' | 'error';
  errorMessage?: string;
}

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'documents');
  private readonly encryptionKey = process.env.DOCUMENT_ENCRYPTION_KEY || 'fallback-key-32-char-length!!!!!';

  constructor() {
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Process uploaded document file
   */
  async processDocument(
    filePath: string,
    fileName: string,
    documentType: string,
  ): Promise<DocumentMetadata> {
    try {
      this.logger.log(`Processing document: ${fileName}`);

      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = this.getMimeType(fileName);
      const documentId = this.generateDocumentId();
      const hash = this.calculateHash(fileBuffer);

      const metadata: DocumentMetadata = {
        documentId,
        fileName,
        fileSize: fileBuffer.length,
        mimeType,
        uploadedAt: new Date(),
        documentType: this.normalizeDocumentType(documentType),
        hash,
        status: 'pending',
      };

      // Encrypt and store document
      const encryptedPath = await this.encryptAndStoreDocument(filePath, documentId, fileBuffer);
      metadata.encryptedPath = encryptedPath;

      // Create thumbnail
      const thumbnailPath = await this.createThumbnail(filePath, documentId);
      metadata.thumbnailPath = thumbnailPath;

      // Extract text using OCR
      const extractedText = await this.extractTextOCR(filePath);
      this.logger.debug(`Extracted text: ${extractedText.substring(0, 200)}...`);

      // Parse extracted data
      metadata.extractedData = this.parseDocumentData(extractedText, metadata.documentType);

      // Validate document
      const validationResults = await this.validateDocument(filePath, extractedText, metadata);
      metadata.validationResults = validationResults;

      // Detect document type using AI (optional)
      metadata.detectedType = await this.detectDocumentType(filePath);

      // Cleanup original file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      metadata.status = validationResults.qualityScore >= 0.7 ? 'validated' : 'pending';

      this.logger.log(`Document processed successfully: ${documentId}`);
      return metadata;
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract text from document using OCR
   */
  async extractTextOCR(filePath: string): Promise<string> {
    try {
      this.logger.log(`Extracting text from: ${filePath}`);

      const result = await Tesseract.recognize(filePath, 'eng', {
        logger: (m) => this.logger.debug(`OCR Progress: ${JSON.stringify(m)}`),
      });

      return result.data.text || '';
    } catch (error) {
      this.logger.error(`OCR extraction failed: ${error.message}`);
      return '';
    }
  }

  /**
   * Validate document quality and authenticity
   */
  async validateDocument(
    filePath: string,
    extractedText: string,
    metadata: DocumentMetadata,
  ): Promise<DocumentMetadata['validationResults']> {
    try {
      const image = sharp(filePath);
      const metadata_sharp = await image.metadata();

      // Check image quality
      const qualityScore = this.calculateImageQuality(metadata_sharp, extractedText);

      // Check for facial image
      const hasFacialImage = this.detectFacialFeatures(extractedText);

      // Check expiry date
      const expiryDate = metadata.extractedData?.expiryDate;
      const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

      // Check legibility
      const isLegible = extractedText.length > 20 && extractedText.length < 10000;

      // Detect security features
      const securityFeaturesDetected = this.detectSecurityFeatures(extractedText, metadata_sharp);

      const warnings: string[] = [];
      if (isExpired) warnings.push('Document is expired');
      if (!isLegible) warnings.push('Document text is not legible');
      if (!hasFacialImage) warnings.push('No facial image detected');
      if (qualityScore < 0.5) warnings.push('Image quality is low');
      if (!securityFeaturesDetected) warnings.push('Security features not detected');

      return {
        isExpired,
        isLegible,
        hasFacialImage,
        qualityScore,
        securityFeaturesDetected,
        warnings,
      };
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      return {
        isExpired: false,
        isLegible: false,
        hasFacialImage: false,
        qualityScore: 0,
        securityFeaturesDetected: false,
        warnings: ['Validation error: ' + error.message],
      };
    }
  }

  /**
   * Detect document type using pattern matching
   */
  async detectDocumentType(filePath: string): Promise<string> {
    try {
      const text = await this.extractTextOCR(filePath);

      // Passport detection
      if (/passport|passport\s*number|passport\s*no/i.test(text)) return 'Passport';

      // Driver's License detection
      if (/driver.?s?\s*license|driver.?s?\s*license\s*no|DL|license\s*no/i.test(text)) {
        return "Driver's License";
      }

      // National ID detection
      if (/national\s*id|id\s*number|citizen.*id|nin|prc.*id/i.test(text)) return 'National ID';

      // Visa detection
      if (/visa|entry\s*stamp|immigration/i.test(text)) return 'Visa';

      return 'Unknown';
    } catch (error) {
      this.logger.error(`Document type detection failed: ${error.message}`);
      return 'Unknown';
    }
  }

  /**
   * Parse extracted text to get structured data
   */
  private parseDocumentData(
    text: string,
    documentType: string,
  ): DocumentMetadata['extractedData'] {
    const data: DocumentMetadata['extractedData'] = {};

    // Extract names (first word clusters)
    const nameMatches = text.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)/g);
    if (nameMatches) {
      data.names = [...new Set(nameMatches.slice(0, 3))];
    }

    // Extract dates
    const datePattern = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/g;
    const dates = text.match(datePattern) || [];
    if (dates.length >= 1) {
      data.issueDate = dates[0];
    }
    if (dates.length >= 2) {
      data.expiryDate = dates[1];
    }

    // Extract document number
    const numberPattern = /(?:no\.?|number|#)\s*([A-Z0-9]{6,12})/i;
    const numberMatch = text.match(numberPattern);
    if (numberMatch) {
      data.documentNumber = numberMatch[1];
    }

    // Extract country
    const countryMatch = text.match(/(?:issued by|country|issued in)\s+([A-Z][a-z]+)/i);
    if (countryMatch) {
      data.country = countryMatch[1];
    }

    // Extract date of birth (common patterns)
    const dobPattern = /(?:dob|birth|born)\s*[\:\/]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i;
    const dobMatch = text.match(dobPattern);
    if (dobMatch) {
      data.dateOfBirth = dobMatch[1];
    }

    return data;
  }

  /**
   * Calculate image quality score
   */
  private calculateImageQuality(
    metadata: Metadata,
    extractedText: string,
  ): number {
    let score = 0.5;

    // Resolution check
    if (metadata.width && metadata.height) {
      const megapixels = (metadata.width * metadata.height) / 1000000;
      if (megapixels >= 3) score += 0.2;
      if (megapixels >= 5) score += 0.1;
    }

    // Text extraction check
    if (extractedText.length > 100) score += 0.15;
    if (extractedText.length > 500) score += 0.05;

    // Aspect ratio check (documents are typically rectangular)
    if (metadata.width && metadata.height) {
      const ratio = metadata.width / metadata.height;
      if (ratio > 0.6 && ratio < 1.8) score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Detect facial features in document
   */
  private detectFacialFeatures(text: string): boolean {
    // Simple heuristic: look for common facial feature keywords
    const facialKeywords = ['face', 'photo', 'picture', 'eyes', 'nose', 'mouth', 'signature'];
    return facialKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword),
    );
  }

  /**
   * Detect security features
   */
  private detectSecurityFeatures(text: string, metadata: Metadata): boolean {
    // Check for security-related keywords
    const securityKeywords = ['hologram', 'security', 'feature', 'stripe', 'magnetic', 'chip'];
    const hasSecurityKeywords = securityKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword),
    );

    // Check for reasonable color channels (indicates proper document)
    const hasColorInfo = metadata.channels === 3 || metadata.channels === 4;

    return hasSecurityKeywords || hasColorInfo;
  }

  /**
   * Encrypt and store document
   */
  private async encryptAndStoreDocument(
    filePath: string,
    documentId: string,
    fileBuffer: Buffer,
  ): Promise<string> {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

      const encryptedPath = path.join(this.uploadDir, `${documentId}.enc`);
      fs.writeFileSync(encryptedPath, encrypted);

      this.logger.log(`Document encrypted and stored: ${encryptedPath}`);
      return encryptedPath;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrypt document
   */
  async decryptDocument(encryptedPath: string): Promise<Buffer> {
    try {
      const encrypted = fs.readFileSync(encryptedPath);
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create thumbnail for document preview
   */
  private async createThumbnail(filePath: string, documentId: string): Promise<string> {
    try {
      const thumbnailPath = path.join(this.uploadDir, `${documentId}-thumb.jpg`);
      await sharp(filePath).resize(200, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(thumbnailPath);
      return thumbnailPath;
    } catch (error) {
      this.logger.warn(`Thumbnail creation failed: ${error.message}`);
      return '';
    }
  }

  /**
   * Calculate file hash for integrity verification
   */
  private calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Normalize document type
   */
  private normalizeDocumentType(
    type: string,
  ): 'passport' | 'driver_license' | 'national_id' | 'visa' | 'other' {
    const normalized = type.toLowerCase().replace(/\s+/g, '_');
    if (normalized.includes('passport')) return 'passport';
    if (normalized.includes('driver')) return 'driver_license';
    if (normalized.includes('national')) return 'national_id';
    if (normalized.includes('visa')) return 'visa';
    return 'other';
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Verify document integrity
   */
  verifyDocumentIntegrity(metadata: DocumentMetadata, fileBuffer: Buffer): boolean {
    const currentHash = this.calculateHash(fileBuffer);
    return currentHash === metadata.hash;
  }

  /**
   * Delete document and cleanup
   */
  async deleteDocument(metadata: DocumentMetadata): Promise<void> {
    try {
      if (metadata.encryptedPath && fs.existsSync(metadata.encryptedPath)) {
        fs.unlinkSync(metadata.encryptedPath);
      }
      if (metadata.thumbnailPath && fs.existsSync(metadata.thumbnailPath)) {
        fs.unlinkSync(metadata.thumbnailPath);
      }
      this.logger.log(`Document deleted: ${metadata.documentId}`);
    } catch (error) {
      this.logger.error(`Document deletion failed: ${error.message}`);
    }
  }
}
