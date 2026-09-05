import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, XCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

interface VerificationAppealFormProps {
  requestId: string;
  rejectionReason?: string;
  onSuccess?: () => void;
}

interface Appeal {
  id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reason: string;
  submittedAt: string;
  reviewNotes?: string;
  reviewedAt?: string;
  links?: string[];
  documentUrls?: string[];
}

export function VerificationAppealForm({
  requestId,
  rejectionReason,
  onSuccess,
}: VerificationAppealFormProps) {
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [links, setLinks] = useState('');
  const [documentUrls, setDocumentUrls] = useState('');
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);

  const loadAppeals = async () => {
    setLoadingAppeals(true);
    try {
      const res = await api.get('/verification/appeals');
      if (res.data && Array.isArray(res.data)) {
        setAppeals(res.data);
      }
    } catch (error) {
      console.error('Failed to load appeals:', error);
    } finally {
      setLoadingAppeals(false);
    }
  };

  const handleShowForm = () => {
    setShowForm(true);
    loadAppeals();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const linkList = links
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 5);

      const docUrls = documentUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean)
        .slice(0, 5);

      if (appealReason.length < 20) {
        addToast('Appeal reason must be at least 20 characters', 'error');
        setSubmitting(false);
        return;
      }

      await api.post('/verification/appeals', {
        requestId,
        appealDto: {
          appealReason,
          links: linkList.length > 0 ? linkList : undefined,
          documentUrls: docUrls.length > 0 ? docUrls : undefined,
        },
      });

      setSubmitted(true);
      addToast('Appeal submitted successfully!', 'success');
      setAppealReason('');
      setLinks('');
      setDocumentUrls('');

      setTimeout(() => {
        loadAppeals();
      }, 1000);

      setTimeout(() => {
        setShowForm(false);
        onSuccess?.();
      }, 3000);
    } catch (error: any) {
      const message = error.response?.data?.message;
      addToast(
        Array.isArray(message) ? message[0] : message || 'Failed to submit appeal',
        'error',
      );
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: Appeal['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusLabel = (status: Appeal['status']) => {
    const labels: Record<Appeal['status'], string> = {
      pending: 'Pending Review',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return labels[status];
  };

  if (!showForm && appeals.length === 0) {
    return (
      <Button onClick={handleShowForm} variant="outline" className="w-full mt-4">
        Submit an Appeal
      </Button>
    );
  }

  if (!showForm && appeals.length > 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">
                You have submitted {appeals.length} {appeals.length === 1 ? 'appeal' : 'appeals'}
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-400">
                View the status of your appeals below.
              </p>
            </div>
            <Button
              onClick={handleShowForm}
              variant="outline"
              size="sm"
              disabled={appeals.length >= 3}
            >
              {appeals.length >= 3 ? 'Max appeals reached' : 'New appeal'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {appeals.map((appeal) => (
            <div
              key={appeal.id}
              className="rounded-xl border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900"
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(appeal.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-dark-900 dark:text-white">
                      {getStatusLabel(appeal.status)}
                    </h4>
                    <span className="text-xs text-dark-500">
                      {new Date(appeal.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-dark-600 dark:text-dark-400">
                    {appeal.reason.substring(0, 150)}
                    {appeal.reason.length > 150 ? '...' : ''}
                  </p>
                  {appeal.reviewNotes && (
                    <div className="mt-2 rounded bg-dark-100 p-2 dark:bg-dark-800">
                      <p className="text-xs font-medium text-dark-700 dark:text-dark-300">
                        Reviewer Notes:
                      </p>
                      <p className="text-xs text-dark-600 dark:text-dark-400">
                        {appeal.reviewNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-950/30 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
            Appeal Submitted
          </h3>
          <p className="text-sm text-green-800 dark:text-green-400">
            Your appeal has been submitted. Our team will review it and notify you of the decision.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">
            Appeal This Decision
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-400">
            If you believe this was a mistake, you can submit an appeal with additional evidence or
            information.
          </p>
        </div>
      </div>

      {rejectionReason && (
        <div className="rounded-lg bg-white/50 dark:bg-dark-900/50 p-3 border border-amber-300 dark:border-amber-900">
          <p className="text-sm font-medium text-dark-900 dark:text-white mb-1">Rejection reason:</p>
          <p className="text-sm text-dark-700 dark:text-dark-300">{rejectionReason}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="appeal-reason" className="block text-sm font-medium mb-1">
            Appeal Reason
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="appeal-reason"
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            minLength={20}
            maxLength={3000}
            required
            rows={5}
            placeholder="Explain why you believe the decision was incorrect and provide any additional context (min 20 characters, max 3000)."
            className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
          />
          <p className="mt-1 text-xs text-dark-500">
            {appealReason.length}/3000 characters
          </p>
        </div>

        <div>
          <label htmlFor="appeal-links" className="block text-sm font-medium mb-1">
            Supporting Links (optional)
          </label>
          <textarea
            id="appeal-links"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            rows={2}
            placeholder="Add links to supporting evidence or profiles (one per line, max 5)"
            className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
          />
        </div>

        <div>
          <label htmlFor="appeal-docs" className="block text-sm font-medium mb-1">
            Document URLs (optional)
          </label>
          <textarea
            id="appeal-docs"
            value={documentUrls}
            onChange={(e) => setDocumentUrls(e.target.value)}
            rows={2}
            placeholder="Add URLs to documents or screenshots (one per line, max 5)"
            className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={submitting || appealReason.length < 20}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit Appeal'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setSubmitted(false);
            }}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-dark-500">
          Note: You can submit a maximum of 3 appeals per request. After rejection, you must wait
          30 days before submitting another appeal.
        </p>
      </form>
    </div>
  );
}
