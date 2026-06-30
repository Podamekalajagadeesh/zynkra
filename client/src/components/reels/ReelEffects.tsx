import { useEffect, useState } from 'react';
import { getReelEffects } from '../../lib/api';
import { ReelEffect } from '../../lib/types';

interface ReelEffectsProps {
  onSelectEffect: (effect: ReelEffect) => void;
}

export function ReelEffects({ onSelectEffect }: ReelEffectsProps) {
  const [effects, setEffects] = useState<ReelEffect[]>([]);

  useEffect(() => {
    const fetchEffects = async () => {
      try {
        const newEffects = await getReelEffects();
        setEffects(newEffects);
      } catch (error) {
        console.error("Failed to fetch reel effects:", error);
      }
    };
    fetchEffects();
  }, []);

  return (
    <div className="flex space-x-4 p-4 overflow-x-auto">
      {effects.map((effect) => (
        <div key={effect.id} className="flex-shrink-0 text-center" onClick={() => onSelectEffect(effect)}>
          <img src={effect.thumbnailUrl} alt={effect.name} className="w-20 h-20 rounded-lg object-cover" />
          <p className="text-white text-sm mt-1">{effect.name}</p>
        </div>
      ))}
    </div>
  );
}