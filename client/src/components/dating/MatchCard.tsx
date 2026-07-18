import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const MatchCard = ({ match }) => {
  const { activeAccount } = useAuth();
  // Assuming match.users contains 2 users, and one is the current user
  const otherUser = match.users.find((u) => u.id !== activeAccount?.user.id);

  return (
    <div>
      <h3>{otherUser.displayName}</h3>
      {/* Link to chat with the matched user */}
    </div>
  );
};

export default MatchCard;