import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createBoostedPost } from '../../services/postService'; // Zynkra's native boost service
import BoostSummary from './BoostSummary';

interface BoostSettingsProps {
  postId: string;
}

const BoostSettings: React.FC<BoostSettingsProps> = ({ postId }) => {
  const [budget, setBudget] = useState(10);
  const [duration, setDuration] = useState(7);

  const mutation = useMutation({
    mutationFn: () => createBoostedPost('YOUR_ACCESS_TOKEN', postId, budget, duration),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (mutation.isSuccess) {
    return <BoostSummary />;
  }

  return (
    <div>
      <h2>Boost Settings</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Budget:
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <label>
            Duration (days):
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
        </div>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Boosting...' : 'Boost Post'}
        </button>
      </form>
      {mutation.isError && <div>Error boosting post</div>}
    </div>
  );
};

export default BoostSettings;