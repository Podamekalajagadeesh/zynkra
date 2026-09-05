import { useEffect, useState } from 'react';
import { Check, X, Clock, User, Link2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';
import { api } from '../lib/api';

interface VerificationRequestItem {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
  };
  category: string;
  workflow: string;
  justification: string;
  links: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export function AdminVerificationDashboard() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filter === 'pending' ? { status: 'pending' } : {};
      const res = await api.get('/verification/admin/requests', { params });
      setRequests(res.data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
      addToast('Failed to load verification requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setApproving(true);
    try {
      await api.post(`/verification/${requestId}/approve`, { note: reviewNote });
      addToast('Verification approved', 'success');
      setReviewingId(null);
      setReviewNote('');
      loadRequests();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!reviewNote.trim()) {
      addToast('Please provide a reason for rejection', 'error');
      return;
    }
    setApproving(true);
    try {
      await api.post(`/verification/${requestId}/reject`, { note: reviewNote });
      addToast('Verification rejected', 'success');
      setReviewingId(null);
      setReviewNote('');
      loadRequests();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900/70">
        <p className="text-sm text-dark-500">Loading verification requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending ({requests.filter((r) => r.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Requests
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dark-200 bg-white p-12 text-center dark:border-dark-700 dark:bg-dark-900/70">
          <Clock className="mx-auto h-8 w-8 text-dark-400 mb-2" />
          <p className="text-dark-500">No verification requests to review</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-dark-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900/70"
            >
              {reviewingId === request.id ? (
                // Review form
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-dark-900 dark:text-white">
                      Review Request from {request.user.displayName || request.user.username}
                    </h3>
                    <button
                      onClick={() => setReviewingId(null)}
                      className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 bg-dark-50 dark:bg-dark-800 p-4 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">
                        Justification
                      </p>
                      <p className="text-sm text-dark-900 dark:text-white mt-1">
                        {request.justification}
                      </p>
                    </div>

                    {request.links.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">
                          Supporting Links
                        </p>
                        <ul className="text-sm text-dark-600 dark:text-dark-300 mt-2 space-y-1">
                          {request.links.map((link, i) => (
                            <li key={i} className="flex items-center gap-2 truncate">
                              <Link2 className="h-3 w-3 flex-shrink-0" />
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate hover:underline"
                              >
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                      Review note {request.status === 'rejected' && '(required for rejection)'}
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add a note for the user..."
                      className="w-full px-3 py-2 rounded-lg border border-dark-300 bg-white text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-white"
                      rows={3}
                      disabled={approving}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={approving}
                      className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      {approving ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      disabled={approving}
                      variant="destructive"
                      className="flex-1 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      {approving ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Request summary
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-dark-500" />
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                          {request.user.displayName || request.user.username}
                        </h3>
                      </div>
                      <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                        {request.user.email}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200'
                          : request.status === 'approved'
                            ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-200'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200'
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">
                        Category
                      </p>
                      <p className="text-sm text-dark-900 dark:text-white capitalize">
                        {request.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">
                        Submitted
                      </p>
                      <p className="text-sm text-dark-600 dark:text-dark-300">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <Button
                      onClick={() => setReviewingId(request.id)}
                      className="w-full mt-4 flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Review Request
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
