import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import MatchCard from '../../components/dating/MatchCard';

const DatingMatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const { get } = useApi();

  useEffect(() => {
    const fetchMatches = async () => {
      const data = await get('/dating/matches');
      setMatches(data);
    };
    fetchMatches();
  }, [get]);

  return (
    <div>
      <h1>Your Matches</h1>
      <div>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default DatingMatchesPage;