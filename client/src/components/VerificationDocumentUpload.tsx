import { useCallback, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

export interface DocumentUploadProps {
  onSuccess?: () => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

export function VerificationDocumentUpload({
  onSuccess,
  maxSize = 10,
  acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
}: DocumentUploadProps) {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
    uploadedAt: string;
  } | null>(null);

  const validateFile = (selectedFile: File): boolean => {
    // Check file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      addToast(`File size must be less than ${maxSize}MB`, 'error');
      return false;
    }

    // Check file format
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      addToast(
        `File format not accepted. Accepted formats: ${acceptedFormats.join(', ')}`,
        'error',
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      if (!validateFile(selectedFile)) {
        return;
      }

      setFile(selectedFile);
      setUploadStatus('idle');
    },
    [maxSize, acceptedFormats],
  );

  const handleUpload = async () => {
    if (!file) {
      addToast('Please select a file first', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.post('/users/me/verification-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedFile({
        name: file.name,
        url: response.data.url,
        uploadedAt: new Date().toISOString(),
      });
      setUploadStatus('success');
      setFile(null);
      addToast('Document uploaded successfully', 'success');
      onSuccess?.();
    } catch (error: any) {
      setUploadStatus('error');
      const message =
        error.response?.data?.message || 'Failed to upload document. Please try again.';
      addToast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  if (uploadedFile && uploadStatus === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900/30 dark:bg-green-950/30">
        <div className="flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Document uploaded
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-2">
              Uploaded {new Date(uploadedFile.uploadedAt).toLocaleDateString()}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUploadedFile(null);
                setUploadStatus('idle');
              }}
              className="mt-3 text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/50"
            >
              Upload another document
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900/70">
      <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
        Upload Identity Document
      </h3>

      <div className="space-y-4">
        <p className="text-sm text-dark-600 dark:text-dark-300">
          Please upload a government-issued ID document (passport, driver's license, or national ID).
          Maximum file size: {maxSize}MB. Accepted formats: {acceptedFormats.join(', ').toUpperCase()}
        </p>

        <div className="relative">
          <input
            type="file"
            onChange={handleFileSelect}
            accept={acceptedFormats.map((f) => `.${f}`).join(',')}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Upload identity document"
          />
          <div className="border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-lg p-8 text-center bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
            <Upload className="h-8 w-8 text-dark-400 dark:text-dark-500 mx-auto mb-2" />
            {file ? (
              <div>
                <p className="font-medium text-dark-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-dark-900 dark:text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                  Select your identity document
                </p>
              </div>
            )}
          </div>
        </div>

        {uploadStatus === 'error' && (
          <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-200">
              Upload failed. Please check the file and try again.
            </p>
          </div>
        )}

        {file && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-dark-500 dark:text-dark-400 mt-4">
        Your document is securely stored and used only for verification purposes.
      </p>
    </div>
  );
}
