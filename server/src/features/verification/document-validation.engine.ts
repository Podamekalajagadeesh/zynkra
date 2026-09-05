import { Injectable, Logger } from '@nestjs/common';
import { DocumentMetadata } from './document-processing.service';

export interface ValidationRule {
  name: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export interface ValidationReport {
  documentId: string;
  overallScore: number; // 0-100
  isPassed: boolean;
  ruleResults: Array<{
    ruleName: string;
    passed: boolean;
    severity: string;
    message: string;
    details?: Record<string, any>;
  }>;
  recommendations: string[];
  timestamp: Date;
}

@Injectable()
export class DocumentValidationEngine {
  private readonly logger = new Logger(DocumentValidationEngine.name);

  private validationRules: Map<string, ValidationRule> = new Map([
    [
      'expiry_check',
      {
        name: 'Document Expiry Check',
        description: 'Ensures document is not expired',
        severity: 'critical',
        enabled: true,
      },
    ],
    [
      'legibility_check',
      {
        name: 'Document Legibility',
        description: 'Ensures document text is clearly readable',
        severity: 'critical',
        enabled: true,
      },
    ],
    [
      'facial_image_check',
      {
        name: 'Facial Image Detection',
        description: 'Ensures document contains facial image',
        severity: 'critical',
        enabled: true,
      },
    ],
    [
      'image_quality_check',
      {
        name: 'Image Quality Assessment',
        description: 'Checks overall image quality and resolution',
        severity: 'warning',
        enabled: true,
      },
    ],
    [
      'security_features_check',
      {
        name: 'Security Features Detection',
        description: 'Detects security features on document',
        severity: 'warning',
        enabled: true,
      },
    ],
    [
      'data_consistency_check',
      {
        name: 'Data Consistency Validation',
        description: 'Ensures extracted data is consistent and valid',
        severity: 'warning',
        enabled: true,
      },
    ],
    [
      'document_type_check',
      {
        name: 'Document Type Verification',
        description: 'Verifies document type matches expected type',
        severity: 'info',
        enabled: true,
      },
    ],
    [
      'fraud_detection',
      {
        name: 'Fraud Pattern Detection',
        description: 'Detects common fraud patterns',
        severity: 'critical',
        enabled: true,
      },
    ],
  ]);

  /**
   * Validate document against all rules
   */
  async validateDocument(metadata: DocumentMetadata): Promise<ValidationReport> {
    try {
      this.logger.log(`Validating document: ${metadata.documentId}`);

      const ruleResults: ValidationReport['ruleResults'] = [];
      const recommendations: string[] = [];

      // Run all validation rules
      for (const [ruleId, rule] of this.validationRules) {
        if (!rule.enabled) continue;

        let result: ValidationReport['ruleResults'][0];

        switch (ruleId) {
          case 'expiry_check':
            result = this.validateExpiry(metadata);
            break;
          case 'legibility_check':
            result = this.validateLegibility(metadata);
            break;
          case 'facial_image_check':
            result = this.validateFacialImage(metadata);
            break;
          case 'image_quality_check':
            result = this.validateImageQuality(metadata);
            break;
          case 'security_features_check':
            result = this.validateSecurityFeatures(metadata);
            break;
          case 'data_consistency_check':
            result = this.validateDataConsistency(metadata);
            break;
          case 'document_type_check':
            result = this.validateDocumentType(metadata);
            break;
          case 'fraud_detection':
            result = await this.detectFraudPatterns(metadata);
            break;
          default:
            continue;
        }

        ruleResults.push(result);

        if (!result.passed && result.severity === 'warning') {
          recommendations.push(result.message);
        }
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(ruleResults);

      // Check if document passes (all critical rules must pass)
      const isPassed = ruleResults
        .filter((r) => r.severity === 'critical')
        .every((r) => r.passed);

      const report: ValidationReport = {
        documentId: metadata.documentId,
        overallScore,
        isPassed,
        ruleResults,
        recommendations,
        timestamp: new Date(),
      };

      this.logger.log(`Validation complete for ${metadata.documentId}: Score ${overallScore}, Passed: ${isPassed}`);
      return report;
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate document expiry
   */
  private validateExpiry(metadata: DocumentMetadata): ValidationReport['ruleResults'][0] {
    const { isExpired } = metadata.validationResults || {};

    return {
      ruleName: 'Document Expiry Check',
      passed: !isExpired,
      severity: 'critical',
      message: isExpired ? 'Document has expired' : 'Document is valid (not expired)',
      details: {
        expiryDate: metadata.extractedData?.expiryDate,
        isExpired,
      },
    };
  }

  /**
   * Validate document legibility
   */
  private validateLegibility(metadata: DocumentMetadata): ValidationReport['ruleResults'][0] {
    const { isLegible } = metadata.validationResults || {};

    return {
      ruleName: 'Document Legibility',
      passed: isLegible,
      severity: 'critical',
      message: isLegible ? 'Document text is legible' : 'Document text is not clearly legible',
      details: {
        isLegible,
        extractedTextLength: metadata.extractedData
          ? JSON.stringify(metadata.extractedData).length
          : 0,
      },
    };
  }

  /**
   * Validate facial image presence
   */
  private validateFacialImage(metadata: DocumentMetadata): ValidationReport['ruleResults'][0] {
    const { hasFacialImage } = metadata.validationResults || {};

    return {
      ruleName: 'Facial Image Detection',
      passed: hasFacialImage,
      severity: 'critical',
      message: hasFacialImage ? 'Facial image detected' : 'No facial image detected',
      details: {
        hasFacialImage,
      },
    };
  }

  /**
   * Validate image quality
   */
  private validateImageQuality(metadata: DocumentMetadata): ValidationReport['ruleResults'][0] {
    const { qualityScore } = metadata.validationResults || { qualityScore: 0 };
    const passed = qualityScore >= 0.7;

    return {
      ruleName: 'Image Quality Assessment',
      passed,
      severity: 'warning',
      message: `Image quality score: ${(qualityScore * 100).toFixed(1)}%`,
      details: {
        qualityScore,
        threshold: 0.7,
      },
    };
  }

  /**
   * Validate security features
   */
  private validateSecurityFeatures(metadata: DocumentMetadata): ValidationReport['ruleResults'][0] {
    const { securityFeaturesDetected } = metadata.validationResults || {};

    return {
      ruleName: 'Security Features Detection',
      passed: securityFeaturesDetected,
      severity: 'warning',
      message: securityFeaturesDetected
        ? 'Security features detected'
        : 'Unable to detect security features',
      details: {
        securityFeaturesDetected,
      },
    };
  }

  /**
   * Validate data consistency
   */
  private validateDataConsistency(metadata: DocumentMetadata): ValidationReport['ruleResults'][0] {
    const data = metadata.extractedData || {};

    // Check if essential fields are present
    const hasDocumentNumber = !!data.documentNumber;
    const hasNames = !!data.names && data.names.length > 0;
    const hasDateOfBirth = !!data.dateOfBirth;

    // Validate date formats
    const issueDateValid = !data.issueDate || this.isValidDate(data.issueDate);
    const expiryDateValid = !data.expiryDate || this.isValidDate(data.expiryDate);
    const dobValid = !data.dateOfBirth || this.isValidDate(data.dateOfBirth);

    const passed = hasDocumentNumber && hasNames && issueDateValid && expiryDateValid && dobValid;

    return {
      ruleName: 'Data Consistency Validation',
      passed,
      severity: 'warning',
      message: passed ? 'All extracted data is consistent' : 'Some data fields are missing or invalid',
      details: {
        hasDocumentNumber,
        hasNames,
        hasDateOfBirth,
        issueDateValid,
        expiryDateValid,
        dobValid,
        extractedData: data,
      },
    };
  }

  /**
   * Validate document type
   */
  private validateDocumentType(metadata: DocumentMetadata): ValidationReport['ruleResults'][0] {
    const typeMatch =
      metadata.documentType === 'other' ||
      metadata.detectedType?.toLowerCase().includes(metadata.documentType.replace('_', ' ').toLowerCase());

    return {
      ruleName: 'Document Type Verification',
      passed: typeMatch,
      severity: 'info',
      message: typeMatch
        ? `Document type confirmed as ${metadata.documentType}`
        : `Document type mismatch. Expected: ${metadata.documentType}, Detected: ${metadata.detectedType}`,
      details: {
        expectedType: metadata.documentType,
        detectedType: metadata.detectedType,
        confidenceScore: metadata.confidenceScore,
      },
    };
  }

  /**
   * Detect fraud patterns
   */
  private async detectFraudPatterns(metadata: DocumentMetadata): Promise<ValidationReport['ruleResults'][0]> {
    const fraudIndicators: string[] = [];

    // Check for suspicious patterns
    if (
      metadata.extractedData?.expiryDate &&
      metadata.extractedData?.issueDate
    ) {
      const issueDate = new Date(metadata.extractedData.issueDate);
      const expiryDate = new Date(metadata.extractedData.expiryDate);

      // Check for unusually short validity period (fraud indicator)
      const validityMonths =
        (expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (validityMonths < 6 && metadata.documentType !== 'visa') {
        fraudIndicators.push('Unusually short document validity period');
      }
    }

    // Check for missing required fields for specific document types
    if (metadata.documentType === 'passport' && !metadata.extractedData?.documentNumber) {
      fraudIndicators.push('Passport missing document number');
    }

    // Check for suspicious image anomalies
    if (!metadata.validationResults?.hasFacialImage) {
      fraudIndicators.push('Missing facial image');
    }

    // Check for text manipulation indicators
    if (metadata.validationResults?.qualityScore && metadata.validationResults.qualityScore < 0.4) {
      fraudIndicators.push('Image quality unusually low - possible manipulation');
    }

    const passed = fraudIndicators.length === 0;

    return {
      ruleName: 'Fraud Pattern Detection',
      passed,
      severity: 'critical',
      message: passed
        ? 'No fraud patterns detected'
        : `Detected ${fraudIndicators.length} potential fraud indicators`,
      details: {
        indicators: fraudIndicators,
        riskLevel: fraudIndicators.length > 2 ? 'high' : fraudIndicators.length > 0 ? 'medium' : 'low',
      },
    };
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(
    ruleResults: ValidationReport['ruleResults'],
  ): number {
    if (ruleResults.length === 0) return 0;

    let totalWeight = 0;
    let weightedScore = 0;

    for (const result of ruleResults) {
      const weight =
        result.severity === 'critical' ? 3 : result.severity === 'warning' ? 2 : 1;
      totalWeight += weight;
      weightedScore += result.passed ? weight * 100 : 0;
    }

    return Math.round((weightedScore / totalWeight) * 100);
  }

  /**
   * Validate date format and value
   */
  private isValidDate(dateString: string): boolean {
    const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    if (!datePattern.test(dateString)) return false;

    try {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Get validation rule by ID
   */
  getValidationRule(ruleId: string): ValidationRule | undefined {
    return this.validationRules.get(ruleId);
  }

  /**
   * Get all validation rules
   */
  getAllValidationRules(): ValidationRule[] {
    return Array.from(this.validationRules.values());
  }

  /**
   * Enable/disable validation rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.validationRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.logger.log(`Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}
