import React, { useCallback, useState } from 'react';
import { AlertCircle, CheckCircle, FileText, Loader, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

interface ValidationResult {
  ruleName: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface DocumentUploadResponse {
  success: boolean;
  documentId: string;
  recordId: string;
  status: string;
  validationScore: number;
  isPassed: boolean;
  validationReport: {
    ruleResults: ValidationResult[];
    recommendations: string[];
  };
  extractedData: Record<string, unknown>;
  message: string;
}

interface AdvancedVerificationDocumentUploadProps {
  onSuccess?: (response: DocumentUploadResponse) => void;
  maxSize?: number;
  acceptedFormats?: string[];
  accountId: string;
  documentType: 'passport' | 'driver_license' | 'national_id' | 'visa' | 'other';
}

export function AdvancedVerificationDocumentUpload({
  onSuccess,
  maxSize = 10,
  acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
  accountId,
  documentType,
}: AdvancedVerificationDocumentUploadProps) {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<DocumentUploadResponse | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const chooseFile = useCallback((selectedFile: File) => {
    const nextErrors: string[] = [];
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (selectedFile.size > maxSize * 1024 * 1024) nextErrors.push(`File size must be less than ${maxSize}MB`);
    if (!extension || !acceptedFormats.includes(extension)) nextErrors.push(`File format not accepted. Accepted: ${acceptedFormats.join(', ')}`);
    if (selectedFile.size < 100 * 1024) nextErrors.push('File is too small. Please use a clear, high-resolution document image');
    setErrors(nextErrors);
    nextErrors.forEach((error) => addToast(error, 'error'));
    if (nextErrors.length > 0) return;
    setFile(selectedFile);
    setResponse(null);
  }, [acceptedFormats, addToast, maxSize]);

  const handleUpload = async () => {
    if (!file) {
      addToast('Please select a file first', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      const result = await api.post<DocumentUploadResponse>('/verification/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResponse(result.data);
      addToast('Document uploaded and processed successfully', 'success');
      onSuccess?.(result.data);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to upload document. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (response) {
    return (
      <section className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900/30 dark:bg-green-950/30">
        <div className="flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">Document processed</h3>
            <p className="text-sm text-green-800 dark:text-green-200">Validation score: {response.validationScore}%</p>
            <p className="text-sm text-green-800 dark:text-green-200">Status: {response.status}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {response.validationReport.ruleResults.map((result) => (
            <div key={result.ruleName} className="flex gap-2 rounded bg-white/60 p-2 text-sm dark:bg-black/20">
              {result.passed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
              <span>{result.ruleName}: {result.message}</span>
            </div>
          ))}
        </div>
        <Button className="mt-5" variant="outline" onClick={() => { setFile(null); setResponse(null); }}>Upload another document</Button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900/70">
      <h3 className="font-semibold text-dark-900 dark:text-white">Upload identity document</h3>
      <p className="mt-1 text-sm text-dark-600 dark:text-dark-400">Upload a government-issued {documentType.replace('_', ' ')}.</p>
      <div
        className="relative mt-4 rounded-lg border-2 border-dashed border-dark-300 p-8 text-center dark:border-dark-600"
        onDrop={(event) => { event.preventDefault(); const dropped = event.dataTransfer.files[0]; if (dropped) chooseFile(dropped); }}
        onDragOver={(event) => event.preventDefault()}
      >
        <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept={acceptedFormats.map((format) => `.${format}`).join(',')} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) chooseFile(selected); }} disabled={uploading} />
        <Upload className="mx-auto h-8 w-8 text-dark-400" />
        <p className="mt-2 text-sm font-medium text-dark-900 dark:text-white">Drop a document here or choose a file</p>
        <p className="mt-1 text-xs text-dark-500">{acceptedFormats.join(', ').toUpperCase()} | Max {maxSize}MB</p>
      </div>
      {errors.length > 0 && <div className="mt-3 space-y-1 text-sm text-red-600">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
      {file && <div className="mt-4 flex items-center justify-between rounded bg-dark-100 p-3 dark:bg-dark-800"><span className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4" />{file.name}</span><button type="button" onClick={() => setFile(null)} aria-label="Remove selected document"><X className="h-4 w-4" /></button></div>}
      <Button className="mt-4" onClick={handleUpload} disabled={!file || uploading}>{uploading && <Loader className="mr-2 h-4 w-4 animate-spin" />} {uploading ? 'Processing...' : 'Upload and validate'}</Button>
    </section>
  );
}
