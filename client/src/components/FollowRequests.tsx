import { useEffect, useState } from 'react';
import { getFollowRequests, acceptFollowRequest, denyFollowRequest } from '../lib/api';
import { User } from '../lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useToast } from '../hooks/useToast';

export function FollowRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const followRequests = await getFollowRequests();
        setRequests(followRequests);
      } catch (error) {
        console.error('Failed to fetch follow requests:', error);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFollowRequest(requestId);
      setRequests(requests.filter((req) => req.id !== requestId));
      addToast('Follow request accepted', 'success');
    } catch (error) {
      console.error('Failed to accept follow request:', error);
      addToast('Failed to accept follow request', 'error');
    }
  };

  const handleDeny = async (requestId: string) => {
    try {
      await denyFollowRequest(requestId);
      setRequests(requests.filter((req) => req.id !== requestId));
      addToast('Follow request denied', 'success');
    } catch (error) {
      console.error('Failed to deny follow request:', error);
      addToast('Failed to deny follow request', 'error');
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="surface-soft p-4">
      <h3 className="text-lg font-semibold">Follow Requests</h3>
      <div className="mt-2 space-y-2">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={req.requester.pfp ?? ''} />
                <AvatarFallback>{req.requester.email?.[0]}</AvatarFallback>
              </Avatar>
              <span>{req.requester.email}</span>
            </div>
            <div className="space-x-2">
              <Button size="sm" onClick={() => handleAccept(req.id)}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDeny(req.id)}>
                Deny
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}