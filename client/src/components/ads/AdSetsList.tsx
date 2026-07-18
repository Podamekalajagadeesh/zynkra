
import { useEffect, useState } from 'react';
import AdsList from './AdsList';

export default function AdSetsList({ campaignId }) {
  const [adSets, setAdSets] = useState([]);
  const [selectedAdSet, setSelectedAdSet] = useState(null);

  useEffect(() => {
    if (campaignId) {
      fetch(`/api/ads/adsets/${campaignId}`)
        .then(res => res.json())
        .then(setAdSets);
    }
  }, [campaignId]);

  if (!campaignId) return null;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold mb-2">Ad Sets</h3>
      <ul className="space-y-2">
        {adSets.map(adSet => (
          <li key={adSet.id} onClick={() => setSelectedAdSet(adSet)} className="cursor-pointer p-2 rounded hover:bg-gray-100">
            {adSet.name} ({adSet.status})
          </li>
        ))}
      </ul>
      {selectedAdSet && <AdsList adSetId={selectedAdSet.id} />}
    </div>
  );
}