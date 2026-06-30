import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const TimelineReview = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const response = await api.get('/timeline-review');
      setReviews(response.data);
    };
    fetchReviews();
  }, []);

  const handleApprove = async (id) => {
    await api.post(`/timeline-review/${id}/approve`);
    setReviews(reviews.filter((review) => review.id !== id));
  };

  const handleHide = async (id) => {
    await api.post(`/timeline-review/${id}/hide`);
    setReviews(reviews.filter((review) => review.id !== id));
  };

  return (
    <div>
      <h2>Timeline Review</h2>
      {reviews.map((review) => (
        <div key={review.id}>
          <p>
            {review.post.user.displayName} tagged you in a post.
          </p>
          <p>{review.post.content}</p>
          <button onClick={() => handleApprove(review.id)}>Approve</button>
          <button onClick={() => handleHide(review.id)}>Hide</button>
        </div>
      ))}
    </div>
  );
};

export default TimelineReview;