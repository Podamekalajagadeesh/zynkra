import { useState, useEffect, useRef } from 'react';
import { getReelSuggestions } from '../../lib/api';
import { Post } from '../../lib/types';
import { ReelPlayer } from './ReelPlayer';

export function ReelsViewer() {
  const [reels, setReels] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      setIsLoading(true);
      try {
        const newReels = await getReelSuggestions();
        setReels(prev => [...prev, ...newReels]);
      } catch (error) {
        console.error("Failed to fetch reel suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReels();
  }, []);

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop === clientHeight) {
        // In a real app, you'd fetch more reels here.
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory bg-black"
    >
      {reels.map((reel) => (
        <div key={reel.id} className="snap-start h-screen w-screen flex items-center justify-center">
          <ReelPlayer reel={reel} />
        </div>
      ))}
      {isLoading && <div className="snap-start h-screen w-screen flex items-center justify-center text-white"><p>Loading reels...</p></div>}
    </div>
  );
}