import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';

const DatingCrushPage = () => {
  const [crushUserId, setCrushUserId] = useState('');
  const { post } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await post('/dating/crush', { crushedUserId: crushUserId });
    // Show some feedback
  };

  return (
    <div>
      <h1>Secret Crush</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={crushUserId}
          onChange={(e) => setCrushUserId(e.target.value)}
          placeholder="Enter user ID of your crush"
        />
        <button type="submit">Add Crush</button>
      </form>
    </div>
  );
};

export default DatingCrushPage;