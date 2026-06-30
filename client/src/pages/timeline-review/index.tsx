import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

const TimelineReviewPage = () => {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['timeline-reviews'],
    queryFn: () => api.get('/timeline-review').then((res) => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: (reviewId: string) => api.post(`/timeline-review/${reviewId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-reviews'] });
    },
  });

  const hideMutation = useMutation({
    mutationFn: (reviewId: string) => api.post(`/timeline-review/${reviewId}/hide`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-reviews'] });
    },
  });

  if (isLoading) {
    return <PageShell>Loading...</PageShell>;
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-bold">Timeline Review</h1>
      <p className="text-dark-500">Review posts you're tagged in before they appear on your timeline.</p>

      <div className="mt-6 space-y-4">
        {reviews.length === 0 && <p>No items to review.</p>}
        {reviews.map((review) => (
          <Card key={review.id} className="p-4 flex justify-between items-center">
            <div>
              <p>
                <strong>{review.post.user.displayName}</strong> tagged you in a post.
              </p>
              <p className="text-sm text-dark-500">{review.post.content}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => approveMutation.mutate(review.id)}>Approve</Button>
              <Button variant="ghost" onClick={() => hideMutation.mutate(review.id)}>
                Hide
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
};

export default TimelineReviewPage;