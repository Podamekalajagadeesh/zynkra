import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { ModerationQueue } from '../components/moderation/ModerationQueue';

interface PendingVerification {
  id: string;
  category: string;
  justification: string;
  links: string[];
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    displayName?: string | null;
    email: string | null;
    isPremium?: boolean;
  };
}

export function AdminPage() {
  const { addToast } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingVerifications = async () => {
    try {
      const response = await api.get('/verification/pending');
      setPendingVerifications(response.data);
    } catch (error) {
      addToast('Failed to load pending verification requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await api.post(`/verification/${requestId}/review`, { decision: 'approved' });
      addToast('User verified successfully!', 'success');
      fetchPendingVerifications();
    } catch (error) {
      addToast('Failed to verify user', 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    const reviewNote = window.prompt('Reason for rejection (shown to the applicant):') ?? undefined;
    try {
      await api.post(`/verification/${requestId}/review`, { decision: 'rejected', reviewNote });
      addToast('Verification request rejected', 'success');
      fetchPendingVerifications();
    } catch (error) {
      addToast('Failed to reject verification request', 'error');
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  if (loading) {
    return (
      <PageShell title="Admin Dashboard">
        <div>Loading...</div>
      </PageShell>
    );
  }

  const [activeTab, setActiveTab] = useState<'verifications' | 'moderation'>('verifications');

  return (
    <PageShell title="Admin Dashboard">
      <div className="space-y-6">
        <div className="flex gap-4 border-b pb-4">
          <Button 
            variant={activeTab === 'verifications' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('verifications')}
          >
            Verification Requests
          </Button>
          <Button 
            variant={activeTab === 'moderation' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('moderation')}
          >
            Content Moderation
          </Button>
        </div>

        {activeTab === 'verifications' && (
          <>
            <h2 className="text-xl font-bold">Pending Verification Requests</h2>
            {pendingVerifications.length === 0 ? (
              <p className="text-gray-500">No pending verification requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingVerifications.map((request) => (
            <div key={request.id} className={`p-4 border rounded-lg space-y-3 ${request.user.isPremium ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {request.user.displayName || request.user.username || request.user.email}
                    <span className="text-xs bg-dark-200 text-dark-700 px-2 py-0.5 rounded-full capitalize dark:bg-dark-700 dark:text-dark-200">
                      {request.category}
                    </span>
                    {request.user.isPremium && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Premium - Priority
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{request.user.email}</p>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(request.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{request.justification}</p>
                  {request.links.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {request.links.map((link) => (
                        <li key={link}>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-all">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                      <div className="flex gap-2">
                        <Button variant="default" onClick={() => handleApprove(request.id)}>
                          Approve
                        </Button>
                        <Button variant="destructive" onClick={() => handleReject(request.id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'moderation' && (
          <div>
            <ModerationQueue />
          </div>
        )}
      </div>
    </PageShell>
  );
}