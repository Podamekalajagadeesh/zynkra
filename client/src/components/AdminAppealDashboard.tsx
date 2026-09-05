import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

interface Appeal {
  id: string;
  userId: string;
  requestId: string;
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  documentUrls?: string[];
  links?: string[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface User {
  id: string;
  email: string;
  username: string;
}

interface AppealWithUser extends Appeal {
  user?: User;
}

export function AdminAppealDashboard() {
  const { addToast } = useToast();
  const [appeals, setAppeals] = useState<AppealWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>(
    'pending',
  );
  const [selectedAppeal, setSelectedAppeal] = useState<AppealWithUser | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadAppeals();
  }, [filterStatus]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      // Note: This endpoint might need to be updated based on actual backend implementation
      const res = await api.get(`/verification/admin/appeals?status=${filterStatus}`);
      if (res.data && Array.isArray(res.data)) {
        setAppeals(res.data);
      }
    } catch (error) {
      console.error('Failed to load appeals:', error);
      addToast('Failed to load appeals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appealId: string) => {
    setSubmitting(appealId);
    try {
      await api.post(`/verification/admin/appeals/${appealId}/approve`);
      addToast('Appeal approved!', 'success');
      loadAppeals();
      setSelectedAppeal(null);
      setReviewNotes('');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to approve appeal', 'error');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async (appealId: string) => {
    if (!reviewNotes.trim()) {
      addToast('Please provide review notes', 'error');
      return;
    }

    setSubmitting(appealId);
    try {
      await api.post(`/verification/admin/appeals/${appealId}/reject`, {
        notes: reviewNotes,
      });
      addToast('Appeal rejected!', 'success');
      loadAppeals();
      setSelectedAppeal(null);
      setReviewNotes('');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to reject appeal', 'error');
    } finally {
      setSubmitting(null);
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
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusLabel = (status: Appeal['status']) => {
    const labels: Record<Appeal['status'], string> = {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return labels[status];
  };

  const filteredAppeals = appeals.filter((a) => filterStatus === 'all' || a.status === filterStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Verification Appeals</h1>
        <p className="text-dark-600 dark:text-dark-400">
          Review and manage verification appeals from users
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status.replace('_', ' ')}
            {status !== 'all' && (
              <span className="ml-2 text-xs">
                ({appeals.filter((a) => a.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredAppeals.length === 0 ? (
        <div className="rounded-xl border border-dark-200 bg-white p-8 text-center dark:border-dark-700 dark:bg-dark-900">
          <p className="text-dark-600 dark:text-dark-400">No appeals to display</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppeals.map((appeal) => (
            <div
              key={appeal.id}
              className="rounded-xl border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(appeal.status)}
                    <span className="font-semibold">{getStatusLabel(appeal.status)}</span>
                    <span className="text-xs text-dark-500">
                      {new Date(appeal.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-dark-900 dark:text-white">
                      User: {appeal.user?.username || 'Unknown'} ({appeal.user?.email || 'N/A'})
                    </p>
                    <p className="text-xs text-dark-500 mt-1">Appeal ID: {appeal.id}</p>
                  </div>

                  <div className="rounded bg-dark-50 dark:bg-dark-800 p-3 mb-3">
                    <p className="text-sm text-dark-900 dark:text-white leading-relaxed">
                      {appeal.reason}
                    </p>
                  </div>

                  {appeal.links && appeal.links.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-dark-700 dark:text-dark-300 mb-1">
                        Supporting Links:
                      </p>
                      <ul className="text-xs space-y-1">
                        {appeal.links.map((link, i) => (
                          <li key={i}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {appeal.documentUrls && appeal.documentUrls.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-dark-700 dark:text-dark-300 mb-1">
                        Document URLs:
                      </p>
                      <ul className="text-xs space-y-1">
                        {appeal.documentUrls.map((url, i) => (
                          <li key={i}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {appeal.reviewNotes && (
                    <div className="rounded bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-200 dark:border-blue-900">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                        Review Notes:
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-400">{appeal.reviewNotes}</p>
                    </div>
                  )}
                </div>

                {appeal.status === 'pending' || appeal.status === 'under_review' ? (
                  <Button
                    onClick={() => {
                      setSelectedAppeal(appeal);
                      setReviewNotes('');
                    }}
                    size="sm"
                  >
                    Review
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-900 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Review Appeal</h2>

            <div className="rounded bg-dark-50 dark:bg-dark-800 p-3">
              <p className="text-sm text-dark-900 dark:text-white">{selectedAppeal.reason}</p>
            </div>

            <div>
              <label htmlFor="review-notes" className="block text-sm font-medium mb-2">
                Review Notes
              </label>
              <textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Enter your review notes (required for rejection)..."
                className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
              />
              <p className="mt-1 text-xs text-dark-500">{reviewNotes.length}/500 characters</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(selectedAppeal.id)}
                disabled={submitting === selectedAppeal.id}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {submitting === selectedAppeal.id ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Approving…
                  </>
                ) : (
                  'Approve'
                )}
              </Button>
              <Button
                onClick={() => handleReject(selectedAppeal.id)}
                disabled={submitting === selectedAppeal.id || !reviewNotes.trim()}
                variant="destructive"
                className="flex-1"
              >
                {submitting === selectedAppeal.id ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting…
                  </>
                ) : (
                  'Reject'
                )}
              </Button>
              <Button
                onClick={() => {
                  setSelectedAppeal(null);
                  setReviewNotes('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
