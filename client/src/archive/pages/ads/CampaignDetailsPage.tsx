import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCampaign } from '../../lib/api';
import AdSetsList from '../../components/ads/AdSetsList';

const CampaignDetailsPage = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      const data = await getCampaign(campaignId);
      setCampaign(data);
    };
    fetchCampaign();
  }, [campaignId]);

  if (!campaign) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{campaign.name}</h1>
      <p>Objective: {campaign.objective}</p>
      <p>Status: {campaign.isActive ? 'Active' : 'Inactive'}</p>

      <div className="mt-8">
        <AdSetsList campaignId={campaignId} />
      </div>
    </div>
  );
};

export default CampaignDetailsPage;