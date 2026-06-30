import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import DatingProfileCard from '../../components/dating/DatingProfileCard';

const DatingDiscoveryPage = () => {
  const [candidates, setCandidates] = useState([]);
  const { get, post } = useApi();

  useEffect(() => {
    const fetchCandidates = async () => {
      const data = await get('/dating/candidates');
      setCandidates(data);
    };
    fetchCandidates();
  }, [get]);

  const handleSwipe = async (swipedUserId, type) => {
    await post('/dating/swipe', { swipedUserId, type });
    // Remove swiped user from candidates
    setCandidates(candidates.filter((c) => c.id !== swipedUserId));
  };

  return (
    <div>
      <h1>Discover People</h1>
      <div>
        {candidates.map((candidate) => (
          <DatingProfileCard
            key={candidate.id}
            profile={candidate.datingProfile}
            onSwipe={handleSwipe}
          />
        ))}
      </div>
    </div>
  );
};

export default DatingDiscoveryPage;