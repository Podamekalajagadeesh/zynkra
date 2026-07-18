import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

interface ProfileReviewItem {
  id: string;
  taggingUser: {
    displayName: string;
  };
  post: {
    content: string;
  };
}

export function ProfileReviewPage() {
  const [pendingReviews, setPendingReviews] = useState<ProfileReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        const response = await api.get<ProfileReviewItem[]>('/profile-review/pending');
        setPendingReviews(response.data);
      } catch (error) {
        console.error('Failed to fetch pending reviews', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingReviews();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/profile-review/${id}/approve`);
      setPendingReviews(pendingReviews.filter((review) => review.id !== id));
    } catch (error) {
      console.error('Failed to approve tag', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/profile-review/${id}/reject`);
      setPendingReviews(pendingReviews.filter((review) => review.id !== id));
    } catch (error) {
      console.error('Failed to reject tag', error);
    }
  };

  return (
    <PageShell
      title="Profile Review"
      description="Review posts you're tagged in before they appear on your profile."
    >
      {loading ? (
        <p>Loading...</p>
      ) : pendingReviews.length === 0 ? (
        <p>No pending reviews.</p>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <div key={review.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p>
                  <span className="font-semibold">{review.taggingUser.displayName}</span> tagged you in a post.
                </p>
                <p className="text-sm text-gray-500">{review.post.content}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleApprove(review.id)}>Approve</Button>
                <Button variant="destructive" onClick={() => handleReject(review.id)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}