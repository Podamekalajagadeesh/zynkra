import { useEffect, useState } from 'react';
import { CheckCircle, Download, Eye, Loader, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

interface DocumentRecord {
  id: string;
  documentId: string;
  accountId: string;
  status: string;
  documentType: string;
  submittedAt: string;
  extractedData?: Record<string, unknown>;
  validationResults?: Record<string, unknown>;
  qualityScore?: number;
}

interface Props {
  userId: string;
  role: string;
}

export function AdvancedAdminVerificationDashboard({ userId, role }: Props) {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await api.get<{ documents: DocumentRecord[] }>('/verification/documents/admin/pending');
      setDocuments(result.data.documents ?? []);
    } catch {
      addToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') void loadDocuments();
  }, [role]);

  const review = async (status: 'approve' | 'reject') => {
    if (!selected) return;
    if (status === 'reject' && !rejectionReason.trim()) {
      addToast('Rejection reason is required', 'error');
      return;
    }
    try {
      await api.put(`/verification/documents/${selected.id}/${status}`, {
        reviewNotes: notes,
        ...(status === 'reject' ? { rejectionReason } : {}),
      });
      addToast(`Document ${status}d successfully`, 'success');
      setSelected(null);
      setNotes('');
      setRejectionReason('');
      await loadDocuments();
    } catch {
      addToast(`Failed to ${status} document`, 'error');
    }
  };

  const download = async (record: DocumentRecord) => {
    try {
      const result = await api.get(`/verification/documents/${record.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${record.documentType}-${record.documentId}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Failed to download document', 'error');
    }
  };

  if (role !== 'admin') return <p className="text-sm text-red-600">Unauthorized access.</p>;
  if (loading) return <Loader className="h-8 w-8 animate-spin text-blue-600" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark-900 dark:text-white">Document review queue</h2>
        <Button variant="outline" onClick={() => void loadDocuments()}>Refresh</Button>
      </div>
      {documents.length === 0 ? <p className="text-sm text-dark-600">No documents are awaiting review.</p> : (
        <div className="divide-y rounded-lg border border-dark-200 dark:divide-dark-700 dark:border-dark-700">
          {documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-dark-900 dark:text-white">{document.documentType} | {document.accountId}</p>
                <p className="text-sm text-dark-500">{document.status} | score {document.qualityScore ?? 'n/a'} | {new Date(document.submittedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelected(document)} aria-label="Review document"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" onClick={() => void download(document)} aria-label="Download document"><Download className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="rounded-lg border border-dark-200 p-4 dark:border-dark-700">
          <h3 className="font-semibold text-dark-900 dark:text-white">Review {selected.documentType}</h3>
          <textarea className="mt-3 min-h-24 w-full rounded border p-2" placeholder="Review notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <textarea className="mt-3 min-h-20 w-full rounded border p-2" placeholder="Rejection reason, if applicable" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void review('approve')}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
            <Button variant="destructive" onClick={() => void review('reject')}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
