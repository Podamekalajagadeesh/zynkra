
import { useEffect, useState } from 'react';

export default function AdsList({ adSetId }) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    if (adSetId) {
      fetch(`/api/ads/ads/${adSetId}`)
        .then(res => res.json())
        .then(setAds);
    }
  }, [adSetId]);

  if (!adSetId) return null;

  return (
    <div className="mt-4">
      <h4 className="text-md font-bold mb-2">Ads</h4>
      <ul className="space-y-2">
        {ads.map(ad => (
          <li key={ad.id} className="p-2 rounded border">
            <p className="font-bold">{ad.name} ({ad.status})</p>
            <p>{ad.creative.body}</p>
            {ad.creative.image_url && <img src={ad.creative.image_url} alt={ad.name} className="mt-2 rounded" />}
          </li>
        ))}
      </ul>
    </div>
  );
}