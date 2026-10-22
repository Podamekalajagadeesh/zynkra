import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoryPollResults, voteStoryPoll } from '../lib/api';
import type { StoryPollResults } from '../lib/types';
import { useUser } from '../hooks/useUser';

interface PollProps {
  storyId: string;
  elementId: string;
  question: string;
  options: string[];
}

export function Poll({ storyId, elementId, question, options }: PollProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.id;
  const [results, setResults] = useState<StoryPollResults | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Tallies are fetched when the poll becomes active (the viewer mounts one
  // poll at a time). The endpoint is authed, so logged-out viewers see plain
  // options with no percentages instead of a 401 storm.
  useEffect(() => {
    if (!userId) {
      setResults(null);
      return;
    }
    let cancelled = false;
    getStoryPollResults(storyId, elementId)
      .then((fresh) => {
        if (!cancelled) setResults(fresh);
      })
      .catch((error) => {
        console.error('Failed to fetch poll results:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [storyId, elementId, userId]);

  const handleVote = async (optionIndex: number) => {
    if (!userId) {
      navigate('/login');
      return;
    }
    if (isVoting) return;
    setIsVoting(true);
    try {
      const fresh = await voteStoryPoll(storyId, elementId, optionIndex);
      setResults(fresh);
    } catch (error) {
      console.error('Failed to cast poll vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const total = results?.totalVotes ?? 0;

  return (
    <div className="absolute bottom-10 left-1/2 w-4/5 -translate-x-1/2 rounded-lg bg-black/50 p-4 text-white">
      <p className="mb-4 text-center font-bold">{question}</p>
      <div className="space-y-2">
        {options.map((option, index) => {
          const count = results?.optionCounts[index] ?? 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : null;
          const isSelected = results?.myVote === index;
          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={isVoting}
              aria-pressed={isSelected}
              className={`relative w-full overflow-hidden rounded-md p-2 text-center font-semibold backdrop-blur-sm transition-colors disabled:cursor-wait ${
                isSelected ? 'bg-primary-600/70 ring-2 ring-white' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {percent !== null && (
                <span
                  className="absolute inset-y-0 left-0 bg-white/25"
                  style={{ width: `${percent}%` }}
                  aria-hidden="true"
                />
              )}
              <span className="relative flex items-center justify-between gap-2 px-1">
                <span>{option}</span>
                {percent !== null && <span className="text-xs">{percent}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-white/70">
        {total > 0 ? `${total} vote${total === 1 ? '' : 's'}` : 'No votes yet — be the first'}
      </p>
    </div>
  );
}
