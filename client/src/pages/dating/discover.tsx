import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import DatingProfileCard from '../../components/dating/DatingProfileCard';

interface Candidate {
  id: string;
  datingProfile: {
    bio: string;
    interests: string[];
    age: number | null;
    location: string | null;
    user: { id: string; displayName?: string | null; username?: string | null };
  };
}

const DatingDiscoveryPage = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [matchedWith, setMatchedWith] = useState<string | null>(null);
  const { get, post } = useApi();

  const fetchCandidates = useCallback(async () => {
    try {
      const data = await get('/dating/candidates');
      setCandidates(data);
    } catch (error: any) {
      // 400 = no dating profile yet; point the user at onboarding.
      if (error?.response?.status === 400) setNeedsProfile(true);
      else console.error('Failed to fetch candidates:', error);
    }
  }, [get]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSwipe = async (swipedUserId: string, type: 'like' | 'dislike') => {
    try {
      const result = await post('/dating/swipe', { swipedUserId, type });
      if (result?.matched) {
        const candidate = candidates.find((c) => c.id === swipedUserId);
        setMatchedWith(
          candidate?.datingProfile.user.displayName ||
            candidate?.datingProfile.user.username ||
            'someone',
        );
      }
      setCandidates((prev) => prev.filter((c) => c.id !== swipedUserId));
    } catch (error) {
      console.error('Failed to swipe:', error);
    }
  };

  if (needsProfile) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Discover People</h1>
        <p className="text-dark-500 mb-4">Create your dating profile to start discovering people.</p>
        <Link to="/dating/onboarding" className="text-primary-600 font-semibold hover:underline">
          Create dating profile →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Discover People</h1>
        <Link to="/dating/matches" className="text-sm text-primary-600 hover:underline">
          Matches
        </Link>
      </div>

      {matchedWith && (
        <div className="mb-4 rounded-xl border border-pink-300 bg-pink-50 p-4 text-center dark:border-pink-800 dark:bg-pink-950/30">
          <p className="font-semibold text-pink-700 dark:text-pink-300">
            It's a match with {matchedWith}! 🎉
          </p>
          <Link to="/dating/matches" className="text-sm text-pink-600 hover:underline">
            See your matches
          </Link>
        </div>
      )}

      {candidates.length === 0 ? (
        <p className="text-center text-dark-500 py-12">
          No more people to discover right now. Check back later!
        </p>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <DatingProfileCard
              key={candidate.id}
              profile={candidate.datingProfile}
              onSwipe={handleSwipe}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DatingDiscoveryPage;
