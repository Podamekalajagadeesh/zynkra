
import { useEffect, useState } from 'react';
import AdSetsList from './AdSetsList';

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    fetch('/api/ads/campaigns')
      .then(res => res.json())
      .then(setCampaigns);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Campaigns</h2>
      <ul className="space-y-2">
        {campaigns.map(campaign => (
          <li key={campaign.id} onClick={() => setSelectedCampaign(campaign)} className="cursor-pointer p-2 rounded hover:bg-gray-100">
            {campaign.name} ({campaign.status})
          </li>
        ))}
      </ul>
      {selectedCampaign && <AdSetsList campaignId={selectedCampaign.id} />}
    </div>
  );
}