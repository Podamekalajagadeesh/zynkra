import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '../../services/postService'; // Zynkra's native post service
import PostSelector from './PostSelector';
import BoostSettings from './BoostSettings';

const BoostPostModal = ({ closeModal }: { closeModal: () => void }) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => getPosts('YOUR_ACCESS_TOKEN'), // Replace with actual access token
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching posts</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Boost Post</h1>
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {!selectedPostId ? (
          <PostSelector posts={data.data} onSelectPost={setSelectedPostId} />
        ) : (
          <BoostSettings postId={selectedPostId} />
        )}
      </div>
    </div>
  );
};

export default BoostPostModal;