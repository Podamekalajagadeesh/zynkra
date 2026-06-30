import { useState, useEffect } from 'react';
import { getFollowRequests, acceptFollowRequest, rejectFollowRequest } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';

interface FollowRequest {
  id: string;
  fromUser: {
    id: string;
    displayName: string;
    email: string;
  };
}

export function FollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const followRequests = await getFollowRequests();
        setRequests(followRequests);
      } catch (error) {
        console.error('Failed to fetch follow requests:', error);
        addToast('Failed to fetch follow requests', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [addToast]);

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFollowRequest(requestId);
      setRequests(requests.filter(req => req.id !== requestId));
      addToast('Follow request accepted', 'success');
    } catch (error) {
      console.error('Failed to accept follow request:', error);
      addToast('Failed to accept follow request', 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFollowRequest(requestId);
      setRequests(requests.filter(req => req.id !== requestId));
      addToast('Follow request rejected', 'success');
    } catch (error) {
      console.error('Failed to reject follow request:', error);
      addToast('Failed to reject follow request', 'error');
    }
  };

  return (
    <PageShell
      eyebrow="Account"
      title="Follow Requests"
      description="Manage incoming requests to follow your private account."
    >
      {isLoading ? (
        <p>Loading...</p>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <p className="font-semibold">{request.fromUser.displayName || request.fromUser.email}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAccept(request.id)}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>You have no pending follow requests.</p>
      )}
    </PageShell>
  );
}