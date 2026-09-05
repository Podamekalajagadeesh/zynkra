# Document Verification - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

```bash
# Backend
cd server
npm install tesseract.js sharp multer typeorm --save

# Frontend  
cd ../client
npm install lucide-react --save
```

### Step 2: Configure Environment

Create `server/.env`:
```env
# Document Verification
DOCUMENT_ENCRYPTION_KEY=your-32-character-encryption-key-here!!!!
DOCUMENT_MAX_FILE_SIZE=10485760
DOCUMENT_UPLOAD_DIR=./uploads/documents

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zynkra

# Tesseract
TESSERACT_LANG=eng
TESSERACT_WORKER_COUNT=2
```

### Step 3: Run Database Migration

```bash
cd server
npm run typeorm migration:run
```

### Step 4: Register Module

In your `app.module.ts`:

```typescript
import { DocumentVerificationController } from './features/verification/document-verification.controller';
import { DocumentProcessingService } from './features/verification/document-processing.service';
import { DocumentStorageService } from './features/verification/document-storage.service';
import { DocumentValidationEngine } from './features/verification/document-validation.engine';

@Module({
  controllers: [DocumentVerificationController],
  providers: [
    DocumentProcessingService,
    DocumentStorageService,
    DocumentValidationEngine,
  ],
})
export class VerificationModule {}
```

### Step 5: Use Components

**Frontend - User Upload:**
```tsx
import { AdvancedVerificationDocumentUpload } from '@/components/AdvancedVerificationDocumentUpload';

export function VerificationPage() {
  return (
    <AdvancedVerificationDocumentUpload
      accountId={userId}
      documentType="passport"
      onSuccess={(response) => {
        console.log('Validation score:', response.validationScore);
      }}
    />
  );
}
```

**Frontend - Admin Dashboard:**
```tsx
import { AdvancedAdminVerificationDashboard } from '@/components/AdvancedAdminVerificationDashboard';

export function AdminPage() {
  return <AdvancedAdminVerificationDashboard userId={adminId} role="admin" />;
}
```

### Step 6: Start Services

```bash
# Terminal 1 - Backend
cd server
npm run start:dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Step 7: Test the Flow

1. Navigate to `/verification`
2. Upload a document (passport, license, or ID)
3. Wait for validation (2-5 seconds)
4. Review validation results
5. Navigate to `/admin/verification` (as admin)
6. Review pending documents
7. Approve or reject with notes

---

## 📋 File Checklist

Backend files created:
- ✅ `server/src/features/verification/document-processing.service.ts`
- ✅ `server/src/features/verification/document-storage.service.ts`
- ✅ `server/src/features/verification/document-validation.engine.ts`
- ✅ `server/src/features/verification/document-verification.controller.ts`
- ✅ `server/src/features/verification/entities/document-verification.entity.ts`
- ✅ `server/src/migrations/1704067200000-CreateDocumentVerificationTables.ts`

Frontend files created:
- ✅ `client/src/components/AdvancedVerificationDocumentUpload.tsx`
- ✅ `client/src/components/AdvancedAdminVerificationDashboard.tsx`

Documentation created:
- ✅ `DOCUMENT_VERIFICATION_GUIDE.md`
- ✅ `DOCUMENT_VERIFICATION_IMPLEMENTATION_SUMMARY.md`

---

## 🔑 Key API Endpoints

### Upload Document
```bash
POST /verification/documents/upload
Content-Type: multipart/form-data

document: <file>
accountId: user123
documentType: passport

Response: {
  documentId: "doc_...",
  validationScore: 85,
  isPassed: true,
  validationReport: {...},
  extractedData: {...}
}
```

### Get Pending Documents (Admin)
```bash
GET /verification/documents/admin/pending?limit=50&offset=0

Response: {
  total: 10,
  documents: [...]
}
```

### Approve Document (Admin)
```bash
PUT /verification/documents/rec_123/approve
Content-Type: application/json

{
  "reviewerId": "admin456",
  "reviewNotes": "Document verified"
}

Response: {
  status: "approved",
  expiresAt: "2029-01-01"
}
```

---

## 🛠️ Troubleshooting

### OCR Not Working
```bash
# Install Tesseract dependencies
npm install --save tesseract.js

# Verify installation
node -e "require('tesseract.js').recognize('test.jpg')"
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U user -d zynkra -c "SELECT 1"

# Run migration
npm run typeorm migration:run
```

### Upload Directory Missing
```bash
# Create directories
mkdir -p uploads/documents
mkdir -p uploads/temp

# Set permissions
chmod 755 uploads/documents
```

### Encryption Key Error
```bash
# Generate new key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Add to .env
DOCUMENT_ENCRYPTION_KEY=your-generated-key-here
```

---

## 📊 Example Validation Results

```json
{
  "documentId": "doc_1704067200000_abc123",
  "overallScore": 87,
  "isPassed": true,
  "ruleResults": [
    {
      "ruleName": "Document Expiry Check",
      "passed": true,
      "severity": "critical",
      "message": "Document is valid (not expired)"
    },
    {
      "ruleName": "Document Legibility",
      "passed": true,
      "severity": "critical",
      "message": "Document text is legible"
    },
    {
      "ruleName": "Facial Image Detection",
      "passed": true,
      "severity": "critical",
      "message": "Facial image detected"
    },
    {
      "ruleName": "Image Quality Assessment",
      "passed": true,
      "severity": "warning",
      "message": "Image quality score: 92.0%"
    }
  ],
  "extractedData": {
    "names": ["JOHN DOE"],
    "documentNumber": "A12345678",
    "issueDate": "01/15/2020",
    "expiryDate": "01/15/2030",
    "country": "United States",
    "dateOfBirth": "05/20/1990"
  }
}
```

---

## 🎯 Common Tasks

### Add Custom Validation Rule
```typescript
// In DocumentValidationEngine
private validateCustom(metadata: DocumentMetadata) {
  const passed = /* your logic */;
  return {
    ruleName: 'Custom Rule',
    passed,
    severity: 'warning',
    message: 'Custom validation message',
  };
}
```

### Change Scoring Weights
```typescript
// In DocumentValidationEngine.calculateOverallScore()
const weight = 
  result.severity === 'critical' ? 5 :  // Change from 3
  result.severity === 'warning' ? 3 :   // Change from 2
  1;
```

### Update Validation Threshold
```typescript
// In document-verification.controller.ts
const isPassed = validationReport.overallScore >= 75; // Change from 70
```

### Extend Document Types
```typescript
// In document-processing.service.ts
export interface DocumentMetadata {
  documentType: 
    | 'passport' 
    | 'driver_license' 
    | 'national_id' 
    | 'visa' 
    | 'travel_permit'  // Add new type
    | 'other';
}
```

---

## 📈 Performance Optimization

### Enable Document Caching
```typescript
// In document-storage.service.ts
private cache = new Map<string, DocumentRecord>();

async getDocumentById(id: string) {
  if (this.cache.has(id)) return this.cache.get(id);
  const doc = await this.repository.findOne(id);
  this.cache.set(id, doc);
  return doc;
}
```

### Batch Process Documents
```typescript
// Process multiple documents in parallel
const results = await Promise.all(
  files.map(file => this.processingService.processDocument(file.path, file.name, type))
);
```

### Queue Long-Running Tasks
```typescript
// Use Bull or similar for background jobs
queue.add('process-document', { documentId }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});
```

---

## 🔒 Security Best Practices

1. **Encryption Key**
   - Store in AWS Secrets Manager or similar
   - Rotate periodically
   - Never commit to version control

2. **File Uploads**
   - Validate file type AND content
   - Scan for malware
   - Implement rate limiting

3. **Database**
   - Use encrypted connections (SSL)
   - Regular backups
   - Principle of least privilege for DB users

4. **Access Control**
   - Implement role-based access
   - Audit all admin actions
   - Require 2FA for admin accounts

5. **Data Privacy**
   - Encrypt documents at rest
   - GDPR-compliant data deletion
   - Anonymize in logs

---

## 📚 Additional Resources

- [Tesseract.js Docs](https://github.com/naptha/tesseract.js)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [TypeORM Guide](https://typeorm.io/relations)
- [NestJS Security](https://docs.nestjs.com/security/authentication)

---

## ✅ Done!

Your Document Verification system is now ready for production use.

**Key Features Enabled:**
- ✅ OCR text extraction
- ✅ AI document detection
- ✅ 8-rule validation
- ✅ Secure encryption
- ✅ Admin dashboard
- ✅ Audit logging
- ✅ Appeal tracking

**Next: Customize and Deploy! 🚀**
