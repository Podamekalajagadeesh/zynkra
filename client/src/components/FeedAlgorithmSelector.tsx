// @ts-nocheck
import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { get, post } from '../lib/api';
import { Clock, TrendingUp, Sparkles, Users, Compass, Image, Check } from 'lucide-react';

interface Algorithm {
  name: string;
  label: string;
  description: string;
}

const ALGORITHM_ICONS: Record<string, any> = {
  chronological: Clock,
  engagement: TrendingUp,
  relevance: Sparkles,
  friends: Users,
  discovery: Compass,
  media: Image,
};

const FeedAlgorithmSelector: React.FC<{ onAlgorithmChange?: (algorithm: string) => void }> = ({ onAlgorithmChange }) => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selected, setSelected] = useState('relevance');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => { loadAlgorithms(); }, []);

  const loadAlgorithms = async () => {
    try {
      const [algos, current] = await Promise.all([
        get<Algorithm[]>('/feed/algorithms'),
        get<{ algorithm: string }>('/feed/algorithm').catch(() => ({ algorithm: 'relevance' })),
      ]);
      setAlgorithms(algos);
      setSelected(current.algorithm);
    } catch (error) {
      addToast('Failed to load feed options', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (algorithm: string) => {
    try {
      await post('/feed/algorithm', { algorithm });
      setSelected(algorithm);
      onAlgorithmChange?.(algorithm);
      addToast(`Feed set to "${algorithms.find(a => a.name === algorithm)?.label}"`, 'success');
    } catch (error) {
      addToast('Failed to update feed', 'error');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dark-700 dark:text-dark-300">Feed Algorithm</h3>
      <p className="text-xs text-dark-500 dark:text-dark-400">
        Choose how your feed is sorted. You're in control.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {algorithms.map((algo) => {
          const Icon = ALGORITHM_ICONS[algo.name] || Sparkles;
          const isSelected = selected === algo.name;
          return (
            <button
              key={algo.name}
              onClick={() => handleSelect(algo.name)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 ring-2 ring-primary-500/30'
                  : 'border-dark-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={isSelected ? 'text-primary-600' : 'text-dark-400'} />
                <span className={`text-sm font-medium ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-dark-700 dark:text-dark-300'}`}>
                  {algo.label}
                </span>
                {isSelected && <Check size={14} className="text-primary-600 ml-auto" />}
              </div>
              <p className="text-xs text-dark-500 mt-1">{algo.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeedAlgorithmSelector;
