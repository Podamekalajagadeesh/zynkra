import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAdSet } from '../../lib/api';
import AdsList from '../../components/ads/AdsList';

const AdSetDetailsPage = () => {
  const { adSetId } = useParams();
  const [adSet, setAdSet] = useState(null);

  useEffect(() => {
    const fetchAdSet = async () => {
      const data = await getAdSet(adSetId);
      setAdSet(data);
    };
    fetchAdSet();
  }, [adSetId]);

  if (!adSet) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{adSet.name}</h1>
      <p>Daily Budget: {adSet.dailyBudget}</p>
      <p>Status: {adSet.isActive ? 'Active' : 'Inactive'}</p>

      <div className="mt-8">
        <AdsList adSetId={adSetId} />
      </div>
    </div>
  );
};

export default AdSetDetailsPage;