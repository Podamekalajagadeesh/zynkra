import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getReelById } from '../lib/api';
import { Post } from '../lib/types';
import { ReelPlayer } from '../components/reels/ReelPlayer';

export function ReelPage() {
  const { id } = useParams<{ id: string }>();
  const [reel, setReel] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchReel = async () => {
      setIsLoading(true);
      try {
        const fetchedReel = await getReelById(id);
        setReel(fetchedReel);
      } catch (err) {
        setError('Failed to fetch reel.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReel();
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-black text-white"><p>{error}</p></div>;
  }

  if (!reel) {
    return <div className="flex items-center justify-center h-screen bg-black text-white"><p>Reel not found.</p></div>;
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <ReelPlayer reel={reel} />
    </div>
  );
}