import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface ReviewPost {
  id?: string;
  content?: string;
  [key: string]: unknown;
}

interface ReviewItem {
  id: string;
  post?: ReviewPost;
}

function ReviewPostPreview({ post }: { post?: ReviewPost }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm text-gray-700">{post?.content || 'No content available'}</p>
    </div>
  );
}

const TimelineReviewPage = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('/timeline/review');
        setReviews(response.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, []);

  const handleApprove = async (reviewId: string) => {
    try {
      await api.post(`/timeline/review/${reviewId}/approve`);
      setReviews(reviews.filter((review: any) => review.id !== reviewId));
    } catch (error) {
      console.error('Error approving post:', error);
    }
  };

  const handleHide = async (reviewId: string) => {
    try {
      await api.post(`/timeline/review/${reviewId}/hide`);
      setReviews(reviews.filter((review: any) => review.id !== reviewId));
    } catch (error) {
      console.error('Error hiding post:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Timeline Review</h1>
      <p className="mb-4">Review posts you're tagged in before they appear on your timeline.</p>
      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review.id} className="bg-white rounded-lg shadow-md p-4">
            <ReviewPostPreview post={review.post} />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => handleApprove(review.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Add to Timeline
              </button>
              <button
                onClick={() => handleHide(review.id)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
              >
                Hide
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p>No posts to review.</p>}
      </div>
    </div>
  );
};

export default TimelineReviewPage;